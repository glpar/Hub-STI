import { isClosed, isPipeline } from "@/lib/constants";
import type { Engagement, Pillar } from "@/lib/database.types";

export type PillarProgress = {
  pillar: Pillar;
  /** Contratadas + em execução + finalizadas = o que realmente conta na meta. */
  closed: number;
  /** Em prospecção + em negociação = ainda pode virar meta. */
  pipeline: number;
  lost: number;
  target: number;
  /** Quantas ainda faltam para bater a meta (nunca negativo). */
  remaining: number;
  percent: number;
  revenue: number;
  targetRevenue: number;
  /** Fechadas que vieram por indicação de outro pilar (ex.: o Lean levou EE). */
  broughtByOtherPillar: number;
};

type GoalLike = { pillar_id: string; target_companies: number; target_revenue: number };

export function buildPillarProgress(
  pillars: Pillar[],
  engagements: Engagement[],
  goals: GoalLike[],
): PillarProgress[] {
  return pillars.map((pillar) => {
    const goal = goals.find((g) => g.pillar_id === pillar.id);
    const target = goal?.target_companies ?? 0;
    const targetRevenue = Number(goal?.target_revenue ?? 0);

    const ofPillar = engagements.filter(
      (e) => e.pillar_id === pillar.id && e.counts_toward_goal,
    );
    const closedList = ofPillar.filter((e) => isClosed(e.status));

    const closed = closedList.length;
    const pipeline = ofPillar.filter((e) => isPipeline(e.status)).length;
    const lost = ofPillar.filter((e) => e.status === "perdida").length;
    const revenue = closedList.reduce((sum, e) => sum + Number(e.value ?? 0), 0);

    return {
      pillar,
      closed,
      pipeline,
      lost,
      target,
      remaining: Math.max(target - closed, 0),
      percent: target > 0 ? Math.min(Math.round((closed / target) * 100), 999) : 0,
      revenue,
      targetRevenue,
      broughtByOtherPillar: closedList.filter(
        (e) => e.sourced_pillar_id && e.sourced_pillar_id !== pillar.id,
      ).length,
    };
  });
}

export type Totals = {
  /** Total de registros fechados somando todos os pilares. */
  closed: number;
  pipeline: number;
  target: number;
  remaining: number;
  percent: number;
  revenue: number;
  targetRevenue: number;
  /**
   * Empresas distintas envolvidas. Diferente de `closed`: a mesma empresa pode
   * ter Eficiência Energética e Lean no mesmo ciclo — são 2 contratos, 1 empresa.
   */
  uniqueCompanies: number;
  uniqueCompaniesClosed: number;
};

export function buildTotals(progress: PillarProgress[], engagements: Engagement[]): Totals {
  const closed = progress.reduce((sum, p) => sum + p.closed, 0);
  const target = progress.reduce((sum, p) => sum + p.target, 0);
  const revenue = progress.reduce((sum, p) => sum + p.revenue, 0);

  return {
    closed,
    pipeline: progress.reduce((sum, p) => sum + p.pipeline, 0),
    target,
    remaining: Math.max(target - closed, 0),
    percent: target > 0 ? Math.min(Math.round((closed / target) * 100), 999) : 0,
    revenue,
    targetRevenue: progress.reduce((sum, p) => sum + p.targetRevenue, 0),
    uniqueCompanies: new Set(engagements.map((e) => e.company_id)).size,
    uniqueCompaniesClosed: new Set(
      engagements.filter((e) => isClosedCounting(e)).map((e) => e.company_id),
    ).size,
  };
}

function isClosedCounting(engagement: Engagement) {
  return engagement.counts_toward_goal && isClosed(engagement.status);
}
