import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { AccountService } from "../services/account.service";

export const masterRouter = Router();

// ==================== TEACHERS / GURU ====================
masterRouter.get("/teachers", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          include: {
            qrCodes: { where: { isActive: true }, take: 1 },
          },
        },
        teacherSubjects: {
          include: { subject: true },
        },
        teacherAssignments: {
          include: { assignmentType: true, class: true },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const transformed = teachers.map((t) => {
      const activeQr = t.user?.qrCodes?.[0];
      return {
        id: t.userId, // Matches User ID for app context compatibility
        teacherId: t.id,
        userId: t.userId,
        name: t.fullName,
        username: t.user.username,
        email: t.email || t.user.email,
        nip: t.nip,
        nipOrNis: t.nip || undefined,
        nuptk: t.nuptk || undefined,
        nik: t.nik || undefined,
        phone: t.phone || undefined,
        gender: t.gender,
        address: t.address || undefined,
        role: "guru" as const,
        subjectIds: t.teacherSubjects.map((ts) => ts.subjectId),
        subjectNames: t.teacherSubjects.map((ts) => ts.subject.name),
        employmentStatus: t.employmentStatus,
        qrToken: activeQr?.qrToken || "SMTS-UNASSIGNED",
        qrIsActive: activeQr?.isActive ?? true,
        isActive: t.user.isActive,
        createdAt: t.createdAt.toISOString(),
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

masterRouter.post("/teachers", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, nip, nuptk, nik, gender, phone, email, username, address, subjectIds, employmentStatus } = req.body;
    if (!name || !nip) {
      res.status(400).json({ success: false, message: "Nama dan NIP Guru wajib diisi." });
      return;
    }

    const result = await AccountService.createTeacherAccount({
      name,
      nip,
      nuptk,
      nik,
      gender,
      phone,
      email,
      username,
      address,
      subjectIds,
      employmentStatus,
      ipOrDevice: req.ip || "127.0.0.1",
    });

    res.status(201).json({
      success: true,
      message: `Guru ${name} berhasil disimpan ke PostgreSQL dengan NIP ${nip}, password default 'smtslogin', dan QR ${result.qrCode.qrToken}`,
      teacher: result.teacher,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: "guru",
      },
      qrCode: result.qrCode,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error?.message || "Gagal membuat data Guru di database." });
  }
});

// ==================== CLASSES ====================
masterRouter.get("/classes", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const classes = await prisma.class.findMany({
      include: {
        academicYear: true,
        teacherAssignments: {
          where: { assignmentType: { code: "HOMEROOM_TEACHER" }, isActive: true },
          include: { teacher: true },
        },
        _count: {
          select: { studentMemberships: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    const transformed = classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      academicYear: c.academicYear.name,
      capacity: c.capacity,
      studentCount: c._count.studentMemberships,
      homeroomTeacherId: c.teacherAssignments[0]?.teacherId || "",
      homeroomTeacher: c.teacherAssignments[0]?.teacher?.fullName || "Belum Ditentukan",
      room: `Ruang ${c.name}`,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ==================== SUBJECTS ====================
masterRouter.get("/subjects", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const subjects = await prisma.subject.findMany({
      include: {
        teacherSubjects: { include: { teacher: true } },
      },
      orderBy: { code: "asc" },
    });

    const transformed = subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category as any,
      gradeLevels: [7, 8, 9],
      kkm: s.kkm,
      teacherId: s.teacherSubjects[0]?.teacherId || "",
      teacherName: s.teacherSubjects[0]?.teacher?.fullName || "",
      description: s.description || undefined,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ==================== SCHEDULES ====================
masterRouter.get("/schedules", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const schedules = await prisma.schedule.findMany({
      include: {
        class: true,
        subject: true,
        teacher: true,
        academicYear: true,
      },
    });

    const transformed = schedules.map((s) => ({
      id: s.id,
      day: s.dayOfWeek as any,
      startTime: s.startTime,
      endTime: s.endTime,
      classId: s.classId,
      className: s.class.name,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      teacherId: s.teacherId,
      teacherName: s.teacher.fullName,
      room: s.room,
      academicYear: s.academicYear.name,
      semester: "Ganjil" as const,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ==================== EXTRACURRICULARS ====================
masterRouter.get("/extracurriculars", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const ekskuls = await prisma.extracurricular.findMany({
      include: {
        leadTeacher: true,
        members: { include: { student: true } },
      },
    });

    const transformed = ekskuls.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category as any,
      leadTeacherId: e.leadTeacherId || "",
      leadTeacherName: e.leadTeacher?.fullName || "",
      scheduleDay: e.scheduleDay as any,
      scheduleTime: e.scheduleTime,
      location: e.location,
      memberStudentIds: e.members.map((m) => m.studentId),
      memberCount: e.members.length,
      description: e.description || "",
      academicYear: "2025/2026",
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
