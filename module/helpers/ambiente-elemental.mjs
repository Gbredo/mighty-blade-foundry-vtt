/**
 * Módulo de Geografia, Clima e Modificadores Elementais do Ambiente.
 * Grimório das Pequenas Magias - Mighty Blade 3ª Edição (Foundry VTT v14).
 *
 * Implementa as regras canônicas do Subtítulo 25:
 * 1. Ambientes Gelados / Frios (gelado, neve, inverno_rigoroso, eishelm):
 *    - Gelo criado magicamente dura indefinidamente (duracaoInfinita: true, geloIndefinido: true).
 *    - Magias de Fogo sofrem um acréscimo de +2 na Dificuldade de conjuração (+2 DV).
 *
 * 2. Ambientes Quentes / Áridos (quente, arido, terras_secas, picos_orientais, verao_arkania):
 *    - Magias e objetos de Gelo duram apenas metade do tempo normal (tempoReduzidoPelaMetade: true).
 *    - Magias de Fogo causam +5 de dano adicional (danoAdicionalFogo: 5).
 *
 * 3. Ambientes Subaquáticos (subaquatico, mar, rio_fundo, lago_submerso):
 *    - Magias de Fogo: Não funcionam de forma padrão (funcionaPadrao: false, fervem a água
 *      ao redor ou geram nuvens de bolhas ferventes à frente com dano de área local).
 *    - Magias de Gelo: Duram metade do tempo normal (exceto em profundezas polares)
 *      e tendem a flutuar (flutua: true).
 *    - Magias de Eletricidade: Afetam todas as criaturas em um raio de 10 metros ao redor
 *      do conjurador ou têm sua área de efeito dobrada (raio10mTodasCriaturas: true, areaDobrada: true).
 */

/* ------------------------------------------------------------------------- */
/* CONSTANTES CANÔNICAS DE AMBIENTES E ELEMENTOS                             */
/* ------------------------------------------------------------------------- */

export const MODIFICADORES_DIFICULDADE_FOGO_GELADO = 2; // +2 DV
export const DANO_ADICIONAL_FOGO_QUENTE = 5; // +5 dano
export const RAIO_ELETRICIDADE_SUBAQUATICO_METROS = 10; // Raio de 10 metros

export const AMBIENTES_CANONICOS = {
  GELADO: "gelado",
  QUENTE: "quente",
  SUBAQUATICO: "subaquatico",
  NORMAL: "normal",
  gelado: [
    "gelado",
    "neve",
    "inverno_rigoroso",
    "inverno rigoroso",
    "eishelm",
    "frio",
    "polar",
    "geleira",
    "tundra",
    "congelado",
    "glaciar",
  ],
  quente: [
    "quente",
    "arido",
    "árido",
    "terras_secas",
    "terras secas",
    "picos_orientais",
    "picos orientais",
    "verao_arkania",
    "verão arkania",
    "verao arkania",
    "deserto",
    "calor_extremo",
    "calor extremo",
    "vulcanico",
    "vulcânico",
  ],
  subaquatico: [
    "subaquatico",
    "subaquático",
    "mar",
    "rio_fundo",
    "rio fundo",
    "lago_submerso",
    "lago submerso",
    "aquatico",
    "aquático",
    "submerso",
    "oceano",
    "debaixo_dagua",
    "debaixo d'água",
    "profundezas",
    "agua",
    "água",
  ],
  normal: ["normal", "temperado", "padrao", "padrão"],
};

export const CATEGORIAS_AMBIENTE = {
  gelado: {
    id: "gelado",
    nome: "Ambiente Gelado / Frio Rigoroso (Eishelm)",
    descricao: "Frio extremo onde o gelo mágico é eterno e chamas sofrem +2 na Dificuldade.",
  },
  quente: {
    id: "quente",
    nome: "Ambiente Quente / Árido (Terras Secas / Verão Arkania)",
    descricao: "Calor árido onde o gelo derrete na metade do tempo e o fogo causa +5 de dano.",
  },
  subaquatico: {
    id: "subaquatico",
    nome: "Ambiente Subaquático (Mar / Lago Submerso / Rio Fundo)",
    descricao: "Sob a água onde fogo ferve localmente, gelo flutua e eletricidade afeta 10m em raio.",
  },
  normal: {
    id: "normal",
    nome: "Ambiente Normal / Temperado",
    descricao: "Clima equilibrado sem alterações climáticas elementais extremas.",
  },
};

/* ------------------------------------------------------------------------- */
/* HELPERS DE NORMALIZAÇÃO                                                   */
/* ------------------------------------------------------------------------- */

/**
 * Normaliza textos (remove acentos, caixa baixa, sem espaços redundantes).
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
 * Normaliza a identificação de um ambiente climáticogeográfico.
 * Mapeia aliases conhecidos (como "eishelm", "verao_arkania", "rio_fundo")
 * para as categorias canônicas: "gelado", "quente", "subaquatico" ou "normal".
 *
 * @param {string|object} ambiente
 * @returns {string} Categoria canônica do ambiente
 */
export function normalizarAmbiente(ambiente) {
  if (!ambiente) return "normal";

  let raw = "";
  if (typeof ambiente === "string") {
    raw = ambiente;
  } else if (typeof ambiente === "object" && ambiente !== null) {
    raw = ambiente.id || ambiente.tipo || ambiente.ambiente || ambiente.nome || ambiente.name || "";
  }

  const norm = normalizarTexto(raw).replace(/[\s-]+/g, "_");

  // Identificação de ambientes subaquáticos primeiro (inclusive mar/profundezas polares)
  const aliasesSubaquatico = [
    "subaquatico",
    "mar",
    "rio_fundo",
    "lago_submerso",
    "aquatico",
    "submerso",
    "oceano",
    "debaixo_dagua",
    "profundezas",
    "agua",
  ];
  if (aliasesSubaquatico.some((a) => norm === a || norm.includes(a))) {
    return "subaquatico";
  }

  // Identificação de ambientes gelados / frios
  const aliasesGelado = [
    "gelado",
    "neve",
    "inverno_rigoroso",
    "eishelm",
    "frio",
    "polar",
    "geleira",
    "tundra",
    "congelado",
    "glaciar",
  ];
  if (aliasesGelado.some((a) => norm === a || norm.includes(a))) {
    return "gelado";
  }

  // Identificação de ambientes quentes / áridos
  const aliasesQuente = [
    "quente",
    "arido",
    "terras_secas",
    "picos_orientais",
    "verao_arkania",
    "deserto",
    "calor_extremo",
    "vulcanico",
    "calor",
    "seca",
  ];
  if (aliasesQuente.some((a) => norm === a || norm.includes(a))) {
    return "quente";
  }

  return "normal";
}

/**
 * Extrai e normaliza o elemento de uma magia, efeito ou item.
 *
 * @param {string|object} magiaOuEfeito
 * @param {object} [opcoes={}]
 * @returns {string} Elemento normalizado ("gelo", "fogo", "eletricidade" ou nome do elemento)
 */
export function extrairElementoMagia(magiaOuEfeito, opcoes = {}) {
  if (opcoes.elemento) {
    return normalizarElementoMagia(opcoes.elemento);
  }
  if (!magiaOuEfeito) return "neutro";

  if (typeof magiaOuEfeito === "string") {
    return normalizarElementoMagia(magiaOuEfeito);
  }

  const sys = magiaOuEfeito.system || {};
  const candidato =
    sys.elemento ||
    magiaOuEfeito.elemento ||
    sys.tipoDano ||
    magiaOuEfeito.tipoDano ||
    sys.damageType ||
    magiaOuEfeito.damageType ||
    sys.dano?.tipo ||
    magiaOuEfeito.name ||
    magiaOuEfeito.nome ||
    "";

  return normalizarElementoMagia(candidato);
}

/**
 * Normaliza o nome do elemento para as categorias canônicas do sistema.
 * @param {string} elem
 * @returns {string}
 */
export function normalizarElementoMagia(elem) {
  const norm = normalizarTexto(elem);

  if (
    norm.includes("gelo") ||
    norm.includes("frio") ||
    norm.includes("ice") ||
    norm.includes("cold") ||
    norm.includes("frost") ||
    norm.includes("congel")
  ) {
    return "gelo";
  }

  if (
    norm.includes("fogo") ||
    norm.includes("chama") ||
    norm.includes("fire") ||
    norm.includes("calor") ||
    norm.includes("labareda") ||
    norm.includes("incendio")
  ) {
    return "fogo";
  }

  if (
    norm.includes("eletricidade") ||
    norm.includes("raio") ||
    norm.includes("relampago") ||
    norm.includes("electric") ||
    norm.includes("lightning") ||
    norm.includes("choque")
  ) {
    return "eletricidade";
  }

  return norm || "neutro";
}

/* ------------------------------------------------------------------------- */
/* CASO 25: APLICAÇÃO DE MODIFICADORES ELEMENTAIS DO AMBIENTE                 */
/* ------------------------------------------------------------------------- */

/**
 * Aplica modificadores ambientais elementais a uma magia ou efeito, conforme
 * as regras canônicas do Grimório das Pequenas Magias (Subtítulo 25).
 *
 * Regras Canônicas:
 * 1. Ambientes Gelados (gelado, neve, inverno_rigoroso, eishelm):
 *    - Gelo criado magicamente dura indefinidamente (duracaoInfinita: true, geloIndefinido: true).
 *    - Magias de Fogo sofrem acréscimo de +2 na Dificuldade de conjuração (+2 DV).
 *
 * 2. Ambientes Quentes / Áridos (quente, arido, terras_secas, picos_orientais, verao_arkania):
 *    - Magias e objetos de Gelo duram apenas metade do tempo normal (tempoReduzidoPelaMetade: true).
 *    - Magias de Fogo causam +5 de dano adicional (danoAdicionalFogo: 5).
 *
 * 3. Ambientes Subaquáticos (subaquatico, mar, rio_fundo, lago_submerso):
 *    - Magias de Fogo: Não funcionam de forma padrão (funcionaPadrao: false, fervem a água
 *      ao redor ou geram nuvens de bolhas ferventes à frente com dano de área local).
 *    - Magias de Gelo: Duram metade do tempo normal (exceto em profundezas polares)
 *      e tendem a flutuar (flutua: true).
 *    - Magias de Eletricidade: Afetam todas as criaturas em um raio de 10 metros ao redor
 *      do conjurador ou têm sua área de efeito dobrada (raio10mTodasCriaturas: true, areaDobrada: true).
 *
 * @param {object|string} magiaOuEfeito Objeto da magia/efeito ou string com nome/elemento
 * @param {string|object} tipoAmbiente Identificador ou objeto descritor do ambiente
 * @param {object} [opcoes={}] Opções adicionais (profundezasPolares, dificuldade, dano, duracao, mutar)
 * @returns {object} Objeto com dados calculados e flags canônicas
 */
export function aplicarModificadoresAmbiente(magiaOuEfeito, tipoAmbiente, opcoes = {}) {
  const ambienteNorm = normalizarAmbiente(tipoAmbiente);
  const elemento = extrairElementoMagia(magiaOuEfeito, opcoes);

  // Detecção de exceção de profundezas polares (água congelante / mar polar)
  const rawAmbienteStr = typeof tipoAmbiente === "string"
    ? tipoAmbiente
    : (tipoAmbiente?.id || tipoAmbiente?.tipo || tipoAmbiente?.nome || "");
  const normRawAmbiente = normalizarTexto(rawAmbienteStr).replace(/[\s-]+/g, "_");
  const isProfundezasPolares = Boolean(
    opcoes.profundezasPolares ||
    opcoes.profundezas_polares ||
    opcoes.polar ||
    normRawAmbiente === "profundezas_polares" ||
    normRawAmbiente.includes("profundezas_polares") ||
    normRawAmbiente.includes("mar_polar")
  );

  // Extração de valores originais
  let dificuldadeOriginal = 8;
  let danoOriginal = 0;
  let duracaoOriginal = null;

  if (typeof magiaOuEfeito === "object" && magiaOuEfeito !== null) {
    const sys = magiaOuEfeito.system || {};
    if (sys.dificuldade !== undefined && sys.dificuldade !== null) {
      dificuldadeOriginal = Number(sys.dificuldade);
    } else if (magiaOuEfeito.dificuldade !== undefined && magiaOuEfeito.dificuldade !== null) {
      dificuldadeOriginal = Number(magiaOuEfeito.dificuldade);
    }

    if (sys.dano !== undefined && sys.dano !== null) {
      danoOriginal = Number(sys.dano);
    } else if (magiaOuEfeito.dano !== undefined && magiaOuEfeito.dano !== null) {
      danoOriginal = Number(magiaOuEfeito.dano);
    }

    if (sys.duracao !== undefined && sys.duracao !== null) {
      duracaoOriginal = Number(sys.duracao);
    } else if (magiaOuEfeito.duracao !== undefined && magiaOuEfeito.duracao !== null) {
      duracaoOriginal = Number(magiaOuEfeito.duracao);
    }
  }

  // Sobrescrita explícita via opcoes
  if (opcoes.dificuldade !== undefined) dificuldadeOriginal = Number(opcoes.dificuldade);
  if (opcoes.dano !== undefined) danoOriginal = Number(opcoes.dano);
  if (opcoes.duracao !== undefined) duracaoOriginal = Number(opcoes.duracao);

  // Inicialização de flags canônicas
  let duracaoInfinita = false;
  let geloIndefinido = false;
  let tempoReduzidoPelaMetade = false;
  let danoAdicionalFogo = 0;
  let funcionaPadrao = true;
  let flutua = false;
  let raio10mTodasCriaturas = false;
  let areaDobrada = false;

  let modificadorDificuldade = 0;
  let danoAdicional = 0;
  let descricaoEfeitoAlternativo = null;
  let efeitoAmbiente = null;

  // 1. PROCESSAMENTO DE AMBIENTES GELADOS
  if (ambienteNorm === "gelado") {
    if (elemento === "gelo") {
      duracaoInfinita = true;
      geloIndefinido = true;
      tempoReduzidoPelaMetade = false;
      efeitoAmbiente = "Gelo criado magicamente dura indefinidamente no frio extremo.";
    } else if (elemento === "fogo") {
      modificadorDificuldade = MODIFICADORES_DIFICULDADE_FOGO_GELADO; // +2 DV
      efeitoAmbiente = `Magias de Fogo sofrem acréscimo de +${MODIFICADORES_DIFICULDADE_FOGO_GELADO} na Dificuldade de conjuração (+2 DV).`;
    }
  }

  // 2. PROCESSAMENTO DE AMBIENTES QUENTES / ÁRIDOS
  else if (ambienteNorm === "quente") {
    if (elemento === "gelo") {
      tempoReduzidoPelaMetade = true;
      duracaoInfinita = false;
      geloIndefinido = false;
      efeitoAmbiente = "Magias e objetos de Gelo duram apenas metade do tempo normal devido ao calor árido.";
    } else if (elemento === "fogo") {
      danoAdicionalFogo = DANO_ADICIONAL_FOGO_QUENTE; // +5 dano
      danoAdicional = DANO_ADICIONAL_FOGO_QUENTE;
      efeitoAmbiente = `Magias de Fogo causam +${DANO_ADICIONAL_FOGO_QUENTE} de dano adicional devido ao calor intenso.`;
    }
  }

  // 3. PROCESSAMENTO DE AMBIENTES SUBAQUÁTICOS
  else if (ambienteNorm === "subaquatico") {
    if (elemento === "fogo") {
      funcionaPadrao = false;
      descricaoEfeitoAlternativo =
        "Não funciona de forma padrão; ferve a água ao redor ou gera nuvens de bolhas ferventes à frente com dano de área local.";
      efeitoAmbiente = descricaoEfeitoAlternativo;
    } else if (elemento === "gelo") {
      flutua = true;
      if (isProfundezasPolares) {
        // Exceção canônica: em profundezas polares, o gelo não sofre redução de duração pela metade
        tempoReduzidoPelaMetade = false;
        efeitoAmbiente = "Gelo em profundezas polares mantém estabilidade térmica e tende a flutuar.";
      } else {
        tempoReduzidoPelaMetade = true;
        efeitoAmbiente = "Magias de Gelo duram metade do tempo normal e tendem a flutuar na água.";
      }
    } else if (elemento === "eletricidade") {
      raio10mTodasCriaturas = true;
      areaDobrada = true;
      descricaoEfeitoAlternativo =
        "Afeta todas as criaturas em um raio de 10 metros ao redor do conjurador ou tem sua área de efeito dobrada.";
      efeitoAmbiente = descricaoEfeitoAlternativo;
    }
  }

  // Cálculos numéricos finais
  const dificuldadeFinal = Math.max(0, dificuldadeOriginal + modificadorDificuldade);
  const danoFinal = danoOriginal + danoAdicional;

  let duracaoFinal = duracaoOriginal;
  if (duracaoInfinita) {
    duracaoFinal = Infinity;
  } else if (tempoReduzidoPelaMetade && duracaoOriginal !== null && duracaoOriginal !== undefined) {
    duracaoFinal = Math.floor(duracaoOriginal / 2);
  }

  // Construção do objeto de retorno estruturado
  const resultado = {
    // Metadados do ambiente e elemento
    ambiente: ambienteNorm,
    tipoAmbiente: String(tipoAmbiente),
    elemento,
    isProfundezasPolares,

    // Flags canônicas exigidas
    duracaoInfinita,
    geloIndefinido,
    tempoReduzidoPelaMetade,
    danoAdicionalFogo,
    funcionaPadrao,
    flutua,
    raio10mTodasCriaturas,
    areaDobrada,

    // Dificuldade
    modificadorDificuldade,
    dificuldadeOriginal,
    dificuldadeFinal,
    dificuldade: dificuldadeFinal,

    // Dano
    danoAdicional,
    danoOriginal,
    danoFinal,
    dano: danoFinal,

    // Duração
    duracaoOriginal,
    duracaoFinal,
    duracao: duracaoFinal,

    // Detalhamento narrativo e descritivo
    descricaoEfeitoAlternativo,
    efeitoAmbiente,
    ferveAgua: elemento === "fogo" && ambienteNorm === "subaquatico",
    bolhasFerventes: elemento === "fogo" && ambienteNorm === "subaquatico",
    raioAfetadoMetros: raio10mTodasCriaturas ? RAIO_ELETRICIDADE_SUBAQUATICO_METROS : null,
  };

  // Se o argumento passado foi um objeto, incorpora dados contextuais do item
  if (typeof magiaOuEfeito === "object" && magiaOuEfeito !== null) {
    resultado.name = magiaOuEfeito.name || magiaOuEfeito.nome;
    resultado.nome = magiaOuEfeito.nome || magiaOuEfeito.name;
    resultado.type = magiaOuEfeito.type;

    if (magiaOuEfeito.system) {
      resultado.system = {
        ...magiaOuEfeito.system,
        dificuldade: dificuldadeFinal,
        dano: danoFinal,
        duracao: duracaoFinal,
        duracaoInfinita,
        geloIndefinido,
        tempoReduzidoPelaMetade,
        danoAdicionalFogo,
        funcionaPadrao,
        flutua,
        raio10mTodasCriaturas,
        areaDobrada,
      };
    }

    // Se solicitado 'mutar', replica modificações diretamente no objeto fonte
    if (opcoes.mutar) {
      if (magiaOuEfeito.system) {
        magiaOuEfeito.system.dificuldade = dificuldadeFinal;
        magiaOuEfeito.system.dano = danoFinal;
        magiaOuEfeito.system.duracao = duracaoFinal;
        magiaOuEfeito.system.duracaoInfinita = duracaoInfinita;
        magiaOuEfeito.system.geloIndefinido = geloIndefinido;
        magiaOuEfeito.system.tempoReduzidoPelaMetade = tempoReduzidoPelaMetade;
        magiaOuEfeito.system.danoAdicionalFogo = danoAdicionalFogo;
        magiaOuEfeito.system.funcionaPadrao = funcionaPadrao;
        magiaOuEfeito.system.flutua = flutua;
        magiaOuEfeito.system.raio10mTodasCriaturas = raio10mTodasCriaturas;
        magiaOuEfeito.system.areaDobrada = areaDobrada;
      } else {
        magiaOuEfeito.dificuldade = dificuldadeFinal;
        magiaOuEfeito.dano = danoFinal;
        magiaOuEfeito.duracao = duracaoFinal;
        magiaOuEfeito.duracaoInfinita = duracaoInfinita;
        magiaOuEfeito.geloIndefinido = geloIndefinido;
        magiaOuEfeito.tempoReduzidoPelaMetade = tempoReduzidoPelaMetade;
        magiaOuEfeito.danoAdicionalFogo = danoAdicionalFogo;
        magiaOuEfeito.funcionaPadrao = funcionaPadrao;
        magiaOuEfeito.flutua = flutua;
        magiaOuEfeito.raio10mTodasCriaturas = raio10mTodasCriaturas;
        magiaOuEfeito.areaDobrada = areaDobrada;
      }
    }
  }

  return resultado;
}

/**
 * Helper complementar que calcula o efeito de uma magia no ambiente climático especificado.
 *
 * @param {object|string} magia Objeto de magia ou descritor de elemento
 * @param {string|object} ambiente Tipo de ambiente climático
 * @param {object} [opcoes={}] Opções adicionais de contexto
 * @returns {object} Dados dos efeitos ambientais e modificadores aplicados
 */
export function calcularEfeitoMagiaNoAmbiente(magia, ambiente, opcoes = {}) {
  return aplicarModificadoresAmbiente(magia, ambiente, opcoes);
}

/**
 * Verifica se um ambiente é classificado como Gelado/Frio.
 * @param {string|object} ambiente
 * @returns {boolean}
 */
export function isAmbienteGelado(ambiente) {
  return normalizarAmbiente(ambiente) === "gelado";
}

/**
 * Verifica se um ambiente é classificado como Quente/Árido.
 * @param {string|object} ambiente
 * @returns {boolean}
 */
export function isAmbienteQuente(ambiente) {
  return normalizarAmbiente(ambiente) === "quente";
}

/**
 * Verifica se um ambiente é classificado como Subaquático.
 * @param {string|object} ambiente
 * @returns {boolean}
 */
export function isAmbienteSubaquatico(ambiente) {
  return normalizarAmbiente(ambiente) === "subaquatico";
}
