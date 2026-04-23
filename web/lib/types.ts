export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inRouteOrders: number;
  deliveredToday: number;
  revenueTodayCents: number;
}

export interface Order {
  id: number;
  reseller_id: number;
  phone: string;
  product_code: string | null;
  produto: string | null;
  endereco: string | null;
  area_name: string | null;
  area_fee_cents: number;
  pagamento: string | null;
  subtotal_cents: number;
  total_cents: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  reseller_name?: string;
}

export interface Product {
  id: number;
  reseller_id: number;
  code: string;
  name: string;
  description: string;
  aliases: string[];
  price_cents: number;
  stock_units: number;
  active: boolean;
  featured: boolean;
}

export interface Area {
  id: number;
  reseller_id: number;
  neighborhood: string;
  fee_cents: number;
  eta_minutes: number;
  active: boolean;
}

export interface Reseller {
  id: number;
  name: string;
  slug: string;
  whatsapp_phone: string;
  active: boolean;
}

export interface UserSummary {
  id: number;
  resellerId: number | null;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface AuthUser {
  userId: number;
  resellerId: number | null;
  role: string;
  email: string;
  name: string;
  exp: number;
}
