/**
 * Módulo de Regras Canônicas de Estatísticas Derivadas do Mighty Blade 3ª Edição.
 *
 * Implementa os cálculos canônicos:
 * - Caso 6: Pontos de Vida (PV) Iniciais (60 base + bônus de Habilidades)
 * - Caso 7: Pontos de Mana (PM) Iniciais (60 base + bônus de Habilidades)
 * - Caso 8: Carga Básica (Força x 10 kg regra básica / Força x 20 kg Manual do Combatente)
 * - Caso 9: Deslocamento Padrão (Agilidade / 2 + 4 + bônus de Raça)
 * - Caso 10: Determinação (Vontade + Bônus de Habilidades)
 * - Caso 11: Defesa Base (Padrão 5; Nanismo 6; Forma da Raposa 7 — maior substitui)
 * - Caso 12: Cálculo da Esquiva (Defesa Base + Agilidade + Bônus de Armadura + Bônus de Esquiva)
 * - Caso 13: Cálculo do Bloqueio (Defesa Base + Força + Bônus de Armadura + Bônus de Escudo/Bloqueio)
 */

import { calcularEquipamento } from "./equipamento.mjs";

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
 * Retorna a lista de itens de um ator como um array simples.
 * @param {object} actor
 * @returns {object[]}
 */
export function obterItensAtor(actor) {
  if (!actor?.items) return [];
  if (Array.isArray(actor.items)) return actor.items;
  if (typeof actor.items.values === "function") return Array.from(actor.items.values());
  return [];
}

/**
 * Extrai todos os efeitos declarativos (system.efeitos[]) ou legados dos itens do ator.
 * @param {object} actor
 * @returns {object[]}
 */
export function extrairEfeitos(actor) {
  const items = obterItensAtor(actor);
  const efeitos = [];

  for (const item of items) {
    const list = item.system?.efeitos;
    if (Array.isArray(list) && list.length) {
      for (const ef of list) {
        efeitos.push({ ...ef, sourceItem: item });
      }
    }
    const b = item.system?.bonusAtributo;
    if (b?.atributo) {
      efeitos.push({
        tipo: "bonusAtributo",
        atributo: b.atributo,
        valor: Number(b.valor) || 0,
        sourceItem: item,
      });
    }
  }

  return efeitos;
}

/**
 * Caso 6: Pontos de Vida (PV) Iniciais
 * Personagem Nível 1 inicia com 60 PV (base) + bônus de Habilidades.
 * Habilidades conhecidas: Durão (+5 PV), Sangue Orc (+10 PV), Vitalidade de Gigante (+10 PV), etc.
 * @param {object} actor
 * @returns {{ base: number, bonus: number, max: number, value: number }}
 */
export function calcularPV(actor) {
  const nivel = Number(actor?.system?.details?.nivel ?? 1);
  let base = 60;
  if (nivel === 0) {
    base = actor?.system?.details?.classe ? 40 : 30;
  }

  const items = obterItensAtor(actor);
  const efeitos = extrairEfeitos(actor);
  let bonus = 0;

  // 1. Efeitos declarativos do tipo 'bonusPV'
  const processados = new Set();
  for (const ef of efeitos) {
    if (ef.tipo === "bonusPV") {
      bonus += Number(ef.valor) || 0;
      if (ef.sourceItem) processados.add(ef.sourceItem);
    }
  }

  // 2. Fallback por nome/descrição para habilidades canônicas
  for (const item of items) {
    if (processados.has(item)) continue;
    const nomeNorm = normalizarTexto(item.name);
    const desc = normalizarTexto(item.system?.description || "");

    if (nomeNorm === "durao") {
      bonus += 5;
    } else if (nomeNorm === "sangue orc") {
      bonus += 10;
    } else if (nomeNorm === "vitalidade de gigante" || nomeNorm === "vitalidade") {
      bonus += 10;
    } else {
      // Regex para encontrar menções explícitas como "+5 pontos de vida", "+10 pv"
      const match = desc.match(/\+(\d+)\s*(?:pontos de vida|pv\b)/i);
      if (match) {
        bonus += Number(match[1]) || 0;
      }
    }
  }

  const max = base + bonus;
  return {
    base,
    bonus,
    max,
    value: max,
  };
}

/**
 * Caso 7: Pontos de Mana (PM) Iniciais
 * Personagem Nível 1 inicia com 60 PM (base) + bônus de Habilidades.
 * Habilidades conhecidas: Mente Expandida (+10 PM), Reserva Mística (+10 PM), etc.
 * @param {object} actor
 * @returns {{ base: number, bonus: number, max: number, value: number }}
 */
export function calcularPM(actor) {
  const nivel = Number(actor?.system?.details?.nivel ?? 1);
  let base = 60;
  if (nivel === 0) {
    base = actor?.system?.details?.classe ? 40 : 30;
  }

  const items = obterItensAtor(actor);
  const efeitos = extrairEfeitos(actor);
  let bonus = 0;

  // 1. Efeitos declarativos do tipo 'bonusPM'
  const processados = new Set();
  for (const ef of efeitos) {
    if (ef.tipo === "bonusPM") {
      bonus += Number(ef.valor) || 0;
      if (ef.sourceItem) processados.add(ef.sourceItem);
    }
  }

  // 2. Fallback por nome/descrição para habilidades canônicas
  for (const item of items) {
    if (processados.has(item)) continue;
    const nomeNorm = normalizarTexto(item.name);
    const desc = normalizarTexto(item.system?.description || "");

    if (
      nomeNorm === "reserva mistica" ||
      nomeNorm === "foco arcano" ||
      nomeNorm === "dom arcano"
    ) {
      bonus += 10; // GB: +10 PM
    } else if (
      nomeNorm === "heranca feerica" ||
      nomeNorm === "intelecto elfico"
    ) {
      bonus += 5; // GB p.52: +5 PM cada (não +10)
    } else {
      const match = desc.match(/\+(\d+)\s*(?:pontos de mana|pm\b)/i);
      if (match) {
        bonus += Number(match[1]) || 0;
      }
    }
  }

  const max = base + bonus;
  return {
    base,
    bonus,
    max,
    value: max,
  };
}

/**
 * Caso 8: Carga Básica
 * Força x 10 kg (regra padrão) ou Força x 20 kg no Manual do Combatente.
 * Habilidades como "Coração da Montanha" ou efeito 'cargaComoForca' somam na Força de carga.
 * @param {object} actor
 * @param {object} [options]
 * @param {boolean} [options.manualDoCombatente=false] Se true, usa o multiplicador 20 kg
 * @returns {{
 *   forcaEfetiva: number,
 *   basica: number,
 *   basicaPadrao: number,
 *   basicaCombatente: number,
 *   maximaPadrao: number,
 *   maximaCombatente: number,
 *   max: number
 * }}
 */
export function calcularCarga(actor, { manualDoCombatente = false } = {}) {
  const attrs = actor?.system?.attributes || {};
  const forca = Number(attrs.forca?.value ?? attrs.forca?.base ?? 0);
  const items = obterItensAtor(actor);
  const efeitos = extrairEfeitos(actor);

  let bonusForcaCarga = 0;
  const processados = new Set();
  for (const ef of efeitos) {
    if (ef.tipo === "cargaComoForca") {
      bonusForcaCarga += Number(ef.valor) || 0;
      if (ef.sourceItem) processados.add(ef.sourceItem);
    }
  }

  for (const item of items) {
    if (processados.has(item)) continue;
    const nomeNorm = normalizarTexto(item.name);
    if (nomeNorm === "coracao da montanha") {
      bonusForcaCarga += 2;
    }
  }

  const forcaEfetiva = forca + bonusForcaCarga;
  const basicaPadrao = forcaEfetiva * 7;   // GB p.21: FOR×7 kg
  const basicaCombatente = forcaEfetiva * 20;  // MC: FOR×20 kg
  const pesadaPadrao = forcaEfetiva * 35;    // GB p.21: FOR×35 kg (sobrecarregado)
  const maximaPadrao = forcaEfetiva * 70;    // GB p.21: FOR×70 kg (imobilizado)
  const maximaCombatente = forcaEfetiva * 40;

  const basica = manualDoCombatente ? basicaCombatente : basicaPadrao;
  const max = basica;

  return {
    forcaEfetiva,
    basica,
    basicaPadrao,                // GB p.21: FOR×7 kg
    basicaCombatente,
    pesadaPadrao,                // GB p.21: FOR×35 kg (limiar sobrecarregado)
    maximaPadrao,               // GB p.21: FOR×70 kg (limiar imobilizado)
    maximaCombatente,
    max,
  };
}

/**
 * Caso 9: Deslocamento Padrão
 * Calculado a partir da Agilidade: floor(Agilidade / 2) + 4.
 * Bônus de Raça (+1 para Fauno, Tailox, Gnoll, etc.).
 * Habilidades canônicas: "Patas com Cascos" (Fauno), "Pernas Vulpinas" (Tailox), "Salteador" (Gnoll).
 * @param {object} actor
 * @returns {{ base: number, bonus: number, value: number }}
 */
export function calcularDeslocamento(actor) {
  const attrs = actor?.system?.attributes || {};
  const agi = Number(attrs.agilidade?.value ?? attrs.agilidade?.base ?? 0);
  const base = Math.floor(agi / 2) + 5; // GB p.19: ⌊AGI/2⌋ + 5

  const items = obterItensAtor(actor);
  const efeitos = extrairEfeitos(actor);
  let bonus = 0;

  const processados = new Set();
  for (const ef of efeitos) {
    if (ef.tipo === "bonusDeslocamento") {
      bonus += Number(ef.valor) || 0;
      if (ef.sourceItem) processados.add(ef.sourceItem);
    }
  }

  // Verifica raça e habilidades raciais
  const racaNome = normalizarTexto(actor?.system?.details?.raca || "");
  const racaDoc = items.find((i) => i.type === "raca");
  const racaDocNome = racaDoc ? normalizarTexto(racaDoc.name) : "";

  let temBonusRacial = false;
  if (
    racaNome === "fauno" ||
    racaDocNome === "fauno" ||
    racaNome === "tailox" ||
    racaDocNome === "tailox" ||
    racaNome === "gnoll" ||
    racaDocNome === "gnoll"
  ) {
    temBonusRacial = true;
  }

  for (const item of items) {
    if (processados.has(item)) continue;
    const nomeNorm = normalizarTexto(item.name);
    if (
      nomeNorm === "patas com cascos" ||
      nomeNorm === "pernas vulpinas" ||
      nomeNorm === "salteador" ||
      nomeNorm === "passo das planicies" ||
      nomeNorm === "passo veloz"
    ) {
      bonus += 1;
      temBonusRacial = false; // Já contabilizado via habilidade
    }
  }

  if (temBonusRacial) {
    bonus += 1;
  }

  return {
    base,
    bonus,
    value: base + bonus,
  };
}

/**
 * Caso 10: Determinação
 * Valor de Vontade + Bônus de Habilidades (ex.: Durão +2, Cabeça Dura +2, Pacto da Loucura +2).
 * @param {object} actor
 * @returns {{ value: number, vontade: number, bonus: number, estatica: number }}
 */
export function calcularDeterminacao(actor) {
  const attrs = actor?.system?.attributes || {};
  const von = Number(attrs.vontade?.value ?? attrs.vontade?.base ?? 0);
  const int = Number(attrs.inteligencia?.value ?? attrs.inteligencia?.base ?? 0);

  const items = obterItensAtor(actor);
  const efeitos = extrairEfeitos(actor);
  let bonus = 0;

  const processados = new Set();
  for (const ef of efeitos) {
    if (ef.tipo === "bonusDefesa" && ef.defesa === "determinacao") {
      bonus += Number(ef.valor) || 0;
      if (ef.sourceItem) processados.add(ef.sourceItem);
    }
  }

  for (const item of items) {
    if (processados.has(item)) continue;
    const nomeNorm = normalizarTexto(item.name);
    const desc = normalizarTexto(item.system?.description || "");

    if (nomeNorm === "durao") {
      bonus += 2;
    } else if (nomeNorm === "cabeca dura") {
      bonus += 2;
    } else if (nomeNorm === "pacto da loucura" || nomeNorm === "espelhar loucura") {
      bonus += 2;
    } else {
      const match = desc.match(/determinacao\s*\+(\d+)/i);
      if (match) {
        bonus += Number(match[1]) || 0;
      }
    }
  }

  return {
    value: 8 + Math.max(von, int) + bonus, // GB p.36: 8 + maior(VON, INT) + bônus
    vontade: von,
    inteligencia: int,
    bonus,
    estatica: 8 + Math.max(von, int) + bonus,
  };
}

/**
 * Caso 11: Defesa Base
 * Padrão: 5.
 * Nanismo: 6.
 * Forma da Raposa (Tailox): 7.
 * Regra canônica: Não acumulam, o maior substitui (Math.max).
 * @param {object} actor
 * @returns {number}
 */
export function calcularDefesaBase(actor) {
  let base = 5;

  const items = obterItensAtor(actor);
  const efeitos = extrairEfeitos(actor);

  for (const ef of efeitos) {
    if (ef.tipo === "defesaBase") {
      const val = Number(ef.valor) || 0;
      if (val > base) base = val;
    }
  }

  for (const item of items) {
    const nomeNorm = normalizarTexto(item.name);
    const slug = normalizarTexto(item.flags?.["mighty-blade"]?.slug || "");

    if (nomeNorm === "nanismo" || slug === "nanismo") {
      base = Math.max(base, 6);
    } else if (
      nomeNorm === "forma da raposa" ||
      slug === "forma-da-raposa" ||
      nomeNorm.includes("forma da raposa")
    ) {
      base = Math.max(base, 7);
    }
  }

  return base;
}

/**
 * Caso 12: Cálculo da Esquiva
 * Defesa Base + Agilidade + Bônus de Armadura + Bônus de Esquiva.
 * @param {object} actor
 * @returns {{
 *   value: number,
 *   defesaBase: number,
 *   agilidade: number,
 *   bonusArmadura: number,
 *   bonusEsquiva: number
 * }}
 */
export function calcularEsquiva(actor) {
  const attrs = actor?.system?.attributes || {};
  const agi = Number(attrs.agilidade?.value ?? attrs.agilidade?.base ?? 0);
  const defesaBase = calcularDefesaBase(actor);

  const eq = calcularEquipamento(actor);
  const bonusArmadura = eq.bonusArmadura ?? 0;

  const efeitos = extrairEfeitos(actor);
  let bonusEsquiva = 0;
  for (const ef of efeitos) {
    if (ef.tipo === "bonusDefesa" && ef.defesa === "esquiva") {
      bonusEsquiva += Number(ef.valor) || 0;
    }
  }

  const items = obterItensAtor(actor);
  for (const item of items) {
    const nomeNorm = normalizarTexto(item.name);
    if (nomeNorm === "reflexos rapidos" || nomeNorm === "dancarino do ar") {
      bonusEsquiva += 1;
    }
  }

  const value = defesaBase + agi + bonusArmadura + bonusEsquiva;

  return {
    value,
    defesaBase,
    agilidade: agi,
    bonusArmadura,
    bonusEsquiva,
  };
}

/**
 * Caso 13: Cálculo do Bloqueio
 * Defesa Base + Força + Bônus de Armadura + Bônus de Escudo/Bloqueio.
 * @param {object} actor
 * @returns {{
 *   value: number,
 *   defesaBase: number,
 *   forca: number,
 *   bonusArmadura: number,
 *   bonusEscudo: number,
 *   bonusBloqueio: number
 * }}
 */
export function calcularBloqueio(actor) {
  const attrs = actor?.system?.attributes || {};
  const forca = Number(attrs.forca?.value ?? attrs.forca?.base ?? 0);
  const defesaBase = calcularDefesaBase(actor);

  const eq = calcularEquipamento(actor);
  const bonusArmadura = eq.bonusArmadura ?? 0;
  const bonusEscudo = eq.bonusEscudo ?? 0;

  const efeitos = extrairEfeitos(actor);
  let bonusBloqueio = 0;
  for (const ef of efeitos) {
    if (ef.tipo === "bonusDefesa" && ef.defesa === "bloqueio") {
      bonusBloqueio += Number(ef.valor) || 0;
    }
  }

  const items = obterItensAtor(actor);
  for (const item of items) {
    const nomeNorm = normalizarTexto(item.name);
    if (nomeNorm === "mestre em escudo" || nomeNorm === "bloqueio aprimorado") {
      bonusBloqueio += 1;
    }
  }

  const value = defesaBase + forca + bonusArmadura + bonusEscudo + bonusBloqueio;

  return {
    value,
    defesaBase,
    forca,
    bonusArmadura,
    bonusEscudo,
    bonusBloqueio,
  };
}

/**
 * Agrega e aplica todos os cálculos de estatísticas derivadas a uma ficha de personagem.
 * @param {object} actor
 * @param {object} [options]
 * @returns {object} Resumo das estatísticas calculadas
 */
export function calcularEstatisticasDerivadas(actor, options = {}) {
  const pv = calcularPV(actor);
  const pm = calcularPM(actor);
  const carga = calcularCarga(actor, options);
  const desl = calcularDeslocamento(actor);
  const defBase = calcularDefesaBase(actor);
  const det = calcularDeterminacao(actor);
  const esq = calcularEsquiva(actor);
  const bloq = calcularBloqueio(actor);
  const eq = calcularEquipamento(actor);

  if (actor.system) {
    actor.system.resources = actor.system.resources || {};
    actor.system.resources.vida = actor.system.resources.vida || { value: pv.max, max: pv.max };
    actor.system.resources.vida.max = pv.max;

    actor.system.resources.mana = actor.system.resources.mana || { value: pm.max, max: pm.max };
    actor.system.resources.mana.max = pm.max;

    actor.system.defesas = actor.system.defesas || {};
    actor.system.defesas.defesaBase = defBase;
    actor.system.defesas.bloqueio = { value: bloq.value, ...(bloq) };
    actor.system.defesas.esquiva = { value: esq.value, ...(esq) };
    actor.system.defesas.determinacao = { value: det.value, ...(det) };
    actor.system.defesas.rd = { value: eq.rd };

    actor.system.subattributes = actor.system.subattributes || {};
    actor.system.subattributes.deslocamento = { value: desl.value, ...(desl) };
    actor.system.subattributes.corrida = { value: desl.value * (eq.fatorCorrida || 4) };
    actor.system.subattributes.carga = {
      value: actor.system.subattributes.carga?.value ?? 0,
      basica: carga.basica,
      max: carga.basica,
      basicaPadrao: carga.basicaPadrao,
      basicaCombatente: carga.basicaCombatente,
      maxima: carga.maximaPadrao,
      maxCombatente: carga.maximaCombatente,
    };
    actor.system.equipamento = eq;
  }

  return {
    pv,
    pm,
    carga,
    deslocamento: desl,
    defesaBase: defBase,
    determinacao: det,
    esquiva: esq,
    bloqueio: bloq,
    equipamento: eq,
  };
}
