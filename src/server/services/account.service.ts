import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { Role, Gender, EmploymentStatus, StudentStatus, User, Teacher, Student, Parent } from "@prisma/client";

// Normalize Indonesian phone numbers to standard format (e.g. "+628123456789" / "628123456789" / "0812-3456-789" -> "08123456789")
export function normalizePhoneNumber(phoneInput?: string | null): string {
  if (!phoneInput) return "";
  let cleaned = phoneInput.replace(/[\s\-\(\)\+]/g, "").trim();
  if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

export function generateSecureQRToken(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${token}`;
}

export interface CreateTeacherInput {
  name: string;
  nip: string;
  nuptk?: string | null;
  nik?: string | null;
  gender?: "L" | "P" | Gender;
  phone?: string | null;
  email?: string | null;
  username?: string | null;
  address?: string | null;
  employmentStatus?: EmploymentStatus;
  subjectIds?: string[];
  ipOrDevice?: string;
}

export interface CreateStudentInput {
  name: string;
  nis: string;
  nisn?: string | null;
  gender?: "L" | "P" | Gender;
  phone?: string | null;
  email?: string | null;
  username?: string | null;
  address?: string | null;
  birthPlace?: string | null;
  birthDate?: string | Date | null;
  entryYear?: number;
  classId?: string | null;
  ipOrDevice?: string;
}

export interface CreateParentInput {
  name: string;
  phone: string;
  email?: string | null;
  username?: string | null;
  address?: string | null;
  childStudentId?: string | null;
  relationship?: string;
  ipOrDevice?: string;
}

export interface CreateAdminInput {
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  ipOrDevice?: string;
}

export interface AccountDiagnosticItem {
  id: string;
  role: string;
  identifier: string;
  name: string;
  hasUser: boolean;
  hasProfile: boolean;
  roleMatches: boolean;
  hasValidBcryptHash: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  hasActiveQr: boolean;
  qrToken?: string;
  issues: string[];
}

export class AccountService {
  /**
   * Generates standard initial password hash 'smtslogin' using bcrypt with 10 salt rounds.
   * Ensures hashing happens EXACTLY ONCE.
   */
  static async getDefaultPasswordHash(): Promise<string> {
    return await bcrypt.hash("smtslogin", 10);
  }

  /**
   * 1. CREATE TEACHER ACCOUNT
   * Atomically provisions User (TEACHER) + Teacher profile + UserQrCode in a single database transaction.
   */
  static async createTeacherAccount(input: CreateTeacherInput) {
    const rawNip = (input.nip || "").toString().trim();
    if (!rawNip) {
      throw new Error("NIP wajib diisi untuk pembuatan akun Guru.");
    }
    const cleanNip = rawNip;

    // Check duplicate NIP in Teacher
    const existingTeacher = await prisma.teacher.findFirst({
      where: { nip: { equals: cleanNip, mode: "insensitive" } },
    });
    if (existingTeacher) {
      throw new Error(`NIP ${cleanNip} sudah terdaftar pada guru lain.`);
    }

    const cleanUsername = (input.username || cleanNip).toString().trim().toLowerCase();
    const cleanEmail = (input.email || `${cleanNip}@guru.madrasah.id`).toString().trim().toLowerCase();

    // Check duplicate in User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });
    if (existingUser) {
      throw new Error(`Username '${cleanUsername}' atau Email '${cleanEmail}' sudah digunakan di database.`);
    }

    const passwordHash = await this.getDefaultPasswordHash();
    const qrToken = generateSecureQRToken("SMTS-TCH");

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: Role.TEACHER,
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 2. Create UserQrCode
      const qrCode = await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken,
          isActive: true,
        },
      });

      // 3. Create Teacher Profile
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          fullName: input.name.trim(),
          nip: cleanNip,
          nuptk: input.nuptk ? String(input.nuptk).trim() : null,
          nik: input.nik ? String(input.nik).trim() : null,
          gender: input.gender === "P" ? Gender.P : Gender.L,
          phone: input.phone ? normalizePhoneNumber(input.phone) : null,
          email: cleanEmail,
          address: input.address?.trim() || null,
          employmentStatus: input.employmentStatus || EmploymentStatus.GTY,
        },
      });

      // 4. Link Subjects if specified
      if (input.subjectIds && Array.isArray(input.subjectIds) && input.subjectIds.length > 0) {
        const activeAY = await tx.academicYear.findFirst({ where: { isActive: true } });
        const academicYearId = activeAY?.id || "default";
        for (const subId of input.subjectIds) {
          await tx.teacherSubject.create({
            data: {
              teacherId: teacher.id,
              subjectId: subId,
              academicYearId,
            },
          });
        }
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: input.name,
          userRole: Role.TEACHER,
          action: "CREATE_TEACHER",
          details: `Menambahkan akun Guru: ${input.name} (NIP: ${cleanNip}) dengan password awal 'smtslogin' dan QR ${qrToken}`,
          ipOrDevice: input.ipOrDevice || "127.0.0.1",
        },
      });

      return { user, teacher, qrCode };
    });

    // Server-side audit logging without password
    console.log(
      `[CREATE_ACCOUNT] role=TEACHER identifier=${cleanNip} userId=${result.user.id} teacherId=${result.teacher.id} isActive=true hasPasswordHash=true hasQrCode=true`
    );

    return result;
  }

  /**
   * 2. CREATE STUDENT ACCOUNT
   * Atomically provisions User (STUDENT) + Student profile + UserQrCode in a single database transaction.
   */
  static async createStudentAccount(input: CreateStudentInput) {
    const rawNis = (input.nis || "").toString().trim();
    if (!rawNis) {
      throw new Error("NIS wajib diisi untuk pembuatan akun Siswa.");
    }
    const cleanNis = rawNis;

    // Check duplicate NIS in Student
    const existingStudent = await prisma.student.findFirst({
      where: { nis: { equals: cleanNis, mode: "insensitive" } },
    });
    if (existingStudent) {
      throw new Error(`NIS ${cleanNis} sudah terdaftar pada siswa lain.`);
    }

    const cleanUsername = (input.username || cleanNis).toString().trim().toLowerCase();
    const cleanEmail = (input.email || `${cleanNis}@siswa.madrasah.id`).toString().trim().toLowerCase();

    // Check duplicate in User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });
    if (existingUser) {
      throw new Error(`Username '${cleanUsername}' atau Email '${cleanEmail}' sudah digunakan di database.`);
    }

    const passwordHash = await this.getDefaultPasswordHash();
    const qrToken = generateSecureQRToken("SMTS-STU");

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 2. Create UserQrCode
      const qrCode = await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken,
          isActive: true,
        },
      });

      // 3. Create Student Profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          fullName: input.name.trim(),
          nis: cleanNis,
          nisn: input.nisn ? String(input.nisn).trim() : null,
          gender: input.gender === "P" ? Gender.P : Gender.L,
          birthPlace: input.birthPlace?.trim() || null,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          address: input.address?.trim() || null,
          entryYear: input.entryYear || 2025,
          status: StudentStatus.ACTIVE,
        },
      });

      // 4. Link Class Membership if specified
      if (input.classId) {
        const activeAY = await tx.academicYear.findFirst({ where: { isActive: true } });
        if (activeAY) {
          await tx.studentClassMembership.create({
            data: {
              studentId: student.id,
              classId: input.classId,
              academicYearId: activeAY.id,
              status: "ACTIVE",
            },
          });
        }
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: input.name,
          userRole: Role.STUDENT,
          action: "CREATE_STUDENT",
          details: `Menambahkan akun Siswa: ${input.name} (NIS: ${cleanNis}) dengan password awal 'smtslogin' dan QR ${qrToken}`,
          ipOrDevice: input.ipOrDevice || "127.0.0.1",
        },
      });

      return { user, student, qrCode };
    });

    // Server-side audit logging without password
    console.log(
      `[CREATE_ACCOUNT] role=STUDENT identifier=${cleanNis} userId=${result.user.id} studentId=${result.student.id} isActive=true hasPasswordHash=true hasQrCode=true`
    );

    return result;
  }

  /**
   * 3. CREATE PARENT / WALI ACCOUNT
   * Atomically provisions User (PARENT) + Parent profile + UserQrCode in a single database transaction.
   */
  static async createParentAccount(input: CreateParentInput) {
    const rawPhone = (input.phone || "").toString().trim();
    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone || normalizedPhone.length < 6) {
      throw new Error("Nomor HP / WhatsApp yang valid wajib diisi untuk akun Orang Tua/Wali.");
    }

    // Check duplicate Phone in Parent
    const existingParent = await prisma.parent.findFirst({
      where: {
        OR: [{ phone: normalizedPhone }, { phone: rawPhone }],
      },
    });
    if (existingParent) {
      throw new Error(`Nomor HP ${normalizedPhone} sudah terdaftar untuk wali murid lain.`);
    }

    const cleanUsername = (input.username || normalizedPhone).toString().trim().toLowerCase();
    const cleanEmail = (input.email || `ortu.${normalizedPhone}@wali.madrasah.id`).toString().trim().toLowerCase();

    // Check duplicate in User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });
    if (existingUser) {
      throw new Error(`Username '${cleanUsername}' atau Email '${cleanEmail}' sudah digunakan di database.`);
    }

    const passwordHash = await this.getDefaultPasswordHash();
    const qrToken = generateSecureQRToken("SMTS-ORT");

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          role: Role.PARENT,
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 2. Create UserQrCode
      const qrCode = await tx.userQrCode.create({
        data: {
          userId: user.id,
          qrToken,
          isActive: true,
        },
      });

      // 3. Create Parent Profile
      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          fullName: input.name.trim(),
          phone: normalizedPhone,
          address: input.address?.trim() || null,
        },
      });

      // 4. Link Student if provided (supports studentId or student's userId)
      if (input.childStudentId) {
        const studentTarget = await tx.student.findFirst({
          where: {
            OR: [{ id: input.childStudentId }, { userId: input.childStudentId }],
          },
        });
        if (studentTarget) {
          await tx.parentStudent.create({
            data: {
              parentId: parent.id,
              studentId: studentTarget.id,
              relationship: input.relationship || "Orang Tua / Wali",
            },
          });
        }
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: input.name,
          userRole: Role.PARENT,
          action: "CREATE_PARENT",
          details: `Menambahkan akun Orang Tua: ${input.name} (No HP: ${normalizedPhone}) dengan password awal 'smtslogin'`,
          ipOrDevice: input.ipOrDevice || "127.0.0.1",
        },
      });

      return { user, parent, qrCode };
    });

    // Server-side audit logging without password
    console.log(
      `[CREATE_ACCOUNT] role=PARENT identifier=${normalizedPhone} userId=${result.user.id} parentId=${result.parent.id} isActive=true hasPasswordHash=true hasQrCode=true`
    );

    return result;
  }

  /**
   * 4. UPDATE USER ACCOUNT (Edit profile without breaking relations or creating duplicate users)
   */
  static async updateUserAccount(userId: string, data: any, ipOrDevice?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, student: true, parent: true },
    });

    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update User base fields if provided
      const userUpdates: any = {};
      if (data.username && data.username.trim().toLowerCase() !== user.username) {
        const cleanU = data.username.trim().toLowerCase();
        const existing = await tx.user.findUnique({ where: { username: cleanU } });
        if (existing && existing.id !== user.id) {
          throw new Error(`Username '${cleanU}' sudah digunakan oleh pengguna lain.`);
        }
        userUpdates.username = cleanU;
      }
      if (data.email && data.email.trim().toLowerCase() !== user.email) {
        const cleanE = data.email.trim().toLowerCase();
        const existing = await tx.user.findUnique({ where: { email: cleanE } });
        if (existing && existing.id !== user.id) {
          throw new Error(`Email '${cleanE}' sudah digunakan oleh pengguna lain.`);
        }
        userUpdates.email = cleanE;
      }
      if (typeof data.isActive === "boolean") {
        userUpdates.isActive = data.isActive;
      }

      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: userUpdates,
        });
      }

      // 2. Update Role Profiles
      if (user.role === Role.TEACHER && user.teacher) {
        const teacherUpdates: any = {};
        if (data.name) teacherUpdates.fullName = data.name.trim();
        if (data.nip) teacherUpdates.nip = String(data.nip).trim();
        if (data.nuptk !== undefined) teacherUpdates.nuptk = data.nuptk ? String(data.nuptk).trim() : null;
        if (data.nik !== undefined) teacherUpdates.nik = data.nik ? String(data.nik).trim() : null;
        if (data.gender) teacherUpdates.gender = data.gender === "P" ? Gender.P : Gender.L;
        if (data.phone !== undefined) teacherUpdates.phone = data.phone ? normalizePhoneNumber(data.phone) : null;
        if (data.address !== undefined) teacherUpdates.address = data.address?.trim() || null;

        await tx.teacher.update({
          where: { id: user.teacher.id },
          data: teacherUpdates,
        });
      } else if (user.role === Role.STUDENT && user.student) {
        const studentUpdates: any = {};
        if (data.name) studentUpdates.fullName = data.name.trim();
        if (data.nis) studentUpdates.nis = String(data.nis).trim();
        if (data.nisn !== undefined) studentUpdates.nisn = data.nisn ? String(data.nisn).trim() : null;
        if (data.gender) studentUpdates.gender = data.gender === "P" ? Gender.P : Gender.L;
        if (data.address !== undefined) studentUpdates.address = data.address?.trim() || null;

        await tx.student.update({
          where: { id: user.student.id },
          data: studentUpdates,
        });
      } else if (user.role === Role.PARENT && user.parent) {
        const parentUpdates: any = {};
        if (data.name) parentUpdates.fullName = data.name.trim();
        if (data.phone) parentUpdates.phone = normalizePhoneNumber(data.phone);
        if (data.address !== undefined) parentUpdates.address = data.address?.trim() || null;

        await tx.parent.update({
          where: { id: user.parent.id },
          data: parentUpdates,
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: data.name || user.username,
          userRole: user.role,
          action: "UPDATE_USER",
          details: `Admin memperbarui data akun ${user.username} (${user.role})`,
          ipOrDevice: ipOrDevice || "127.0.0.1",
        },
      });

      return { success: true, message: "Data pengguna berhasil diperbarui." };
    });
  }

  /**
   * 5. DIAGNOSE SINGLE ACCOUNT
   */
  static async diagnoseUserAccount(userIdOrIdentifier: string): Promise<AccountDiagnosticItem | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userIdOrIdentifier },
          { username: { equals: userIdOrIdentifier, mode: "insensitive" } },
          { email: { equals: userIdOrIdentifier, mode: "insensitive" } },
          { teacher: { nip: { equals: userIdOrIdentifier, mode: "insensitive" } } },
          { student: { nis: { equals: userIdOrIdentifier, mode: "insensitive" } } },
          { parent: { phone: { equals: userIdOrIdentifier } } },
        ],
      },
      include: {
        teacher: true,
        student: true,
        parent: true,
        qrCodes: { where: { isActive: true }, take: 1 },
      },
    });

    if (!user) return null;

    const issues: string[] = [];
    const hasProfile = !!(user.teacher || user.student || user.parent || user.role === Role.ADMIN);
    const roleMatches =
      (user.role === Role.TEACHER && !!user.teacher) ||
      (user.role === Role.STUDENT && !!user.student) ||
      (user.role === Role.PARENT && !!user.parent) ||
      user.role === Role.ADMIN;

    if (!roleMatches) issues.push(`Role mismatch: user.role is ${user.role} but profile is missing.`);

    const hasValidBcryptHash = !!user.passwordHash && user.passwordHash.length >= 20 && user.passwordHash.startsWith("$2");
    if (!hasValidBcryptHash) issues.push("Password hash is missing, unhashed, or corrupt.");

    const hasActiveQr = (user.qrCodes && user.qrCodes.length > 0) || false;
    if (!hasActiveQr) issues.push("Missing active UserQrCode token.");

    let identifier = user.username;
    if (user.role === Role.TEACHER && user.teacher?.nip) identifier = user.teacher.nip;
    if (user.role === Role.STUDENT && user.student?.nis) identifier = user.student.nis;
    if (user.role === Role.PARENT && user.parent?.phone) identifier = user.parent.phone;

    const name = user.teacher?.fullName || user.student?.fullName || user.parent?.fullName || user.username;

    return {
      id: user.id,
      role: user.role,
      identifier,
      name,
      hasUser: true,
      hasProfile,
      roleMatches,
      hasValidBcryptHash,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      hasActiveQr,
      qrToken: user.qrCodes?.[0]?.qrToken,
      issues,
    };
  }

  /**
   * 6. DIAGNOSE ALL ACCOUNTS
   */
  static async diagnoseAllAccounts() {
    const [teachers, students, parents, users] = await Promise.all([
      prisma.teacher.findMany({ include: { user: true } }),
      prisma.student.findMany({ include: { user: true } }),
      prisma.parent.findMany({ include: { user: true } }),
      prisma.user.findMany({
        include: {
          teacher: true,
          student: true,
          parent: true,
          qrCodes: { where: { isActive: true } },
        },
      }),
    ]);

    const teachersWithoutUser = teachers.filter((t) => !t.user);
    const studentsWithoutUser = students.filter((s) => !s.user);
    const parentsWithoutUser = parents.filter((p) => !p.user);

    const teacherUsersWithoutTeacher = users.filter((u) => u.role === Role.TEACHER && !u.teacher);
    const studentUsersWithoutStudent = users.filter((u) => u.role === Role.STUDENT && !u.student);
    const parentUsersWithoutParent = users.filter((u) => u.role === Role.PARENT && !u.parent);

    const usersWithInvalidPassword = users.filter(
      (u) => !u.passwordHash || u.passwordHash.length < 20 || !u.passwordHash.startsWith("$2")
    );

    const usersWithoutActiveQr = users.filter((u) => !u.qrCodes || u.qrCodes.length === 0);

    const isHealthy =
      teachersWithoutUser.length === 0 &&
      studentsWithoutUser.length === 0 &&
      parentsWithoutUser.length === 0 &&
      teacherUsersWithoutTeacher.length === 0 &&
      studentUsersWithoutStudent.length === 0 &&
      parentUsersWithoutParent.length === 0 &&
      usersWithInvalidPassword.length === 0 &&
      usersWithoutActiveQr.length === 0;

    return {
      isHealthy,
      totalUsers: users.length,
      counts: {
        teacher: teachers.length,
        student: students.length,
        parent: parents.length,
        admin: users.filter((u) => u.role === Role.ADMIN).length,
      },
      summary: {
        allHealthy: isHealthy,
        totalUsers: users.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalParents: parents.length,
        invalidPasswordHashCount: usersWithInvalidPassword.length,
        missingQrCount: usersWithoutActiveQr.length,
        orphanedProfilesCount: teachersWithoutUser.length + studentsWithoutUser.length + parentsWithoutUser.length,
      },
      issues: {
        teachersWithoutUserCount: teachersWithoutUser.length,
        studentsWithoutUserCount: studentsWithoutUser.length,
        parentsWithoutUserCount: parentsWithoutUser.length,
        teacherUsersWithoutTeacherCount: teacherUsersWithoutTeacher.length,
        studentUsersWithoutStudentCount: studentUsersWithoutStudent.length,
        parentUsersWithoutParentCount: parentUsersWithoutParent.length,
        usersWithInvalidPasswordCount: usersWithInvalidPassword.length,
        usersWithoutActiveQrCount: usersWithoutActiveQr.length,
      },
      details: {
        teachersWithoutUser: teachersWithoutUser.map((t) => ({ id: t.id, name: t.fullName, nip: t.nip })),
        studentsWithoutUser: studentsWithoutUser.map((s) => ({ id: s.id, name: s.fullName, nis: s.nis })),
        parentsWithoutUser: parentsWithoutUser.map((p) => ({ id: p.id, name: p.fullName, phone: p.phone })),
        usersWithInvalidPassword: usersWithInvalidPassword.map((u) => ({ id: u.id, username: u.username, role: u.role })),
        usersWithoutActiveQr: usersWithoutActiveQr.map((u) => ({ id: u.id, username: u.username, role: u.role })),
      },
    };
  }

  /**
   * 7. REPAIR TEACHER ACCOUNT
   */
  static async repairTeacherAccount(teacherId: string): Promise<string[]> {
    const logs: string[] = [];
    const defaultPasswordHash = await this.getDefaultPasswordHash();

    await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.findUnique({
        where: { id: teacherId },
        include: { user: { include: { qrCodes: { where: { isActive: true } } } } },
      });

      if (!teacher) throw new Error("Guru tidak ditemukan.");

      let targetUser = teacher.user;
      if (!targetUser) {
        const username = teacher.nip || `guru_${teacher.id.slice(0, 8)}`;
        const email = teacher.email || `${username}@guru.madrasah.id`;
        targetUser = await tx.user.create({
          data: {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            role: Role.TEACHER,
            isActive: true,
            mustChangePassword: true,
          },
          include: { qrCodes: { where: { isActive: true } } },
        });
        await tx.teacher.update({
          where: { id: teacher.id },
          data: { userId: targetUser.id },
        });
        logs.push(`Dibuat User baru & dihubungkan ke Guru: ${teacher.fullName} (NIP: ${teacher.nip})`);
      } else {
        const userUpdates: any = {};
        if (targetUser.role !== Role.TEACHER) {
          userUpdates.role = Role.TEACHER;
          logs.push(`Perbaiki role user ${targetUser.username} menjadi TEACHER`);
        }
        if (!targetUser.passwordHash || !targetUser.passwordHash.startsWith("$2")) {
          userUpdates.passwordHash = defaultPasswordHash;
          userUpdates.mustChangePassword = true;
          logs.push(`Reset password hash akun ${targetUser.username} ke 'smtslogin'`);
        }
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: targetUser.id },
            data: userUpdates,
          });
        }
      }

      // Check QR Token
      if (!targetUser.qrCodes || targetUser.qrCodes.length === 0) {
        const qrToken = generateSecureQRToken("SMTS-TCH");
        await tx.userQrCode.create({
          data: {
            userId: targetUser.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Dibuat QR Token baru untuk ${targetUser.username}: ${qrToken}`);
      }
    });

    return logs;
  }

  /**
   * 8. REPAIR STUDENT ACCOUNT
   */
  static async repairStudentAccount(studentId: string): Promise<string[]> {
    const logs: string[] = [];
    const defaultPasswordHash = await this.getDefaultPasswordHash();

    await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        include: { user: { include: { qrCodes: { where: { isActive: true } } } } },
      });

      if (!student) throw new Error("Siswa tidak ditemukan.");

      let targetUser = student.user;
      if (!targetUser) {
        const username = student.nis || `siswa_${student.id.slice(0, 8)}`;
        const email = `${username}@siswa.madrasah.id`;
        targetUser = await tx.user.create({
          data: {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            role: Role.STUDENT,
            isActive: true,
            mustChangePassword: true,
          },
          include: { qrCodes: { where: { isActive: true } } },
        });
        await tx.student.update({
          where: { id: student.id },
          data: { userId: targetUser.id },
        });
        logs.push(`Dibuat User baru & dihubungkan ke Siswa: ${student.fullName} (NIS: ${student.nis})`);
      } else {
        const userUpdates: any = {};
        if (targetUser.role !== Role.STUDENT) {
          userUpdates.role = Role.STUDENT;
          logs.push(`Perbaiki role user ${targetUser.username} menjadi STUDENT`);
        }
        if (!targetUser.passwordHash || !targetUser.passwordHash.startsWith("$2")) {
          userUpdates.passwordHash = defaultPasswordHash;
          userUpdates.mustChangePassword = true;
          logs.push(`Reset password hash akun ${targetUser.username} ke 'smtslogin'`);
        }
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: targetUser.id },
            data: userUpdates,
          });
        }
      }

      // Check QR Token
      if (!targetUser.qrCodes || targetUser.qrCodes.length === 0) {
        const qrToken = generateSecureQRToken("SMTS-STU");
        await tx.userQrCode.create({
          data: {
            userId: targetUser.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Dibuat QR Token baru untuk ${targetUser.username}: ${qrToken}`);
      }
    });

    return logs;
  }

  /**
   * 9. REPAIR PARENT ACCOUNT
   */
  static async repairParentAccount(parentId: string): Promise<string[]> {
    const logs: string[] = [];
    const defaultPasswordHash = await this.getDefaultPasswordHash();

    await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.findUnique({
        where: { id: parentId },
        include: { user: { include: { qrCodes: { where: { isActive: true } } } } },
      });

      if (!parent) throw new Error("Orang Tua / Wali tidak ditemukan.");

      let targetUser = parent.user;
      if (!targetUser) {
        const normalizedPhone = normalizePhoneNumber(parent.phone) || `ortu_${parent.id.slice(0, 8)}`;
        const email = `ortu.${normalizedPhone}@wali.madrasah.id`;
        targetUser = await tx.user.create({
          data: {
            username: normalizedPhone.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            role: Role.PARENT,
            isActive: true,
            mustChangePassword: true,
          },
          include: { qrCodes: { where: { isActive: true } } },
        });
        await tx.parent.update({
          where: { id: parent.id },
          data: { userId: targetUser.id },
        });
        logs.push(`Dibuat User baru & dihubungkan ke Orang Tua: ${parent.fullName} (Phone: ${parent.phone})`);
      } else {
        const userUpdates: any = {};
        if (targetUser.role !== Role.PARENT) {
          userUpdates.role = Role.PARENT;
          logs.push(`Perbaiki role user ${targetUser.username} menjadi PARENT`);
        }
        if (!targetUser.passwordHash || !targetUser.passwordHash.startsWith("$2")) {
          userUpdates.passwordHash = defaultPasswordHash;
          userUpdates.mustChangePassword = true;
          logs.push(`Reset password hash akun ${targetUser.username} ke 'smtslogin'`);
        }
        if (Object.keys(userUpdates).length > 0) {
          await tx.user.update({
            where: { id: targetUser.id },
            data: userUpdates,
          });
        }
      }

      // Check QR Token
      if (!targetUser.qrCodes || targetUser.qrCodes.length === 0) {
        const qrToken = generateSecureQRToken("SMTS-ORT");
        await tx.userQrCode.create({
          data: {
            userId: targetUser.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Dibuat QR Token baru untuk ${targetUser.username}: ${qrToken}`);
      }
    });

    return logs;
  }

  /**
   * 10. REPAIR ALL DATABASE ACCOUNTS
   * Dispatches repairs for all inconsistencies without destroying any existing data.
   */
  static async repairAllAccounts(): Promise<{ repairCount: number; logs: string[] }> {
    const logs: string[] = [];
    const defaultPasswordHash = await this.getDefaultPasswordHash();

    await prisma.$transaction(async (tx) => {
      // 1. Teachers without User
      const teachers = await tx.teacher.findMany({
        where: { user: { is: null } },
      });
      for (const t of teachers) {
        const username = t.nip || `guru_${t.id.slice(0, 8)}`;
        const email = t.email || `${username}@guru.madrasah.id`;
        const newUser = await tx.user.create({
          data: {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            role: Role.TEACHER,
            isActive: true,
            mustChangePassword: true,
          },
        });
        await tx.teacher.update({
          where: { id: t.id },
          data: { userId: newUser.id },
        });
        const qrToken = generateSecureQRToken("SMTS-TCH");
        await tx.userQrCode.create({
          data: {
            userId: newUser.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Hubungkan Teacher ${t.fullName} (${t.nip}) ke User baru ID ${newUser.id}`);
      }

      // 2. Students without User
      const students = await tx.student.findMany({
        where: { user: { is: null } },
      });
      for (const s of students) {
        const username = s.nis || `siswa_${s.id.slice(0, 8)}`;
        const email = `${username}@siswa.madrasah.id`;
        const newUser = await tx.user.create({
          data: {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            role: Role.STUDENT,
            isActive: true,
            mustChangePassword: true,
          },
        });
        await tx.student.update({
          where: { id: s.id },
          data: { userId: newUser.id },
        });
        const qrToken = generateSecureQRToken("SMTS-STU");
        await tx.userQrCode.create({
          data: {
            userId: newUser.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Hubungkan Student ${s.fullName} (${s.nis}) ke User baru ID ${newUser.id}`);
      }

      // 3. Parents without User
      const parents = await tx.parent.findMany({
        where: { user: { is: null } },
      });
      for (const p of parents) {
        const phone = normalizePhoneNumber(p.phone) || `ortu_${p.id.slice(0, 8)}`;
        const email = `ortu.${phone}@wali.madrasah.id`;
        const newUser = await tx.user.create({
          data: {
            username: phone.toLowerCase(),
            email: email.toLowerCase(),
            passwordHash: defaultPasswordHash,
            role: Role.PARENT,
            isActive: true,
            mustChangePassword: true,
          },
        });
        await tx.parent.update({
          where: { id: p.id },
          data: { userId: newUser.id },
        });
        const qrToken = generateSecureQRToken("SMTS-ORT");
        await tx.userQrCode.create({
          data: {
            userId: newUser.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Hubungkan Parent ${p.fullName} (${p.phone}) ke User baru ID ${newUser.id}`);
      }

      // 4. Invalid Password Hashes
      const invalidPassUsers = await tx.user.findMany({
        where: {
          OR: [
            { passwordHash: "" },
            { passwordHash: { not: { startsWith: "$2" } } },
          ],
        },
      });
      for (const u of invalidPassUsers) {
        await tx.user.update({
          where: { id: u.id },
          data: {
            passwordHash: defaultPasswordHash,
            mustChangePassword: true,
          },
        });
        logs.push(`Perbaiki password hash user ${u.username} (${u.role}) -> reset ke default smtslogin`);
      }

      // 5. Missing Active QR Codes
      const usersWithoutQr = await tx.user.findMany({
        where: { qrCodes: { none: { isActive: true } } },
      });
      for (const u of usersWithoutQr) {
        const prefix =
          u.role === Role.TEACHER
            ? "SMTS-TCH"
            : u.role === Role.STUDENT
            ? "SMTS-STU"
            : u.role === Role.PARENT
            ? "SMTS-ORT"
            : "SMTS-ADM";
        const qrToken = generateSecureQRToken(prefix);
        await tx.userQrCode.create({
          data: {
            userId: u.id,
            qrToken,
            isActive: true,
          },
        });
        logs.push(`Buat UserQrCode baru untuk user: ${u.username} (${qrToken})`);
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          userId: "system",
          userName: "Database Diagnostic & Repair Service",
          userRole: Role.ADMIN,
          action: "REPAIR_ACCOUNTS",
          details: `Perbaikan database akun otomatis: ${logs.length} item diperbaiki.`,
          ipOrDevice: "127.0.0.1",
        },
      });
    });

    return { repairCount: logs.length, logs };
  }
}
