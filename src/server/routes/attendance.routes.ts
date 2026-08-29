import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { AttendanceStatus, AttendanceMethod, AttendanceSessionType } from "@prisma/client";

export const attendanceRouter = Router();

// GET all attendance sessions
attendanceRouter.get("/sessions", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const sessions = await prisma.attendanceSession.findMany({
      include: {
        class: true,
        subject: true,
        teacher: true,
        _count: { select: { records: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      classId: s.classId || undefined,
      className: s.class?.name || undefined,
      subjectId: s.subjectId || undefined,
      subjectName: s.subject?.name || undefined,
      teacherId: s.teacherId || undefined,
      teacherName: s.teacher?.fullName || undefined,
      date: s.date.toISOString().split("T")[0],
      startTime: s.startTime,
      endTime: s.endTime,
      lateAfter: s.lateAfter || undefined,
      token: s.token || s.id.slice(0, 8).toUpperCase(),
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.createdAt.toISOString(),
      isActive: s.status === "aktif",
      recordCount: s._count.records,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET all attendance records
attendanceRouter.get("/records", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const { userId, date, sessionId } = req.query;

    const whereClause: any = {};
    if (userId && typeof userId === "string") whereClause.userId = userId;
    if (sessionId && typeof sessionId === "string") whereClause.sessionId = sessionId;

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            teacher: true,
            student: {
              include: {
                classMemberships: {
                  where: { status: "ACTIVE" },
                  include: { class: true },
                },
              },
            },
          },
        },
        session: {
          include: { class: true, subject: true },
        },
      },
      orderBy: { scannedAt: "desc" },
    });

    const transformed = records.map((r) => {
      const isTeacher = r.user.role === "TEACHER";
      const isStudent = r.user.role === "STUDENT";
      const roleStr = isTeacher ? "guru" : isStudent ? "siswa" : "admin";

      let statusStr = "hadir";
      if (r.status === "LATE") statusStr = "terlambat";
      if (r.status === "SICK") statusStr = "sakit";
      if (r.status === "EXCUSED") statusStr = "izin";
      if (r.status === "ABSENT") statusStr = "alpa";

      return {
        id: r.id,
        sessionId: r.sessionId || undefined,
        sessionTitle: r.session?.title || "Absensi Terpadu",
        userId: r.userId,
        userName: r.user.teacher?.fullName || r.user.student?.fullName || r.user.username,
        userType: roleStr,
        classId: isStudent ? r.user.student?.classMemberships[0]?.classId : undefined,
        className: isStudent ? r.user.student?.classMemberships[0]?.class?.name : undefined,
        date: r.scannedAt.toISOString().split("T")[0],
        time: r.scannedAt.toTimeString().slice(0, 5),
        status: statusStr,
        note: r.notes || undefined,
        deviceInfo: r.deviceInfo || "Scanner QR",
        method: r.method === "QR_SCAN" ? "qr_scan" : "manual",
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST UNIFIED QR SCANNER ENDPOINT (SATU SCANNER UNTUK GURU & SISWA)
attendanceRouter.post("/scan", async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken, sessionId, scannedBy, deviceInfo, classId } = req.body;

    if (!qrToken || typeof qrToken !== "string") {
      res.status(400).json({
        success: false,
        isDuplicate: false,
        errorType: "INVALID_TOKEN",
        message: "QR Token tidak valid atau kosong.",
      });
      return;
    }

    const cleanToken = qrToken.trim();

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    // Step 1 & 2: Cari UserQrCode dan Validasi Token
    const userQr = await prisma.userQrCode.findUnique({
      where: { qrToken: cleanToken },
      include: {
        user: {
          include: {
            teacher: true,
            student: {
              include: {
                classMemberships: {
                  where: { status: "ACTIVE" },
                  include: { class: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userQr || !userQr.isActive || !userQr.user || !userQr.user.isActive) {
      res.status(404).json({
        success: false,
        isDuplicate: false,
        errorType: "INVALID_TOKEN",
        message: `QR Code '${cleanToken}' tidak dikenali dalam sistem smart MTs atau sudah dinonaktifkan.`,
      });
      return;
    }

    const user = userQr.user;
    const isTeacher = user.role === "TEACHER";
    const isStudent = user.role === "STUDENT";
    const userRoleStr = isTeacher ? "guru" : isStudent ? "siswa" : "admin";
    const userName = user.teacher?.fullName || user.student?.fullName || user.username;
    const studentClass = isStudent ? user.student?.classMemberships[0]?.class : null;

    // Optional: If scanning for a specific classroom session, verify class
    if (classId && isStudent && studentClass && studentClass.id !== classId) {
      res.status(400).json({
        success: false,
        isWrongClass: true,
        errorType: "WRONG_CLASS",
        message: `Siswa ${userName} terdaftar di kelas ${studentClass.name}, bukan kelas yang sedang diabsen.`,
      });
      return;
    }

    // Step 3 & 4: Temukan atau buat AttendanceSession harian aktif
    let targetSessionId = sessionId;

    if (!targetSessionId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let activeSession = await prisma.attendanceSession.findFirst({
        where: {
          sessionType: AttendanceSessionType.DAILY,
          status: "aktif",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!activeSession) {
        // Create today's default daily session
        activeSession = await prisma.attendanceSession.create({
          data: {
            title: `Absensi Terpadu Madrasah (${new Date().toLocaleDateString("id-ID")})`,
            sessionType: AttendanceSessionType.DAILY,
            date: today,
            startTime: "06:30",
            endTime: "15:00",
            lateAfter: "07:15",
            status: "aktif",
          },
        });
      }
      targetSessionId = activeSession.id;
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: targetSessionId },
    });

    // Step 5: Constraint @@unique([sessionId, userId]) -> Check duplicate scan
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId: targetSessionId,
          userId: user.id,
        },
      },
    });

    if (existingRecord) {
      const scanTime = existingRecord.scannedAt.toTimeString().slice(0, 5);
      res.status(409).json({
        success: false,
        isDuplicate: true,
        errorType: "DUPLICATE",
        message: `Peringatan: ${userName} (${user.role}) sudah melakukan absensi hari ini pada pukul ${scanTime} WIB.`,
      });
      return;
    }

    // Step 6: Tentukan status kehadiran (Hadir / Terlambat berdasarkan batas jam)
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;

    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let note = "Hadir tepat waktu";

    if (session?.lateAfter) {
      const [lateH, lateM] = session.lateAfter.split(":").map(Number);
      if (currentHours > lateH || (currentHours === lateH && currentMinutes > lateM)) {
        status = AttendanceStatus.LATE;
        note = `Terlambat hadir (scan pukul ${currentTimeStr}, batas ${session.lateAfter})`;
      }
    }

    // Save Attendance Record in Database
    const newRecord = await prisma.attendanceRecord.create({
      data: {
        sessionId: targetSessionId,
        userId: user.id,
        scannedBy: scannedBy || null,
        scannedAt: now,
        status,
        method: AttendanceMethod.QR_SCAN,
        deviceInfo: deviceInfo || "Scanner Terpadu smart MTs",
        notes: note,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName,
        userRole: user.role,
        action: "SCAN_ATTENDANCE",
        details: `Scan absensi terpadu berhasil: ${userName} [${user.role}] - Status: ${status} (${currentTimeStr} WIB)`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    // Return structured response
    res.json({
      success: true,
      message: `Absensi Berhasil: ${userName} (${user.role === "TEACHER" ? "Guru" : "Siswa" + (studentClass ? " " + studentClass.name : "")}) tercatat ${status === "LATE" ? "TERLAMBAT" : "HADIR"}.`,
      user: {
        id: user.id,
        name: userName,
        role: userRoleStr,
        nip: user.teacher?.nip,
        nis: user.student?.nis,
        className: studentClass?.name,
        qrToken: userQr.qrToken,
      },
      record: {
        id: newRecord.id,
        sessionId: newRecord.sessionId,
        userId: newRecord.userId,
        time: currentTimeStr,
        date: now.toISOString().split("T")[0],
        status: status === "LATE" ? "terlambat" : "hadir",
        note,
      },
    });
  } catch (error: any) {
    console.error("Attendance scan error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal mencatat absensi" });
  }
});
