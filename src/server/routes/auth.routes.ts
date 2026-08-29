import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const authRouter = Router();

// Helper to normalize and map role strings to Prisma Role enum
function mapRole(roleInput?: string): { roleEnum: Role; label: string } | null {
  if (!roleInput) return null;
  const normalized = roleInput.trim().toLowerCase();
  if (normalized === "admin") {
    return { roleEnum: Role.ADMIN, label: "Admin" };
  }
  if (normalized === "guru" || normalized === "teacher") {
    return { roleEnum: Role.TEACHER, label: "Guru" };
  }
  if (normalized === "siswa" || normalized === "student") {
    return { roleEnum: Role.STUDENT, label: "Siswa" };
  }
  if (
    normalized === "orang_tua" ||
    normalized === "orangtua" ||
    normalized === "parent" ||
    normalized === "wali" ||
    normalized === "orang tua / wali"
  ) {
    return { roleEnum: Role.PARENT, label: "Orang Tua / Wali" };
  }
  return null;
}

// Login with username/email, password, & role verification
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password, role } = req.body;

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

    if (!usernameOrEmail || !password) {
      res.status(400).json({
        success: false,
        message: "Username atau email dan password wajib diisi.",
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

    // Case-insensitive lookup
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: usernameOrEmail.trim(), mode: "insensitive" } },
          { email: { equals: usernameOrEmail.trim(), mode: "insensitive" } },
        ],
      },
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
        qrCode: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Username atau password yang Anda masukkan salah.",
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

    // Verify password hash (or direct string fallback if unhashed)
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
        message: "Username atau password yang Anda masukkan salah.",
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
          details: `User ${user.username} berhasil login sebagai ${mappedRole.label} ke sistem smart MTs`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

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
      classId: user.student?.classMemberships[0]?.classId || undefined,
      className: user.student?.classMemberships[0]?.class?.name || undefined,
      qrToken: user.qrCode?.qrToken || "SMTS-UNASSIGNED",
      qrIsActive: user.qrCode?.isActive ?? true,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
      phone: user.teacher?.phone || user.parent?.phone || undefined,
      address: user.teacher?.address || user.student?.address || undefined,
    };

    res.json({
      success: true,
      message: "Login berhasil",
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server saat proses login." });
  }
});

// Switch role / Quick role mock (for dev testing)
authRouter.post("/switch-role", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body; // "admin" | "guru" | "siswa"

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
        qrCode: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: `Tidak ada user dengan role ${targetRole} di database.` });
      return;
    }

    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.toLowerCase(),
      name: user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username,
      nip: user.teacher?.nip || undefined,
      nis: user.student?.nis || undefined,
      nisn: user.student?.nisn || undefined,
      classId: user.student?.classMemberships[0]?.classId || undefined,
      className: user.student?.classMemberships[0]?.class?.name || undefined,
      qrToken: user.qrCode?.qrToken || "SMTS-UNASSIGNED",
      qrIsActive: user.qrCode?.isActive ?? true,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
    };

    res.json({ success: true, user: userPayload });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
