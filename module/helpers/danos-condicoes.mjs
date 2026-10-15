/**
 * Módulo do Sistema de Danos, Imunidades e Condições do Mighty Blade 3e.
 *
 * Implementa as regras canônicas para:
 * - Caso 32: Imunidade a dano (zera qualquer dano do elemento: Corte, Perfuração, Contusão, Fogo, Frio, Eletricidade).
 * - Caso 33: Resistência a dano (divide o dano por 2, arredondado para baixo: Math.floor(dano / 2)).
 * - Caso 34: Vulnerabilidade a dano (multiplica o dano por 2: dano * 2).
 * - Caso 35: Anulação mútua de Resistência e Vulnerabilidade (processado normalmente em 1x).
 * - Caso 36: Exhaustão de Mana (ao chegar a 0 PM -> condição Exausto e testes Inaptos; gastos/perdas adicionais em PV).
 */

export const ELEMENTOS_CANONICOS = [
  "corte",
  "perfuracao",
  "contusao",
  "fogo",
  "frio",
  "eletricidade",
];

export const CONDICAO_EXAUSTO = "Exausto";

/**
 * Normaliza o identificador de elemento (remove acentos, minúsculo, sem espaços extras).
 * Suporta "Perfuração" -> "perfuracao", "Contusão" -> "contusao", etc.
 * @param {string} elem
 * @returns {string}
 */
export function normalizarElemento(elem) {
  return String(elem || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normaliza nome ou id de condição (remove acentos e espaços, minúsculo).
 * @param {string} cond
 * @returns {string}
 */
export function normalizarCondicao(cond) {
  return String(cond || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Extrai o conjunto de imunidades, resistências e vulnerabilidades de um alvo (Ator ou objeto de perfil).
 * Suporta múltiplas estruturas:
 * - Arrays ou Sets em `alvo.imunidades`, `alvo.resistencias`, `alvo.vulnerabilidades`
 * - Mapas de elemento para grau (`{ fogo: "resistente", frio: "imune" }`)
 * - Efeitos embutidos em itens (`item.system.efeitos: [{ tipo: "resistencia", dano: "fogo", grau: "resistente" }]`)
 * - Efeitos declarativos em `alvo.system.efeitos`
 * @param {object} alvo
 * @returns {{ imunidades: Set<string>, resistencias: Set<string>, vulnerabilidades: Set<string> }}
 */
export function extrairPerfilDano(alvo) {
  const imunidades = new Set();
  const resistencias = new Set();
  const vulnerabilidades = new Set();

  if (!alvo) {
    return { imunidades, resistencias, vulnerabilidades };
  }

  const coletar = (source, targetSet, defaultGrau = null) => {
    if (!source) return;
    if (Array.isArray(source) || source instanceof Set) {
      for (const item of source) {
        if (typeof item === "string") {
          targetSet.add(normalizarElemento(item));
        } else if (item && typeof item === "object") {
          const tipo = normalizarElemento(item.tipo || item.dano || item.elemento || item.id);
          const grau = normalizarElemento(item.grau || defaultGrau);
          if (grau === "imune") imunidades.add(tipo);
          else if (grau === "resistente") resistencias.add(tipo);
          else if (grau === "vulneravel") vulnerabilidades.add(tipo);
          else if (tipo) targetSet.add(tipo);
        }
      }
    } else if (typeof source === "object") {
      for (const [k, v] of Object.entries(source)) {
        const tipo = normalizarElemento(k);
        const grau = normalizarElemento(typeof v === "string" ? v : defaultGrau);
        if (grau === "imune" || (v === true && targetSet === imunidades)) imunidades.add(tipo);
        else if (grau === "resistente" || (v === true && targetSet === resistencias)) resistencias.add(tipo);
        else if (grau === "vulneravel" || (v === true && targetSet === vulnerabilidades)) vulnerabilidades.add(tipo);
      }
    }
  };

  // 1. Configurações diretas passadas no objeto
  coletar(alvo.imunidades, imunidades, "imune");
  coletar(alvo.resistencias, resistencias, "resistente");
  coletar(alvo.vulnerabilidades, vulnerabilidades, "vulneravel");

  // 2. Configurações em alvo.system
  if (alvo.system) {
    coletar(alvo.system.imunidades, imunidades, "imune");
    coletar(alvo.system.resistencias, resistencias, "resistente");
    coletar(alvo.system.vulnerabilidades, vulnerabilidades, "vulneravel");

    if (Array.isArray(alvo.system.efeitos)) {
      for (const ef of alvo.system.efeitos) {
        if (!ef) continue;
        const tipo = normalizarElemento(ef.dano || ef.elemento);
        const grau = normalizarElemento(ef.grau);
        if (ef.tipo === "resistencia") {
          if (grau === "imune") imunidades.add(tipo);
          else if (grau === "vulneravel") vulnerabilidades.add(tipo);
          else resistencias.add(tipo);
        } else if (ef.tipo === "imunidade") {
          imunidades.add(tipo);
        } else if (ef.tipo === "vulnerabilidade") {
          vulnerabilidades.add(tipo);
        }
      }
    }
  }

  // 3. Efeitos de itens embutidos (habilidades, equipamentos, magias)
  const items = alvo.items
    ? (Array.isArray(alvo.items) ? alvo.items : Array.from(alvo.items.values?.() || []))
    : [];

  for (const item of items) {
    const efeitos = item.system?.efeitos || item.efeitos || [];
    if (Array.isArray(efeitos)) {
      for (const ef of efeitos) {
        if (!ef) continue;
        const tipo = normalizarElemento(ef.dano || ef.elemento);
        const grau = normalizarElemento(ef.grau);
        if (ef.tipo === "resistencia") {
          if (grau === "imune") imunidades.add(tipo);
          else if (grau === "vulneravel") vulnerabilidades.add(tipo);
          else resistencias.add(tipo);
        } else if (ef.tipo === "imunidade") {
          imunidades.add(tipo);
        } else if (ef.tipo === "vulnerabilidade") {
          vulnerabilidades.add(tipo);
        }
      }
    }
  }

  return { imunidades, resistencias, vulnerabilidades };
}

/**
 * Calcula o dano final sofrido após aplicar Imunidade, Resistência, Vulnerabilidade e Anulação Mútua.
 *
 * Regras canônicas de Mighty Blade 3e:
 * - Caso 32: Imunidade a dano: Retorna 0 para o elemento correspondente.
 * - Caso 33: Resistência a dano: Divide por 2 (arredondado para baixo - Math.floor(dano / 2)).
 * - Caso 34: Vulnerabilidade a dano: Multiplica por 2 (dano * 2).
 * - Caso 35: Anulação mútua: Se o alvo possui ambas (Resistência e Vulnerabilidade) para o mesmo elemento, o dano é 1x.
 *
 * @param {number} danoBase Valor bruto do dano (antes de defesas e absorções)
 * @param {string} elemento Elemento do dano ("corte", "perfuracao", "contusao", "fogo", "frio", "eletricidade")
 * @param {object} defensor Alvo ou perfil defensivo
 * @returns {number} Dano final processado
 */
export function calcularDano(danoBase, elemento, defensor) {
  const dano = Math.max(0, Number(danoBase) || 0);
  const elem = normalizarElemento(elemento);
  const perfil = extrairPerfilDano(defensor);

  // Caso 32: Imunidade a Dano zera qualquer dano do elemento
  if (perfil.imunidades.has(elem)) {
    return 0;
  }

  const temResistencia = perfil.resistencias.has(elem);
  const temVulnerabilidade = perfil.vulnerabilidades.has(elem);

  // Caso 35: Anulação mútua se possui ambas Resistência e Vulnerabilidade
  if (temResistencia && temVulnerabilidade) {
    return dano;
  }

  // Caso 34: Vulnerabilidade a dano multiplica por 2
  if (temVulnerabilidade) {
    return dano * 2;
  }

  // Caso 33: Resistência a dano divide por 2 (arredondado para baixo)
  if (temResistencia) {
    return Math.floor(dano / 2);
  }

  // Sem modificadores elementais: dano normal (1x)
  return dano;
}

/**
 * Aplica o cálculo de dano elemental e desconta o resultado dos Pontos de Vida (PV) do Ator.
 * @param {object} actor Ator alvo
 * @param {number} danoBase Valor inicial de dano
 * @param {string} elemento Tipo/elemento do dano
 * @returns {{ danoOriginal: number, danoFinal: number, elemento: string, vidaRestante: number }}
 */
export function aplicarDano(actor, danoBase, elemento) {
  const danoFinal = calcularDano(danoBase, elemento, actor);
  if (!actor || !actor.system?.resources?.vida) {
    return { danoOriginal: danoBase, danoFinal, elemento, vidaRestante: 0 };
  }

  const vidaAtual = Number(actor.system.resources.vida.value) || 0;
  const novaVida = Math.max(0, vidaAtual - danoFinal);
  actor.system.resources.vida.value = novaVida;

  return {
    danoOriginal: danoBase,
    danoFinal,
    elemento,
    vidaRestante: novaVida,
  };
}

/**
 * Verifica se o Ator possui determinada condição ativa.
 * Checa: `details.condicao`, `details.aflicoes`, `statuses`, ou mana zerada (para Exausto).
 * @param {object} actor
 * @param {string} condicaoNomeOuId
 * @returns {boolean}
 */
export function temCondicao(actor, condicaoNomeOuId) {
  if (!actor) return false;
  const nBusca = normalizarCondicao(condicaoNomeOuId);

  // 1. Caso especial: Exausto ocorre automaticamente se o Ator estiver com 0 PM
  if (nBusca === "exausto" && Number(actor.system?.resources?.mana?.value) === 0) {
    return true;
  }

  // 2. Verifica string de details.condicao
  const condTexto = normalizarCondicao(actor.system?.details?.condicao || "");
  if (condTexto.includes(nBusca)) return true;

  // 3. Verifica array de details.aflicoes
  const aflicoes = actor.system?.details?.aflicoes || [];
  if (aflicoes.some((a) => normalizarCondicao(a.id) === nBusca || normalizarCondicao(a.nome) === nBusca)) {
    return true;
  }

  // 4. Verifica Set de actor.statuses (Foundry nativo)
  if (actor.statuses instanceof Set && (actor.statuses.has(nBusca) || actor.statuses.has(condicaoNomeOuId))) {
    return true;
  }

  return false;
}

/**
 * Adiciona uma condição ao Ator (em details.condicao e details.aflicoes).
 * @param {object} actor
 * @param {string} condicaoNome
 */
export function adicionarCondicao(actor, condicaoNome) {
  if (!actor) return;
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
  if (!actor.system.details.aflicoes.some((a) => normalizarCondicao(a.id) === nBusca)) {
    actor.system.details.aflicoes.push({
      id: nBusca,
      nome: nomeDisplay,
      efeito: nBusca === "exausto" ? "Todos os testes tornam-se Inaptos (1d6). Gastos de PM são descontados em PV." : "",
      duracao: nBusca === "exausto" ? "Enquanto durar a falta de mana (0 PM) ou até descanso" : "",
    });
  }

  // 3. actor.statuses
  if (actor.statuses instanceof Set) {
    actor.statuses.add(nBusca);
  }
}

/**
 * Remove uma condição do Ator.
 * @param {object} actor
 * @param {string} condicaoNome
 */
export function removerCondicao(actor, condicaoNome) {
  if (!actor) return;
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
}

/**
 * Verifica se um Ator está sob a condição de Inaptidão para testes.
 * Conforme as regras do MB3e:
 * - Personagem na condição Exausto (ou com 0 PM) torna todos os testes Inaptos.
 * - Personagem com condição Inapto direta.
 * - Personagem com armadura pesada com FN > Força.
 * @param {object} actor
 * @returns {boolean}
 */
export function isActorInapto(actor) {
  if (!actor) return false;

  // Caso 36: Ao chegar a 0 PM, o personagem fica na condição Exausto (testes tornam-se Inaptos)
  if (Number(actor.system?.resources?.mana?.value) === 0) {
    return true;
  }

  if (temCondicao(actor, "exausto")) {
    return true;
  }

  if (temCondicao(actor, "inapto")) {
    return true;
  }

  if (actor.system?.equipamento?.inaptoArmadura) {
    return true;
  }

  if (actor.flags?.["mighty-blade"]?.sobrecarga?.inaptoFisicoAgilidade) {
    return true;
  }

  return false;
}

/**
 * Consome ou reduz Pontos de Mana (PM) do Ator.
 * Regras canônicas de Mighty Blade 3e (Caso 36 — Exhaustão de Mana):
 * - Ao chegar a 0 PM, o personagem fica na condição Exausto (todos os testes tornam-se Inaptos).
 * - Perdas e gastos adicionais de PM quando já em 0 PM (ou o excedente que ultrapassar o PM restante)
 *   são descontados diretamente dos Pontos de Vida (PV).
 *
 * @param {object} actor Ator que está gastando ou perdendo PM
 * @param {number} quantidade Quantidade de PM a consumir ou perder
 * @returns {{ manaGasta: number, danoEmVida: number, manaRestante: number, vidaRestante: number, exausto: boolean }}
 */
export function consumirMana(actor, quantidade) {
  const gasto = Math.max(0, Number(quantidade) || 0);
  if (!actor || !actor.system?.resources) {
    return { manaGasta: 0, danoEmVida: 0, manaRestante: 0, vidaRestante: 0, exausto: false };
  }

  const manaRec = actor.system.resources.mana;
  const vidaRec = actor.system.resources.vida;
  const manaAtual = Number(manaRec?.value) || 0;
  const vidaAtual = Number(vidaRec?.value) || 0;

  let manaGasta = 0;
  let danoEmVida = 0;

  if (manaAtual > 0) {
    if (gasto <= manaAtual) {
      manaGasta = gasto;
      manaRec.value = manaAtual - gasto;
    } else {
      manaGasta = manaAtual;
      danoEmVida = gasto - manaAtual;
      manaRec.value = 0;
      vidaRec.value = Math.max(0, vidaAtual - danoEmVida);
    }
  } else {
    // Caso 36: Quando já está em 0 PM, perdas/gastos adicionais são descontados diretamente de PV
    manaRec.value = 0;
    danoEmVida = gasto;
    vidaRec.value = Math.max(0, vidaAtual - danoEmVida);
  }

  const exausto = manaRec.value === 0;

  if (exausto) {
    adicionarCondicao(actor, CONDICAO_EXAUSTO);
  } else {
    // Se ainda possui PM restante, remove a condição Exausto se decorrente de falta de mana
    if (Number(manaRec.value) > 0) {
      removerCondicao(actor, CONDICAO_EXAUSTO);
    }
  }

  return {
    manaGasta,
    danoEmVida,
    manaRestante: manaRec.value,
    vidaRestante: vidaRec.value,
    exausto,
  };
}

/**
 * Recupera Pontos de Mana (PM) do Ator e encerra a condição Exausto se PM > 0.
 * @param {object} actor
 * @param {number} quantidade
 */
export function recuperarMana(actor, quantidade) {
  const ganho = Math.max(0, Number(quantidade) || 0);
  if (!actor || !actor.system?.resources?.mana) return;

  const manaRec = actor.system.resources.mana;
  const max = Number(manaRec.max) || 60;
  manaRec.value = Math.min(max, (Number(manaRec.value) || 0) + ganho);

  if (manaRec.value > 0) {
    removerCondicao(actor, CONDICAO_EXAUSTO);
  }
}
