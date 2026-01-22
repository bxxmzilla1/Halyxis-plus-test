
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getAllUsers } from '../utils/storageUtils';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = () => {
    const loadedUsers = getAllUsers();
    setUsers(loadedUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-white">Users Directory</h2>
            <p className="text-gray-400 text-sm mt-1">Manage platform users.</p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
            <span className="text-gray-400 text-sm">Total Users: </span>
            <span className="text-white font-bold">{users.length}</span>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-200 font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {user.email}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                  <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                          No users found in database.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
