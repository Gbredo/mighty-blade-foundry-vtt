/**
 * Módulo de Regras Canônicas de Equipamentos, Armas, Armaduras e Inaptidão.
 * Mighty Blade 3ª Edição.
 *
 * Implementa as regras canônicas:
 * - Caso 26: Força Necessária (FN)
 * - Caso 27: Efeito Mecânico da Inaptidão (1d6 ou 3d6 descarta o maior)
 * - Caso 28: Limite de Armaduras (Apenas 1 armadura trajada por vez)
 * - Caso 29: Limite de Mãos (Padrão 2 slots de mão)
 * - Caso 30: Exceção Mahok com Braços Extras (4 slots de mão, até 2 armas de duas mãos)
 * - Caso 31: Penalidades da Armadura Pesada (RD 1, bloqueia Atletismo, corrida 3x)
 */

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
 * Determina a quantidade máxima de slots de mão de um ator.
 * Padrão: 2 slots de mão.
 * Exceção: Mahoks com a habilidade "Braços Extras" possuem 4 slots de mão.
 * @param {object} actor
 * @returns {number} 2 ou 4
 */
export function obterMaxSlotsMao(actor) {
  if (!actor) return 2;

  const rawItems = Array.isArray(actor.items)
    ? actor.items
    : (actor.items ? Array.from(actor.items.values?.() ?? []) : []);

  // Verifica raça Mahok
  const racaNome = actor.system?.details?.raca || "";
  const racaDoc = rawItems.find((i) => i.type === "raca");
  const isMahok =
    normalizarTexto(racaNome) === "mahok" ||
    (racaDoc && normalizarTexto(racaDoc.name) === "mahok");

  // Verifica posse da habilidade Braços Extras
  const temBracosExtras = rawItems.some((i) => {
    if (i.type !== "habilidade") return false;
    const nomeNorm = normalizarTexto(i.name);
    return nomeNorm === "bracos extras" || nomeNorm.includes("bracos extras");
  });

  if (isMahok && temBracosExtras) {
    return 4;
  }

  return 2;
}

/**
 * Retorna quantos slots de mão um item consome quando empunhado/equipado.
 * - Armas com propriedade "DuasMaos": 2 slots
 * - Armas de uma mão: 1 slot
 * - Escudos (armadura com subtipo "escudo"): 1 slot
 * - Itens gerais empunhados / com propriedade "OcupaUmaMao" ou sistema indicando 1 mão: 1 slot
 * @param {object} item
 * @returns {number}
 */
export function obterUsoMaosItem(item) {
  if (!item) return 0;
  const sys = item.system || {};
  const props = Array.isArray(sys.propriedades) ? sys.propriedades : [];

  if (item.type === "arma") {
    if (props.includes("DuasMaos") || sys.duasMaos) return 2;
    return 1;
  }

  if (item.type === "armadura") {
    const subtipo = normalizarTexto(sys.subtipo || "armadura");
    if (subtipo === "escudo") return 1;
    return 0; // Armadura de vestir o corpo não consome slots de mão
  }

  if (item.type === "equipamento") {
    if (props.includes("DuasMaos")) return 2;
    if (props.includes("OcupaUmaMao") || props.includes("UmaMao") || sys.maos === 1) return 1;
  }

  return 0;
}

/**
 * Valida o limite canônico de armaduras:
 * Um personagem só pode trajar 1 Armadura por vez (escudos não contam como armadura trajada).
 * @param {object} actor
 * @param {object} [novoItem] Item opcional que se deseja equipar
 * @returns {{ valido: boolean, armadurasEquipadas: object[], erro?: string }}
 */
export function validarLimiteArmaduras(actor, novoItem = null) {
  const rawItems = Array.isArray(actor?.items)
    ? actor.items
    : (actor?.items ? Array.from(actor.items.values?.() ?? []) : []);

  // Armaduras atualmente equipadas (excluindo escudos)
  const armadurasEquipadas = rawItems.filter((i) => {
    if (i.type !== "armadura") return false;
    const subtipo = normalizarTexto(i.system?.subtipo || "armadura");
    return subtipo !== "escudo" && !!i.system?.equipado;
  });

  // Se estiver avaliando a tentativa de equipar um novo item
  if (novoItem && novoItem.type === "armadura") {
    const novoSubtipo = normalizarTexto(novoItem.system?.subtipo || "armadura");
    if (novoSubtipo !== "escudo") {
      const isSameItem = (itemA, itemB) => {
        if (itemA === itemB) return true;
        if (itemA.id && itemB.id && itemA.id === itemB.id) return true;
        if (itemA._id && itemB._id && itemA._id === itemB._id) return true;
        return false;
      };

      const jaEquipadaOutra = armadurasEquipadas.some((i) => !isSameItem(i, novoItem));
      if (jaEquipadaOutra) {
        return {
          valido: false,
          armadurasEquipadas,
          erro: "O personagem só pode trajar 1 Armadura por vez.",
        };
      }
    }
  }

  const valido = armadurasEquipadas.length <= 1;
  return {
    valido,
    armadurasEquipadas,
    erro: valido ? undefined : "O personagem só pode trajar 1 Armadura por vez.",
  };
}

/**
 * Valida o limite de mãos de um personagem.
 * @param {object} actor
 * @param {object} [novoItem]
 * @returns {{
 *   maxSlots: number,
 *   slotsOcupados: number,
 *   slotsLivres: number,
 *   valido: boolean,
 *   armasDuasMaosEquipadas: number,
 *   podeEmpunharDuasArmasDuasMaos: boolean,
 *   erro?: string
 * }}
 */
export function validarLimiteMaos(actor, novoItem = null) {
  const maxSlots = obterMaxSlotsMao(actor);
  const rawItems = Array.isArray(actor?.items)
    ? actor.items
    : (actor?.items ? Array.from(actor.items.values?.() ?? []) : []);

  let slotsOcupados = 0;
  let armasDuasMaosEquipadas = 0;

  for (const item of rawItems) {
    if (!item.system?.equipado) continue;
    const uso = obterUsoMaosItem(item);
    slotsOcupados += uso;
    if (item.type === "arma" && uso === 2) {
      armasDuasMaosEquipadas += 1;
    }
  }

  if (novoItem) {
    const usoNovo = obterUsoMaosItem(novoItem);
    const slotsComNovo = slotsOcupados + usoNovo;
    const validoNovo = slotsComNovo <= maxSlots;
    return {
      maxSlots,
      slotsOcupados: slotsComNovo,
      slotsLivres: Math.max(0, maxSlots - slotsComNovo),
      valido: validoNovo,
      armasDuasMaosEquipadas: armasDuasMaosEquipadas + (usoNovo === 2 ? 1 : 0),
      podeEmpunharDuasArmasDuasMaos: maxSlots >= 4,
      erro: validoNovo ? undefined : `Limite de mãos excedido: requer ${slotsComNovo} mãos, mas o limite é ${maxSlots}.`,
    };
  }

  const valido = slotsOcupados <= maxSlots;
  return {
    maxSlots,
    slotsOcupados,
    slotsLivres: Math.max(0, maxSlots - slotsOcupados),
    valido,
    armasDuasMaosEquipadas,
    podeEmpunharDuasArmasDuasMaos: maxSlots >= 4,
    erro: valido ? undefined : `Limite de mãos excedido: ${slotsOcupados} slots ocupados para um máximo de ${maxSlots}.`,
  };
}

/**
 * Verifica se um personagem atende à Força Necessária (FN) de um item.
 * Se Força do Personagem < FN do Equipamento, o personagem torna-se Inapto ao usar o item.
 * @param {object} actor
 * @param {object} item
 * @returns {{ inapto: boolean, fn: number, forca: number, diferenca: number }}
 */
export function verificarFN(actor, item) {
  const attrs = actor?.system?.attributes || {};
  const forca = Number(attrs.forca?.value ?? attrs.forca?.base ?? 0);
  const fn = Number(item?.system?.fn) || 0;
  const inapto = fn > forca;

  if (item && typeof item === "object") {
    item.inapto = inapto;
    if (item.system && typeof item.system === "object") {
      item.system.inapto = inapto;
    }
  }

  return {
    inapto,
    fn,
    forca,
    diferenca: Math.max(0, fn - forca),
  };
}

/**
 * Determina o efeito mecânico da inaptidão em rolagens de d6.
 *
 * Regra Padrão (Guia Básico 3e Errata / dice.mjs):
 * - Rolagem passa de 2d6 para 1d6.
 * - Dados extras de habilidades (+1d6) NÃO são rolados e convertem-se em +2 fixo cada.
 *
 * Regra Mecânica Variante:
 * - Rolagem de 3d6 descartando o maior dado (mantém a soma dos 2 menores).
 *
 * @param {object} params
 * @param {boolean} [params.inapto=false]
 * @param {number} [params.baseDice=2]
 * @param {number} [params.extraDice=0]
 * @param {number} [params.attribute=0]
 * @param {number} [params.bonus=0]
 * @param {boolean} [params.usarVariante3d6=false]
 * @returns {object} Detalhes da rolagem calculada
 */
export function calcularEfeitoInaptidao({
  inapto = false,
  baseDice = 2,
  extraDice = 0,
  attribute = 0,
  bonus = 0,
  usarVariante3d6 = false,
} = {}) {
  const extra = Math.max(0, Number(extraDice) || 0);
  let effectiveBonus = Number(bonus) || 0;
  let nDice = baseDice;
  let formula = "";
  let inaptoNote = "";

  if (inapto) {
    if (usarVariante3d6) {
      // Variante: 3d6 descartando o maior dado
      nDice = 3;
      if (extra > 0) {
        effectiveBonus += extra * 2;
      }
      formula = `3d6kl2 + ${attribute}`;
      if (effectiveBonus) formula += ` + ${effectiveBonus}`;
      inaptoNote = "3d6 descartando o maior dado (Inapto - Variante)";
      return {
        nDice: 3,
        discardHighest: true,
        effectiveBonus,
        formula,
        inaptoNote,
        inapto: true,
      };
    }

    // Regra Padrão / Canônica da Errata
    nDice = 1;
    if (extra > 0) {
      effectiveBonus += extra * 2;
      inaptoNote = `+${extra}d6 → +${extra * 2} (Inapto)`;
    }
  } else {
    nDice = baseDice + extra;
  }

  const terms = [`${nDice}d6`];
  if (attribute) terms.push(`${attribute}`);
  if (effectiveBonus) terms.push(`${effectiveBonus}`);
  formula = terms.join(" + ");

  return {
    nDice,
    discardHighest: false,
    effectiveBonus,
    formula,
    inaptoNote,
    inapto: !!inapto,
  };
}

/**
 * Simula a resolução de dados para a variante de Inaptidão (3d6 descarta o maior dado).
 * @param {number[]} dados Array com 3 valores de 1 a 6
 * @returns {{ dadosOriginais: number[], descartado: number, mantidos: number[], soma: number }}
 */
export function resolverVariante3d6Descarte(dados) {
  if (!Array.isArray(dados) || dados.length !== 3) {
    throw new Error("A variante requer exatamente 3 valores de dados.");
  }
  const ordenados = [...dados].sort((a, b) => a - b); // menor para maior
  const mantidos = [ordenados[0], ordenados[1]];
  const descartado = ordenados[2]; // maior
  const soma = mantidos[0] + mantidos[1];
  return {
    dadosOriginais: dados,
    descartado,
    mantidos,
    soma,
  };
}

/**
 * Calcula os efeitos e penalidades decorrentes do uso de Armadura Pesada.
 * Regras Canônicas:
 * 1. Concede Redução de Dano (RD 1).
 * 2. Impede os benefícios da Habilidade Atletismo.
 * 3. Reduz a corrida máxima para 3x o Deslocamento (ou 2x se a armadura for Rígida).
 * @param {object} actor
 * @returns {{
 *   pesadaEquipada: boolean,
 *   rigidaEquipada: boolean,
 *   rd: number,
 *   bloqueiaAtletismo: boolean,
 *   fatorCorrida: number
 * }}
 */
export function calcularPenalidadesArmaduraPesada(actor) {
  const rawItems = Array.isArray(actor?.items)
    ? actor.items
    : (actor?.items ? Array.from(actor.items.values?.() ?? []) : []);

  let pesadaEquipada = false;
  let rigidaEquipada = false;

  for (const item of rawItems) {
    if (item.type !== "armadura" || !item.system?.equipado) continue;
    const subtipo = normalizarTexto(item.system?.subtipo || "armadura");
    if (subtipo === "escudo") continue;

    if (item.system?.pesada) pesadaEquipada = true;
    if (item.system?.rigida) rigidaEquipada = true;
  }

  const rd = pesadaEquipada ? 1 : 0;
  const bloqueiaAtletismo = pesadaEquipada;
  const fatorCorrida = rigidaEquipada ? 2 : (pesadaEquipada ? 3 : 4);

  return {
    pesadaEquipada,
    rigidaEquipada,
    rd,
    bloqueiaAtletismo,
    fatorCorrida,
  };
}

/**
 * Aplica a Redução de Dano (RD 1) de Armadura Pesada contra danos físicos corporais ou de projéteis.
 * @param {object} actor
 * @param {number} danoBruto
 * @param {string} [tipoDano="corte"] Ex: "corte", "perfuracao", "contusao", "impacto", "fisico", "corporal", "projetil"
 * @returns {{ danoBruto: number, rdAplicada: number, danoFinal: number, tipoFisico: boolean }}
 */
export function aplicarReducaoDanoArmaduraPesada(actor, danoBruto, tipoDano = "corte") {
  const bruto = Math.max(0, Number(danoBruto) || 0);
  const tipoNorm = normalizarTexto(tipoDano || "corte");
  const tiposFisicos = new Set([
    "corte",
    "cortante",
    "perfuracao",
    "perfurante",
    "contusao",
    "contundente",
    "impacto",
    "fisico",
    "corporal",
    "projetil",
    "projeteis",
  ]);
  const tipoFisico = tiposFisicos.has(tipoNorm);
  const penalidades = calcularPenalidadesArmaduraPesada(actor);
  const rdTotal = Number(actor?.system?.defesas?.rd?.value ?? penalidades.rd ?? 0);
  const rdAplicada = tipoFisico ? rdTotal : 0;
  const danoFinal = bruto > 0 ? Math.max(0, bruto - rdAplicada) : 0;

  return {
    danoBruto: bruto,
    rdAplicada,
    danoFinal,
    tipoFisico,
  };
}

/**
 * Retorna o bônus efetivo da habilidade Atletismo para o personagem.
 * Se o personagem usar armadura pesada, o bônus é cancelado (0).
 * Caso contrário, retorna o bônus canônico (+2).
 * @param {object} actor
 * @returns {number} 0 ou 2
 */
export function obterBonusAtletismo(actor) {
  const rawItems = Array.isArray(actor?.items)
    ? actor.items
    : (actor?.items ? Array.from(actor.items.values?.() ?? []) : []);

  const temAtletismo = rawItems.some(
    (i) => i.type === "habilidade" && normalizarTexto(i.name) === "atletismo"
  );

  if (!temAtletismo) return 0;

  const penalidades = calcularPenalidadesArmaduraPesada(actor);
  if (penalidades.bloqueiaAtletismo) return 0;

  return 2;
}

/**
 * Equipa um item no ator validando estritamente no runtime:
 * - Limite de 1 Armadura Corporal (bloqueia ou substitui a anterior quando substituir=true).
 * - Limite de Slots de Mão (2 padrão, 4 para Mahok com Braços Extras).
 * - Detecção imediata de Inaptidão por Força Necessária (FN).
 *
 * @param {object} actor
 * @param {object|string} itemOuNome
 * @param {object} [opcoes={}]
 * @param {boolean} [opcoes.substituir=false] Se true, desequipa a armadura corporal anterior automaticamente
 * @param {boolean} [opcoes.substituirArmadura=false] Alias para substituir
 * @param {boolean} [opcoes.lancarErro=false] Se true, lança Error em caso de violação
 * @returns {{
 *   sucesso: boolean,
 *   bloqueado: boolean,
 *   erro?: string,
 *   item?: object,
 *   desequipados: string[],
 *   inapto: boolean
 * }}
 */
export function equiparItemSeguramente(actor, itemOuNome, opcoes = {}) {
  const substituir = !!(opcoes.substituir || opcoes.substituirArmadura);
  const lancarErro = !!opcoes.lancarErro;

  const rawItems = Array.isArray(actor?.items)
    ? actor.items
    : (actor?.items ? Array.from(actor.items.values?.() ?? []) : []);

  let targetItem = null;
  if (typeof itemOuNome === "string") {
    const bus = normalizarTexto(itemOuNome);
    targetItem = rawItems.find((i) => normalizarTexto(i.name) === bus || i.id === itemOuNome || i._id === itemOuNome);
  } else if (itemOuNome && typeof itemOuNome === "object") {
    targetItem = rawItems.find(
      (i) =>
        i === itemOuNome ||
        (i.id && i.id === itemOuNome.id) ||
        (i._id && i._id === itemOuNome._id) ||
        normalizarTexto(i.name) === normalizarTexto(itemOuNome.name)
    );
    if (!targetItem) {
      if (typeof actor?.addItem === "function") {
        targetItem = actor.addItem(itemOuNome);
      } else {
        targetItem = itemOuNome;
      }
    }
  }

  if (!targetItem) {
    const msg = "Item não encontrado no inventário do personagem.";
    if (lancarErro) throw new Error(msg);
    return { sucesso: false, bloqueado: true, erro: msg, desequipados: [], inapto: false };
  }

  const desequipados = [];
  const subtipo = normalizarTexto(targetItem.system?.subtipo || "armadura");

  // 1. Validação de Armadura Corporal (Slot Único)
  if (targetItem.type === "armadura" && subtipo !== "escudo") {
    const checkArmadura = validarLimiteArmaduras(actor, targetItem);
    if (!checkArmadura.valido) {
      if (substituir) {
        for (const prev of checkArmadura.armadurasEquipadas) {
          const sameId = (prev.id && targetItem.id && prev.id === targetItem.id) ||
            (prev._id && targetItem._id && prev._id === targetItem._id);
          if (prev !== targetItem && !sameId) {
            if (prev.system) prev.system.equipado = false;
            desequipados.push(prev.name);
          }
        }
      } else {
        if (targetItem.system) targetItem.system.equipado = false;
        if (lancarErro) throw new Error(checkArmadura.erro);
        return {
          sucesso: false,
          bloqueado: true,
          erro: checkArmadura.erro,
          item: targetItem,
          desequipados: [],
          inapto: false,
        };
      }
    }
  }

  // 2. Validação de Slots de Mão (Armas e Escudos)
  const usoMaos = obterUsoMaosItem(targetItem);
  if (usoMaos > 0 && !targetItem.system?.equipado) {
    const checkMaos = validarLimiteMaos(actor, targetItem);
    if (!checkMaos.valido) {
      if (targetItem.system) targetItem.system.equipado = false;
      if (lancarErro) throw new Error(checkMaos.erro);
      return {
        sucesso: false,
        bloqueado: true,
        erro: checkMaos.erro,
        item: targetItem,
        desequipados: [],
        inapto: false,
      };
    }
  }

  // Equipa o item e atualiza estado derivado + flag inapto
  if (!targetItem.system) targetItem.system = {};
  targetItem.system.equipado = true;
  const fnStatus = verificarFN(actor, targetItem);
  actor?.prepareDerivedData?.();

  return {
    sucesso: true,
    bloqueado: false,
    item: targetItem,
    desequipados,
    inapto: fnStatus.inapto,
  };
}

/**
 * Motor central de cálculo e agregação de equipamentos para uma ficha de personagem.
 * @param {object} actor
 * @returns {object} Resumo completo do equipamento equipado e seus efeitos mecânicos
 */
export function calcularEquipamento(actor) {
  const attrs = actor?.system?.attributes || {};
  const forca = Number(attrs.forca?.value ?? attrs.forca?.base ?? 0);
  const rawItems = Array.isArray(actor?.items)
    ? actor.items
    : (actor?.items ? Array.from(actor.items.values?.() ?? []) : []);

  let bonusArmadura = 0;
  let bonusEscudo = 0;
  let maosOcupadas = 0;
  let temCanalizador = false;
  let inaptoArmadura = false;
  let armadurasVestidas = 0;
  let itensInaptos = [];

  const maxSlotsMao = obterMaxSlotsMao(actor);

  for (const item of rawItems) {
    const s = item.system || {};
    if (["arma", "armadura", "equipamento"].includes(item.type)) {
      const fnItem = Number(s.fn) || 0;
      const isItemInapto = fnItem > forca;
      s.inapto = isItemInapto;
      item.inapto = isItemInapto;
    }

    if (!s.equipado) continue;

    const fn = Number(s.fn) || 0;
    const props = Array.isArray(s.propriedades) ? s.propriedades : [];

    if (item.type === "armadura") {
      const subtipo = normalizarTexto(s.subtipo || "armadura");
      const defesa = Number(s.defesa) || 0;

      if (subtipo === "escudo") {
        maosOcupadas += 1;
        if (fn <= forca) {
          bonusEscudo = Math.max(bonusEscudo, defesa);
        } else {
          itensInaptos.push(item);
        }
      } else {
        armadurasVestidas += 1;
        bonusArmadura = Math.max(bonusArmadura, defesa);
        if (fn > forca) {
          inaptoArmadura = true;
          itensInaptos.push(item);
        }
      }
    } else if (item.type === "arma") {
      if (props.includes("DuasMaos") || s.duasMaos) {
        maosOcupadas += 2;
      } else {
        maosOcupadas += 1;
      }

      if (fn > forca) {
        itensInaptos.push(item);
      }

      if (props.includes("Canalizador") || s.canalizador) temCanalizador = true;
    } else if (item.type === "equipamento") {
      if (props.includes("DuasMaos")) maosOcupadas += 2;
      else if (props.includes("OcupaUmaMao") || s.maos === 1) maosOcupadas += 1;

      if (fn > forca) itensInaptos.push(item);
      if (props.includes("Canalizador") || s.canalizador) temCanalizador = true;
    }
  }

  const penalidadesPesada = calcularPenalidadesArmaduraPesada(actor);
  const limiteArmaduras = validarLimiteArmaduras(actor);
  const limiteMaos = validarLimiteMaos(actor);

  return {
    bonusArmadura,
    bonusEscudo,
    maosOcupadas,
    maxSlotsMao,
    maosLivres: Math.max(0, maxSlotsMao - maosOcupadas),
    temCanalizador,
    inaptoArmadura,
    pesadaEquipada: penalidadesPesada.pesadaEquipada,
    rigidaEquipada: penalidadesPesada.rigidaEquipada,
    rd: penalidadesPesada.rd,
    bloqueiaAtletismo: penalidadesPesada.bloqueiaAtletismo,
    fatorCorrida: penalidadesPesada.fatorCorrida,
    limiteArmadurasExcedido: !limiteArmaduras.valido,
    limiteMaosExcedido: !limiteMaos.valido,
    armadurasVestidas,
    itensInaptos,
    isInaptoGeral: inaptoArmadura,
  };
}

