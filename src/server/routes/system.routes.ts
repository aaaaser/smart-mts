import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const systemRouter = Router();

// GET School Profile / Settings
systemRouter.get("/settings", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    let settings = await prisma.schoolSetting.findFirst();
    if (!settings) {
      settings = await prisma.schoolSetting.create({
        data: {
          name: "MTs Negeri 1 Jakarta",
          npsn: "20108921",
          nss: "121131710001",
          accreditation: "A (Unggul)",
          address: "Jl. Madrasah No. 10, Jakarta Selatan",
          phone: "(021) 7890123",
          email: "info@mtsn1jakarta.sch.id",
          website: "https://mtsn1jakarta.sch.id",
          principalName: "Drs. H. Ahmad Dahlan, M.Pd.I",
          principalNip: "197505122000031002",
          activeAcademicYear: "2025/2026",
          activeSemester: "Ganjil",
          activeCurriculum: "merdeka",
          passingGradeDefault: 75,
        },
      });
    }

    res.json({
      success: true,
      data: {
        id: settings.id,
        name: settings.name,
        npsn: settings.npsn,
        nss: settings.nss || "",
        accreditation: settings.accreditation,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logoUrl: settings.logoUrl || "",
        principalName: settings.principalName,
        principalNip: settings.principalNip,
        academicYear: settings.activeAcademicYear,
        semester: settings.activeSemester as any,
        activeCurriculum: settings.activeCurriculum as any,
        passingGradeDefault: settings.passingGradeDefault,
        schoolStartTime: settings.schoolStartTime,
        schoolLateLimit: settings.schoolLateLimit,
        schoolEndTime: settings.schoolEndTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// PUT update school settings
systemRouter.put("/settings", async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const settings = await prisma.schoolSetting.findFirst();

    if (settings) {
      const updated = await prisma.schoolSetting.update({
        where: { id: settings.id },
        data: {
          name: payload.name ?? settings.name,
          npsn: payload.npsn ?? settings.npsn,
          nss: payload.nss ?? settings.nss,
          accreditation: payload.accreditation ?? settings.accreditation,
          address: payload.address ?? settings.address,
          phone: payload.phone ?? settings.phone,
          email: payload.email ?? settings.email,
          website: payload.website ?? settings.website,
          principalName: payload.principalName ?? settings.principalName,
          principalNip: payload.principalNip ?? settings.principalNip,
          activeAcademicYear: payload.academicYear ?? settings.activeAcademicYear,
          activeSemester: payload.semester ?? settings.activeSemester,
          activeCurriculum: payload.activeCurriculum ?? settings.activeCurriculum,
          passingGradeDefault: payload.passingGradeDefault ?? settings.passingGradeDefault,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userName: "Administrator",
          userRole: "ADMIN",
          action: "UPDATE_SCHOOL_SETTINGS",
          details: "Memperbarui profil madrasah dan konfigurasi akademik",
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });

      res.json({ success: true, data: updated, message: "Pengaturan madrasah berhasil disimpan ke PostgreSQL." });
    } else {
      res.status(404).json({ success: false, message: "Pengaturan belum dibuat" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET Audit Logs
systemRouter.get("/audit-logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const transformed = logs.map((l) => ({
      id: l.id,
      userId: l.userId || "system",
      userName: l.userName,
      userRole: l.userRole.toLowerCase() as any,
      action: l.action,
      details: l.details,
      timestamp: l.createdAt.toISOString(),
      ipOrDevice: l.ipOrDevice || "127.0.0.1",
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET PostgreSQL Database Status
systemRouter.get("/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    let stats = null;

    if (dbStatus.connected) {
      const [userCount, teacherCount, studentCount, attendanceCount, examCount] = await Promise.all([
        prisma.user.count(),
        prisma.teacher.count(),
        prisma.student.count(),
        prisma.attendanceRecord.count(),
        prisma.exam.count(),
      ]);

      stats = {
        totalUsers: userCount,
        teachers: teacherCount,
        students: studentCount,
        attendanceRecords: attendanceCount,
        exams: examCount,
        databaseName: "smts_db",
        orm: "Prisma ORM",
        provider: "PostgreSQL",
      };
    }

    res.json({
      success: true,
      connected: dbStatus.connected,
      error: dbStatus.error,
      database: "smts_db",
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET Backup & Restore Info (PostgreSQL pg_dump / pg_restore guide)
systemRouter.get("/backup-info", async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    database: "smts_db",
    backupMethod: "PostgreSQL Native Utility (pg_dump / pg_restore)",
    commands: {
      dumpCommand: "pg_dump -U postgres -d smts_db -F c -b -v -f smts_backup_$(date +%Y%m%d_%H%M%S).dump",
      restoreCommand: "pg_restore -U postgres -d smts_db -v -c smts_backup.dump",
      sqlDumpCommand: "pg_dump -U postgres -d smts_db > smts_backup.sql",
      sqlRestoreCommand: "psql -U postgres -d smts_db < smts_backup.sql",
    },
    recommendation: "Gunakan command line atau crontab server untuk otomatisasi backup berkala yang aman.",
  });
});
