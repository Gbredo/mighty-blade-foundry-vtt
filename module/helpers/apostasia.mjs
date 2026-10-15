/**
 * Módulo de Regras Canônicas para Apostasia, Abandono de Votos e Código Sagrado (Mighty Blade 3e).
 *
 * Subtítulo 19: Sistema de Apostasia, Abandono de Votos e Código Sagrado
 *
 * Consolida as diretrizes oficiais de Mighty Blade 3ª Edição:
 * - Sacerdotes, Dracomantes ou Paladinos que abandonam Dogmas, Códigos Sagrados ou Patronos
 *   perdem imediatamente a capacidade de conjurar Punições, Magias Místicas ou Mitos associados.
 * - Marcação inequívoca do personagem como apóstata (`apostata: true`, `votoAbandonado: true`).
 * - Pré-requisito para Habilidades de Apóstata: "Ter abandonado um Voto".
 * - Canalização da perda de fé como Resistência Pura (+2 RD ou Resistência Mágica).
 * - Incompatibilidade Religiosa-Profana estrita: Bloqueia a coexistência de Pacto Infernal com
 *   Dogma ou Conhecimento Místico (salvo se tiver ocorrido renúncia/apostasia prévia).
 */

/** Classes religiosas ou místico-devotas canônicas sujeitas à perda de dons divinos */
export const CLASSES_RELIGIOSAS_CANONICAS = Object.freeze([
  "sacerdote",
  "dracomante",
  "paladino",
]);

/** Tipos de canalização disponíveis para apóstatas */
export const TIPOS_CANALIZACAO_APOSTATA = Object.freeze({
  RD: "rd",
  RESISTENCIA_MAGICA: "resistenciaMagica",
});

/** Bônus concedido pela canalização da perda de fé */
export const BONUS_CANALIZACAO_RESISTENCIA = 2;

/**
 * Normaliza string para comparações canônicas (sem acentos, minúsculo, sem espaços extras).
 * @param {string} str
 * @returns {string}
 */
export function norm(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Verifica se um item é classificado como uma Punição (ex.: Punição da Execução, Punição do Silêncio).
 * @param {object} item
 * @returns {boolean}
 */
export function isItemPunicao(item) {
  if (!item) return false;
  const n = norm(item.name || item.nome || "");
  const tipo = norm(item.type || item.system?.tipo || item.system?.categoria || "");
  const subtipo = norm(item.system?.subtipo || "");
  return (
    n.startsWith("punicao") ||
    n.includes("punicao") ||
    tipo === "punicao" ||
    subtipo === "punicao"
  );
}

/**
 * Verifica se um item é uma Magia Mística ou Divina associada a patrono/dogma.
 * @param {object} item
 * @returns {boolean}
 */
export function isItemMagiaMistica(item) {
  if (!item) return false;
  const n = norm(item.name || item.nome || "");
  const type = norm(item.type || "");
  const escola = norm(item.system?.escola || "");
  const subtipo = norm(item.system?.subtipo || "");
  const categoria = norm(item.system?.categoria || "");
  const tipo = norm(item.system?.tipo || "");

  const isMagia = type === "magia" || type === "spell" || tipo === "magia";
  const isMisticaOuDivina =
    escola === "mistica" ||
    escola === "divina" ||
    escola === "sagrada" ||
    subtipo === "mistica" ||
    subtipo === "divina" ||
    categoria === "mistica" ||
    categoria === "divina" ||
    tipo === "mistica" ||
    n.includes("mistica") ||
    n.includes("divina");

  return isMagia && isMisticaOuDivina;
}

/**
 * Verifica se um item é classificado como Mito (ex.: Mitos Dracônicos do Dracomante).
 * @param {object} item
 * @returns {boolean}
 */
export function isItemMito(item) {
  if (!item) return false;
  const n = norm(item.name || item.nome || "");
  const type = norm(item.type || "");
  const subtipo = norm(item.system?.subtipo || "");
  const categoria = norm(item.system?.categoria || "");
  const tipo = norm(item.system?.tipo || "");

  return (
    n.startsWith("mito") ||
    n.includes("mito") ||
    type === "mito" ||
    subtipo === "mito" ||
    categoria === "mito" ||
    tipo === "mito"
  );
}

/**
 * Verifica se um item representa um Dogma, Código Sagrado ou Voto formal.
 * @param {object} item
 * @returns {boolean}
 */
export function isItemDogmaOuCodigoOuVoto(item) {
  if (!item) return false;
  const n = norm(item.name || item.nome || "");
  const tipo = norm(item.type || item.system?.tipo || "");
  return (
    n.startsWith("dogma") ||
    n.includes("dogma") ||
    n.startsWith("codigo da") ||
    n.startsWith("codigo do") ||
    n.startsWith("codigo de") ||
    n.includes("codigo sagrado") ||
    n.includes("voto") ||
    tipo === "dogma" ||
    tipo === "voto"
  );
}

/**
 * Verifica se um item está associado ao patrono ou divindade informada.
 * Se nenhum patrono específico for passado, qualquer item sagrado é considerado associado.
 * @param {object} item
 * @param {string} [patronoNome=""]
 * @returns {boolean}
 */
export function isItemAssociadoPatrono(item, patronoNome = "") {
  if (!item) return false;
  const pNorm = norm(patronoNome);
  if (!pNorm) return true;

  const n = norm(item.name || item.nome || "");
  const desc = norm(item.system?.description?.value || item.system?.description || item.description || "");
  const patronoItem = norm(item.system?.patrono || item.patrono || item.flags?.["mighty-blade"]?.patrono || "");

  return (
    n.includes(pNorm) ||
    desc.includes(pNorm) ||
    patronoItem.includes(pNorm)
  );
}

/**
 * Helper para extrair array de itens do ator (lidando com Arrays ou Collections/Maps).
 * @param {object} actor
 * @returns {object[]}
 */
function getItensAtor(actor) {
  if (!actor || !actor.items) return [];
  if (Array.isArray(actor.items)) return actor.items;
  if (typeof actor.items.values === "function") return Array.from(actor.items.values());
  return [];
}

/**
 * Processa a apostasia e abandono formal de Votos, Dogmas ou Código Sagrado de um personagem.
 *
 * Regras Canônicas:
 * - Sacerdotes, Dracomantes ou Paladinos que abandonam Dogmas/Códigos perdem imediatamente
 *   a capacidade de conjurar Punições, Magias Místicas ou Mitos associados ao patrono.
 * - Marca o ator como apóstata (`apostata: true`, `votoAbandonado: true`).
 *
 * @param {object} actor Instância ou objeto do Ator
 * @param {string|object} patronoOuVoto Nome da divindade/patrono ou voto/código abandonado
 * @param {object} [opcoes={}] Opções contextuais ({ removerItens: boolean, revogarTodos: boolean })
 * @returns {{
 *   sucesso: boolean,
 *   apostata: boolean,
 *   votoAbandonado: boolean,
 *   patronoOuVoto: string,
 *   habilidadesRevogadas: string[],
 *   itensRevogados: object[],
 *   detalhes: object
 * }}
 */
export function processarApostasia(actor, patronoOuVoto, opcoes = {}) {
  if (!actor || !actor.system) {
    throw new Error("Ator inválido para processamento de apostasia.");
  }

  const nomePatronoOuVoto = typeof patronoOuVoto === "object"
    ? String(patronoOuVoto?.name || patronoOuVoto?.nome || "")
    : String(patronoOuVoto || "");

  const pNorm = norm(nomePatronoOuVoto);

  // 1. Marcação no modelo de dados do personagem
  actor.system.apostata = true;
  actor.system.votoAbandonado = true;

  actor.system.detalhesApostasia = {
    apostata: true,
    votoAbandonado: true,
    patronoOuVoto: nomePatronoOuVoto,
    dataApostasia: Date.now(),
    habilidadesRevogadas: [],
  };

  // Se houver flags do Foundry VTT
  if (typeof actor.setFlag === "function") {
    actor.setFlag("mighty-blade", "apostata", true);
    actor.setFlag("mighty-blade", "votoAbandonado", true);
    actor.setFlag("mighty-blade", "detalhesApostasia", actor.system.detalhesApostasia);
  }

  const itens = getItensAtor(actor);
  const classeAtor = norm(actor.system.details?.classe || "");
  const isClasseReligiosa =
    CLASSES_RELIGIOSAS_CANONICAS.includes(classeAtor) ||
    norm(actor.system.details?.aprendiz || "").includes("sacerdote") ||
    itens.some((i) => isItemDogmaOuCodigoOuVoto(i));

  const habilidadesRevogadas = [];
  const itensRevogados = [];
  const idsParaRemover = [];

  for (const item of itens) {
    let deveRevogar = false;
    let motivo = "";

    const ePunicao = isItemPunicao(item);
    const eMagiaMistica = isItemMagiaMistica(item);
    const eMito = isItemMito(item);
    const eDogmaOuVoto = isItemDogmaOuCodigoOuVoto(item);

    // Se o item for o próprio voto, dogma ou código abandonado
    if (eDogmaOuVoto) {
      if (!pNorm || norm(item.name || item.nome).includes(pNorm) || opcoes.revogarTodos || isClasseReligiosa) {
        deveRevogar = true;
        motivo = "Apostasia: Voto, Dogma ou Código Sagrado formalmente abandonado.";
      }
    }

    // Punições: Sacerdotes e Paladinos perdem imediatamente
    if (ePunicao) {
      if (isClasseReligiosa || isItemAssociadoPatrono(item, pNorm) || opcoes.revogarTodos) {
        deveRevogar = true;
        motivo = "Apostasia: Perda da graça e investidura para conjurar Punições sagradas.";
      }
    }

    // Magias Místicas associadas ao patrono/dogma
    if (eMagiaMistica) {
      if (isClasseReligiosa || isItemAssociadoPatrono(item, pNorm) || opcoes.revogarTodos) {
        deveRevogar = true;
        motivo = "Apostasia: Ruptura da conexão com o patrono revogou Magias Místicas.";
      }
    }

    // Mitos: Dracomantes perdem a capacidade de conjuração de mitos dracônicos
    if (eMito) {
      if (classeAtor === "dracomante" || isItemAssociadoPatrono(item, pNorm) || opcoes.revogarTodos) {
        deveRevogar = true;
        motivo = "Apostasia: Perda da comunhão mística dracônica para invocar Mitos.";
      }
    }

    if (deveRevogar) {
      item.system = item.system || {};
      item.system.revogado = true;
      item.system.bloqueado = true;
      item.system.capacidadeConjuracao = false;
      item.system.inaptoConjuracao = true;
      item.system.abandonado = true;
      item.system.motivoBloqueio = motivo;

      const nomeItem = item.name || item.nome || "Habilidade Sem Nome";
      habilidadesRevogadas.push(nomeItem);
      itensRevogados.push(item);

      if (opcoes.removerItens) {
        const id = item.id || item._id;
        if (id) idsParaRemover.push(id);
      }
    }
  }

  // Se a opção de remoção estrita for solicitada
  if (opcoes.removerItens && idsParaRemover.length > 0) {
    if (typeof actor.deleteEmbeddedDocuments === "function") {
      actor.deleteEmbeddedDocuments("Item", idsParaRemover);
    } else {
      const idSet = new Set(idsParaRemover);
      actor.items = itens.filter((i) => !idSet.has(i.id || i._id));
    }
  }

  actor.system.detalhesApostasia.habilidadesRevogadas = habilidadesRevogadas;

  if (typeof actor.prepareDerivedData === "function") {
    actor.prepareDerivedData();
  }

  return {
    sucesso: true,
    apostata: true,
    votoAbandonado: true,
    patronoOuVoto: nomePatronoOuVoto,
    habilidadesRevogadas,
    itensRevogados,
    totalRevogados: habilidadesRevogadas.length,
    detalhes: actor.system.detalhesApostasia,
  };
}

/**
 * Valida a elegibilidade para Habilidades de Apóstata e canalização de perda de fé.
 *
 * Regras Canônicas:
 * - Exige como pré-requisito inequívoco "Ter abandonado um Voto".
 * - Permite canalizar a perda de fé como resistência pura (+2 RD ou Resistência Mágica).
 *
 * @param {object} actor Instância ou objeto do Ator
 * @param {object} [opcoes={}] Opções ({ aplicar: boolean, tipo: "rd"|"resistenciaMagica" })
 * @returns {{
 *   permitido: boolean,
 *   valido: boolean,
 *   motivo: string|null,
 *   canalizacaoDisponivel: boolean,
 *   bonusRD: number,
 *   resistenciaMagica: number,
 *   opcoesCanalizacao: string[],
 *   canalizacaoAplicada?: object
 * }}
 */
export function validarHabilidadeApostata(actor, opcoes = {}) {
  if (!actor || !actor.system) {
    return {
      permitido: false,
      valido: false,
      motivo: "Ator inválido para checagem de habilidade apóstata.",
      canalizacaoDisponivel: false,
      bonusRD: 0,
      resistenciaMagica: 0,
      opcoesCanalizacao: [],
    };
  }

  const itens = getItensAtor(actor);

  // Checa se o ator abandonou um voto formalmente
  const temVotoAbandonado = Boolean(
    actor.system.votoAbandonado === true ||
    actor.system.apostata === true ||
    actor.system.detalhesApostasia?.votoAbandonado === true ||
    actor.flags?.["mighty-blade"]?.votoAbandonado === true ||
    actor.flags?.["mighty-blade"]?.apostata === true ||
    itens.some((i) => i.system?.abandonado || norm(i.name).includes("voto abandonado") || norm(i.name).includes("apostasia"))
  );

  if (!temVotoAbandonado) {
    return {
      permitido: false,
      valido: false,
      motivo: "Pré-requisito não atendido: Exige ter abandonado um Voto ou Código Sagrado.",
      canalizacaoDisponivel: false,
      bonusRD: 0,
      resistenciaMagica: 0,
      opcoesCanalizacao: [],
    };
  }

  const resultado = {
    permitido: true,
    valido: true,
    motivo: null,
    canalizacaoDisponivel: true,
    bonusRD: BONUS_CANALIZACAO_RESISTENCIA,
    resistenciaMagica: BONUS_CANALIZACAO_RESISTENCIA,
    opcoesCanalizacao: [TIPOS_CANALIZACAO_APOSTATA.RD, TIPOS_CANALIZACAO_APOSTATA.RESISTENCIA_MAGICA],
  };

  if (opcoes.aplicar) {
    const tipo = opcoes.tipo || TIPOS_CANALIZACAO_APOSTATA.RD;
    resultado.canalizacaoAplicada = aplicarCanalizacaoApostata(actor, tipo);
  }

  return resultado;
}

/**
 * Aplica a canalização da perda de fé do Apóstata como resistência pura (+2 RD ou +2 Resistência Mágica).
 *
 * @param {object} actor Instância do Ator
 * @param {"rd"|"resistenciaMagica"} [tipo="rd"] Tipo de resistência pura escolhida
 * @returns {{
 *   sucesso: boolean,
 *   tipo: string,
 *   valor: number,
 *   rdAnterior?: number,
 *   rdAtual?: number,
 *   resistenciaMagicaAnterior?: number,
 *   resistenciaMagicaAtual?: number,
 *   canalizacao?: string,
 *   motivo?: string
 * }}
 */
export function aplicarCanalizacaoApostata(actor, tipo = "rd") {
  const validacao = validarHabilidadeApostata(actor);
  if (!validacao.permitido) {
    return {
      sucesso: false,
      tipo,
      valor: 0,
      motivo: validacao.motivo,
    };
  }

  const tNorm = norm(tipo);

  if (tNorm === "rd" || tNorm === "reducao" || tNorm === "reducaodano") {
    actor.system.defesas = actor.system.defesas || {};
    actor.system.defesas.rd = actor.system.defesas.rd || { value: 0 };

    const rdAnterior = Number(actor.system.defesas.rd.value) || 0;
    const rdAtual = rdAnterior + BONUS_CANALIZACAO_RESISTENCIA;
    actor.system.defesas.rd.value = rdAtual;

    actor.system.canalizacaoApostata = {
      tipo: TIPOS_CANALIZACAO_APOSTATA.RD,
      valor: BONUS_CANALIZACAO_RESISTENCIA,
    };

    if (typeof actor.prepareDerivedData === "function") {
      actor.prepareDerivedData();
    }

    return {
      sucesso: true,
      tipo: TIPOS_CANALIZACAO_APOSTATA.RD,
      valor: BONUS_CANALIZACAO_RESISTENCIA,
      rdAnterior,
      rdAtual,
      canalizacao: "Resistência Pura (+2 RD)",
    };
  }

  if (
    tNorm === "resistenciamagica" ||
    tNorm === "magica" ||
    tNorm === "resistencia_magica" ||
    tNorm === "rm"
  ) {
    const rmAnterior = Number(actor.system.resistenciaMagica) || 0;
    const rmAtual = rmAnterior + BONUS_CANALIZACAO_RESISTENCIA;
    actor.system.resistenciaMagica = rmAtual;

    actor.system.canalizacaoApostata = {
      tipo: TIPOS_CANALIZACAO_APOSTATA.RESISTENCIA_MAGICA,
      valor: BONUS_CANALIZACAO_RESISTENCIA,
    };

    if (typeof actor.prepareDerivedData === "function") {
      actor.prepareDerivedData();
    }

    return {
      sucesso: true,
      tipo: TIPOS_CANALIZACAO_APOSTATA.RESISTENCIA_MAGICA,
      valor: BONUS_CANALIZACAO_RESISTENCIA,
      resistenciaMagicaAnterior: rmAnterior,
      resistenciaMagicaAtual: rmAtual,
      canalizacao: "Resistência Mágica (+2)",
    };
  }

  return {
    sucesso: false,
    tipo,
    valor: 0,
    motivo: `Tipo de canalização inválido: "${tipo}". Opções válidas: "rd" ou "resistenciaMagica".`,
  };
}

/**
 * Validação rigorosa de incompatibilidade teológica e profana.
 * Bloqueia estritamente a combinação de Pacto Infernal com Dogma ou Conhecimento Místico.
 *
 * @param {object} actor Instância ou objeto do Ator
 * @param {string|object} novoItem Nome, tipo ou objeto do item sendo adquirido
 * @returns {{
 *   permitido: boolean,
 *   bloqueado: boolean,
 *   motivo: string|null
 * }}
 */
export function validarIncompatibilidadeReligiosaProfana(actor, novoItem) {
  if (!actor || !actor.system) {
    return { permitido: false, bloqueado: true, motivo: "Ator inválido para validação." };
  }

  const nNovo = norm(
    typeof novoItem === "string"
      ? novoItem
      : novoItem?.name || novoItem?.nome || novoItem?.classe || novoItem?.tipo || ""
  );

  const isPacto = (str) =>
    str.startsWith("pacto") ||
    str === "pacto" ||
    str.includes("pacto infernal") ||
    str.includes("pacto sombrio") ||
    str === "cultista" ||
    str === "aziago";

  const isDogmaOuMistico = (str) =>
    str.startsWith("dogma") ||
    str === "dogma" ||
    str.includes("conhecimento mistico") ||
    str === "sacerdote" ||
    str === "aprendiz de sacerdote" ||
    str === "aprendiz: sacerdote";

  const itens = getItensAtor(actor);
  const caminhoAtor = norm(actor.system.details?.caminho || "");
  const classeAtor = norm(actor.system.details?.classe || "");
  const aprendizAtor = norm(actor.system.details?.aprendiz || "");
  const eApostata = Boolean(actor.system.apostata || actor.system.votoAbandonado);

  // 1. O ator possui Pacto Infernal ativo?
  const temPactoAtivo =
    itens.some((i) => {
      if (i.system?.revogado) return false;
      const n = norm(i.name || i.nome || "");
      const t = norm(i.type || i.system?.tipo || i.system?.categoria || "");
      return isPacto(n) || t === "pacto";
    }) ||
    caminhoAtor === "cultista" ||
    caminhoAtor === "aziago" ||
    Boolean(actor.system.pactos && Object.keys(actor.system.pactos).length > 0);

  // 2. O ator possui Dogma ou Conhecimento Místico ativo?
  // Se for apóstata e tiver abandonado os dogmas/votos, eles não contam como dogmas ativos.
  const temDogmaOuMisticoAtivo =
    itens.some((i) => {
      if (i.system?.revogado || i.system?.abandonado) return false;
      const n = norm(i.name || i.nome || "");
      return isDogmaOuMistico(n);
    }) ||
    (classeAtor === "sacerdote" && !eApostata) ||
    (aprendizAtor === "sacerdote" && !eApostata);

  // Cenário A: Portador de Pacto tentando obter Dogma ou Conhecimento Místico
  if (temPactoAtivo) {
    if (isDogmaOuMistico(nNovo) || novoItem?.system?.tipo === "dogma") {
      return {
        permitido: false,
        bloqueado: true,
        motivo:
          "Incompatibilidade Religiosa-Profana: Personagem portador de Pacto Infernal é estritamente proibido de possuir Dogma ou Conhecimento Místico.",
      };
    }
  }

  // Cenário B: Devoto com Dogma/Conhecimento Místico ativo tentando obter Pacto Infernal
  if (temDogmaOuMisticoAtivo) {
    if (isPacto(nNovo) || novoItem?.system?.tipo === "pacto") {
      return {
        permitido: false,
        bloqueado: true,
        motivo:
          "Incompatibilidade Religiosa-Profana: Personagem com Dogma ou Conhecimento Místico ativo não pode realizar Pacto Infernal sem antes cometer Apostasia formal.",
      };
    }
  }

  // Compatível
  return {
    permitido: true,
    bloqueado: false,
    motivo: null,
  };
}

/**
 * Avalia se o personagem possui capacidade e permissão para conjurar determinada magia, punição ou mito.
 *
 * @param {object} actor Instância do Ator
 * @param {object|string} itemOuNome Item ou nome do item
 * @returns {{ permitido: boolean, motivo: string|null }}
 */
export function podeConjurarMagiaOuHabilidade(actor, itemOuNome) {
  if (!actor || !itemOuNome) {
    return { permitido: false, motivo: "Ator ou item inválido." };
  }

  const itens = getItensAtor(actor);
  let item = typeof itemOuNome === "string"
    ? itens.find((i) => norm(i.name || i.nome) === norm(itemOuNome))
    : itemOuNome;

  if (!item && typeof itemOuNome === "string") {
    item = { name: itemOuNome, system: {} };
  }

  // Se o item já estiver explicitamente revogado ou bloqueado
  if (item?.system?.revogado || item?.system?.bloqueado || item?.system?.capacidadeConjuracao === false) {
    return {
      permitido: false,
      motivo: item.system?.motivoBloqueio || "Habilidade revogada por Apostasia.",
    };
  }

  // Se o ator for apóstata
  if (actor.system?.apostata || actor.system?.votoAbandonado) {
    if (isItemPunicao(item)) {
      return {
        permitido: false,
        motivo: "Apóstata perdeu a investidura sagrada para conjurar Punições.",
      };
    }
    if (isItemMagiaMistica(item)) {
      return {
        permitido: false,
        motivo: "Apóstata perdeu a capacidade de conjurar Magias Místicas do patrono.",
      };
    }
    if (isItemMito(item)) {
      return {
        permitido: false,
        motivo: "Apóstata perdeu a comunhão dracônica para invocar Mitos.",
      };
    }
  }

  return { permitido: true, motivo: null };
}
