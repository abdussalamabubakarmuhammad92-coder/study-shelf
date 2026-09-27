import { ChevronDown, ChevronRight, GraduationCap, LayoutDashboard, LogIn, LogOut, Menu, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { Faculty } from '../lib/types';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { DarkModeToggle } from './DarkModeToggle';

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    api.get<Faculty[]>('/faculties/').then((res) => setFaculties(res.data));
  }, []);

  useEffect(() => {
    // Auto-expand the faculty of the route we're on
    const match = location.pathname.match(/^\/browse\/([^/]+)/);
    if (match) setExpanded(match[1]);
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/30">
            <GraduationCap size={20} />
          </span>
          <span className="text-base font-bold tracking-tight">
            Study<span className="text-primary-600 dark:text-primary-400">Shelf</span>
          </span>
        </Link>
        <button onClick={onClose} className="p-1 text-slate-500 lg:hidden" aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>

      <nav className="px-3 pb-8">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                : 'text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800'
            }`
          }
        >
          <LayoutDashboard size={17} /> Home
        </NavLink>

        <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Faculties
        </p>
        {faculties.map((faculty) => {
          const isOpen = expanded === faculty.slug;
          return (
            <div key={faculty.id} className="mb-0.5">
              <button
                onClick={() => setExpanded(isOpen ? null : faculty.slug)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  isOpen
                    ? 'bg-gray-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <ChevronDown
                  size={15}
                  className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                />
                <span className="flex-1 leading-snug">{faculty.name}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {faculty.resource_count}
                </span>
              </button>
              <div
                className={`grid overflow-hidden transition-all duration-300 ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0">
                  <div className="ml-5 border-l border-gray-200 py-1 dark:border-slate-800">
                    {faculty.departments.map((dept) => (
                      <NavLink
                        key={dept.id}
                        to={`/browse/${faculty.slug}/${dept.slug}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition ${
                            isActive
                              ? 'font-semibold text-primary-600 dark:text-primary-400'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                          }`
                        }
                      >
                        <ChevronRight size={12} className="shrink-0 text-slate-300 dark:text-slate-600" />
                        <span className="truncate">{dept.name}</span>
                        <span className="ml-auto text-[10px] text-slate-400">{dept.resource_count}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const { user, logout, isAdmin } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:pl-[19.5rem]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-2 font-bold lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <GraduationCap size={16} />
            </span>
            StudyShelf
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="relative" ref={menuRef}>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link to="/admin" className="btn-secondary !py-2">
                      Admin
                    </Link>
                  )}
                  {user.role === 'contributor' && (
                    <Link to="/dashboard" className="btn-primary !py-2">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); }}
                    className="rounded-xl p-2 text-slate-500 transition hover:bg-gray-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    title={`Log out ${user.username}`}
                    aria-label="Log out"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-secondary !py-2">
                <LogIn size={15} /> Contributor Login
              </Link>
            )}
            <DarkModeToggle dark={dark} toggle={toggleDark} />
          </div>
        </div>
      </header>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="mx-auto max-w-6xl animate-fade-in px-4 py-8 sm:px-6 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
