/**
 * Módulo de Regras Canônicas de Magia, Conjuração, Sintonização e Grimórios.
 * Mighty Blade 3ª Edição.
 *
 * Implementa as regras canônicas do Bloco 8:
 * - Sub-módulo 8.1 / Caso 40: Reduções e Piso de Custo de Mana (calcularCustoMana)
 * - Sub-módulo 8.2 / Caso 41 & 42: Dificuldade de Magia e Inaptidão por Armadura (calcularDificuldadeMagia, verificarInaptidaoConjuracao)
 * - Sub-módulo 8.3 / Caso 43: Sintonização de Equipamentos Mágicos & Gemas (verificarSintonizacao, sintonizarItem, executarRitualSintonizacao, calcularBonusCerneMagico)
 * - Sub-módulo 8.4 / Caso 44: Itens de Registro e Grimórios Superiores (validarRegistroGrimorio, registrarMagiaGrimorio, validarConjuracaoMagia)
 * - Sub-módulo 8.5 / Caso 45: Símbolos Profanos e Dreno de Vida (calcularCustoSimboloProfano, aplicarCustoSimboloProfano)
 */

import { normalizarTexto, verificarFN } from "./equipamento.mjs";

/* ------------------------------------------------------------------------- */
/* CONSTANTES CANÔNICAS DE MAGIA E SINTONIZAÇÃO                              */
/* ------------------------------------------------------------------------- */

export const DIFICULDADE_SINTONIZACAO = 8;
export const CUSTO_PM_SINTONIZACAO = 0;
export const REDUCAO_PM_FOCO_MAGICO = 5;
export const REDUCAO_PM_TATUAGEM_TOHUNGA = 5;
export const REDUCAO_DIFICULDADE_ASSESTE_MAGICO = 1;
export const REDUCAO_DIFICULDADE_ISNUU = 1;
export const REDUCAO_DIFICULDADE_DOM_DA_MAGIA = 1;
export const REDUCAO_DIFICULDADE_TATUAGEM_TOHUNGA = 1;
export const BONUS_DANO_CERNE_ARCANO = 5;
export const BONUS_CURA_CERNE_MISTICO = 5;
export const CUSTO_PV_SIMBOLO_PROFANO = 5;
export const PISO_MINIMO_MANA = 1;

/** Propriedades de gemas/encantamento que exigem sintonização ativa para funcionar */
export const PROPRIEDADES_GEMAS = [
  "asseste magico",
  "cerne arcano",
  "foco magico",
  "cerne mistico",
];

/** Classes com tradição de conjuração mágica */
export const CLASSES_CONJURADORAS_CANONICAS = [
  "feiticeiro",
  "necromante",
  "sacerdote",
  "druida",
  "dracomante",
  "xama",
  "runico",
];

/** Classes com treinamento marcial/mágico integrado para uso de armadura */
export const CLASSES_TREINO_ARMADURA_CONJURACAO = [
  "runico",
  "paladino",
];

/**
 * Helper interno para extrair lista de itens de um ator (suporta Array ou Collection do Foundry).
 * @param {object} actor
 * @returns {Array<object>}
 */
function extrairItensAtor(actor) {
  if (!actor) return [];
  if (Array.isArray(actor.items)) return actor.items;
  if (actor.items && typeof actor.items.values === "function") {
    return Array.from(actor.items.values());
  }
  if (Array.isArray(actor.abilities)) return actor.abilities;
  return [];
}

/**
 * Verifica se a magia ou o conjurador possui o benefício de Tatuagem de Tohunga / Magia Tatuada.
 * @param {object} magia
 * @param {object} actor
 * @param {object} modificadores
 * @returns {boolean}
 */
function possuiBeneficioTatuagemTohunga(magia, actor, modificadores) {
  if (
    modificadores &&
    typeof modificadores === "object" &&
    (modificadores.tatuagemTohunga || modificadores.magiaTatuada)
  ) {
    return true;
  }

  if (magia && typeof magia === "object") {
    const sys = magia.system || {};
    const flags = magia.flags?.["mighty-blade"] || {};
    if (
      Boolean(
        sys.tatuada ||
        sys.tatuagemTohunga ||
        magia.tatuada ||
        magia.tatuagemTohunga ||
        flags.tatuada ||
        flags.tatuagemTohunga
      )
    ) {
      return true;
    }
  }

  if (actor) {
    const rawItems = extrairItensAtor(actor);
    const nomeMagiaNorm = normalizarTexto(magia?.name || "");
    for (const item of rawItems) {
      const nomeItem = normalizarTexto(item.name || "");
      if (
        nomeItem === "tatuagem de tohunga" ||
        nomeItem === "magia tatuada" ||
        (nomeMagiaNorm && nomeItem === `tatuagem: ${nomeMagiaNorm}`) ||
        Boolean(item.system?.tatuagemTohunga)
      ) {
        return true;
      }
    }

    const tatuagensAtor =
      actor.system?.tatuagens ||
      actor.flags?.["mighty-blade"]?.tatuagens ||
      [];
    if (Array.isArray(tatuagensAtor) && nomeMagiaNorm) {
      if (
        tatuagensAtor.some(
          (t) => normalizarTexto(typeof t === "string" ? t : t?.name || t?.magia || "") === nomeMagiaNorm
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

/* ------------------------------------------------------------------------- */
/* SUB-MÓDULO 8.3 / CASO 43: SINTONIZAÇÃO DE EQUIPAMENTOS MÁGICOS & GEMAS    */
/* ------------------------------------------------------------------------- */

/**
 * Verifica se um item mágico está sintonizado com o personagem atual e determina
 * quais propriedades estão ativas ou inativas.
 *
 * Regras Canônicas:
 * - A sintonização é realizada via Runa Pessoal (Arcana) ou Selo Simples (Mística).
 * - Dificuldade base do teste: 8.
 * - Custo em Pontos de Mana: 0 PM.
 * - Propriedades de gemas (Asseste Mágico, Cerne Arcano, Foco Mágico, Cerne Místico)
 *   NÃO funcionam se o item não estiver sintonizado pelo portador atual.
 *
 * @param {object} itemMagico Item do tipo equipamento, arma ou foco
 * @param {object} [actor] Personagem que empunha ou avalia o item
 * @returns {{
 *   sintonizado: boolean,
 *   dificuldade: number,
 *   custoPM: number,
 *   metodo: string,
 *   propriedadesAtivas: string[],
 *   propriedadesInativas: string[],
 *   portadorAtual: string|null
 * }}
 */
export function verificarSintonizacao(itemMagico, actor = null) {
  if (!itemMagico) {
    return {
      sintonizado: false,
      dificuldade: DIFICULDADE_SINTONIZACAO,
      custoPM: CUSTO_PM_SINTONIZACAO,
      metodo: "Runa Pessoal",
      propriedadesAtivas: [],
      propriedadesInativas: [],
      portadorAtual: null,
    };
  }

  const sys = itemMagico.system || {};
  const flags = itemMagico.flags?.["mighty-blade"] || {};

  // Determina método de sintonização (Runa Pessoal para Arcano, Selo Simples para Místico)
  const classeNome = normalizarTexto(actor?.system?.details?.classe || actor?.classId || "");
  const caminhoNome = normalizarTexto(actor?.system?.details?.caminho || "");
  const isMistico =
    classeNome === "sacerdote" ||
    classeNome === "druida" ||
    classeNome === "xama" ||
    classeNome === "dracomante" ||
    caminhoNome.includes("mistico");

  const metodo = isMistico ? "Selo Simples" : "Runa Pessoal";

  // Estado de sintonização gravado no item
  const rawSintonizado = sys.sintonizado ?? flags.sintonizado ?? itemMagico.sintonizado ?? false;
  const sintonizadoCom = sys.sintonizadoCom || flags.sintonizadoCom || itemMagico.sintonizadoCom || null;

  let isSintonizado = Boolean(rawSintonizado);

  // Se houver um personagem avaliando, valida a identidade do portador sintonizado
  if (actor) {
    const actorId = actor.id || actor._id || null;
    const actorName = actor.name || null;

    if (sintonizadoCom) {
      const matchId = actorId && sintonizadoCom === actorId;
      const matchName = actorName && normalizarTexto(sintonizadoCom) === normalizarTexto(actorName);
      if (!matchId && !matchName) {
        // O item está sintonizado, mas com OUTRO portador!
        isSintonizado = false;
      }
    } else if (rawSintonizado) {
      isSintonizado = true;
    }
  }

  // Separação de propriedades ativas e inativas (gemas exigem sintonização)
  const todasPropriedades = Array.isArray(sys.propriedades)
    ? [...sys.propriedades]
    : (Array.isArray(itemMagico.propriedades) ? [...itemMagico.propriedades] : []);

  const propriedadesAtivas = [];
  const propriedadesInativas = [];

  for (const prop of todasPropriedades) {
    const propNorm = normalizarTexto(prop);
    const isGemaProp = PROPRIEDADES_GEMAS.some((g) => propNorm === g || propNorm.includes(g));

    if (isGemaProp) {
      if (isSintonizado) {
        propriedadesAtivas.push(prop);
      } else {
        propriedadesInativas.push(prop);
      }
    } else {
      // Propriedades estruturais (Canalizador, Registro, Duas Mãos, etc.) permanecem no item
      propriedadesAtivas.push(prop);
    }
  }

  return {
    sintonizado: isSintonizado,
    dificuldade: DIFICULDADE_SINTONIZACAO,
    custoPM: CUSTO_PM_SINTONIZACAO,
    metodo,
    propriedadesAtivas,
    propriedadesInativas,
    portadorAtual: actor?.name || null,
  };
}

/**
 * Sintoniza um item mágico com um personagem (via Runa Pessoal ou Selo Simples).
 * @param {object} itemMagico
 * @param {object} actor
 * @param {object} [options]
 * @param {string} [options.metodo]
 * @returns {object} Item atualizado
 */
export function sintonizarItem(itemMagico, actor, { metodo = null } = {}) {
  if (!itemMagico) return null;
  itemMagico.system = itemMagico.system || {};

  const info = verificarSintonizacao(itemMagico, actor);
  const metodoFinal = metodo || info.metodo;

  itemMagico.system.sintonizado = true;
  itemMagico.system.sintonizadoCom = actor?.id || actor?._id || actor?.name || "portador";
  itemMagico.system.metodoSintonizacao = metodoFinal;

  if (itemMagico.flags) {
    itemMagico.flags["mighty-blade"] = itemMagico.flags["mighty-blade"] || {};
    itemMagico.flags["mighty-blade"].sintonizado = true;
    itemMagico.flags["mighty-blade"].sintonizadoCom = itemMagico.system.sintonizadoCom;
  }

  return itemMagico;
}

/**
 * Executa o Ritual de Sintonização (Runa Pessoal / Selo Simples) contra Dificuldade 8 e custo 0 PM.
 * @param {object} itemMagico
 * @param {object} actor
 * @param {object} [options]
 * @param {number} [options.totalRolado=8] Resultado do teste de conjuração (padrão 8 = sucesso)
 * @returns {{
 *   sucesso: boolean,
 *   dificuldade: number,
 *   custoPM: number,
 *   metodo: string,
 *   sintonizado: boolean,
 *   propriedadesAtivas: string[],
 *   propriedadesInativas: string[]
 * }}
 */
export function executarRitualSintonizacao(itemMagico, actor, { totalRolado = DIFICULDADE_SINTONIZACAO } = {}) {
  const infoInicial = verificarSintonizacao(itemMagico, actor);
  const sucesso = Number(totalRolado) >= DIFICULDADE_SINTONIZACAO;

  if (sucesso && itemMagico) {
    sintonizarItem(itemMagico, actor, { metodo: infoInicial.metodo });
  } else if (itemMagico) {
    itemMagico.system = itemMagico.system || {};
    itemMagico.system.sintonizado = false;
  }

  const infoFinal = verificarSintonizacao(itemMagico, actor);
  return {
    sucesso,
    dificuldade: DIFICULDADE_SINTONIZACAO,
    custoPM: CUSTO_PM_SINTONIZACAO,
    metodo: infoFinal.metodo,
    sintonizado: infoFinal.sintonizado,
    propriedadesAtivas: infoFinal.propriedadesAtivas,
    propriedadesInativas: infoFinal.propriedadesInativas,
  };
}

/**
 * Calcula os bônus de Cerne Arcano (+5 dano mágico) e Cerne Místico (+5 cura mágica),
 * que só são ativados se o item estiver equipado e sintonizado pelo portador atual.
 * @param {object} actor
 * @returns {{ bonusDano: number, bonusCura: number, cerneArcanoAtivo: boolean, cerneMisticoAtivo: boolean }}
 */
export function calcularBonusCerneMagico(actor) {
  let bonusDano = 0;
  let bonusCura = 0;
  let cerneArcanoAtivo = false;
  let cerneMisticoAtivo = false;

  if (!actor) {
    return { bonusDano, bonusCura, cerneArcanoAtivo, cerneMisticoAtivo };
  }

  const rawItems = extrairItensAtor(actor);
  for (const item of rawItems) {
    const equipado = Boolean(item.system?.equipado ?? item.equipado);
    if (!equipado) continue;

    const sint = verificarSintonizacao(item, actor);
    if (!sint.sintonizado) continue;

    for (const prop of sint.propriedadesAtivas) {
      const norm = normalizarTexto(prop);
      if (!cerneArcanoAtivo && (norm === "cerne arcano" || norm.includes("cerne arcano"))) {
        cerneArcanoAtivo = true;
        bonusDano += BONUS_DANO_CERNE_ARCANO;
      }
      if (!cerneMisticoAtivo && (norm === "cerne mistico" || norm.includes("cerne mistico"))) {
        cerneMisticoAtivo = true;
        bonusCura += BONUS_CURA_CERNE_MISTICO;
      }
    }
  }

  return { bonusDano, bonusCura, cerneArcanoAtivo, cerneMisticoAtivo };
}

/* ------------------------------------------------------------------------- */
/* SUB-MÓDULO 8.1 / CASO 40: CUSTO DE MANA E PISO MÍNIMO (1 PM)              */
/* ------------------------------------------------------------------------- */

/**
 * Calcula o custo final de Pontos de Mana (PM) para conjurar uma magia.
 *
 * Regras Canônicas:
 * - Reduções de custo:
 *   - Foco Mágico (-5 PM, exige item equipado e sintonizado).
 *   - Tatuagem de Tohunga / Magia Tatuada (-5 PM).
 *   - Modificadores adicionais / habilidades (ex: Isnuu quando configurado com redução de mana).
 * - Piso mínimo absoluto de 1 PM: Não permite custo zero ou negativo quando
 *   a magia possui custo original > 0.
 * - Exceção Canônica de Sucesso Decisivo / Crítico: Quando a conjuração obtém Sucesso Decisivo
 *   com escolha de isenção de mana (`critico: true` / `sucessoDecisivo: true` / `efeitoCritico: "semMana"`),
 *   o custo em Mana é zerado (0 PM).
 * - Magias explicitamente gratuitas (custo original 0 ou flag gratuito: true) permanecem com custo 0.
 *
 * @param {object|number} magia Magia ou valor numérico do custo base
 * @param {object} [actor] Personagem conjurador
 * @param {object|number} [modificadores=0] Redução numérica direta ou objeto com opções
 * @returns {number} Custo final de PM
 */
export function calcularCustoMana(magia, actor = null, modificadores = 0) {
  let custoBase = 0;
  let isGratuito = false;

  if (typeof magia === "number") {
    custoBase = Math.max(0, magia);
    isGratuito = custoBase === 0;
  } else if (magia && typeof magia === "object") {
    const sys = magia.system || {};
    custoBase = Number(sys.custo ?? magia.custo ?? 0);
    isGratuito = Boolean(sys.gratuito ?? magia.gratuito ?? (custoBase === 0));
  }

  // Magias com custo base zero ou explicitamente gratuitas não gastam mana
  if (isGratuito || custoBase <= 0) {
    return 0;
  }

  // Exceção Canônica: Sucesso Decisivo / Crítico que zera o custo de Mana
  if (modificadores && typeof modificadores === "object") {
    const isCriticoSemMana =
      modificadores.custoZeroCritico === true ||
      modificadores.efeitoCritico === "semMana" ||
      modificadores.efeitoCritico === "0_pm" ||
      ((modificadores.critico === true || modificadores.sucessoDecisivo === true) &&
        (!modificadores.efeitoCritico ||
          modificadores.efeitoCritico === "semMana" ||
          modificadores.efeitoCritico === "0_pm"));

    if (isCriticoSemMana) {
      return 0;
    }
  }

  let reducaoTotal = 0;

  // Processa modificadores passados no parâmetro
  if (typeof modificadores === "number") {
    reducaoTotal += Math.abs(modificadores);
  } else if (modificadores && typeof modificadores === "object") {
    if (modificadores.reducao) reducaoTotal += Math.abs(Number(modificadores.reducao) || 0);
    if (modificadores.costMod) reducaoTotal += Math.abs(Number(modificadores.costMod) || 0);
    if (modificadores.focoMagico) reducaoTotal += REDUCAO_PM_FOCO_MAGICO;
    if (typeof modificadores.isnuu === "number") {
      reducaoTotal += Math.abs(modificadores.isnuu);
    } else if (modificadores.isnuu === true && modificadores.reducaoIsnuu) {
      reducaoTotal += Math.abs(Number(modificadores.reducaoIsnuu) || 0);
    }
  }

  // Benefício de Tatuagem de Tohunga / Magia Tatuada (-5 PM)
  if (possuiBeneficioTatuagemTohunga(magia, actor, modificadores)) {
    reducaoTotal += REDUCAO_PM_TATUAGEM_TOHUNGA;
  }

  // Processa itens e habilidades do personagem (ex: Orbe de Cristal com Foco Mágico equipado e sintonizado)
  if (actor) {
    const rawItems = extrairItensAtor(actor);
    let temFocoMagicoEquipado = false;

    for (const item of rawItems) {
      const isEquipado = Boolean(item.system?.equipado ?? item.equipado);
      if (isEquipado) {
        const props = Array.isArray(item.system?.propriedades)
          ? item.system.propriedades
          : (Array.isArray(item.propriedades) ? item.propriedades : []);

        const temPropFoco = props.some((p) => {
          const norm = normalizarTexto(p);
          return norm === "foco magico" || norm.includes("foco magico");
        }) || Boolean(item.system?.focoMagico ?? item.focoMagico);

        if (temPropFoco) {
          const sint = verificarSintonizacao(item, actor);
          if (sint.sintonizado) {
            temFocoMagicoEquipado = true;
          }
        }
      }

      // Caso alguma habilidade possua reducaoMana explícita (ex: variante de Isnuu ou talento arcano)
      if (item.type === "habilidade" && item.system?.reducaoMana) {
        reducaoTotal += Math.abs(Number(item.system.reducaoMana) || 0);
      }
    }

    const jaContabilizado =
      modificadores && typeof modificadores === "object" && modificadores.focoMagico;

    if (temFocoMagicoEquipado && !jaContabilizado) {
      reducaoTotal += REDUCAO_PM_FOCO_MAGICO;
    }
  }

  // Aplica piso mínimo canônico de 1 PM
  const custoFinal = Math.max(PISO_MINIMO_MANA, custoBase - reducaoTotal);
  return custoFinal;
}

/* ------------------------------------------------------------------------- */
/* SUB-MÓDULO 8.2.1 / CASO 41: DIFICULDADE DA MAGIA E MODIFICADORES          */
/* ------------------------------------------------------------------------- */

/**
 * Calcula a Dificuldade final para teste de conjuração de magia.
 *
 * Regras Canônicas:
 * - Dificuldade base definida na magia.
 * - Modificadores de Itens:
 *   - "Asseste Mágico": Reduz a Dificuldade em 1 ponto (-1) (requer item equipado e sintonizado).
 * - Modificadores Raciais / Habilidades / Tatuagens:
 *   - "Isnuu" (Faen): Reduz a dificuldade de todas as magias em 1 ponto (-1).
 *   - "Dom da Magia" (Elfo / Faen): Reduz a dificuldade de todas as magias em 1 ponto (-1).
 *   - "Tatuagem de Tohunga" / "Magia Tatuada": Reduz a dificuldade em 1 ponto (-1).
 *
 * @param {object|number} magia
 * @param {object} [actor]
 * @param {object|number} [modificadores=0]
 * @returns {number} Dificuldade calculada
 */
export function calcularDificuldadeMagia(magia, actor = null, modificadores = 0) {
  let difBase = 8;

  if (typeof magia === "number") {
    difBase = magia;
  } else if (magia && typeof magia === "object") {
    const sys = magia.system || {};
    difBase = Number(sys.dificuldade ?? magia.dificuldade ?? 8);
  }

  let reducaoTotal = 0;

  // Processa modificadores diretos
  if (typeof modificadores === "number") {
    reducaoTotal += modificadores;
  } else if (modificadores && typeof modificadores === "object") {
    if (modificadores.difficultyMod) reducaoTotal -= Number(modificadores.difficultyMod);
    if (modificadores.reducao) reducaoTotal += Number(modificadores.reducao);
    if (modificadores.assesteMagico) reducaoTotal += REDUCAO_DIFICULDADE_ASSESTE_MAGICO;
    if (modificadores.isnuu) reducaoTotal += REDUCAO_DIFICULDADE_ISNUU;
    if (modificadores.domDaMagia) reducaoTotal += REDUCAO_DIFICULDADE_DOM_DA_MAGIA;
  }

  // Benefício de Tatuagem de Tohunga / Magia Tatuada (-1 na Dificuldade)
  if (possuiBeneficioTatuagemTohunga(magia, actor, modificadores)) {
    reducaoTotal += REDUCAO_DIFICULDADE_TATUAGEM_TOHUNGA;
  }

  if (actor) {
    const rawItems = extrairItensAtor(actor);

    // 1. Modificador de Itens: Asseste Mágico (equipado e sintonizado)
    let temAssesteAtivo = false;
    for (const item of rawItems) {
      const isEquipado = Boolean(item.system?.equipado ?? item.equipado);
      if (!isEquipado) continue;

      const props = Array.isArray(item.system?.propriedades)
        ? item.system.propriedades
        : (Array.isArray(item.propriedades) ? item.propriedades : []);
      const temAsseste = props.some((p) => {
        const norm = normalizarTexto(p);
        return norm === "asseste magico" || norm.includes("asseste magico");
      }) || Boolean(item.system?.assesteMagico ?? item.assesteMagico);

      if (temAsseste) {
        const sint = verificarSintonizacao(item, actor);
        if (sint.sintonizado) {
          temAssesteAtivo = true;
          break;
        }
      }
    }

    if (temAssesteAtivo && !(modificadores?.assesteMagico)) {
      reducaoTotal += REDUCAO_DIFICULDADE_ASSESTE_MAGICO;
    }

    // 2. Modificadores de Habilidades Raciais e Características
    const temIsnuu = rawItems.some((i) => {
      const nome = normalizarTexto(i.name || "");
      return nome === "isnuu";
    });

    if (temIsnuu && !(modificadores?.isnuu)) {
      reducaoTotal += REDUCAO_DIFICULDADE_ISNUU;
    }

    const temDomDaMagia = rawItems.some((i) => {
      const nome = normalizarTexto(i.name || "");
      return nome === "dom da magia";
    });

    if (temDomDaMagia && !(modificadores?.domDaMagia)) {
      reducaoTotal += REDUCAO_DIFICULDADE_DOM_DA_MAGIA;
    }
  }

  const difFinal = Math.max(0, difBase - reducaoTotal);
  return difFinal;
}

/* ------------------------------------------------------------------------- */
/* SUB-MÓDULO 8.2.2 / CASO 42: INAPTIDÃO POR ARMADURA NA CONJURAÇÃO          */
/* ------------------------------------------------------------------------- */

/**
 * Verifica se um conjurador está operando em estado Inapto para conjuração
 * devido ao uso de armadura corporal sem o devido treino/habilidade mágica.
 *
 * Regras Canônicas:
 * - Conjurador usando armadura corporal sem treino/habilidade mágica apropriada
 *   conjura em estado Inapto (1d6 em vez de 2d6).
 * - Escudos não contam como armadura corporal.
 * - Classes como Rúnico e Paladino possuem treinamento integrado.
 * - Habilidades como "Armadura Fiel", "Treino com Armadura" dispensam a inaptidão.
 * - Se a Força do personagem for menor que a FN da armadura, ele fica Inapto
 *   mesmo que possua o treino de conjuração.
 *
 * @param {object} actor
 * @returns {{
 *   inapto: boolean,
 *   motivo: string|null,
 *   armadura: object|null
 * }}
 */
export function verificarInaptidaoConjuracao(actor) {
  if (!actor) {
    return { inapto: false, motivo: null, armadura: null };
  }

  const rawItems = extrairItensAtor(actor);

  // Localiza armadura corporal equipada (excluindo escudos)
  const armadurasCorporais = rawItems.filter((i) => {
    const isArmadura = i.type === "armadura";
    const isEquipado = Boolean(i.system?.equipado ?? i.equipado);
    if (!isArmadura || !isEquipado) return false;
    const subtipo = normalizarTexto(i.system?.subtipo || i.subtipo || "armadura");
    return subtipo !== "escudo";
  });

  if (armadurasCorporais.length === 0) {
    return { inapto: false, motivo: null, armadura: null };
  }

  const armaduraEquipada = armadurasCorporais[0];

  // 1. Checagem de FN (Força Necessária): Se Força < FN, sempre fica inapto
  const checagemFN = verificarFN(actor, armaduraEquipada);
  if (checagemFN.inapto) {
    return {
      inapto: true,
      motivo: `Força insuficiente (${checagemFN.forca}) para a FN da armadura (${checagemFN.fn}).`,
      armadura: armaduraEquipada,
    };
  }

  // 2. Checagem de Treino / Classe Mágica
  const classeNome = normalizarTexto(actor.system?.details?.classe || actor.classId || "");
  const aprendizNome = normalizarTexto(actor.system?.details?.aprendiz || "");
  const hasClasseTreinada =
    CLASSES_TREINO_ARMADURA_CONJURACAO.includes(classeNome) ||
    CLASSES_TREINO_ARMADURA_CONJURACAO.includes(aprendizNome);

  const hasHabilidadeTreino = rawItems.some((i) => {
    const nome = normalizarTexto(i.name || "");
    return (
      nome === "armadura fiel" ||
      nome === "treino com armadura" ||
      nome === "magia em armadura" ||
      nome === "conjurador de batalha" ||
      Boolean(i.system?.treinoArmaduraConjuracao)
    );
  });

  const hasFlagTreino = Boolean(
    actor.flags?.["mighty-blade"]?.treinoArmaduraConjuracao ||
    actor.system?.treinoArmaduraConjuracao
  );

  const temTreino = hasClasseTreinada || hasHabilidadeTreino || hasFlagTreino;

  if (!temTreino) {
    return {
      inapto: true,
      motivo: "Conjurador usando armadura corporal sem treino/habilidade mágica apropriada.",
      armadura: armaduraEquipada,
    };
  }

  return {
    inapto: false,
    motivo: null,
    armadura: armaduraEquipada,
  };
}

/* ------------------------------------------------------------------------- */
/* SUB-MÓDULO 8.4 / CASO 44: ITENS DE REGISTRO E GRIMÓRIOS SUPERIORES        */
/* ------------------------------------------------------------------------- */

/**
 * Valida a capacidade de magias registradas em um grimório e a necessidade
 * de empunhar ativamente o item de Registro/Canalizador para conjuração.
 *
 * Regras Canônicas:
 * - Capacidade máxima de magias Arcanas/Místicas registradas baseada no item e Inteligência do personagem:
 *   - Se o item definir `capacidade` explícita, usa-a.
 *   - Se definir `capacidadeBase`, soma `capacidadeBase + INT`.
 *   - Se definir `multiplicadorInt` (ex: Grimório Superior = INT * 3), multiplica pela Inteligência.
 *   - Se baseada na Inteligência padrão, é `Inteligência * 2` (mínimo 1).
 * - Magias que dependem da propriedade Registro ou Canalizador falham se o conjurador
 *   não estiver empunhando o item correspondente.
 *
 * @param {object} grimorio Item com propriedade Registro/Canalizador
 * @param {Array} [magias=[]] Lista de magias registradas ou a registrar
 * @param {object} [actor=null] Personagem proprietário
 * @returns {{
 *   valido: boolean,
 *   capacidadeMaxima: number,
 *   magiasRegistradas: number,
 *   espacoLivre: number,
 *   capacidadeExcedida: boolean,
 *   empunhado: boolean,
 *   podeConjurar: boolean,
 *   erro?: string
 * }}
 */
export function validarRegistroGrimorio(grimorio, magias = [], actor = null) {
  const sys = grimorio?.system || {};

  // Calcula Inteligência do conjurador
  const int = Number(
    actor?.system?.attributes?.inteligencia?.value ??
    actor?.system?.attributes?.inteligencia?.base ??
    actor?.attributes?.inteligencia ??
    0
  );

  let capacidadeMaxima = 0;
  if (sys.capacidade !== undefined && sys.capacidade !== null) {
    capacidadeMaxima = Number(sys.capacidade) || 0;
  } else if (grimorio?.capacidade !== undefined && grimorio?.capacidade !== null) {
    capacidadeMaxima = Number(grimorio.capacidade) || 0;
  } else if (sys.capacidadeBase !== undefined) {
    capacidadeMaxima = Number(sys.capacidadeBase) + int;
  } else if (sys.multiplicadorInt !== undefined) {
    capacidadeMaxima = Math.max(1, int * Number(sys.multiplicadorInt));
  } else {
    // Escala padrão com base na Inteligência do conjurador (mínimo de 1 se INT > 0)
    capacidadeMaxima = Math.max(1, int * 2);
  }

  const listaMagias = Array.isArray(magias) && magias.length > 0
    ? magias
    : (Array.isArray(sys.magiasRegistradas) ? sys.magiasRegistradas : []);

  // Validação opcional de fonte permitida no item de registro (Arcana vs Mística)
  const fontePermitida = normalizarTexto(sys.fontePermitida || grimorio?.fontePermitida || "");
  let fonteIncompativel = false;
  if (fontePermitida) {
    for (const m of listaMagias) {
      if (m && typeof m === "object") {
        const fMagia = normalizarTexto(m.system?.fonte || m.fonte || "");
        if (fMagia && fMagia !== fontePermitida) {
          fonteIncompativel = true;
          break;
        }
      }
    }
  }

  const magiasRegistradas = listaMagias.length;
  const capacidadeExcedida = magiasRegistradas > capacidadeMaxima;

  // Empunhadura: item precisa estar equipado na mão
  const empunhado = Boolean(sys.equipado ?? grimorio?.equipado);

  let erro = undefined;
  if (fonteIncompativel) {
    erro = `O item de registro aceita apenas magias de fonte ${fontePermitida}.`;
  } else if (capacidadeExcedida) {
    erro = `Capacidade máxima de magias do grimório excedida: ${magiasRegistradas} magias para um máximo de ${capacidadeMaxima}.`;
  } else if (!empunhado) {
    erro = "Magias com propriedade Registro/Canalizador falham se não empunhar o item correspondente.";
  }

  const valido = !capacidadeExcedida && !fonteIncompativel;
  const podeConjurar = valido && empunhado;

  return {
    valido,
    capacidadeMaxima,
    magiasRegistradas,
    espacoLivre: Math.max(0, capacidadeMaxima - magiasRegistradas),
    capacidadeExcedida,
    empunhado,
    podeConjurar,
    erro,
  };
}

/**
 * Registra uma nova magia em um Grimório/Item de Registro, lançando erro caso exceda o limite.
 * @param {object} grimorio
 * @param {string|object} novaMagia
 * @param {object} [actor=null]
 * @returns {object} Resultado da validação atualizado
 */
export function registrarMagiaGrimorio(grimorio, novaMagia, actor = null) {
  if (!grimorio) {
    throw new Error("Item de Registro / Grimório inválido.");
  }
  grimorio.system = grimorio.system || {};
  const atuais = Array.isArray(grimorio.system.magiasRegistradas)
    ? [...grimorio.system.magiasRegistradas]
    : [];

  const tentativa = [...atuais, novaMagia];
  const validacao = validarRegistroGrimorio(grimorio, tentativa, actor);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  grimorio.system.magiasRegistradas = tentativa;
  return validacao;
}

/**
 * Valida se uma magia que exige a propriedade Registro ou Canalizador pode ser conjurada
 * pelo personagem no momento (Sub-módulo 8.4.2).
 * Se a magia exigir Registro ou Canalizador e o personagem não estiver empunhando o item
 * correspondente, a conjuração falha automaticamente.
 *
 * @param {object} magia
 * @param {object} actor
 * @returns {{ podeConjurar: boolean, falhaAutomatica: boolean, motivo: string|null, itemUtilizado: object|null }}
 */
export function validarConjuracaoMagia(magia, actor) {
  if (!magia) {
    return { podeConjurar: false, falhaAutomatica: true, motivo: "Magia inválida.", itemUtilizado: null };
  }

  const sys = magia.system || {};
  const propsMagia = Array.isArray(sys.propriedades)
    ? sys.propriedades.map(normalizarTexto)
    : (Array.isArray(magia.propriedades) ? magia.propriedades.map(normalizarTexto) : []);

  const exigeRegistro =
    propsMagia.includes("registro") ||
    Boolean(sys.requerRegistro ?? magia.requerRegistro);
  const exigeCanalizador =
    propsMagia.includes("canalizador") ||
    Boolean(sys.requerCanalizador ?? magia.requerCanalizador);

  if (!exigeRegistro && !exigeCanalizador) {
    return { podeConjurar: true, falhaAutomatica: false, motivo: null, itemUtilizado: null };
  }

  const rawItems = extrairItensAtor(actor);
  const nomeMagiaNorm = normalizarTexto(magia.name || "");

  for (const item of rawItems) {
    const isEquipado = Boolean(item.system?.equipado ?? item.equipado);
    if (!isEquipado) continue;

    const propsItem = Array.isArray(item.system?.propriedades)
      ? item.system.propriedades.map(normalizarTexto)
      : (Array.isArray(item.propriedades) ? item.propriedades.map(normalizarTexto) : []);

    const temPropRegistro = propsItem.includes("registro") || Boolean(item.system?.registro);
    const temPropCanalizador = propsItem.includes("canalizador") || Boolean(item.system?.canalizador);

    if (exigeRegistro && !temPropRegistro) continue;
    if (exigeCanalizador && !temPropCanalizador && !temPropRegistro) continue;

    // Se exige registro e o grimório possui lista de magias registradas, verifica capacidade e presença
    if (exigeRegistro) {
      const checkGrimorio = validarRegistroGrimorio(item, item.system?.magiasRegistradas || [], actor);
      if (!checkGrimorio.podeConjurar) continue;

      const gravadas = Array.isArray(item.system?.magiasRegistradas) ? item.system.magiasRegistradas : [];
      if (gravadas.length > 0 && nomeMagiaNorm) {
        const contemMagia = gravadas.some(
          (m) => normalizarTexto(typeof m === "string" ? m : m?.name || "") === nomeMagiaNorm
        );
        if (!contemMagia) continue;
      }
    }

    return {
      podeConjurar: true,
      falhaAutomatica: false,
      motivo: null,
      itemUtilizado: item,
    };
  }

  const tipoExigido = exigeRegistro ? "Registro" : "Canalizador";
  return {
    podeConjurar: false,
    falhaAutomatica: true,
    motivo: `Falha automática na conjuração: a magia "${magia.name || "Magia"}" exige um item com a propriedade ${tipoExigido} empunhado.`,
    itemUtilizado: null,
  };
}

/* ------------------------------------------------------------------------- */
/* SUB-MÓDULO 8.5 / CASO 45: SÍMBOLOS PROFANOS E DRENO DE VIDA (PV)          */
/* ------------------------------------------------------------------------- */

/**
 * Calcula a perda automática de Pontos de Vida (PV) ao desenhar Símbolos Profanos
 * (magias infernais / maldições).
 *
 * Regras Canônicas:
 * - Desenhar Símbolos Profanos sem a habilidade "Conhecimento Nefasto" (Caminho Aziago)
 *   desconta perda automática de PV (padrão 5 PV).
 * - Conjuradores com "Conhecimento Nefasto" NÃO sofrem perda de PV ao desenhar
 *   Símbolos Profanos.
 *
 * @param {object} actor Personagem conjurador
 * @param {object} [magia] Magia de maldição ou que requer símbolo profano
 * @returns {{
 *   perdaPV: number,
 *   temConhecimentoNefasto: boolean,
 *   vidaAtual: number,
 *   vidaRestante: number,
 *   motivo: string
 * }}
 */
export function calcularCustoSimboloProfano(actor, magia = null) {
  if (!actor) {
    return {
      perdaPV: CUSTO_PV_SIMBOLO_PROFANO,
      temConhecimentoNefasto: false,
      vidaAtual: 0,
      vidaRestante: 0,
      motivo: "Nenhum conjurador especificado.",
    };
  }

  const rawItems = extrairItensAtor(actor);

  // Verifica posse da habilidade Conhecimento Nefasto
  const temConhecimentoNefasto =
    rawItems.some((i) => {
      const nome = normalizarTexto(i.name || "");
      return nome === "conhecimento nefasto";
    }) ||
    normalizarTexto(actor.system?.details?.caminho || "") === "aziago" ||
    Boolean(actor.flags?.["mighty-blade"]?.conhecimentoNefasto);

  const perdaBase = Number(magia?.system?.custoPV ?? magia?.custoPV ?? CUSTO_PV_SIMBOLO_PROFANO);
  const perdaPV = temConhecimentoNefasto ? 0 : perdaBase;

  const vidaAtual = Number(
    actor.system?.resources?.vida?.value ??
    actor.stats?.pv ??
    actor.stats?.vida ??
    0
  );
  const vidaRestante = Math.max(0, vidaAtual - perdaPV);

  const motivo = temConhecimentoNefasto
    ? "Conjurador possui Conhecimento Nefasto (Aziago): isento de perda de PV para Símbolo Profano."
    : `Desenhou Símbolo Profano sem Conhecimento Nefasto: perda automática de ${perdaPV} PV.`;

  return {
    perdaPV,
    temConhecimentoNefasto,
    vidaAtual,
    vidaRestante,
    motivo,
  };
}

/**
 * Aplica a perda de PV do Símbolo Profano diretamente na ficha do personagem.
 * @param {object} actor
 * @param {object} [magia]
 * @returns {Promise<object>}
 */
export async function aplicarCustoSimboloProfano(actor, magia = null) {
  const res = calcularCustoSimboloProfano(actor, magia);
  if (res.perdaPV > 0 && actor.update) {
    await actor.update({ "system.resources.vida.value": res.vidaRestante });
  } else if (res.perdaPV > 0 && actor.system?.resources?.vida) {
    actor.system.resources.vida.value = res.vidaRestante;
  }
  return res;
}
