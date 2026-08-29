import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  GraduationCap,
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Users,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const PublicNavbar: React.FC = () => {
  const {
    publicRoute,
    navigateToPublic,
    navigateToDashboard,
    currentUser,
    schoolProfile,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Beranda", route: "home" as const },
    { label: "Struktur Organisasi", route: "structure" as const },
    { label: "Berita & Blog", route: "blog" as const },
    { label: "Kontak", route: "contact" as const },
  ];

  const handleNavClick = (route: typeof navLinks[0]["route"]) => {
    navigateToPublic(route);
    setMobileMenuOpen(false);
  };

  return (
    <header id="public-header" className="sticky top-0 z-50 w-full bg-white shadow-sm transition-all duration-200">
      {/* Top Notice / Contact Bar */}
      <div id="public-top-bar" className="bg-emerald-900 text-emerald-100 text-xs font-medium py-1.5 px-4 sm:px-8 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{schoolProfile.address || "Jl. Pendidikan Islami No. 45, Kompleks Madrasah"}</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 border-l border-emerald-700/60 pl-4">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{schoolProfile.phone || "(021) 7890-1234"}</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 border-l border-emerald-700/60 pl-4">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{schoolProfile.email || "info@smart-mts.sch.id"}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase">
              NPSN: {schoolProfile.npsn || "20109988"} • Akreditasi A Unggul
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <button
            id="brand-logo-btn"
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-3.5 group text-left focus:outline-none"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  smart MTs
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  sMTs
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {schoolProfile.name || "MTs Unggulan Terpadu"}
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav id="desktop-public-nav" className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = publicRoute === link.route;
              return (
                <button
                  key={link.route}
                  id={`nav-link-${link.route}`}
                  onClick={() => handleNavClick(link.route)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "text-emerald-700 bg-emerald-50 shadow-xs"
                      : "text-slate-600 hover:text-emerald-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action / Auth Button */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <button
                id="btn-goto-dashboard"
                onClick={() => navigateToDashboard("dashboard")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg active:scale-98"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard ({currentUser.role.toUpperCase()})</span>
              </button>
            ) : (
              <button
                id="btn-goto-login"
                onClick={() => navigateToPublic("login")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal sMTs</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 pb-3">
            {navLinks.map((link) => {
              const isActive = publicRoute === link.route;
              return (
                <button
                  key={link.route}
                  id={`mobile-nav-link-${link.route}`}
                  onClick={() => handleNavClick(link.route)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold ${
                    isActive
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            {currentUser ? (
              <button
                id="mobile-btn-goto-dashboard"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateToDashboard("dashboard");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard ({currentUser.role.toUpperCase()})</span>
              </button>
            ) : (
              <button
                id="mobile-btn-goto-login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateToPublic("login");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal sMTs</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
