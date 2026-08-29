import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import { authRouter } from "./src/server/routes/auth.routes";
import { usersRouter } from "./src/server/routes/users.routes";
import { dutiesRouter } from "./src/server/routes/duties.routes";
import { attendanceRouter } from "./src/server/routes/attendance.routes";
import { masterRouter } from "./src/server/routes/master.routes";
import { curriculumRouter } from "./src/server/routes/curriculum.routes";
import { questionsRouter } from "./src/server/routes/questions.routes";
import { examsRouter } from "./src/server/routes/exams.routes";
import { assignmentsRouter } from "./src/server/routes/assignments.routes";
import { gradesRouter } from "./src/server/routes/grades.routes";
import { raporRouter } from "./src/server/routes/rapor.routes";
import { systemRouter } from "./src/server/routes/system.routes";
import { blogRouter } from "./src/server/routes/blog.routes";
import { organizationRouter } from "./src/server/routes/organization.routes";
import { contactRouter } from "./src/server/routes/contact.routes";
import { publicRouter } from "./src/server/routes/public.routes";
import { checkDatabaseConnection } from "./src/lib/prisma";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

// ----------------------------------------------------
// DATABASE BACKEND API ROUTES (PostgreSQL + Prisma)
// ----------------------------------------------------
app.use("/api/public", publicRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/duties", dutiesRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/master", masterRouter);
app.use("/api/curriculum", curriculumRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/exams", examsRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/grades", gradesRouter);
app.use("/api/rapor", raporRouter);
app.use("/api/system", systemRouter);
app.use("/api/blog", blogRouter);
app.use("/api/organization", organizationRouter);
app.use("/api/contact", contactRouter);

// Lazy initialize GenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ----------------------------------------------------
// AI SERVICES (GEMINI API)
// ----------------------------------------------------

// AI Service: Question Generator
app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const { subject, grade, curriculum, topic, cpKd, count = 5, questionType = "multiple_choice", difficulty = "medium", cognitiveLevel = "C3" } = req.body;
    const ai = getGenAI();

    const prompt = `Anda adalah ahli kurikulum dan pembuat instrumen evaluasi pendidikan di Indonesia (${curriculum || "Kurikulum Merdeka"}).
Buatkan draft bank soal berkualitas tinggi dengan spesifikasi berikut:
- Mata Pelajaran: ${subject}
- Tingkat/Kelas: ${grade}
- Topik/Materi: ${topic}
- CP / KD: ${cpKd || "Sesuai standar capaian pembelajaran nasional"}
- Jumlah Soal: ${count}
- Tipe Soal: ${questionType} (options: multiple_choice, essay, true_false, matching, complex_mcq)
- Tingkat Kesulitan: ${difficulty} (mudah, sedang, sulit, HOTS)
- Level Kognitif Bloom: ${cognitiveLevel} (C1-C6)

Kembalikan jawaban HANYA dalam format JSON valid dengan struktur:
{
  "questions": [
    {
      "id": "q_1",
      "questionText": "Teks soal lengkap dan jelas...",
      "type": "${questionType}",
      "cognitiveLevel": "${cognitiveLevel}",
      "difficulty": "${difficulty}",
      "points": 10,
      "options": [
        {"id": "A", "text": "Pilihan A"},
        {"id": "B", "text": "Pilihan B"},
        {"id": "C", "text": "Pilihan C"},
        {"id": "D", "text": "Pilihan D"}
      ],
      "correctAnswer": "A",
      "explanation": "Pembahasan rinci mengapa jawaban tersebut benar...",
      "indicator": "Indikator soal..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      data = JSON.parse(cleanJson);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating questions:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to generate questions" });
  }
});

// AI Service: Report Card Notes Generator (Deskripsi Capaian Kompetensi)
app.post("/api/ai/generate-report-notes", async (req, res) => {
  try {
    const { studentName, subject, finalScore, highestTopic, lowestTopic, studentTraits } = req.body;
    const ai = getGenAI();

    const prompt = `Sebagai Guru dan Wali Kelas profesional, buatkan narasi deskripsi capaian kompetensi rapor (Kurikulum Merdeka / K13) untuk siswa:
- Nama Siswa: ${studentName}
- Mata Pelajaran: ${subject}
- Nilai Akhir: ${finalScore}
- Materi yang sangat dikuasai: ${highestTopic || "Pemahaman materi konsep utama"}
- Materi yang perlu bimbingan/ditingkatkan: ${lowestTopic || "Penerapan analisis lanjutan"}
- Catatan Karakter/Perilaku: ${studentTraits || "Disiplin dan aktif"}

Buat 2 bagian deskripsi:
1. Deskripsi Capaian Kompetensi Mata Pelajaran (ringkas, positif, konstruktif, 2-3 kalimat formal untuk buku rapor).
2. Catatan Perkembangan Karakter Wali Kelas (motivatif, membangun karakter profil pelajar Pancasila).

Format JSON:
{
  "subjectDescription": "...",
  "homeroomTeacherNotes": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      data = JSON.parse(cleanJson);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error generating report notes:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to generate report notes" });
  }
});

// AI Service: Exam Analysis & Remedial Suggestions
app.post("/api/ai/analyze-exam-results", async (req, res) => {
  try {
    const { examTitle, subject, className, averageScore, passingGrade, passingCount, failedCount, lowScoringQuestions } = req.body;
    const ai = getGenAI();

    const prompt = `Analisis hasil evaluasi ujian berikut dan berikan rekomendasi pedagogik serta modul remedial:
- Judul Ujian: ${examTitle}
- Mapel & Kelas: ${subject} - ${className}
- Nilai Rata-rata: ${averageScore} (KKM/KKTP: ${passingGrade})
- Jumlah Siswa Tuntas: ${passingCount}
- Jumlah Siswa Belum Tuntas: ${failedCount}
- Soal dengan tingkat kesalahan tinggi: ${JSON.stringify(lowScoringQuestions || [])}

Berikan analisis terstruktur dalam format JSON:
{
  "summary": "Ringkasan evaluasi hasil ujian...",
  "difficultyAssessment": "Analisis daya serap dan kesulitan konsep...",
  "remedialStrategy": "Langkah konkret remedial perorangan & kelompok...",
  "enrichmentStrategy": "Program pengayaan untuk siswa tuntas...",
  "keyTopicsToReTeach": ["Topik 1", "Topik 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      data = JSON.parse(cleanJson);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error analyzing exam:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to analyze exam results" });
  }
});

// AI Service: Teaching Assistant Interactive Chat
app.post("/api/ai/chat-assistant", async (req, res) => {
  try {
    const { messages, userRole = "guru", userContext } = req.body;
    const ai = getGenAI();

    const formattedHistory = (messages || []).map((m: any) => `${m.role === "user" ? "Pengguna" : "smart MTs AI"}: ${m.content}`).join("\n");
    const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : "Halo smart MTs AI";

    const prompt = `Anda adalah "smart MTs AI Assistant" — asisten cerdas untuk madrasah tsanawiyah di Indonesia.
Peran pengguna: ${userRole}.
Konteks pengguna: ${JSON.stringify(userContext || {})}.
Anda ahli dalam Kurikulum Merdeka & K13 Kemenag/Kemdikbud, pembuatan modul ajar, kisi-kisi soal HOTS, rubrik asesmen, strategi remedial, dan administrasi guru/wali kelas.

Riwayat Percakapan:
${formattedHistory}

Pesan Terakhir:
${lastUserMessage}

Tanggapi dengan ramah, profesional, praktis, dan berikan solusi langsung yang dapat disalin atau diterapkan oleh guru/admin/siswa.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error("Error in AI chat assistant:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to contact AI Assistant" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  res.json({
    status: "ok",
    app: "smart MTs (sMTs)",
    database: {
      type: "PostgreSQL",
      name: "smts_db",
      connected: dbStatus.connected,
      error: dbStatus.error,
    },
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`smart MTs (sMTs) server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
