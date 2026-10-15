/**
 * Módulo de Regras Canônicas de Carga, Sobrecarga e Movimentação Física / Ambiente.
 * Mighty Blade 3ª Edição (Foundry VTT v14).
 *
 * Implementa as regras canônicas do Subtítulo 10:
 * 1. Avaliação de Sobrecarga e Movimentação Física (GB p.21):
 *    - Carga Básica  = FOR × 7 kg (Padrão GB)
 *    - Carga Pesada  = FOR × 35 kg → sobrecarregado: metade deslocamento + inapto testes físicos/AGI
 *    - Carga Máxima  = FOR × 70 kg → imobilizado (deslocamento 0) + inapto
 *    - Manual do Combatente (variante): Carga Básica = FOR × 20 kg
 *
 * 2. Dano por Queda e Resiliência Racial/Habilidade (GB p.20):
 *    - Dano base de queda: 6 pontos de Contusão por metro (fixo, não d6).
 *    - Metadílio com a habilidade "Balofo": divide o dano total da queda por 2 (Math.floor(dano / 2)).
 *
 * 3. Fôlego e Sufocamento (GB p.23):
 *    - Minutos máximos de sustentação = Força (não Vontade, não turnos).
 *    - Além do limite: teste dificuldade 12 por minuto adicional.
 *    - Habilidade "Anfíbio": imune a sufocamento aquático.
 *    - Habilidade "Fulgurante" (GB p.61): visão no escuro + imune a efeitos de visão.
 *      NÃO concede isenção de sufocamento.
 */

import { normalizarCondicao, adicionarCondicao, removerCondicao } from "./danos-condicoes.mjs";

/**
 * Normaliza textos (remove acentos, caixa baixa, sem espaços sobressalentes).
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
 * Retorna os itens de um ator como um array plano.
 * @param {object} actor
 * @returns {Array<object>}
 */
export function obterItens(actor) {
  if (!actor?.items) return [];
  if (Array.isArray(actor.items)) return actor.items;
  if (typeof actor.items.values === "function") return Array.from(actor.items.values());
  return [];
}

/**
 * Verifica se um ator possui uma habilidade ou característica por nome ou slug.
 * @param {object} actor
 * @param {string} nomeOuSlug
 * @returns {boolean}
 */
export function temHabilidade(actor, nomeOuSlug) {
  if (!actor) return false;
  const nBusca = normalizarTexto(nomeOuSlug);

  // 1. Verificação direta em flags ou propriedades booleanas
  if (actor[nomeOuSlug] === true || actor[`is${nomeOuSlug.charAt(0).toUpperCase() + nomeOuSlug.slice(1)}`] === true) {
    return true;
  }
  if (actor.flags?.["mighty-blade"]?.[nBusca] === true) {
    return true;
  }

  // 2. Verificação em lista de itens
  const items = obterItens(actor);
  for (const item of items) {
    const nomeNorm = normalizarTexto(item.name);
    const slug = normalizarTexto(item.flags?.["mighty-blade"]?.slug);
    if (nomeNorm === nBusca || slug === nBusca) {
      return true;
    }
  }

  // 3. Verificação em lista simplificada de habilidades (ex: array de strings ou objetos)
  if (Array.isArray(actor.habilidades)) {
    for (const h of actor.habilidades) {
      const nomeH = typeof h === "string" ? normalizarTexto(h) : normalizarTexto(h.name || h.id);
      if (nomeH === nBusca) return true;
    }
  }

  return false;
}

/**
 * Verifica se o ator é da raça Metadílio.
 * @param {object} actor
 * @returns {boolean}
 */
export function isMetadilio(actor) {
  if (!actor) return false;
  if (actor.isMetadilio === true) return true;

  const racaDetalhes = normalizarTexto(actor.system?.details?.raca || actor.raca || "");
  if (racaDetalhes === "metadilio") return true;

  const items = obterItens(actor);
  return items.some((i) => i.type === "raca" && normalizarTexto(i.name) === "metadilio");
}

/**
 * ============================================================================
 * 1. AVALIAÇÃO DE CARGA E SOBRECARGA
 * ============================================================================
 *
 * Avalia o estado de sobrecarga com base na Carga Atual e Carga Máxima (ou Ator).
 *
 * Regras Canônicas (GB p.21):
 * - Carga Atual <= Básica (FOR×7): Sem penalidades.
 * - Carga Atual > Básica e <= Pesada (FOR×35): sobrecarregado — metade deslocamento + inapto físico/AGI.
 * - Carga Atual > Pesada e <= Máxima (FOR×70): sobrecarregado pesado (sem penalidade extra por ora, inapto).
 * - Carga Atual > Máxima (FOR×70): Imobilizado (deslocamento 0) + Inapto.
 * Nota: a lógica de 2×max mantida internamente; cargaMaxima deve ser pesadaPadrao (FOR×35) para ativar
 *       metade deslocamento, ou maximaPadrao (FOR×70) para Imobilizado.
 *
 * @param {number|object} cargaAtualOuActor Valor numérico da carga atual ou Ator
 * @param {number} [cargaMaxima] Valor numérico da carga máxima (se cargaAtualOuActor for número)
 * @param {object|number} [optionsOrDeslocamento] Opções adicionais ou deslocamento base
 * @returns {{
 *   cargaAtual: number,
 *   cargaMaxima: number,
 *   sobrecarregado: boolean,
 *   imobilizado: boolean,
 *   inapto: boolean,
 *   inaptoFisicoAgilidade: boolean,
 *   status: "normal" | "sobrecarregado" | "imobilizado",
 *   deslocamentoOriginal: number,
 *   deslocamentoFinal: number,
 *   deslocamento: number,
 *   penalidadeDeslocamento: number,
 *   fatorDeslocamento: number,
 *   condicoes: string[],
 *   aplicarDeslocamento: (base: number) => number
 * }}
 */
export function avaliarSobrecarga(cargaAtualOuActor, cargaMaxima, optionsOrDeslocamento = {}) {
  let actor = null;
  let atual = 0;
  let maxima = 0;
  let options = {};

  if (typeof optionsOrDeslocamento === "number") {
    options = { deslocamento: optionsOrDeslocamento };
  } else if (typeof optionsOrDeslocamento === "object" && optionsOrDeslocamento !== null) {
    options = { ...optionsOrDeslocamento };
  }

  // Suporte a polimorfismo: primeiro parâmetro é um Ator
  if (typeof cargaAtualOuActor === "object" && cargaAtualOuActor !== null) {
    actor = cargaAtualOuActor;
    atual = Number(actor.system?.subattributes?.carga?.value ?? actor.cargaAtual ?? 0);
    maxima = Number(
      actor.system?.subattributes?.carga?.max ??
      actor.system?.subattributes?.carga?.maxima ??
      actor.system?.subattributes?.carga?.basica ??
      actor.cargaMaxima ??
      0
    );
    if (typeof cargaMaxima === "object" && cargaMaxima !== null) {
      options = { ...options, ...cargaMaxima };
    } else if (typeof cargaMaxima === "number") {
      maxima = cargaMaxima;
    }
  } else {
    atual = Math.max(0, Number(cargaAtualOuActor) || 0);
    maxima = Math.max(0, Number(cargaMaxima) || 0);
  }

  // Se solicitado, usa variante do Manual do Combatente (FOR * 20 kg)
  if (actor && (options.variante === true || options.modo === "combatente")) {
    const forcaEfetiva = Number(
      actor.system?.subattributes?.carga?.forcaEfetiva ??
      actor.system?.attributes?.forca?.value ??
      actor.attributes?.forca ??
      0
    );
    if (forcaEfetiva > 0) {
      maxima = forcaEfetiva * 20;
    }
  }

  const deslocamentoOriginal = Number(
    options.deslocamento ??
    actor?.system?.subattributes?.deslocamento?.value ??
    actor?.deslocamento ??
    6
  );

  // GB p.21: Three-tier thresholds: básica=maxima(FOR×7), pesada=FOR×35, máxima=FOR×70
  let limiarSobrecarga = maxima;          // > básica → sobrecarregado
  let limiarImobilizado = maxima * 10;   // > máxima (FOR×70 = 10× básica) → imobilizado
  if (actor) {
    const cargaSys = actor.system?.subattributes?.carga;
    if (cargaSys?.pesadaPadrao) limiarSobrecarga = cargaSys.pesadaPadrao;
    if (cargaSys?.maximaPadrao) limiarImobilizado = cargaSys.maximaPadrao;
  }
  if (typeof options.pesadaPadrao === "number") limiarSobrecarga = options.pesadaPadrao;
  if (typeof options.maximaPadrao === "number") limiarImobilizado = options.maximaPadrao;

  let sobrecarregado = false;
  let imobilizado = false;
  let inaptoFisicoAgilidade = false;
  let status = "normal";
  let fatorDeslocamento = 1;
  let deslocamentoFinal = deslocamentoOriginal;
  const condicoes = [];

  // GB p.21: Imobilizado quando Carga > Máxima (FOR×70)
  if (atual > limiarImobilizado) {
    sobrecarregado = true;
    imobilizado = true;
    inaptoFisicoAgilidade = true;
    status = "imobilizado";
    fatorDeslocamento = 0;
    deslocamentoFinal = 0;
    condicoes.push("Imobilizado");
  }
  // GB p.21: Sobrecarregado quando Carga > Básica (FOR×7)
  else if (atual > maxima) {
    sobrecarregado = true;
    imobilizado = false;
    inaptoFisicoAgilidade = true;
    status = "sobrecarregado";
    fatorDeslocamento = 0.5;
    deslocamentoFinal = Math.floor(deslocamentoOriginal / 2);
  }
  // Se Carga Atual <= Carga Máxima: Sem penalidades
  else {
    sobrecarregado = false;
    imobilizado = false;
    inaptoFisicoAgilidade = false;
    status = "normal";
    fatorDeslocamento = 1;
    deslocamentoFinal = deslocamentoOriginal;
  }

  const penalidadeDeslocamento = Math.max(0, deslocamentoOriginal - deslocamentoFinal);

  const aplicarDeslocamento = (base) => {
    const val = Number(base) || 0;
    if (imobilizado) return 0;
    if (sobrecarregado) return Math.floor(val / 2);
    return val;
  };

  const resultado = {
    cargaAtual: atual,
    cargaMaxima: maxima,
    sobrecarregado,
    imobilizado,
    isImobilizado: imobilizado,
    inapto: inaptoFisicoAgilidade,
    inaptoFisicoAgilidade,
    isInaptoFisico: inaptoFisicoAgilidade,
    status,
    deslocamentoOriginal,
    deslocamentoFinal,
    deslocamentoEfetivo: deslocamentoFinal,
    deslocamento: deslocamentoFinal,
    penalidadeDeslocamento,
    fatorDeslocamento,
    condicoes,
    aplicarDeslocamento,
  };

  // Se solicitado ou se um ator foi passado com flag de aplicação
  if (options.aplicarAoAtor && actor) {
    aplicarSobrecargaAoAtor(actor, resultado);
  }

  return resultado;
}

/**
 * Calcula a capacidade de carga máxima segundo o Guia Básico (Força * 10 kg)
 * e a variante do Manual do Combatente (Força * 20 kg).
 *
 * @param {object|number} actorOuForca Ator ou valor numérico de Força
 * @param {object} [opcoes={}] Opções ({ variante: boolean, considerarHabilidades: boolean })
 * @returns {{
 *   forca: number,
 *   forcaEfetiva: number,
 *   basicaPadrao: number,   // GB: FOR×7 kg
 *   pesadaPadrao: number,   // GB: FOR×35 kg
 *   maximaPadrao: number,   // GB: FOR×70 kg
 *   cargaPadrao: number,    // alias → basicaPadrao
 *   cargaVariante: number,
 *   cargaMaxima: number,
 *   limiteImobilizadoPadrao: number,
 *   limiteImobilizadoVariante: number,
 *   limiteImobilizado: number
 * }}
 */
export function calcularCapacidadeCarga(actorOuForca, opcoes = {}) {
  let forca = 0;
  let bonusForcaCarga = 0;

  if (typeof actorOuForca === "number") {
    forca = Math.max(0, actorOuForca);
  } else if (actorOuForca && typeof actorOuForca === "object") {
    const raw = actorOuForca._rawActor || actorOuForca;
    forca = Number(
      raw.system?.attributes?.forca?.value ??
      raw.system?.attributes?.forca?.base ??
      raw.attributes?.forca ??
      raw.forca ??
      0
    );
    if (opcoes.considerarHabilidades === true) {
      const fe = Number(raw.system?.subattributes?.carga?.forcaEfetiva ?? forca);
      bonusForcaCarga = Math.max(0, fe - forca);
    }
  }

  const forcaEfetiva = forca + bonusForcaCarga;
  const basicaPadrao = forcaEfetiva * 7;         // GB p.21: FOR×7 kg
  const pesadaPadrao = forcaEfetiva * 35;        // GB p.21: FOR×35 kg (5× básica) — limiar sobrecarregado
  const maximaPadrao = forcaEfetiva * 70;        // GB p.21: FOR×70 kg (10× básica) — limiar imobilizado
  const cargaPadrao = basicaPadrao;              // alias: compatibilidade retroativa
  const cargaVariante = forcaEfetiva * 20;       // Manual do Combatente (variante): FOR×20 kg
  const usaVariante = opcoes.variante === true || opcoes.modo === "combatente";
  const cargaMaxima = usaVariante ? cargaVariante : basicaPadrao;

  return {
    forca,
    forcaEfetiva,
    basicaPadrao,                              // GB: FOR×7 kg
    pesadaPadrao,                              // GB: FOR×35 kg
    maximaPadrao,                              // GB: FOR×70 kg
    cargaPadrao,                               // alias → basicaPadrao
    cargaVariante,
    cargaMaxima,
    limiteImobilizadoPadrao: maximaPadrao,     // GB: imobilizado > FOR×70
    limiteImobilizadoVariante: cargaVariante * 2,
    limiteImobilizado: usaVariante ? cargaVariante * 2 : maximaPadrao,
  };
}

/**
 * Atualiza o peso total carregado no inventário do personagem.
 *
 * @param {object} char Personagem ou Ator
 * @param {number} weightKg Peso total em kg
 * @returns {object} O personagem atualizado
 */
export function updateInventoryWeight(char, weightKg) {
  const actor = char?._rawActor || char;
  const peso = Math.max(0, Number(weightKg) || 0);
  if (actor) {
    actor.cargaAtual = peso;
    if (!actor.system) actor.system = {};
    if (!actor.system.subattributes) actor.system.subattributes = {};
    if (!actor.system.subattributes.carga) {
      const cap = calcularCapacidadeCarga(actor);
      actor.system.subattributes.carga = {
        value: peso,
        max: cap.basicaPadrao,          // GB: FOR×7 kg (limiar sobrecarregado)
        basicaPadrao: cap.basicaPadrao,  // GB: FOR×7 kg
        pesadaPadrao: cap.pesadaPadrao,  // GB: FOR×35 kg
        maximaPadrao: cap.maximaPadrao,  // GB: FOR×70 kg
        basicaCombatente: cap.cargaVariante,
      };
    } else {
      actor.system.subattributes.carga.value = peso;
    }
  }
  return char;
}

/**
 * Verifica o status de movimentação e sobrecarga do personagem.
 *
 * @param {object} char Personagem ou Ator
 * @param {object} [opcoes={}] Opções adicionais ({ variante: boolean })
 * @returns {object} Resultado detalhado de avaliarSobrecarga
 */
export function checkMovementStatus(char, opcoes = {}) {
  const actor = char?._rawActor || char;
  return avaliarSobrecarga(actor, opcoes);
}

/**
 * Aplica as condições e modificadores de sobrecarga diretamente em um Ator.
 * @param {object} actor
 * @param {object} [resultadoSobrecarga]
 * @returns {object}
 */
export function aplicarSobrecargaAoAtor(actor, resultadoSobrecarga = null) {
  if (!actor) return null;
  const res = resultadoSobrecarga || avaliarSobrecarga(actor);

  if (!actor.system) actor.system = {};
  if (!actor.system.subattributes) actor.system.subattributes = {};
  if (!actor.system.subattributes.deslocamento) {
    actor.system.subattributes.deslocamento = { value: res.deslocamentoFinal };
  } else {
    actor.system.subattributes.deslocamento.value = res.deslocamentoFinal;
  }

  // Gerenciamento de condição Imobilizado
  if (res.imobilizado) {
    adicionarCondicao(actor, "Imobilizado");
  } else {
    removerCondicao(actor, "Imobilizado");
  }

  // Marcação em flags do ator para consulta de inaptidão física/agilidade
  if (!actor.flags) actor.flags = {};
  if (!actor.flags["mighty-blade"]) actor.flags["mighty-blade"] = {};
  actor.flags["mighty-blade"].sobrecarga = {
    sobrecarregado: res.sobrecarregado,
    imobilizado: res.imobilizado,
    inaptoFisicoAgilidade: res.inaptoFisicoAgilidade,
    fatorDeslocamento: res.fatorDeslocamento,
  };

  return res;
}

/**
 * ============================================================================
 * 2. CÁLCULO DE DANO POR QUEDA
 * ============================================================================
 *
 * Calcula o dano de uma queda com base na altura em metros e no personagem.
 *
 * Regras Canônicas:
 * - Dano base: 1d6 por metro de queda (ou N d6 para N metros).
 * - Se o ator for Metadílio com a habilidade "Balofo": divide o dano total da queda
 *   por 2 (Math.floor(dano / 2)).
 *
 * @param {number|object} metros Altura da queda em metros (ou Ator)
 * @param {object|number} actorOuDano Ator que sofreu a queda ou valor de dano pré-calculado
 * @param {object|number} [optionsOuDano] Opções ou dano pré-calculado
 * @returns {{
 *   metros: number,
 *   dados: number,
 *   formula: string,
 *   danoTotal: number,
 *   danoFinal: number,
 *   dano: number,
 *   reduzido: boolean,
 *   balofo: boolean,
 *   metadilio: boolean,
 *   valueOf: () => number
 * }}
 */
export function calcularDanoQueda(metros, actorOuDano, optionsOuDano = {}) {
  // Suporte caso o primeiro argumento seja o Ator: calcularDanoQueda(actor, danoBruto, opcoes)
  if (typeof metros === "object" && metros !== null) {
    const actorArg = metros._rawActor || metros;
    const danoBruto = typeof actorOuDano === "number" ? actorOuDano : Number(optionsOuDano?.danoTotal ?? 0);
    const metrosEstimados = Number(optionsOuDano?.metros ?? Math.max(1, Math.round(danoBruto / 3)));
    return calcularDanoQueda(metrosEstimados, actorArg, {
      ...(typeof optionsOuDano === "object" ? optionsOuDano : {}),
      danoTotal: danoBruto,
    });
  }

  const m = Math.max(0, Number(metros) || 0);
  const dados = Math.floor(m);
  const formula = `6 × metros`; // GB p.20: 6 pontos de Contusão/m (fixo, não d6)

  let actor = null;
  let danoFornecido = null;
  let options = {};

  // Suporte flexível a assinaturas:
  // 1. calcularDanoQueda(metros, actor, { danoTotal: 15 }) ou calcularDanoQueda(metros, actor, 15)
  // 2. calcularDanoQueda(metros, 15, actor)
  // 3. calcularDanoQueda(metros, null, { danoTotal: 15 })
  if (typeof actorOuDano === "number") {
    danoFornecido = actorOuDano;
    if (typeof optionsOuDano === "object" && optionsOuDano !== null) {
      if (optionsOuDano.system || optionsOuDano.items || optionsOuDano.habilidades) {
        actor = optionsOuDano;
      } else {
        options = optionsOuDano;
        actor = options.actor || null;
      }
    }
  } else {
    actor = (typeof actorOuDano === "object" && actorOuDano !== null) ? (actorOuDano._rawActor || actorOuDano) : null;
    if (typeof optionsOuDano === "number") {
      danoFornecido = optionsOuDano;
    } else if (typeof optionsOuDano === "object" && optionsOuDano !== null) {
      options = optionsOuDano;
      if (options.danoTotal !== undefined) danoFornecido = options.danoTotal;
      else if (options.dano !== undefined) danoFornecido = options.dano;
      else if (options.rolagem !== undefined) danoFornecido = options.rolagem;
      if (!actor && options.actor) actor = options.actor._rawActor || options.actor;
    }
  }

  // Determinação do dano bruto total
  let danoTotal = 0;
  if (danoFornecido !== null) {
    danoTotal = Math.max(0, Number(danoFornecido) || 0);
  } else if (options.danoFixoPorDado !== undefined) {
    danoTotal = dados * Math.max(1, Number(options.danoFixoPorDado) || 1);
  } else if (options.rolar === true) {
    for (let i = 0; i < dados; i++) {
      danoTotal += Math.floor(Math.random() * 6) + 1;
    }
  } else {
    // GB p.20: 6 pontos de Contusão por metro (fixo; dano determinístico, não aleatório)
    danoTotal = dados * 6;
  }

  // Se metros for 0, dano é 0
  if (m === 0) {
    danoTotal = 0;
  }

  // Verificação racial e de habilidade:
  // - "Asas" (Característica Dracônica): imune a dano de queda (danoFinal = 0).
  // - Metadílio com "Balofo": divide o dano total da queda por 2 (Math.floor(dano / 2)).
  const asas = temHabilidade(actor, "asas");
  const metadilio = isMetadilio(actor);
  const balofo = temHabilidade(actor, "balofo");
  const temReducaoBalofo = metadilio && balofo;

  const danoFinal = asas ? 0 : temReducaoBalofo ? Math.floor(danoTotal / 2) : danoTotal;

  return {
    metros: m,
    dados,
    formula,
    danoPorMetro: 6,           // GB p.20: fixo
    danoBase: danoTotal,
    danoTotal,
    danoFinal,
    dano: danoFinal,
    reduzido: temReducaoBalofo || asas,
    imuneQueda: asas,
    asas,
    balofo,
    metadilio,
    valueOf() {
      return this.danoFinal;
    },
    [Symbol.toPrimitive](hint) {
      return hint === "string" ? String(this.danoFinal) : this.danoFinal;
    },
  };
}

/**
 * Helper ergonômico para cálculo de dano de queda.
 * Quando chamado como calculateFallDamage(actor, danoBruto), retorna o valor numérico final (ex: Math.floor(danoBruto / 2) para Metadílio com Balofo).
 *
 * @param {object|number} actorOuMetros Ator ou altura em metros
 * @param {number|object} [danoBrutoOuActor=0] Dano bruto da queda ou Ator
 * @param {object} [opcoes={}] Opções adicionais
 * @returns {number} Dano final de queda
 */
export function calculateFallDamage(actorOuMetros, danoBrutoOuActor = 0, opcoes = {}) {
  if (typeof actorOuMetros === "object" && actorOuMetros !== null) {
    const res = calcularDanoQueda(1, actorOuMetros, {
      ...opcoes,
      danoTotal: Number(danoBrutoOuActor) || 0,
    });
    return opcoes.detalhado ? res : res.danoFinal;
  }
  const res = calcularDanoQueda(actorOuMetros, danoBrutoOuActor, opcoes);
  return opcoes.detalhado ? res : res.danoFinal;
}

/**
 * ============================================================================
 * 3. CÁLCULO DE FÔLEGO E SUFOCAMENTO
 * ============================================================================
 *
 * Calcula os turnos máximos de sustentação de respiração sob água ou fumaça.
 *
 * Regras Canônicas:
 * - Turnos máximos de sustentação sob água ou fumaça = Math.max(Força, Vontade).
 * - Se possuir a habilidade Anfíbio ou Fulgurante: fôlego é infinito
 *   (imune a sufocamento em água ou fumaça, respectivamente).
 *
 * @param {object} actor Ator para avaliação de atributos e habilidades
 * @param {object|string} [optionsOuAmbiente] Identificador do ambiente ("agua", "fumaca") ou opções
 * @returns {{
 *   forca: number,
 *   vontade: number,
 *   turnosBase: number,
 *   minutosMaximos: number,  // GB p.23: limite = Força (em minutos)
 *   turnos: number,
 *   turnosMaximos: number,
 *   folegoAgua: number,
 *   folegoFumaca: number,
 *   agua: number,
 *   fumaca: number,
 *   imune: boolean,
 *   imuneAgua: boolean,
 *   imuneFumaca: boolean,    // sempre false — Fulgurante NÃO isenta de sufocamento (GB p.61)
 *   anfibio: boolean,
 *   fulgurante: boolean,
 *   ambiente: string,
 *   valueOf: () => number
 * }}
 */
export function calcularFolegoSufocamento(actor, optionsOuAmbiente = {}) {
  const rawActor = actor?._rawActor || actor;
  let ambiente = "";
  let options = {};

  if (typeof optionsOuAmbiente === "string") {
    ambiente = normalizarTexto(optionsOuAmbiente);
  } else if (typeof optionsOuAmbiente === "object" && optionsOuAmbiente !== null) {
    options = optionsOuAmbiente;
    ambiente = normalizarTexto(options.ambiente || "");
  }

  // Extração dos atributos Força e Vontade
  const attrs = rawActor?.system?.attributes || rawActor?.attributes || {};
  const forca = Math.max(
    0,
    Number(attrs.forca?.value ?? attrs.forca?.base ?? attrs.forca ?? rawActor?.forca ?? 0)
  );
  const vontade = Math.max(
    0,
    Number(attrs.vontade?.value ?? attrs.vontade?.base ?? attrs.vontade ?? rawActor?.vontade ?? 0)
  );

  // GB p.23: Pode prender a respiração por Força MINUTOS (não Vontade, não turnos)
  const turnosBase = forca; // "turnosBase" mantido por compatibilidade; semântica = minutosMaximos

  // Verificação das habilidades canônicas (incluindo Barbatanas da Origem Dracônica)
  const barbatanas = temHabilidade(rawActor, "barbatanas");
  const anfibio = temHabilidade(rawActor, "anfibio") || barbatanas;
  const fulgurante = temHabilidade(rawActor, "fulgurante");

  // Capacidade em cada meio:
  // Anfíbio / Barbatanas confere respiração aquática irrestrita (fôlego infinito em água)
  const folegoAgua = anfibio ? Infinity : turnosBase;
  // Fulgurante (GB p.61): visão no escuro + imune a efeitos de visão. NÃO isenta de sufocamento.
  const folegoFumaca = turnosBase; // sem isenção canônica por fumaça

  // Determinação para o ambiente consultado
  let turnos = turnosBase;
  let imune = false;

  if (ambiente === "agua" || ambiente === "submerso" || ambiente === "aquatico") {
    turnos = folegoAgua;
    imune = anfibio;
  } else if (ambiente === "fumaca" || ambiente === "gas" || ambiente === "incendio") {
    turnos = folegoFumaca;
    imune = fulgurante;
  } else {
    // Ambiente genérico ou não especificado: se tiver Anfíbio ou Fulgurante, sinaliza nas flags específicas
    turnos = turnosBase;
    imune = false;
  }

  return {
    forca,
    vontade,
    turnosBase,
    minutosMaximos: turnosBase,  // GB p.23: limite = Força (em minutos)
    turnos,
    turnosMaximos: turnos,
    folegoAgua,
    folegoFumaca,
    agua: folegoAgua,
    fumaca: folegoFumaca,
    imune,
    imuneAgua: anfibio,
    imuneFumaca: false,          // GB p.61: Fulgurante NÃO concede isenção de sufocamento
    anfibio,
    barbatanas,
    fulgurante: false,      // GB p.61: Fulgurante NÃO concede isenção de sufocamento
    temFulgurante: fulgurante,  // true se o ator possui a habilidade
    ambiente,
    valueOf() {
      return this.turnos;
    },
    [Symbol.toPrimitive](hint) {
      return hint === "string" ? String(this.turnos) : this.turnos;
    },
  };
}

/**
 * Processa a passagem de turnos sem respirar sob água ou fumaça, aplicando
 * exaustão e perda automática de PV ao ultrapassar o limite de turnos.
 *
 * @param {object} actor Personagem ou Ator
 * @param {number} turnosSemRespirar Quantidade de turnos decorridos sem respirar
 * @param {string|object} [ambienteOuOpcoes="agua"] Ambiente ("agua" ou "fumaca") ou objeto de opções
 * @param {object} [opcoes={}] Opções adicionais ({ danoPorTurno: 5, aplicar: true })
 * @returns {object} Resultado do sufocamento
 */
export function processarSufocamento(actor, turnosSemRespirar, ambienteOuOpcoes = "agua", opcoes = {}) {
  const rawActor = actor?._rawActor || actor;
  const opts = typeof ambienteOuOpcoes === "object" && ambienteOuOpcoes !== null
    ? ambienteOuOpcoes
    : { ambiente: ambienteOuOpcoes, ...opcoes };

  const amb = normalizarTexto(opts.ambiente || "agua");
  const infoFolego = calcularFolegoSufocamento(rawActor, amb);

  // GB p.23/p.61: Anfíbio isenta de água; Fulgurante NÃO isenta de sufocamento (apenas visão)
  const isento =
    infoFolego.imune ||
    (amb === "agua" && infoFolego.anfibio);
    // Fulgurante removido: GB p.61 não menciona respiração

  const turnosDecorridos = Math.max(0, Number(turnosSemRespirar) || 0);
  const limiteTurnos = isento ? Infinity : infoFolego.turnosBase;
  const turnosExcedentes = isento ? 0 : Math.max(0, turnosDecorridos - limiteTurnos);
  const sufocando = turnosExcedentes > 0;
  const danoPorTurno = Number(opts.danoPorTurno ?? 5);
  const danoTotal = sufocando ? turnosExcedentes * danoPorTurno : 0;

  if (sufocando && rawActor && opts.aplicar !== false) {
    adicionarCondicao(rawActor, "Exausto");
    if (rawActor.system?.resources?.vida) {
      rawActor.system.resources.vida.value = Math.max(
        0,
        Number(rawActor.system.resources.vida.value ?? 60) - danoTotal
      );
    }
  }

  return {
    ambiente: amb,
    turnosDecorridos,
    minutosDecorridos: turnosDecorridos,       // alias semântico (GB: minutos, não turnos)
    limiteTurnos,
    minutosMaximos: limiteTurnos,              // GB p.23: limite = Força minutos
    turnosExcedentes,
    isento,
    imune: isento,
    sufocando,
    requerTeste: !isento && sufocando,             // GB p.23: exige teste dif.12 além do limite
    dificuldadeTeste: !isento ? 12 : null,     // GB p.23: dif.12 por minuto além do limite
    exausto: sufocando,
    danoPorTurno: sufocando ? danoPorTurno : 0,
    danoSufocamento: danoTotal,
    danoTotal,
  };
}

/**
 * Atalho para calcular o fôlego sob água.
 * @param {object} actor
 * @returns {number} Turnos máximos ou Infinity
 */
export function calcularFolegoAgua(actor) {
  return calcularFolegoSufocamento(actor, "agua").turnos;
}

/**
 * Atalho para calcular o fôlego sob fumaça.
 * @param {object} actor
 * @returns {number} Turnos máximos ou Infinity
 */
export function calcularFolegoFumaca(actor) {
  return calcularFolegoSufocamento(actor, "fumaca").turnos;
}

