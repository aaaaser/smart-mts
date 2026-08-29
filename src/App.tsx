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

const MainLayout: React.FC = () => {
  const { activeTab, currentUser } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return currentUser?.role === "siswa" ? <StudentDashboardView /> : <DashboardView />;
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
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      {/* Floating AI Drawer */}
      <AIAssistantDrawer isOpen={isAIDrawerOpen} onClose={() => setIsAIDrawerOpen(false)} />

      {/* Toast Alert System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
