import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const gradesRouter = Router();

// GET all grades
gradesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const { studentId, classId, subjectId } = req.query;
    const whereClause: any = {};
    if (studentId && typeof studentId === "string") whereClause.studentId = studentId;
    if (classId && typeof classId === "string") whereClause.classId = classId;
    if (subjectId && typeof subjectId === "string") whereClause.subjectId = subjectId;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: true,
        subject: true,
        class: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const transformed = grades.map((g) => {
      let dailyScores: number[] = [80];
      let assignmentScores: number[] = [85];
      let practicalScores: number[] = [80];

      try {
        dailyScores = JSON.parse(g.dailyScores);
      } catch {
        // default
      }
      try {
        assignmentScores = JSON.parse(g.assignmentScores);
      } catch {
        // default
      }
      try {
        practicalScores = JSON.parse(g.practicalScores);
      } catch {
        // default
      }

      return {
        id: g.id,
        studentId: g.studentId,
        studentName: g.student.fullName,
        subjectId: g.subjectId,
        subjectName: g.subject.name,
        classId: g.classId,
        className: g.class.name,
        academicYear: "2025/2026",
        semester: "Ganjil" as const,
        dailyScores,
        assignmentScores,
        practicalScores,
        midtermScore: g.midtermScore,
        finalScore: g.finalScore,
        finalCalculatedGrade: g.finalCalculatedGrade,
        predicate: (g.predicate as any) || "B",
        competencyDescription: g.competencyDescription || "Telah menguasai materi dengan baik.",
        isRemedial: g.isRemedial,
        status: g.status === "tuntas" ? ("tuntas" as const) : ("belum_tuntas" as const),
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET grade weights (Daily 40%, Midterm 25%, Final 35%)
gradesRouter.get("/weights", async (req: Request, res: Response): Promise<void> => {
  try {
    const weights = await prisma.gradeWeight.findFirst();
    res.json({
      success: true,
      data: weights
        ? { daily: weights.dailyWeight, midterm: weights.midtermWeight, finalExam: weights.finalWeight }
        : { daily: 40, midterm: 25, finalExam: 35 },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// PUT update grade weights
gradesRouter.put("/weights", async (req: Request, res: Response): Promise<void> => {
  try {
    const { daily = 40, midterm = 25, finalExam = 35 } = req.body;

    const existing = await prisma.gradeWeight.findFirst();
    if (existing) {
      await prisma.gradeWeight.update({
        where: { id: existing.id },
        data: {
          dailyWeight: Number(daily),
          midtermWeight: Number(midterm),
          finalWeight: Number(finalExam),
        },
      });
    } else {
      await prisma.gradeWeight.create({
        data: {
          dailyWeight: Number(daily),
          midtermWeight: Number(midterm),
          finalWeight: Number(finalExam),
        },
      });
    }

    res.json({ success: true, message: "Bobot nilai berhasil diperbarui di PostgreSQL." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
