
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardView } from './DashboardView';
import { UsersView } from './UsersView';
import { PricingView } from './PricingView';
import { HomeIcon } from './IconComponents';

interface AdminPageProps {
  onBackToApp: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToApp }) => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'users':
        return <UsersView />;
      case 'pricing':
        return <PricingView />;
      case 'dashboard':
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
       <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10 flex-shrink-0">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight text-white">
                    Admin Panel
                </h1>
                <button
                    onClick={onBackToApp}
                    className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                    <HomeIcon className="w-4 h-4" />
                    Back to App
                </button>
            </div>
       </header>
       <div className="flex flex-grow">
        <Sidebar currentView={currentView} setView={setCurrentView} />
        <main className="flex-grow overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};
