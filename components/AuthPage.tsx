
import React, { useState } from 'react';
import { MailIcon, LockIcon, UserIcon, SparklesIcon } from './IconComponents';
import { User } from '../types';
import { saveUserToDb, getUserFromDb, getAllUsers } from '../utils/storageUtils';

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate inputs
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
    }

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      let user: User;

      const existingUser = getUserFromDb(formData.email);

      if (isLogin) {
          if (existingUser) {
              user = existingUser;
          } else {
              setError('No account found with this email.');
              return;
          }
      } else {
          // Signup
          if (existingUser) {
              setError('An account with this email already exists.');
              return;
          } else {
             user = {
                name: formData.name,
                email: formData.email,
             };
          }
      }

      // Persist to "DB"
      saveUserToDb(user);
      onLogin(user);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#0a0c10] border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-teal-500/10 blur-[60px] pointer-events-none"></div>

        {/* Header Section */}
        <div className="p-8 pb-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-900/20 mb-6 border border-teal-500/20 shadow-lg shadow-teal-900/20">
            <SparklesIcon className="w-7 h-7 text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join Halyxis'}
          </h2>
          <p className="text-gray-400 text-sm font-light">
            {isLogin 
              ? 'Access your professional studio.' 
              : 'Setup your creator profile.'}
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-[#050608] text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium"
                    placeholder="Full Name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                   className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-[#050608] text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-widest">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                   className="block w-full pl-12 pr-4 py-3.5 border border-white/10 rounded-xl bg-[#050608] text-white placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-4 px-4 rounded-xl shadow-lg text-sm font-bold text-black bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0c10] focus:ring-teal-500 transition-all transform hover:-translate-y-0.5 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                 <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                 isLogin ? 'Enter Studio' : 'Create Profile'
              )}
            </button>
          </form>
        </div>

        {/* Footer Toggle */}
        <div className="bg-[#050608] p-5 text-center border-t border-white/5">
          <p className="text-sm text-gray-500">
            {isLogin ? "No workspace? " : "Existing creator? " }
            <button
              onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setFormData({ name: '', email: '', password: '' });
              }}
              className="font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              {isLogin ? 'Initialize Profile' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
