
import React from 'react';
import { Home, Users, Banknote, CheckSquare, LogOut, Menu, MessageCircle } from 'lucide-react';
import { Roommate } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: Roommate | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'expenses', label: 'Expenses', icon: Banknote },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'roommates', label: 'Roommates', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <Users className="w-8 h-8" /> RoomieSync
          </h1>
          {currentUser && (
            <p className="mt-2 text-sm text-gray-500">
              Hi, <span className="font-semibold text-gray-800">{currentUser.name}</span>
            </p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600">RoomieSync</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 absolute top-16 left-0 w-full z-10 shadow-lg">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                  activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
