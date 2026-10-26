export type LeadStatus = 'Novo' | 'Aguardando Pagamento' | 'Revisando (IA)' | 'Entregue';

export const LEAD_STATUS_VALUES: readonly LeadStatus[] = [
  'Novo',
  'Aguardando Pagamento',
  'Revisando (IA)',
  'Entregue',
] as const;

export interface Lead {
  id: string;
  name: string;
  link: string; // LinkedIn profile or CV link (Drive, PDF, GitHub)
  areaRole: string; // Target domain and desired role
  status: LeadStatus;
  createdAt: string; // ISO-8601 string, e.g. "2026-10-26T13:30:00.000Z"
  updatedAt?: string;
  phone?: string;
  notes?: string;
}

export type CreateLeadDTO = Omit<Lead, 'id' | 'createdAt' | 'status' | 'updatedAt'>;

export interface LeadFilters {
  searchQuery?: string;
  status?: LeadStatus | 'Todos';
  sortBy?: 'createdAt_desc' | 'createdAt_asc' | 'name_asc';
}

export interface AdminStats {
  total: number;
  novos: number;
  aguardandoPagamento: number;
  revisandoIA: number;
  entregues: number;
}
