/**
 * Ficha de Visita Técnica — Consultoria de Eficiência Energética (ME/EPP).
 *
 * Estrutura espelhada do formulário oficial do SENAI. As seções 1 a 4 são
 * obrigatórias; da 5 em diante o consultor liga a chavinha só das que for usar.
 *
 * As respostas ficam em `technical_visits.answers`, uma chave por seção, então
 * dá para acrescentar ou remover campos aqui sem migração de banco.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "checks"
  | "radio"
  | "table";

export type TableColumn = {
  key: string;
  label: string;
  kind: "text" | "number" | "select";
  options?: string[];
  /** Largura sugerida da coluna (fração do total). */
  grow?: number;
};

export type Field = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  hint?: string;
  unit?: string;
  options?: string[];
  columns?: TableColumn[];
  /** Linhas fixas já criadas ao abrir (ex.: grandezas elétricas). */
  seedRows?: Record<string, string>[];
  /** Ocupa a linha inteira no desktop. */
  wide?: boolean;
  rows?: number;
};

export type FieldGroup = {
  title?: string;
  fields: Field[];
};

export type Section = {
  id: string;
  number: number;
  /** Bloco do formulário impresso, ex.: "01 — IDENTIFICAÇÃO E OPERAÇÃO". */
  block: string;
  title: string;
  required: boolean;
  intro?: string;
  groups: FieldGroup[];
  /** Seções com interface própria (histórico de consumo, fotos). */
  special?: "energia" | "fotos";
};

const PRIORIDADE = ["Alta", "Média", "Baixa"];

export const VISIT_SECTIONS: Section[] = [
  // ------------------------------------------- 01 — IDENTIFICAÇÃO E OPERAÇÃO
  {
    id: "s1",
    number: 1,
    block: "01 — Identificação e operação",
    title: "Dados da empresa",
    required: true,
    groups: [
      {
        fields: [
          { key: "razao_social", label: "Razão social", kind: "text", wide: true },
          { key: "nome_fantasia", label: "Nome fantasia", kind: "text" },
          { key: "cnpj", label: "CNPJ", kind: "text", placeholder: "00.000.000/0000-00" },
          { key: "segmento", label: "Segmento", kind: "text" },
          { key: "endereco", label: "Endereço", kind: "text", wide: true },
          { key: "responsavel", label: "Responsável", kind: "text" },
          { key: "cargo", label: "Cargo", kind: "text" },
          { key: "telefone", label: "Telefone", kind: "text" },
          { key: "email", label: "E-mail", kind: "text" },
        ],
      },
    ],
  },
  {
    id: "s2",
    number: 2,
    block: "01 — Identificação e operação",
    title: "Caracterização da operação",
    required: true,
    groups: [
      {
        fields: [
          { key: "area_m2", label: "Área aproximada", kind: "number", unit: "m²" },
          { key: "funcionarios", label: "Funcionários", kind: "number" },
          { key: "dias_semana", label: "Dias por semana", kind: "number" },
          { key: "turnos", label: "Turnos", kind: "number" },
          { key: "horario_inicio", label: "Horário — das", kind: "time" },
          { key: "horario_fim", label: "Horário — às", kind: "time" },
          { key: "producao", label: "Produção / atendimento", kind: "text", wide: true },
        ],
      },
      {
        title: "Funcionamento e sazonalidade",
        fields: [
          {
            key: "funcionamento",
            label: "Marque o que se aplica",
            kind: "checks",
            wide: true,
            options: [
              "Funcionamento comercial",
              "Funcionamento por turnos",
              "Funcionamento contínuo",
              "Funcionamento sazonal",
              "Variação de produção/atividade",
              "Picos de consumo identificáveis",
            ],
          },
        ],
      },
      {
        fields: [
          {
            key: "atividades",
            label: "Principais atividades / processos",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
          {
            key: "sistemas",
            label: "Principais sistemas consumidores presentes",
            kind: "checks",
            wide: true,
            options: [
              "Climatização",
              "Refrigeração",
              "Iluminação",
              "Motores",
              "Bombas",
              "Compressores",
              "Fornos/aquecimento",
              "Máquinas/equipamentos",
              "Computadores/eletrônicos",
              "Outros",
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------- 02 — ENERGIA ELÉTRICA
  {
    id: "s3",
    number: 3,
    block: "02 — Energia elétrica",
    title: "Dados do fornecimento",
    required: true,
    groups: [
      {
        fields: [
          { key: "distribuidora", label: "Distribuidora", kind: "text" },
          { key: "num_uc", label: "Nº da UC", kind: "text" },
          { key: "tensao_nominal", label: "Tensão nominal", kind: "number", unit: "V" },
          { key: "disjuntor_geral", label: "Disjuntor geral", kind: "number", unit: "A" },
          {
            key: "tipo_fornecimento",
            label: "Tipo",
            kind: "radio",
            options: ["Monofásico", "Bifásico", "Trifásico"],
          },
          {
            key: "modalidade",
            label: "Modalidade tarifária",
            kind: "select",
            options: ["Grupo B", "Grupo A — Verde", "Grupo A — Azul", "Não informado"],
          },
          { key: "grupo_classe", label: "Grupo / classe", kind: "text" },
          { key: "observacao", label: "Observação", kind: "textarea", wide: true, rows: 2 },
        ],
      },
    ],
  },
  {
    id: "s4",
    number: 4,
    block: "02 — Energia elétrica",
    title: "Histórico de consumo — 12 meses",
    required: true,
    special: "energia",
    intro:
      "Importe a planilha de fatura para preencher os 12 meses de uma vez, ou digite mês a mês. Os gráficos do relatório saem daqui.",
    groups: [
      {
        title: "Evidências",
        fields: [
          {
            key: "evidencias",
            label: "Marque o que foi coletado",
            kind: "checks",
            wide: true,
            options: [
              "Foto da última fatura",
              "Foto do medidor",
              "Foto do padrão de entrada",
              "Outros documentos",
            ],
          },
          {
            key: "observacoes",
            label: "Observações sobre a conta / contratação / histórico",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // --------------------------------- 03 — INSTALAÇÃO E MEDIÇÕES ELÉTRICAS
  {
    id: "s5",
    number: 5,
    block: "03 — Instalação e medições elétricas",
    title: "Inspeção da instalação elétrica",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "inspecao",
            label: "Condições observadas",
            kind: "checks",
            wide: true,
            options: [
              "Quadro em bom estado",
              "Circuitos identificados",
              "Disjuntores em bom estado",
              "Cabos em bom estado",
              "Ausência de aquecimento aparente",
              "Ausência de conexões improvisadas",
              "Ausência de sobrecarga aparente",
              "Aterramento aparente adequado",
              "Quadro protegido/fechado",
              "Sinais de oxidação/umidade",
            ],
          },
          {
            key: "nao_conformidades",
            label: "Não conformidades / observações",
            kind: "textarea",
            wide: true,
            rows: 4,
          },
        ],
      },
    ],
  },
  {
    id: "s6",
    number: 6,
    block: "03 — Instalação e medições elétricas",
    title: "Medições elétricas",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "grandezas",
            label: "Medições por fase",
            kind: "table",
            wide: true,
            columns: [
              { key: "grandeza", label: "Grandeza", kind: "text", grow: 2 },
              { key: "l1", label: "L1", kind: "number" },
              { key: "l2", label: "L2", kind: "number" },
              { key: "l3", label: "L3", kind: "number" },
              { key: "unidade", label: "Unid.", kind: "text" },
            ],
            seedRows: [
              { grandeza: "Tensão", unidade: "V" },
              { grandeza: "Corrente", unidade: "A" },
              { grandeza: "Potência", unidade: "kW" },
              { grandeza: "Fator de potência", unidade: "—" },
            ],
          },
          { key: "potencia_total", label: "Potência total", kind: "number", unit: "kW" },
          { key: "frequencia", label: "Frequência", kind: "number", unit: "Hz" },
          { key: "equipamento_quadro", label: "Equipamento / quadro", kind: "text" },
          { key: "horario", label: "Horário", kind: "time" },
          {
            key: "adicionais",
            label: "Medições adicionais, quando aplicável",
            kind: "checks",
            wide: true,
            options: [
              "THD de tensão",
              "THD de corrente",
              "Desequilíbrio de tensão",
              "Desequilíbrio de corrente",
              "Temperatura/termografia",
              "Energia acumulada",
            ],
          },
          {
            key: "observacoes",
            label: "Observações / instrumento utilizado / condições de medição",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------- 04 — ILUMINAÇÃO
  {
    id: "s7",
    number: 7,
    block: "04 — Iluminação",
    title: "Levantamento da iluminação",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "inventario",
            label: "Inventário por ambiente",
            kind: "table",
            wide: true,
            columns: [
              { key: "ambiente", label: "Ambiente / setor", kind: "text", grow: 2 },
              { key: "qtd", label: "Qtd.", kind: "number" },
              {
                key: "tipo",
                label: "Tipo",
                kind: "select",
                options: ["LED", "Fluorescente", "Incandescente", "Halógena", "Outro"],
              },
              { key: "watts", label: "W/un.", kind: "number" },
              { key: "horas_dia", label: "h/dia", kind: "number" },
              { key: "dias_mes", label: "Dias/mês", kind: "number" },
            ],
          },
          {
            key: "condicoes",
            label: "Condições observadas",
            kind: "checks",
            wide: true,
            options: [
              "LED",
              "Fluorescente",
              "Incandescente",
              "Halógena",
              "Iluminação excessiva",
              "Iluminação insuficiente",
              "Luz acesa sem necessidade",
              "Falta de setorização",
              "Aproveitamento de luz natural",
              "Sensor de presença",
              "Temporizador",
              "Outros",
            ],
          },
        ],
      },
      {
        title: "Medição de iluminância",
        fields: [
          { key: "ilum_ambiente", label: "Ambiente", kind: "text" },
          { key: "ilum_horario", label: "Horário", kind: "time" },
          { key: "ponto1", label: "Ponto 1", kind: "number", unit: "lux" },
          { key: "ponto2", label: "Ponto 2", kind: "number", unit: "lux" },
          { key: "ponto3", label: "Ponto 3", kind: "number", unit: "lux" },
          { key: "ponto4", label: "Ponto 4", kind: "number", unit: "lux" },
          {
            key: "oportunidade",
            label: "Oportunidade / observações",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // --------------------------------------------------- 05 — CLIMATIZAÇÃO
  {
    id: "s8",
    number: 8,
    block: "05 — Climatização",
    title: "Ar-condicionado",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "equipamentos",
            label: "Equipamentos de climatização",
            kind: "table",
            wide: true,
            columns: [
              { key: "equipamento", label: "Equipamento", kind: "text", grow: 2 },
              { key: "qtd", label: "Qtd.", kind: "number" },
              { key: "btu", label: "BTU/h", kind: "number" },
              { key: "potencia_w", label: "Potência (W)", kind: "number" },
              { key: "inverter", label: "Inverter", kind: "select", options: ["Sim", "Não"] },
              { key: "horas_dia", label: "h/dia", kind: "number" },
            ],
          },
          {
            key: "condicoes",
            label: "Condições observadas",
            kind: "checks",
            wide: true,
            options: [
              "Filtro limpo",
              "Filtro sujo",
              "Condensadora limpa",
              "Condensadora obstruída",
              "Portas abertas",
              "Janelas abertas",
              "Ambiente corretamente dimensionado",
              "Equipamento antigo",
              "Equipamento convencional",
              "Equipamento inverter",
              "Temperatura inadequada",
              "Manutenção necessária",
            ],
          },
        ],
      },
      {
        title: "Medição",
        fields: [
          { key: "temp_configurada", label: "Temperatura configurada", kind: "number", unit: "°C" },
          { key: "temp_ambiente", label: "Temperatura ambiente", kind: "number", unit: "°C" },
          { key: "equipamento_medido", label: "Equipamento medido", kind: "text" },
          { key: "horario", label: "Horário", kind: "time" },
          { key: "tensao", label: "Tensão", kind: "number", unit: "V" },
          { key: "corrente", label: "Corrente", kind: "number", unit: "A" },
          { key: "potencia", label: "Potência", kind: "number", unit: "kW" },
          { key: "fp", label: "Fator de potência", kind: "number" },
          {
            key: "oportunidade",
            label: "Oportunidade / observações",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------- 06 — REFRIGERAÇÃO
  {
    id: "s9",
    number: 9,
    block: "06 — Refrigeração",
    title: "Refrigeradores / freezers / câmaras",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "equipamentos",
            label: "Equipamentos de refrigeração",
            kind: "table",
            wide: true,
            columns: [
              { key: "equipamento", label: "Equipamento", kind: "text", grow: 2 },
              { key: "qtd", label: "Qtd.", kind: "number" },
              { key: "potencia", label: "Potência (W)", kind: "number" },
              { key: "horas_dia", label: "h/dia", kind: "number" },
              { key: "temp", label: "Temp. (°C)", kind: "number" },
              { key: "observacao", label: "Observação", kind: "text", grow: 2 },
            ],
          },
          {
            key: "inspecao",
            label: "Inspeção",
            kind: "checks",
            wide: true,
            options: [
              "Vedação adequada",
              "Vedação inadequada",
              "Condensador limpo",
              "Condensador sujo",
              "Excesso de gelo",
              "Temperatura adequada",
              "Temperatura inadequada",
              "Equipamento antigo",
              "Funcionamento excessivo",
              "Manutenção necessária",
            ],
          },
        ],
      },
      {
        title: "Medição",
        fields: [
          { key: "equipamento_medido", label: "Equipamento", kind: "text" },
          { key: "temperatura", label: "Temperatura", kind: "number", unit: "°C" },
          { key: "tensao", label: "Tensão", kind: "number", unit: "V" },
          { key: "corrente", label: "Corrente", kind: "number", unit: "A" },
          { key: "potencia", label: "Potência", kind: "number", unit: "kW" },
          { key: "horario", label: "Horário", kind: "time" },
          {
            key: "oportunidade",
            label: "Oportunidade / observações",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // ----------------------------- 07 — MOTORES / BOMBAS / COMPRESSORES
  {
    id: "s10",
    number: 10,
    block: "07 — Motores / bombas / compressores",
    title: "Levantamento",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "equipamentos",
            label: "Equipamentos",
            kind: "table",
            wide: true,
            columns: [
              { key: "equipamento", label: "Equipamento", kind: "text", grow: 2 },
              { key: "potencia", label: "Potência", kind: "number" },
              { key: "tensao", label: "Tensão (V)", kind: "number" },
              { key: "corrente", label: "Corrente (A)", kind: "number" },
              { key: "horas_dia", label: "h/dia", kind: "number" },
              { key: "fp", label: "FP", kind: "number" },
            ],
          },
          {
            key: "condicoes",
            label: "Condições observadas",
            kind: "checks",
            wide: true,
            options: [
              "Operação contínua",
              "Opera em vazio",
              "Baixa carga",
              "Aquecimento",
              "Vibração",
              "Manutenção adequada",
              "Necessita manutenção",
              "Inversor de frequência",
              "Controle de velocidade",
              "Possibilidade de reduzir funcionamento",
            ],
          },
        ],
      },
      {
        title: "Medição / equipamento de destaque",
        fields: [
          { key: "equipamento_destaque", label: "Equipamento", kind: "text" },
          { key: "funcao", label: "Função", kind: "text" },
          { key: "potencia_medida", label: "Potência", kind: "number", unit: "kW" },
          { key: "temperatura", label: "Temperatura", kind: "number", unit: "°C" },
          { key: "corrente_medida", label: "Corrente", kind: "number", unit: "A" },
          { key: "fp_medido", label: "Fator de potência", kind: "number" },
          {
            key: "oportunidade",
            label: "Oportunidade / observações",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // -------------------------------------------- 08 — OUTROS EQUIPAMENTOS
  {
    id: "s11",
    number: 11,
    block: "08 — Outros equipamentos",
    title: "Equipamentos específicos / outros consumidores",
    required: false,
    intro:
      "Ex.: forno, chapa, fritadeira, estufa, máquina de solda, computador, aquecedor, máquina de produção.",
    groups: [
      {
        fields: [
          {
            key: "equipamentos",
            label: "Equipamentos",
            kind: "table",
            wide: true,
            columns: [
              { key: "equipamento", label: "Equipamento", kind: "text", grow: 2 },
              { key: "qtd", label: "Qtd.", kind: "number" },
              { key: "potencia", label: "Potência (W)", kind: "number" },
              { key: "horas_dia", label: "h/dia", kind: "number" },
              { key: "dias_mes", label: "Dias/mês", kind: "number" },
              { key: "observacoes", label: "Observações", kind: "text", grow: 2 },
            ],
          },
          {
            key: "observacoes_gerais",
            label: "Observações gerais sobre equipamentos específicos",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // ------------------------------------------ 09 — HÁBITOS E DESPERDÍCIOS
  {
    id: "s12",
    number: 12,
    block: "09 — Hábitos e desperdícios",
    title: "Comportamento energético",
    required: false,
    intro: "Marque apenas situações efetivamente observadas ou relatadas durante a visita.",
    groups: [
      {
        fields: [
          {
            key: "situacoes",
            label: "Situações observadas",
            kind: "checks",
            wide: true,
            options: [
              "Equipamentos ligados sem utilização",
              "Iluminação ligada em ambientes vazios",
              "Ar-condicionado com portas abertas",
              "Temperatura de climatização inadequada",
              "Equipamentos em standby",
              "Equipamentos funcionando fora do horário",
              "Falta de manutenção",
              "Refrigeração aberta excessivamente",
              "Equipamentos antigos",
              "Ausência de controle do consumo",
              "Uso desnecessário de equipamentos",
              "Outros",
            ],
          },
          {
            key: "evidencias",
            label: "Evidências / locais / horários / relato do responsável",
            kind: "textarea",
            wide: true,
            rows: 4,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------- 10 — OPORTUNIDADES
  {
    id: "s13",
    number: 13,
    block: "10 — Oportunidades",
    title: "Oportunidades de eficiência energética",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "oportunidades",
            label: "Oportunidades identificadas",
            kind: "table",
            wide: true,
            columns: [
              {
                key: "sistema",
                label: "Sistema",
                kind: "select",
                options: [
                  "Iluminação",
                  "Climatização",
                  "Refrigeração",
                  "Motores",
                  "Fornos / aquecimento",
                  "Instalação elétrica",
                  "Gestão / hábitos",
                  "Geração própria",
                  "Outros",
                ],
                grow: 2,
              },
              {
                key: "oportunidade",
                label: "Oportunidade identificada",
                kind: "text",
                grow: 3,
              },
              { key: "prioridade", label: "Prioridade", kind: "select", options: PRIORIDADE },
            ],
          },
        ],
      },
      {
        title: "Detalhamento da oportunidade",
        fields: [
          { key: "det_numero", label: "Oportunidade nº", kind: "text" },
          { key: "det_sistema", label: "Sistema", kind: "text" },
          {
            key: "det_situacao",
            label: "Situação encontrada",
            kind: "textarea",
            wide: true,
            rows: 2,
          },
          { key: "det_causa", label: "Causa provável", kind: "textarea", wide: true, rows: 2 },
          { key: "det_recomendacao", label: "Recomendação", kind: "textarea", wide: true, rows: 2 },
          { key: "det_investimento", label: "Investimento estimado (R$)", kind: "number" },
          { key: "det_foto", label: "Foto / evidência nº", kind: "text" },
          {
            key: "det_complemento",
            label: "Complemento / cálculo a ser realizado posteriormente",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },

  // ------------------------------------ 11 — EVIDÊNCIAS E ENCERRAMENTO
  {
    id: "s14",
    number: 14,
    block: "11 — Evidências e encerramento",
    title: "Registro de fotos / evidências",
    required: false,
    special: "fotos",
    intro:
      "As fotos anexadas em qualquer seção aparecem aqui e saem no relatório com a legenda escrita.",
    groups: [],
  },
  {
    id: "s15",
    number: 15,
    block: "11 — Evidências e encerramento",
    title: "Documentos pendentes",
    required: false,
    groups: [
      {
        fields: [
          {
            key: "documentos",
            label: "Documentos que ficaram pendentes",
            kind: "checks",
            wide: true,
            options: [
              "Faturas de energia",
              "Dados de produção/atendimento",
              "Relação de equipamentos",
              "Histórico de manutenção",
              "Diagrama/planta elétrica",
              "Outros",
            ],
          },
          {
            key: "prazo",
            label: "Documentos pendentes / prazo para envio",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
        ],
      },
    ],
  },
  {
    id: "s16",
    number: 16,
    block: "11 — Evidências e encerramento",
    title: "Encerramento",
    required: false,
    groups: [
      {
        fields: [
          { key: "achados", label: "Principais achados", kind: "textarea", wide: true, rows: 4 },
          {
            key: "oportunidades",
            label: "Principais oportunidades",
            kind: "textarea",
            wide: true,
            rows: 4,
          },
          {
            key: "observacoes_finais",
            label: "Observações finais",
            kind: "textarea",
            wide: true,
            rows: 3,
          },
          { key: "responsavel_empresa", label: "Responsável da empresa", kind: "text" },
          { key: "consultor_senai", label: "Consultor SENAI", kind: "text" },
          { key: "data_encerramento", label: "Data", kind: "date" },
        ],
      },
    ],
  },
];

export const REQUIRED_SECTIONS = VISIT_SECTIONS.filter((section) => section.required);
export const OPTIONAL_SECTIONS = VISIT_SECTIONS.filter((section) => !section.required);

export function getSection(id: string) {
  return VISIT_SECTIONS.find((section) => section.id === id);
}

/** Agrupa as seções pelos blocos do formulário impresso. */
export function sectionsByBlock() {
  const blocks: { block: string; sections: Section[] }[] = [];
  for (const section of VISIT_SECTIONS) {
    const last = blocks[blocks.length - 1];
    if (last && last.block === section.block) last.sections.push(section);
    else blocks.push({ block: section.block, sections: [section] });
  }
  return blocks;
}
