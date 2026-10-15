/**
 * Módulo da Máquina de Estados de Saúde e Condições Canônicas do Mighty Blade 3e.
 *
 * Implementa as regras oficiais para o Subtítulo 15:
 * 1. Máquina de Estados de Saúde:
 *    - Saudável: PV > 0.
 *    - Por um Fio: Ocorre quando PV chega a 0. Inconsciente e Indefeso.
 *    - Morto: Ocorre ao sofrer qualquer dano adicional enquanto estiver Por um Fio,
 *      ou ao falhar no teste de sobrevivência.
 *    - Cura enquanto Por um Fio restaura para Saudável com o valor curado.
 *
 * 2. Condições Canônicas:
 *    - Atordoado: Não pode realizar Ações ou Reações no turno (podeRealizarAcoes retorna false, podeRealizarReacoes retorna false).
 *    - Cego: Todos os ataques e testes de percepção visual tornam-se Inaptos; Defesa sofre penalidade (-2).
 *    - Amedrontado: Impede aproximação da fonte de medo e aplica penalidade em testes (-2).
 */

export const ESTADO_SAUDAVEL = "Saudável";
export const ESTADO_POR_UM_FIO = "Por um Fio";
export const ESTADO_MORTO = "Morto";

export const CONDICAO_ATORDOADO = "Atordoado";
export const CONDICAO_CEGO = "Cego";
export const CONDICAO_AMEDRONTADO = "Amedrontado";

/**
 * Normaliza qualquer texto de condição ou estado (remove acentos, minúsculo, sem espaços extras).
 * @param {string} str
 * @returns {string}
 */
export function normalizarString(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normaliza o identificador de uma condição.
 * @param {string} cond
 * @returns {string}
 */
export function normalizarCondicao(cond) {
  return normalizarString(cond);
}

/**
 * Normaliza o identificador canônico de estado de saúde.
 * @param {string} estado
 * @returns {"Saudável" | "Por um Fio" | "Morto"}
 */
export function normalizarEstadoSaude(estado) {
  const norm = normalizarString(estado);
  if (norm.includes("fio")) return ESTADO_POR_UM_FIO;
  if (norm.includes("mort")) return ESTADO_MORTO;
  if (norm.includes("saud")) return ESTADO_SAUDAVEL;
  return estado || ESTADO_SAUDAVEL;
}

/**
 * Obtém o estado de saúde canônico atual do Ator.
 * @param {object} actor
 * @returns {"Saudável" | "Por um Fio" | "Morto"}
 */
export function obterEstadoSaude(actor) {
  if (!actor) return ESTADO_SAUDAVEL;

  // 1. Estado explícito registrado em details.estadoSaude
  const estadoSalvo = actor.system?.details?.estadoSaude;
  if (estadoSalvo) {
    return normalizarEstadoSaude(estadoSalvo);
  }

  // 2. Se tem a condição Morto em condicao / aflicoes / statuses
  if (
    temCondicao(actor, "morto") ||
    (actor.statuses instanceof Set && (actor.statuses.has("morto") || actor.statuses.has("dead")))
  ) {
    return ESTADO_MORTO;
  }

  // 3. Se tem a condição Por um Fio
  if (temCondicao(actor, "por-um-fio") || temCondicao(actor, "por um fio")) {
    return ESTADO_POR_UM_FIO;
  }

  // 4. Se PV é exatamente 0
  const pvAtual = Number(actor.system?.resources?.vida?.value);
  if (pvAtual === 0) {
    return ESTADO_POR_UM_FIO;
  }

  return ESTADO_SAUDAVEL;
}

/**
 * Verifica se o Ator está Morto.
 * @param {object} actor
 * @returns {boolean}
 */
export function isMorto(actor) {
  return obterEstadoSaude(actor) === ESTADO_MORTO;
}

/**
 * Verifica se o Ator está Por um Fio.
 * @param {object} actor
 * @returns {boolean}
 */
export function isPorUmFio(actor) {
  return obterEstadoSaude(actor) === ESTADO_POR_UM_FIO;
}

/**
 * Verifica se o Ator está Saudável (PV > 0 e não Por um Fio / Morto).
 * @param {object} actor
 * @returns {boolean}
 */
export function isSaudavel(actor) {
  return obterEstadoSaude(actor) === ESTADO_SAUDAVEL;
}

/**
 * Define explicitamente o estado de saúde do Ator e sincroniza tags, aflições e statuses.
 * @param {object} actor
 * @param {string} novoEstado
 * @returns {string}
 */
export function definirEstadoSaude(actor, novoEstado) {
  if (!actor) return ESTADO_SAUDAVEL;
  const canonical = normalizarEstadoSaude(novoEstado);

  if (!actor.system) actor.system = {};
  if (!actor.system.details) actor.system.details = {};
  actor.system.details.estadoSaude = canonical;

  if (canonical === ESTADO_MORTO) {
    removerCondicao(actor, "por-um-fio");
    removerCondicao(actor, "por um fio");
    adicionarCondicaoInterna(actor, "Morto", {
      efeito: "Personagem falecido. Não pode realizar ações, reações ou recuperar PV sem ressurreição.",
    });
    if (actor.statuses instanceof Set) {
      actor.statuses.add("dead");
      actor.statuses.add("morto");
      actor.statuses.delete("por-um-fio");
    }
  } else if (canonical === ESTADO_POR_UM_FIO) {
    removerCondicao(actor, "morto");
    adicionarCondicaoInterna(actor, "Por um Fio", {
      efeito: "PV em 0. Inconsciente e Indefeso. Qualquer dano adicional mata instantaneamente.",
    });
    if (actor.statuses instanceof Set) {
      actor.statuses.add("por-um-fio");
      actor.statuses.delete("dead");
      actor.statuses.delete("morto");
    }
  } else if (canonical === ESTADO_SAUDAVEL) {
    removerCondicao(actor, "por-um-fio");
    removerCondicao(actor, "por um fio");
    removerCondicao(actor, "morto");
    if (actor.statuses instanceof Set) {
      actor.statuses.delete("por-um-fio");
      actor.statuses.delete("dead");
      actor.statuses.delete("morto");
    }
  }

  return canonical;
}

/**
 * Atualiza o estado de saúde do Ator com base em uma alteração de PV (deltaPV) ou teste de sobrevivência.
 *
 * Regras canônicas de Mighty Blade 3e:
 * - Saudável -> Por um Fio quando PV chega a 0.
 * - Por um Fio -> Morto ao sofrer qualquer dano adicional enquanto estiver Por um Fio ou falhar no teste de sobrevivência.
 * - Cura enquanto Por um Fio restaura para Saudável com o valor curado.
 *
 * @param {object} actor Ator alvo
 * @param {number} [deltaPV=0] Variação nos Pontos de Vida (negativo = dano, positivo = cura)
 * @param {object} [opcoes={}] Opções adicionais
 * @param {boolean} [opcoes.falhaSobrevivencia=false] Se o personagem falhou no teste de sobrevivência
 * @param {boolean} [opcoes.falhouTesteSobrevivencia=false] Alias para falha no teste de sobrevivência
 * @param {boolean} [opcoes.ressuscitar=false] Se permite ressuscitar personagem morto com cura
 * @returns {{
 *   estadoAnterior: string,
 *   novoEstado: string,
 *   vidaAnterior: number,
 *   vidaAtual: number,
 *   deltaPV: number,
 *   morto: boolean,
 *   porUmFio: boolean,
 *   saudavel: boolean
 * }}
 */
export function atualizarEstadoSaude(actor, deltaPV = 0, opcoes = {}) {
  if (!actor || !actor.system?.resources?.vida) {
    return {
      estadoAnterior: ESTADO_SAUDAVEL,
      novoEstado: ESTADO_SAUDAVEL,
      vidaAnterior: 0,
      vidaAtual: 0,
      deltaPV: 0,
      morto: false,
      porUmFio: false,
      saudavel: true,
    };
  }

  const vidaRec = actor.system.resources.vida;
  const vidaAtual = Number(vidaRec.value) || 0;
  const vidaMax = Number(vidaRec.max) || 60;
  const estadoAtual = obterEstadoSaude(actor);
  const delta = Number(deltaPV) || 0;

  const falhaSobrevivencia = Boolean(
    opcoes.falhaSobrevivencia ||
    opcoes.falhouTesteSobrevivencia ||
    opcoes.testeSobrevivencia === false
  );
  const ressuscitar = Boolean(opcoes.ressuscitar);

  let novoEstado = estadoAtual;
  let novaVida = vidaAtual;

  // CASO 1: PERSONAGEM JÁ ESTÁ MORTO
  if (estadoAtual === ESTADO_MORTO) {
    if (ressuscitar && delta > 0) {
      novaVida = Math.min(vidaMax, delta);
      novoEstado = ESTADO_SAUDAVEL;
    } else {
      novaVida = 0;
      novoEstado = ESTADO_MORTO;
    }
  }
  // CASO 2: PERSONAGEM ESTÁ "POR UM FIO"
  else if (estadoAtual === ESTADO_POR_UM_FIO) {
    // 2.1: Qualquer dano adicional enquanto estiver Por um Fio causa a morte imediata
    if (delta < 0) {
      novoEstado = ESTADO_MORTO;
      novaVida = 0;
    }
    // 2.2: Falhar no teste de sobrevivência mata o personagem
    else if (falhaSobrevivencia) {
      novoEstado = ESTADO_MORTO;
      novaVida = 0;
    }
    // 2.3: Cura enquanto Por um Fio restaura para Saudável com o valor curado
    else if (delta > 0) {
      novaVida = Math.min(vidaMax, delta);
      novoEstado = ESTADO_SAUDAVEL;
    }
    // 2.4: Sem dano e sem cura (ex: sucesso no teste de sobrevivência ou delta == 0)
    else {
      novaVida = 0;
      novoEstado = ESTADO_POR_UM_FIO;
    }
  }
  // CASO 3: PERSONAGEM ESTÁ "SAUDÁVEL"
  else {
    if (delta < 0) {
      const calculada = vidaAtual + delta;
      if (calculada <= 0) {
        // PV chegou a 0 -> Transição Saudável para Por um Fio
        novaVida = 0;
        novoEstado = ESTADO_POR_UM_FIO;
      } else {
        novaVida = calculada;
        novoEstado = ESTADO_SAUDAVEL;
      }
    } else if (delta > 0) {
      novaVida = Math.min(vidaMax, vidaAtual + delta);
      novoEstado = ESTADO_SAUDAVEL;
    } else {
      novaVida = vidaAtual;
      novoEstado = vidaAtual === 0 ? ESTADO_POR_UM_FIO : ESTADO_SAUDAVEL;
    }
  }

  // Persiste no modelo de dados
  vidaRec.value = novaVida;
  definirEstadoSaude(actor, novoEstado);

  if (typeof actor.prepareDerivedData === "function") {
    actor.prepareDerivedData();
  }

  return {
    estadoAnterior: estadoAtual,
    novoEstado,
    vidaAnterior: vidaAtual,
    vidaAtual: novaVida,
    deltaPV: delta,
    morto: novoEstado === ESTADO_MORTO,
    porUmFio: novoEstado === ESTADO_POR_UM_FIO,
    saudavel: novoEstado === ESTADO_SAUDAVEL,
  };
}

/**
 * Força a falha no teste de sobrevivência quando o Ator está Por um Fio, levando à morte.
 * @param {object} actor
 * @returns {object}
 */
export function falharTesteSobrevivencia(actor) {
  return atualizarEstadoSaude(actor, 0, { falhaSobrevivencia: true });
}

/**
 * Processa o sucesso no teste de sobrevivência (o personagem permanece vivo Por um Fio).
 * @param {object} actor
 * @returns {object}
 */
export function passarTesteSobrevivencia(actor) {
  return atualizarEstadoSaude(actor, 0, { falhaSobrevivencia: false });
}

/**
 * Função interna para registrar condição nos containers do Ator.
 * @private
 */
function adicionarCondicaoInterna(actor, condicaoNome, { efeito = "", duracao = "", ...extras } = {}) {
  if (!actor || !condicaoNome) return;
  const nBusca = normalizarCondicao(condicaoNome);
  const nomeDisplay = condicaoNome.charAt(0).toUpperCase() + condicaoNome.slice(1);

  if (!actor.system) actor.system = {};
  if (!actor.system.details) actor.system.details = {};

  // 1. details.condicao
  const atualTexto = (actor.system.details.condicao || "").trim();
  const partes = atualTexto ? atualTexto.split(",").map((p) => p.trim()).filter(Boolean) : [];
  if (!partes.some((p) => normalizarCondicao(p) === nBusca)) {
    partes.push(nomeDisplay);
    actor.system.details.condicao = partes.join(", ");
  }

  // 2. details.aflicoes
  if (!actor.system.details.aflicoes) actor.system.details.aflicoes = [];
  const aflicaoExistente = actor.system.details.aflicoes.find((a) => normalizarCondicao(a.id) === nBusca);
  if (!aflicaoExistente) {
    actor.system.details.aflicoes.push({
      id: nBusca,
      nome: nomeDisplay,
      efeito,
      duracao,
      ...extras,
    });
  } else {
    Object.assign(aflicaoExistente, extras);
    if (efeito && !aflicaoExistente.efeito) aflicaoExistente.efeito = efeito;
  }

  // 3. actor.statuses
  if (actor.statuses instanceof Set) {
    actor.statuses.add(nBusca);
  }
}

/**
 * Aplica uma condição ao Ator segundo as regras do Mighty Blade 3e.
 *
 * Suporte canônico específico para:
 * - Atordoado: Não pode realizar Ações ou Reações no turno (podeRealizarAcoes retorna false, podeRealizarReacoes retorna false).
 * - Cego: Todos os ataques e testes de percepção visual tornam-se Inaptos; Defesa sofre penalidade (-2).
 * - Amedrontado: Impede aproximação da fonte de medo e aplica penalidade em testes (-2).
 *
 * @param {object} actor
 * @param {string} condicaoNome
 * @param {object} [opcoes={}]
 * @param {string} [opcoes.fonte] Fonte do medo para a condição Amedrontado
 * @param {string} [opcoes.duracao] Duração da condição (ex: "1 turno", "1 minuto")
 * @returns {{ condicao: string, id: string, opcoes: object }}
 */
export function aplicarCondicao(actor, condicaoNome, opcoes = {}) {
  if (!actor || !condicaoNome) return;
  const nBusca = normalizarCondicao(condicaoNome);
  const nomeDisplay = condicaoNome.charAt(0).toUpperCase() + condicaoNome.slice(1);

  let efeitoDesc = opcoes.efeito || "";
  let duracaoDesc = opcoes.duracao || "";

  if (nBusca === "atordoado") {
    efeitoDesc = "Não pode realizar Ações ou Reações no turno. Todos os testes são Inaptos.";
  } else if (nBusca === "cego") {
    efeitoDesc = "Todos os ataques e testes de percepção visual tornam-se Inaptos; Defesa sofre penalidade (-2).";
  } else if (nBusca === "amedrontado") {
    const fonteDesc = opcoes.fonte ? ` de ${opcoes.fonte}` : " da fonte de medo";
    efeitoDesc = `Impede aproximação${fonteDesc} e aplica penalidade em testes (-2).`;
  }

  adicionarCondicaoInterna(actor, nomeDisplay, {
    efeito: efeitoDesc,
    duracao: duracaoDesc,
    ...opcoes,
  });

  if (typeof actor.prepareDerivedData === "function") {
    actor.prepareDerivedData();
  }

  return {
    condicao: nomeDisplay,
    id: nBusca,
    opcoes,
  };
}

/**
 * Remove uma condição do Ator (em details.condicao, details.aflicoes e statuses).
 * @param {object} actor
 * @param {string} condicaoNome
 */
export function removerCondicao(actor, condicaoNome) {
  if (!actor || !condicaoNome) return;
  const nBusca = normalizarCondicao(condicaoNome);

  if (actor.system?.details?.condicao) {
    const partes = actor.system.details.condicao
      .split(",")
      .map((p) => p.trim())
      .filter((p) => normalizarCondicao(p) !== nBusca);
    actor.system.details.condicao = partes.join(", ");
  }

  if (Array.isArray(actor.system?.details?.aflicoes)) {
    actor.system.details.aflicoes = actor.system.details.aflicoes.filter(
      (a) => normalizarCondicao(a.id) !== nBusca && normalizarCondicao(a.nome) !== nBusca
    );
  }

  if (actor.statuses instanceof Set) {
    actor.statuses.delete(nBusca);
  }

  if (typeof actor.prepareDerivedData === "function") {
    actor.prepareDerivedData();
  }
}

/**
 * Verifica se o Ator possui determinada condição ativa.
 * Checa details.condicao, details.aflicoes e actor.statuses.
 * @param {object} actor
 * @param {string} condicaoNomeOuId
 * @returns {boolean}
 */
export function temCondicao(actor, condicaoNomeOuId) {
  if (!actor || !condicaoNomeOuId) return false;
  const nBusca = normalizarCondicao(condicaoNomeOuId);

  // 1. Exausto automático se PM é 0
  if (nBusca === "exausto" && Number(actor.system?.resources?.mana?.value) === 0) {
    return true;
  }

  // 2. Por um Fio automático se PV é 0 e não está morto
  if (
    (nBusca === "por-um-fio" || nBusca === "por um fio") &&
    Number(actor.system?.resources?.vida?.value) === 0 &&
    !isMorto(actor)
  ) {
    return true;
  }

  // 3. details.condicao
  const condTexto = normalizarCondicao(actor.system?.details?.condicao || "");
  if (condTexto.includes(nBusca)) return true;

  // 4. details.aflicoes
  const aflicoes = actor.system?.details?.aflicoes || [];
  if (aflicoes.some((a) => normalizarCondicao(a.id) === nBusca || normalizarCondicao(a.nome) === nBusca)) {
    return true;
  }

  // 5. actor.statuses
  if (actor.statuses instanceof Set && (actor.statuses.has(nBusca) || actor.statuses.has(condicaoNomeOuId))) {
    return true;
  }

  return false;
}

/**
 * Verifica se o Ator pode realizar Ações no turno.
 * Conforme a regra de Atordoado: "Não pode realizar Ações ou Reações no turno (podeRealizarAcoes retorna false)."
 * Personagens Mortos, Por um Fio, Inconscientes ou Paralisados também não podem agir.
 *
 * @param {object} actor
 * @returns {boolean}
 */
export function podeRealizarAcoes(actor) {
  if (!actor) return false;
  if (isMorto(actor)) return false;
  if (isPorUmFio(actor)) return false;
  if (temCondicao(actor, CONDICAO_ATORDOADO) || temCondicao(actor, "atordoado")) return false;
  if (
    temCondicao(actor, "inconsciente") ||
    temCondicao(actor, "paralisado") ||
    temCondicao(actor, "imobilizado")
  ) {
    return false;
  }
  return true;
}

/**
 * Verifica se o Ator pode realizar Reações no turno.
 * Atordoados, Mortos, Por um Fio, Inconscientes ou Surpresos não podem usar Reações.
 *
 * @param {object} actor
 * @returns {boolean}
 */
export function podeRealizarReacoes(actor) {
  if (!actor) return false;
  if (isMorto(actor)) return false;
  if (isPorUmFio(actor)) return false;
  if (temCondicao(actor, CONDICAO_ATORDOADO) || temCondicao(actor, "atordoado")) return false;
  if (
    temCondicao(actor, "inconsciente") ||
    temCondicao(actor, "surpreso") ||
    temCondicao(actor, "dormindo")
  ) {
    return false;
  }
  return true;
}

/**
 * Verifica se o ataque do Ator torna-se Inapto (1d6) devido a condições ativas.
 * Conforme a regra de Cego: "Todos os ataques e testes de percepção visual tornam-se Inaptos".
 *
 * @param {object} actor
 * @param {object} [opcoes={}]
 * @returns {boolean}
 */
export function isAtaqueInapto(actor, opcoes = {}) {
  if (!actor) return false;
  if (temCondicao(actor, CONDICAO_CEGO) || temCondicao(actor, "cego")) return true;
  if (temCondicao(actor, CONDICAO_ATORDOADO) || temCondicao(actor, "atordoado")) return true;
  if (temCondicao(actor, "exausto") || temCondicao(actor, "inapto")) return true;
  if (actor.system?.equipamento?.inaptoArmadura) return true;
  if (typeof actor.isInapto === "function" && actor.isInapto()) return true;
  return false;
}

/**
 * Verifica se um teste de percepção visual torna-se Inapto devido a condições (Cego).
 * @param {object} actor
 * @returns {boolean}
 */
export function isPercepcaoVisualInapta(actor) {
  if (!actor) return false;
  if (temCondicao(actor, CONDICAO_CEGO) || temCondicao(actor, "cego")) return true;
  if (temCondicao(actor, "exausto") || temCondicao(actor, "inapto")) return true;
  if (typeof actor.isInapto === "function" && actor.isInapto()) return true;
  return false;
}

/**
 * Retorna a penalidade numérica aplicada à Defesa decorrente de condições ativas.
 * Conforme a regra de Cego: "Defesa sofre penalidade (-2)."
 *
 * @param {object} actor
 * @param {string} [tipoDefesa="todas"]
 * @returns {number} Valor negativo (ex: -2) ou 0
 */
export function obterPenalidadeDefesa(actor, tipoDefesa = "todas") {
  if (!actor) return 0;
  let penalidade = 0;

  if (temCondicao(actor, CONDICAO_CEGO) || temCondicao(actor, "cego")) {
    penalidade -= 2;
  }

  if (temCondicao(actor, "caido")) {
    const tipo = normalizarString(tipoDefesa);
    if (tipo === "corporal" || tipo === "bloqueio") {
      penalidade -= 2;
    }
  }

  return penalidade;
}

/**
 * Retorna a penalidade numérica aplicada a testes de atributos/habilidades por condições ativas.
 * Conforme a regra de Amedrontado: "aplica penalidade em testes (-2)."
 *
 * @param {object} actor
 * @param {object} [contexto={}]
 * @returns {number} Valor negativo (ex: -2) ou 0
 */
export function obterPenalidadeTestes(actor, contexto = {}) {
  if (!actor) return 0;
  let penalidade = 0;

  if (temCondicao(actor, CONDICAO_AMEDRONTADO) || temCondicao(actor, "amedrontado")) {
    penalidade -= 2;
  }

  return penalidade;
}

/**
 * Retorna a fonte de medo associada à condição Amedrontado do Ator (se houver).
 * @param {object} actor
 * @returns {string|null}
 */
export function obterFonteMedo(actor) {
  if (!actor) return null;
  const aflicoes = actor.system?.details?.aflicoes || [];
  const aflicaoMedo = aflicoes.find((a) => normalizarCondicao(a.id) === "amedrontado");
  return aflicaoMedo?.fonte || aflicaoMedo?.origem || null;
}

/**
 * Verifica se o Ator pode se aproximar da fonte de medo.
 * Conforme a regra de Amedrontado: "Impede aproximação da fonte de medo".
 * Retorna false se o Ator estiver Amedrontado com relação à fonte indicada.
 *
 * @param {object} actor
 * @param {string} [fonteAlvo=null] Nome da criatura ou objeto
 * @returns {boolean} Retorna false se impedido, true se livre
 */
export function podeAproximarFonteMedo(actor, fonteAlvo = null) {
  if (!actor) return true;
  if (!temCondicao(actor, CONDICAO_AMEDRONTADO) && !temCondicao(actor, "amedrontado")) {
    return true;
  }

  // Estando Amedrontado, o movimento em direção à fonte de medo é estritamente proibido
  const fonteRegistrada = obterFonteMedo(actor);

  if (!fonteAlvo || !fonteRegistrada) {
    // Se a fonte não puder ser discriminada, impede aproximação da fonte de medo em geral
    return false;
  }

  const nAlvo = normalizarString(fonteAlvo);
  const nReg = normalizarString(fonteRegistrada);
  if (nAlvo.includes(nReg) || nReg.includes(nAlvo)) {
    return false;
  }

  return false;
}
