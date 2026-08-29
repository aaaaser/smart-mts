import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { BlogPost, BlogCategory, ContactMessage } from "../../types";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  Trash2,
  Edit,
  Eye,
  ExternalLink,
  Plus,
  X,
  MessageSquare,
  FolderPlus,
  Send,
  Mail,
  Phone,
  Calendar,
  Check,
} from "lucide-react";

export const AdminBlogManagementView: React.FC = () => {
  const {
    blogPosts,
    blogCategories,
    blogTags,
    contactMessages,
    reviewBlogPost,
    deleteBlogPost,
    toggleFeaturedPost,
    addBlogCategory,
    markContactMessageRead,
    deleteContactMessage,
    navigateToPublic,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"posts" | "review" | "categories" | "messages">("posts");
  const [reviewModalPost, setReviewModalPost] = useState<BlogPost | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const countPending = blogPosts.filter((p) => p.status === "submitted").length;
  const countPublished = blogPosts.filter((p) => p.status === "published").length;
  const totalViews = blogPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const unreadMessages = contactMessages.filter((m) => !m.isRead).length;

  const handleApprove = (post: BlogPost) => {
    reviewBlogPost(post.id, "approve", undefined, post.isFeatured);
    setReviewModalPost(null);
  };

  const handleReject = (post: BlogPost) => {
    if (!rejectionNote.trim()) {
      showToast("error", "Alasan Wajib", "Tuliskan catatan revisi untuk guru penulis.");
      return;
    }
    reviewBlogPost(post.id, "reject", rejectionNote);
    setReviewModalPost(null);
    setRejectionNote("");
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addBlogCategory(newCatName, newCatDesc);
    setNewCatName("");
    setNewCatDesc("");
  };

  return (
    <div id="admin-blog-management" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-bold tracking-tight">Manajemen Blog & Website Depan</h2>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Review publikasi guru, kelola berita madrasah, kategori, dan tanggapi pesan masuk dari website publik.
          </p>
        </div>

        <button
          onClick={() => navigateToPublic("home")}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5"
        >
          <ExternalLink className="w-4 h-4 text-emerald-300" />
          <span>Lihat Website Depan</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("posts")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "posts" ? "bg-emerald-50 border-emerald-500 shadow-xs" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500">Total Artikel</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{blogPosts.length}</p>
        </div>

        <div
          onClick={() => setActiveTab("review")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "review"
              ? "bg-amber-50 border-amber-500 shadow-xs"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700">Menunggu Review</p>
            {countPending > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {countPending} Baru
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1">{countPending}</p>
        </div>

        <div
          onClick={() => setActiveTab("posts")}
          className="p-4 rounded-xl border bg-white border-slate-200"
        >
          <p className="text-xs font-semibold text-emerald-700">Diterbitkan (Public)</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{countPublished}</p>
        </div>

        <div
          onClick={() => setActiveTab("messages")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === "messages"
              ? "bg-blue-50 border-blue-500 shadow-xs"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700">Pesan Masuk Web</p>
            {unreadMessages > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadMessages} Baru
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-blue-800 mt-1">{contactMessages.length}</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-4 flex items-center gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "posts"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Semua Artikel ({blogPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "review"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Review Pengajuan ({countPending})</span>
            {countPending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "categories"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Kategori ({blogCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "messages"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Pesan Kontak ({contactMessages.length})</span>
            {unreadMessages > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
        </div>

        {/* Tab 1: All Posts Table */}
        {activeTab === "posts" && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="pb-3">Judul Artikel</th>
                    <th className="pb-3">Penulis</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Views</th>
                    <th className="pb-3">Headline</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blogPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pr-4 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{post.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID") : "Draft"}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-semibold text-slate-700">{post.authorName}</span>
                        <span className="block text-[10px] text-slate-400 capitalize">{post.authorRole}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {post.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        {post.status === "published" && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Published
                          </span>
                        )}
                        {post.status === "submitted" && (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Pending Review
                          </span>
                        )}
                        {post.status === "draft" && (
                          <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Draft
                          </span>
                        )}
                        {post.status === "rejected" && (
                          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Perlu Revisi
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-600 font-semibold">{post.views || 0}</td>
                      <td className="py-3.5 pr-4">
                        <button
                          onClick={() => toggleFeaturedPost(post.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            post.isFeatured
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "text-slate-300 hover:text-amber-500"
                          }`}
                          title={post.isFeatured ? "Headline Aktif" : "Jadikan Headline"}
                        >
                          <Star className={`w-4 h-4 ${post.isFeatured ? "fill-amber-500" : ""}`} />
                        </button>
                      </td>
                      <td className="py-3.5 text-right space-x-1">
                        {post.status === "published" && (
                          <button
                            onClick={() => navigateToPublic("blog_detail", post.slug)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded"
                            title="Buka Halaman Publik"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setReviewModalPost(post)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-[11px]"
                        >
                          Review / Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus artikel ini?")) deleteBlogPost(post.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Review Submissions */}
        {activeTab === "review" && (
          <div className="p-6 space-y-4">
            {countPending === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                <p className="font-bold text-slate-700">Semua Artikel Sudah Ditinjau!</p>
                <p className="text-xs text-slate-400 mt-0.5">Tidak ada pengajuan artikel baru dari dewan guru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {blogPosts
                  .filter((p) => p.status === "submitted")
                  .map((post) => (
                    <div
                      key={post.id}
                      className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {post.categoryName}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1">{post.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Diajukan oleh: <strong>{post.authorName}</strong> ({post.authorRole})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(post)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Setujui & Terbitkan</span>
                          </button>
                          <button
                            onClick={() => setReviewModalPost(post)}
                            className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>Tolak / Minta Revisi</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {post.excerpt || post.content.substring(0, 200) + "..."}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Categories */}
        {activeTab === "categories" && (
          <div className="p-6 space-y-6">
            {/* Create Category Form */}
            <form onSubmit={handleAddCategory} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Tambah Kategori Artikel Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nama Kategori (contoh: Tahfidz & Keagamaan)"
                  className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Deskripsi singkat kategori..."
                  className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Simpan Kategori
              </button>
            </form>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogCategories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                  <p className="text-xs text-slate-500">{cat.description || "Kategori warta madrasah"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Messages from Public Contact */}
        {activeTab === "messages" && (
          <div className="p-6 space-y-4">
            {contactMessages.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">Belum Ada Pesan Masuk</p>
                <p className="text-xs text-slate-400">Pesan dari formulir kontak website depan akan tampil di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {contactMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl transition-colors mb-3 border ${
                      msg.isRead ? "bg-white border-slate-200" : "bg-blue-50/60 border-blue-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{msg.name}</span>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            {msg.subject}
                          </span>
                          {!msg.isRead && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Baru
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {msg.email}
                          </span>
                          {msg.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {msg.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(msg.createdAt).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!msg.isRead && (
                          <button
                            onClick={() => markContactMessageRead(msg.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                          >
                            Tandai Sudah Dibaca
                          </button>
                        )}
                        <button
                          onClick={() => deleteContactMessage(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Review & Tindakan Artikel</h3>
              <button onClick={() => setReviewModalPost(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  {reviewModalPost.categoryName}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{reviewModalPost.title}</h2>
                <p className="text-xs text-slate-500">
                  Penulis: {reviewModalPost.authorName} ({reviewModalPost.authorRole})
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 max-h-60 overflow-y-auto leading-relaxed space-y-2">
                <p>
                  <strong>Kutipan Preview:</strong> {reviewModalPost.excerpt}
                </p>
                <div className="pt-2 border-t border-slate-200">
                  <strong>Konten Lengkap:</strong>
                  <p className="mt-1 whitespace-pre-line">{reviewModalPost.content}</p>
                </div>
              </div>

              {/* Rejection note input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Revisi / Alasan Penolakan (Jika ditolak)
                </label>
                <input
                  type="text"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Contoh: Mohon lengkapi dokumentasi foto dan perbaiki beberapa typo..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setReviewModalPost(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReject(reviewModalPost)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200"
                >
                  Tolak & Minta Revisi
                </button>
                <button
                  onClick={() => handleApprove(reviewModalPost)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
                >
                  Setujui & Terbitkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
