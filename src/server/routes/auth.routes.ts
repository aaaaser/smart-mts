import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { normalizePhoneNumber } from "./users.routes";

export const authRouter = Router();

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

// POST /api/auth/login - Centralized Identity Authentication
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { usernameOrEmail, identifier, password, role } = req.body;
  const loginIdentifier = (identifier || usernameOrEmail || "").toString().trim();

  try {
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

    // Safe debug logging (NEVER log raw password)
    console.log("[AUTH_LOGIN_ATTEMPT]", {
      role: mappedRole.label,
      identifier: loginIdentifier,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      console.log("[AUTH_FAILURE]", { reason: "DATABASE_OFFLINE" });
      res.status(503).json({
        success: false,
        message: "Database PostgreSQL belum terhubung. Pastikan service PostgreSQL telah aktif.",
        dbError: dbStatus.error,
      });
      return;
    }

    let user: any = null;

    // 1. GURU: Primary lookup by Teacher.nip (case-insensitive string) -> User
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
          teacher: {
            include: {
              teacherSubjects: { include: { subject: true } },
              teacherAssignments: { include: { assignmentType: true, class: true } },
            },
          },
          qrCodes: { where: { isActive: true }, take: 1 },
        },
      });
    }
    // 2. SISWA: Primary lookup by Student.nis (case-insensitive string) -> User
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
    // 3. ORANG TUA / WALI: Primary lookup by Parent.phone (normalized string) -> User
    else if (mappedRole.roleEnum === Role.PARENT) {
      const normalizedPhone = normalizePhoneNumber(loginIdentifier);
      const orConditions: any[] = [
        { parent: { phone: { equals: loginIdentifier } } },
        { username: { equals: loginIdentifier, mode: "insensitive" } },
        { email: { equals: loginIdentifier, mode: "insensitive" } },
      ];
      if (normalizedPhone) {
        orConditions.push({ parent: { phone: { equals: normalizedPhone } } });
        orConditions.push({ username: { equals: normalizedPhone, mode: "insensitive" } });
      }

      user = await prisma.user.findFirst({
        where: {
          role: Role.PARENT,
          OR: orConditions,
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
    // 4. ADMIN: Primary lookup by username or email
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

    // Step A: Check if User exists
    if (!user) {
      console.log("[AUTH_FAILURE]", { role: mappedRole.label, reason: "USER_NOT_FOUND", identifier: loginIdentifier });
      res.status(401).json({
        success: false,
        message: `${mappedRole.identifierName} atau kata sandi yang Anda masukkan salah.`,
      });
      return;
    }

    console.log("[AUTH_USER_FOUND]", { userId: user.id, username: user.username, role: user.role });

    // Step B: Role match verification
    if (user.role !== mappedRole.roleEnum) {
      console.log("[AUTH_FAILURE]", { userId: user.id, reason: "ROLE_MISMATCH", actualRole: user.role, requestedRole: mappedRole.roleEnum });
      res.status(403).json({
        success: false,
        message: "Jenis pengguna tidak sesuai dengan akun.",
      });
      return;
    }

    console.log("[AUTH_ROLE_VALID]", { userId: user.id, role: user.role });

    // Step C: Account active verification
    if (!user.isActive) {
      console.log("[AUTH_FAILURE]", { userId: user.id, reason: "ACCOUNT_INACTIVE" });
      res.status(403).json({
        success: false,
        message: "Akun tidak aktif. Hubungi administrator.",
      });
      return;
    }

    // Step D: Password verification (bcrypt)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (bcryptErr) {
      console.error("Bcrypt compare error:", bcryptErr);
      isMatch = false;
    }

    // Emergency plaintext fallback ONLY IF legacy unhashed password exists in database
    if (!isMatch && user.passwordHash === password) {
      isMatch = true;
      // Auto-migrate to bcrypt hash
      try {
        const upgradedHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: upgradedHash },
        });
      } catch (upgradeErr) {
        console.warn("Could not upgrade plaintext password:", upgradeErr);
      }
    }

    if (!isMatch) {
      console.log("[AUTH_FAILURE]", { userId: user.id, reason: "INVALID_PASSWORD" });
      res.status(401).json({
        success: false,
        message: `${mappedRole.identifierName} atau kata sandi yang Anda masukkan salah.`,
      });
      return;
    }

    console.log("[AUTH_PASSWORD_VALID]", { userId: user.id });
    console.log("[AUTH_SUCCESS]", { userId: user.id, username: user.username, mustChangePassword: user.mustChangePassword });

    // Update lastLoginAt in PostgreSQL
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create Audit Log safely
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
          userRole: user.role,
          action: "LOGIN",
          details: `User ${user.username} berhasil login sebagai ${mappedRole.label} via ${mappedRole.identifierName}: ${loginIdentifier}`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    const activeQr = user.qrCodes?.[0];

    // Clean payload for frontend
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
    console.error("Login unexpected error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat proses login.",
    });
  }
});

// POST /api/auth/change-password - Change Password Endpoint (First Login / Regular)
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

    if (newPassword.toLowerCase() === "smtslogin") {
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

    // Hash new password securely with bcrypt (10 rounds) - ONLY ONCE
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
          details: `User ${user.username} (${user.role}) berhasil memperbarui kata sandi akun dan menyelesaikan aktivasi login.`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    res.json({
      success: true,
      message: "Kata sandi berhasil diperbarui. Akun Anda telah aktif sepenuhnya.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal mengubah kata sandi." });
  }
});
