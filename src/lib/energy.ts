/**
 * Histórico de consumo de energia (seção 4 da ficha) e os números derivados
 * que alimentam o relatório e os gráficos.
 */

export type EnergyMonth = {
  /** Mês de referência no formato "AAAA-MM". */
  ref: string;
  consumoKwh: number | null;
  precoUnit: number | null;
  valorConsumo: number | null;
  reativoKwh: number | null;
  custoReativo: number | null;
  /** Só usado quando a unidade tem geração distribuída (GD). */
  injetadaKwh: number | null;
  precoInjetada: number | null;
  valorGeracao: number | null;
  saldoKwh: number | null;
};

export function emptyMonth(ref: string): EnergyMonth {
  return {
    ref,
    consumoKwh: null,
    precoUnit: null,
    valorConsumo: null,
    reativoKwh: null,
    custoReativo: null,
    injetadaKwh: null,
    precoInjetada: null,
    valorGeracao: null,
    saldoKwh: null,
  };
}

/** Gera 12 meses terminando no mês informado (padrão: mês passado). */
export function buildTwelveMonths(endRef?: string): EnergyMonth[] {
  const end = endRef ? refToDate(endRef) : previousMonth(new Date());
  const months: EnergyMonth[] = [];

  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    months.push(emptyMonth(dateToRef(date)));
  }

  return months;
}

function previousMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}

function refToDate(ref: string) {
  const [year, month] = ref.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, 1));
}

function dateToRef(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "2025-07" → "jul/25" */
export function shortMonthLabel(ref: string) {
  const [year, month] = ref.split("-");
  const index = Number(month) - 1;
  return `${MONTH_LABELS[index] ?? "?"}/${year.slice(2)}`;
}

/** "2025-07" → "julho de 2025" */
export function longMonthLabel(ref: string) {
  const [year, month] = ref.split("-");
  const names = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${names[Number(month) - 1] ?? "?"} de ${year}`;
}

/** Valor do consumo: usa o informado ou calcula consumo × preço unitário. */
export function monthCost(month: EnergyMonth) {
  if (month.valorConsumo != null) return month.valorConsumo;
  if (month.consumoKwh != null && month.precoUnit != null) {
    return month.consumoKwh * month.precoUnit;
  }
  return null;
}

export type EnergySummary = {
  monthsWithData: number;
  consumoMedio: number;
  custoMedio: number;
  custoTotal: number;
  consumoTotal: number;
  maior: { ref: string; value: number } | null;
  menor: { ref: string; value: number } | null;
  tarifaMedia: number;
  reativoTotal: number;
  /** Só faz sentido quando há GD. */
  injetadaTotal: number;
  injetadaMedia: number;
  geracaoTotal: number;
  /** consumo total − injetada total */
  saldoKwh: number;
  diferencaMedia: number;
  /** Variação da tarifa entre o primeiro e o último mês com dado (fração). */
  variacaoTarifaConsumo: number | null;
  variacaoTarifaInjetada: number | null;
};

export function summarizeEnergy(months: EnergyMonth[]): EnergySummary {
  const withConsumo = months.filter((month) => month.consumoKwh != null);
  const consumos = withConsumo.map((month) => month.consumoKwh as number);

  const custos = months
    .map((month) => monthCost(month))
    .filter((value): value is number => value != null);

  const injetadas = months
    .map((month) => month.injetadaKwh)
    .filter((value): value is number => value != null);

  const geracoes = months
    .map((month) => month.valorGeracao)
    .filter((value): value is number => value != null);

  const reativos = months
    .map((month) => month.custoReativo)
    .filter((value): value is number => value != null);

  const consumoTotal = sum(consumos);
  const injetadaTotal = sum(injetadas);

  let maior: { ref: string; value: number } | null = null;
  let menor: { ref: string; value: number } | null = null;

  for (const month of withConsumo) {
    const value = month.consumoKwh as number;
    if (!maior || value > maior.value) maior = { ref: month.ref, value };
    if (!menor || value < menor.value) menor = { ref: month.ref, value };
  }

  const diferencas = months
    .filter((month) => month.consumoKwh != null && month.injetadaKwh != null)
    .map((month) => (month.consumoKwh as number) - (month.injetadaKwh as number));

  return {
    monthsWithData: withConsumo.length,
    consumoMedio: average(consumos),
    custoMedio: average(custos),
    custoTotal: sum(custos),
    consumoTotal,
    maior,
    menor,
    tarifaMedia: average(
      months.map((month) => month.precoUnit).filter((value): value is number => value != null),
    ),
    reativoTotal: sum(reativos),
    injetadaTotal,
    injetadaMedia: average(injetadas),
    geracaoTotal: sum(geracoes),
    saldoKwh: consumoTotal - injetadaTotal,
    diferencaMedia: average(diferencas),
    variacaoTarifaConsumo: variation(months.map((month) => month.precoUnit)),
    variacaoTarifaInjetada: variation(months.map((month) => month.precoInjetada)),
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

/** Variação entre o primeiro e o último valor preenchido. */
function variation(values: (number | null)[]) {
  const filled = values.filter((value): value is number => value != null && value !== 0);
  if (filled.length < 2) return null;
  const first = filled[0];
  const last = filled[filled.length - 1];
  return (last - first) / first;
}

/**
 * Sugestão automática de análise, no espírito da planilha de fatura:
 * compara o quanto a geração cobre do consumo.
 */
export function gdAssessment(summary: EnergySummary) {
  if (summary.injetadaTotal <= 0) return null;

  const cobertura = summary.consumoTotal > 0 ? summary.injetadaTotal / summary.consumoTotal : 0;

  if (cobertura >= 0.98) {
    return {
      titulo: "Geração cobre o consumo",
      texto:
        "A energia injetada acompanha ou supera o consumo no período analisado. Recomenda-se o acompanhamento periódico da geração e a manutenção preventiva do sistema fotovoltaico.",
    };
  }

  if (cobertura >= 0.85) {
    return {
      titulo: "Não é necessária ampliação imediata",
      texto:
        "Conforme a diferença verificada, é sugerida a adoção de boas práticas para melhor utilização da energia em períodos de produção e o uso mais consciente dos equipamentos, a fim de reduzir o consumo energético.",
    };
  }

  return {
    titulo: "Avaliar ampliação da geração",
    texto:
      "A energia injetada permanece bastante inferior ao consumo no período analisado. É sugerido estudo de ampliação da capacidade junto a empresa ou profissional habilitado e especializado na área, associado a medidas de eficiência energética.",
  };
}
