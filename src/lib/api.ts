import { User, SchoolProfile, BlogPost, OrganizationStructureItem } from "../types";

export interface PublicStats {
  students: number;
  teachers: number;
  subjects: number;
  extracurriculars: number;
  classes: number;
  activeAcademicYear: string;
  activeSemester: string;
  isFallback?: boolean;
}

export interface AuthLoginResponse {
  success: boolean;
  message: string;
  user?: User;
  error?: string;
}

export const api = {
  // Public Data
  async getPublicStats(): Promise<PublicStats | null> {
    try {
      const res = await fetch("/api/public/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn("Could not fetch public stats from API:", e);
      return null;
    }
  },

  async getPublicSchoolProfile(): Promise<SchoolProfile | null> {
    try {
      const res = await fetch("/api/public/profile");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn("Could not fetch school profile from API:", e);
      return null;
    }
  },

  async getPublicBlog(params?: { q?: string; category?: string; tag?: string; page?: number; limit?: number; featured?: boolean }): Promise<{ posts: BlogPost[]; total: number } | null> {
    try {
      const query = new URLSearchParams();
      if (params?.q) query.set("q", params.q);
      if (params?.category && params.category !== "all") query.set("category", params.category);
      if (params?.tag && params.tag !== "all") query.set("tag", params.tag);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.featured) query.set("featured", "true");

      const res = await fetch(`/api/blog/public?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return {
          posts: json.data,
          total: json.pagination?.total || json.data.length,
        };
      }
      return null;
    } catch (e) {
      console.warn("Could not fetch public blog from API:", e);
      return null;
    }
  },

  async getPublicOrganization(): Promise<OrganizationStructureItem[] | null> {
    try {
      const res = await fetch("/api/organization/public");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn("Could not fetch public organization from API:", e);
      return null;
    }
  },

  async submitContact(data: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? "Pesan berhasil dikirim" : "Gagal mengirim pesan"),
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan jaringan saat mengirim pesan.",
      };
    }
  },

  // Auth
  async login(credentials: { usernameOrEmail: string; password: string; role: string }): Promise<AuthLoginResponse> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          message: json.message || "Gagal masuk ke sistem.",
          error: json.error,
        };
      }
      return {
        success: true,
        message: json.message || "Login berhasil",
        user: json.user,
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.",
        error: e?.message,
      };
    }
  },
};
