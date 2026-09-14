import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import type {
  Company,
  Cycle,
  Engagement,
  TechnicalVisit,
  TechnicalVisitPhoto,
} from "@/lib/database.types";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { signPhotoUrls } from "./actions";
import { VisitEditor } from "./visit-editor";
import type { PhotoWithUrl } from "./photo-strip";

export const metadata = { title: "Ficha de visita técnica" };

/** A ficha existe só para atendimentos de Eficiência Energética. */
export const PILLAR_WITH_VISIT = "eficiencia_energetica";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;
  const { profile, cycles } = await getSessionContext();
  const supabase = await createClient();

  const { data: engagement } = await supabase
    .from("engagements")
    .select("*")
    .eq("id", engagementId)
    .maybeSingle();

  if (!engagement) notFound();

  const typed = engagement as Engagement;

  if (typed.pillar_id !== PILLAR_WITH_VISIT) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="font-semibold">Ficha disponível só para Eficiência Energética</p>
        <p className="mt-1 text-sm text-muted">
          Este atendimento é de outra área e não usa a ficha de visita técnica.
        </p>
        <Link href={`/empresas/${typed.company_id}`} className="btn-ghost mt-4">
          Voltar para a empresa
        </Link>
      </div>
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", typed.company_id)
    .maybeSingle();

  if (!company) notFound();

  // Cria a ficha na primeira abertura.
  let { data: visit } = await supabase
    .from("technical_visits")
    .select("*")
    .eq("engagement_id", engagementId)
    .maybeSingle();

  if (!visit) {
    const { data: created, error } = await supabase
      .from("technical_visits")
      .insert({ engagement_id: engagementId, created_by: profile.id })
      .select("*")
      .single();

    // Se duas abas criarem ao mesmo tempo, relê a que venceu.
    if (error) {
      const { data: existing } = await supabase
        .from("technical_visits")
        .select("*")
        .eq("engagement_id", engagementId)
        .maybeSingle();
      visit = existing;
    } else {
      visit = created;
    }
  }

  if (!visit) notFound();

  const { data: photoRows } = await supabase
    .from("technical_visit_photos")
    .select("*")
    .eq("visit_id", visit.id)
    .order("section_id")
    .order("position");

  const rows = (photoRows ?? []) as TechnicalVisitPhoto[];
  const urls = await signPhotoUrls(rows.map((photo) => photo.storage_path));
  const photos: PhotoWithUrl[] = rows.map((photo) => ({
    ...photo,
    url: urls[photo.storage_path] ?? null,
  }));

  const cycle = (cycles.find((item) => item.id === typed.cycle_id) ?? null) as Cycle | null;

  return (
    <>
      <Link
        href={`/empresas/${typed.company_id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-fg"
      >
        <ChevronLeft className="h-4 w-4" />
        {(company as Company).name}
      </Link>

      <VisitEditor
        visit={visit as TechnicalVisit}
        company={company as Company}
        cycle={cycle}
        photos={photos}
        currentUserId={profile.id}
        defaultConsultant={profile.full_name}
      />
    </>
  );
}
