
import React from 'react';
import { UsersIcon, CreditCardIcon, LayoutDashboardIcon } from './IconComponents';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'pricing', label: 'Pricing', icon: CreditCardIcon },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700 h-full flex-shrink-0">
      <div className="p-6">
         <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Menu</h2>
         <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
         </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-gray-700">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-xs text-gray-400 mb-2">Current Plan</p>
            <p className="text-sm font-bold text-white mb-1">Admin Access</p>
            <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-3/4"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
