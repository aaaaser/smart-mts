import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { BlogPost } from "../../types";
import {
  Search,
  BookOpen,
  Calendar,
  Eye,
  Clock,
  ArrowRight,
  Tag,
  Star,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";

export const PublicBlogListView: React.FC = () => {
  const { blogPosts, blogCategories, blogTags, navigateToPublic } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Filter to published articles only
  const publishedPosts = blogPosts.filter((post) => post.status === "published");

  // Filtering
  const filteredPosts = publishedPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || post.categoryId === selectedCategory || post.categoryName === selectedCategory;

    const matchesTag =
      selectedTag === "all" || (post.tags && post.tags.includes(selectedTag));

    return matchesSearch && matchesCategory && matchesTag;
  });

  // Featured Post
  const featuredPost =
    selectedCategory === "all" && selectedTag === "all" && searchQuery === ""
      ? publishedPosts.find((p) => p.isFeatured) || publishedPosts[0]
      : null;

  // Posts for grid (exclude featured post on main view if active)
  const gridSourcePosts = featuredPost
    ? filteredPosts.filter((p) => p.id !== featuredPost.id)
    : filteredPosts;

  const totalPages = Math.ceil(gridSourcePosts.length / postsPerPage) || 1;
  const paginatedPosts = gridSourcePosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  return (
    <div id="public-blog-list-view" className="bg-slate-50 min-h-screen pb-24">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span>Warta Madrasah & Edukasi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Berita & Artikel smart MTs
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto">
            Kumpulan informasi resmi, liputan kegiatan madrasah, prestasi santri, serta karya ilmiah dan inspirasi guru.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari berita, topik, atau nama penulis..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua Kategori
              </button>
              {blogCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags bar if available */}
          {blogTags.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-600" />
                Topik Populer:
              </span>
              <button
                onClick={() => {
                  setSelectedTag("all");
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedTag === "all"
                    ? "bg-emerald-100 text-emerald-800 font-bold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua
              </button>
              {blogTags.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTag(selectedTag === t.name ? "all" : t.name);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedTag === t.name
                      ? "bg-emerald-100 text-emerald-800 font-bold"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------
            FEATURED HERO POST (If no active deep filter)
            ---------------------------------------------------- */}
        {featuredPost && (
          <div className="mt-10">
            <div
              onClick={() => navigateToPublic("blog_detail", featuredPost.slug)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="lg:col-span-6 h-64 lg:h-96 overflow-hidden">
                  <img
                    src={
                      featuredPost.coverImage ||
                      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80"
                    }
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="lg:col-span-6 p-8 lg:p-12 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                      {featuredPost.categoryName}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-amber-500" />
                      Headline Utama
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          featuredPost.authorAvatar ||
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
                        }
                        alt={featuredPost.authorName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-700">{featuredPost.authorName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {featuredPost.publishedAt
                          ? new Date(featuredPost.publishedAt).toLocaleDateString("id-ID")
                          : "Terbaru"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {featuredPost.views} dilihat
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            POSTS GRID
            ---------------------------------------------------- */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Artikel & Berita ({gridSourcePosts.length})
            </h2>
            {selectedCategory !== "all" && (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                Kategori: {blogCategories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
              </span>
            )}
          </div>

          {paginatedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Tidak ada artikel yang ditemukan.</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigateToPublic("blog_detail", post.slug)}
                  className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={
                          post.coverImage ||
                          "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&auto=format&fit=crop&q=80"
                        }
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                        {post.categoryName}
                      </span>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-600 line-clamp-1">{post.authorName}</span>
                    <span className="shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID") : "Terbaru"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
