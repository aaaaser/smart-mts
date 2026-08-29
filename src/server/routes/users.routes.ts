import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { Role, Gender, EmploymentStatus, StudentStatus } from "@prisma/client";

export const usersRouter = Router();

// Shared Phone Normalization helper (e.g. "+6281234567890" / "6281234567890" / "0812-3456-7890" -> "081234567890")
export function normalizePhoneNumber(phoneInput?: string | null): string {
  if (!phoneInput) return "";
  let cleaned = phoneInput.replace(/[\s\-\(\)\+]/g, "").trim();
  if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

export function generateSecureQRToken(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${token}`;
}

// GET all users from PostgreSQL
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
        role: u.role === "TEACHER" ? "guru" : u.role === "STUDENT" ? "siswa" : u.role === "PARENT" ? "orangtua" : "admin",
        name: u.teacher?.fullName || u.student?.fullName || u.parent?.fullName || u.username,
        avatar: u.teacher?.photo || u.student?.photo || undefined,
        nip: u.teacher?.nip || undefined,
        nuptk: u.teacher?.nuptk || undefined,
        nik: u.teacher?.nik || undefined,
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
      role, // "guru" | "siswa" | "admin" | "orangtua"
      name,
      nip,
      nuptk,
      nik,
      nis,
      nisn,
      nipOrNis,
      gender = "L",
      phone,
      address,
      classId,
      academicYearId,
      subjectIds,
      childStudentId,
    } = req.body;

    let { username, email } = req.body;

    if (!name || !role) {
      res.status(400).json({ success: false, message: "Nama dan jenis pengguna wajib diisi." });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const normalizedRole = role.toString().trim().toLowerCase();
    const isTeacherRole = normalizedRole === "guru" || normalizedRole === "teacher";
    const isStudentRole = normalizedRole === "siswa" || normalizedRole === "student";
    const isParentRole =
      normalizedRole === "orangtua" ||
      normalizedRole === "orang_tua" ||
      normalizedRole === "parent" ||
      normalizedRole === "wali";

    const prismaRole: Role = isTeacherRole
      ? Role.TEACHER
      : isStudentRole
      ? Role.STUDENT
      : isParentRole
      ? Role.PARENT
      : Role.ADMIN;

    // 1. Resolve & Validate Identifiers as String
    let effectiveNip: string | null = null;
    let effectiveNis: string | null = null;
    let effectivePhone: string | null = null;

    if (prismaRole === Role.TEACHER) {
      const rawNip = (nip || nipOrNis || "").toString().trim();
      if (!rawNip) {
        res.status(400).json({ success: false, message: "NIP wajib diisi untuk data Guru." });
        return;
      }
      effectiveNip = rawNip;

      // Check NIP duplication in Teacher
      const existingTeacher = await prisma.teacher.findFirst({
        where: { nip: { equals: effectiveNip, mode: "insensitive" } },
      });
      if (existingTeacher) {
        res.status(409).json({ success: false, message: `NIP ${effectiveNip} sudah terdaftar pada guru lain.` });
        return;
      }

      if (!username) username = effectiveNip;
      if (!email) email = `${effectiveNip}@guru.madrasah.id`;
    } else if (prismaRole === Role.STUDENT) {
      const rawNis = (nis || nipOrNis || "").toString().trim();
      if (!rawNis) {
        res.status(400).json({ success: false, message: "NIS wajib diisi untuk data Siswa." });
        return;
      }
      effectiveNis = rawNis;

      // Check NIS duplication in Student
      const existingStudent = await prisma.student.findFirst({
        where: { nis: { equals: effectiveNis, mode: "insensitive" } },
      });
      if (existingStudent) {
        res.status(409).json({ success: false, message: `NIS ${effectiveNis} sudah terdaftar pada siswa lain.` });
        return;
      }

      if (!username) username = effectiveNis;
      if (!email) email = `${effectiveNis}@siswa.madrasah.id`;
    } else if (prismaRole === Role.PARENT) {
      const rawPhone = (phone || "").toString().trim();
      effectivePhone = normalizePhoneNumber(rawPhone);
      if (!effectivePhone || effectivePhone.length < 6) {
        res.status(400).json({ success: false, message: "Nomor HP / WhatsApp yang valid wajib diisi untuk Orang Tua/Wali." });
        return;
      }

      // Check Phone duplication in Parent
      const existingParent = await prisma.parent.findFirst({
        where: { phone: effectivePhone },
      });
      if (existingParent) {
        res.status(409).json({ success: false, message: `Nomor HP ${effectivePhone} sudah terdaftar untuk wali murid lain.` });
        return;
      }

      if (!username) username = effectivePhone;
      if (!email) email = `ortu.${effectivePhone}@wali.madrasah.id`;
    } else {
      // Admin
      if (!username || !email) {
        res.status(400).json({ success: false, message: "Username dan email wajib diisi untuk Admin." });
        return;
      }
    }

    const cleanUsername = username.toString().trim().toLowerCase();
    const cleanEmail = email.toString().trim().toLowerCase();

    // Check unique username & email in User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: `Username '${cleanUsername}' atau Email '${cleanEmail}' sudah digunakan di database.`,
      });
      return;
    }

    // Default password 'smtslogin' hashed securely with bcrypt (10 rounds) - ONLY HASHED ONCE
    const defaultPassword = "smtslogin";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const qrPrefix = prismaRole === Role.TEACHER ? "SMTS-TCH" : prismaRole === Role.STUDENT ? "SMTS-STU" : prismaRole === Role.PARENT ? "SMTS-ORT" : "SMTS-ADM";
    const secureQrToken = generateSecureQRToken(qrPrefix);

    // Transaction execution
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create User with mustChangePassword = true
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
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
            nip: effectiveNip,
            nuptk: nuptk ? String(nuptk).trim() : null,
            nik: nik ? String(nik).trim() : null,
            gender: gender === "P" ? Gender.P : Gender.L,
            phone: phone ? normalizePhoneNumber(phone) : null,
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
            nis: effectiveNis!,
            nisn: nisn ? String(nisn).trim() : null,
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
            phone: effectivePhone,
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
          action: prismaRole === Role.TEACHER ? "CREATE_TEACHER" : prismaRole === Role.STUDENT ? "CREATE_STUDENT" : prismaRole === Role.PARENT ? "CREATE_PARENT" : "CREATE_USER",
          details: `Menambahkan akun ${name} (ID: ${cleanUsername}) dengan role ${prismaRole}, password awal 'smtslogin', and QR Token ${secureQrToken}`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });

      return user;
    });

    res.status(201).json({
      success: true,
      message: `Akun ${name} berhasil dibuat dengan password awal 'smtslogin' dan QR Token ${secureQrToken}`,
      data: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role.toLowerCase(),
        qrToken: secureQrToken,
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    console.error("Create user transaction error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal membuat pengguna di database." });
  }
});

// POST Admin Reset Password for any user
usersRouter.post("/:id/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { teacher: true, student: true, parent: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
      return;
    }

    // Default password 'smtslogin' hashed securely
    const defaultPassword = "smtslogin";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
          userRole: user.role,
          action: "RESET_PASSWORD_ADMIN",
          details: `Admin mereset password akun ${user.username} (${user.role}) ke kata sandi awal 'smtslogin' dengan kewajiban ganti kata sandi.`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    });

    res.json({
      success: true,
      message: `Kata sandi akun ${user.username} berhasil direset ke 'smtslogin'. Pengguna wajib mengganti kata sandi saat login berikutnya.`,
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal mereset kata sandi." });
  }
});

// Regenerate QR Token (Invalidates old active token & creates new token in PostgreSQL)
usersRouter.post("/:id/regenerate-qr", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { qrCodes: true, teacher: true, student: true, parent: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
      return;
    }

    const prefix = user.role === "TEACHER" ? "SMTS-TCH" : user.role === "STUDENT" ? "SMTS-STU" : user.role === "PARENT" ? "SMTS-ORT" : "SMTS-ADM";
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
          userName: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
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

// GET Database Diagnostic for Accounts & Authentication
usersRouter.get("/diagnostic", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    // 1. Check Teachers without User
    const teachers = await prisma.teacher.findMany({ include: { user: true } });
    const teachersWithoutUser = teachers.filter((t) => !t.user);

    // 2. Check Students without User
    const students = await prisma.student.findMany({ include: { user: true } });
    const studentsWithoutUser = students.filter((s) => !s.user);

    // 3. Check Parents without User
    const parents = await prisma.parent.findMany({ include: { user: true } });
    const parentsWithoutUser = parents.filter((p) => !p.user);

    // 4. Check Users without corresponding Profile
    const users = await prisma.user.findMany({
      include: { teacher: true, student: true, parent: true, qrCodes: { where: { isActive: true } } },
    });

    const teacherUsersWithoutTeacher = users.filter((u) => u.role === Role.TEACHER && !u.teacher);
    const studentUsersWithoutStudent = users.filter((u) => u.role === Role.STUDENT && !u.student);
    const parentUsersWithoutParent = users.filter((u) => u.role === Role.PARENT && !u.parent);

    // 5. Check Users with missing or empty passwordHash
    const usersWithInvalidPassword = users.filter(
      (u) => !u.passwordHash || u.passwordHash.length < 10 || !u.passwordHash.startsWith("$2")
    );

    // 6. Check Users without active QR Code
    const usersWithoutActiveQr = users.filter((u) => !u.qrCodes || u.qrCodes.length === 0);

    // 7. Check Duplicate NIPs / NISs / Phones
    const nipCounts = new Map<string, number>();
    teachers.forEach((t) => {
      if (t.nip) nipCounts.set(t.nip, (nipCounts.get(t.nip) || 0) + 1);
    });
    const duplicateNips = Array.from(nipCounts.entries()).filter(([_, count]) => count > 1).map(([nip]) => nip);

    const nisCounts = new Map<string, number>();
    students.forEach((s) => {
      if (s.nis) nisCounts.set(s.nis, (nisCounts.get(s.nis) || 0) + 1);
    });
    const duplicateNiss = Array.from(nisCounts.entries()).filter(([_, count]) => count > 1).map(([nis]) => nis);

    const isHealthy =
      teachersWithoutUser.length === 0 &&
      studentsWithoutUser.length === 0 &&
      parentsWithoutUser.length === 0 &&
      teacherUsersWithoutTeacher.length === 0 &&
      studentUsersWithoutStudent.length === 0 &&
      parentUsersWithoutParent.length === 0 &&
      usersWithInvalidPassword.length === 0 &&
      usersWithoutActiveQr.length === 0;

    res.json({
      success: true,
      isHealthy,
      summary: {
        totalUsers: users.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalParents: parents.length,
      },
      issues: {
        teachersWithoutUserCount: teachersWithoutUser.length,
        studentsWithoutUserCount: studentsWithoutUser.length,
        parentsWithoutUserCount: parentsWithoutUser.length,
        teacherUsersWithoutTeacherCount: teacherUsersWithoutTeacher.length,
        studentUsersWithoutStudentCount: studentUsersWithoutStudent.length,
        parentUsersWithoutParentCount: parentUsersWithoutParent.length,
        usersWithInvalidPasswordCount: usersWithInvalidPassword.length,
        usersWithoutActiveQrCount: usersWithoutActiveQr.length,
        duplicateNips,
        duplicateNiss,
      },
      details: {
        usersWithInvalidPassword: usersWithInvalidPassword.map((u) => ({ id: u.id, username: u.username, role: u.role })),
        usersWithoutActiveQr: usersWithoutActiveQr.map((u) => ({ id: u.id, username: u.username, role: u.role })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST Safe Database Repair for Account Relations & Passwords
usersRouter.post("/repair", async (req: Request, res: Response): Promise<void> => {
  try {
    const defaultPassword = "smtslogin";
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

    const repairLog: string[] = [];

    await prisma.$transaction(async (tx) => {
      // 1. Fix Users with missing/corrupted password hashes
      const invalidPassUsers = await tx.user.findMany({
        where: {
          OR: [
            { passwordHash: "" },
            { passwordHash: { not: { startsWith: "$2" } } },
          ],
        },
      });

      for (const u of invalidPassUsers) {
        await tx.user.update({
          where: { id: u.id },
          data: {
            passwordHash: defaultPasswordHash,
            mustChangePassword: true,
          },
        });
        repairLog.push(`Perbaiki password hash user: ${u.username} (${u.role}) -> reset ke default smtslogin`);
      }

      // 2. Ensure all users have an active UserQrCode
      const users = await tx.user.findMany({
        include: { qrCodes: { where: { isActive: true } } },
      });

      for (const u of users) {
        if (!u.qrCodes || u.qrCodes.length === 0) {
          const prefix = u.role === "TEACHER" ? "SMTS-TCH" : u.role === "STUDENT" ? "SMTS-STU" : u.role === "PARENT" ? "SMTS-ORT" : "SMTS-ADM";
          const newQrToken = generateSecureQRToken(prefix);
          await tx.userQrCode.create({
            data: {
              userId: u.id,
              qrToken: newQrToken,
              isActive: true,
            },
          });
          repairLog.push(`Buat QR Code baru untuk user: ${u.username} (${newQrToken})`);
        }
      }

      // 3. Create audit log for the repair action
      await tx.auditLog.create({
        data: {
          userId: "system",
          userName: "Database Diagnostic Repair",
          userRole: Role.ADMIN,
          action: "REPAIR_ACCOUNTS",
          details: `Menjalankan perbaikan database akun: ${repairLog.length} item diperbaiki.`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    });

    res.json({
      success: true,
      message: `Proses perbaikan berhasil diselesaikan. Total ${repairLog.length} data diselaraskan.`,
      repairCount: repairLog.length,
      repairLog,
    });
  } catch (error: any) {
    console.error("Repair error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal melakukan perbaikan akun." });
  }
});

// Soft Delete / Deactivate User (Never delete historical records cascade)
usersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { teacher: true, student: true, parent: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
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
