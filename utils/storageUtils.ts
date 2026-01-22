
import { User, HistoryItem, PricingTier, Transaction, TokenPack } from '../types';

const USERS_DB_KEY = 'ai_persona_users_db';
const PRICING_DB_KEY = 'ai_persona_pricing_db';

// --- Users ---

export const getAllUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse users db", e);
    return [];
  }
};

export const getUserFromDb = (email: string): User | undefined => {
  const users = getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const saveUserToDb = (user: User) => {
  const users = getAllUsers();
  const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  
  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user };
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const addTokensToUser = (email: string, amount: number): User | undefined => {
    const user = getUserFromDb(email);
    if (!user) return undefined;
    
    const newTokens = (user.tokens || 0) + amount;
    const updatedUser = { ...user, tokens: newTokens };
    saveUserToDb(updatedUser);
    return updatedUser;
};

// --- Pricing ---

const DEFAULT_TIERS: PricingTier[] = [
    {
        id: 'basic',
        name: 'Basic',
        price: '$9.99',
        features: ['100 AI Generations', 'Standard Processing', 'Email Support']
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$29.99',
        features: ['Unlimited Generations', 'Fast Processing', 'Priority Support', 'High Res Downloads']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Contact Us',
        features: ['Custom Solutions', 'API Access', 'Dedicated Account Manager']
    }
];

export const getPricingTiers = (): PricingTier[] => {
    try {
        const data = localStorage.getItem(PRICING_DB_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Failed to load pricing", e);
    }
    return DEFAULT_TIERS;
};

export const savePricingTiers = (tiers: PricingTier[]) => {
    localStorage.setItem(PRICING_DB_KEY, JSON.stringify(tiers));
};

// --- Transactions ---

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', userName: 'Alice Johnson', userEmail: 'alice@example.com', planName: 'Pro Pack', amount: 29.99, date: new Date().toISOString(), status: 'completed' },
    { id: 't2', userName: 'Bob Smith', userEmail: 'bob@example.com', planName: 'Basic Pack', amount: 9.99, date: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
    { id: 't3', userName: 'Charlie Brown', userEmail: 'charlie@example.com', planName: 'Pro Pack', amount: 29.99, date: new Date(Date.now() - 172800000).toISOString(), status: 'pending' },
    { id: 't4', userName: 'David Wilson', userEmail: 'david@example.com', planName: 'Creator Pack', amount: 19.99, date: new Date(Date.now() - 250000000).toISOString(), status: 'completed' },
    { id: 't5', userName: 'Eva Green', userEmail: 'eva@example.com', planName: 'Starter Pack', amount: 4.99, date: new Date(Date.now() - 300000000).toISOString(), status: 'completed' },
];

export const getAllTransactions = (): Transaction[] => {
    return MOCK_TRANSACTIONS;
};

// --- Token Packs ---

export const getTokenPacks = (): TokenPack[] => {
    return [
        {
            id: 'starter',
            name: 'Starter',
            tokens: 100,
            price: '$4.99',
            icon: '🥉',
            borderColor: 'border-gray-600',
            bgColor: 'bg-gray-800',
            textColor: 'text-gray-300'
        },
        {
            id: 'popular',
            name: 'Creator',
            tokens: 500,
            price: '$19.99',
            icon: '🥈',
            borderColor: 'border-indigo-500',
            bgColor: 'bg-gray-800',
            textColor: 'text-indigo-400',
            badge: 'Most Popular'
        },
        {
            id: 'pro',
            name: 'Pro',
            tokens: 1500,
            price: '$49.99',
            icon: '🥇',
            borderColor: 'border-yellow-500',
            bgColor: 'bg-yellow-900/20',
            textColor: 'text-yellow-400'
        }
    ];
};

// --- History (IndexedDB) ---

const DB_NAME = 'ai_persona_db';
const DB_VERSION = 1;
const HISTORY_STORE = 'history_items';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        // Create object store with 'id' as key path
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveHistoryItemToDb = async (item: HistoryItem): Promise<void> => {
  try {
    console.log('saveHistoryItemToDb called with item:', item);
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    store.put(item);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          console.log('History item saved to IndexedDB successfully:', item.id, 'source:', item.source);
          resolve();
        };
        tx.onerror = () => {
          console.error('IndexedDB transaction error:', tx.error);
          reject(tx.error);
        };
    });
  } catch (error) {
    console.error('Failed to save history item to IndexedDB:', error);
    throw error;
  }
};

export const getHistoryFromDb = async (source?: 'gemini' | 'wavespeed'): Promise<HistoryItem[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const store = tx.objectStore(HISTORY_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let items = request.result as HistoryItem[];
        
        // Debug: Log all items and their sources
        console.log(`[getHistoryFromDb] Total items in DB: ${items.length}`);
        items.forEach((item, index) => {
          console.log(`[getHistoryFromDb] Item ${index + 1}: id=${item.id?.substring(0, 20)}..., source=${item.source || 'undefined'}, prompt=${item.prompt?.substring(0, 30)}...`);
        });
        
        // Filter by source if specified
        if (source) {
          const beforeFilter = items.length;
          items = items.filter(item => {
            const itemSource = item.source || 'gemini'; // Default to gemini for backward compatibility
            const matches = itemSource === source;
            if (!matches) {
              console.log(`[getHistoryFromDb] Filtered out item: id=${item.id?.substring(0, 20)}..., has source="${item.source || 'undefined'}", looking for "${source}"`);
            }
            return matches;
          });
          console.log(`[getHistoryFromDb] Filtered ${items.length} items for source: ${source} from ${beforeFilter} total items`);
        } else {
          // If no source specified, return all (for backward compatibility)
          // Items without source are assumed to be Gemini
          items = items.map(item => ({
            ...item,
            source: item.source || 'gemini'
          }));
        }
        
        // Sort by ID descending (assuming ISO timestamp at start of ID)
        items.sort((a, b) => b.id.localeCompare(a.id));
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get history from IndexedDB:', error);
    return [];
  }
};
