import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { ReportCardStatus } from "@prisma/client";

export const raporRouter = Router();

// GET all report cards
raporRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database offline" });
      return;
    }

    const { classId, studentId } = req.query;
    const whereClause: any = {};
    if (classId && typeof classId === "string") whereClause.classId = classId;
    if (studentId && typeof studentId === "string") whereClause.studentId = studentId;

    const reportCards = await prisma.reportCard.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true,
        reportCardSubjects: { include: { subject: true } },
      },
    });

    const transformed = reportCards.map((rc) => {
      let extracurriculars: any[] = [];
      let achievements: any[] = [];
      let physicalData: any = {
        heightCm: 155,
        weightKg: 48,
        hearingHealth: "Baik",
        visionHealth: "Baik",
        dentalHealth: "Baik",
      };

      try {
        if (rc.extracurriculars) extracurriculars = JSON.parse(rc.extracurriculars);
      } catch {
        // default
      }
      try {
        if (rc.achievements) achievements = JSON.parse(rc.achievements);
      } catch {
        // default
      }
      try {
        if (rc.physicalData) physicalData = JSON.parse(rc.physicalData);
      } catch {
        // default
      }

      return {
        id: rc.id,
        studentId: rc.studentId,
        studentName: rc.student.fullName,
        classId: rc.classId,
        className: rc.class.name,
        academicYear: "2025/2026",
        semester: "Ganjil" as const,
        issueDate: rc.issueDate.toISOString().split("T")[0],
        issuePlace: rc.issuePlace,
        attendanceSummary: {
          hadir: rc.attendanceHadir,
          sakit: rc.attendanceSakit,
          izin: rc.attendanceIzin,
          alpa: rc.attendanceAlpa,
        },
        extracurriculars,
        achievements,
        physicalData,
        homeroomNotes: rc.homeroomNotes || "Tingkatkan terus semangat belajar dan kedisiplinan beribadah.",
        status: rc.status === ReportCardStatus.FINALIZED ? ("finalized" as const) : ("draft" as const),
        finalizedAt: rc.finalizedAt?.toISOString(),
        subjects: rc.reportCardSubjects.map((rs) => ({
          subjectId: rs.subjectId,
          subjectName: rs.subject.name,
          finalScore: rs.finalScore,
          predicate: rs.predicate,
          description: rs.description,
        })),
      };
    });

    res.json({ success: true, data: transformed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});

// POST finalize report card (Transaction)
raporRouter.post("/:id/finalize", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.$transaction(async (tx) => {
      const updated = await tx.reportCard.update({
        where: { id },
        data: {
          status: ReportCardStatus.FINALIZED,
          finalizedAt: new Date(),
        },
        include: { student: true, class: true },
      });

      await tx.auditLog.create({
        data: {
          userName: "Wali Kelas",
          userRole: "TEACHER",
          action: "FINALIZE_REPORT_CARD",
          details: `Finalisasi Buku E-Rapor Digital untuk siswa ${updated.student.fullName} (${updated.class.name})`,
          ipOrDevice: req.ip || "127.0.0.1",
        },
      });

      return updated;
    });

    res.json({ success: true, data: report, message: "E-Rapor berhasil difinalisasi." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message });
  }
});
