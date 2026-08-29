import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const curriculumRouter = Router();

// GET all CP / KD / Learning Outcomes
curriculumRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const learningOutcomes = await prisma.learningOutcome.findMany({
      include: {
        subject: true,
        curriculum: true,
        learningObjectives: true,
      },
    });

    const transformed = learningOutcomes.map((lo) => ({
      id: lo.id,
      subjectId: lo.subjectId,
      subjectName: lo.subject.name,
      curriculum: lo.curriculum?.curriculumType === "K13" ? ("k13" as const) : ("merdeka" as const),
      curriculumType: lo.curriculum?.curriculumType === "K13" ? ("k13" as const) : ("merdeka" as const),
      code: lo.code,
      title: lo.title,
      phase: lo.phase || "Fase D",
      gradeLevel: lo.gradeLevel || 7,
      topic: lo.topic || lo.title,
      elementOrCoreCompetency: lo.element || "Capaian Pembelajaran",
      description: lo.description || "",
      learningObjectives: lo.learningObjectives.map((tp) => `${tp.code}: ${tp.statement}`),
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
