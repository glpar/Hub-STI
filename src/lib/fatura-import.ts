import ExcelJS from "exceljs";

import { emptyMonth, type EnergyMonth } from "@/lib/energy";

/**
 * Lê a planilha "Fatura Grupo B" e devolve os 12 meses já preenchidos.
 *
 * A leitura é feita procurando os rótulos na planilha (e não por coordenada
 * fixa), então pequenas mudanças de layout não quebram a importação.
 */

export type FaturaImport = {
  razaoSocial: string | null;
  unidadeConsumidora: string | null;
  modalidade: string | null;
  hasGd: boolean;
  months: EnergyMonth[];
  /** Avisos para mostrar ao usuário (ex.: coluna não encontrada). */
  warnings: string[];
};

type Grid = unknown[][];

/**
 * Normaliza o que o ExcelJS devolve numa célula: fórmula vira o valor
 * calculado, texto rico vira texto puro, o resto passa direto.
 */
function cellValue(raw: unknown): unknown {
  if (raw == null) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "object") {
    const value = raw as Record<string, unknown>;
    if ("result" in value) return cellValue(value.result);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => (part as { text?: string }).text ?? "").join("");
    }
    if ("text" in value) return value.text;
    if ("error" in value) return null;
    return null;
  }
  return raw;
}

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const cleaned = String(value)
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function monthRef(value: unknown): string | null {
  if (value instanceof Date) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const iso = value.match(/^(\d{4})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}`;
    const br = value.match(/^(\d{2})\/(\d{4})$/);
    if (br) return `${br[2]}-${br[1]}`;
  }
  return null;
}

/** Procura a primeira linha cujo rótulo casa, a partir de `from`. */
function findRow(grid: Grid, labels: string[], from = 0) {
  const wanted = labels.map(normalize);
  for (let r = from; r < grid.length; r += 1) {
    for (const cell of grid[r] ?? []) {
      const text = normalize(cell);
      if (!text) continue;
      if (wanted.some((label) => text === label || text.startsWith(label))) return r;
    }
  }
  return -1;
}

/** Valor logo à direita de um rótulo. */
function valueAfterLabel(grid: Grid, labels: string[]) {
  const wanted = labels.map(normalize);
  for (const row of grid) {
    for (let c = 0; c < (row ?? []).length; c += 1) {
      const text = normalize(row[c]);
      if (!text) continue;
      if (!wanted.some((label) => text === label || text.startsWith(label))) continue;

      for (let next = c + 1; next < row.length; next += 1) {
        const candidate = row[next];
        if (candidate != null && String(candidate).trim() !== "") return candidate;
      }
    }
  }
  return null;
}

function readSeries(grid: Grid, row: number, columns: number[]): (number | null)[] {
  if (row < 0) return columns.map(() => null);
  return columns.map((column) => toNumber(grid[row]?.[column]));
}

export async function parseFaturaWorkbook(buffer: ArrayBuffer): Promise<FaturaImport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet =
    workbook.worksheets.find((item) => normalize(item.name).includes("BASE")) ??
    workbook.worksheets[0];

  if (!sheet) {
    return {
      razaoSocial: null,
      unidadeConsumidora: null,
      modalidade: null,
      hasGd: false,
      months: [],
      warnings: ["A planilha não tem nenhuma aba legível."],
    };
  }

  // Grade 2D com coluna 0 = A. O ExcelJS indexa a partir de 1, então
  // descartamos a primeira posição de `row.values`.
  const grid: Grid = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values = Array.isArray(row.values) ? row.values : [];
    grid[rowNumber - 1] = values.slice(1).map((cell) => cellValue(cell));
  });
  for (let i = 0; i < grid.length; i += 1) if (!grid[i]) grid[i] = [];

  const warnings: string[] = [];

  // --- Linha de meses: a que tiver mais datas ------------------------------
  let headerRow = -1;
  let columns: number[] = [];
  let refs: string[] = [];

  grid.forEach((row, index) => {
    const found: { column: number; ref: string }[] = [];
    (row ?? []).forEach((cell, column) => {
      const ref = monthRef(cell);
      if (ref) found.push({ column, ref });
    });
    if (found.length > columns.length) {
      headerRow = index;
      columns = found.map((item) => item.column);
      refs = found.map((item) => item.ref);
    }
  });

  if (refs.length === 0) {
    return {
      razaoSocial: null,
      unidadeConsumidora: null,
      modalidade: null,
      hasGd: false,
      months: [],
      warnings: [
        "Não encontrei a linha com os meses de referência. Confira se a planilha é a de fatura (aba “1. BASE”).",
      ],
    };
  }

  // --- Localiza cada série pelo rótulo ------------------------------------
  const rowConsumo = findRow(grid, ["CONSUMO KWH", "CONSUMO KWH"], headerRow);
  const rowValorConsumo = findRow(grid, ["VALOR CONSUMO"], headerRow);
  const rowReativoKwh = findRow(grid, ["CONSUMO ENER REATIVA"], headerRow);
  const rowCustoReativo = findRow(grid, ["CUSTO REATIVO"], headerRow);
  const rowInjetada = findRow(grid, ["ENERGIA ATIVA INJETADA"], headerRow);
  const rowGeracao = findRow(grid, ["VALOR GERACAO"], headerRow);
  const rowSaldo = findRow(grid, ["SALDO ENERGIA EM KWH", "SALDO ENERGIA"], headerRow);

  // "PREÇO UNIT" aparece duas vezes: a primeira é do consumo, a segunda da injeção.
  const rowPrecoConsumo = rowConsumo >= 0 ? findRow(grid, ["PRECO UNIT"], rowConsumo) : -1;
  const rowPrecoInjetada = rowInjetada >= 0 ? findRow(grid, ["PRECO UNIT"], rowInjetada) : -1;

  if (rowConsumo < 0) warnings.push("Não encontrei a linha “CONSUMO kWh”.");

  const consumo = readSeries(grid, rowConsumo, columns);
  const precoUnit = readSeries(grid, rowPrecoConsumo, columns);
  const valorConsumo = readSeries(grid, rowValorConsumo, columns);
  const reativoKwh = readSeries(grid, rowReativoKwh, columns);
  const custoReativo = readSeries(grid, rowCustoReativo, columns);
  const injetada = readSeries(grid, rowInjetada, columns);
  const precoInjetada = readSeries(grid, rowPrecoInjetada, columns);
  const geracao = readSeries(grid, rowGeracao, columns);
  const saldo = readSeries(grid, rowSaldo, columns);

  const months: EnergyMonth[] = refs.map((ref, index) => ({
    ...emptyMonth(ref),
    consumoKwh: consumo[index],
    precoUnit: precoUnit[index],
    valorConsumo: valorConsumo[index],
    reativoKwh: reativoKwh[index],
    custoReativo: custoReativo[index],
    injetadaKwh: injetada[index],
    precoInjetada: precoInjetada[index],
    valorGeracao: geracao[index],
    saldoKwh: saldo[index],
  }));

  // --- Cabeçalho da planilha ----------------------------------------------
  const gdAnswer = normalize(valueAfterLabel(grid, ["EXISTE GD NA UNIDADE"]));
  const hasGd = gdAnswer.startsWith("SIM") || months.some((month) => (month.injetadaKwh ?? 0) > 0);

  const text = (value: unknown) => {
    const result = String(value ?? "").trim();
    return result === "" || result === "0" ? null : result;
  };

  if (months.length < 12) {
    warnings.push(
      `A planilha trouxe ${months.length} ${months.length === 1 ? "mês" : "meses"} em vez de 12.`,
    );
  }

  return {
    razaoSocial: text(valueAfterLabel(grid, ["RAZAO SOCIAL"])),
    unidadeConsumidora: text(valueAfterLabel(grid, ["UNIDADE CONSUMIDORA", "N CONSUMIDOR"])),
    modalidade: text(valueAfterLabel(grid, ["MODALIDADE TARIFARIA"])),
    hasGd,
    months,
    warnings,
  };
}
