/**
 * Módulo de Regras Canônicas de Alquimia, Preparo de Poções e Extratos.
 * Mighty Blade 3ª Edição (Guia do Herói, Cap. IV, pág. 74–82).
 *
 * Implementa as regras canônicas:
 * - Subtítulo 16.1: Conhecimento de Receitas e Habilidades (conheceReceita)
 *   * Herbalismo: Poções básicas comuns e incomuns (exceto raras/muito raras/ilegais). Não realiza Destilação.
 *   * Alquimia Básica: Conhece todas as poções básicas e libera o processo de Destilação.
 *   * Alquimia Avançada: Conhece todas as receitas (básicas e avançadas, qualquer raridade).
 * - Subtítulo 16.2: Processamento Sequencial de Etapas Alquímicas (processarEtapaAlquimia)
 *   * Etapas: Infusão, Maceração, Tintura, Tisana, Fermentação, Destilação.
 *   * Falha intermediária: Descarta apenas ingredientes usados até aquela etapa; posteriores permanecem no inventário.
 *   * Sucesso crítico (dois dados 6 ou sucesso decisivo): Gera +1 dose adicional cumulativa da poção.
 *   * Falha crítica (dois dados 1 ou falha desastrosa): Gera obrigatoriamente uma Poção do Caos (tabela 2d6).
 * - Subtítulo 16.3: Tabela Canônica 2d6 de Poção do Caos (sortearPocaoDoCaos, TABELA_POCAO_DO_CAOS)
 */

/* ------------------------------------------------------------------------- */
/* CONSTANTES E TABELAS CANÔNICAS                                            */
/* ------------------------------------------------------------------------- */

/** Etapas sequenciais canônicas de processos alquímicos */
export const ETAPAS_ALQUIMIA = [
  "Infusão",
  "Maceração",
  "Tintura",
  "Tisana",
  "Fermentação",
  "Destilação",
];

/** Slugs de habilidades que liberam conhecimento alquímico */
export const HABILIDADE_HERBALISMO = "herbalismo";
export const HABILIDADE_ALQUIMIA_BASICA = "alquimia-basica";
export const HABILIDADE_ALQUIMIA_AVANCADA = "alquimia-avancada";

/** Raridades que o Herbalismo é capaz de preparar em poções básicas */
export const RARIDADES_PERMITIDAS_HERBALISMO = new Set(["comum", "incomum"]);

/** Raridades proibidas para quem possui apenas Herbalismo */
export const RARIDADES_PROIBIDAS_HERBALISMO = new Set([
  "raro",
  "muito raro",
  "muito-raro",
  "rarissimo",
  "raríssimo",
  "ilegal",
]);

/**
 * Tabela Oficial 2d6 de Efeitos Caóticos de Poções (Guia do Herói, pág. 76).
 * Efeitos permanentes que só podem ser revertidos com um Antídoto Universal.
 */
export const TABELA_POCAO_DO_CAOS = {
  2: {
    resultado: 2,
    efeito: "Dedos de Tentáculos",
    descricao:
      "Seus dedos se tornam tentáculos e todas as tarefas que exijam o uso das mãos são feitos como se você fosse Inapto.",
    inaptoMaos: true,
  },
  3: {
    resultado: 3,
    efeito: "Atributo Reduzido",
    descricao: "Um de seus Atributos é reduzido em -2.",
    penalidadeAtributo: -2,
  },
  4: {
    resultado: 4,
    efeito: "Fala Animal",
    descricao:
      "Você não consegue mais falar, apenas produzir o som de um animal aleatório.",
    impedeFala: true,
  },
  5: {
    resultado: 5,
    efeito: "Alopecia Total",
    descricao: "Você perde todos os pelos do corpo.",
    perdaPelos: true,
  },
  6: {
    resultado: 6,
    efeito: "Corpo Peludo Colorido",
    descricao:
      "Seu corpo inteiro fica coberto de pelos de uma cor aleatória.",
    pelosColoridos: true,
  },
  7: {
    resultado: 7,
    efeito: "Olhos de Animal",
    descricao:
      "Seus olhos adquirem a aparência dos olhos de um animal aleatório.",
    olhosAnimal: true,
  },
  8: {
    resultado: 8,
    efeito: "Pelos Coloridos",
    descricao: "Todos os seus pelos mudam para uma cor aleatória.",
    pelosColoridos: true,
  },
  9: {
    resultado: 9,
    efeito: "Surdez Vegetal",
    descricao:
      "Você fica surdo por conta de plantas que começam a brotar de seus ouvidos.",
    surdo: true,
  },
  10: {
    resultado: 10,
    efeito: "Cauda Animal",
    descricao: "Você desenvolve uma cauda de um animal aleatório.",
    caudaAnimal: true,
  },
  11: {
    resultado: 11,
    efeito: "Pele Colorida",
    descricao: "A cor da sua pele muda para uma cor aleatória.",
    peleColorida: true,
  },
  12: {
    resultado: 12,
    efeito: "Metamorfose em Pequeno Animal",
    descricao: "Você se transforma em um pequeno animal aleatório.",
    metamorfose: true,
  },
};

/** Informações detalhadas dos 6 processos de refino alquímico (Guia do Herói pág. 74) */
export const PROCESSOS_ALQUIMICOS_INFO = {
  Infusao: {
    nome: "Infusão",
    descricao: "Imergir ingredientes em água fervente por cerca de meia hora e coar.",
    dificuldadePadrao: 10,
    tempoEstimado: "30 minutos",
  },
  Maceracao: {
    nome: "Maceração",
    descricao: "Moer ingredientes, misturar à água e deixar descansar por cerca de uma hora.",
    dificuldadePadrao: 12,
    tempoEstimado: "1 hora",
  },
  Tintura: {
    nome: "Tintura",
    descricao: "Misturar em álcool etílico, ferver até evaporar, misturar com água fervente e coar.",
    dificuldadePadrao: 13,
    tempoEstimado: "2 horas",
  },
  Tisana: {
    nome: "Tisana",
    descricao: "Adicionar em água, ferver em recipiente tampado por 1h e descansar por 2h.",
    dificuldadePadrao: 10,
    tempoEstimado: "3 horas",
  },
  Fermentacao: {
    nome: "Fermentação",
    descricao: "Macerar, ferver e deixar descansar por no mínimo 3 dias.",
    dificuldadePadrao: 12,
    tempoEstimado: "3 dias",
  },
  Destilacao: {
    nome: "Destilação",
    descricao: "Separar álcool etílico ou vapores sutis via condensação em alambique por ~6 horas.",
    dificuldadePadrao: 15,
    tempoEstimado: "6 horas",
  },
};

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
 * Extrai e normaliza um conjunto de slugs das habilidades de um ator ou coleção.
 * @param {object|string[]|Set<string>} habilidadesActor
 * @returns {Set<string>}
 */
export function extrairHabilidadesAlquimia(habilidadesActor) {
  const habilidades = new Set();
  if (!habilidadesActor) return habilidades;

  let lista = [];
  if (Array.isArray(habilidadesActor)) {
    lista = habilidadesActor;
  } else if (habilidadesActor instanceof Set) {
    lista = Array.from(habilidadesActor);
  } else if (typeof habilidadesActor === "object") {
    if (Array.isArray(habilidadesActor.items)) {
      lista = habilidadesActor.items;
    } else if (typeof habilidadesActor.items?.values === "function") {
      lista = Array.from(habilidadesActor.items.values());
    } else {
      lista = [habilidadesActor];
    }
  } else if (typeof habilidadesActor === "string") {
    lista = [habilidadesActor];
  }

  for (const item of lista) {
    if (typeof item === "string") {
      habilidades.add(normalizarTexto(item).replace(/\s+/g, "-"));
    } else if (item && typeof item === "object") {
      const nome = item.name || item.nome || "";
      const slug = item.flags?.["mighty-blade"]?.slug || item.slug || "";
      if (nome) habilidades.add(normalizarTexto(nome).replace(/\s+/g, "-"));
      if (slug) habilidades.add(normalizarTexto(slug).replace(/\s+/g, "-"));
    }
  }

  return habilidades;
}

/**
 * Normaliza os atributos estruturais de uma receita alquímica.
 * @param {object} receita
 * @returns {{
 *   tipo: "basica"|"avancada",
 *   raridade: string,
 *   exigeDestilacao: boolean,
 *   processos: string[],
 *   raw: object
 * }}
 */
export function normalizarReceita(receita) {
  if (!receita) {
    return {
      tipo: "basica",
      raridade: "comum",
      exigeDestilacao: false,
      processos: [],
      raw: {},
    };
  }

  const obj = receita.receita || receita.system?.receita || receita;

  // 1. Tipo: básica vs avançada
  let tipo = "basica";
  const tipoStr = normalizarTexto(receita.tipo || obj.tipo || "");
  const catStr = normalizarTexto(receita.categoria || obj.categoria || "");
  const nivelStr = normalizarTexto(receita.nivel || obj.nivel || "");

  if (
    receita.avancada === true ||
    obj.avancada === true ||
    tipoStr.includes("avancad") ||
    catStr.includes("avancad") ||
    nivelStr.includes("avancad")
  ) {
    tipo = "avancada";
  }

  // 2. Raridade
  const raridadeBruta =
    receita.raridade ||
    obj.raridade ||
    receita.system?.raridade ||
    obj.system?.raridade ||
    "comum";
  const raridade = normalizarTexto(raridadeBruta);

  // 3. Processos e verificação de Destilação
  let exigeDestilacao = false;
  if (receita.exigeDestilacao || obj.exigeDestilacao) {
    exigeDestilacao = true;
  }

  const processos = [];
  if (obj.processoPrincipal) processos.push(obj.processoPrincipal);
  if (obj.processo) processos.push(obj.processo);
  if (Array.isArray(obj.processos)) processos.push(...obj.processos);
  if (Array.isArray(obj.etapas)) {
    for (const et of obj.etapas) {
      if (typeof et === "string") processos.push(et);
      else if (et?.processo) processos.push(et.processo);
      else if (et?.nome) processos.push(et.nome);
    }
  }
  if (Array.isArray(obj.ingredientes)) {
    for (const ing of obj.ingredientes) {
      if (ing?.processo) processos.push(ing.processo);
    }
  }

  for (const proc of processos) {
    if (normalizarTexto(proc).includes("destila")) {
      exigeDestilacao = true;
      break;
    }
  }

  return {
    tipo,
    raridade,
    exigeDestilacao,
    processos,
    raw: obj,
  };
}

/* ------------------------------------------------------------------------- */
/* 1. CONHECIMENTO DE RECEITAS (SUBTÍTULO 16.1)                              */
/* ------------------------------------------------------------------------- */

/**
 * Determina se o personagem conhece e é apto a preparar uma receita de poção.
 *
 * Regras Canônicas (Guia do Herói pág. 74, 80-82):
 * - Herbalismo: Conhece poções básicas comuns e incomuns (exceto raras/muito raras/ilegais).
 *   Herbalismo NÃO domina o processo de Destilação.
 * - Alquimia Básica: Conhece todas as poções básicas e libera o processo de Destilação.
 * - Alquimia Avançada: Conhece todas as receitas (básicas e avançadas, qualquer raridade).
 *
 * @param {object|string[]|Set<string>} habilidadesActor Ator ou lista de habilidades
 * @param {object} receita Definição da poção ou receita
 * @returns {boolean} True se o personagem conhece e tem capacitação para a receita
 */
export function conheceReceita(habilidadesActor, receita) {
  const habilidades = extrairHabilidadesAlquimia(habilidadesActor);

  const temAvancada =
    habilidades.has(HABILIDADE_ALQUIMIA_AVANCADA) ||
    Array.from(habilidades).some((h) => h.includes("alquimia-avancad"));

  // 1. Alquimia Avançada: Conhece absolutamente todas as receitas (básicas e avançadas)
  if (temAvancada) {
    return true;
  }

  const { tipo, raridade, exigeDestilacao } = normalizarReceita(receita);

  const temBasica =
    habilidades.has(HABILIDADE_ALQUIMIA_BASICA) ||
    Array.from(habilidades).some((h) => h.includes("alquimia-basic"));

  // 2. Alquimia Básica: Conhece todas as poções básicas e libera o processo de Destilação
  if (temBasica) {
    if (tipo === "avancada") {
      return false; // Alquimia Básica não conhece poções avançadas
    }
    // Conhece todas as poções básicas, incluindo raras e que utilizem Destilação
    return true;
  }

  const temHerbalismo =
    habilidades.has(HABILIDADE_HERBALISMO) ||
    Array.from(habilidades).some((h) => h.includes("herbalis"));

  // 3. Herbalismo: Conhece apenas poções básicas comuns e incomuns (exceto raras/muito raras)
  // e NÃO domina o processo de Destilação
  if (temHerbalismo) {
    if (tipo === "avancada") {
      return false;
    }
    if (exigeDestilacao) {
      return false; // Herbalismo não realiza Destilação
    }
    if (RARIDADES_PERMITIDAS_HERBALISMO.has(raridade)) {
      return true;
    }
    return false; // Raras, muito raras ou ilegais são proibidas
  }

  // 4. Sem habilidades de alquimia/herbalismo
  return false;
}

/* ------------------------------------------------------------------------- */
/* 2. TABELA E SORTEIO DE POÇÃO DO CAOS (SUBTÍTULO 16.3)                     */
/* ------------------------------------------------------------------------- */

/**
 * Sorteia ou calcula o efeito oficial de uma Poção do Caos a partir de uma rolagem 2d6.
 *
 * Tabela Oficial (Guia do Herói, pág. 76):
 * - Resultado 2 a 12 com efeitos caóticos permanentes (reversíveis apenas com Antídoto Universal).
 *
 * @param {number} [rolagem2d6] Valor da rolagem 2d6 (2 a 12). Se omitido, rola 2d6 aleatoriamente.
 * @returns {{
 *   nome: string,
 *   rolagem: number,
 *   efeito: string,
 *   descricao: string,
 *   permanente: boolean,
 *   reversao: string,
 *   detalhes: object
 * }}
 */
export function sortearPocaoDoCaos(rolagem2d6) {
  let resultado = rolagem2d6;

  if (typeof resultado !== "number" || isNaN(resultado)) {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    resultado = d1 + d2;
  } else {
    // Clamping para intervalo canônico 2 a 12
    resultado = Math.max(2, Math.min(12, Math.floor(resultado)));
  }

  const entrada = TABELA_POCAO_DO_CAOS[resultado] || TABELA_POCAO_DO_CAOS[7];

  return {
    nome: "Poção do Caos",
    rolagem: resultado,
    efeito: entrada.efeito,
    descricao: entrada.descricao,
    permanente: true,
    reversao: "Antídoto Universal",
    detalhes: { ...entrada },
  };
}

/* ------------------------------------------------------------------------- */
/* 3. PROCESSAMENTO DE ETAPAS ALQUÍMICAS (SUBTÍTULO 16.2)                   */
/* ------------------------------------------------------------------------- */

/**
 * Processa a execução de uma etapa sequencial de preparo de poção.
 *
 * Regras Canônicas (Guia do Herói, pág. 74-76):
 * - Etapas sequenciais: Infusão, Maceração, Tintura, Tisana, Fermentação, Destilação.
 * - Falha intermediária: descarta apenas os ingredientes usados até aquela etapa;
 *   os ingredientes reservados para etapas posteriores permanecem no inventário.
 * - Sucesso crítico (dois dados 6 ou sucesso decisivo): gera +1 dose adicional da poção
 *   (cumulativo ao longo de processos bem-sucedidos).
 * - Falha crítica (dois dados 1 ou falha desastrosa): gera obrigatoriamente uma Poção do Caos
 *   (sorteada na tabela 2d6).
 *
 * @param {object|string} etapa Informações da etapa atual (processo, dificuldade, etapaFinal, dosesAcumuladas)
 * @param {object|number|boolean} resultadoTeste Resultado do teste de Inteligência/rolagem
 * @param {any[]} ingredientesUsados Ingredientes consumidos até esta etapa inclusive
 * @param {any[]} ingredientesRestantes Ingredientes reservados para etapas posteriores
 * @param {object} [opcoes] Configurações opcionais (rolagemCaos, nomePocao, etapaFinal)
 * @returns {{
 *   sucesso: boolean,
 *   sucessoCritico: boolean,
 *   falhaCritica: boolean,
 *   etapaConcluida: boolean,
 *   etapaFinal: boolean,
 *   dosesProduzidas: number,
 *   dosesAcumuladas: number,
 *   pocaoDoCaos: object|null,
 *   pocaoFinalizada: object|null,
 *   ingredientesDescartados: any[],
 *   ingredientesPreservados: any[],
 *   proximaEtapa: string|null,
 *   mensagem: string
 * }}
 */
export function processarEtapaAlquimia(
  etapa,
  resultadoTeste,
  ingredientesUsados = [],
  ingredientesRestantes = [],
  opcoes = {}
)
{
  const etapaObj = typeof etapa === "string" ? { processo: etapa } : (etapa || {});
  const nomeProcesso = etapaObj.processo || etapaObj.nome || "Alquimia";
  const dificuldade = etapaObj.dificuldade ?? opcoes.dificuldade ?? 10;

  // Analisa resultado do teste e rolagens críticas
  let total = 0;
  let sucesso = false;
  let sucessoCritico = false;
  let falhaCritica = false;

  if (typeof resultadoTeste === "boolean") {
    sucesso = resultadoTeste;
  } else if (typeof resultadoTeste === "number") {
    total = resultadoTeste;
    sucesso = total >= dificuldade;
  } else if (resultadoTeste && typeof resultadoTeste === "object") {
    total = resultadoTeste.total ?? 0;

    // Detecção de falha crítica (dois 1s ou flag explícita)
    const dados = Array.isArray(resultadoTeste.dados)
      ? resultadoTeste.dados
      : Array.isArray(resultadoTeste.dice)
      ? resultadoTeste.dice
      : [];

    const qtdUm = dados.filter((d) => d === 1).length;
    const qtdSeis = dados.filter((d) => d === 6).length;

    falhaCritica =
      resultadoTeste.falhaCritica === true ||
      resultadoTeste.desastre === true ||
      qtdUm >= 2;

    sucessoCritico =
      resultadoTeste.sucessoCritico === true ||
      resultadoTeste.decisivo === true ||
      qtdSeis >= 2;

    if (falhaCritica) {
      sucesso = false;
    } else if (sucessoCritico) {
      sucesso = true;
    } else if (typeof resultadoTeste.sucesso === "boolean") {
      sucesso = resultadoTeste.sucesso;
    } else {
      sucesso = total >= dificuldade;
    }
  }

  // Clona listas de ingredientes para isolamento de estado
  const descartados = Array.isArray(ingredientesUsados) ? [...ingredientesUsados] : [];
  const preservados = Array.isArray(ingredientesRestantes) ? [...ingredientesRestantes] : [];

  // Determina se é a etapa final da cadeia de preparo
  const etapaFinal =
    opcoes.etapaFinal ??
    etapaObj.etapaFinal ??
    etapaObj.isFinal ??
    preservados.length === 0;

  // Doses extras acumuladas de sucessos críticos anteriores
  const dosesAcumuladasAnteriores =
    etapaObj.dosesAcumuladas ??
    etapaObj.dosesBonus ??
    opcoes.dosesAcumuladas ??
    0;

  /* ----------------------------------------------------------------------- */
  /* CASO A: FALHA CRÍTICA (DOIS 1s) -> GERA POÇÃO DO CAOS                   */
  /* ----------------------------------------------------------------------- */
  if (falhaCritica) {
    const rolagemCaos = opcoes.rolagemCaos ?? resultadoTeste?.rolagemCaos;
    const pocaoCaos = sortearPocaoDoCaos(rolagemCaos);

    return {
      sucesso: false,
      sucessoCritico: false,
      falhaCritica: true,
      etapaConcluida: false,
      etapaFinal,
      dosesProduzidas: 1, // Gera obrigatoriamente 1 dose de Poção do Caos
      dosesAcumuladas: 0,
      pocaoDoCaos: pocaoCaos,
      pocaoFinalizada: null,
      ingredientesDescartados: descartados,
      ingredientesPreservados: preservados,
      proximaEtapa: null,
      mensagem: `Falha crítica durante ${nomeProcesso}! A mistura desandou perigosamente e gerou uma Poção do Caos: ${pocaoCaos.efeito} (${pocaoCaos.descricao}).`,
    };
  }

  /* ----------------------------------------------------------------------- */
  /* CASO B: FALHA COMUM -> INGREDIENTES POSTERIORES PRESERVADOS             */
  /* ----------------------------------------------------------------------- */
  if (!sucesso) {
    return {
      sucesso: false,
      sucessoCritico: false,
      falhaCritica: false,
      etapaConcluida: false,
      etapaFinal,
      dosesProduzidas: 0,
      dosesAcumuladas: 0,
      pocaoDoCaos: null,
      pocaoFinalizada: null,
      ingredientesDescartados: descartados,
      ingredientesPreservados: preservados,
      proximaEtapa: null,
      mensagem: `Falha durante ${nomeProcesso}. Apenas os ingredientes utilizados até esta etapa foram descartados; ingredientes das etapas posteriores permanecem intactos.`,
    };
  }

  /* ----------------------------------------------------------------------- */
  /* CASO C: SUCESSO (COMUM OU CRÍTICO)                                      */
  /* ----------------------------------------------------------------------- */
  const bonusCriticoDestaEtapa = sucessoCritico ? 1 : 0;
  const dosesAcumuladasTotal = dosesAcumuladasAnteriores + bonusCriticoDestaEtapa;

  if (etapaFinal) {
    // Na etapa final, a quantidade total de poções é 1 dose base + 1 por sucesso crítico
    const dosesProduzidas = 1 + dosesAcumuladasTotal;
    const nomePocao =
      etapaObj.nomePocao ||
      opcoes.nomePocao ||
      opcoes.receita?.nome ||
      "Poção Alquímica";

    const pocaoFinalizada = {
      concluida: true,
      nome: nomePocao,
      doses: dosesProduzidas,
      sucessoCritico: dosesAcumuladasTotal > 0,
    };

    return {
      sucesso: true,
      sucessoCritico,
      falhaCritica: false,
      etapaConcluida: true,
      etapaFinal: true,
      dosesProduzidas,
      dosesAcumuladas: dosesAcumuladasTotal,
      pocaoDoCaos: null,
      pocaoFinalizada,
      ingredientesDescartados: descartados,
      ingredientesPreservados: preservados,
      proximaEtapa: null,
      mensagem: `Preparo concluído com sucesso! Foram produzidas ${dosesProduzidas} dose(s) de ${nomePocao}${
        dosesAcumuladasTotal > 0 ? ` (+${dosesAcumuladasTotal} dose extra por sucesso crítico)` : ""
      }.`,
    };
  }

  // Etapa intermediária bem-sucedida: avança para a próxima etapa preservando bônus
  const proximaEtapa =
    etapaObj.proximaEtapa ||
    opcoes.proximaEtapa ||
    "Próximo Processo Alquímico";

  return {
    sucesso: true,
    sucessoCritico,
    falhaCritica: false,
    etapaConcluida: true,
    etapaFinal: false,
    dosesProduzidas: 0,
    dosesAcumuladas: dosesAcumuladasTotal,
    pocaoDoCaos: null,
    pocaoFinalizada: null,
    ingredientesDescartados: descartados,
    ingredientesPreservados: preservados,
    proximaEtapa,
    mensagem: `Etapa de ${nomeProcesso} concluída com sucesso${
      sucessoCritico ? " (Sucesso Crítico: +1 dose adicional acumulada)" : ""
    }. Avance para a próxima etapa.`,
  };
}
