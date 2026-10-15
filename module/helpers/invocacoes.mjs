/**
 * Módulo de Regras Canônicas para Companheiros Animais, Invocações e Construtos (Mighty Blade 3e).
 *
 * Subtítulo 12: Companheiros Animais, Invocações e Construtos
 * - Validação de limite de invocações e companheiros ativos por conjurador.
 * - Escalonamento de estatísticas (PV, Defesa, Dano) baseado em Vontade ou Nível.
 * - Manutenção de controle e consumo de Mana sustentado por turno/minuto.
 */

import { consumirMana } from "./danos-condicoes.mjs";

/**
 * Normaliza string para comparação sem acentos, minúsculo e sem pontuação.
 * @param {string} s
 * @returns {string}
 */
export function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Limite padrão de invocações/familiares ativos para qualquer personagem sem talentos especiais.
 */
export const LIMITE_PADRAO_INVOCACOES = 1;

/**
 * Tabela com as estatísticas base canônicas por tipo de criatura invocada/criada.
 */
export const TABELA_BASE_INVOCACOES = Object.freeze({
  golem: {
    nome: "Golem",
    pvBase: 30,
    defesaBase: 10,
    danoBase: 6,
    fatorPv: 5,       // +5 PV por ponto do atributo de escala
    fatorDefesa: 1,   // +1 Defesa a cada 2 pontos do atributo (+0.5/pt)
    fatorDano: 1,     // +1 Dano a cada 2 pontos do atributo (+0.5/pt)
  },
  familiar: {
    nome: "Familiar",
    pvBase: 15,
    defesaBase: 8,
    danoBase: 3,
    fatorPv: 3,       // +3 PV por ponto do atributo de escala
    fatorDefesa: 1,
    fatorDano: 1,
  },
  construto: {
    nome: "Construto",
    pvBase: 25,
    defesaBase: 9,
    danoBase: 5,
    fatorPv: 4,       // +4 PV por ponto do atributo de escala
    fatorDefesa: 1,
    fatorDano: 1,
  },
  elemental: {
    nome: "Elemental",
    pvBase: 20,
    defesaBase: 8,
    danoBase: 6,
    fatorPv: 4,
    fatorDefesa: 1,
    fatorDano: 1,
  },
  companheiro_animal: {
    nome: "Companheiro Animal",
    pvBase: 20,
    defesaBase: 8,
    danoBase: 4,
    fatorPv: 5,
    fatorDefesa: 1,
    fatorDano: 1,
  },
});

/**
 * Custo padrão de Mana sustentada por turno/minuto para manter invocações ativas no campo.
 */
export const CUSTO_MANUTENCAO_PADRAO = Object.freeze({
  familiar: 1,           // 1 PM por turno
  construto: 2,          // 2 PM por turno
  elemental: 2,          // 2 PM por turno
  golem: 3,              // 3 PM por turno
  companheiro_animal: 0, // Companheiros mundanos normalmente não consomem mana contínua
  padrao: 2,
});

/**
 * Obtém o valor numérico da Vontade de um Ator ou objeto conjurador.
 * @param {object} actor
 * @returns {number}
 */
export function getVontade(actor) {
  if (!actor) return 0;
  const v =
    actor.system?.attributes?.vontade?.value ??
    actor.system?.attributes?.vontade?.base ??
    actor.system?.attributes?.vontade ??
    actor.attributes?.vontade?.value ??
    actor.attributes?.vontade ??
    actor.vontade ??
    0;
  return Math.max(0, Number(v) || 0);
}

/**
 * Obtém o valor numérico do Nível de um Ator ou objeto conjurador.
 * @param {object} actor
 * @returns {number}
 */
export function getNivel(actor) {
  if (!actor) return 1;
  const n =
    actor.system?.details?.nivel ??
    actor.details?.nivel ??
    actor.nivel ??
    1;
  return Math.max(1, Number(n) || 1);
}

/**
 * Verifica se um Ator possui determinado talento, habilidade ou caminho.
 * Checa items, system.details.caminho, system.details.classe e flags.
 * @param {object} actor
 * @param {string|string[]} matchers
 * @returns {boolean}
 */
export function hasItemOrAbility(actor, matchers) {
  if (!actor) return false;
  const list = Array.isArray(matchers) ? matchers : [matchers];
  const normalizedMatches = list.map((m) => norm(m));

  // 1. Checa caminho e classe em system.details
  const caminho = norm(actor.system?.details?.caminho || actor.caminho || actor.system?.caminho || "");
  const classe = norm(actor.system?.details?.classe || actor.classe || actor.system?.classe || "");
  for (const m of normalizedMatches) {
    if (caminho === m || caminho.includes(m) || classe === m || classe.includes(m)) {
      return true;
    }
  }

  // 2. Checa array de items
  const items = Array.isArray(actor.items)
    ? actor.items
    : (actor.items?.contents || []);

  for (const item of items) {
    const itemName = norm(item.name || item.system?.name || "");
    const slug = norm(item.flags?.["mighty-blade"]?.slug || item.slug || "");
    for (const m of normalizedMatches) {
      if (itemName === m || itemName.includes(m) || slug === m || slug.includes(m)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calcula o limite máximo canônico de invocações / companheiros animais que um ator pode manter simultaneamente.
 *
 * Regras Canônicas:
 * - Padrão: 1 Companheiro Animal / Familiar ativo.
 * - Companheiro Animal 2: limite de 2.
 * - Companheiro Animal 3: limite de 3.
 * - Companheiro Animal 4: limite de 4 (permite atrair um segundo companheiro animal + bonificações).
 * - Hierofante: limite expandido para 2.
 * - Domador / Mestre Domador: limite expande pela Vontade (mínimo 2, ou floor(Vontade / 2)).
 * - Invocador: conjurador especializado, limite expande pela Vontade (mínimo 2, ou floor(Vontade / 2)).
 *
 * @param {object} actor
 * @returns {number} Limite máximo numérico
 */
export function calcularLimiteInvocacoes(actor) {
  if (!actor) return LIMITE_PADRAO_INVOCACOES;

  let limite = LIMITE_PADRAO_INVOCACOES;
  const vontade = getVontade(actor);

  // Companheiro Animal tiers
  if (hasItemOrAbility(actor, ["companheiro animal 4", "companheiro-animal-4"])) {
    limite = Math.max(limite, 4);
  } else if (hasItemOrAbility(actor, ["companheiro animal 3", "companheiro-animal-3"])) {
    limite = Math.max(limite, 3);
  } else if (hasItemOrAbility(actor, ["companheiro animal 2", "companheiro-animal-2"])) {
    limite = Math.max(limite, 2);
  }

  // Hierofante
  if (hasItemOrAbility(actor, ["hierofante"])) {
    limite = Math.max(limite, 2);
  }

  // Domador / Mestre Domador
  if (hasItemOrAbility(actor, ["domador", "mestre domador", "mestre-domador"])) {
    const limiteDomador = Math.max(2, Math.floor(vontade / 2));
    limite = Math.max(limite, limiteDomador);
  }

  // Invocador
  if (hasItemOrAbility(actor, ["invocador"])) {
    const limiteInvocador = Math.max(2, Math.floor(vontade / 2));
    limite = Math.max(limite, limiteInvocador);
  }

  return limite;
}

/**
 * Valida se a quantidade atual e pretendida de invocações respeita o teto permitido pelo Ator.
 *
 * @param {object} actor Conjurador/Personagem
 * @param {number|Array} invocacoesAtuais Quantidade numérica ou lista de invocações já ativas
 * @param {number|Array} [novasInvocacoes=0] Quantidade ou lista de novas invocações a serem adicionadas
 * @returns {{
 *   valido: boolean,
 *   permitido: boolean,
 *   limite: number,
 *   atuais: number,
 *   novas: number,
 *   total: number,
 *   restante: number,
 *   excedente: number,
 *   podeInvocar: boolean,
 *   podeAdicionar: boolean,
 *   motivo: string|null
 * }}
 */
export function validarLimiteInvocacoes(actor, invocacoesAtuais = 0, novasInvocacoes = 0) {
  const atuais = Array.isArray(invocacoesAtuais)
    ? invocacoesAtuais.length
    : Math.max(0, Number(invocacoesAtuais) || 0);

  const novas = Array.isArray(novasInvocacoes)
    ? novasInvocacoes.length
    : Math.max(0, Number(novasInvocacoes) || 0);

  const total = atuais + novas;
  const limite = calcularLimiteInvocacoes(actor);
  const valido = total <= limite;

  return {
    valido,
    permitido: valido,
    limite,
    atuais,
    novas,
    total,
    restante: Math.max(0, limite - total),
    excedente: Math.max(0, total - limite),
    podeInvocar: atuais < limite,
    podeAdicionar: atuais < limite,
    motivo: valido
      ? null
      : `Limite de invocações excedido: ${total} convocadas para um limite máximo de ${limite}.`,
  };
}

/**
 * Normaliza a chave do tipo de invocação para um padrão da tabela base.
 * @param {string} tipo
 * @returns {string}
 */
export function normalizarTipoInvocacao(tipo) {
  const n = norm(tipo);
  if (n.includes("golem")) return "golem";
  if (n.includes("familiar")) return "familiar";
  if (n.includes("construto") || n.includes("construct")) return "construto";
  if (n.includes("elemental")) return "elemental";
  if (n.includes("companheiro") || n.includes("animal") || n.includes("besta")) return "companheiro_animal";
  return n || "golem";
}

/**
 * Calcula o escalonamento proporcional das estatísticas (PV, Defesa, Dano) de uma invocação
 * baseado na Vontade ou Nível do conjurador e talentos específicos.
 *
 * @param {string|object} tipoInvocacao Nome ('golem', 'familiar', etc.) ou objeto com dados base customizados
 * @param {object} conjurador Ator conjurador ou objeto com dados de vontade/nível
 * @param {object} [opcoes={}] Opções de customização:
 *   - escalarPor: 'vontade' | 'nivel' (padrão: 'vontade' se disponível, senão 'nivel')
 *   - fatorPv: multiplicador customizado de PV por ponto
 *   - fatorDefesa: multiplicador customizado de Defesa
 *   - fatorDano: multiplicador customizado de Dano
 *   - pvBase: sobreposição de PV base
 *   - defesaBase: sobreposição de Defesa base
 *   - danoBase: sobreposição de Dano base
 * @returns {{
 *   tipo: string,
 *   nome: string,
 *   pv: number,
 *   defesa: number,
 *   dano: number,
 *   pvBase: number,
 *   defesaBase: number,
 *   danoBase: number,
 *   bonusPv: number,
 *   bonusDefesa: number,
 *   bonusDano: number,
 *   escalonamento: object
 * }}
 */
export function calcularEscalonamentoInvocacao(tipoInvocacao, conjurador, opcoes = {}) {
  const tipoRaw = typeof tipoInvocacao === "string"
    ? tipoInvocacao
    : (tipoInvocacao?.tipo || tipoInvocacao?.tipoInvocacao || "golem");

  const tipo = normalizarTipoInvocacao(tipoRaw);
  const tabelaBase = TABELA_BASE_INVOCACOES[tipo] || TABELA_BASE_INVOCACOES.golem;

  const dadosCustom = typeof tipoInvocacao === "object" && tipoInvocacao !== null ? tipoInvocacao : {};

  // Estatísticas base (tabela base, sobrescritas por tipoInvocacao e por opcoes)
  const pvBase = Number(opcoes.pvBase ?? dadosCustom.pvBase ?? tabelaBase.pvBase) || 0;
  const defesaBase = Number(opcoes.defesaBase ?? dadosCustom.defesaBase ?? tabelaBase.defesaBase) || 0;
  const danoBase = Number(opcoes.danoBase ?? dadosCustom.danoBase ?? tabelaBase.danoBase) || 0;

  const fatorPv = Number(opcoes.fatorPv ?? dadosCustom.fatorPv ?? tabelaBase.fatorPv) || 1;
  const fatorDefesa = Number(opcoes.fatorDefesa ?? dadosCustom.fatorDefesa ?? tabelaBase.fatorDefesa) || 1;
  const fatorDano = Number(opcoes.fatorDano ?? dadosCustom.fatorDano ?? tabelaBase.fatorDano) || 1;

  // Atributos do conjurador
  const vontade = getVontade(conjurador);
  const nivel = getNivel(conjurador);

  // Determinação do atributo de escalonamento: 'vontade' ou 'nivel'
  const modoEscala = norm(
    opcoes.escalarPor ||
    opcoes.baseadoEm ||
    dadosCustom.escalarPor ||
    dadosCustom.baseadoEm ||
    ""
  );

  let atributoUsado = "vontade";
  let valorAtributo = vontade;

  if (modoEscala === "nivel") {
    atributoUsado = "nivel";
    valorAtributo = nivel;
  } else if (modoEscala === "vontade") {
    atributoUsado = "vontade";
    valorAtributo = vontade;
  } else if (vontade <= 0 && nivel > 0) {
    atributoUsado = "nivel";
    valorAtributo = nivel;
  } else {
    // Padrão canônico do Mighty Blade: Vontade governa o controle e potência mágica
    atributoUsado = "vontade";
    valorAtributo = vontade;
  }

  // Bônus derivados da escala proporcional
  const bonusPvEscala = valorAtributo * fatorPv;
  const bonusDefesaEscala = Math.floor((valorAtributo * fatorDefesa) / 2);
  const bonusDanoEscala = Math.floor((valorAtributo * fatorDano) / 2);

  // Bônus canônicos de habilidades do conjurador
  let bonusHabilidadePv = 0;
  let bonusHabilidadeDefesa = 0;

  // Invocação Persistente: +10 PVs nas invocações
  if (hasItemOrAbility(conjurador, ["invocacao persistente", "invocacao-persistente"])) {
    bonusHabilidadePv += 10;
  }

  // Invocação Versátil: +2 Defesa automática nas invocações
  if (hasItemOrAbility(conjurador, ["invocacao versatil", "invocacao-versatil"])) {
    bonusHabilidadeDefesa += 2;
  }

  // Companheiro Animal 2 (+5 PV), 3 (+10 PV), 4 (+10 PV cumulativos)
  if (tipo === "companheiro_animal") {
    if (hasItemOrAbility(conjurador, ["companheiro animal 4", "companheiro-animal-4"])) {
      bonusHabilidadePv += 25; // +5 (tier 2) + 10 (tier 3) + 10 (tier 4)
    } else if (hasItemOrAbility(conjurador, ["companheiro animal 3", "companheiro-animal-3"])) {
      bonusHabilidadePv += 15; // +5 (tier 2) + 10 (tier 3)
    } else if (hasItemOrAbility(conjurador, ["companheiro animal 2", "companheiro-animal-2"])) {
      bonusHabilidadePv += 5;
    }
  }

  const bonusPvTotal = bonusPvEscala + bonusHabilidadePv;
  const bonusDefesaTotal = bonusDefesaEscala + bonusHabilidadeDefesa;
  const bonusDanoTotal = bonusDanoEscala;

  const pvFinal = pvBase + bonusPvTotal;
  const defesaFinal = defesaBase + bonusDefesaTotal;
  const danoFinal = danoBase + bonusDanoTotal;

  return {
    tipo,
    nome: dadosCustom.nome || tabelaBase.nome,
    pv: pvFinal,
    defesa: defesaFinal,
    dano: danoFinal,
    pvBase,
    defesaBase,
    danoBase,
    bonusPv: bonusPvTotal,
    bonusDefesa: bonusDefesaTotal,
    bonusDano: bonusDanoTotal,
    escalonamento: {
      atributo: atributoUsado,
      valorAtributo,
      vontade,
      nivel,
      fatorPv,
      fatorDefesa,
      fatorDano,
      bonusEscala: {
        pv: bonusPvEscala,
        defesa: bonusDefesaEscala,
        dano: bonusDanoEscala,
      },
      bonusHabilidades: {
        pv: bonusHabilidadePv,
        defesa: bonusHabilidadeDefesa,
      },
    },
  };
}

/**
 * Calcula o custo de Mana sustentado para manter uma invocação ativa por um determinado número de turnos ou minutos.
 *
 * @param {string|number|object} invocacao Tipo ('golem', etc.), custo fixo por turno, ou objeto com custoManutencao
 * @param {number} turnosAtivos Quantidade de turnos (ou minutos) que a invocação permaneceu em campo
 * @param {object} [opcoes={}] Opções adicionais (ex.: conjurador, desconto)
 * @returns {{
 *   custoPorTurno: number,
 *   turnosAtivos: number,
 *   custoTotal: number,
 *   sustentavel: boolean,
 *   manaAtual: number,
 *   manaRestante: number,
 *   manaFaltante: number,
 *   causaExaustao: boolean
 * }}
 */
export function calcularManutencaoControle(invocacao, turnosAtivos, opcoes = {}) {
  const turnos = Math.max(0, Number(turnosAtivos) || 0);

  let custoPorTurno = 0;
  if (typeof invocacao === "number") {
    custoPorTurno = Math.max(0, invocacao);
  } else if (typeof invocacao === "object" && invocacao !== null) {
    if (invocacao.custoManutencao !== undefined) {
      custoPorTurno = Number(invocacao.custoManutencao) || 0;
    } else if (invocacao.custoPorTurno !== undefined) {
      custoPorTurno = Number(invocacao.custoPorTurno) || 0;
    } else if (invocacao.custo !== undefined) {
      custoPorTurno = Number(invocacao.custo) || 0;
    } else {
      const tipo = normalizarTipoInvocacao(invocacao.tipo || "");
      custoPorTurno = CUSTO_MANUTENCAO_PADRAO[tipo] ?? CUSTO_MANUTENCAO_PADRAO.padrao;
    }
  } else if (typeof invocacao === "string") {
    const tipo = normalizarTipoInvocacao(invocacao);
    custoPorTurno = CUSTO_MANUTENCAO_PADRAO[tipo] ?? CUSTO_MANUTENCAO_PADRAO.padrao;
  } else {
    custoPorTurno = CUSTO_MANUTENCAO_PADRAO.padrao;
  }

  // Descontos opcionais (ex.: talentos ou canalizadores)
  const desconto = Math.max(0, Number(opcoes.desconto) || 0);
  const custoEfetivoPorTurno = Math.max(0, custoPorTurno - desconto);
  const custoTotal = custoEfetivoPorTurno * turnos;

  // Avaliação contra a mana do conjurador se fornecido
  const conjurador = opcoes.conjurador || opcoes.actor || null;
  const manaAtual = conjurador
    ? Number(conjurador.system?.resources?.mana?.value ?? conjurador.mana ?? 0)
    : 0;

  const sustentavel = conjurador ? manaAtual >= custoTotal : true;
  const manaRestante = conjurador ? Math.max(0, manaAtual - custoTotal) : 0;
  const manaFaltante = conjurador ? Math.max(0, custoTotal - manaAtual) : 0;
  const causaExaustao = conjurador ? manaAtual - custoTotal <= 0 : false;

  return {
    custoPorTurno: custoEfetivoPorTurno,
    custoPorTurnoBase: custoPorTurno,
    turnosAtivos: turnos,
    custoTotal,
    sustentavel,
    manaAtual,
    manaRestante,
    manaFaltante,
    causaExaustao,
  };
}

/**
 * Aplica na prática o débito de Mana sustentado da manutenção de controle diretamente sobre o Ator conjurador.
 * Utiliza o fluxo canônico de `consumirMana`, garantindo que exaustão e transbordamento para PV ocorram se necessário.
 *
 * @param {string|number|object} invocacao
 * @param {number} turnosAtivos
 * @param {object} conjurador Ator no Foundry
 * @returns {Promise<object>} Resultado do cálculo com o status de consumo aplicado
 */
export async function aplicarManutencaoControle(invocacao, turnosAtivos, conjurador) {
  const calculo = calcularManutencaoControle(invocacao, turnosAtivos, { conjurador });

  if (conjurador && typeof conjurador.consumirMana === "function") {
    const consumo = await conjurador.consumirMana(calculo.custoTotal);
    return {
      ...calculo,
      consumoAplicado: true,
      resultadoConsumo: consumo,
      manaRestante: consumo.manaRestante,
      vidaRestante: consumo.vidaRestante,
      exausto: conjurador.temCondicao ? conjurador.temCondicao("exausto") : consumo.exausto,
    };
  }

  return {
    ...calculo,
    consumoAplicado: false,
  };
}
