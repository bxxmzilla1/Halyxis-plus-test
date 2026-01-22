
import React, { useState, useEffect } from 'react';
import { getAllUsers, getAllTransactions } from '../utils/storageUtils';
import { UsersIcon, DollarSignIcon, TrendingUpIcon, ActivityIcon, CalendarIcon } from './IconComponents';
import { Transaction } from '../types';

interface DashboardStats {
  totalUsers: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  recentTransactions: Transaction[];
}

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    monthlyRevenue: 0,
    dailyRevenue: 0,
    recentTransactions: []
  });

  useEffect(() => {
    const users = getAllUsers();
    const transactions = getAllTransactions();
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    let monthlyRevenue = 0;
    let dailyRevenue = 0;

    transactions.forEach(t => {
        if (t.status === 'completed') {
            const tDate = new Date(t.date);
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                monthlyRevenue += t.amount;
                if (tDate.getDate() === currentDay) {
                    dailyRevenue += t.amount;
                }
            }
        }
    });

    setStats({
        totalUsers: users.length,
        monthlyRevenue,
        dailyRevenue,
        recentTransactions: transactions.slice(0, 8) // Show last 8
    });
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
       <div className="mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                <p className="text-gray-400 text-sm mt-1">Overview of platform performance and revenue.</p>
            </div>
            <div className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full border border-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Live Data
            </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex items-center gap-5">
            <div className="p-4 bg-indigo-900/40 rounded-lg border border-indigo-500/20">
                <UsersIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">Total Users</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</h3>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                    <TrendingUpIcon className="w-3 h-3" />
                    <span>+12% this month</span>
                </div>
            </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex items-center gap-5">
            <div className="p-4 bg-emerald-900/40 rounded-lg border border-emerald-500/20">
                <DollarSignIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">Monthly Revenue</p>
                <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.monthlyRevenue)}</h3>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                    <TrendingUpIcon className="w-3 h-3" />
                    <span>+8% vs last month</span>
                </div>
            </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex items-center gap-5">
            <div className="p-4 bg-blue-900/40 rounded-lg border border-blue-500/20">
                <ActivityIcon className="w-8 h-8 text-blue-400" />
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">Daily Revenue</p>
                <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.dailyRevenue)}</h3>
                <p className="text-xs text-gray-500 mt-2">
                    Updated just now
                </p>
            </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                Recent Top-Ups
             </h3>
             <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stats.recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-gray-200 font-medium text-sm">{tx.userName}</span>
                        <span className="text-gray-500 text-xs">{tx.userEmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                        {tx.planName}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-6 py-4">
                    {tx.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Success
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-500/20 text-xs font-medium">
                             <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                            Pending
                        </span>
                    )}
                  </td>
                </tr>
              ))}
               {stats.recentTransactions.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No transactions found.
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
