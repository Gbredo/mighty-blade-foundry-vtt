/**
 * Módulo de Manobras Táticas de Combate do Mighty Blade 3ª Edição.
 *
 * Implementa as regras canônicas de manobras de combate:
 * - Ataque Localizado: Visar membros ou pontos vitais adiciona +4 na Defesa do alvo
 *   antes da rolagem de dano/ataque.
 * - Encontrão: Ação Completa; exige deslocamento mínimo de 3 metros;
 *   adiciona ao dano a maior FN entre arma e armadura + 1 a cada 3 metros percorridos;
 *   impõe -2 de Esquiva no atacante até o início do próximo turno.
 * - Fintar: Reação; o primeiro ataque causa apenas metade do dano (Math.floor(dano / 2)),
 *   mas confere bônus de +1d6 nas rolagens de ataque subsequentes contra o mesmo alvo no mesmo turno.
 * - Interceptar: Reação ativada contra oponente tentando passar adjacente; exige confronto de Agilidade;
 *   se vencer, bloqueia a passagem e consome a Ação de Movimento do próximo turno do personagem.
 */

import { calcularBloqueio, calcularEsquiva } from "./estatisticas-derivadas.mjs";
import { podeRealizarReacoes } from "./estados-saude.mjs";

/** Constantes Canônicas das Manobras */
export const MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO = 4;
export const DISTANCIA_MINIMA_ENCONTRAO = 3;
export const PENALIDADE_ESQUIVA_ENCONTRAO = -2;
export const BONUS_ATAQUE_FINTAR = "+1d6";
export const CONFRONTO_INTERCEPTAR_ATRIBUTO = "agilidade";

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
 * Extrai o valor de Força Necessária (FN) de um item ou número.
 * @param {object|number} item Item de arma ou armadura, ou valor numérico direto de FN
 * @returns {number}
 */
export function extrairFN(item) {
  if (typeof item === "number") return Math.max(0, item);
  if (!item) return 0;
  return Number(item.system?.fn ?? item.fn ?? 0);
}

/**
 * Extrai um valor de atributo de um ator ou objeto de atributos.
 * @param {object|number} actorOuAtributo Ator, objeto de sistema ou número direto
 * @param {string} nomeAtributo Nome do atributo (ex: "agilidade", "forca")
 * @returns {number}
 */
export function extrairAtributo(actorOuAtributo, nomeAtributo) {
  if (typeof actorOuAtributo === "number") return actorOuAtributo;
  if (!actorOuAtributo) return 0;

  const attrs = actorOuAtributo.system?.attributes || actorOuAtributo.attributes || actorOuAtributo;
  const attr = attrs[nomeAtributo];
  if (typeof attr === "number") return attr;
  return Number(attr?.value ?? attr?.base ?? 0);
}

/**
 * Extrai os valores defensivos de um defensor (Ator, objeto de dados ou número).
 * @param {object|number} defensor
 * @returns {{ defesa: number, bloqueio: number, esquiva: number }}
 */
export function extrairDefesasDefensor(defensor) {
  if (typeof defensor === "number") {
    return { defesa: defensor, bloqueio: defensor, esquiva: defensor };
  }

  if (!defensor) {
    return { defesa: 0, bloqueio: 0, esquiva: 0 };
  }

  // Se for um MockActor ou Actor completo com cálculo de estatísticas
  if (typeof defensor.prepareDerivedData === "function" || defensor.system?.attributes) {
    const bloq = calcularBloqueio(defensor);
    const esq = calcularEsquiva(defensor);
    const defBase = defensor.system?.defesas?.defesa?.value;
    const defesa = typeof defBase === "number" ? defBase : Math.max(bloq.value, esq.value);
    return {
      defesa,
      bloqueio: bloq.value,
      esquiva: esq.value,
    };
  }

  // Objeto de dados simples
  const bloqueio = Number(defensor.bloqueio?.value ?? defensor.bloqueio ?? 0);
  const esquiva = Number(defensor.esquiva?.value ?? defensor.esquiva ?? 0);
  const def = Number(
    defensor.defesaTotal ??
    defensor.defesa?.value ??
    defensor.defesa ??
    (bloqueio || esquiva ? Math.max(bloqueio, esquiva) : 0)
  );

  return {
    defesa: def,
    bloqueio: bloqueio || def,
    esquiva: esquiva || def,
  };
}

/**
 * 1. Ataque Localizado
 *
 * O ataque visando membros ou pontos vitais adiciona +4 na Defesa do alvo
 * antes da rolagem de dano/ataque.
 *
 * @param {object|string} ataque Objeto com dados do ataque ou identificador de área visada
 * @param {object|number} defensor Alvo do ataque (Ator, objeto com defesas ou valor numérico)
 * @param {object} [opcoes={}] Opções adicionais
 * @returns {object} Resultado contendo os bônus e defesas modificadas
 */
export function processarAtaqueLocalizado(ataque, defensor, opcoes = {}) {
  const local = typeof ataque === "string"
    ? ataque
    : ataque?.local ?? ataque?.membro ?? ataque?.pontoVital ?? ataque?.area ?? "membros ou pontos vitais";

  const defesasOriginais = extrairDefesasDefensor(defensor);
  const bonusDefesa = MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO;

  const defesaModificada = defesasOriginais.defesa + bonusDefesa;
  const bloqueioModificado = defesasOriginais.bloqueio + bonusDefesa;
  const esquivaModificada = defesasOriginais.esquiva + bonusDefesa;

  return {
    sucesso: true,
    valido: true,
    tipo: "ataque_localizado",
    local,
    bonusDefesa,
    modificadorDefesa: bonusDefesa,
    defesaOriginal: defesasOriginais.defesa,
    defesaModificada,
    defesaFinal: defesaModificada,
    bloqueioOriginal: defesasOriginais.bloqueio,
    bloqueioModificado,
    esquivaOriginal: defesasOriginais.esquiva,
    esquivaModificada,
    ataque,
    defensor,
    descricao: "O ataque visando membros ou pontos vitais adiciona +4 na Defesa do alvo antes da rolagem de dano/ataque.",
  };
}

/**
 * 2. Encontrão
 *
 * Ação Completa; exige deslocamento mínimo de 3 metros.
 * Adiciona ao dano a maior FN entre arma e armadura + 1 a cada 3 metros percorridos.
 * Impõe -2 de Esquiva no atacante até o início do próximo turno.
 *
 * @param {object} atacante Personagem executando o Encontrão
 * @param {number} metrosPercorridos Distância percorrida em metros
 * @param {object|number} [arma=null] Arma utilizada ou sua FN (se omitido, busca arma equipada no atacante)
 * @param {object|number} [armadura=null] Armadura vestida ou sua FN (se omitido, busca armadura equipada)
 * @param {object} [opcoes={}] Opções adicionais
 * @returns {object} Validação da manobra, bônus de dano e penalidade de esquiva
 */
export function processarEncontrao(atacante, metrosPercorridos, arma = null, armadura = null, opcoes = {}) {
  const metros = Number(metrosPercorridos) || 0;
  const distanciaValida = metros >= DISTANCIA_MINIMA_ENCONTRAO;

  // Busca de arma se não informada explicitamente
  let armaEfetiva = arma;
  if (!armaEfetiva && atacante?.items) {
    const itens = Array.isArray(atacante.items) ? atacante.items : Array.from(atacante.items.values?.() || []);
    armaEfetiva = itens.find((i) => (i.type === "arma" || i.tipo === "arma") && i.system?.equipado !== false);
  }

  // Busca de armadura se não informada explicitamente
  let armaduraEfetiva = armadura;
  if (!armaduraEfetiva && atacante?.items) {
    const itens = Array.isArray(atacante.items) ? atacante.items : Array.from(atacante.items.values?.() || []);
    armaduraEfetiva = itens.find((i) => (i.type === "armadura" || i.tipo === "armadura") && i.system?.equipado !== false);
  }

  const fnArma = extrairFN(armaEfetiva);
  const fnArmadura = extrairFN(armaduraEfetiva);
  const maiorFn = Math.max(fnArma, fnArmadura);

  const bonusDistancia = distanciaValida ? Math.floor(metros / 3) : 0;
  const bonusDano = distanciaValida ? maiorFn + bonusDistancia : 0;

  // Extrai esquiva atual do atacante para calcular a penalidade
  let esquivaOriginal = 0;
  if (atacante) {
    if (typeof atacante.prepareDerivedData === "function" || atacante.system?.attributes) {
      esquivaOriginal = calcularEsquiva(atacante).value;
    } else {
      esquivaOriginal = Number(atacante.system?.defesas?.esquiva?.value ?? atacante.esquiva ?? 0);
    }
  }
  const esquivaModificada = Math.max(0, esquivaOriginal + PENALIDADE_ESQUIVA_ENCONTRAO);

  return {
    valido: distanciaValida,
    sucesso: distanciaValida,
    tipo: "encontrao",
    tipoAcao: "completa",
    acaoCompleta: true,
    metrosPercorridos: metros,
    distanciaMinima: DISTANCIA_MINIMA_ENCONTRAO,
    fnArma,
    fnArmadura,
    maiorFn,
    bonusDistancia,
    bonusMetros: bonusDistancia,
    bonusDano,
    penalidadeEsquiva: PENALIDADE_ESQUIVA_ENCONTRAO,
    modificadorEsquiva: PENALIDADE_ESQUIVA_ENCONTRAO,
    esquivaOriginal,
    esquivaModificada,
    duracaoPenalidade: "ate_inicio_proximo_turno",
    atacante,
    arma: armaEfetiva,
    armadura: armaduraEfetiva,
    motivo: distanciaValida ? null : `O Encontrão exige deslocamento mínimo de ${DISTANCIA_MINIMA_ENCONTRAO} metros.`,
    descricao: "Ação Completa; exige deslocamento mínimo de 3 metros. Adiciona ao dano a maior FN entre arma e armadura + 1 a cada 3 metros percorridos. Impõe -2 de Esquiva no atacante até o início do próximo turno.",
  };
}

/**
 * 3. Fintar
 *
 * Reação; o primeiro ataque causa apenas metade do dano (Math.floor(dano / 2)),
 * mas confere bônus de +1d6 nas rolagens de ataque subsequentes contra o mesmo alvo no mesmo turno.
 *
 * @param {object} atacante Personagem executando a Finta
 * @param {object} defensor Alvo contra quem a Finta é direcionada
 * @param {object|number} [opcoesOuDano={}] Dano do primeiro ataque ou objeto de configurações
 * @returns {object} Validação da finta, dano reduzido e bônus nos ataques subsequentes
 */
export function processarFintar(atacante, defensor, opcoesOuDano = {}) {
  let danoOriginal = null;
  let opcoes = {};

  if (typeof opcoesOuDano === "number") {
    danoOriginal = opcoesOuDano;
  } else if (typeof opcoesOuDano === "object" && opcoesOuDano !== null) {
    opcoes = opcoesOuDano;
    if (typeof opcoes.dano === "number") {
      danoOriginal = opcoes.dano;
    } else if (typeof opcoes.danoPrimeiroAtaque === "number") {
      danoOriginal = opcoes.danoPrimeiroAtaque;
    }
  }

  // Verifica se o atacante tem condições de realizar reações
  let podeReagir = true;
  if (atacante && typeof podeRealizarReacoes === "function") {
    if (atacante.system?.attributes || typeof atacante.obterEstadoSaude === "function") {
      podeReagir = podeRealizarReacoes(atacante);
    }
  }

  const danoReduzido = danoOriginal !== null ? Math.floor(danoOriginal / 2) : null;

  return {
    valido: podeReagir,
    sucesso: podeReagir,
    tipo: "fintar",
    tipoAcao: "reacao",
    reacao: true,
    exigeReacao: true,
    atacante,
    defensor,
    alvo: defensor,
    danoOriginal,
    danoReduzido,
    danoPrimeiroAtaque: danoReduzido,
    calcularDanoPrimeiroAtaque: (dano) => Math.floor(Number(dano) / 2),
    reduzirDano: (dano) => Math.floor(Number(dano) / 2),
    bonusAtaquesSubsequentes: BONUS_ATAQUE_FINTAR,
    bonusDados: 1,
    bonusFormula: BONUS_ATAQUE_FINTAR,
    mesmoAlvo: true,
    mesmoTurno: true,
    motivo: podeReagir ? null : "O personagem está incapacitado ou impossibilitado de realizar reações.",
    descricao: "Reação; o primeiro ataque causa apenas metade do dano (Math.floor(dano / 2)), mas confere bônus de +1d6 nas rolagens de ataque subsequentes contra o mesmo alvo no mesmo turno.",
  };
}

/**
 * 4. Interceptar
 *
 * Reação ativada contra oponente tentando passar adjacente; exige confronto de Agilidade.
 * Se vencer, bloqueia a passagem e consome a Ação de Movimento do próximo turno do personagem.
 *
 * @param {object} atacante Personagem que está tentando interceptar
 * @param {object} oponentePassando Oponente que está tentando se mover adjacente
 * @param {object} [opcoes={}] Opções com rolagens manuais ou forçamento de vitória
 * @returns {object} Resultado do confronto, bloqueio de passagem e consumo da ação de movimento
 */
export function processarInterceptar(atacante, oponentePassando, opcoes = {}) {
  // Verifica se o atacante pode realizar reações
  let podeReagir = true;
  if (atacante && typeof podeRealizarReacoes === "function") {
    if (atacante.system?.attributes || typeof atacante.obterEstadoSaude === "function") {
      podeReagir = podeRealizarReacoes(atacante);
    }
  }

  const agilidadeAtacante = extrairAtributo(atacante, "agilidade");
  const agilidadeOponente = extrairAtributo(oponentePassando, "agilidade");

  let rolagemAtacante = opcoes.rolagemAtacante ?? null;
  let rolagemOponente = opcoes.rolagemOponente ?? null;

  let venceu = false;
  if (opcoes.venceu !== undefined) {
    venceu = Boolean(opcoes.venceu);
  } else if (opcoes.sucesso !== undefined) {
    venceu = Boolean(opcoes.sucesso);
  } else if (rolagemAtacante !== null && rolagemOponente !== null) {
    venceu = Number(rolagemAtacante) >= Number(rolagemOponente);
  } else {
    // Confronto padrão usando os valores de atributo
    venceu = agilidadeAtacante >= agilidadeOponente;
  }

  // Se o atacante não puder reagir, a manobra não tem sucesso
  if (!podeReagir) {
    venceu = false;
  }

  const bloqueiaPassagem = venceu;
  const consomeAcaoMovimentoProximoTurno = venceu;

  return {
    valido: podeReagir,
    sucesso: venceu,
    venceu,
    tipo: "interceptar",
    tipoAcao: "reacao",
    reacao: true,
    exigeReacao: true,
    confrontoAtributo: CONFRONTO_INTERCEPTAR_ATRIBUTO,
    agilidadeAtacante,
    agilidadeOponente,
    rolagemAtacante,
    rolagemOponente,
    bloqueiaPassagem,
    passagemBloqueada: bloqueiaPassagem,
    oponenteBloqueado: bloqueiaPassagem,
    consomeAcaoMovimentoProximoTurno,
    acaoMovimentoProximoTurnoConsumida: consomeAcaoMovimentoProximoTurno,
    atacante,
    oponentePassando,
    motivo: podeReagir ? null : "O atacante não pode realizar reações neste turno.",
    descricao: venceu
      ? "Venceu o confronto de Agilidade: bloqueia a passagem do oponente e consome a Ação de Movimento do próximo turno do personagem."
      : "Falhou no confronto de Agilidade: o oponente continua seu deslocamento e não é bloqueado.",
  };
}
