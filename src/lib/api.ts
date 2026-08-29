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
  mustChangePassword?: boolean;
  error?: string;
}

export interface DiagnosticResult {
  success: boolean;
  isHealthy: boolean;
  summary: {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalParents: number;
  };
  issues: {
    teachersWithoutUserCount: number;
    studentsWithoutUserCount: number;
    parentsWithoutUserCount: number;
    teacherUsersWithoutTeacherCount: number;
    studentUsersWithoutStudentCount: number;
    parentUsersWithoutParentCount: number;
    usersWithInvalidPasswordCount: number;
    usersWithoutActiveQrCount: number;
    duplicateNips: string[];
    duplicateNiss: string[];
  };
  details: {
    usersWithInvalidPassword: Array<{ id: string; username: string; role: string }>;
    usersWithoutActiveQr: Array<{ id: string; username: string; role: string }>;
  };
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

  async getPublicBlog(params?: {
    q?: string;
    category?: string;
    tag?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
  }): Promise<{ posts: BlogPost[]; total: number } | null> {
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

  async submitContact(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
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
  async login(credentials: {
    usernameOrEmail?: string;
    identifier?: string;
    password: string;
    role: string;
  }): Promise<AuthLoginResponse> {
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
        mustChangePassword: json.mustChangePassword,
      };
    } catch (e: any) {
      return {
        success: false,
        message: "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.",
        error: e?.message,
      };
    }
  },

  // User Management
  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.warn("Could not fetch users from API:", e);
      return [];
    }
  },

  async getTeachers(): Promise<User[]> {
    try {
      const res = await fetch("/api/master/teachers");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    } catch (e) {
      console.warn("Could not fetch teachers from API:", e);
      return [];
    }
  },

  async createUser(userData: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          message: json.message || `Gagal membuat pengguna di database (HTTP ${res.status})`,
        };
      }
      return {
        success: true,
        message: json.message || "Pengguna berhasil disimpan ke database.",
        data: json.data,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan jaringan saat menyimpan data ke database.",
      };
    }
  },

  async createTeacher(teacherData: any): Promise<{ success: boolean; message: string; teacher?: any; user?: any; qrCode?: any }> {
    try {
      const res = await fetch("/api/master/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          message: json.message || `Gagal membuat Guru di database (HTTP ${res.status})`,
        };
      }
      return {
        success: true,
        message: json.message || "Guru berhasil disimpan ke database.",
        teacher: json.teacher,
        user: json.user,
        qrCode: json.qrCode,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan jaringan saat menyimpan data guru.",
      };
    }
  },

  async updateUser(userId: string, data: any): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? "Data pengguna berhasil diperbarui" : "Gagal memperbarui pengguna"),
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan saat memperbarui pengguna.",
      };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? "Pengguna berhasil dinonaktifkan" : "Gagal menonaktifkan pengguna"),
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan saat menghapus pengguna.",
      };
    }
  },

  async resetPassword(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? "Password berhasil direset" : "Gagal mereset password"),
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan saat mereset password.",
      };
    }
  },

  async regenerateQR(userId: string): Promise<{ success: boolean; message: string; qrToken?: string }> {
    try {
      const res = await fetch(`/api/users/${userId}/regenerate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? "QR Code berhasil diregenerasi" : "Gagal meregenerasi QR Code"),
        qrToken: json.qrToken,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan saat meregenerasi QR Code.",
      };
    }
  },

  async getDiagnostic(): Promise<DiagnosticResult | null> {
    try {
      const res = await fetch("/api/users/diagnostic");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        return json;
      }
      return null;
    } catch (e) {
      console.warn("Could not fetch user diagnostics:", e);
      return null;
    }
  },

  async runRepair(): Promise<{ success: boolean; message: string; repairCount?: number; repairLog?: string[] }> {
    try {
      const res = await fetch("/api/users/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      return {
        success: json.success ?? res.ok,
        message: json.message || (res.ok ? "Perbaikan berhasil dijalankan" : "Gagal menjalankan perbaikan"),
        repairCount: json.repairCount,
        repairLog: json.repairLog,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || "Terjadi kesalahan saat menjalankan perbaikan database.",
      };
    }
  },
};
