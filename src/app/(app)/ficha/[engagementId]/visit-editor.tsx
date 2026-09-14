"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileText,
  Loader2,
  Save,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { EDITABLE_REPORT_FIELDS } from "@/lib/report-texts";
import type { Company, Cycle, TechnicalVisit } from "@/lib/database.types";
import { buildTwelveMonths, type EnergyMonth } from "@/lib/energy";
import { VISIT_SECTIONS, sectionsByBlock, type Section } from "@/lib/visit-form";

import { saveVisit } from "./actions";
import { EnergySection } from "./energy-section";
import { FieldInput, type FieldValue } from "./field-input";
import { PhotoStrip, type PhotoWithUrl } from "./photo-strip";

type Answers = Record<string, Record<string, FieldValue>>;

/** Preenche as linhas fixas (ex.: tensão/corrente/potência/FP) na primeira abertura. */
function withSeedRows(answers: Answers): Answers {
  const next: Answers = { ...answers };

  for (const section of VISIT_SECTIONS) {
    for (const group of section.groups) {
      for (const field of group.fields) {
        if (field.kind !== "table" || !field.seedRows) continue;
        const current = next[section.id]?.[field.key];
        if (Array.isArray(current) && current.length > 0) continue;
        next[section.id] = {
          ...next[section.id],
          [field.key]: field.seedRows.map((row) => ({ ...row })),
        };
      }
    }
  }

  return next;
}

function sectionHasContent(section: Section, answers: Answers, months: EnergyMonth[]) {
  if (section.special === "energia") {
    return months.some((month) => month.consumoKwh != null);
  }

  const values = answers[section.id] ?? {};

  return section.groups.some((group) =>
    group.fields.some((field) => {
      const value = values[field.key];
      if (value == null) return false;
      if (typeof value === "string") return value.trim() !== "";
      if (!Array.isArray(value)) return false;

      // Linhas já vêm semeadas (ex.: "Tensão | V"): só conta o que o
      // consultor de fato digitou.
      const seeded = new Set(Object.keys(field.seedRows?.[0] ?? {}));

      return value.some((item) =>
        typeof item === "string"
          ? item.trim() !== ""
          : Object.entries(item).some(
              ([key, cell]) => !seeded.has(key) && String(cell ?? "").trim() !== "",
            ),
      );
    }),
  );
}

export function VisitEditor({
  visit,
  company,
  cycle,
  photos,
  currentUserId,
  defaultConsultant,
}: {
  visit: TechnicalVisit;
  company: Company;
  cycle: Cycle | null;
  photos: PhotoWithUrl[];
  currentUserId: string;
  defaultConsultant: string;
}) {
  const [answers, setAnswers] = useState<Answers>(() =>
    withSeedRows((visit.answers ?? {}) as Answers),
  );
  const [enabled, setEnabled] = useState<string[]>(visit.enabled_sections ?? []);
  const [months, setMonths] = useState<EnergyMonth[]>(() =>
    visit.energy_months?.length ? visit.energy_months : buildTwelveMonths(),
  );
  const [hasGd, setHasGd] = useState(visit.has_gd);
  const [gdPower, setGdPower] = useState(
    visit.gd_power_kwp != null ? String(visit.gd_power_kwp).replace(".", ",") : "",
  );
  const [visitDate, setVisitDate] = useState(visit.visit_date ?? "");
  const [visitNumber, setVisitNumber] = useState(visit.visit_number ?? "");
  const [consultant, setConsultant] = useState(visit.consultant_name ?? defaultConsultant);
  const [done, setDone] = useState(visit.status === "concluida");

  const [open, setOpen] = useState<Record<string, boolean>>({ s1: true });
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Avisa antes de sair com alterações não salvas.
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const blocks = useMemo(() => sectionsByBlock(), []);

  const requiredSections = VISIT_SECTIONS.filter((section) => section.required);
  const requiredDone = requiredSections.filter((section) =>
    sectionHasContent(section, answers, months),
  ).length;

  function touch() {
    setDirty(true);
    setFeedback(null);
  }

  function setAnswer(sectionId: string, key: string, value: FieldValue) {
    touch();
    setAnswers((current) => ({
      ...current,
      [sectionId]: { ...current[sectionId], [key]: value },
    }));
  }

  function toggleSection(sectionId: string, on: boolean) {
    touch();
    setEnabled((current) =>
      on ? [...new Set([...current, sectionId])] : current.filter((id) => id !== sectionId),
    );
    setOpen((current) => ({ ...current, [sectionId]: on }));
  }

  function save() {
    startSave(async () => {
      const result = await saveVisit({
        visitId: visit.id,
        engagementId: visit.engagement_id,
        companyId: company.id,
        visitDate: visitDate || null,
        visitNumber: visitNumber.trim() || null,
        consultantName: consultant.trim() || null,
        enabledSections: enabled,
        answers: answers as Record<string, Record<string, unknown>>,
        energyMonths: months,
        hasGd,
        gdPowerKwp: parseNumber(gdPower),
        status: done ? "concluida" : "rascunho",
      });

      if (result.error) {
        setFeedback(result.error);
        return;
      }
      setDirty(false);
      setFeedback("Ficha salva.");
    });
  }

  return (
    <div className="pb-24">
      {/* ------------------------------------------------------ Cabeçalho */}
      <div className="card mb-5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="section-title">Ficha de visita técnica</p>
            <h1 className="mt-0.5 text-xl font-bold leading-tight">{company.name}</h1>
            <p className="mt-1 text-xs text-muted">
              Eficiência Energética{cycle ? ` · ${cycle.name}` : ""}
            </p>
          </div>

          <Link
            href={`/ficha/${visit.engagement_id}/relatorio`}
            className="btn-ghost shrink-0 text-sm"
          >
            <FileText className="h-4 w-4" />
            Ver relatório
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="visit-date">
              Data da visita
            </label>
            <input
              id="visit-date"
              type="date"
              className="input"
              value={visitDate}
              onChange={(event) => {
                touch();
                setVisitDate(event.target.value);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="visit-number">
              Nº da visita
            </label>
            <input
              id="visit-number"
              className="input"
              value={visitNumber}
              onChange={(event) => {
                touch();
                setVisitNumber(event.target.value);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="consultant">
              Consultor
            </label>
            <input
              id="consultant"
              className="input"
              value={consultant}
              onChange={(event) => {
                touch();
                setConsultant(event.target.value);
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <span
            className={`pill ${
              requiredDone === requiredSections.length
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            }`}
          >
            {requiredDone === requiredSections.length ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <CircleAlert className="h-3 w-3" />
            )}
            {requiredDone}/{requiredSections.length} seções obrigatórias
          </span>
          <span className="text-xs text-muted">
            {enabled.length} seç{enabled.length === 1 ? "ão" : "ões"} opcion
            {enabled.length === 1 ? "al ligada" : "ais ligadas"}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------- Seções */}
      <div className="space-y-6">
        {blocks.map((block) => (
          <section key={block.block}>
            <h2 className="section-title mb-2">{block.block}</h2>

            <div className="space-y-3">
              {block.sections.map((section) => {
                const isOn = section.required || enabled.includes(section.id);
                const isOpen = open[section.id] ?? false;
                const filled = sectionHasContent(section, answers, months);

                return (
                  <article
                    key={section.id}
                    className={`card overflow-hidden transition ${isOn ? "" : "opacity-75"}`}
                  >
                    <header className="flex items-start gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            isOn && setOpen((c) => ({ ...c, [section.id]: !isOpen }))
                          }
                          className="flex w-full items-start gap-2 text-left"
                          aria-expanded={isOpen}
                          disabled={!isOn}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold">
                                {section.number}. {section.title}
                              </span>
                              {section.required ? (
                                <span className="pill bg-primary-soft text-primary">
                                  obrigatória
                                </span>
                              ) : null}
                              {isOn && filled ? (
                                <CheckCircle2
                                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                  aria-label="Seção preenchida"
                                />
                              ) : null}
                            </span>
                            {section.intro ? (
                              <span className="mt-1 block text-xs leading-relaxed text-muted">
                                {section.intro}
                              </span>
                            ) : null}
                          </span>

                          {isOn ? (
                            <ChevronDown
                              className={`mt-0.5 h-5 w-5 shrink-0 text-muted transition ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          ) : null}
                        </button>
                      </div>

                      {!section.required ? (
                        <div className="shrink-0">
                          <Switch
                            checked={isOn}
                            onChange={(on) => toggleSection(section.id, on)}
                            label=""
                            srOnlyLabel={`Usar a seção ${section.number} — ${section.title}`}
                          />
                        </div>
                      ) : null}
                    </header>

                    {isOn && isOpen ? (
                      <div className="space-y-5 border-t border-line p-4">
                        {section.special === "energia" ? (
                          <EnergySection
                            months={months}
                            hasGd={hasGd}
                            gdPowerKwp={gdPower}
                            onMonthsChange={(next) => {
                              touch();
                              setMonths(next);
                            }}
                            onHasGdChange={(next) => {
                              touch();
                              setHasGd(next);
                            }}
                            onGdPowerChange={(next) => {
                              touch();
                              setGdPower(next);
                            }}
                            onSheetHeader={(header) => {
                              setAnswers((current) => ({
                                ...current,
                                s1: {
                                  ...current.s1,
                                  razao_social:
                                    (current.s1?.razao_social as string) || header.razaoSocial || "",
                                },
                                s3: {
                                  ...current.s3,
                                  num_uc:
                                    (current.s3?.num_uc as string) ||
                                    header.unidadeConsumidora ||
                                    "",
                                  modalidade:
                                    (current.s3?.modalidade as string) || header.modalidade || "",
                                },
                              }));
                            }}
                          />
                        ) : section.special === "fotos" ? (
                          <PhotoRegister photos={photos} />
                        ) : (
                          section.groups.map((group, index) => (
                            <div key={group.title ?? index}>
                              {group.title ? (
                                <p className="section-title mb-2">{group.title}</p>
                              ) : null}
                              <div className="grid gap-4 sm:grid-cols-2">
                                {group.fields.map((field) => (
                                  <div
                                    key={field.key}
                                    className={field.wide ? "sm:col-span-2" : undefined}
                                  >
                                    <FieldInput
                                      field={field}
                                      value={answers[section.id]?.[field.key]}
                                      onChange={(value) =>
                                        setAnswer(section.id, field.key, value)
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}

                        <PhotoStrip
                          visitId={visit.id}
                          engagementId={visit.engagement_id}
                          sectionId={section.id}
                          photos={photos.filter((photo) => photo.section_id === section.id)}
                          currentUserId={currentUserId}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* --------------------------------------------- Textos do relatório */}
      <section className="mt-6">
        <h2 className="section-title mb-2">Textos do relatório</h2>

        <article className="card overflow-hidden">
          <header className="p-4">
            <button
              type="button"
              onClick={() => setOpen((c) => ({ ...c, textos: !(open.textos ?? false) }))}
              className="flex w-full items-start gap-2 text-left"
              aria-expanded={open.textos ?? false}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Apresentação, objetivo e conclusão</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  O relatório já vem com a redação padrão da equipe. Edite aqui só se quiser um
                  texto diferente para esta empresa — deixando em branco, entra o padrão.
                </span>
              </span>
              <ChevronDown
                className={`mt-0.5 h-5 w-5 shrink-0 text-muted transition ${
                  open.textos ? "rotate-180" : ""
                }`}
              />
            </button>
          </header>

          {open.textos ? (
            <div className="space-y-4 border-t border-line p-4">
              {EDITABLE_REPORT_FIELDS.map((field) => {
                const value = (answers.relatorio?.[field.key] as string) ?? "";
                return (
                  <div key={field.key}>
                    <label className="label" htmlFor={`relatorio-${field.key}`}>
                      {field.label}
                    </label>
                    <textarea
                      id={`relatorio-${field.key}`}
                      rows={field.rows}
                      className="input"
                      placeholder={field.default}
                      value={value}
                      onChange={(event) =>
                        setAnswer("relatorio", field.key, event.target.value)
                      }
                    />
                    {value.trim() === "" ? (
                      <p className="mt-1 text-xs text-muted">Usando o texto padrão.</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </article>
      </section>

      {/* --------------------------------------------------- Barra de salvar */}
      <div className="safe-bottom fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:pl-64">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={done}
              onChange={(event) => {
                touch();
                setDone(event.target.checked);
              }}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Marcar como concluída
          </label>

          <span className="ml-auto truncate text-xs text-muted">
            {feedback ?? (dirty ? "Alterações não salvas" : "Tudo salvo")}
          </span>

          <button type="button" onClick={save} disabled={saving} className="btn-primary shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoRegister({ photos }: { photos: PhotoWithUrl[] }) {
  if (photos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
        Nenhuma foto anexada ainda. Use o botão “Anexar foto” dentro de cada seção.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-line text-sm">
      {photos.map((photo, index) => (
        <li key={photo.id} className="flex items-start gap-3 py-2.5">
          <span className="w-6 shrink-0 font-bold tabular-nums text-muted">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block">{photo.caption || "Sem legenda"}</span>
            <span className="block text-xs text-muted">Seção {photo.section_id.replace("s", "")}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}
