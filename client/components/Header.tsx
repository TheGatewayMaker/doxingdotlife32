import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { HomeIcon } from "@/components/Icons";
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
          <span className="font-black text-lg text-white sm:hidden">
            DDL
          </span>
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
          >
            🔍 Dox Anyone
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/uppostpanel"
                className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
              >
                📤 Upload
              </Link>
              <Link
                to="/admin-panel"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-all"
              >
                ⚙️ Admin
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
          className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                  🔍 Dox Anyone
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/uppostpanel"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 w-full px-4 py-3 text-foreground font-semibold hover:bg-muted rounded-lg transition-colors"
                    >
                      📤 Upload
                    </Link>
                    <Link
                      to="/admin-panel"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 w-full px-4 py-3 text-amber-500 font-semibold hover:bg-amber-500/10 rounded-lg transition-colors bg-amber-500/5"
                    >
                      ⚙️ Admin Panel
                    </Link>
                  </>
                )}
              </nav>
              {isAuthenticated && (
                <div className="p-4 border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive font-semibold rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all"
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
