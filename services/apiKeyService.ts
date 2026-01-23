
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const STORAGE_KEY = 'halyxis_api_key';
const WAVESPEED_STORAGE_KEY = 'halyxis_wavespeed_api_key';

export const isAIStudioEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !!window.aistudio;
};

// Gemini API Key functions
export const storeApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

export const getStoredApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY);
  }
  return null;
};

export const getEffectiveApiKey = (): string | undefined => {
  // Only use manually entered key (stored in localStorage)
  // Environment variables are NOT exposed to client for security
  return getStoredApiKey() || undefined;
};

// WaveSpeed API Key functions
export const storeWaveSpeedApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    if (key) {
      localStorage.setItem(WAVESPEED_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(WAVESPEED_STORAGE_KEY);
    }
  }
};

export const getStoredWaveSpeedApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(WAVESPEED_STORAGE_KEY);
  }
  return null;
};

export const getWaveSpeedApiKey = (): string | undefined => {
  // Only use manually entered key (stored in localStorage)
  // Environment variables are NOT exposed to client for security
  return getStoredWaveSpeedApiKey() || undefined;
};

// Store WaveSpeed prediction IDs for fetching later (since list endpoint doesn't exist)
const WAVESPEED_PREDICTION_IDS_KEY = 'wavespeed_prediction_ids';

export const storeWaveSpeedPredictionId = (predictionId: string): void => {
  try {
    const existingIds = getStoredWaveSpeedPredictionIds();
    if (!existingIds.includes(predictionId)) {
      existingIds.push(predictionId);
      localStorage.setItem(WAVESPEED_PREDICTION_IDS_KEY, JSON.stringify(existingIds));
    }
  } catch (error) {
    console.error('Failed to store prediction ID:', error);
  }
};

export const getStoredWaveSpeedPredictionIds = (): string[] => {
  try {
    const stored = localStorage.getItem(WAVESPEED_PREDICTION_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get stored prediction IDs:', error);
    return [];
  }
};

export const hasValidApiKey = async (): Promise<boolean> => {
  // Always return true to avoid blocking the UI.
  // The generation service will handle missing keys with specific error messages.
  return true;
};

export const requestApiKeySelection = async (): Promise<void> => {
  if (isAIStudioEnvironment()) {
    await window.aistudio!.openSelectKey();
  } else {
    console.warn('API Key selection is not available in standalone mode. Please set API_KEY in your environment variables.');
  }
};
