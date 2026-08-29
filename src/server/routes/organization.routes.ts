import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";

export const organizationRouter = Router();

// Public: Get all active organization structure items in hierarchical/ordered list
organizationRouter.get("/public", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database tidak terhubung.", fallback: true });
      return;
    }

    const items = await prisma.organizationStructure.findMany({
      where: { isActive: true },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            nip: true,
            teacherAssignments: {
              where: { isActive: true },
              include: { assignmentType: true },
            },
            teacherSubjects: {
              include: { subject: true },
            },
          },
        },
      },
      orderBy: [{ level: "asc" }, { order: "asc" }],
    });

    const formatted = items.map((item) => {
      const duties: string[] = [];
      if (item.teacher) {
        if (item.teacher.teacherSubjects?.length) {
          const subjects = item.teacher.teacherSubjects.map((ts) => ts.subject.name).join(", ");
          duties.push(`Guru ${subjects}`);
        }
        if (item.teacher.teacherAssignments?.length) {
          item.teacher.teacherAssignments.forEach((ta) => duties.push(ta.assignmentType.name));
        }
      }

      return {
        id: item.id,
        name: item.name,
        position: item.position,
        department: item.department || "Pimpinan",
        level: item.level,
        parentId: item.parentId,
        teacherId: item.teacherId,
        teacherName: item.teacher?.fullName,
        description: item.description,
        photo: item.photo || item.teacher?.photo || "",
        order: item.order,
        isActive: item.isActive,
        assignmentsSummary: duties.length > 0 ? duties : undefined,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat struktur organisasi.", error });
  }
});

// Admin: Create organization position
organizationRouter.post("/create", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, position, department, level = 1, parentId, teacherId, description, photo, order = 0 } = req.body;

    if (!name || !position) {
      res.status(400).json({ success: false, message: "Nama pejabat dan jabatan wajib diisi." });
      return;
    }

    const created = await prisma.organizationStructure.create({
      data: {
        name,
        position,
        department: department || "Pimpinan",
        level: Number(level),
        parentId: parentId || null,
        teacherId: teacherId || null,
        description,
        photo,
        order: Number(order),
        isActive: true,
      },
    });

    res.json({ success: true, message: "Posisi struktur organisasi berhasil ditambahkan.", data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambahkan posisi struktur organisasi.", error });
  }
});

// Admin: Update organization item
organizationRouter.put("/update/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, position, department, level, parentId, teacherId, description, photo, order, isActive } = req.body;

    const updated = await prisma.organizationStructure.update({
      where: { id },
      data: {
        name,
        position,
        department,
        level: level !== undefined ? Number(level) : undefined,
        parentId: parentId === "" ? null : parentId,
        teacherId: teacherId === "" ? null : teacherId,
        description,
        photo,
        order: order !== undefined ? Number(order) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.json({ success: true, message: "Struktur organisasi berhasil diperbarui.", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui struktur organisasi.", error });
  }
});

// Admin: Delete organization item
organizationRouter.delete("/delete/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.organizationStructure.delete({ where: { id } });
    res.json({ success: true, message: "Posisi struktur organisasi berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus struktur organisasi.", error });
  }
});
