import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { StudentDashboardView } from "./components/student/StudentDashboardView";
import { TeacherDutyManagementView } from "./components/duties/TeacherDutyManagementView";
import { MasterDataView } from "./components/master/MasterDataView";
import { AttendanceView } from "./components/attendance/AttendanceView";
import { CurriculumView } from "./components/curriculum/CurriculumView";
import { QuestionBankView } from "./components/questions/QuestionBankView";
import { ExamsView } from "./components/exams/ExamsView";
import { AssignmentsView } from "./components/assignments/AssignmentsView";
import { AssessmentView } from "./components/assessment/AssessmentView";
import { ERaporView } from "./components/rapor/ERaporView";
import { SettingsView } from "./components/settings/SettingsView";
import { AIAssistantDrawer } from "./components/ai/AIAssistantDrawer";
import { ToastContainer } from "./components/common/ToastContainer";

// Public Website Components
import { PublicNavbar } from "./components/public/PublicNavbar";
import { PublicFooter } from "./components/public/PublicFooter";
import { PublicHomeView } from "./components/public/PublicHomeView";
import { PublicStructureView } from "./components/public/PublicStructureView";
import { PublicBlogListView } from "./components/public/PublicBlogListView";
import { PublicBlogDetailView } from "./components/public/PublicBlogDetailView";
import { PublicContactView } from "./components/public/PublicContactView";
import { PublicLoginView } from "./components/public/PublicLoginView";

// Blog Dashboard Management Components
import { TeacherBlogManagementView } from "./components/blog/TeacherBlogManagementView";
import { AdminBlogManagementView } from "./components/blog/AdminBlogManagementView";
import { ChangePasswordView } from "./components/auth/ChangePasswordView";

const PublicLayout: React.FC = () => {
  const { publicRoute } = useApp();

  // If login route, show standalone login page
  if (publicRoute === "login") {
    return <PublicLoginView />;
  }

  const renderPublicContent = () => {
    switch (publicRoute) {
      case "home":
        return <PublicHomeView />;
      case "structure":
        return <PublicStructureView />;
      case "blog":
        return <PublicBlogListView />;
      case "blog_detail":
        return <PublicBlogDetailView />;
      case "contact":
        return <PublicContactView />;
      default:
        return <PublicHomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-700 selection:text-white">
      {/* Public Header */}
      <PublicNavbar />

      {/* Main Public View */}
      <main className="flex-1">{renderPublicContent()}</main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
};

const DashboardLayout: React.FC = () => {
  const { activeTab, currentUser, navigateToPublic, showToast } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  // Session guard: Ensure visitors cannot access dashboard without logging in
  React.useEffect(() => {
    if (!currentUser) {
      showToast("warning", "Akses Terbatas", "Silakan login terlebih dahulu untuk mengakses dashboard madrasah.");
      navigateToPublic("login");
    }
  }, [currentUser, navigateToPublic, showToast]);

  if (!currentUser) {
    return null;
  }

  // Mandatory password change check for initial login
  if (currentUser.mustChangePassword) {
    return <ChangePasswordView />;
  }

  const renderDashboardContent = () => {
    switch (activeTab) {
      case "dashboard":
        return currentUser?.role === "siswa" ? <StudentDashboardView /> : <DashboardView />;
      case "blog_admin":
        return <AdminBlogManagementView />;
      case "blog_teacher":
        return <TeacherBlogManagementView />;
      case "duties":
      case "teacher_duties":
        return <TeacherDutyManagementView />;
      case "master":
      case "master_users":
      case "master_classes":
      case "master_subjects":
      case "master_schedules":
      case "schedules":
        return <MasterDataView />;
      case "attendance":
        return <AttendanceView />;
      case "curriculum":
        return <CurriculumView />;
      case "questions":
        return <QuestionBankView />;
      case "exams":
        return <ExamsView />;
      case "assignments":
        return <AssignmentsView />;
      case "assessment":
        return <AssessmentView />;
      case "rapor":
        return <ERaporView />;
      case "reports":
        return <AssessmentView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-700 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
      />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 lg:ml-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto">{renderDashboardContent()}</div>
        </main>
      </div>

      {/* Floating AI Drawer */}
      <AIAssistantDrawer isOpen={isAIDrawerOpen} onClose={() => setIsAIDrawerOpen(false)} />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { appMode } = useApp();

  return (
    <>
      {appMode === "public" ? <PublicLayout /> : <DashboardLayout />}
      {/* Universal Toast Alert System */}
      <ToastContainer />
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RootApp />
    </AppProvider>
  );
}
