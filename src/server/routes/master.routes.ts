import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const masterRouter = Router();

// ==================== CLASSES ====================
masterRouter.get("/classes", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const classes = await prisma.class.findMany({
      include: {
        academicYear: true,
        teacherAssignments: {
          where: { assignmentType: { code: "HOMEROOM_TEACHER" }, isActive: true },
          include: { teacher: true },
        },
        _count: {
          select: { studentMemberships: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    const transformed = classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      academicYear: c.academicYear.name,
      capacity: c.capacity,
      studentCount: c._count.studentMemberships,
      homeroomTeacherId: c.teacherAssignments[0]?.teacherId || "",
      homeroomTeacher: c.teacherAssignments[0]?.teacher?.fullName || "Belum Ditentukan",
      room: `Ruang ${c.name}`,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ==================== SUBJECTS ====================
masterRouter.get("/subjects", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const subjects = await prisma.subject.findMany({
      include: {
        teacherSubjects: { include: { teacher: true } },
      },
      orderBy: { code: "asc" },
    });

    const transformed = subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category as any,
      gradeLevels: [7, 8, 9],
      kkm: s.kkm,
      teacherId: s.teacherSubjects[0]?.teacherId || "",
      teacherName: s.teacherSubjects[0]?.teacher?.fullName || "",
      description: s.description || undefined,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ==================== SCHEDULES ====================
masterRouter.get("/schedules", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const schedules = await prisma.schedule.findMany({
      include: {
        class: true,
        subject: true,
        teacher: true,
        academicYear: true,
      },
    });

    const transformed = schedules.map((s) => ({
      id: s.id,
      day: s.dayOfWeek as any,
      startTime: s.startTime,
      endTime: s.endTime,
      classId: s.classId,
      className: s.class.name,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      teacherId: s.teacherId,
      teacherName: s.teacher.fullName,
      room: s.room,
      academicYear: s.academicYear.name,
      semester: "Ganjil" as const,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// ==================== EXTRACURRICULARS ====================
masterRouter.get("/extracurriculars", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const ekskuls = await prisma.extracurricular.findMany({
      include: {
        leadTeacher: true,
        members: { include: { student: true } },
      },
    });

    const transformed = ekskuls.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category as any,
      leadTeacherId: e.leadTeacherId || "",
      leadTeacherName: e.leadTeacher?.fullName || "",
      scheduleDay: e.scheduleDay as any,
      scheduleTime: e.scheduleTime,
      location: e.location,
      memberStudentIds: e.members.map((m) => m.studentId),
      memberCount: e.members.length,
      description: e.description || "",
      academicYear: "2025/2026",
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
