import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const authRouter = Router();

// Login with username/email & password
authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ success: false, message: "Username/email dan password wajib diisi." });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        message: "Database PostgreSQL belum terhubung. Pastikan service PostgreSQL dan migration telah dijalankan.",
        dbError: dbStatus.error,
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase() },
          { email: usernameOrEmail.toLowerCase() },
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
      res.status(401).json({ success: false, message: "Akun tidak ditemukan. Periksa username/email Anda." });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: "Akun ini dinonaktifkan. Hubungi Administrator madrasah." });
      return;
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Password salah. Silakan coba kembali." });
      return;
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.teacher?.fullName || user.student?.fullName || user.username,
        userRole: user.role,
        action: "LOGIN",
        details: `User ${user.username} berhasil login ke sistem smart MTs`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    // Transform user for frontend consumption
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
      phone: user.teacher?.phone || undefined,
      address: user.teacher?.address || user.student?.address || undefined,
    };

    res.json({
      success: true,
      message: "Login berhasil",
      user: userPayload,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error?.message || "Internal server error" });
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
