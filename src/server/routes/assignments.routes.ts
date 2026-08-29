import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { AssignmentStatus, SubmissionStatus } from "@prisma/client";

export const assignmentsRouter = Router();

// GET all assignments
assignmentsRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const { classId, teacherId } = req.query;
    const whereClause: any = {};
    if (classId && typeof classId === "string") whereClause.classId = classId;
    if (teacherId && typeof teacherId === "string") whereClause.teacherId = teacherId;

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: true,
        class: true,
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      subjectId: a.subjectId,
      subjectName: a.subject.name,
      classId: a.classId,
      className: a.class.name,
      teacherId: a.teacherId,
      teacherName: a.teacher.fullName,
      topic: a.title,
      description: a.description,
      instructions: a.instructions || "",
      deadline: a.deadline.toISOString(),
      maxPoints: a.maxScore,
      weight: 20,
      submissionType: "both" as const,
      status: a.status.toLowerCase() as any,
      createdAt: a.createdAt.toISOString(),
      submissionCount: a.submissions.length,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// GET all submissions
assignmentsRouter.get("/submissions", async (req: Request, res: Response): Promise<void> => {
  try {
    const submissions = await prisma.assignmentSubmission.findMany({
      include: {
        student: true,
        assignment: { include: { subject: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const transformed = submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      studentId: s.studentId,
      studentName: s.student.fullName,
      submittedAt: s.submittedAt.toISOString(),
      textContent: s.answerText || undefined,
      fileName: s.file || undefined,
      score: s.score || undefined,
      feedback: s.feedback || undefined,
      status: s.status.toLowerCase() as any,
    }));

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST create assignment
assignmentsRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subjectId, classId, teacherId, description, instructions, deadline, maxPoints = 100 } = req.body;

    if (!title || !subjectId || !classId || !teacherId) {
      res.status(400).json({ success: false, message: "Judul, mapel, kelas, dan guru wajib diisi." });
      return;
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        title,
        subjectId,
        classId,
        teacherId,
        description: description || title,
        instructions: instructions || null,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 86400000),
        maxScore: Number(maxPoints) || 100,
        status: AssignmentStatus.ACTIVE,
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
    });

    res.status(201).json({ success: true, data: newAssignment, message: "Tugas berhasil dibuat dan dibagikan ke siswa." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
