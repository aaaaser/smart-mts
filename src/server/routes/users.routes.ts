import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { Role, Gender, EmploymentStatus, StudentStatus } from "@prisma/client";

export const usersRouter = Router();

function generateSecureQRToken(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${token}`;
}

// GET all users
usersRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database PostgreSQL offline" });
      return;
    }

    const users = await prisma.user.findMany({
      include: {
        teacher: {
          include: {
            teacherSubjects: { include: { subject: true } },
            teacherAssignments: { include: { assignmentType: true, class: true } },
          },
        },
        student: {
          include: {
            classMemberships: {
              where: { status: "ACTIVE" },
              include: { class: true },
            },
          },
        },
        parent: {
          include: {
            parentStudents: { include: { student: true } },
          },
        },
        qrCode: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = users.map((u) => {
      const isTeacher = u.role === "TEACHER" && u.teacher;
      const isStudent = u.role === "STUDENT" && u.student;
      const isParent = u.role === "PARENT" && u.parent;

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role.toLowerCase(),
        name: u.teacher?.fullName || u.student?.fullName || u.parent?.fullName || u.username,
        avatar: u.teacher?.photo || u.student?.photo || undefined,
        nip: u.teacher?.nip || undefined,
        nuptk: u.teacher?.nuptk || undefined,
        nis: u.student?.nis || undefined,
        nisn: u.student?.nisn || undefined,
        phone: u.teacher?.phone || u.parent?.phone || undefined,
        gender: u.teacher?.gender || u.student?.gender || undefined,
        birthPlace: u.teacher?.birthPlace || u.student?.birthPlace || undefined,
        birthDate: u.teacher?.birthDate?.toISOString().split("T")[0] || u.student?.birthDate?.toISOString().split("T")[0] || undefined,
        address: u.teacher?.address || u.student?.address || undefined,
        classId: isStudent ? u.student?.classMemberships[0]?.classId : undefined,
        className: isStudent ? u.student?.classMemberships[0]?.class?.name : undefined,
        enrollmentYear: isStudent ? String(u.student?.entryYear) : undefined,
        subjectIds: isTeacher ? u.teacher?.teacherSubjects.map((ts) => ts.subjectId) : undefined,
        teacherId: u.teacher?.id,
        studentId: u.student?.id,
        qrToken: u.qrCode?.qrToken || "SMTS-UNASSIGNED",
        qrIsActive: u.qrCode?.isActive ?? true,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST Create User + (Teacher / Student) + UserQrCode in a SINGLE TRANSACTION
usersRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      role, // "guru" | "siswa" | "admin" | "orangtua"
      name,
      nip,
      nuptk,
      nik,
      nis,
      nisn,
      gender = "L",
      phone,
      address,
      classId,
      academicYearId,
      subjectIds,
    } = req.body;

    if (!username || !email || !name || !role) {
      res.status(400).json({ success: false, message: "Username, email, nama, dan role wajib diisi." });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    // Check unique username & email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
      },
    });

    if (existing) {
      res.status(409).json({ success: false, message: "Username atau email sudah digunakan." });
      return;
    }

    const defaultPass = password || (role === "guru" ? "guru123" : role === "siswa" ? "siswa123" : "admin123");
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    const prismaRole: Role =
      role === "guru" || role === "TEACHER"
        ? Role.TEACHER
        : role === "siswa" || role === "STUDENT"
        ? Role.STUDENT
        : role === "orangtua" || role === "PARENT"
        ? Role.PARENT
        : Role.ADMIN;

    const qrPrefix = prismaRole === Role.TEACHER ? "SMTS-TCH" : prismaRole === Role.STUDENT ? "SMTS-STU" : "SMTS-ADM";
    const secureQrToken = generateSecureQRToken(qrPrefix);

    // Run database transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          passwordHash,
          role: prismaRole,
          isActive: true,
        },
      });

      // 2. Create UserQrCode
      await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken: secureQrToken,
          isActive: true,
        },
      });

      // 3. Create Teacher or Student Profile
      if (prismaRole === Role.TEACHER) {
        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
            fullName: name,
            nip: nip || null,
            nuptk: nuptk || null,
            nik: nik || null,
            gender: gender === "P" ? Gender.P : Gender.L,
            phone: phone || null,
            address: address || null,
            employmentStatus: EmploymentStatus.GTY,
          },
        });

        // Link subjects if provided
        if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
          const activeAY = await tx.academicYear.findFirst({ where: { isActive: true } });
          for (const subId of subjectIds) {
            await tx.teacherSubject.create({
              data: {
                teacherId: teacher.id,
                subjectId: subId,
                academicYearId: activeAY?.id || "default",
              },
            });
          }
        }
      } else if (prismaRole === Role.STUDENT) {
        const student = await tx.student.create({
          data: {
            userId: user.id,
            fullName: name,
            nis: nis || `NIS-${Date.now().toString().slice(-6)}`,
            nisn: nisn || null,
            gender: gender === "P" ? Gender.P : Gender.L,
            address: address || null,
            status: StudentStatus.ACTIVE,
          },
        });

        // Link Class if provided
        if (classId) {
          const activeAY = await tx.academicYear.findFirst({ where: { isActive: true } });
          if (activeAY) {
            await tx.studentClassMembership.create({
              data: {
                studentId: student.id,
                classId: classId,
                academicYearId: activeAY.id,
                status: "ACTIVE",
              },
            });
          }
        }
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: name,
          userRole: prismaRole,
          action: prismaRole === Role.TEACHER ? "CREATE_TEACHER" : "CREATE_STUDENT",
          details: `Berhasil menambahkan akun ${name} (${username}) dengan QR Token otomatis ${secureQrToken}`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: `User ${name} berhasil dibuat dengan QR Token: ${secureQrToken}`,
      data: { id: newUser.id, username: newUser.username, qrToken: secureQrToken },
    });
  } catch (error: any) {
    console.error("Create user transaction error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal membuat user" });
  }
});

// Regenerate QR Token
usersRouter.post("/:id/regenerate-qr", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { qrCode: true, teacher: true, student: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
      return;
    }

    const prefix = user.role === "TEACHER" ? "SMTS-TCH" : user.role === "STUDENT" ? "SMTS-STU" : "SMTS-ADM";
    const newQrToken = generateSecureQRToken(prefix);

    await prisma.$transaction(async (tx) => {
      if (user.qrCode) {
        await tx.userQrCode.update({
          where: { id: user.qrCode.id },
          data: { qrToken: newQrToken, isActive: true },
        });
      } else {
        await tx.userQrCode.create({
          data: { userId: user.id, qrToken: newQrToken, isActive: true },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.teacher?.fullName || user.student?.fullName || user.username,
          userRole: user.role,
          action: "REGENERATE_QR",
          details: `Regenerasi QR Code berhasil. Token baru: ${newQrToken}`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    });

    res.json({ success: true, qrToken: newQrToken, message: "QR Token berhasil diperbarui." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Soft Delete / Deactivate User (Never delete historical records cascade)
usersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { teacher: true, student: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.teacher?.fullName || user.student?.fullName || user.username,
        userRole: user.role,
        action: "DEACTIVATE_USER",
        details: `User ${user.username} dinonaktifkan (data historis absensi dan nilai tetap aman)`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    res.json({ success: true, message: "User berhasil dinonaktifkan tanpa menghapus riwayat nilai atau absensi." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
