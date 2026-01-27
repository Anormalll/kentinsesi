
export type UserRole = 'VATANDAS' | 'BELEDIYE_YETKILISI' | 'INSAAT_YETKILISI';

export type Status = 'Beklemede' | 'İnceleniyor' | 'İşlemde' | 'Çözüldü' | 'Reddedildi';

export type Category = 'Trafik' | 'İnşaat' | 'Belediye Hizmetleri' | 'Diğer';

export interface TimelineEvent {
  id: string;
  status: string;
  note: string;
  timestamp: string;
  isOfficial: boolean;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  category: Category;
  title: string;
  description: string;
  image: string;
  location: string;
  status: Status;
  upvotes: number;
  createdAt: string;
  timeline: TimelineEvent[];
  isMyReport?: boolean; // Mevcut kullanıcının raporu mu?
  plate?: string;
  transportCompany?: string;
  firmName?: string;
  municipality?: string;
  image_url?: string; // Backend bu isimle gönderiyor
}

export type View = 'AKIS' | 'TAKIP' | 'UYARILAR' | 'PROFIL';
