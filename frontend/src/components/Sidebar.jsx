import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart2, 
  History, 
  Bot, 
  User,
  Zap,
  ChevronRight,
  X,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useTheme } from './ThemeContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/analysis', label: 'Analysis', icon: BarChart2 },
  { path: '/history', label: 'History', icon: History },
  { path: '/assistant', label: 'AI Assistant', icon: Bot },
  { path: '/profile', label: 'Profile', icon: User },
];

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();

  const NavItem = ({ item }) => {
    const isActive = item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path) && item.path !== '/';

    return (
      <NavLink
        to={item.path}
        onClick={() => setMobileOpen && setMobileOpen(false)}
        className={`
          group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-200 border
          ${isActive
            ? 'bg-purple-100 dark:bg-blue-500/10 text-purple-700 dark:text-blue-400 border-purple-200 dark:border-blue-500/30 shadow-sm shadow-purple-100 dark:shadow-none'
            : 'text-slate-500 dark:text-slate-400 hover:text-purple-700 dark:hover:text-slate-100 hover:bg-purple-50 dark:hover:bg-slate-900/60 border-transparent'
          }
        `}
      >
        <item.icon
          size={18}
          className={`transition-colors flex-shrink-0 ${isActive ? 'text-purple-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-slate-300'}`}
        />
        <span className="flex-1 text-xs">{item.label}</span>
        {isActive && <ChevronRight size={13} className="text-purple-500/50 dark:text-blue-400/50" />}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="sidebar bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-colors">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/25 dark:shadow-blue-500/25">
              <Zap size={15} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-950 dark:text-white">Smart DevTool</span>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">SaaS Console</p>
            </div>
            {/* Mobile close */}
            <button
              className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider px-3.5 mb-2.5">
            Navigation
          </p>
          {navItems.map(item => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom Panel */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          
          {/* Quick theme toggle inside sidebar */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-850 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="text-amber-500" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-purple-500 dark:text-indigo-500" />
                <span>Dark Theme</span>
              </>
            )}
          </button>

          {/* User Profile display */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-850">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-7 h-7',
                  userButtonPopoverCard: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
                }
              }}
            />
            {user && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                  {user.firstName || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">
                  {user.emailAddresses?.[0]?.emailAddress}
                </p>
              </div>
            )}
          </div>
          
          {/* Version badge */}
          <div className="px-3 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SaaS Edition
            </span>
            <span className="font-semibold text-slate-350 dark:text-slate-650">v2.0</span>
          </div>
        </div>
      </div>
    </>
  );
};

export const MobileMenuButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-center text-slate-500 dark:text-slate-300 shadow-md hover:shadow-lg hover:text-slate-900 dark:hover:text-white transition-all"
  >
    <Menu size={17} />
  </button>
);

export default Sidebar;
