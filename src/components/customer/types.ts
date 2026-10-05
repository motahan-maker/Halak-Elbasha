export interface HomeOffer {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
}

export interface HomeBarber {
  id: string;
  name: string;
  specialization: string | null;
  is_active: boolean;
  avg: number;
  cnt: number;
}

export interface HomeSettings {
  shop_name: string;
}
