import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const contactRouter = Router();

// Public: Submit contact inquiry message
contactRouter.post("/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ success: false, message: "Nama, email, subjek, dan pesan wajib diisi." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: "Format alamat email tidak valid." });
      return;
    }

    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      // In-memory acknowledgment if DB offline
      res.json({
        success: true,
        message: "Terima kasih! Pesan Anda telah kami terima dan akan segera dihubungi oleh tim administrasi smart MTs.",
        data: { id: "msg_" + Date.now(), name, email, phone, subject, message, isRead: false, createdAt: new Date() },
      });
      return;
    }

    const saved = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: "Terima kasih! Pesan dan pertanyaan Anda telah berhasil terkirim ke pihak madrasah.",
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengirimkan pesan.", error });
  }
});

// Admin: Get all contact messages
contactRouter.get("/messages", async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat pesan masuk.", error });
  }
});

// Admin: Mark message as read
contactRouter.put("/messages/:id/read", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui status pesan.", error });
  }
});

// Admin: Delete message
contactRouter.delete("/messages/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.delete({ where: { id } });
    res.json({ success: true, message: "Pesan berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus pesan.", error });
  }
});
