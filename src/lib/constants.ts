import type { EngagementStatus } from "@/lib/database.types";

/** Colunas do quadro Kanban, na ordem em que aparecem. */
export const STATUS_ORDER: EngagementStatus[] = [
  "prospeccao",
  "negociacao",
  "contratada",
  "execucao",
  "finalizada",
  "perdida",
];

type StatusMeta = {
  label: string;
  shortLabel: string;
  description: string;
  /** Classe de cor do "pill" de status. */
  tone: string;
  /** Cor da barrinha no topo da coluna do Kanban. */
  bar: string;
};

export const STATUS_META: Record<EngagementStatus, StatusMeta> = {
  prospeccao: {
    label: "Em prospecção",
    shortLabel: "Prospecção",
    description: "Empresa está sendo consultada / abordada",
    tone: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    bar: "bg-slate-400",
  },
  negociacao: {
    label: "Em negociação",
    shortLabel: "Negociação",
    description: "Proposta enviada, negociando valores e escopo",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    bar: "bg-amber-400",
  },
  contratada: {
    label: "Contratada",
    shortLabel: "Contratada",
    description: "Contrato assinado — já conta para a meta",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    bar: "bg-sky-500",
  },
  execucao: {
    label: "Em execução",
    shortLabel: "Execução",
    description: "Consultoria em andamento — conta para a meta",
    tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    bar: "bg-indigo-500",
  },
  finalizada: {
    label: "Finalizada",
    shortLabel: "Finalizada",
    description: "Trabalho concluído — conta para a meta",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    bar: "bg-emerald-500",
  },
  perdida: {
    label: "Não fechou",
    shortLabel: "Não fechou",
    description: "Não avançou — não conta para a meta",
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
    bar: "bg-rose-400",
  },
};

/**
 * Status que valem como "empresa fechada" para a meta.
 * É esta lista que define o numerador do contador X/Y.
 */
export const CLOSED_STATUSES: EngagementStatus[] = ["contratada", "execucao", "finalizada"];

/** Status que ainda estão em aberto (potencial para fechar a meta). */
export const PIPELINE_STATUSES: EngagementStatus[] = ["prospeccao", "negociacao"];

export function isClosed(status: EngagementStatus) {
  return CLOSED_STATUSES.includes(status);
}

export function isPipeline(status: EngagementStatus) {
  return PIPELINE_STATUSES.includes(status);
}

type PillarTheme = {
  /** cor sólida (barras, pontos) */
  solid: string;
  /** fundo suave + texto (etiquetas) */
  soft: string;
  /** borda de destaque */
  ring: string;
  /** texto colorido */
  text: string;
};

const DEFAULT_THEME: PillarTheme = {
  solid: "bg-slate-500",
  soft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  ring: "ring-slate-300 dark:ring-slate-700",
  text: "text-slate-600 dark:text-slate-300",
};

export const PILLAR_THEME: Record<string, PillarTheme> = {
  eficiencia_energetica: {
    solid: "bg-amber-500",
    soft: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    ring: "ring-amber-300 dark:ring-amber-700",
    text: "text-amber-700 dark:text-amber-300",
  },
  lean: {
    solid: "bg-emerald-500",
    soft: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    ring: "ring-emerald-300 dark:ring-emerald-700",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  transformacao_digital: {
    solid: "bg-violet-500",
    soft: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
    ring: "ring-violet-300 dark:ring-violet-700",
    text: "text-violet-700 dark:text-violet-300",
  },
};

export function pillarTheme(pillarId: string | null | undefined): PillarTheme {
  if (!pillarId) return DEFAULT_THEME;
  return PILLAR_THEME[pillarId] ?? DEFAULT_THEME;
}

export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

/**
 * Lista dos pilares usada em telas públicas (cadastro), onde ainda não há
 * sessão para ler a tabela `pillars`. O banco continua sendo a fonte oficial.
 */
export const PILLAR_FALLBACK = [
  { id: "eficiencia_energetica", name: "Eficiência Energética", short_name: "Eficiência Energética", sort_order: 1 },
  { id: "lean", name: "Lean", short_name: "Lean", sort_order: 2 },
  { id: "transformacao_digital", name: "Transformação Digital", short_name: "Transf. Digital", sort_order: 3 },
];
