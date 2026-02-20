export interface Deal {
  id: number;
  title: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  storeName: string;
  link: string;
  category: string;
  temperature: number;
  createdAt: string;
  couponCode?: string;
  isHot?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reportStatus?: 'pending_review' | null;
  user_id?: string;
  userEmail?: string; // Novo campo para exibir no admin
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  is_banned: boolean;
}

export enum SortOption {
  NEWEST = 'newest',
  HOTTEST = 'hottest',
}

export const DEAL_CATEGORIES = [
  'Eletrônicos',
  'Informática',
  'Smartphones',
  'Moda',
  'Casa e Jardim',
  'Games',
  'Mercado',
  'Livros',
  'Ferramentas',
  'Beleza',
  'Esporte',
  'Outros'
];