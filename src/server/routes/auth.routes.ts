import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Role, Prisma } from "@prisma/client";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { normalizePhoneNumber } from "../services/account.service";

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

    // 1. GURU: Primary lookup by Teacher.nip -> linked User
    if (mappedRole.roleEnum === Role.TEACHER) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          nip: { equals: loginIdentifier, mode: "insensitive" },
        },
        include: {
          user: {
            include: { qrCodes: { where: { isActive: true }, take: 1 } },
          },
          teacherSubjects: { include: { subject: true } },
          teacherAssignments: { include: { assignmentType: true, class: true } },
        },
      });

      if (teacher && teacher.user) {
        user = {
          ...teacher.user,
          teacher,
        };
      } else {
        // Fallback: search User table by username or email
        user = await prisma.user.findFirst({
          where: {
            role: Role.TEACHER,
            OR: [
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
    }
    // 2. SISWA: Primary lookup by Student.nis -> linked User
    else if (mappedRole.roleEnum === Role.STUDENT) {
      const student = await prisma.student.findFirst({
        where: {
          nis: { equals: loginIdentifier, mode: "insensitive" },
        },
        include: {
          user: {
            include: { qrCodes: { where: { isActive: true }, take: 1 } },
          },
          classMemberships: {
            where: { status: "ACTIVE" },
            include: { class: true },
          },
        },
      });

      if (student && student.user) {
        user = {
          ...student.user,
          student,
        };
      } else {
        // Fallback: search User table by username or email
        user = await prisma.user.findFirst({
          where: {
            role: Role.STUDENT,
            OR: [
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
    }
    // 3. ORANG TUA / WALI: Primary lookup by Parent.phone (normalized) -> linked User
    else if (mappedRole.roleEnum === Role.PARENT) {
      const normalizedPhone = normalizePhoneNumber(loginIdentifier);
      const parent = await prisma.parent.findFirst({
        where: {
          OR: [
            { phone: loginIdentifier },
            ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
          ],
        },
        include: {
          user: {
            include: { qrCodes: { where: { isActive: true }, take: 1 } },
          },
          parentStudents: { include: { student: true } },
        },
      });

      if (parent && parent.user) {
        user = {
          ...parent.user,
          parent,
        };
      } else {
        // Fallback: search User table by username or email
        const parentOrConditions: Prisma.UserWhereInput[] = [
          { username: { equals: loginIdentifier, mode: "insensitive" } },
          { email: { equals: loginIdentifier, mode: "insensitive" } },
        ];
        if (normalizedPhone) {
          parentOrConditions.push({ username: { equals: normalizedPhone, mode: "insensitive" } });
        }

        user = await prisma.user.findFirst({
          where: {
            role: Role.PARENT,
            OR: parentOrConditions,
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

    // Plaintext fallback ONLY IF legacy unhashed password exists in database (auto-upgrades)
    if (!isMatch && user.passwordHash === password) {
      isMatch = true;
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
      nipOrNis: user.teacher?.nip || user.student?.nis || undefined,
      nis: user.student?.nis || undefined,
      nisn: user.student?.nisn || undefined,
      classId: user.student?.classMemberships?.[0]?.classId || undefined,
      className: user.student?.classMemberships?.[0]?.class?.name || undefined,
      qrToken: activeQr?.qrToken || "SMTS-UNASSIGNED",
      qrIsActive: activeQr?.isActive ?? true,
      teacherId: user.teacher?.id,
      studentId: user.student?.id,
      parentId: user.parent?.id,
      phone: user.teacher?.phone || user.parent?.phone || undefined,
      address: user.teacher?.address || user.student?.address || user.parent?.address || undefined,
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
        message: "Password saat ini salah.",
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
          details: `User ${user.username} (${user.role}) berhasil memperbarui kata sandi akun melalui menu Profil.`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation skipped:", auditErr);
    }

    res.json({
      success: true,
      message: "Password berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal mengubah kata sandi." });
  }
});

// POST /api/auth/reset-request - User Requests Password Reset (Lupa Password)
authRouter.post("/reset-request", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, identifier, note } = req.body;
    const cleanId = (identifier || "").toString().trim();

    if (!role || !cleanId) {
      res.status(400).json({
        success: false,
        message: "Silakan pilih jenis akun dan masukkan NIP/NIS/Nomor HP Anda.",
      });
      return;
    }

    const mappedRole = mapRole(role);
    if (!mappedRole) {
      res.status(400).json({
        success: false,
        message: "Jenis pengguna tidak valid.",
      });
      return;
    }

    let targetUser: any = null;
    let targetName = "";

    if (mappedRole.roleEnum === Role.TEACHER) {
      const teacher = await prisma.teacher.findFirst({
        where: { nip: { equals: cleanId, mode: "insensitive" } },
        include: { user: true },
      });
      if (teacher && teacher.user) {
        targetUser = teacher.user;
        targetName = teacher.fullName;
      }
    } else if (mappedRole.roleEnum === Role.STUDENT) {
      const student = await prisma.student.findFirst({
        where: { nis: { equals: cleanId, mode: "insensitive" } },
        include: { user: true },
      });
      if (student && student.user) {
        targetUser = student.user;
        targetName = student.fullName;
      }
    } else if (mappedRole.roleEnum === Role.PARENT) {
      const normalizedPhone = normalizePhoneNumber(cleanId);
      const parent = await prisma.parent.findFirst({
        where: {
          OR: [
            { phone: { equals: cleanId, mode: "insensitive" } },
            { phone: { equals: normalizedPhone, mode: "insensitive" } },
          ],
        },
        include: { user: true },
      });
      if (parent && parent.user) {
        targetUser = parent.user;
        targetName = parent.fullName;
      }
    } else {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } },
          ],
        },
      });
      targetName = targetUser?.username || cleanId;
    }

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: `Akun ${mappedRole.label} dengan ${mappedRole.identifierName} "${cleanId}" tidak ditemukan dalam sistem.`,
      });
      return;
    }

    // Create Audit Log for Admin Notification
    await prisma.auditLog.create({
      data: {
        userId: targetUser.id,
        userName: targetName,
        userRole: targetUser.role,
        action: "PASSWORD_RESET_REQUEST",
        details: `Permintaan reset kata sandi diajukan untuk akun ${targetName} (${mappedRole.label} - ${cleanId}). Alasan/Catatan: ${note || "Lupa kata sandi"}`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    // Notify all admin users
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
    });

    for (const adm of admins) {
      await prisma.notification.create({
        data: {
          userId: adm.id,
          title: "Permintaan Reset Password",
          message: `${targetName} (${mappedRole.label} - ${cleanId}) mengajukan permohonan reset kata sandi.`,
          type: "warning",
        },
      });
    }

    res.json({
      success: true,
      message: "Permintaan reset kata sandi telah dikirim ke Super Admin. Silakan hubungi operator madrasah untuk konfirmasi.",
      userName: targetName,
    });
  } catch (error: any) {
    console.error("Reset request error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal mengirim permintaan reset." });
  }
});

// GET /api/auth/reset-requests - Super Admin List Pending Reset Requests
authRouter.get("/reset-requests", async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await prisma.auditLog.findMany({
      where: {
        action: "PASSWORD_RESET_REQUEST",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          include: { teacher: true, student: true, parent: true },
        },
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("Fetch reset requests error:", error);
    res.status(500).json({ success: false, message: "Gagal memuat permintaan reset password." });
  }
});

// POST /api/auth/process-reset - Super Admin Resets Password
authRouter.post("/process-reset", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, newPassword = "smtslogin" } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: "User ID wajib disertakan." });
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

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    const targetName = user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username;

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: targetName,
        userRole: user.role,
        action: "PASSWORD_RESET_COMPLETED",
        details: `Super Admin telah mereset kata sandi akun ${targetName} (${user.role}) ke "${newPassword}".`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Kata Sandi Direset",
        message: `Kata sandi Anda telah direset oleh Super Admin menjadi "${newPassword}".`,
        type: "info",
      },
    });

    res.json({
      success: true,
      message: `Kata sandi untuk ${targetName} berhasil direset menjadi '${newPassword}'.`,
    });
  } catch (error: any) {
    console.error("Process reset error:", error);
    res.status(500).json({ success: false, message: error?.message || "Gagal memproses reset kata sandi." });
  }
});
