import { monthCost, shortMonthLabel, type EnergyMonth } from "@/lib/energy";
import { formatCurrency } from "@/lib/format";

/**
 * Gráficos do perfil de consumo de energia, em SVG puro — sem biblioteca,
 * funcionam no relatório impresso e acompanham o tema claro/escuro.
 */

const W = 720;
const H = 300;
const M = { top: 30, right: 12, bottom: 46, left: 58 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

/** Caixa com topo arredondado (4px) e base reta, ancorada na linha zero. */
function barPath(x: number, y: number, width: number, height: number) {
  if (height <= 0.5) return "";
  const r = Math.min(4, height, width / 2);
  const bottom = y + height;
  return [
    `M${x},${bottom}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${bottom}`,
    "Z",
  ].join(" ");
}

function buildScale(max: number, tickCount = 4) {
  if (!Number.isFinite(max) || max <= 0) return { top: 10, ticks: [0, 5, 10] };

  const raw = max / tickCount;
  const exponent = Math.pow(10, Math.floor(Math.log10(raw)));
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * exponent).find((value) => value >= raw) ??
    10 * exponent;

  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 1000; value += step) ticks.push(value);

  return { top, ticks };
}

const intFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function Grid({ ticks, top }: { ticks: number[]; top: number }) {
  return (
    <g>
      {ticks.map((tick) => {
        const y = M.top + PLOT_H - (tick / top) * PLOT_H;
        return (
          <g key={tick}>
            <line
              x1={M.left}
              x2={M.left + PLOT_W}
              y1={y}
              y2={y}
              stroke="var(--viz-grid)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
            <text
              x={M.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--viz-ink-2)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {intFormatter.format(tick)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function MonthAxis({ months }: { months: EnergyMonth[] }) {
  const band = PLOT_W / months.length;
  return (
    <g>
      {months.map((month, index) => (
        <text
          key={month.ref}
          x={M.left + band * index + band / 2}
          y={H - M.bottom + 20}
          textAnchor="middle"
          fontSize={11}
          fill="var(--viz-ink-2)"
        >
          {shortMonthLabel(month.ref)}
        </text>
      ))}
    </g>
  );
}

function ChartFrame({
  title,
  subtitle,
  legend,
  children,
  ariaLabel,
}: {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <figure className="viz m-0">
      <figcaption className="mb-2">
        <p className="text-sm font-semibold">{title}</p>
        {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        {legend ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {legend.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ background: item.color }}
                />
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>

      <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ minWidth: 560, display: "block" }}
          role="img"
          aria-label={ariaLabel}
        >
          {children}
        </svg>
      </div>

      <p className="mt-1 text-[11px] text-muted sm:hidden">Arraste para o lado para ver todos os meses.</p>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 1. Consumo mensal — série única, sem legenda (o título já diz o que é)
// ---------------------------------------------------------------------------
export function ConsumptionChart({ months }: { months: EnergyMonth[] }) {
  const data = months.filter((month) => month.consumoKwh != null);
  if (data.length === 0) return <EmptyChart label="Sem consumo informado ainda." />;

  const values = data.map((month) => month.consumoKwh as number);
  const maxValue = Math.max(...values);
  const { top, ticks } = buildScale(maxValue);

  const band = PLOT_W / data.length;
  const barWidth = Math.min(24, band - 12);

  return (
    <ChartFrame
      title="Consumo de energia (kWh)"
      subtitle={`${data.length} ${data.length === 1 ? "mês" : "meses"} de faturas`}
      ariaLabel={`Gráfico de colunas do consumo mensal de energia em kWh, de ${shortMonthLabel(
        data[0].ref,
      )} a ${shortMonthLabel(data[data.length - 1].ref)}. Consumo máximo de ${intFormatter.format(
        maxValue,
      )} kWh.`}
    >
      <Grid ticks={ticks} top={top} />

      {data.map((month, index) => {
        const value = month.consumoKwh as number;
        const height = (value / top) * PLOT_H;
        const x = M.left + band * index + (band - barWidth) / 2;
        const y = M.top + PLOT_H - height;
        const isMax = value === maxValue;

        return (
          <g key={month.ref}>
            <path d={barPath(x, y, barWidth, height)} fill="var(--viz-s1)">
              <title>{`${shortMonthLabel(month.ref)}: ${intFormatter.format(value)} kWh`}</title>
            </path>
            {isMax ? (
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--viz-ink)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {intFormatter.format(value)}
              </text>
            ) : null}
          </g>
        );
      })}

      <MonthAxis months={data} />
    </ChartFrame>
  );
}

// ---------------------------------------------------------------------------
// 2. Consumo × energia injetada — só quando a unidade tem geração distribuída
// ---------------------------------------------------------------------------
export function ConsumptionVsInjectedChart({ months }: { months: EnergyMonth[] }) {
  const data = months.filter(
    (month) => month.consumoKwh != null || month.injetadaKwh != null,
  );
  if (data.length === 0) return <EmptyChart label="Sem dados de geração informados ainda." />;

  const maxValue = Math.max(
    ...data.map((month) => Math.max(month.consumoKwh ?? 0, month.injetadaKwh ?? 0)),
  );
  const { top, ticks } = buildScale(maxValue);

  const band = PLOT_W / data.length;
  const gap = 2; // espaçador na cor da superfície entre as duas barras
  const barWidth = Math.min(18, (band - 14 - gap) / 2);
  const pairWidth = barWidth * 2 + gap;

  return (
    <ChartFrame
      title="Consumo x energia injetada (kWh)"
      subtitle="Comparativo mensal entre a energia consumida da rede e a energia gerada e injetada"
      legend={[
        { label: "Consumo", color: "var(--viz-s1)" },
        { label: "Energia injetada", color: "var(--viz-s2)" },
      ]}
      ariaLabel="Gráfico de colunas agrupadas comparando, mês a mês, o consumo de energia e a energia ativa injetada pelo sistema de geração distribuída."
    >
      <Grid ticks={ticks} top={top} />

      {data.map((month, index) => {
        const start = M.left + band * index + (band - pairWidth) / 2;

        return (
          <g key={month.ref}>
            {([
              { value: month.consumoKwh, color: "var(--viz-s1)", label: "Consumo", offset: 0 },
              {
                value: month.injetadaKwh,
                color: "var(--viz-s2)",
                label: "Injetada",
                offset: barWidth + gap,
              },
            ] as const).map((series) => {
              if (series.value == null) return null;
              const height = (series.value / top) * PLOT_H;
              const y = M.top + PLOT_H - height;

              return (
                <path
                  key={series.label}
                  d={barPath(start + series.offset, y, barWidth, height)}
                  fill={series.color}
                >
                  <title>
                    {`${shortMonthLabel(month.ref)} · ${series.label}: ${intFormatter.format(
                      series.value,
                    )} kWh`}
                  </title>
                </path>
              );
            })}
          </g>
        );
      })}

      <MonthAxis months={data} />
    </ChartFrame>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
      {label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabela — a leitura alternativa dos mesmos números (e o que vai impresso)
// ---------------------------------------------------------------------------
export function EnergyTable({ months, hasGd }: { months: EnergyMonth[]; hasGd: boolean }) {
  const data = months.filter(
    (month) => month.consumoKwh != null || month.injetadaKwh != null,
  );
  if (data.length === 0) return null;

  return (
    <div>
      <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="py-2 pr-3 font-semibold">Mês</th>
            <th className="py-2 pr-3 text-right font-semibold">Consumo (kWh)</th>
            <th className="py-2 pr-3 text-right font-semibold">Tarifa (R$/kWh)</th>
            <th className="py-2 pr-3 text-right font-semibold">Valor</th>
            {hasGd ? (
              <>
                <th className="py-2 pr-3 text-right font-semibold">Injetada (kWh)</th>
                <th className="py-2 text-right font-semibold">Saldo (kWh)</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.map((month) => (
            <tr key={month.ref} className="border-b border-line/60">
              <td className="py-2 pr-3">{shortMonthLabel(month.ref)}</td>
              <td className="py-2 pr-3 text-right">
                {month.consumoKwh != null ? intFormatter.format(month.consumoKwh) : "—"}
              </td>
              <td className="py-2 pr-3 text-right">
                {month.precoUnit != null
                  ? month.precoUnit.toLocaleString("pt-BR", {
                      minimumFractionDigits: 5,
                      maximumFractionDigits: 5,
                    })
                  : "—"}
              </td>
              <td className="py-2 pr-3 text-right">
                {monthCost(month) != null ? formatCurrency(monthCost(month) as number) : "—"}
              </td>
              {hasGd ? (
                <>
                  <td className="py-2 pr-3 text-right">
                    {month.injetadaKwh != null ? intFormatter.format(month.injetadaKwh) : "—"}
                  </td>
                  <td className="py-2 text-right">
                    {month.saldoKwh != null
                      ? intFormatter.format(month.saldoKwh)
                      : month.consumoKwh != null && month.injetadaKwh != null
                        ? intFormatter.format(month.consumoKwh - month.injetadaKwh)
                        : "—"}
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="mt-1 text-[11px] text-muted sm:hidden">Arraste para o lado para ver todas as colunas.</p>
    </div>
  );
}
