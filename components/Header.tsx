
import React from 'react';
import { SparklesIcon, SettingsIcon, MenuIcon, HistoryIcon } from './IconComponents';

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleHistory: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onToggleHistory, onOpenSettings }) => {
  return (
    <header className="h-20 bg-[#020408]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Toggle Sidebar"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <SparklesIcon className="w-8 h-8 text-teal-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Halyxis
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Creator Settings"
          >
              <SettingsIcon className="w-5 h-5" />
          </button>
          <button
              onClick={onToggleHistory}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="View History"
          >
              <HistoryIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
