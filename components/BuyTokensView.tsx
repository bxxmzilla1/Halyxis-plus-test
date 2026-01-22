
import React, { useState } from 'react';
import { getTokenPacks } from '../utils/storageUtils';
import { addTokensToUser } from '../utils/storageUtils';
import type { User, TokenPack } from '../types';
import { SparklesIcon } from './IconComponents';

interface BuyTokensViewProps {
  user: User;
  onPurchase: (updatedUser: User) => void;
  onClose: () => void;
}

export const BuyTokensView: React.FC<BuyTokensViewProps> = ({ user, onPurchase, onClose }) => {
  const tokenPacks = getTokenPacks();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const handlePurchase = async (pack: TokenPack) => {
    setIsLoading(pack.id);
    setPurchaseSuccess(null);
    
    // Simulate API call for payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedUser = addTokensToUser(user.email, pack.tokens);
    if (updatedUser) {
      onPurchase(updatedUser);
      setPurchaseSuccess(`Successfully added ${pack.tokens.toLocaleString()} tokens!`);
    }
    setIsLoading(null);
    // Automatically close after a delay
    setTimeout(() => {
        onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#020408]/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-[#0a0c10] border border-white/5 rounded-3xl shadow-2xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10 p-2 rounded-full hover:bg-white/5"
                aria-label="Close"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="p-8 md:p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-900/10 mb-6 border border-teal-500/20">
                    <SparklesIcon className="w-8 h-8 text-teal-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Get More Tokens</h2>
                <p className="text-gray-400 text-lg font-light">
                    Each image generation costs 30 tokens.
                </p>
                {purchaseSuccess && (
                     <p className="mt-6 text-teal-400 bg-teal-900/20 border border-teal-500/20 py-3 px-6 rounded-xl font-medium inline-block">{purchaseSuccess}</p>
                )}
            </div>

            <div className="p-8 md:p-12 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                {tokenPacks.map(pack => (
                    <div key={pack.id} className={`rounded-2xl p-8 flex flex-col text-center border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${pack.id === 'popular' ? 'border-teal-500/50 bg-[#0f1115] shadow-teal-900/10' : 'border-white/5 bg-[#0f1115]'}`}>
                        {pack.badge && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{pack.badge}</div>
                        )}
                        <div className="text-4xl my-6 opacity-80 grayscale group-hover:grayscale-0 transition-all">{pack.icon}</div>
                        <h3 className={`text-xl font-bold ${pack.id === 'popular' ? 'text-teal-400' : 'text-white'}`}>{pack.name}</h3>
                        <p className="text-4xl font-bold text-white my-4">{pack.tokens.toLocaleString()}</p>
                        <p className="text-gray-500 mb-8 text-xs uppercase tracking-widest font-semibold">Tokens</p>
                        <button
                            onClick={() => handlePurchase(pack)}
                            disabled={!!isLoading}
                            className={`w-full mt-auto py-3.5 px-4 rounded-xl text-sm font-bold transition-all ${
                                pack.id === 'pro'
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'bg-teal-600 text-white hover:bg-teal-500'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading === pack.id ? (
                                <svg className="animate-spin mx-auto h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                `Buy for ${pack.price}`
                            )}
                        </button>
                    </div>
                ))}
            </div>
             <p className="text-[10px] text-gray-700 text-center pb-8 px-8 uppercase tracking-widest font-semibold">
                Demonstration Mode Only
             </p>
        </div>
        <style>{`
            @keyframes fade-in-up {
                0% {
                    opacity: 0;
                    transform: translateY(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            /* Custom scrollbar for webkit browsers */
            .overflow-y-auto::-webkit-scrollbar {
                width: 6px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
                background: transparent;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.1); 
                border-radius: 10px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
        `}</style>
    </div>
  );
};
