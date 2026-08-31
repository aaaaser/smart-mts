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

async function safeJsonFetch<T = any>(
  url: string,
  options?: RequestInit,
  fallbackErrMsg = "Terjadi kesalahan pada server."
): Promise<{ success: boolean; data?: T; message: string; status: number }> {
  try {
    const res = await fetch(url, options);
    let text = "";
    try {
      text = await res.text();
    } catch {
      text = "";
    }

    let json: any = null;
    if (text && text.trim().length > 0) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      const errorMsg =
        json?.message ||
        json?.error ||
        (text && text.length < 200 && !text.includes("<!DOCTYPE") ? text : null) ||
        `${fallbackErrMsg} (HTTP ${res.status})`;

      return {
        success: false,
        data: json,
        message: errorMsg,
        status: res.status,
      };
    }

    return {
      success: json?.success ?? true,
      data: (json?.data !== undefined ? json.data : json) as T,
      message: json?.message || "Operasi berhasil.",
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Gagal terhubung ke server. Periksa koneksi jaringan Anda.",
      status: 0,
    };
  }
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
    const res = await safeJsonFetch(
      `/api/users/${encodeURIComponent(userId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
      "Gagal memperbarui pengguna"
    );
    return { success: res.success, message: res.message };
  },

  async deleteTeacher(teacherIdOrUserId: string, operator?: { role?: string; name?: string }): Promise<{ success: boolean; message: string }> {
    const res = await safeJsonFetch(
      `/api/master/teachers/${encodeURIComponent(teacherIdOrUserId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": operator?.role || "admin",
          "x-user-name": operator?.name || "Super Admin",
        },
        body: JSON.stringify({
          operatorRole: operator?.role || "admin",
          operatorName: operator?.name || "Super Admin",
        }),
      },
      "Gagal menghapus data Guru dari database"
    );

    // If master route returned 404, fallback to users route
    if (!res.success && (res.status === 404 || res.status === 0)) {
      const fallback = await safeJsonFetch(
        `/api/users/${encodeURIComponent(teacherIdOrUserId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-role": operator?.role || "admin",
            "x-user-name": operator?.name || "Super Admin",
          },
          body: JSON.stringify({
            operatorRole: operator?.role || "admin",
            operatorName: operator?.name || "Super Admin",
          }),
        },
        "Gagal menghapus akun Guru dari database"
      );
      return { success: fallback.success, message: fallback.message };
    }

    return {
      success: res.success,
      message: res.message || "Data Guru berhasil dihapus permanen dari database.",
    };
  },

  async deleteUser(userId: string, operator?: { role?: string; name?: string }): Promise<{ success: boolean; message: string }> {
    const res = await safeJsonFetch(
      `/api/users/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": operator?.role || "admin",
          "x-user-name": operator?.name || "Super Admin",
        },
        body: JSON.stringify({
          operatorRole: operator?.role || "admin",
          operatorName: operator?.name || "Super Admin",
        }),
      },
      "Gagal menghapus akun pengguna dari database"
    );
    return {
      success: res.success,
      message: res.message || "Akun pengguna berhasil dihapus permanen dari database.",
    };
  },

  async resetPassword(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await safeJsonFetch(
      `/api/users/${encodeURIComponent(userId)}/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      "Gagal mereset password"
    );
    return { success: res.success, message: res.message };
  },

  async regenerateQR(userId: string): Promise<{ success: boolean; message: string; qrToken?: string }> {
    const res = await safeJsonFetch<{ qrToken?: string }>(
      `/api/users/${encodeURIComponent(userId)}/regenerate-qr`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      "Gagal meregenerasi QR Code"
    );
    return {
      success: res.success,
      message: res.message,
      qrToken: res.data?.qrToken,
    };
  },

  async getDiagnostic(): Promise<DiagnosticResult | null> {
    const res = await safeJsonFetch<DiagnosticResult>(
      "/api/users/diagnostic",
      undefined,
      "Gagal memuat diagnostik pengguna"
    );
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  },

  async runRepair(): Promise<{ success: boolean; message: string; repairCount?: number; repairLog?: string[] }> {
    const res = await safeJsonFetch<{ repairCount?: number; repairLog?: string[] }>(
      "/api/users/repair",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      "Gagal menjalankan perbaikan database"
    );
    return {
      success: res.success,
      message: res.message,
      repairCount: res.data?.repairCount,
      repairLog: res.data?.repairLog,
    };
  },
};
