export interface SessionPack {
  id: string;
  sessions: number;
  price: number;
  originalPrice?: number;
  sessionPrice: number;
  description: string;
  badge?: string;
  saving?: number;
  isPopular?: boolean;
}

export interface Booking {
  id: string;
  userId?: string;
  packageName: string;
  sessions: number;
  price: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  selectedDate: string;
  selectedTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingType: 'solo';
  friendName?: string;
  createdAt: any;
  updatedAt?: any;
}

export const SOLO_PACKS: SessionPack[] = [
  {
    id: 'solo-8',
    sessions: 8,
    price: 7992,
    sessionPrice: 999,
    description: 'Two months to deepen your practice and feel real change.',
  },
  {
    id: 'solo-12',
    sessions: 12,
    price: 11388,
    originalPrice: 11988,
    sessionPrice: 949,
    saving: 600,
    badge: '5% OFF - BEST VALUE',
    isPopular: true,
    description: 'Our most popular pack — deep progress with meaningful savings.',
  },
  {
    id: 'solo-16',
    sessions: 16,
    price: 15984,
    sessionPrice: 999,
    description: 'Four months of sustained practice for lasting transformation.',
  },
  {
    id: 'solo-20',
    sessions: 20,
    price: 17982,
    originalPrice: 19980,
    sessionPrice: 899,
    saving: 1998,
    badge: '10% OFF - MAX DISCOUNT',
    description: 'The ultimate commitment — maximum growth, maximum savings.',
  },
];

export const TIME_SLOTS = [
  '06:30 AM',
  '08:00 AM',
  '09:30 AM',
  '11:00 AM',
  '04:30 PM',
  '06:00 PM',
  '07:30 PM',
];

export interface InstructorProfile {
  name: string;
  role: string;
  photoUrl: string;
  bio1: string;
  bio2: string;
  bio3: string;
  usePhotoUrlAsDefault: boolean;
}

