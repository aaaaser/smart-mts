import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { BlogPost, BlogStatus } from "../../types";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  Tag,
  FolderPlus,
} from "lucide-react";

export const TeacherBlogManagementView: React.FC = () => {
  const {
    currentUser,
    blogPosts,
    blogCategories,
    blogTags,
    addBlogPost,
    updateBlogPost,
    submitBlogPostForReview,
    deleteBlogPost,
    navigateToPublic,
    showToast,
  } = useApp();

  // Filter posts authored by current teacher or all if admin
  const teacherPosts =
    currentUser?.role === "admin"
      ? blogPosts
      : blogPosts.filter((p) => p.authorId === currentUser?.id || p.authorName === currentUser?.name);

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(blogCategories[0]?.id || "");
  const [coverImage, setCoverImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const filteredPosts = teacherPosts.filter((p) => {
    if (activeStatusFilter === "all") return true;
    return p.status === activeStatusFilter;
  });

  const countDraft = teacherPosts.filter((p) => p.status === "draft").length;
  const countSubmitted = teacherPosts.filter((p) => p.status === "submitted").length;
  const countPublished = teacherPosts.filter((p) => p.status === "published").length;
  const countRejected = teacherPosts.filter((p) => p.status === "rejected").length;

  const handleOpenNew = () => {
    setEditingPost(null);
    setTitle("");
    setCategoryId(blogCategories[0]?.id || "");
    setCoverImage("https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800");
    setExcerpt("");
    setContent("");
    setTagsInput("Madrasah, Edukasi, Kegiatan");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setCategoryId(post.categoryId);
    setCoverImage(post.coverImage || "");
    setExcerpt(post.excerpt);
    setContent(post.content);
    setTagsInput(post.tags ? post.tags.join(", ") : "");
    setIsEditorOpen(true);
  };

  const handleSave = (statusToSave: "draft" | "submitted") => {
    if (!title.trim()) {
      showToast("error", "Judul Wajib Diisi", "Mohon isi judul artikel blog.");
      return;
    }
    if (!content.trim()) {
      showToast("error", "Konten Wajib Diisi", "Mohon tuliskan isi konten artikel.");
      return;
    }

    const categoryObj = blogCategories.find((c) => c.id === categoryId) || blogCategories[0];
    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (editingPost) {
      updateBlogPost(editingPost.id, {
        title,
        slug,
        categoryId: categoryObj?.id || "cat_1",
        categoryName: categoryObj?.name || "Pendidikan",
        coverImage,
        excerpt: excerpt || title,
        content,
        tags: tagsArray,
        status: statusToSave,
        submittedAt: statusToSave === "submitted" ? new Date().toISOString() : editingPost.submittedAt,
        rejectionReason: statusToSave === "submitted" ? undefined : editingPost.rejectionReason,
      });
    } else {
      addBlogPost({
        title,
        slug,
        categoryId: categoryObj?.id || "cat_1",
        categoryName: categoryObj?.name || "Pendidikan",
        authorId: currentUser?.id || "u2",
        authorName: currentUser?.name || "Dewan Guru sMTs",
        authorRole: currentUser?.role || "guru",
        authorAvatar: currentUser?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        coverImage,
        excerpt: excerpt || title,
        content,
        tags: tagsArray,
        status: statusToSave,
        submittedAt: statusToSave === "submitted" ? new Date().toISOString() : undefined,
        isFeatured: false,
      });
    }

    setIsEditorOpen(false);
  };

  return (
    <div id="teacher-blog-management" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-800 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-bold tracking-tight">Blog & Publikasi Guru</h2>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Tulis artikel edukasi, warta kegiatan madrasah, dan tips belajar untuk ditampilkan di Website Publik sMTs.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow transition-transform active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Artikel Baru</span>
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveStatusFilter("all")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeStatusFilter === "all"
              ? "bg-emerald-50 border-emerald-500 shadow-xs"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500">Semua Artikel</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{teacherPosts.length}</p>
        </div>

        <div
          onClick={() => setActiveStatusFilter("published")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeStatusFilter === "published"
              ? "bg-emerald-50 border-emerald-500 shadow-xs"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700">Diterbitkan (Public)</p>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{countPublished}</p>
        </div>

        <div
          onClick={() => setActiveStatusFilter("submitted")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeStatusFilter === "submitted"
              ? "bg-amber-50 border-amber-500 shadow-xs"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700">Menunggu Review</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1">{countSubmitted}</p>
        </div>

        <div
          onClick={() => setActiveStatusFilter("draft")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeStatusFilter === "draft"
              ? "bg-slate-100 border-slate-400 shadow-xs"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">Draft Saya</p>
            <Edit className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{countDraft}</p>
        </div>
      </div>

      {/* List of Articles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Artikel Saya ({filteredPosts.length})
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter:</span>
            <button
              onClick={() => setActiveStatusFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                activeStatusFilter === "all" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveStatusFilter("published")}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                activeStatusFilter === "published" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Diterbitkan
            </button>
            <button
              onClick={() => setActiveStatusFilter("submitted")}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                activeStatusFilter === "submitted" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Menunggu Review
            </button>
            <button
              onClick={() => setActiveStatusFilter("draft")}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                activeStatusFilter === "draft" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Draft
            </button>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum ada artikel dalam kategori ini.</p>
            <button
              onClick={handleOpenNew}
              className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
            >
              Mulai Menulis
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPosts.map((post) => (
              <div key={post.id} className="p-5 hover:bg-slate-50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                        {post.categoryName}
                      </span>

                      {post.status === "published" && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Diterbitkan di Web Publik
                        </span>
                      )}

                      {post.status === "submitted" && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Menunggu Review Admin
                        </span>
                      )}

                      {post.status === "draft" && (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Draft Lokal
                        </span>
                      )}

                      {post.status === "rejected" && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Perlu Revisi
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{post.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{post.excerpt}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {post.status === "published" && (
                      <button
                        onClick={() => navigateToPublic("blog_detail", post.slug)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Lihat Publik</span>
                      </button>
                    )}

                    {post.status === "draft" && (
                      <button
                        onClick={() => submitBlogPostForReview(post.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Review</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEdit(post)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                      title="Edit Artikel"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
                          deleteBlogPost(post.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Hapus Artikel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rejection Alert if rejected */}
                {post.status === "rejected" && post.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Catatan Revisi dari Admin:</strong> {post.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------
          MODAL EDITOR ARTIKEL
          ---------------------------------------------------- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between z-10">
              <h3 className="text-base font-bold text-slate-900">
                {editingPost ? "Edit Artikel Blog" : "Tulis Artikel Baru"}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Artikel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pentingnya Membangun Karakter Qur'ani di Era Digital..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Artikel
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {blogCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Gambar Sampul (Cover Image)
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan / Kutipan (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Ringkasan singkat 1-2 kalimat untuk preview di halaman depan..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Konten Artikel <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan isi artikel Anda secara lengkap..."
                  className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tag / Topik (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="KurikulumMerdeka, Prestasi, Tahfidz"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave("submitted")}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirimkan untuk Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
