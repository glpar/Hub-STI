/**
 * Tipos das tabelas do Supabase.
 *
 * Mantido à mão para o projeto não depender da CLI do Supabase. Se um dia
 * quiser gerar automaticamente:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

import type { EnergyMonth } from "@/lib/energy";

export type PillarId = "eficiencia_energetica" | "lean" | "transformacao_digital";

export type EngagementStatus =
  | "prospeccao"
  | "negociacao"
  | "contratada"
  | "execucao"
  | "finalizada"
  | "perdida";

export type UserRole = "admin" | "member";

export type Visibility = "all" | "specific";

export type Pillar = {
  id: string;
  name: string;
  short_name: string;
  sort_order: number;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  pillar_id: string | null;
  phone: string | null;
  created_at: string;
};

export type Cycle = {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
};

export type AnnualGoal = {
  year: number;
  pillar_id: string;
  target_companies: number;
  target_revenue: number;
  updated_at: string;
};

export type CycleGoal = {
  cycle_id: string;
  pillar_id: string;
  target_companies: number;
  target_revenue: number;
  updated_at: string;
};

export type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  sector: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Engagement = {
  id: string;
  company_id: string;
  pillar_id: string;
  cycle_id: string;
  status: EngagementStatus;
  owner_id: string | null;
  sourced_by_id: string | null;
  sourced_pillar_id: string | null;
  value: number;
  contract_date: string | null;
  start_date: string | null;
  end_date: string | null;
  counts_toward_goal: boolean;
  notes: string | null;
  /** Campos específicos do pilar (ver src/lib/pillar-fields.ts). */
  pillar_data: Record<string, string | number | boolean | null>;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string | null;
  company_id: string | null;
  cycle_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type TripParticipant = {
  trip_id: string;
  user_id: string;
};

export type DocumentRow = {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  description: string | null;
  visibility: Visibility;
  cycle_id: string | null;
  company_id: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type TechnicalVisit = {
  id: string;
  engagement_id: string;
  status: "rascunho" | "concluida";
  visit_date: string | null;
  visit_number: string | null;
  consultant_name: string | null;
  /** Ids das seções opcionais ligadas pelo consultor. */
  enabled_sections: string[];
  /** Respostas, uma chave por seção (ver src/lib/visit-form.ts). */
  answers: Record<string, Record<string, unknown>>;
  energy_months: EnergyMonth[];
  has_gd: boolean;
  gd_power_kwp: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TechnicalVisitPhoto = {
  id: string;
  visit_id: string;
  section_id: string;
  storage_path: string;
  caption: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
};

export type DocumentRecipient = {
  document_id: string;
  user_id: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      pillars: Table<Pillar>;
      profiles: Table<Profile>;
      cycles: Table<Cycle>;
      annual_goals: Table<AnnualGoal>;
      cycle_goals: Table<CycleGoal>;
      companies: Table<Company>;
      engagements: Table<Engagement>;
      trips: Table<Trip>;
      trip_participants: Table<TripParticipant>;
      documents: Table<DocumentRow>;
      document_recipients: Table<DocumentRecipient>;
      technical_visits: Table<TechnicalVisit>;
      technical_visit_photos: Table<TechnicalVisitPhoto>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
