/**
 * Módulo de Propriedades Táticas de Equipamentos e Combate (Manual do Combatente).
 * Mighty Blade 3ª Edição.
 *
 * Implementa as regras táticas canônicas:
 * - Caso 42: Propriedade Mão e Meia (calcularArmaMaoEMeia)
 *   * 2 mãos: FN cai pela metade (Math.ceil(fn / 2)), dano recebe bônus (+2 ou Força com Ataque Furioso)
 *   * 1 mão: Exige FN integral, dano base
 * - Caso 43: Propriedade Transpor (processarPropriedadeTranspor)
 *   * Ignora totalmente o bônus de Defesa do Escudo do alvo e Cobertura
 * - Caso 44: Propriedade Trespassar (processarPropriedadeTrespassar)
 *   * Ao zerar os PVs de uma criatura, transfere dano excedente (igual à Força) para alvo adjacente
 * - Caso 45: Propriedade Carregar (verificarPropriedadeCarregar)
 *   * Exige gasto de 1 Ação de Movimento para recarga antes de novo disparo;
 *   * Armas mecânicas (Bestas/Prodds) não sofrem penalidades ao atacar alvos adjacentes
 * - Caso 46: Propriedade Gancho (processarPropriedadeGancho)
 *   * Valida opção de trocar dano direto por teste de Derrubar ou anulação de bônus de escudo
 * - Caso 47: Penalidade de Armadura Pesada sem Túnica (verificarPenalidadeArmaduraSemTunica)
 *   * Trajar Armadura Pesada sem uma Túnica por baixo desconta automaticamente 5 PM por turno em combate
 */

import { consumirMana } from "./danos-condicoes.mjs";
import { calcularEquipamento } from "./equipamento.mjs";
import { calcularBloqueio, calcularEsquiva } from "./estatisticas-derivadas.mjs";
import { CANONICAL_EQUIPAMENTOS } from "../data/canonical-packs-data.mjs";

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

function normalizarSlugProp(str) {
  return normalizarTexto(str).replace(/[\s_-]+/g, "");
}

/**
 * Retorna os itens de um ator como um array simples.
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
 * Verifica se um item possui uma determinada propriedade tática.
 * @param {object} item
 * @param {string} propriedade
 * @returns {boolean}
 */
export function itemPossuiPropriedade(item, propriedade) {
  if (!item) return false;
  const propBuscada = normalizarTexto(propriedade);
  const propSlug = normalizarSlugProp(propriedade);

  // 1. Checa array de propriedades no system ou root
  const props = Array.isArray(item.system?.propriedades)
    ? item.system.propriedades
    : Array.isArray(item.propriedades)
    ? item.propriedades
    : Array.isArray(item.properties)
    ? item.properties
    : [];

  if (props.some((p) => normalizarTexto(p) === propBuscada || normalizarSlugProp(p) === propSlug)) {
    return true;
  }

  // 2. Checa campos diretos de categoria/propriedade (category, weaponProperty, etc.)
  const directCandidates = [
    item.category,
    item.categoria,
    item.system?.categoria,
    item.weaponProperty,
    item.property,
    item.propriedade,
  ].filter(Boolean);

  if (directCandidates.some((c) => normalizarSlugProp(c) === propSlug)) {
    return true;
  }

  // 3. Checa flags booleanas diretas no system (ex: system.maoEMeia, system.carregar)
  const propCamel = propriedade.charAt(0).toLowerCase() + propriedade.slice(1);
  if (item.system?.[propCamel] === true || item[propCamel] === true) {
    return true;
  }

  // 4. Fallback para nomes ou slugs canônicos comuns
  const nomeNorm = normalizarTexto(item.name || item.nome || "");
  if (propSlug === "carregar" && (nomeNorm.includes("besta") || nomeNorm.includes("prod"))) {
    return true;
  }
  if (propSlug === "maoemeia" && nomeNorm.includes("bastarda")) {
    return true;
  }

  return false;
}

/**
 * Caso 42: Propriedade Mão e Meia
 *
 * Uma arma com a propriedade Mão e Meia pode ser empunhada com 1 ou 2 mãos.
 * - 2 mãos: A Força Necessária (FN) cai pela metade (arredondada para cima: Math.ceil(fn/2)).
 *   O dano recebe um bônus de +2, ou o valor da Força do atacante caso possua a habilidade Ataque Furioso.
 * - 1 mão: Exige FN integral e aplica o dano base da arma.
 *
 * @param {object} arma Item da arma
 * @param {number|string} maosUtilizadas Quantidade de mãos (1 ou 2)
 * @param {object} [opcoes={}] Opções adicionais (actor, forca, ataqueFurioso)
 * @returns {object} Detalhes da arma empunhada e modificações de FN e dano
 */
export function calcularArmaMaoEMeia(arma, maosUtilizadas = 1, opcoes = {}) {
  // Trata se o terceiro parâmetro for diretamente um Actor / CharacterProxy
  let actor = null;
  let ataqueFurioso = false;
  let forcaAtacante = 0;

  if (opcoes?._rawActor || opcoes?.system?.attributes || opcoes?.items) {
    actor = opcoes._rawActor || opcoes;
  } else if (typeof opcoes === "object" && opcoes !== null) {
    actor = opcoes.actor?._rawActor || opcoes.actor || null;
    ataqueFurioso = !!opcoes.ataqueFurioso;
    if (typeof opcoes.forca === "number") {
      forcaAtacante = opcoes.forca;
    }
  }

  if (actor) {
    const attrs = actor.system?.attributes || {};
    forcaAtacante = Number(attrs.forca?.value ?? attrs.forca?.base ?? forcaAtacante ?? 0);

    // Checa se o ator tem Ataque Furioso
    const itensAtor = obterItensAtor(actor);
    const temHabAtaqueFurioso = itensAtor.some((i) => {
      const nome = normalizarTexto(i.name || "");
      const slug = normalizarTexto(i.flags?.["mighty-blade"]?.slug || "");
      return nome === "ataque furioso" || slug === "ataque-furioso";
    });

    if (temHabAtaqueFurioso) {
      ataqueFurioso = true;
    }
  }

  const fnOriginal = Number(arma?.system?.fn ?? arma?.fn ?? 0);
  const nMaos = Number(maosUtilizadas) === 2 || String(maosUtilizadas).toLowerCase().includes("duas") ? 2 : 1;

  let fnEfetiva = fnOriginal;
  let bonusDano = 0;
  let ataqueFuriosoAplicado = false;

  if (nMaos === 2) {
    // 2 mãos: FN cai pela metade (arredondada para cima)
    fnEfetiva = Math.ceil(fnOriginal / 2);

    // Ataque Furioso: se tiver Força suficiente para 1 mão (forca >= fnOriginal),
    // substitui o bônus padrão de +2 pela Força integral do atacante
    if (ataqueFurioso && (forcaAtacante >= fnOriginal || !actor)) {
      bonusDano = forcaAtacante > 0 ? forcaAtacante : 2;
      ataqueFuriosoAplicado = true;
    } else {
      bonusDano = 2;
    }
  } else {
    // 1 mão: Exige FN integral e aplica dano base (bônus 0)
    fnEfetiva = fnOriginal;
    bonusDano = 0;
  }

  // Avaliação de inaptidão se a Força for conhecida
  const inapto = forcaAtacante > 0 ? forcaAtacante < fnEfetiva : false;

  // Processamento do dano da arma
  const danoBase = arma?.system?.dano ?? arma?.dano ?? arma?.damage ?? arma?.system?.damage ?? 0;
  let danoModificado = danoBase;
  let danoNumerico = 0;

  if (typeof danoBase === "number") {
    danoNumerico = danoBase + bonusDano;
    danoModificado = danoNumerico;
  } else if (typeof danoBase === "string") {
    const trimmed = danoBase.trim();
    const matchFor = trimmed.match(/^FOR\s*(\+\s*(\d+))?$/i);
    const matchNumero = trimmed.match(/^(\d+)$/);

    if (matchNumero) {
      danoNumerico = parseInt(matchNumero[1], 10) + bonusDano;
      danoModificado = String(danoNumerico);
    } else if (matchFor) {
      const somaBase = matchFor[2] ? parseInt(matchFor[2], 10) : 0;
      const somaTotal = somaBase + bonusDano;
      danoModificado = somaTotal > 0 ? `FOR+${somaTotal}` : "FOR";
      if (forcaAtacante > 0) {
        danoNumerico = forcaAtacante + somaTotal;
      }
    } else if (bonusDano > 0) {
      danoModificado = `${trimmed} + ${bonusDano}`;
    }
  }

  return {
    arma,
    maos: nMaos,
    hands: nMaos,
    fnOriginal,
    fnEfetiva,
    effectiveFn: fnEfetiva,
    fn: fnEfetiva,
    bonusDano,
    bonusDamage: bonusDano,
    danoOriginal: danoBase,
    baseDamage: danoBase,
    danoModificado,
    modifiedDamage: danoModificado,
    danoFinal: danoModificado,
    danoNumerico,
    ataqueFuriosoAplicado,
    forcaAtacante,
    inapto,
  };
}

/**
 * Caso 43: Propriedade Transpor
 *
 * Ignora totalmente o bônus de Defesa oferecido por Escudos e Cobertura do alvo defensor.
 *
 * @param {object} ataque Objeto de ataque ou arma utilizada
 * @param {object} defensor Personagem ou alvo atacado
 * @returns {object} Resultado do cálculo defensivo com anulação de escudo e cobertura
 */
export function processarPropriedadeTranspor(ataque, defensor) {
  let bonusEscudo = 0;
  let bonusCobertura = 0;
  let defesaOriginal = 0;
  let bloqueioOriginal = 0;
  let esquivaOriginal = 0;

  const target = defensor?._rawActor || defensor;

  if (target) {
    if (typeof target.prepareDerivedData === "function" || target.system?.attributes) {
      // É um Ator / MockActor
      const eq = calcularEquipamento(target);
      bonusEscudo = Number(eq.bonusEscudo || 0);

      // Cobertura do defensor
      bonusCobertura = Number(
        target.system?.defesas?.cobertura?.value ??
        target.system?.cobertura ??
        target.bonusCobertura ??
        target.cobertura ??
        0
      );

      const bloq = calcularBloqueio(target);
      const esq = calcularEsquiva(target);
      bloqueioOriginal = bloq.value + bonusCobertura;
      esquivaOriginal = esq.value + bonusCobertura;
      defesaOriginal = bloq.value + bonusCobertura; // Por padrão para quem empunha escudo
    } else {
      // Objeto simples de dados
      bonusEscudo = Number(target.bonusEscudo ?? target.escudo ?? 0);
      bonusCobertura = Number(target.bonusCobertura ?? target.cobertura ?? 0);
      const defExplicita = target.defesaTotal ?? target.defesa ?? target.bloqueio;
      if (defExplicita !== undefined) {
        defesaOriginal = Number(defExplicita);
      } else {
        const base = Number(target.defesaBase ?? 5);
        const attr = Number(target.forca ?? target.agilidade ?? 0);
        const armadura = Number(target.bonusArmadura ?? target.armadura ?? 0);
        defesaOriginal = base + attr + armadura + bonusEscudo + bonusCobertura;
      }
      bloqueioOriginal = Number(target.bloqueio ?? defesaOriginal);
      esquivaOriginal = Number(target.esquiva ?? defesaOriginal);
    }
  }

  const bonusTotalIgnorado = bonusEscudo + bonusCobertura;
  const defesaEfetiva = Math.max(0, defesaOriginal - bonusTotalIgnorado);
  const bloqueioEfetivo = Math.max(0, bloqueioOriginal - bonusEscudo - bonusCobertura);

  return {
    ignoraEscudo: true,
    ignoraCobertura: true,
    bonusEscudoIgnorado: bonusEscudo,
    bonusCoberturaIgnorado: bonusCobertura,
    bonusTotalIgnorado,
    defesaOriginal,
    defesaEfetiva,
    effectiveTargetDefense: defesaEfetiva,
    defesaFinal: defesaEfetiva,
    bloqueioOriginal,
    bloqueioEfetivo,
    esquivaOriginal,
  };
}

/**
 * Caso 44: Propriedade Trespassar
 *
 * Ao zerar os PVs de uma criatura através de um ataque com arma que tenha Trespassar,
 * transfere dano excedente (igual à Força do atacante) para um alvo adjacente.
 *
 * @param {number} danoCausado Quantidade total de dano causado pelo ataque
 * @param {number|object} pvAlvo PVs atuais do alvo antes do dano (ou Ator alvo)
 * @param {number|object} forcaAtacante Valor de Força do atacante (ou Ator atacante)
 * @returns {object} Resultado do processamento de trespassar
 */
export function processarPropriedadeTrespassar(danoCausado, pvAlvo, forcaAtacante) {
  const dano = Math.max(0, Number(danoCausado) || 0);

  let pv = 0;
  if (pvAlvo && typeof pvAlvo === "object") {
    pv = Number(pvAlvo.system?.resources?.vida?.value ?? 0);
  } else {
    pv = Math.max(0, Number(pvAlvo) || 0);
  }

  let forca = 0;
  if (forcaAtacante && typeof forcaAtacante === "object") {
    const attrs = forcaAtacante.system?.attributes || {};
    forca = Number(attrs.forca?.value ?? attrs.forca?.base ?? 0);
  } else {
    forca = Math.max(0, Number(forcaAtacante) || 0);
  }

  // O alvo fica sem PVs quando o dano causado é maior ou igual aos seus PVs atuais
  const alvoZerado = dano >= pv && pv > 0 ? true : dano >= pv;
  const danoExcedente = Math.max(0, dano - pv);

  // Conforme o Manual do Combatente: causa dano ao alvo adjacente igual à Força do atacante
  const ativou = alvoZerado;
  const danoTransferido = ativou ? forca : 0;

  return {
    ativou,
    alvoZerado,
    danoCausado: dano,
    pvAlvo: pv,
    forcaAtacante: forca,
    danoExcedente,
    danoTransferido,
    danoAlvoAdjacente: danoTransferido,
  };
}

/**
 * Caso 45: Propriedade Carregar
 *
 * Armas mecânicas (Bestas/Prodds) exigem o gasto de 1 Ação de Movimento para recarga
 * antes de um novo disparo; além disso, não sofrem penalidades ao atacar alvos adjacentes
 * (ao contrário de arcos e armas de arremesso, que sofrem redução de 50% no dano).
 *
 * @param {object} arma Item da arma
 * @param {object|string|boolean|Array} [acoesTurno=null] Ações gastas/disponíveis no turno
 * @param {object} [opcoes={}] Opções adicionais (distanciaAlvo, etc.)
 * @returns {object} Validação de disparo e penalidades de alcance
 */
export function verificarPropriedadeCarregar(arma, acoesTurno = null, opcoes = {}) {
  const temPropriedade = itemPossuiPropriedade(arma, "Carregar");

  // Identifica se a arma já estava carregada
  const jaCarregada = arma?.system?.carregada === true || opcoes?.carregada === true;

  // Analisa o gasto da Ação de Movimento para recarga
  let movimentoGastoParaRecarga = false;

  if (acoesTurno === true || opcoes?.recarregar === true) {
    movimentoGastoParaRecarga = true;
  } else if (typeof acoesTurno === "string") {
    const norm = normalizarTexto(acoesTurno);
    if (norm === "movimento" || norm.includes("recarreg")) {
      movimentoGastoParaRecarga = true;
    }
  } else if (Array.isArray(acoesTurno)) {
    movimentoGastoParaRecarga = acoesTurno.some((a) => {
      const n = normalizarTexto(a);
      return n === "movimento" || n.includes("recarreg");
    });
  } else if (typeof acoesTurno === "object" && acoesTurno !== null) {
    if (acoesTurno.movimentoGasto || acoesTurno.recarregada || acoesTurno.acaoMovimentoGasta) {
      movimentoGastoParaRecarga = true;
    }
  }

  // Uma arma com Carregar pode disparar se já estiver carregada OU se gastou a Ação de Movimento para recarregar
  let podeDisparar = true;
  let recarregada = jaCarregada || movimentoGastoParaRecarga;

  if (temPropriedade) {
    podeDisparar = recarregada;
  }

  // Penalidade contra alvos adjacentes:
  // Armas normais de disparo causam apenas metade do dano contra alvos adjacentes.
  // Armas com Carregar NÃO sofrem essa penalidade!
  const sofrePenalidadeAdjacente = !temPropriedade;

  const calcularDanoContraAlvoAdjacente = (danoBase) => {
    const d = Number(danoBase) || 0;
    if (temPropriedade) {
      return d; // Dano integral
    }
    return Math.floor(d / 2); // Metade do dano
  };

  return {
    arma,
    temPropriedadeCarregar: temPropriedade,
    exigeAcaoMovimento: temPropriedade,
    jaCarregada,
    movimentoGastoParaRecarga,
    recarregada,
    podeDisparar,
    sofrePenalidadeAdjacente,
    penalidadeAdjacente: sofrePenalidadeAdjacente,
    calcularDanoContraAlvoAdjacente,
    motivo: podeDisparar
      ? undefined
      : "Armas mecânicas com Carregar exigem o gasto de 1 Ação de Movimento para recarga antes de um novo disparo.",
  };
}

/**
 * Caso 46: Propriedade Gancho
 *
 * Como um ataque, uma arma com Gancho pode ser utilizada para:
 * 1. Derrubar o alvo: Em vez de causar dano, realiza Confronto de Força ou Agilidade;
 *    se vencer, o alvo fica Caído.
 * 2. Puxar o escudo do alvo: Em vez de causar dano, anula os bônus do escudo do alvo até o começo do próximo turno dele.
 * 3. Ataque normal: Causa dano regular da arma.
 *
 * @param {object} ataque Objeto do ataque com a arma e opção escolhida
 * @param {string|object} [opcaoOuOpcoes="dano"] Modo de uso ('derrubar', 'anular_escudo', 'dano')
 * @returns {object} Validação da manobra e regras aplicadas
 */
export function processarPropriedadeGancho(ataque, opcaoOuOpcoes = "dano") {
  const arma = ataque?.arma || ataque;
  const temGancho = itemPossuiPropriedade(arma, "Gancho");

  let modo = "dano";
  if (typeof opcaoOuOpcoes === "string") {
    modo = opcaoOuOpcoes;
  } else if (typeof opcaoOuOpcoes === "object" && opcaoOuOpcoes !== null) {
    modo = opcaoOuOpcoes.opcao || opcaoOuOpcoes.modo || ataque?.opcao || "dano";
  } else if (ataque?.opcao) {
    modo = ataque.opcao;
  }

  const modoNorm = normalizarTexto(modo);
  let opcaoValida = false;
  let trocaDano = false;
  let danoCausado = ataque?.dano ?? 0;
  let efeito = "dano";
  let descricao = "Ataque padrão causando dano regular.";

  if (!temGancho) {
    return {
      valido: false,
      temGancho: false,
      erro: "A arma não possui a propriedade Gancho.",
    };
  }

  if (modoNorm.includes("derrub")) {
    opcaoValida = true;
    trocaDano = true;
    danoCausado = 0;
    efeito = "derrubar";
    descricao = "Troca o dano direto por um Confronto de Força ou Agilidade; se vencer, o alvo fica Caído.";
  } else if (modoNorm.includes("escudo") || modoNorm.includes("puxar")) {
    opcaoValida = true;
    trocaDano = true;
    danoCausado = 0;
    efeito = "anular_escudo";
    descricao = "Troca o dano direto para puxar o escudo do alvo, anulando o bônus de escudo até o próximo turno dele.";
  } else {
    opcaoValida = true;
    trocaDano = false;
    efeito = "dano";
    descricao = "Ataque padrão com dano regular.";
  }

  return {
    valido: opcaoValida,
    temGancho: true,
    modo: efeito,
    trocaDano,
    danoCausado,
    efeito,
    confronto: efeito === "derrubar" ? "Força ou Agilidade (o que for mais alto)" : null,
    condicaoAplicada: efeito === "derrubar" ? "Caído" : null,
    anulaEscudo: efeito === "anular_escudo",
    duracaoAnulacaoEscudo: efeito === "anular_escudo" ? "até o começo do próximo turno" : null,
    descricao,
  };
}

/**
 * Caso 47: Penalidade de Armadura Pesada sem Túnica
 *
 * Trajar Armadura Pesada sem uma Túnica por baixo desconta automaticamente 5 PM por turno
 * em combate devido a desconforto e atrito.
 *
 * @param {object} actor Personagem avaliado
 * @param {object} [opcoes={}] Opções adicionais (aplicar: boolean para descontar PM do ator)
 * @returns {object} Status da penalidade e detalhes do desconforto
 */
export function verificarPenalidadeArmaduraSemTunica(actor, opcoes = {}) {
  const rawActor = actor?._rawActor || actor;
  if (!rawActor) {
    return {
      penalidadeAtiva: false,
      temArmaduraPesada: false,
      temTunica: false,
      pmDescontado: 0,
    };
  }

  const itens = obterItensAtor(rawActor);

  // 1. Verifica se há armadura pesada equipada
  const armadurasPesadas = itens.filter((i) => {
    if (i.type !== "armadura" || !i.system?.equipado) return false;
    const subtipo = normalizarTexto(i.system?.subtipo || "armadura");
    if (subtipo === "escudo") return false;

    return i.system?.pesada === true || itemPossuiPropriedade(i, "Pesada");
  });

  const temArmaduraPesada = armadurasPesadas.length > 0;

  // 2. Verifica se há túnica equipada sob a armadura
  const tunicasEquipadas = itens.filter((i) => {
    // Túnica pode ser item do tipo armadura ou equipamento
    if (i.system?.equipado === false) return false;
    const nomeNorm = normalizarTexto(i.name || "");
    const subtipoNorm = normalizarTexto(i.system?.subtipo || "");

    return (
      i.system?.tunica === true ||
      subtipoNorm === "tunica" ||
      itemPossuiPropriedade(i, "Tunica") ||
      itemPossuiPropriedade(i, "Túnica") ||
      nomeNorm.includes("tunica")
    );
  });

  const temTunica = tunicasEquipadas.length > 0;

  // Penalidade aplica se tiver armadura pesada E nenhuma túnica por baixo
  const penalidadeAtiva = temArmaduraPesada && !temTunica;
  const pmDescontado = penalidadeAtiva ? 5 : 0;

  let resultadoConsumoMana = null;

  // Se a opção 'aplicar' estiver habilitada e houver penalidade ativa, consome o PM do ator
  if (penalidadeAtiva && (opcoes === true || opcoes?.aplicar === true)) {
    resultadoConsumoMana = consumirMana(rawActor, 5);
  }

  return {
    penalidadeAtiva,
    temArmaduraPesada,
    temTunica,
    pmDescontado,
    custoPM: pmDescontado,
    armaduraPesada: armadurasPesadas[0] || null,
    tunica: tunicasEquipadas[0] || null,
    resultadoConsumoMana,
    motivo: penalidadeAtiva
      ? "Trajar Armadura Pesada sem uma Túnica por baixo desconta 5 PM por turno em combate devido a desconforto e atrito."
      : temArmaduraPesada
      ? "Armadura Pesada vestida confortavelmente sobre uma Túnica (sem penalidade)."
      : "Personagem não está usando Armadura Pesada.",
  };
}

/**
 * Helper ergonômico: Equipa uma arma em um personagem (com 1 ou 2 mãos) e retorna o cálculo tático.
 *
 * @param {object} char Personagem ou Ator
 * @param {string|object} weaponInput Nome da arma canônica ou objeto da arma
 * @param {object|number} [options={}] Opções ({ hands: 1 | 2, ataqueFurioso: boolean })
 * @returns {object} Resultado de calcularArmaMaoEMeia
 */
export function equipWeapon(char, weaponInput, options = {}) {
  const actor = char?._rawActor || char;
  const hands =
    typeof options === "number"
      ? options
      : Number(options?.hands ?? options?.maos ?? 1);

  let weaponObj = null;
  if (typeof weaponInput === "string") {
    const found = CANONICAL_EQUIPAMENTOS.find(
      (e) => normalizarTexto(e.name) === normalizarTexto(weaponInput)
    );
    weaponObj = found
      ? JSON.parse(JSON.stringify(found))
      : { name: weaponInput, type: "arma", system: { fn: 0, dano: 0, equipado: true } };
  } else if (weaponInput && typeof weaponInput === "object") {
    weaponObj = JSON.parse(JSON.stringify(weaponInput));
  } else {
    weaponObj = { name: "Arma", type: "arma", system: { fn: 0, dano: 0, equipado: true } };
  }

  weaponObj.type = weaponObj.type || "arma";
  weaponObj.system = {
    ...(weaponObj.system || {}),
    fn: weaponObj.system?.fn ?? weaponObj.fn ?? 0,
    dano: weaponObj.system?.dano ?? weaponObj.dano ?? weaponObj.damage ?? 0,
    equipado: true,
    maosEmpunhadas: hands,
  };

  if (actor && typeof actor.addItem === "function") {
    actor.addItem(weaponObj);
  } else if (actor && Array.isArray(actor.items)) {
    actor.items.push(weaponObj);
  }

  return calcularArmaMaoEMeia(weaponObj, hands, {
    ...(typeof options === "object" ? options : {}),
    actor,
  });
}

/**
 * Helper ergonômico: Calcula os parâmetros de um ataque contra um alvo considerando Transpor.
 *
 * @param {object} attackConfig Configuração do ataque ou arma
 * @param {object} target Alvo defensor
 * @returns {object} Resultado do cálculo com effectiveTargetDefense
 */
export function calculateAttackVsTarget(attackConfig = {}, target = {}) {
  const arma = attackConfig?.arma || attackConfig?.weapon || attackConfig;
  const propRaw =
    attackConfig?.weaponProperty ??
    attackConfig?.property ??
    attackConfig?.propriedade ??
    "";

  const hasExplicitNonTranspor =
    Boolean(propRaw) &&
    normalizarSlugProp(propRaw) !== "transpor" &&
    !itemPossuiPropriedade(arma, "Transpor");

  const resultadoTranspor = processarPropriedadeTranspor(attackConfig, target);

  if (hasExplicitNonTranspor || attackConfig?.transpor === false) {
    return {
      ...resultadoTranspor,
      ignoraEscudo: false,
      ignoraCobertura: false,
      bonusEscudoIgnorado: 0,
      bonusCoberturaIgnorado: 0,
      bonusTotalIgnorado: 0,
      defesaEfetiva: resultadoTranspor.defesaOriginal,
      effectiveTargetDefense: resultadoTranspor.defesaOriginal,
      defesaFinal: resultadoTranspor.defesaOriginal,
      bloqueioEfetivo: resultadoTranspor.bloqueioOriginal,
    };
  }

  return resultadoTranspor;
}

/**
 * Helper ergonômico: Equipa uma armadura ou túnica em um personagem.
 *
 * @param {object} char Personagem ou Ator
 * @param {string|object} armorInput Nome do item canônico (ex: 'Armadura Completa', 'Túnica Pesada') ou objeto
 * @param {object} [options={}] Opções adicionais ({ equipado: true, comTunica: false })
 * @returns {object} O item equipado
 */
export function equipArmor(char, armorInput, options = {}) {
  const actor = char?._rawActor || char;
  const equipado = options?.equipado !== false;

  let itemObj = null;
  if (typeof armorInput === "string") {
    const normInput = normalizarTexto(armorInput);
    const found = CANONICAL_EQUIPAMENTOS.find(
      (e) => normalizarTexto(e.name) === normInput
    );
    if (found) {
      itemObj = JSON.parse(JSON.stringify(found));
    } else if (normInput.includes("tunica")) {
      itemObj = {
        name: armorInput,
        type: "equipamento",
        system: { subtipo: "tunica", tunica: true, equipado },
      };
    } else {
      const isPesada =
        normInput.includes("completa") ||
        normInput.includes("batalha") ||
        normInput.includes("pesada") ||
        normInput.includes("cota de malha");
      itemObj = {
        name: armorInput,
        type: "armadura",
        system: { subtipo: "armadura", pesada: isPesada, equipado },
      };
    }
  } else if (armorInput && typeof armorInput === "object") {
    itemObj = JSON.parse(JSON.stringify(armorInput));
  }

  if (itemObj) {
    itemObj.type = itemObj.type || "armadura";
    itemObj.system = { ...(itemObj.system || {}), equipado };
    if (actor && typeof actor.addItem === "function") {
      actor.addItem(itemObj);
    } else if (actor && Array.isArray(actor.items)) {
      actor.items.push(itemObj);
    }
  }

  if (options?.comTunica === true || options?.withTunic === true) {
    equipArmor(actor, "Túnica Pesada", { equipado: true });
  }

  return itemObj;
}

/**
 * Helper ergonômico: Processa o início/fim de um turno de combate para um personagem,
 * aplicando a verificação e desconto de 5 PM caso traje Armadura Pesada sem Túnica.
 *
 * @param {object} char Personagem ou Ator
 * @param {object} [options={}] Opções adicionais
 * @returns {object} Resultado de verificarPenalidadeArmaduraSemTunica
 */
export function processCombatTurn(char, options = {}) {
  return verificarPenalidadeArmaduraSemTunica(char, { aplicar: true, ...options });
}

