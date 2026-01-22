
import React from 'react';
import { SparklesIcon, PlusCircleIcon } from './IconComponents';

interface AppSidebarProps {
  currentView: 'halyxis' | 'halyxis+';
  isOpen: boolean;
  setView: (view: 'halyxis' | 'halyxis+') => void;
}

const NavItem: React.FC<{
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 relative group focus:outline-none ${
      isActive
        ? 'bg-teal-500/10 text-teal-300'
        : 'text-gray-500 hover:text-white hover:bg-white/5'
    }`}
  >
    <Icon className="w-6 h-6" />
    <div
      className={`absolute left-0 h-8 w-1 rounded-r-full bg-teal-400 transition-transform duration-300 ease-in-out ${
        isActive ? 'scale-y-100' : 'scale-y-0'
      }`}
    ></div>
  </button>
);

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, currentView, setView }) => {
  return (
    <aside className={`fixed top-0 left-0 h-screen bg-[#0a0c10] border-r border-white/5 z-30 flex flex-col items-center pt-20 pb-8 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-20' : 'w-0 border-r-0'}`}>
      <nav className="flex flex-col items-center gap-6">
        <NavItem
          label="Halyxis Generator"
          icon={SparklesIcon}
          isActive={currentView === 'halyxis'}
          onClick={() => setView('halyxis')}
        />
        <NavItem
          label="Halyxis+"
          icon={PlusCircleIcon}
          isActive={currentView === 'halyxis+'}
          onClick={() => setView('halyxis+')}
        />
      </nav>
    </aside>
  );
};
