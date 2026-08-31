import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { Role } from "@prisma/client";
import {
  AccountService,
  normalizePhoneNumber,
  generateSecureQRToken,
} from "../services/account.service";

export { normalizePhoneNumber, generateSecureQRToken };

export const usersRouter = Router();

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
        avatar: u.teacher?.photo || u.student?.photo || u.parent?.photo || undefined,
        nip: u.teacher?.nip || undefined,
        nipOrNis: u.teacher?.nip || u.student?.nis || undefined,
        nuptk: u.teacher?.nuptk || undefined,
        nik: u.teacher?.nik || undefined,
        nis: u.student?.nis || undefined,
        nisn: u.student?.nisn || undefined,
        phone: u.teacher?.phone || u.parent?.phone || undefined,
        gender: u.teacher?.gender || u.student?.gender || undefined,
        birthPlace: u.teacher?.birthPlace || u.student?.birthPlace || undefined,
        birthDate: u.teacher?.birthDate?.toISOString().split("T")[0] || u.student?.birthDate?.toISOString().split("T")[0] || undefined,
        address: u.teacher?.address || u.student?.address || u.parent?.address || undefined,
        classId: isStudent ? u.student?.classMemberships[0]?.classId : undefined,
        className: isStudent ? u.student?.classMemberships[0]?.class?.name : undefined,
        enrollmentYear: isStudent ? String(u.student?.entryYear) : undefined,
        subjectIds: isTeacher ? u.teacher?.teacherSubjects.map((ts) => ts.subjectId) : undefined,
        teacherId: u.teacher?.id,
        studentId: u.student?.id,
        parentId: u.parent?.id,
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

// POST Create User + (Teacher / Student / Parent) + UserQrCode in a SINGLE TRANSACTION via AccountService
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
      birthPlace,
      birthDate,
      entryYear,
      classId,
      subjectIds,
      childStudentId,
      relationship,
      username,
      email,
    } = req.body;

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

    const ipOrDevice = req.ip || "127.0.0.1";

    // 1. CREATE GURU (TEACHER)
    if (isTeacherRole) {
      const effectiveNip = (nip || nipOrNis || "").toString().trim();
      const result = await AccountService.createTeacherAccount({
        name,
        nip: effectiveNip,
        nuptk,
        nik,
        gender,
        phone,
        email,
        username,
        address,
        subjectIds,
        ipOrDevice,
      });

      res.status(201).json({
        success: true,
        message: `Akun Guru ${name} berhasil dibuat dengan NIP ${effectiveNip}, password awal 'smtslogin', dan QR ${result.qrCode.qrToken}`,
        data: {
          id: result.user.id,
          username: result.user.username,
          role: "guru",
          teacherId: result.teacher.id,
          nip: result.teacher.nip,
          qrToken: result.qrCode.qrToken,
          mustChangePassword: true,
        },
      });
      return;
    }

    // 2. CREATE SISWA (STUDENT)
    if (isStudentRole) {
      const effectiveNis = (nis || nipOrNis || "").toString().trim();
      const result = await AccountService.createStudentAccount({
        name,
        nis: effectiveNis,
        nisn,
        gender,
        phone,
        email,
        username,
        address,
        birthPlace,
        birthDate,
        entryYear: entryYear ? parseInt(entryYear, 10) : undefined,
        classId,
        ipOrDevice,
      });

      res.status(201).json({
        success: true,
        message: `Akun Siswa ${name} berhasil dibuat dengan NIS ${effectiveNis}, password awal 'smtslogin', dan QR ${result.qrCode.qrToken}`,
        data: {
          id: result.user.id,
          username: result.user.username,
          role: "siswa",
          studentId: result.student.id,
          nis: result.student.nis,
          qrToken: result.qrCode.qrToken,
          mustChangePassword: true,
        },
      });
      return;
    }

    // 3. CREATE ORANG TUA / WALI (PARENT)
    if (isParentRole) {
      const result = await AccountService.createParentAccount({
        name,
        phone,
        email,
        username,
        address,
        childStudentId,
        relationship,
        ipOrDevice,
      });

      res.status(201).json({
        success: true,
        message: `Akun Orang Tua ${name} berhasil dibuat dengan nomor HP ${result.parent.phone} dan password awal 'smtslogin'`,
        data: {
          id: result.user.id,
          username: result.user.username,
          role: "orangtua",
          parentId: result.parent.id,
          phone: result.parent.phone,
          qrToken: result.qrCode.qrToken,
          mustChangePassword: true,
        },
      });
      return;
    }

    // 4. ADMIN USER
    if (!username || !email) {
      res.status(400).json({ success: false, message: "Username dan email wajib diisi untuk Admin." });
      return;
    }

    const cleanUsername = username.toString().trim().toLowerCase();
    const cleanEmail = email.toString().trim().toLowerCase();

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

    const passwordHash = await AccountService.getDefaultPasswordHash();
    const qrToken = generateSecureQRToken("SMTS-ADM");

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: Role.ADMIN,
          isActive: true,
          mustChangePassword: true,
        },
      });

      const qrCode = await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: name,
          userRole: Role.ADMIN,
          action: "CREATE_ADMIN",
          details: `Menambahkan akun Admin: ${name} (${cleanUsername}) dengan password awal 'smtslogin'`,
          ipOrDevice,
        },
      });

      return { user, qrCode };
    });

    console.log(
      `[CREATE_ACCOUNT] role=ADMIN identifier=${cleanUsername} userId=${result.user.id} isActive=true hasPasswordHash=true hasQrCode=true`
    );

    res.status(201).json({
      success: true,
      message: `Akun Admin ${name} berhasil dibuat dengan password awal 'smtslogin'`,
      data: {
        id: result.user.id,
        username: result.user.username,
        role: "admin",
        qrToken: result.qrCode.qrToken,
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    res.status(400).json({ success: false, message: error?.message || "Gagal membuat pengguna di database." });
  }
});

// PUT /api/users/:id - Update User & Related Profile in PostgreSQL safely
usersRouter.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const ipOrDevice = req.ip || "127.0.0.1";

    const result = await AccountService.updateUserAccount(id, updateData, ipOrDevice);
    res.json(result);
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(400).json({ success: false, message: error?.message || "Gagal memperbarui data pengguna." });
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

    const defaultPasswordHash = await AccountService.getDefaultPasswordHash();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: defaultPasswordHash,
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
          details: `Regenerasi QR Code berhasil untuk ${user.username}. QR Token baru: ${newQrToken}`,
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

// GET Database Diagnostic for All Accounts & Authentication
usersRouter.get("/diagnostic", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const diagnostic = await AccountService.diagnoseAllAccounts();
    res.json({
      success: true,
      ...diagnostic,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET Database Diagnostic for Single Account
usersRouter.get("/diagnostic/:identifier", async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;
    const accountDiagnostic = await AccountService.diagnoseUserAccount(identifier);
    if (!accountDiagnostic) {
      res.status(404).json({ success: false, message: `Akun '${identifier}' tidak ditemukan.` });
      return;
    }
    res.json({ success: true, data: accountDiagnostic });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST Safe Database Repair for All Accounts
usersRouter.post("/repair", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await AccountService.repairAllAccounts();
    res.json({
      success: true,
      message: `Proses perbaikan berhasil diselesaikan. Total ${result.repairCount} data diselaraskan.`,
      repairCount: result.repairCount,
      repairLog: result.logs,
    });
  } catch (error: any) {
    console.error("Repair error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal melakukan perbaikan akun." });
  }
});

// POST Safe Repair for Specific Teacher
usersRouter.post("/repair/teacher/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await AccountService.repairTeacherAccount(req.params.id);
    res.json({ success: true, message: "Perbaikan akun guru berhasil.", logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST Safe Repair for Specific Student
usersRouter.post("/repair/student/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await AccountService.repairStudentAccount(req.params.id);
    res.json({ success: true, message: "Perbaikan akun siswa berhasil.", logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST Safe Repair for Specific Parent
usersRouter.post("/repair/parent/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await AccountService.repairParentAccount(req.params.id);
    res.json({ success: true, message: "Perbaikan akun orang tua berhasil.", logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Permanent Delete User from PostgreSQL Database (Strictly Super Admin only)
usersRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const operatorRole =
      (req.headers["x-user-role"] as string) ||
      (req.body?.operatorRole as string) ||
      (req.query?.operatorRole as string) ||
      "admin";
    const operatorName =
      (req.headers["x-user-name"] as string) ||
      (req.body?.operatorName as string) ||
      "Super Admin";

    // Strict authorization: Only Super Admin can delete
    if (operatorRole.toLowerCase() !== "admin") {
      res.status(403).json({
        success: false,
        message: "Akses ditolak: Hanya Super Admin yang memiliki wewenang untuk menghapus akun / data guru dari database.",
      });
      return;
    }

    const result = await AccountService.deleteUserAccount(id, {
      role: operatorRole,
      name: operatorName,
      ipOrDevice: req.ip || "127.0.0.1",
    });

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(error?.message?.includes("Akses Ditolak") ? 403 : 500).json({
      success: false,
      message: error?.message || "Gagal menghapus data dari database.",
    });
  }
});

// POST Update User Profile Photo
usersRouter.post("/:id/photo", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { photoData, photoUrl } = req.body;

    if (!photoData && !photoUrl) {
      res.status(400).json({ success: false, message: "Data foto tidak boleh kosong." });
      return;
    }

    let finalPhotoUrl = photoUrl;

    if (photoData && typeof photoData === "string") {
      if (!photoData.startsWith("data:image/")) {
        res.status(400).json({ success: false, message: "Format gambar harus JPG, JPEG, PNG, atau WEBP." });
        return;
      }

      const matches = photoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        res.status(400).json({ success: false, message: "Format data gambar base64 tidak valid." });
        return;
      }

      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ success: false, message: "Ukuran file foto maksimal 5 MB." });
        return;
      }

      const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `avatar_${id}_${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);
      finalPhotoUrl = `/uploads/avatars/${filename}`;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { teacher: true, student: true, parent: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
      return;
    }

    if (user.teacher) {
      await prisma.teacher.update({
        where: { id: user.teacher.id },
        data: { photo: finalPhotoUrl },
      });
      await prisma.organizationStructure.updateMany({
        where: { teacherId: user.teacher.id },
        data: { photo: finalPhotoUrl },
      });
    } else if (user.student) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: { photo: finalPhotoUrl },
      });
    } else if (user.parent) {
      await prisma.parent.update({
        where: { id: user.parent.id },
        data: { photo: finalPhotoUrl },
      });
    }

    const targetName = user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username;
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: targetName,
        userRole: user.role,
        action: "UPDATE_PROFILE_PHOTO",
        details: `Memperbarui foto profil akun ${targetName} (${user.role})`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    res.json({
      success: true,
      message: "Foto profil berhasil diperbarui.",
      photoUrl: finalPhotoUrl,
    });
  } catch (error: any) {
    console.error("Update photo error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui foto profil." });
  }
});

