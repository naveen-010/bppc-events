export type Category = 'workshop' | 'competition' | 'talk' | 'cultural' | 'game' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  event_date: string;
  location: string | null;
  is_online: boolean;
  registration_link: string | null;
  registration_deadline: string | null;
  fee: number;
  poster_url: string | null;
  creator_id: string;
  creator_email: string;
  creator_name: string | null;
  creator_phone: string | null;
  created_at: string;
  tags?: string[];
  interested_count?: number;
  registered_count?: number;
  is_interested?: boolean;
  is_registered?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export type FilterState = {
  category: Category | 'all';
  fee: 'all' | 'free' | 'paid';
  search: string;
};
