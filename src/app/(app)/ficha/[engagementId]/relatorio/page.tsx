import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft, Leaf, PencilLine } from "lucide-react";

import {
  ConsumptionChart,
  ConsumptionVsInjectedChart,
  EnergyTable,
} from "@/components/charts/energy-charts";
import type {
  Company,
  Engagement,
  TechnicalVisit,
  TechnicalVisitPhoto,
} from "@/lib/database.types";
import { gdAssessment, longMonthLabel, summarizeEnergy } from "@/lib/energy";
import { formatCurrency, formatDate } from "@/lib/format";
import { REPORT_TEXTS } from "@/lib/report-texts";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { VISIT_SECTIONS, getSection } from "@/lib/visit-form";

import { signPhotoUrls } from "../actions";
import type { PhotoWithUrl } from "../photo-strip";
import { PrintButton } from "./print-button";
import { ReportSection, sectionFilled, type Answers } from "./report-blocks";

export const metadata = { title: "Relatório" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;
  const { cycles } = await getSessionContext();
  const supabase = await createClient();

  const { data: visitRow } = await supabase
    .from("technical_visits")
    .select("*")
    .eq("engagement_id", engagementId)
    .maybeSingle();

  if (!visitRow) notFound();
  const visit = visitRow as TechnicalVisit;

  const { data: engagementRow } = await supabase
    .from("engagements")
    .select("*")
    .eq("id", engagementId)
    .maybeSingle();

  if (!engagementRow) notFound();
  const engagement = engagementRow as Engagement;

  const { data: companyRow } = await supabase
    .from("companies")
    .select("*")
    .eq("id", engagement.company_id)
    .maybeSingle();

  if (!companyRow) notFound();
  const company = companyRow as Company;

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

  const answers = (visit.answers ?? {}) as Answers;
  const months = visit.energy_months ?? [];
  const summary = summarizeEnergy(months);
  const assessment = visit.has_gd ? gdAssessment(summary) : null;
  const cycle = cycles.find((item) => item.id === engagement.cycle_id);

  const text = (sectionId: string, key: string) => {
    const value = answers[sectionId]?.[key];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
  };

  // Só entram no relatório as seções obrigatórias preenchidas e as opcionais ligadas.
  const optionalSections = VISIT_SECTIONS.filter(
    (section) =>
      !section.required &&
      (visit.enabled_sections ?? []).includes(section.id) &&
      (sectionFilled(section, answers) ||
        photos.some((photo) => photo.section_id === section.id)),
  );

  const oportunidades = (answers.s13?.oportunidades as Record<string, string>[] | undefined) ?? [];
  const periodo =
    months.length > 0
      ? `${longMonthLabel(months[0].ref)} a ${longMonthLabel(months[months.length - 1].ref)}`
      : null;

  return (
    <div className="mx-auto max-w-4xl">
      {/* ------------------------------------------------- Barra de ações */}
      <div className="mb-5 flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href={`/ficha/${engagementId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para a ficha
        </Link>
        <div className="ml-auto flex gap-2">
          <Link href={`/ficha/${engagementId}`} className="btn-ghost text-sm">
            <PencilLine className="h-4 w-4" />
            Editar
          </Link>
          <PrintButton />
        </div>
      </div>

      <article className="card space-y-8 p-5 sm:p-8 print:border-0 print:p-0">
        {/* ------------------------------------------------------- Capa */}
        <header className="border-b border-line pb-6">
          <p className="section-title">SENAI — Consultoria de Eficiência Energética</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            Relatório de Eficiência Energética
          </h1>
          <p className="mt-1 text-sm text-muted">Diagnóstico e oportunidades de melhoria</p>

          <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Empresa" value={text("s1", "razao_social") ?? company.name} />
            <Row label="CNPJ" value={text("s1", "cnpj") ?? company.cnpj} />
            <Row
              label="Município/UF"
              value={
                company.city ? `${company.city}${company.state ? ` — ${company.state}` : ""}` : null
              }
            />
            <Row label="Segmento" value={text("s1", "segmento") ?? company.sector} />
            <Row label="Data da visita" value={visit.visit_date ? formatDate(visit.visit_date) : null} />
            <Row label="Consultor" value={visit.consultant_name} />
            <Row label="Ciclo" value={cycle?.name ?? null} />
            <Row label="Nº da visita" value={visit.visit_number} />
          </dl>
        </header>

        {/* ------------------------------------------------ 1. Apresentação */}
        <section className="break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
            1. Apresentação
          </h2>
          <p className="text-sm leading-relaxed">{REPORT_TEXTS.apresentacao}</p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {REPORT_TEXTS.objetivosLista.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm"
              >
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* -------------------------------------------- 2. Resumo executivo */}
        {summary.monthsWithData > 0 ? (
          <section className="break-inside-avoid">
            <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
              2. Resumo executivo
            </h2>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Consumo médio mensal"
                value={`${round(summary.consumoMedio)} kWh`}
                tone="bg-sky-50 dark:bg-sky-950/30"
              />
              <Stat
                label="Custo médio mensal"
                value={formatCurrency(summary.custoMedio)}
                tone="bg-amber-50 dark:bg-amber-950/30"
              />
              <Stat
                label="Custo no período"
                value={formatCurrency(summary.custoTotal)}
                tone="bg-emerald-50 dark:bg-emerald-950/30"
              />
              <Stat
                label={visit.has_gd ? "Energia injetada (média)" : "Consumo no período"}
                value={
                  visit.has_gd
                    ? `${round(summary.injetadaMedia)} kWh`
                    : `${round(summary.consumoTotal)} kWh`
                }
                tone="bg-violet-50 dark:bg-violet-950/30"
              />
            </dl>

            {oportunidades.length > 0 ? (
              <>
                <p className="section-title mt-5">Principais oportunidades</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {oportunidades.slice(0, 6).map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-muted">•</span>
                      <span>
                        {item.oportunidade || item.sistema}
                        {item.prioridade ? (
                          <span className="text-muted"> — prioridade {item.prioridade.toLowerCase()}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ) : null}

        {/* --------------------------------- 3. Objetivo, normas, metodologia */}
        <section className="break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">3. Objetivo</h2>
          <p className="text-sm leading-relaxed">{REPORT_TEXTS.objetivo}</p>
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
            4. Normas aplicáveis
          </h2>
          <ul className="space-y-1 text-sm">
            {REPORT_TEXTS.normas.map((norma) => (
              <li key={norma} className="flex gap-2">
                <span className="text-muted">•</span>
                {norma}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
            5. Justificativa da importância da inspeção das instalações elétricas
          </h2>
          <div className="space-y-3">
            {REPORT_TEXTS.justificativa.map((paragrafo, index) => (
              <p key={index} className="text-sm leading-relaxed">
                {paragrafo}
              </p>
            ))}
          </div>
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
            6. Metodologia aplicada
          </h2>
          <p className="text-sm leading-relaxed">{REPORT_TEXTS.metodologia}</p>
        </section>

        {/* --------------------------------- 7. Caracterização da empresa */}
        {(sectionFilled(getSection("s1")!, answers) ||
          sectionFilled(getSection("s2")!, answers)) && (
          <section className="break-inside-avoid">
            <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
              7. Caracterização da empresa
            </h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Razão social" value={text("s1", "razao_social")} />
              <Row label="Nome fantasia" value={text("s1", "nome_fantasia")} />
              <Row label="Endereço" value={text("s1", "endereco")} />
              <Row label="Responsável" value={text("s1", "responsavel")} />
              <Row label="Telefone" value={text("s1", "telefone")} />
              <Row label="E-mail" value={text("s1", "email")} />
              <Row
                label="Área construída"
                value={text("s2", "area_m2") ? `${text("s2", "area_m2")} m²` : null}
              />
              <Row label="Funcionários" value={text("s2", "funcionarios")} />
              <Row
                label="Horário de funcionamento"
                value={
                  text("s2", "horario_inicio") && text("s2", "horario_fim")
                    ? `${text("s2", "horario_inicio")} às ${text("s2", "horario_fim")}`
                    : null
                }
              />
              <Row label="Dias de funcionamento" value={text("s2", "dias_semana")} />
              <Row label="Distribuidora" value={text("s3", "distribuidora")} />
              <Row label="Nº da UC" value={text("s3", "num_uc")} />
              <Row label="Modalidade tarifária" value={text("s3", "modalidade")} />
              <Row label="Tipo de fornecimento" value={text("s3", "tipo_fornecimento")} />
            </dl>

            {text("s2", "atividades") ? (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted">Principais atividades</p>
                <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">
                  {text("s2", "atividades")}
                </p>
              </div>
            ) : null}
          </section>
        )}

        {/* ------------------------------- 8. Perfil de consumo de energia */}
        <section>
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
            8. Perfil de consumo de energia
          </h2>
          {periodo ? (
            <p className="mb-4 text-xs text-muted">Período de apuração: {periodo}</p>
          ) : null}

          {summary.monthsWithData === 0 ? (
            <p className="text-sm text-muted">Histórico de consumo ainda não preenchido.</p>
          ) : (
            <div className="space-y-6">
              <ConsumptionChart months={months} />

              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Consumo médio mensal" value={`${round(summary.consumoMedio)} kWh`} />
                <Stat label="Custo médio mensal" value={formatCurrency(summary.custoMedio)} />
                <Stat
                  label="Maior consumo"
                  value={summary.maior ? `${round(summary.maior.value)} kWh` : "—"}
                />
                <Stat
                  label="Menor consumo"
                  value={summary.menor ? `${round(summary.menor.value)} kWh` : "—"}
                />
              </dl>

              {visit.has_gd ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold">Geração distribuída</h3>
                  <p className="text-sm leading-relaxed">
                    A unidade consumidora dispõe de sistema de microgeração distribuída
                    {visit.gd_power_kwp
                      ? ` com potência nominal de ${round(visit.gd_power_kwp)} kWp`
                      : ""}
                    . No período analisado foram injetados {round(summary.injetadaTotal)} kWh,
                    frente a um consumo de {round(summary.consumoTotal)} kWh — diferença média de{" "}
                    {round(summary.diferencaMedia)} kWh por mês.
                  </p>

                  <ConsumptionVsInjectedChart months={months} />

                  {assessment ? (
                    <div className="rounded-xl bg-surface-2 px-4 py-3">
                      <p className="text-sm font-semibold">{assessment.titulo}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {assessment.texto}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <EnergyTable months={months} hasGd={visit.has_gd} />

              {text("s4", "observacoes") ? (
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {text("s4", "observacoes")}
                </p>
              ) : null}
            </div>
          )}
        </section>

        {/* ------------------------------------- Seções opcionais ligadas */}
        {optionalSections.map((section, index) => (
          <ReportSection
            key={section.id}
            section={section}
            answers={answers}
            photos={photos.filter((photo) => photo.section_id === section.id)}
            index={9 + index}
          />
        ))}

        {/* ------------------------------------------ Considerações finais */}
        <section className="break-inside-avoid">
          <h2 className="mb-3 border-b border-line pb-1.5 text-base font-bold">
            {9 + optionalSections.length}. Considerações finais
          </h2>
          <p className="text-sm leading-relaxed">
            {text("s16", "observacoes_finais") ?? REPORT_TEXTS.consideracoesFinais}
          </p>

          {text("s16", "achados") ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted">Principais achados</p>
              <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">
                {text("s16", "achados")}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Responsável da empresa</p>
              <p className="mt-6 border-t border-line pt-1">
                {text("s16", "responsavel_empresa") ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Consultor SENAI</p>
              <p className="mt-6 border-t border-line pt-1">
                {text("s16", "consultor_senai") ?? visit.consultant_name ?? ""}
              </p>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{label}:</dt>
      <dd className="min-w-0 font-medium">{value}</dd>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tone ?? "bg-surface-2"}`}>
      <dt className="text-[11px] font-medium leading-tight text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function round(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}
