import { Router, Request, Response } from "express";
import { prisma, checkDatabaseConnection } from "../../lib/prisma";
import { BlogStatus } from "@prisma/client";

export const blogRouter = Router();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// --------------------------------------------------------
// 1. PUBLIC BLOG ENDPOINTS (No Login Required)
// --------------------------------------------------------

// Public: Get published blog posts with search, category filter, pagination
blogRouter.get("/public", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database tidak terhubung.", fallback: true });
      return;
    }

    const { q, category, tag, page = "1", limit = "9", featured } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 9);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      status: BlogStatus.PUBLISHED,
    };

    if (q) {
      const searchTerm = String(q).trim();
      whereClause.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { excerpt: { contains: searchTerm, mode: "insensitive" } },
        { content: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      whereClause.category = {
        slug: String(category),
      };
    }

    if (tag) {
      whereClause.postTags = {
        some: {
          tag: {
            slug: String(tag),
          },
        },
      };
    }

    if (featured === "true") {
      whereClause.isFeatured = true;
    }

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where: whereClause }),
      prisma.blogPost.findMany({
        where: whereClause,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              username: true,
              role: true,
              teacher: {
                select: {
                  fullName: true,
                  photo: true,
                  nip: true,
                },
              },
            },
          },
          postTags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limitNum,
      }),
    ]);

    // Format posts for clean frontend consumption
    const formatted = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage,
      status: p.status.toLowerCase(),
      views: p.views,
      isFeatured: p.isFeatured,
      publishedAt: p.publishedAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      authorId: p.authorId,
      authorName: p.author.teacher?.fullName || p.author.username,
      authorRole: p.author.role,
      authorAvatar: p.author.teacher?.photo || "",
      authorNip: p.author.teacher?.nip || "",
      tags: p.postTags.map((pt) => pt.tag.name),
    }));

    res.json({
      success: true,
      data: formatted,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat artikel blog publik.", error });
  }
});

// Public: Get single blog post by slug & increment views
blogRouter.get("/public/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      res.status(503).json({ success: false, message: "Database tidak terhubung.", fallback: true });
      return;
    }

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            teacher: {
              select: {
                fullName: true,
                photo: true,
                nip: true,
                employmentStatus: true,
                teacherAssignments: {
                  where: { isActive: true },
                  include: { assignmentType: true },
                },
              },
            },
          },
        },
        postTags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post || post.status !== BlogStatus.PUBLISHED) {
      res.status(404).json({ success: false, message: "Artikel tidak ditemukan atau belum dipublikasikan." });
      return;
    }

    // Increment view count asynchronously
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    // Related posts in same category
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        categoryId: post.categoryId,
        status: BlogStatus.PUBLISHED,
        id: { not: post.id },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
      },
    });

    const formatted = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      status: post.status.toLowerCase(),
      views: post.views + 1,
      isFeatured: post.isFeatured,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      categoryId: post.categoryId,
      categoryName: post.category.name,
      categorySlug: post.category.slug,
      authorId: post.authorId,
      authorName: post.author.teacher?.fullName || post.author.username,
      authorRole: post.author.role,
      authorAvatar: post.author.teacher?.photo || "",
      authorNip: post.author.teacher?.nip || "",
      authorDuties: post.author.teacher?.teacherAssignments.map((ta) => ta.assignmentType.name) || [],
      tags: post.postTags.map((pt) => pt.tag.name),
      relatedPosts,
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat detail artikel.", error });
  }
});

// Public: Get all blog categories with post count
blogRouter.get("/categories", async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: { status: BlogStatus.PUBLISHED },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      count: c._count.posts,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat kategori blog.", error });
  }
});

// Public: Get all blog tags
blogRouter.get("/tags", async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat tag blog.", error });
  }
});

// --------------------------------------------------------
// 2. TEACHER BLOG ENDPOINTS (Requires Teacher/Admin Role)
// --------------------------------------------------------

// Teacher: Get own posts (all statuses)
blogRouter.get("/teacher/my-posts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { authorId, status } = req.query;
    if (!authorId) {
      res.status(400).json({ success: false, message: "Author ID wajib disertakan." });
      return;
    }

    const whereClause: any = {
      authorId: String(authorId),
    };

    if (status && status !== "all") {
      whereClause.status = (status as string).toUpperCase() as BlogStatus;
    }

    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      include: {
        category: true,
        postTags: { include: { tag: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage,
      status: p.status.toLowerCase(),
      views: p.views,
      isFeatured: p.isFeatured,
      submittedAt: p.submittedAt,
      publishedAt: p.publishedAt,
      rejectedAt: p.rejectedAt,
      rejectionReason: p.rejectionReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      tags: p.postTags.map((pt) => pt.tag.name),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat artikel guru.", error });
  }
});

// Teacher/Admin: Create new blog post (Draft or Submitted)
blogRouter.post("/create", async (req: Request, res: Response): Promise<void> => {
  try {
    const { authorId, categoryId, title, excerpt, content, coverImage, tags = [], submitForReview = false } = req.body;

    if (!authorId || !categoryId || !title || !content) {
      res.status(400).json({ success: false, message: "Judul, kategori, dan isi artikel wajib diisi." });
      return;
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.blogPost.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const status = submitForReview ? BlogStatus.SUBMITTED : BlogStatus.DRAFT;
    const submittedAt = submitForReview ? new Date() : null;

    const post = await prisma.blogPost.create({
      data: {
        authorId,
        categoryId,
        title,
        slug: finalSlug,
        excerpt: excerpt || content.substring(0, 150) + "...",
        content,
        coverImage,
        status,
        submittedAt,
      },
      include: {
        category: true,
      },
    });

    // Handle tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const tagSlug = slugify(tagName);
        let tag = await prisma.blogTag.findUnique({ where: { slug: tagSlug } });
        if (!tag) {
          tag = await prisma.blogTag.create({
            data: { name: tagName.trim(), slug: tagSlug },
          });
        }
        await prisma.blogPostTag.create({
          data: { postId: post.id, tagId: tag.id },
        });
      }
    }

    res.json({
      success: true,
      message: submitForReview
        ? "Artikel berhasil dikirim untuk ditinjau oleh Administrator."
        : "Draft artikel berhasil disimpan.",
      data: post,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal membuat artikel.", error });
  }
});

// Teacher/Admin: Update post
blogRouter.put("/update/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, categoryId, excerpt, content, coverImage, tags, submitForReview } = req.body;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Artikel tidak ditemukan." });
      return;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title && title !== existing.title) {
      updateData.title = title;
      // Recompute slug if title changed and post is not yet published
      if (existing.status !== BlogStatus.PUBLISHED) {
        let baseSlug = slugify(title);
        let finalSlug = baseSlug;
        let counter = 1;
        while (await prisma.blogPost.findFirst({ where: { slug: finalSlug, id: { not: id } } })) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        updateData.slug = finalSlug;
      }
    }

    if (categoryId) updateData.categoryId = categoryId;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (coverImage !== undefined) updateData.coverImage = coverImage;

    if (submitForReview) {
      updateData.status = BlogStatus.SUBMITTED;
      updateData.submittedAt = new Date();
      updateData.rejectionReason = null;
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });

    // Update tags if provided
    if (Array.isArray(tags)) {
      await prisma.blogPostTag.deleteMany({ where: { postId: id } });
      for (const tagName of tags) {
        const tagSlug = slugify(tagName);
        let tag = await prisma.blogTag.findUnique({ where: { slug: tagSlug } });
        if (!tag) {
          tag = await prisma.blogTag.create({
            data: { name: tagName.trim(), slug: tagSlug },
          });
        }
        await prisma.blogPostTag.create({
          data: { postId: id, tagId: tag.id },
        });
      }
    }

    res.json({
      success: true,
      message: submitForReview ? "Artikel berhasil diajukan untuk review." : "Artikel berhasil diperbarui.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui artikel.", error });
  }
});

// Teacher: Submit draft or rejected post for review
blogRouter.post("/submit/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      res.status(404).json({ success: false, message: "Artikel tidak ditemukan." });
      return;
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        status: BlogStatus.SUBMITTED,
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    res.json({
      success: true,
      message: "Artikel berhasil diajukan ke Administrator untuk ditinjau dan dipublikasikan.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengajukan artikel.", error });
  }
});

// --------------------------------------------------------
// 3. ADMIN BLOG MANAGEMENT ENDPOINTS (Review & Workflow)
// --------------------------------------------------------

// Admin: Get all posts with filter (draft, submitted, published, rejected, archived)
blogRouter.get("/admin/all", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, categoryId, q } = req.query;
    const whereClause: any = {};

    if (status && status !== "all") {
      whereClause.status = (status as string).toUpperCase() as BlogStatus;
    }

    if (categoryId && categoryId !== "all") {
      whereClause.categoryId = String(categoryId);
    }

    if (q) {
      const searchTerm = String(q).trim();
      whereClause.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { excerpt: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const posts = await prisma.blogPost.findMany({
      where: whereClause,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            username: true,
            role: true,
            teacher: { select: { fullName: true, photo: true, nip: true } },
          },
        },
        postTags: { include: { tag: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const formatted = posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      coverImage: p.coverImage,
      status: p.status.toLowerCase(),
      views: p.views,
      isFeatured: p.isFeatured,
      submittedAt: p.submittedAt,
      publishedAt: p.publishedAt,
      rejectedAt: p.rejectedAt,
      rejectionReason: p.rejectionReason,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      authorId: p.authorId,
      authorName: p.author.teacher?.fullName || p.author.username,
      authorAvatar: p.author.teacher?.photo || "",
      authorRole: p.author.role,
      tags: p.postTags.map((pt) => pt.tag.name),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memuat manajemen artikel admin.", error });
  }
});

// Admin: Review post (Approve/Publish or Reject with reason)
blogRouter.post("/admin/review/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, isFeatured } = req.body; // action: "approve" | "reject" | "archive"

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      res.status(404).json({ success: false, message: "Artikel tidak ditemukan." });
      return;
    }

    let updated;
    if (action === "approve" || action === "publish") {
      updated = await prisma.blogPost.update({
        where: { id },
        data: {
          status: BlogStatus.PUBLISHED,
          publishedAt: new Date(),
          rejectionReason: null,
          isFeatured: isFeatured !== undefined ? isFeatured : post.isFeatured,
        },
      });
    } else if (action === "reject") {
      if (!rejectionReason) {
        res.status(400).json({ success: false, message: "Alasan penolakan wajib diisi agar penulis dapat merevisi artikel." });
        return;
      }
      updated = await prisma.blogPost.update({
        where: { id },
        data: {
          status: BlogStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason,
        },
      });
    } else if (action === "archive") {
      updated = await prisma.blogPost.update({
        where: { id },
        data: {
          status: BlogStatus.ARCHIVED,
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Aksi tidak valid (approve/reject/archive)." });
      return;
    }

    res.json({
      success: true,
      message:
        action === "approve"
          ? "Artikel berhasil disetujui dan dipublikasikan ke website publik."
          : action === "reject"
          ? "Artikel ditolak dengan catatan evaluasi."
          : "Artikel berhasil diarsipkan.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memproses review artikel.", error });
  }
});

// Admin: Toggle Featured status
blogRouter.post("/admin/toggle-featured/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      res.status(404).json({ success: false, message: "Artikel tidak ditemukan." });
      return;
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: { isFeatured: !post.isFeatured },
    });

    res.json({
      success: true,
      message: updated.isFeatured ? "Artikel dijadikan Headline Utama." : "Status Headline dinonaktifkan.",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengubah status featured.", error });
  }
});

// Admin/Author: Delete post
blogRouter.delete("/delete/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.blogPostTag.deleteMany({ where: { postId: id } });
    await prisma.blogPost.delete({ where: { id } });
    res.json({ success: true, message: "Artikel berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus artikel.", error });
  }
});

// Admin: Create Category
blogRouter.post("/admin/categories/create", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: "Nama kategori wajib diisi." });
      return;
    }

    const slug = slugify(name);
    const category = await prisma.blogCategory.create({
      data: { name, slug, description },
    });

    res.json({ success: true, message: "Kategori berhasil dibuat.", data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal membuat kategori.", error });
  }
});
