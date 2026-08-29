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
        qrCodes: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = users.map((u) => {
      const isTeacher = u.role === "TEACHER" && u.teacher;
      const isStudent = u.role === "STUDENT" && u.student;
      const isParent = u.role === "PARENT" && u.parent;
      const activeQr = u.qrCodes?.[0];

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
        childStudentId: isParent ? u.parent?.parentStudents[0]?.studentId : undefined,
        qrToken: activeQr?.qrToken || "SMTS-UNASSIGNED",
        qrIsActive: activeQr?.isActive ?? true,
        mustChangePassword: u.mustChangePassword,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST Create User + (Teacher / Student / Parent) + UserQrCode in a SINGLE TRANSACTION
usersRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      email,
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
      childStudentId,
    } = req.body;

    if (!username || !email || !name || !role) {
      res.status(400).json({ success: false, message: "Username, email, nama, dan jenis pengguna wajib diisi." });
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

    // Default password 'smtslogin' hashed securely with bcrypt (10 rounds)
    const defaultPassword = "smtslogin";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

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
      // 1. Create User with mustChangePassword = true
      const user = await tx.user.create({
        data: {
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          passwordHash,
          role: prismaRole,
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 2. Create UserQrCode linked to User in PostgreSQL
      await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken: secureQrToken,
          isActive: true,
        },
      });

      // 3. Create Role Profile
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
      } else if (prismaRole === Role.PARENT) {
        const parent = await tx.parent.create({
          data: {
            userId: user.id,
            fullName: name,
            phone: phone || null,
            address: address || null,
          },
        });

        if (childStudentId) {
          await tx.parentStudent.create({
            data: {
              parentId: parent.id,
              studentId: childStudentId,
              relationship: "Orang Tua / Wali",
            },
          });
        }
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: name,
          userRole: prismaRole,
          action: prismaRole === Role.TEACHER ? "CREATE_TEACHER" : prismaRole === Role.STUDENT ? "CREATE_STUDENT" : "CREATE_USER",
          details: `Menambahkan akun ${name} (${username}) dengan role ${prismaRole}, password awal default (smtslogin), dan QR Token ${secureQrToken}`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: `User ${name} berhasil dibuat dengan password awal 'smtslogin' dan QR Token ${secureQrToken}`,
      data: { id: newUser.id, username: newUser.username, qrToken: secureQrToken, mustChangePassword: true },
    });
  } catch (error: any) {
    console.error("Create user transaction error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal membuat user" });
  }
});

// Regenerate QR Token (Invalidates old active token & creates new token in PostgreSQL)
usersRouter.post("/:id/regenerate-qr", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { qrCodes: true, teacher: true, student: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
      return;
    }

    const prefix = user.role === "TEACHER" ? "SMTS-TCH" : user.role === "STUDENT" ? "SMTS-STU" : "SMTS-ADM";
    const newQrToken = generateSecureQRToken(prefix);

    await prisma.$transaction(async (tx) => {
      // 1. Deactivate all existing QR codes for this user
      await tx.userQrCode.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });

      // 2. Create new active QR code record
      await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken: newQrToken,
          isActive: true,
        },
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.teacher?.fullName || user.student?.fullName || user.username,
          userRole: user.role,
          action: "QR_REGENERATED",
          details: `Regenerasi QR Code berhasil untuk ${user.username}. QR Token baru: ${newQrToken} (QR lama dinonaktifkan)`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    });

    res.json({
      success: true,
      qrToken: newQrToken,
      message: "QR Code berhasil diregenerasi dan disimpan ke PostgreSQL. QR sebelumnya telah dinonaktifkan.",
    });
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
