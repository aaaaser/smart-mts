import React, { useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Clock,
  Share2,
  Bookmark,
  Check,
  Tag,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const PublicBlogDetailView: React.FC = () => {
  const {
    blogPosts,
    blogDetailSlug,
    navigateToPublic,
    showToast,
    updateBlogPost,
  } = useApp();

  // Find post by slug or fallback to first post
  const post =
    blogPosts.find((p) => p.slug === blogDetailSlug) ||
    blogPosts.find((p) => p.id === blogDetailSlug) ||
    blogPosts[0];

  // Increment view count once per mount
  useEffect(() => {
    if (post) {
      updateBlogPost(post.id, { views: (post.views || 0) + 1 });
      // Call backend API as well
      fetch(`/api/blog/posts/${post.id}/views`, { method: "POST" }).catch(() => {});
    }
  }, [post?.id]);

  // Related posts (same category or others)
  const relatedPosts = blogPosts
    .filter((p) => p.status === "published" && p.id !== post?.id)
    .slice(0, 3);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("success", "Tautan Disalin", "Link artikel berhasil disalin ke clipboard.");
    }
  };

  const handleShareWA = () => {
    if (post && typeof window !== "undefined") {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${post.title} - Baca selengkapnya di smart MTs: ${window.location.href}`
      )}`;
      window.open(url, "_blank");
    }
  };

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Artikel Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mt-2">Artikel yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
        <button
          onClick={() => navigateToPublic("blog")}
          className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Warta & Blog
        </button>
      </div>
    );
  }

  return (
    <article id="public-blog-detail-view" className="bg-slate-50 min-h-screen pb-24">
      {/* Top Breadcrumbs Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
            <button
              onClick={() => navigateToPublic("home")}
              className="hover:text-emerald-700 font-semibold"
            >
              Beranda
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              onClick={() => navigateToPublic("blog")}
              className="hover:text-emerald-700 font-semibold"
            >
              Berita & Blog
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-800 font-bold truncate max-w-xs">{post.title}</span>
          </div>

          <button
            onClick={() => navigateToPublic("blog")}
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Semua Berita</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Article Header Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-6">
          {/* Category & Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              {post.categoryName}
            </span>
            {post.isFeatured && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Headline Pilihan
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }) : "Baru Diterbitkan"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views} dilihat
            </span>
          </div>

          {/* Article Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>

          {/* Author Card */}
          <div className="flex items-center justify-between border-y border-slate-100 py-4">
            <div className="flex items-center gap-3.5">
              <img
                src={
                  post.authorAvatar ||
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
                }
                alt={post.authorName}
                className="w-11 h-11 rounded-full object-cover border border-emerald-500 shadow-xs"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-800">{post.authorName}</h4>
                <p className="text-xs text-slate-500 capitalize">
                  {post.authorRole === "admin" ? "Administrator Madrasah" : "Dewan Guru / Tenaga Pendidik"}
                </p>
              </div>
            </div>

            {/* Share action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                title="Salin Tautan"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Bagikan</span>
              </button>
              <button
                onClick={handleShareWA}
                title="Bagikan ke WhatsApp"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Article Excerpt Banner */}
          {post.excerpt && (
            <div className="bg-emerald-50/70 border-l-4 border-emerald-600 p-4 rounded-r-2xl text-sm font-medium text-emerald-950 italic leading-relaxed">
              "{post.excerpt}"
            </div>
          )}

          {/* Cover Image */}
          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 max-h-[480px]">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Body Content */}
          <div className="pt-2 text-slate-700 text-base leading-relaxed space-y-4 font-normal">
            {post.content.split("\n\n").map((paragraph, idx) => (
              <p key={idx} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Tag:
              </span>
              {post.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigateToPublic("blog")}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------
            RELATED ARTICLES
            ---------------------------------------------------- */}
        {relatedPosts.length > 0 && (
          <div className="mt-14 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Berita & Artikel Lainnya
              </h3>
              <button
                onClick={() => navigateToPublic("blog")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Lihat Semua →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rPost) => (
                <div
                  key={rPost.id}
                  onClick={() => navigateToPublic("blog_detail", rPost.slug)}
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={
                          rPost.coverImage ||
                          "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600"
                        }
                        alt={rPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        {rPost.categoryName}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {rPost.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {rPost.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{rPost.authorName}</span>
                    <span>
                      {rPost.publishedAt
                        ? new Date(rPost.publishedAt).toLocaleDateString("id-ID")
                        : "Terbaru"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
