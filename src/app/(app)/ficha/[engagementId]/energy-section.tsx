"use client";

import { useRef, useState, useTransition } from "react";

import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RotateCcw } from "lucide-react";

import {
  ConsumptionChart,
  ConsumptionVsInjectedChart,
  EnergyTable,
} from "@/components/charts/energy-charts";
import { Switch } from "@/components/ui/switch";
import {
  buildTwelveMonths,
  gdAssessment,
  monthCost,
  shortMonthLabel,
  summarizeEnergy,
  type EnergyMonth,
} from "@/lib/energy";
import { formatCurrency } from "@/lib/format";

import { importFatura } from "./actions";

type Props = {
  months: EnergyMonth[];
  hasGd: boolean;
  gdPowerKwp: string;
  onMonthsChange: (months: EnergyMonth[]) => void;
  onHasGdChange: (hasGd: boolean) => void;
  onGdPowerChange: (value: string) => void;
  /** Preenche razão social / UC / modalidade vindos da planilha. */
  onSheetHeader: (header: {
    razaoSocial: string | null;
    unidadeConsumidora: string | null;
    modalidade: string | null;
  }) => void;
};

const NUMERIC_FIELDS: { key: keyof EnergyMonth; label: string; gdOnly?: boolean }[] = [
  { key: "consumoKwh", label: "Consumo (kWh)" },
  { key: "precoUnit", label: "Tarifa (R$/kWh)" },
  { key: "injetadaKwh", label: "Injetada (kWh)", gdOnly: true },
  { key: "precoInjetada", label: "Tarifa injeção", gdOnly: true },
];

export function EnergySection({
  months,
  hasGd,
  gdPowerKwp,
  onMonthsChange,
  onHasGdChange,
  onGdPowerChange,
  onSheetHeader,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, startImport] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "erro"; text: string } | null>(null);
  const [lastMonth, setLastMonth] = useState(months[months.length - 1]?.ref ?? "");

  const summary = summarizeEnergy(months);
  const assessment = hasGd ? gdAssessment(summary) : null;

  function handleImport(file: File) {
    const formData = new FormData();
    formData.set("planilha", file);

    startImport(async () => {
      const result = await importFatura(formData);
      if (result.error || !result.data) {
        setFeedback({ kind: "erro", text: result.error ?? "Não consegui ler a planilha." });
        return;
      }

      const data = result.data;
      onMonthsChange(data.months);
      if (data.hasGd) onHasGdChange(true);
      onSheetHeader({
        razaoSocial: data.razaoSocial,
        unidadeConsumidora: data.unidadeConsumidora,
        modalidade: data.modalidade,
      });
      setLastMonth(data.months[data.months.length - 1]?.ref ?? "");

      setFeedback({
        kind: "ok",
        text:
          `${data.months.length} ${data.months.length === 1 ? "mês importado" : "meses importados"}` +
          (data.hasGd ? " · geração distribuída detectada" : "") +
          (data.warnings.length > 0 ? ` · ${data.warnings.join(" ")}` : ""),
      });
    });
  }

  function setValue(index: number, key: keyof EnergyMonth, raw: string) {
    const parsed = raw.trim() === "" ? null : Number(raw.replace(/\./g, "").replace(",", "."));
    onMonthsChange(
      months.map((month, i) =>
        i === index
          ? { ...month, [key]: parsed != null && Number.isFinite(parsed) ? parsed : null }
          : month,
      ),
    );
  }

  function resetPeriod() {
    onMonthsChange(buildTwelveMonths(lastMonth || undefined));
    setFeedback(null);
  }

  return (
    <div className="space-y-5">
      {/* ----------------------------------------------- Importar planilha */}
      <div className="rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Importar planilha de fatura</p>
            <p className="mt-0.5 text-xs text-muted">
              Aceita a planilha padrão de fatura (aba “1. BASE”). Preenche os 12 meses, identifica
              se há geração distribuída e já monta os gráficos.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleImport(file);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                {importing ? "Lendo…" : "Escolher planilha"}
              </button>
            </div>

            {feedback ? (
              <p
                className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                  feedback.kind === "ok"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {feedback.kind === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                {feedback.text}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ Chave da GD */}
      <div className="rounded-xl border border-line p-4">
        <Switch
          checked={hasGd}
          onChange={onHasGdChange}
          label="Existe GD na unidade?"
          description="Geração distribuída (usina fotovoltaica). Ligando, entram os campos de energia injetada e o gráfico comparativo no relatório."
        />

        {hasGd ? (
          <div className="mt-4 max-w-xs">
            <label className="label" htmlFor="gd-power">
              Potência instalada <span className="text-muted">(kWp)</span>
            </label>
            <input
              id="gd-power"
              className="input"
              inputMode="decimal"
              placeholder="Ex.: 16"
              value={gdPowerKwp}
              onChange={(event) => onGdPowerChange(event.target.value)}
            />
          </div>
        ) : null}
      </div>

      {/* --------------------------------------------------- Meses a meses */}
      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <p className="section-title">Histórico mês a mês</p>
          <div className="flex items-end gap-2">
            <div>
              <label className="label" htmlFor="ultimo-mes">
                Último mês
              </label>
              <input
                id="ultimo-mes"
                type="month"
                className="input py-2 text-sm"
                value={lastMonth}
                onChange={(event) => setLastMonth(event.target.value)}
              />
            </div>
            <button type="button" onClick={resetPeriod} className="btn-ghost px-3 py-2 text-xs">
              <RotateCcw className="h-4 w-4" />
              Refazer 12 meses
            </button>
          </div>
        </div>

        <ul className="space-y-2">
          {months.map((month, index) => {
            const cost = monthCost(month);
            return (
              <li
                key={month.ref}
                className="rounded-xl border border-line bg-surface-2 p-3 sm:bg-transparent sm:p-2"
              >
                <div className="grid items-end gap-2 sm:grid-cols-[88px_repeat(4,1fr)_110px]">
                  <span className="text-sm font-semibold">{shortMonthLabel(month.ref)}</span>

                  {NUMERIC_FIELDS.filter((field) => !field.gdOnly || hasGd).map((field) => (
                    <div key={field.key}>
                      <span className="mb-1 block text-[11px] font-medium text-muted">
                        {field.label}
                      </span>
                      <input
                        className="input px-2 py-2 text-sm"
                        inputMode="decimal"
                        aria-label={`${field.label} em ${shortMonthLabel(month.ref)}`}
                        value={
                          month[field.key] != null
                            ? String(month[field.key]).replace(".", ",")
                            : ""
                        }
                        onChange={(event) => setValue(index, field.key, event.target.value)}
                      />
                    </div>
                  ))}

                  <div className="text-right">
                    <span className="mb-1 block text-[11px] font-medium text-muted">Valor</span>
                    <span className="block py-2 text-sm font-semibold tabular-nums">
                      {cost != null ? formatCurrency(cost) : "—"}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* --------------------------------------------------------- Resumo */}
      {summary.monthsWithData > 0 ? (
        <>
          <div>
            <p className="section-title mb-2">Indicadores do período</p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Consumo médio mensal" value={`${round(summary.consumoMedio)} kWh`} />
              <Stat label="Custo médio mensal" value={formatCurrency(summary.custoMedio)} />
              <Stat
                label="Maior consumo"
                value={
                  summary.maior
                    ? `${round(summary.maior.value)} kWh · ${shortMonthLabel(summary.maior.ref)}`
                    : "—"
                }
              />
              <Stat
                label="Menor consumo"
                value={
                  summary.menor
                    ? `${round(summary.menor.value)} kWh · ${shortMonthLabel(summary.menor.ref)}`
                    : "—"
                }
              />
              <Stat label="Custo total" value={formatCurrency(summary.custoTotal)} />
              <Stat
                label="Tarifa média"
                value={`R$ ${summary.tarifaMedia.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 5 })}`}
              />
              {hasGd ? (
                <>
                  <Stat label="Injetada (média)" value={`${round(summary.injetadaMedia)} kWh`} />
                  <Stat label="Saldo do período" value={`${round(summary.saldoKwh)} kWh`} />
                </>
              ) : null}
            </dl>
          </div>

          <div className="space-y-5 rounded-xl border border-line p-4">
            <p className="section-title">Prévia dos gráficos do relatório</p>
            <ConsumptionChart months={months} />
            {hasGd ? <ConsumptionVsInjectedChart months={months} /> : null}
            <EnergyTable months={months} hasGd={hasGd} />
          </div>

          {assessment ? (
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="text-sm font-semibold">{assessment.titulo}</p>
              <p className="mt-1 text-sm text-muted">{assessment.texto}</p>
              <p className="mt-2 text-xs text-muted">
                Sugestão automática a partir dos números — dá para reescrever na seção de
                encerramento.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function round(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <dt className="text-[11px] font-medium leading-tight text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold tabular-nums">{value}</dd>
    </div>
  );
}
