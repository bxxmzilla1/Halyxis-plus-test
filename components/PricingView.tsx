
import React, { useState, useEffect } from 'react';
import { PricingTier } from '../types';
import { getPricingTiers, savePricingTiers } from '../utils/storageUtils';
import { SaveIcon, EditIcon } from './IconComponents';

export const PricingView: React.FC = () => {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingTier>>({});

  useEffect(() => {
    setTiers(getPricingTiers());
  }, []);

  const handleEdit = (tier: PricingTier) => {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  };

  const handleSave = () => {
    if (!editingId) return;
    
    const updatedTiers = tiers.map(t => {
        if (t.id === editingId) {
            return { ...t, ...editForm } as PricingTier;
        }
        return t;
    });

    setTiers(updatedTiers);
    savePricingTiers(updatedTiers);
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field: keyof PricingTier, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
       <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Pricing Plans</h2>
            <p className="text-gray-400 text-sm mt-1">Configure subscription tiers.</p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className={`bg-gray-800 rounded-2xl border ${editingId === tier.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-700'} p-6 flex flex-col relative transition-all duration-300 hover:shadow-xl`}>
            
            {editingId === tier.id ? (
                 <>
                    <div className="mb-4 space-y-3">
                         <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Plan Name</label>
                            <input 
                                type="text" 
                                value={editForm.name || ''} 
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            />
                         </div>
                         <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Price</label>
                            <input 
                                type="text" 
                                value={editForm.price || ''} 
                                onChange={(e) => handleChange('price', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            />
                         </div>
                    </div>
                    <div className="mt-auto pt-4 flex gap-2">
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <SaveIcon className="w-4 h-4" /> Save Changes
                        </button>
                        <button 
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg text-sm font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                 </>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                        <button 
                            onClick={() => handleEdit(tier)}
                            className="text-gray-500 hover:text-indigo-400 p-1"
                            title="Edit Tier"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mb-6">
                        <span className="text-3xl font-bold text-white">{tier.price}</span>
                        <span className="text-gray-400 text-sm"> / month</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                        {tier.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-300">
                                <svg className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                            </li>
                        ))}
                    </ul>
                    
                    <button className="w-full py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white transition-all text-sm font-semibold">
                        View Details
                    </button>
                </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
