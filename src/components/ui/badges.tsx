import { STATUS_META, pillarTheme } from "@/lib/constants";
import type { EngagementStatus, Pillar } from "@/lib/database.types";

export function StatusPill({ status }: { status: EngagementStatus }) {
  const meta = STATUS_META[status];
  return <span className={`pill ${meta.tone}`}>{meta.shortLabel}</span>;
}

export function PillarBadge({
  pillar,
  short = false,
}: {
  pillar: Pick<Pillar, "id" | "name" | "short_name"> | undefined;
  short?: boolean;
}) {
  if (!pillar) return null;
  const theme = pillarTheme(pillar.id);
  return <span className={`pill ${theme.soft}`}>{short ? pillar.short_name : pillar.name}</span>;
}

export function PillarDot({ pillarId }: { pillarId: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${pillarTheme(pillarId).solid}`} />;
}
