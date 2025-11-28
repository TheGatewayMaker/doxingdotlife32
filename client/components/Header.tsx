import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import {
  HomeIcon,
  UploadIcon,
  SettingsIcon,
  SearchAltIcon,
} from "@/components/Icons";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    closeSidebar();
    navigate("/");
  };

  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-lg animate-fadeIn">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-md flex-shrink-0">
            <img
              src="https://i.ibb.co/rG8yDddq/doxingdotlifelogogeniune888175141.png"
              alt="Doxing Dot Life Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-black text-lg text-white hidden sm:inline">
            Doxing Dot Life
          </span>
          <span className="font-black text-lg text-white sm:hidden">DDL</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            Home
          </Link>
          <Link
            to="/dox-anyone"
            className="relative flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg overflow-hidden group"
            style={{
              background: "linear-gradient(#1a1a2e, #1a1a2e) padding-box",
              border: "1px solid transparent",
            }}
          >
            <div
              className="absolute inset-0 rounded-lg z-[-1]"
              style={{
                background: "conic-gradient(from 0deg, #3b82f6, #60a5fa, #3b82f6)",
                animation: "rotation 3s linear infinite",
              }}
            />
            <div
              className="absolute inset-[1px] rounded-lg z-[-1] bg-blue-600"
            />
            <SearchAltIcon className="w-4 h-4" />
            Dox Anyone
          </Link>
          <style>{`
            @keyframes rotation {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(-360deg); }
            }
          `}</style>
          {isAuthenticated && (
            <>
              <Link
                to="/uppostpanel"
                className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                Upload
              </Link>
              <Link
                to="/admin-panel"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
                Admin
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors z-50"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Mobile Sidebar Navigation */}
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeSidebar}
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-16 bottom-0 w-64 bg-slate-800 border-r border-slate-700 md:hidden z-50 animate-slideInLeft shadow-lg flex flex-col">
              <nav className="p-4 space-y-3 overflow-y-auto flex-1">
                <Link
                  to="/"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 font-semibold hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                >
                  <HomeIcon className="w-5 h-5" />
                  Home
                </Link>
                <Link
                  to="/dox-anyone"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 w-full px-4 py-3 text-white font-semibold hover:bg-blue-600 rounded-lg transition-colors bg-blue-600/20"
                >
                  <SearchAltIcon className="w-4 h-4" />
                  Dox Anyone
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/uppostpanel"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 font-semibold hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                    >
                      <UploadIcon className="w-4 h-4" />
                      Upload
                    </Link>
                    <Link
                      to="/admin-panel"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white font-semibold hover:bg-yellow-600 rounded-lg transition-colors bg-yellow-600/20"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  </>
                )}
              </nav>
              {isAuthenticated && (
                <div className="p-4 border-t border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
