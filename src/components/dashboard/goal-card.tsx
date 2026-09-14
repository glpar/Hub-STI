import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { pillarTheme } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { PillarProgress } from "@/lib/stats";

export function GoalCard({ progress, href }: { progress: PillarProgress; href?: string }) {
  const theme = pillarTheme(progress.pillar.id);
  const reached = progress.target > 0 && progress.remaining === 0;

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.solid}`} />
          <h3 className="text-sm font-semibold leading-tight">{progress.pillar.name}</h3>
        </div>
        {href ? <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" /> : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold leading-none tabular-nums">
          {progress.closed}
          <span className="text-xl font-semibold text-muted">/{progress.target || "—"}</span>
        </p>
        {progress.target > 0 ? (
          <p
            className={`text-sm font-semibold ${reached ? "text-emerald-600 dark:text-emerald-400" : theme.text}`}
          >
            {reached ? "meta batida 🎉" : `faltam ${progress.remaining}`}
          </p>
        ) : (
          <p className="text-xs text-muted">sem meta definida</p>
        )}
      </div>

      <div className="mt-3">
        <Progress value={progress.closed} max={progress.target} barClassName={theme.solid} />
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <div className="flex gap-1">
          <dt>Em aberto:</dt>
          <dd className="font-semibold text-fg">{progress.pipeline}</dd>
        </div>
        {progress.revenue > 0 ? (
          <div className="flex gap-1">
            <dt>Fechado:</dt>
            <dd className="font-semibold text-fg">{formatCurrency(progress.revenue)}</dd>
          </div>
        ) : null}
        {progress.broughtByOtherPillar > 0 ? (
          <div className="flex gap-1">
            <dt>Vieram de outra área:</dt>
            <dd className="font-semibold text-fg">{progress.broughtByOtherPillar}</dd>
          </div>
        ) : null}
      </dl>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card p-4 transition hover:border-line-strong">
        {content}
      </Link>
    );
  }

  return <div className="card p-4">{content}</div>;
}

export function GoalRow({ progress }: { progress: PillarProgress }) {
  const theme = pillarTheme(progress.pillar.id);

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${theme.solid}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{progress.pillar.short_name}</p>
          <p className="shrink-0 text-sm font-bold tabular-nums">
            {progress.closed}
            <span className="font-semibold text-muted">/{progress.target || "—"}</span>
          </p>
        </div>
        <div className="mt-1.5">
          <Progress value={progress.closed} max={progress.target} barClassName={theme.solid} />
        </div>
      </div>
    </div>
  );
}
