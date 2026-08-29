import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { ExamCategory, ExamStatus, AttemptStatus } from "@prisma/client";

export const examsRouter = Router();

// GET all exams
examsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const exams = await prisma.exam.findMany({
      include: {
        subject: true,
        teacher: true,
        questions: { include: { question: true } },
        attempts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = exams.map((e) => {
      let classIds: string[] = [];
      try {
        classIds = JSON.parse(e.classIds);
      } catch {
        classIds = [];
      }

      return {
        id: e.id,
        title: e.title,
        category: e.category as any,
        subjectId: e.subjectId,
        subjectName: e.subject.name,
        teacherId: e.teacherId,
        teacherName: e.teacher.fullName,
        classIds,
        date: e.date.toISOString().split("T")[0],
        startTime: e.startTime,
        endTime: e.endTime,
        durationMinutes: e.durationMinutes,
        passingGrade: e.passingGrade,
        questionIds: e.questions.map((q) => q.questionId),
        randomizeQuestions: e.randomizeQuestions,
        randomizeOptions: e.randomizeOptions,
        maxAttempts: e.maxAttempts,
        showResultAfterSubmit: e.showResultAfterSubmit,
        showExplanation: e.showExplanation,
        status: e.status.toLowerCase() as any,
        academicYear: "2025/2026",
        semester: "Ganjil" as const,
        attemptCount: e.attempts.length,
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET all exam attempts
examsRouter.get("/attempts", async (req: Request, res: Response): Promise<void> => {
  try {
    const attempts = await prisma.examAttempt.findMany({
      include: {
        student: true,
        exam: { include: { subject: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    const transformed = attempts.map((a) => ({
      id: a.id,
      examId: a.examId,
      studentId: a.studentId,
      studentName: a.student.fullName,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString(),
      answers: {},
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      status: a.status.toLowerCase() as any,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST submit exam attempt
examsRouter.post("/attempts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { examId, studentId, answers, score, maxScore = 100, passed } = req.body;

    if (!examId || !studentId) {
      res.status(400).json({ success: false, message: "examId dan studentId wajib diisi." });
      return;
    }

    const calculatedScore = Number(score) || 0;
    const isPassed = passed !== undefined ? passed : calculatedScore >= 75;

    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        score: calculatedScore,
        maxScore: Number(maxScore) || 100,
        percentage: calculatedScore,
        passed: isPassed,
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        student: true,
        exam: true,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userName: attempt.student.fullName,
        userRole: "STUDENT",
        action: "SUBMIT_EXAM",
        details: `Siswa menyelesaikan ujian "${attempt.exam.title}" dengan nilai ${calculatedScore}`,
        ipOrDevice: req.ip || "127.0.0.1",
      },
    });

    res.status(201).json({ success: true, data: attempt, message: "Ujian berhasil diselesaikan dan disimpan." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
