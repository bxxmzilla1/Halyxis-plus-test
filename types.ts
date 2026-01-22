
export interface UploadedImage {
  base64: string;
  mimeType: string;
}

export type AspectRatio = '16:9' | '1:1' | '9:16' | '4:3' | '3:4';

export type EditMode = 'prompt' | 'reference' | 'multi';

export interface HistoryItem {
  id: string;
  imageUrl: string;
  referenceImageUrl?: string;
  prompt: string;
  aspectRatio: AspectRatio;
}

export interface User {
  name: string;
  email: string;
  tokens?: number;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  features: string[];
}

export interface Transaction {
  id: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: string;
  icon: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  badge?: string;
}
