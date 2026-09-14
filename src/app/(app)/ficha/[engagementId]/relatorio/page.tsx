import { notFound } from "next/navigation";

import type {
  Company,
  Engagement,
  TechnicalVisit,
  TechnicalVisitPhoto,
} from "@/lib/database.types";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { signPhotoUrls } from "../actions";
import type { PhotoWithUrl } from "../photo-strip";
import { ReportDocument } from "./report-document";

export const metadata = { title: "Relatório" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;
  const { cycles } = await getSessionContext();
  const supabase = await createClient();

  const [{ data: visitRow }, { data: engagementRow }] = await Promise.all([
    supabase.from("technical_visits").select("*").eq("engagement_id", engagementId).maybeSingle(),
    supabase.from("engagements").select("*").eq("id", engagementId).maybeSingle(),
  ]);

  if (!visitRow || !engagementRow) notFound();

  const visit = visitRow as TechnicalVisit;
  const engagement = engagementRow as Engagement;

  const [{ data: companyRow }, { data: photoRows }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", engagement.company_id).maybeSingle(),
    supabase
      .from("technical_visit_photos")
      .select("*")
      .eq("visit_id", visit.id)
      .order("section_id")
      .order("position"),
  ]);

  if (!companyRow) notFound();

  const rows = (photoRows ?? []) as TechnicalVisitPhoto[];
  const urls = await signPhotoUrls(rows.map((photo) => photo.storage_path));
  const photos: PhotoWithUrl[] = rows.map((photo) => ({
    ...photo,
    url: urls[photo.storage_path] ?? null,
  }));

  return (
    <ReportDocument
      visit={visit}
      company={companyRow as Company}
      cycleName={cycles.find((item) => item.id === engagement.cycle_id)?.name ?? null}
      photos={photos}
    />
  );
}
