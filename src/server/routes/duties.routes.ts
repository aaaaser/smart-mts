import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { AssignmentTypeCategory } from "@prisma/client";

export const dutiesRouter = Router();

// GET all duties
dutiesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const { teacherId } = req.query;

    const whereClause: any = {};
    if (teacherId && typeof teacherId === "string") {
      whereClause.teacherId = teacherId;
    }

    const duties = await prisma.teacherAssignment.findMany({
      where: whereClause,
      include: {
        teacher: { include: { user: true } },
        assignmentType: true,
        class: true,
        extracurricular: true,
        academicYear: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = duties.map((d) => {
      let typeCode: string = "tugas_lain";
      if (d.assignmentType.code === "HOMEROOM_TEACHER") typeCode = "wali_kelas";
      if (d.assignmentType.code === "DUTY_TEACHER") typeCode = "guru_piket";
      if (d.assignmentType.code === "EXTRACURRICULAR_COACH") typeCode = "pembina_ekskul";
      if (d.assignmentType.code === "COORDINATOR") typeCode = "koordinator";

      return {
        id: d.id,
        teacherId: d.teacherId,
        teacherName: d.teacher.fullName,
        type: typeCode,
        assignmentType: typeCode,
        title: d.name,
        assignmentName: d.name,
        classId: d.classId || undefined,
        className: d.class?.name || undefined,
        day: d.dayOfWeek || undefined,
        piketDay: d.dayOfWeek || undefined,
        startTime: d.startTime || undefined,
        endTime: d.endTime || undefined,
        location: d.location || undefined,
        ekskulId: d.extracurricularId || undefined,
        ekskulName: d.extracurricular?.name || undefined,
        academicYear: d.academicYear.name,
        academicYearId: d.academicYearId,
        status: d.status,
        isActive: d.isActive,
        notes: d.notes || undefined,
        createdAt: d.createdAt.toISOString(),
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST create a new teacher duty assignment
dutiesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      teacherId,
      type, // "wali_kelas" | "guru_piket" | "pembina_ekskul" | "koordinator" | "tugas_lain"
      title,
      classId,
      day,
      startTime,
      endTime,
      location,
      ekskulId,
      notes,
    } = req.body;

    if (!teacherId || !type || !title) {
      res.status(400).json({ success: false, message: "Guru, jenis tugas, dan judul penugasan wajib diisi." });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    // Map type to AssignmentTypeCategory enum
    let category: AssignmentTypeCategory = AssignmentTypeCategory.OTHER;
    if (type === "wali_kelas") category = AssignmentTypeCategory.HOMEROOM_TEACHER;
    if (type === "guru_piket") category = AssignmentTypeCategory.DUTY_TEACHER;
    if (type === "pembina_ekskul") category = AssignmentTypeCategory.EXTRACURRICULAR_COACH;
    if (type === "koordinator") category = AssignmentTypeCategory.COORDINATOR;

    // Find or create TeacherAssignmentType
    let assignmentType = await prisma.teacherAssignmentType.findUnique({
      where: { code: category },
    });

    if (!assignmentType) {
      assignmentType = await prisma.teacherAssignmentType.create({
        data: {
          code: category,
          name:
            category === "HOMEROOM_TEACHER"
              ? "Wali Kelas"
              : category === "DUTY_TEACHER"
              ? "Guru Piket"
              : category === "EXTRACURRICULAR_COACH"
              ? "Pembina Ekstrakurikuler"
              : category === "COORDINATOR"
              ? "Koordinator"
              : "Tugas Lain",
        },
      });
    }

    // Get active academic year
    const activeAY = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    if (!activeAY) {
      res.status(400).json({ success: false, message: "Tahun ajaran aktif belum ditentukan." });
      return;
    }

    const newDuty = await prisma.teacherAssignment.create({
      data: {
        teacherId,
        assignmentTypeId: assignmentType.id,
        name: title,
        classId: classId || null,
        extracurricularId: ekskulId || null,
        dayOfWeek: day || null,
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        academicYearId: activeAY.id,
        status: "aktif",
        isActive: true,
        notes: notes || null,
      },
      include: {
        teacher: true,
        assignmentType: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userName: newDuty.teacher.fullName,
        userRole: "TEACHER",
        action: "CREATE_TEACHER_DUTY",
        details: `Penugasan tugas tambahan baru: "${title}" (${assignmentType.name}) untuk guru ${newDuty.teacher.fullName}`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    res.status(201).json({ success: true, data: newDuty, message: "Penugasan guru berhasil ditambahkan." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// Toggle duty status
dutiesRouter.patch("/:id/toggle", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const duty = await prisma.teacherAssignment.findUnique({ where: { id } });
    if (!duty) {
      res.status(404).json({ success: false, message: "Penugasan tidak ditemukan" });
      return;
    }

    const updated = await prisma.teacherAssignment.update({
      where: { id },
      data: {
        isActive: !duty.isActive,
        status: !duty.isActive ? "aktif" : "tidak_aktif",
      },
    });

    res.json({ success: true, data: updated, message: "Status penugasan berhasil diperbarui." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// DELETE duty
dutiesRouter.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.teacherAssignment.delete({ where: { id } });
    res.json({ success: true, message: "Penugasan berhasil dihapus." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
