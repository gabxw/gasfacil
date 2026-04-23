export type UserRole = "owner" | "manager" | "operator";

export type OrderStatus =
  | "novo"
  | "confirmado"
  | "preparando"
  | "em_rota"
  | "entregue"
  | "cancelado";

export interface Reseller {
  id: number;
  name: string;
  slug: string;
  whatsapp_phone: string;
  active: boolean;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryArea {
  id: number;
  reseller_id: number;
  neighborhood: string;
  fee_cents: number;
  eta_minutes: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  phone: string;
  reseller_id: number;
  state: string;
  data: Record<string, unknown>;
  updated_at?: Date;
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
  status: OrderStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  reseller_name?: string;
}

export interface OrderEvent {
  id: number;
  order_id: number;
  status: string;
  note: string | null;
  actor_type: string;
  actor_name: string | null;
  created_at: Date;
}

export interface AdminUser {
  id: number;
  reseller_id: number | null;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  active: boolean;
  created_at: Date;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  inRouteOrders: number;
  deliveredToday: number;
  revenueTodayCents: number;
}

export interface AuthTokenPayload {
  userId: number;
  resellerId: number | null;
  role: UserRole;
  email: string;
  name: string;
  exp: number;
}
