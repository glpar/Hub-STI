/**
 * Textos padrão do relatório de consultoria.
 *
 * Servem como ponto de partida — o consultor pode editar qualquer um deles na
 * própria ficha. A redação segue os relatórios já emitidos pela equipe.
 */

export const REPORT_TEXTS = {
  apresentacao:
    "Este relatório apresenta o diagnóstico energético realizado na empresa, com o objetivo de identificar oportunidades de melhoria na eficiência do uso da energia elétrica, contribuindo para a redução de custos operacionais, aumento da competitividade e menor impacto ambiental.",

  objetivo:
    "A presente documentação tem por objetivo avaliar as condições atuais das infraestruturas elétricas do empreendimento, verificando sua conformidade com os requisitos normativos vigentes. Ademais, busca-se analisar o consumo energético do local, com o intuito de identificar oportunidades de melhoria, bem como assegurar a segurança operacional e a eficiência dos sistemas elétricos.",

  normas: [
    "NBR 5410:2004 — Instalações elétricas em baixa tensão.",
    "NR 10 — Segurança em instalações e serviços em eletricidade.",
  ],

  justificativa: [
    "A análise das instalações elétricas é uma etapa fundamental para garantir a segurança, eficiência e conformidade de qualquer edificação ou sistema industrial. Essa prática permite identificar possíveis falhas, sobrecargas, riscos de curto-circuito e outros problemas que podem comprometer o funcionamento dos equipamentos, causar acidentes ou gerar prejuízos financeiros.",
    "Além disso, a análise técnica assegura que o sistema elétrico esteja em conformidade com as normas vigentes, como a NBR 5410 (Instalações elétricas de baixa tensão), promovendo a adequação às exigências legais e regulatórias. Também contribui para a otimização do consumo de energia, reduzindo desperdícios e melhorando o desempenho energético da instalação.",
    "Em ambientes residenciais, comerciais ou industriais, a análise periódica das instalações elétricas é essencial para prevenir incêndios, choques elétricos e interrupções no fornecimento de energia, protegendo vidas e patrimônios. Portanto, investir na avaliação técnica das instalações elétricas é uma medida estratégica que promove segurança, economia e sustentabilidade.",
  ],

  metodologia:
    "As visitas técnicas foram realizadas por meio de inspeção visual dos componentes elétricos, levantamento das cargas instaladas e análise das condições de operação dos equipamentos existentes. Durante o processo, foram registradas todas as situações observadas, bem como identificadas oportunidades de melhoria, apresentadas ao final deste relatório.",

  objetivosLista: [
    "Diagnosticar o perfil de consumo de energia",
    "Identificar oportunidades de redução de consumo",
    "Propor soluções técnicas e economicamente viáveis",
    "Contribuir para a sustentabilidade do negócio",
  ],

  planoMelhorias: {
    intro:
      "Com base nas situações identificadas durante a inspeção técnica, apresenta-se a seguir uma sugestão de plano geral de melhorias, contemplando ações de adequação, manutenção preventiva e acompanhamento periódico das instalações elétricas e dos principais equipamentos do empreendimento.",
    periodicas: [
      "A cada 6 meses: inspeção, limpeza e verificação das conexões dos quadros elétricos, tomadas, interruptores e demais componentes; verificação das condições do sistema de aterramento e dos dispositivos de proteção.",
      "A cada 6/12 meses: inspeção e manutenção preventiva do sistema fotovoltaico, incluindo inversor, módulos, quadros, conexões e dispositivos de proteção.",
      "Conforme necessidade: manutenção corretiva, adequações ou intervenções decorrentes da instalação de novos equipamentos, alterações de cargas ou identificação de falhas na instalação elétrica.",
    ],
  },

  consideracoesFinais:
    "As ações recomendadas neste relatório têm como objetivo contribuir para a melhoria da segurança operacional, confiabilidade das instalações e eficiência energética do empreendimento. A manutenção adequada dos equipamentos e sistemas elétricos também é fundamental para reduzir a ocorrência de falhas, minimizar interrupções e preservar a vida útil dos componentes. Ressalta-se que as intervenções e os serviços em instalações elétricas devem ser realizados por profissionais legalmente habilitados e qualificados, observando as normas técnicas e de segurança aplicáveis, bem como as recomendações dos fabricantes dos equipamentos.",
} as const;

/** Campos de texto do relatório que o consultor pode sobrescrever na ficha. */
export const EDITABLE_REPORT_FIELDS = [
  { key: "apresentacao", label: "Apresentação", default: REPORT_TEXTS.apresentacao, rows: 4 },
  { key: "objetivo", label: "Objetivo", default: REPORT_TEXTS.objetivo, rows: 4 },
  { key: "metodologia", label: "Metodologia aplicada", default: REPORT_TEXTS.metodologia, rows: 4 },
  {
    key: "consideracoes",
    label: "Considerações finais",
    default: REPORT_TEXTS.consideracoesFinais,
    rows: 5,
  },
] as const;
