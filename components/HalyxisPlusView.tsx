
import React from 'react';
import { PlusCircleIcon } from './IconComponents';

export const HalyxisPlusView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
        <PlusCircleIcon className="w-12 h-12 text-gray-600" />
      </div>
      <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
        Halyxis+
      </h2>
      <p className="text-lg text-gray-500 max-w-md">
        This space is reserved for future premium features and creator tools.
        Stay tuned for updates.
      </p>
    </div>
  );
};
