/**
 * Campos técnicos que cada pilar acompanha dentro de uma empresa.
 *
 * Ficam salvos na coluna `pillar_data` (jsonb) de `engagements`, então dá para
 * criar/remover campos aqui sem mexer no banco.
 */

export type FieldType =
  | "text"
  | "longtext"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "boolean"
  | "select";

export type PillarField = {
  key: string;
  label: string;
  type: FieldType;
  /** Texto de ajuda embaixo do campo. */
  hint?: string;
  /** Unidade mostrada ao lado do valor (kWh, h, etc). */
  unit?: string;
  options?: string[];
  /** Aparece no resumo compacto da empresa. */
  highlight?: boolean;
};

export type PillarSection = {
  title: string;
  fields: PillarField[];
};

export const PILLAR_FIELDS: Record<string, PillarSection[]> = {
  eficiencia_energetica: [
    {
      title: "Perfil de energia",
      fields: [
        { key: "concessionaria", label: "Concessionária", type: "text" },
        {
          key: "grupo_tarifario",
          label: "Grupo tarifário",
          type: "select",
          options: ["A - Verde", "A - Azul", "B1", "B2", "B3", "Não informado"],
        },
        {
          key: "consumo_mensal_kwh",
          label: "Consumo médio mensal",
          type: "number",
          unit: "kWh",
          highlight: true,
        },
        {
          key: "custo_mensal_energia",
          label: "Gasto mensal com energia",
          type: "currency",
          highlight: true,
        },
        { key: "demanda_contratada_kw", label: "Demanda contratada", type: "number", unit: "kW" },
      ],
    },
    {
      title: "Diagnóstico e resultados",
      fields: [
        { key: "diagnostico_realizado", label: "Diagnóstico energético realizado", type: "boolean" },
        { key: "data_diagnostico", label: "Data do diagnóstico", type: "date" },
        {
          key: "economia_estimada_kwh",
          label: "Economia estimada",
          type: "number",
          unit: "kWh/ano",
          highlight: true,
        },
        {
          key: "economia_estimada_rs",
          label: "Economia estimada",
          type: "currency",
          hint: "Por ano",
          highlight: true,
        },
        { key: "payback_meses", label: "Payback", type: "number", unit: "meses" },
        { key: "investimento_previsto", label: "Investimento previsto", type: "currency" },
        {
          key: "medidas",
          label: "Medidas propostas / implantadas",
          type: "longtext",
          hint: "Ex.: troca de iluminação, motores de alto rendimento, correção de fator de potência",
        },
      ],
    },
  ],

  lean: [
    {
      title: "Escopo do trabalho",
      fields: [
        {
          key: "processo_atendido",
          label: "Processo / linha atendida",
          type: "text",
          highlight: true,
        },
        { key: "horas_consultoria", label: "Horas de consultoria", type: "number", unit: "h", highlight: true },
        { key: "pessoas_treinadas", label: "Pessoas treinadas", type: "number" },
        { key: "kaizens_realizados", label: "Kaizens realizados", type: "number" },
        {
          key: "ferramentas",
          label: "Ferramentas aplicadas",
          type: "longtext",
          hint: "Ex.: 5S, VSM, SMED, Kanban, TPM, Poka-Yoke",
        },
      ],
    },
    {
      title: "Indicadores",
      fields: [
        { key: "indicador_principal", label: "Indicador principal", type: "text", hint: "Ex.: OEE, lead time, refugo" },
        { key: "valor_inicial", label: "Valor inicial", type: "text" },
        { key: "valor_atual", label: "Valor atual", type: "text" },
        { key: "ganho_produtividade", label: "Ganho de produtividade", type: "percent", highlight: true },
        { key: "reducao_desperdicio", label: "Redução de desperdício", type: "percent" },
        { key: "ganho_financeiro", label: "Ganho financeiro apurado", type: "currency", highlight: true },
      ],
    },
  ],

  transformacao_digital: [
    {
      title: "Maturidade digital",
      fields: [
        {
          key: "maturidade_inicial",
          label: "Maturidade inicial",
          type: "select",
          options: ["1 - Inicial", "2 - Básico", "3 - Intermediário", "4 - Avançado", "5 - Referência"],
          highlight: true,
        },
        {
          key: "maturidade_atual",
          label: "Maturidade atual",
          type: "select",
          options: ["1 - Inicial", "2 - Básico", "3 - Intermediário", "4 - Avançado", "5 - Referência"],
          highlight: true,
        },
        { key: "data_avaliacao", label: "Data da avaliação", type: "date" },
      ],
    },
    {
      title: "Implantação",
      fields: [
        { key: "horas_consultoria", label: "Horas de consultoria", type: "number", unit: "h" },
        { key: "processos_digitalizados", label: "Processos digitalizados", type: "number", highlight: true },
        {
          key: "sistemas",
          label: "Sistemas / tecnologias",
          type: "longtext",
          hint: "Ex.: MES, ERP, IoT, dashboards, integração de máquinas",
        },
        { key: "investimento_previsto", label: "Investimento previsto", type: "currency" },
        { key: "retorno_estimado", label: "Retorno estimado", type: "currency", highlight: true },
      ],
    },
  ],
};

export function pillarSections(pillarId: string): PillarSection[] {
  return PILLAR_FIELDS[pillarId] ?? [];
}

export function pillarFieldList(pillarId: string): PillarField[] {
  return pillarSections(pillarId).flatMap((section) => section.fields);
}
