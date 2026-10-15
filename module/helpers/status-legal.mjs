/**
 * Módulo de Regras Canônicas de Ilícitos, Leis e Status Legal de Equipamentos.
 * Mighty Blade 3ª Edição (Guia de Tebryn / Guia do Vilão).
 *
 * Implementa as regras canônicas:
 * - Subtítulo 27.1: Status Legal de Itens, Extratos e Elixires (verificarStatusLegal)
 *   * Validação de itens, poções e venenos marcados como ilegais (ex: Elixir do Dragão Vermelho, Peçonha Negra).
 *   * Classificação por categorias ilícitas, motivos legais e sanções cabíveis.
 * - Subtítulo 27.2: Fiscalização e Porte em Metrópoles Patrulhadas (verificarPorteIlegal)
 *   * Personagens portando itens ilegais em metrópoles como Tebrynia acionam testes de Furtividade/Enganação
 *     ao passar por guardas estaduais ou Archons.
 *   * Ambientes não patrulhados (ermos, ruínas, esconderijos) não exigem testes de dissimulação.
 * - Subtítulo 27.3: Procedimentos de Apreensão e Abordagem de Autoridades (apreenderItensIlegais, simularAbordagemPatrulha)
 */

/* ------------------------------------------------------------------------- */
/* CONSTANTES E TABELAS CANÔNICAS                                            */
/* ------------------------------------------------------------------------- */

/**
 * Status legais possíveis de um equipamento ou substância.
 */
export const STATUS_LEGAL = {
  LEGAL: "legal",
  ILEGAL: "ilegal",
  RESTRITO: "restrito",
  CONTRABANDO: "contrabando",
};

/**
 * Sanções legais oficiais previstas pelas leis imperiais e estaduais de Tebryn.
 */
export const SANCOES_LEGAIS = {
  CONFISCO: "Confisco imediato do material ilícito pela guarda local",
  MULTA: "Sanção pecuniária em moedas de ouro ou tibares fixada por magistrado",
  PRISAO: "Detenção e cárcere em masmorra estadual ou fortaleza dos Archons",
  JULGAMENTO_ARCHONS: "Julgamento sumário perante o Tribunal Inquisitorial dos Archons",
  PENA_CAPITAL: "Pena capital ou banimento perpétuo para posse ou tráfico de toxinas letais",
};

/**
 * Catálogo canônico de itens ilícitos, elixires proibidos e venenos restritos
 * (Guia de Tebryn / Guia do Vilão).
 */
export const ITENS_ILICITOS_CANONICOS = new Map([
  [
    "elixir do dragao vermelho",
    {
      nome: "Elixir do Dragão Vermelho",
      categoria: "elixir_proibido",
      motivo: "Substância nefasta que induz fúria violenta incontrolável e queima a sanidade; terminantemente proibida pelas leis de Tebrynia.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PRISAO, SANCOES_LEGAIS.JULGAMENTO_ARCHONS],
    },
  ],
  [
    "veneno restrito",
    {
      nome: "Veneno Restrito",
      categoria: "veneno_restrito",
      motivo: "Composto tóxico de circulação proibida para posse civil desautorizada.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.MULTA],
    },
  ],
  [
    "peconha negra",
    {
      nome: "Peçonha Negra",
      categoria: "veneno_restrito",
      motivo: "Toxina virulenta de necrose acelerada banida pelos tratados de segurança pública.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PRISAO],
    },
  ],
  [
    "veneno de basilisco",
    {
      nome: "Veneno de Basilisco",
      categoria: "veneno_restrito",
      motivo: "Toxina petrificante de altíssima periculosidade banida em todas as metrópoles de Tebryn.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PRISAO, SANCOES_LEGAIS.JULGAMENTO_ARCHONS],
    },
  ],
  [
    "extrato de beladona",
    {
      nome: "Extrato de Beladona",
      categoria: "veneno_restrito",
      motivo: "Extrato vegetal concentrado com alta toxidade; comércio restrito a boticários reais autorizados.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.MULTA],
    },
  ],
  [
    "nevoa da loucura",
    {
      nome: "Névoa da Loucura",
      categoria: "extrato_proibido",
      motivo: "Substância volátil causadora de histeria e ruptura psíquica severa; classificada como arma química ilegal.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PRISAO],
    },
  ],
  [
    "toxina do escorpiao purpura",
    {
      nome: "Toxina do Escorpião Púrpura",
      categoria: "veneno_restrito",
      motivo: "Veneno paralisante mortal de posse vetada pelos guardas estaduais.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PRISAO],
    },
  ],
  [
    "po do esquecimento",
    {
      nome: "Pó do Esquecimento",
      categoria: "extrato_proibido",
      motivo: "Alucinógeno que destrói memórias e anula a vontade; expressamente banido pelos Archons.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.JULGAMENTO_ARCHONS],
    },
  ],
  [
    "essencia da morte",
    {
      nome: "Essência da Morte",
      categoria: "veneno_restrito",
      motivo: "Agente letal fulminante catalogado como instrumento de regicídio e crime hediondo.",
      sancoes: [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PENA_CAPITAL],
    },
  ],
]);

/** Ambientes canônicos onde há vigilância contínua de guardas estaduais ou Archons */
export const AMBIENTES_PATRULHADOS = [
  "metropole",
  "metrópole",
  "tebrynia",
  "tebryn",
  "cidade",
  "cidade_patrulhada",
  "porto_imperial",
  "posto_fiscal",
  "fronteira_archons",
  "distrito_nobre",
  "guarda_estadual",
  "patrulhado",
  "palacio",
  "portao_da_cidade",
];

/** Ambientes ermos ou marginais sem vigilância oficial da lei */
export const AMBIENTES_NAO_PATRULHADOS = [
  "ermos",
  "floresta",
  "subterraneo",
  "ruinas",
  "selva",
  "deserto",
  "covil",
  "esconderijo",
  "nao_patrulhado",
  "selvagem",
  "pantano",
  "mar_aberto",
];

/* ------------------------------------------------------------------------- */
/* UTILITÁRIOS DE NORMALIZAÇÃO                                               */
/* ------------------------------------------------------------------------- */

/**
 * Normaliza strings para comparações seguras sem acentos e em minúsculas.
 * @param {string} str
 * @returns {string}
 */
export function normalizarTexto(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Determina se determinado ambiente ou contexto conta com patrulha de autoridades.
 * @param {string|object} contextoAmbiente
 * @returns {boolean} True se o ambiente for ativamente patrulhado
 */
export function isAmbientePatrulhado(contextoAmbiente) {
  if (contextoAmbiente === null || contextoAmbiente === undefined) {
    // Padrão canônico: metrópole (patrulhada)
    return true;
  }

  if (typeof contextoAmbiente === "boolean") {
    return contextoAmbiente;
  }

  if (typeof contextoAmbiente === "object") {
    if (typeof contextoAmbiente.patrulhado === "boolean") {
      return contextoAmbiente.patrulhado;
    }
    const nomeAmbiente =
      contextoAmbiente.tipo ||
      contextoAmbiente.nome ||
      contextoAmbiente.ambiente ||
      contextoAmbiente.contexto ||
      "";
    return isAmbientePatrulhado(nomeAmbiente);
  }

  const norm = normalizarTexto(contextoAmbiente);

  // Checa lista explícita de não patrulhados
  for (const naoPatr of AMBIENTES_NAO_PATRULHADOS) {
    if (norm === naoPatr || norm.includes(naoPatr)) {
      return false;
    }
  }

  // Checa lista de patrulhados ou termos afins
  for (const patr of AMBIENTES_PATRULHADOS) {
    if (norm === patr || norm.includes(patr)) {
      return true;
    }
  }

  // Ambientes urbanos genéricos contam como patrulhados
  if (
    norm.includes("metro") ||
    norm.includes("cidad") ||
    norm.includes("guarda") ||
    norm.includes("archon") ||
    norm.includes("posto") ||
    norm.includes("patrulh")
  ) {
    return true;
  }

  return false;
}

/* ------------------------------------------------------------------------- */
/* 1. STATUS LEGAL DE EQUIPAMENTOS E SUBSTÂNCIAS                            */
/* ------------------------------------------------------------------------- */

/**
 * Avalia o status legal de um item, extrato, elixir ou equipamento.
 *
 * Regras Canônicas (Guia de Tebryn / Guia do Vilão):
 * - Itens com a propriedade `ilegal: true`, `statusLegal: "ilegal"` ou raridade `"ilegal"`
 *   são catalogados como proibidos.
 * - Elixires e venenos proibidos conhecidos (ex: Elixir do Dragão Vermelho, Peçonha Negra,
 *   Veneno de Basilisco, etc.) são identificados canonicamente mesmo sem flag explícita.
 *
 * @param {object|string} item Instância de Item, documento ou nome do item
 * @returns {{
 *   ilegal: boolean,
 *   status: "ilegal"|"legal",
 *   nome: string,
 *   motivo: string,
 *   sancoes: string[],
 *   categoria: string,
 *   origem: string
 * }}
 */
export function verificarStatusLegal(item) {
  if (!item) {
    return {
      ilegal: false,
      status: STATUS_LEGAL.LEGAL,
      nome: "",
      motivo: "Nenhum item informado para análise.",
      sancoes: [],
      categoria: "desconhecido",
      origem: "nulo",
    };
  }

  const isObj = typeof item === "object";
  const nomeItem = isObj ? (item.name || item.nome || "") : String(item);
  const nomeNorm = normalizarTexto(nomeItem);

  const sys = isObj ? (item.system || {}) : {};
  const flags = isObj ? (item.flags?.["mighty-blade"] || item.flags || {}) : {};
  const props = Array.isArray(sys.propriedades)
    ? sys.propriedades.map((p) => normalizarTexto(p))
    : [];

  // 1. Checa flag e propriedades explícitas de ilegalidade
  const flagIlegal =
    sys.ilegal === true ||
    item.ilegal === true ||
    flags.ilegal === true ||
    sys.statusLegal === STATUS_LEGAL.ILEGAL ||
    item.statusLegal === STATUS_LEGAL.ILEGAL ||
    flags.statusLegal === STATUS_LEGAL.ILEGAL ||
    sys.legal === false ||
    item.legal === false ||
    normalizarTexto(sys.raridade) === "ilegal" ||
    normalizarTexto(item.raridade) === "ilegal" ||
    normalizarTexto(sys.categoria) === "ilegal" ||
    props.includes("ilegal") ||
    props.includes("proibido") ||
    props.includes("contrabando");

  // 2. Checa catálogo canônico por nome
  let dadosCanonicos = null;
  for (const [chaveCanonica, dados] of ITENS_ILICITOS_CANONICOS.entries()) {
    if (nomeNorm === chaveCanonica || nomeNorm.includes(chaveCanonica)) {
      dadosCanonicos = dados;
      break;
    }
  }

  // Se tiver flag explícita de ilegalidade
  if (flagIlegal) {
    const motivo =
      sys.motivoIlegal ||
      item.motivoIlegal ||
      dadosCanonicos?.motivo ||
      "Item catalogado como ilícito segundo as normas de controle de Tebryn e o Guia do Vilão.";

    const sancoes = Array.isArray(sys.sancoes)
      ? sys.sancoes
      : (dadosCanonicos?.sancoes || [SANCOES_LEGAIS.CONFISCO, SANCOES_LEGAIS.PRISAO]);

    const categoria =
      sys.subtipo ||
      sys.categoria ||
      dadosCanonicos?.categoria ||
      "substancia_proibida";

    return {
      ilegal: true,
      status: STATUS_LEGAL.ILEGAL,
      nome: nomeItem || dadosCanonicos?.nome || "Item Ilegal",
      motivo,
      sancoes,
      categoria,
      origem: "flag_item",
    };
  }

  // Se corresponder a um item ilícito canônico por catálogo
  if (dadosCanonicos) {
    return {
      ilegal: true,
      status: STATUS_LEGAL.ILEGAL,
      nome: nomeItem || dadosCanonicos.nome,
      motivo: dadosCanonicos.motivo,
      sancoes: [...dadosCanonicos.sancoes],
      categoria: dadosCanonicos.categoria,
      origem: "catalogo_canonico",
    };
  }

  // 3. Item Legal
  return {
    ilegal: false,
    status: STATUS_LEGAL.LEGAL,
    nome: nomeItem || "Equipamento Legal",
    motivo: "Item de comércio regular e livre circulação nas províncias e metrópoles.",
    sancoes: [],
    categoria: sys.subtipo || sys.categoria || "equipamento_legal",
    origem: "padrao",
  };
}

/* ------------------------------------------------------------------------- */
/* 2. VERIFICAÇÃO DE PORTE ILEGAL EM AMBIENTES PATRULHADOS                   */
/* ------------------------------------------------------------------------- */

/**
 * Avalia se o personagem está portando itens ilícitos e se aciona testes de
 * Furtividade ou Enganação ao passar por patrulhas em ambientes urbanos (ex: Tebrynia).
 *
 * Regras Canônicas (Guia de Tebryn / Guia do Vilão):
 * - Personagens portando itens com a flag/propriedade Ilegal acionam testes de Furtividade/Enganação
 *   ao passar por guardas estaduais ou Archons em metrópoles como Tebrynia.
 * - Retorna `{ exigeTesteFurtividade: true, atributoRecomendado: "agilidade", periciaRecomendada: "furtividade", itensIlegais: [...] }`.
 * - Se não portar itens ilegais ou ambiente não for patrulhado, retorna `{ exigeTesteFurtividade: false }`.
 *
 * @param {object} actor Instância ou objeto do Ator
 * @param {string|object} [contextoAmbiente="metropole"] Nome ou objeto contextual do ambiente
 * @returns {{
 *   exigeTesteFurtividade: boolean,
 *   atributoRecomendado?: string,
 *   periciaRecomendada?: string,
 *   periciaAlternativa?: string,
 *   itensIlegais?: object[],
 *   quantidadeIlegais?: number,
 *   ambientePatrulhado?: boolean,
 *   ambiente?: string,
 *   autoridade?: string,
 *   motivo?: string,
 *   sancoesRecomendadas?: string[]
 * }}
 */
export function verificarPorteIlegal(actor, contextoAmbiente = "metropole") {
  const patrulhado = isAmbientePatrulhado(contextoAmbiente);

  if (!actor) {
    return {
      exigeTesteFurtividade: false,
      itensIlegais: [],
      ambientePatrulhado: patrulhado,
      motivo: "Nenhum ator fornecido para verificação de porte.",
    };
  }

  const rawItems = Array.isArray(actor.items)
    ? actor.items
    : (actor.items ? Array.from(actor.items.values?.() ?? []) : []);

  const itensIlegais = [];

  for (const item of rawItems) {
    const analise = verificarStatusLegal(item);
    if (analise.ilegal) {
      itensIlegais.push({
        id: item.id || item._id,
        nome: item.name || item.nome || analise.nome,
        categoria: analise.categoria,
        motivo: analise.motivo,
        sancoes: analise.sancoes,
        itemRef: item,
      });
    }
  }

  // Caso 1: Não porta itens ilegais
  if (itensIlegais.length === 0) {
    return {
      exigeTesteFurtividade: false,
      itensIlegais: [],
      ambientePatrulhado: patrulhado,
      motivo: "O personagem não porta nenhum item ou substância ilícita.",
    };
  }

  // Caso 2: Porta itens ilegais, porém ambiente não é patrulhado
  if (!patrulhado) {
    const nomeAmbiente =
      typeof contextoAmbiente === "string"
        ? contextoAmbiente
        : (contextoAmbiente?.tipo || "ermos");

    return {
      exigeTesteFurtividade: false,
      itensIlegais,
      quantidadeIlegais: itensIlegais.length,
      ambientePatrulhado: false,
      ambiente: nomeAmbiente,
      motivo: `O personagem porta ${itensIlegais.length} item(ns) ilícito(s), mas o ambiente (${nomeAmbiente}) não é patrulhado por guardas ou Archons.`,
    };
  }

  // Caso 3: Porta itens ilegais em ambiente patrulhado (exige teste!)
  const nomeAmbiente =
    typeof contextoAmbiente === "string"
      ? contextoAmbiente
      : (contextoAmbiente?.tipo || "metropole");

  const autoridade =
    nomeAmbiente.includes("tebryn") || nomeAmbiente.includes("metro")
      ? "Guardas Estaduais ou Archons de Tebrynia"
      : "Patrulha da Guarda Local";

  // Reúne todas as sanções aplicáveis sem duplicatas
  const todasSancoes = new Set();
  for (const it of itensIlegais) {
    for (const sancao of it.sancoes || []) {
      todasSancoes.add(sancao);
    }
  }

  return {
    exigeTesteFurtividade: true,
    atributoRecomendado: "agilidade",
    periciaRecomendada: "furtividade",
    periciaAlternativa: "enganacao",
    itensIlegais,
    quantidadeIlegais: itensIlegais.length,
    ambientePatrulhado: true,
    ambiente: nomeAmbiente,
    autoridade,
    sancoesRecomendadas: Array.from(todasSancoes),
    dificuldadeSugerida: 12,
    motivo: `O personagem porta ${itensIlegais.length} item(ns) ilícito(s) em área patrulhada (${nomeAmbiente}). Requer teste de Furtividade (Agilidade) ou Enganação para evitar fiscalização e apreensão por ${autoridade}.`,
  };
}

/* ------------------------------------------------------------------------- */
/* 3. PROCEDIMENTOS DE FISCALIZAÇÃO, ABORDAGEM E APREENSÃO                  */
/* ------------------------------------------------------------------------- */

/**
 * Remove ou confisca todos os itens ilegais do inventário do ator.
 * @param {object} actor
 * @returns {object[]} Lista de itens apreendidos
 */
export function apreenderItensIlegais(actor) {
  if (!actor || !actor.items) return [];

  const rawItems = Array.isArray(actor.items)
    ? actor.items
    : Array.from(actor.items.values?.() ?? []);

  const apreendidos = [];

  for (const item of rawItems) {
    const analise = verificarStatusLegal(item);
    if (analise.ilegal) {
      apreendidos.push(item);
      const itemId = item.id || item._id;
      if (typeof actor.deleteEmbeddedDocuments === "function" && itemId) {
        actor.deleteEmbeddedDocuments("Item", [itemId]);
      } else if (typeof actor.removeItem === "function") {
        actor.removeItem((i) => i === item || (itemId && (i.id === itemId || i._id === itemId)) || (item.name && i.name === item.name));
      } else if (Array.isArray(actor.items)) {
        const idx = actor.items.indexOf(item);
        if (idx !== -1) actor.items.splice(idx, 1);
      }
    }
  }

  if (typeof actor.prepareDerivedData === "function") {
    actor.prepareDerivedData();
  }

  return apreendidos;
}

/**
 * Simula a resolução de uma abordagem da patrulha ou fiscais de Tebrynia.
 * @param {object} actor
 * @param {number|object} resultadoRolagem Total obtido no teste de Furtividade/Enganação
 * @param {object} [opcoes={}]
 * @returns {{
 *   evitouAbordagem: boolean,
 *   dificuldade: number,
 *   total: number,
 *   itensIlegais: object[],
 *   itensApreendidos: object[],
 *   mensagem: string
 * }}
 */
export function simularAbordagemPatrulha(actor, resultadoRolagem, opcoes = {}) {
  const contexto = opcoes.contextoAmbiente || "metropole";
  const statusPorte = verificarPorteIlegal(actor, contexto);

  if (!statusPorte.exigeTesteFurtividade) {
    return {
      evitouAbordagem: true,
      dificuldade: 0,
      total: 0,
      itensIlegais: [],
      itensApreendidos: [],
      mensagem: "Nenhuma abordagem necessária: personagem desimpedido.",
    };
  }

  const dificuldade = opcoes.dificuldade ?? statusPorte.dificuldadeSugerida ?? 12;
  const total =
    typeof resultadoRolagem === "number"
      ? resultadoRolagem
      : (resultadoRolagem?.total ?? 0);

  const evitouAbordagem = total >= dificuldade;
  let itensApreendidos = [];

  if (!evitouAbordagem && opcoes.apreenderEmCasoDeFalha) {
    itensApreendidos = apreenderItensIlegais(actor);
  }

  const mensagem = evitouAbordagem
    ? `Sucesso no teste de dissimulação (${total} vs DT ${dificuldade}). A patrulha não notou os itens ilícitos.`
    : `Falha na abordagem (${total} vs DT ${dificuldade})! Os guardas ou Archons identificaram o porte de material proibido.`;

  return {
    evitouAbordagem,
    dificuldade,
    total,
    itensIlegais: statusPorte.itensIlegais,
    itensApreendidos,
    mensagem,
  };
}
