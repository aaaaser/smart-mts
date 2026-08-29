import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { QuestionType, DifficultyLevel, CognitiveLevel } from "@prisma/client";

export const questionsRouter = Router();

// GET all questions
questionsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const { subjectId } = req.query;
    const whereClause: any = {};
    if (subjectId && typeof subjectId === "string") whereClause.subjectId = subjectId;

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        subject: true,
        options: true,
        learningOutcome: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = questions.map((q) => ({
      id: q.id,
      subjectId: q.subjectId,
      subjectName: q.subject.name,
      cpKdId: q.learningOutcomeId || undefined,
      difficulty: q.difficulty.toLowerCase() as any,
      cognitiveLevel: q.cognitiveLevel,
      type: q.type === "MULTIPLE_CHOICE" ? ("multiple_choice" as const) : ("essay" as const),
      questionText: q.questionText,
      options: q.options.map((o) => ({ id: o.optionKey, text: o.optionText, isCorrect: o.isCorrect })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || undefined,
      points: q.points,
      indicator: q.indicator || undefined,
      createdAt: q.createdAt.toISOString(),
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST create question
questionsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subjectId,
      cpKdId,
      type = "multiple_choice",
      difficulty = "sedang",
      cognitiveLevel = "C3",
      questionText,
      options,
      correctAnswer,
      explanation,
      points = 10,
    } = req.body;

    if (!subjectId || !questionText) {
      res.status(400).json({ success: false, message: "Mata pelajaran dan teks soal wajib diisi." });
      return;
    }

    const newQ = await prisma.question.create({
      data: {
        subjectId,
        learningOutcomeId: cpKdId || null,
        type: type === "multiple_choice" ? QuestionType.MULTIPLE_CHOICE : QuestionType.ESSAY,
        difficulty:
          difficulty === "hots"
            ? DifficultyLevel.HOTS
            : difficulty === "sulit"
            ? DifficultyLevel.SULIT
            : difficulty === "mudah"
            ? DifficultyLevel.MUDAH
            : DifficultyLevel.SEDANG,
        cognitiveLevel: (cognitiveLevel as CognitiveLevel) || CognitiveLevel.C3,
        questionText,
        correctAnswer: typeof correctAnswer === "string" ? correctAnswer : JSON.stringify(correctAnswer || "A"),
        explanation: explanation || null,
        points: Number(points) || 10,
        options: {
          create: (options || []).map((o: any) => ({
            optionKey: o.id || "A",
            optionText: o.text || "",
            isCorrect: o.id === correctAnswer || !!o.isCorrect,
          })),
        },
      },
      include: { options: true },
    });

    res.status(201).json({ success: true, data: newQ, message: "Soal berhasil disimpan ke bank soal." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
