import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const authRouter = Router();

// Helper to normalize phone numbers (e.g. 081234567890 vs 6281234567890 vs +6281234567890)
function normalizePhoneNumber(phoneInput: string): string {
  let cleaned = phoneInput.replace(/[\s\-\(\)\+]/g, "").trim();
  if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

// Helper to normalize and map role strings to Prisma Role enum
function mapRole(roleInput?: string): { roleEnum: Role; label: string; identifierName: string } | null {
  if (!roleInput) return null;
  const normalized = roleInput.trim().toLowerCase();
  if (normalized === "admin") {
    return { roleEnum: Role.ADMIN, label: "Admin", identifierName: "Username / Email" };
  }
  if (normalized === "guru" || normalized === "teacher") {
    return { roleEnum: Role.TEACHER, label: "Guru", identifierName: "NIP" };
  }
  if (normalized === "siswa" || normalized === "student") {
    return { roleEnum: Role.STUDENT, label: "Siswa", identifierName: "NIS" };
  }
  if (
    normalized === "orang_tua" ||
    normalized === "orangtua" ||
    normalized === "parent" ||
    normalized === "wali" ||
    normalized === "orang tua / wali"
  ) {
    return { roleEnum: Role.PARENT, label: "Orang Tua / Wali", identifierName: "Nomor HP" };
  }
  return null;
}

// Login with Identity-based Credentials (NIP for Guru, NIS for Siswa, No HP for Parent, Username/Email for Admin)
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, identifier, password, role } = req.body;
    const loginIdentifier = (identifier || usernameOrEmail || "").toString().trim();

    if (!role) {
      res.status(400).json({
        success: false,
        message: "Silakan pilih jenis pengguna terlebih dahulu.",
      });
      return;
    }

    const mappedRole = mapRole(role);
    if (!mappedRole) {
      res.status(400).json({
        success: false,
        message: "Jenis pengguna yang dipilih tidak valid. Pilihan: Admin, Guru, Siswa, Orang Tua / Wali.",
      });
      return;
    }

    if (!loginIdentifier || !password) {
      res.status(400).json({
        success: false,
        message: `${mappedRole.identifierName} dan kata sandi wajib diisi.`,
      });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        message: "Database PostgreSQL belum terhubung. Pastikan service PostgreSQL telah aktif.",
        dbError: dbStatus.error,
      });
      return;
    }

    let user: any = null;

    // 1. GURU: Search by Teacher.nip (primary)
    if (mappedRole.roleEnum === Role.TEACHER) {
      user = await prisma.user.findFirst({
        where: {
          role: Role.TEACHER,
          OR: [
            { teacher: { nip: { equals: loginIdentifier, mode: "insensitive" } } },
            { username: { equals: loginIdentifier, mode: "insensitive" } },
            { email: { equals: loginIdentifier, mode: "insensitive" } },
          ],
        },
        include: {
          teacher: true,
          qrCodes: { where: { isActive: true }, take: 1 },
        },
      });
    }
    // 2. SISWA: Search by Student.nis (primary)
    else if (mappedRole.roleEnum === Role.STUDENT) {
      user = await prisma.user.findFirst({
        where: {
          role: Role.STUDENT,
          OR: [
            { student: { nis: { equals: loginIdentifier, mode: "insensitive" } } },
            { username: { equals: loginIdentifier, mode: "insensitive" } },
            { email: { equals: loginIdentifier, mode: "insensitive" } },
          ],
        },
        include: {
          student: {
            include: {
              classMemberships: {
                where: { status: "ACTIVE" },
                include: { class: true },
              },
            },
          },
          qrCodes: { where: { isActive: true }, take: 1 },
        },
      });
    }
    // 3. ORANG TUA / WALI: Search by Parent phone (normalized)
    else if (mappedRole.roleEnum === Role.PARENT) {
      const normalizedPhone = normalizePhoneNumber(loginIdentifier);
      user = await prisma.user.findFirst({
        where: {
          role: Role.PARENT,
          OR: [
            { parent: { phone: { contains: normalizedPhone } } },
            { parent: { phone: { contains: loginIdentifier } } },
            { username: { equals: loginIdentifier, mode: "insensitive" } },
            { email: { equals: loginIdentifier, mode: "insensitive" } },
          ],
        },
        include: {
          parent: {
            include: {
              parentStudents: { include: { student: true } },
            },
          },
          qrCodes: { where: { isActive: true }, take: 1 },
        },
      });
    }
    // 4. ADMIN: Search by username / email
    else {
      user = await prisma.user.findFirst({
        where: {
          role: Role.ADMIN,
          OR: [
            { username: { equals: loginIdentifier, mode: "insensitive" } },
            { email: { equals: loginIdentifier, mode: "insensitive" } },
          ],
        },
        include: {
          qrCodes: { where: { isActive: true }, take: 1 },
        },
      });
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: `${mappedRole.identifierName} atau kata sandi yang Anda masukkan salah.`,
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Akun Anda dinonaktifkan. Silakan hubungi administrator madrasah.",
      });
      return;
    }

    // Verify password hash (or plain text fallback if unhashed)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch {
      isMatch = false;
    }
    if (!isMatch && user.passwordHash === password) {
      isMatch = true;
    }

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: `${mappedRole.identifierName} atau kata sandi yang Anda masukkan salah.`,
      });
      return;
    }

    // Verify Role matches the selected role
    if (user.role !== mappedRole.roleEnum) {
      res.status(403).json({
        success: false,
        message: `Akun ini tidak terdaftar sebagai ${mappedRole.label}. Silakan pilih jenis pengguna yang sesuai.`,
      });
      return;
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
          userRole: user.role,
          action: "LOGIN",
          details: `User ${user.username} berhasil login sebagai ${mappedRole.label} menggunakan ${mappedRole.identifierName}: ${loginIdentifier}`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    const activeQr = user.qrCodes?.[0];

    // Transform user for frontend consumption
    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role === Role.ADMIN ? "admin" : user.role === Role.TEACHER ? "guru" : user.role === Role.STUDENT ? "siswa" : "orangtua",
      name: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
      nip: user.teacher?.nip || undefined,
      nis: user.student?.nis || undefined,
      nisn: user.student?.nisn || undefined,
      classId: user.student?.classMemberships?.[0]?.classId || undefined,
      className: user.student?.classMemberships?.[0]?.class?.name || undefined,
      qrToken: activeQr?.qrToken || "SMTS-UNASSIGNED",
      qrIsActive: activeQr?.isActive ?? true,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
      phone: user.teacher?.phone || user.parent?.phone || undefined,
      address: user.teacher?.address || user.student?.address || undefined,
      mustChangePassword: user.mustChangePassword ?? false,
    };

    res.json({
      success: true,
      message: "Login berhasil",
      user: userPayload,
      mustChangePassword: user.mustChangePassword ?? false,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server saat proses login." });
  }
});

// Change Password Endpoint (First Login / Regular Password Change)
authRouter.post("/change-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;

    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: "Semua kolom kata sandi wajib diisi.",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "Kata sandi baru minimal harus 8 karakter.",
      });
      return;
    }

    if (newPassword === "smtslogin") {
      res.status(400).json({
        success: false,
        message: "Kata sandi baru tidak boleh sama dengan kata sandi bawaan (smtslogin).",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: "Konfirmasi kata sandi baru tidak cocok.",
      });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, student: true, parent: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
      return;
    }

    // Check old password
    let isOldMatch = false;
    try {
      isOldMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    } catch {
      isOldMatch = false;
    }
    if (!isOldMatch && user.passwordHash === oldPassword) {
      isOldMatch = true;
    }

    if (!isOldMatch) {
      res.status(400).json({
        success: false,
        message: "Kata sandi lama yang Anda masukkan tidak sesuai.",
      });
      return;
    }

    // Hash new password securely with bcrypt
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
          userRole: user.role,
          action: "CHANGE_PASSWORD",
          details: `User ${user.username} (${user.role}) berhasil memperbarui kata sandi akun`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    res.json({
      success: true,
      message: "Kata sandi berhasil diperbarui. Akun Anda siap digunakan.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal mengubah kata sandi." });
  }
});

// Switch role / Quick role mock (for dev testing)
authRouter.post("/switch-role", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    let targetRole = "ADMIN";
    if (role === "guru" || role === "TEACHER") targetRole = "TEACHER";
    if (role === "siswa" || role === "STUDENT") targetRole = "STUDENT";
    if (role === "orangtua" || role === "PARENT") targetRole = "PARENT";

    const user = await prisma.user.findFirst({
      where: { role: targetRole as any, isActive: true },
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
        parent: true,
        qrCodes: { where: { isActive: true }, take: 1 },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: `Tidak ada user dengan role ${targetRole} di database.` });
      return;
    }

    const activeQr = user.qrCodes?.[0];

    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.toLowerCase(),
      name: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
      nip: user.teacher?.nip || undefined,
      nis: user.student?.nis || undefined,
      nisn: user.student?.nisn || undefined,
      classId: user.student?.classMemberships?.[0]?.classId || undefined,
      className: user.student?.classMemberships?.[0]?.class?.name || undefined,
      qrToken: activeQr?.qrToken || "SMTS-UNASSIGNED",
      qrIsActive: activeQr?.isActive ?? true,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
      mustChangePassword: user.mustChangePassword ?? false,
    };

    res.json({ success: true, user: userPayload });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

