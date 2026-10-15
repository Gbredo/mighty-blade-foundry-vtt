/**
 * Regras Canônicas de Progressão e Aumento de Atributos (Mighty Blade 3e).
 *
 * Fontes Canônicas:
 * - Guia do Vilão (pág. 40): Tabela de progressão 1 a 20 e regras de avanço de nível.
 * - Guia Básico: Benefícios automáticos e evolução heroica.
 *
 * Regra dos Atributos:
 * Nos Níveis 4, 7 e 10 (e no 16 na progressão épica), o herói recebe um incremento
 * obrigatório de +1 em dois Atributos DIFERENTES à escolha do jogador.
 * Nos demais níveis (2, 3, 5, 6, 8, 9, etc.), não há aumento direto de atributos.
 */

export const NIVEIS_COM_AUMENTO_ATRIBUTO = Object.freeze([4, 7, 10, 16]);
export const ATRIBUTOS_CANONICOS = Object.freeze(["forca", "agilidade", "inteligencia", "vontade"]);
export const TETO_NIVEL_PADRAO = 10;
export const NIVEL_MINIMO_APRENDIZ = 2;
export const OPCOES_PONTO_EVOLUCAO = Object.freeze(["vida", "mana", "misto", "aprendiz", "caminho"]);

export const HABILIDADES_AUTOMATICAS_CLASSE = Object.freeze({
  "Guerreiro": "Mestre de Armas 1",
  "Feiticeiro": "Conhecimento Arcano",
  "Ladino": "Gatuno",
  "Sacerdote": "Conhecimento Místico",
  "Paladino": "Mestre de Armas 1",
  "Patrulheiro": "Arqueria",
  "Bardo": "Poesia dos Bardos",
  "Druida": "Conhecimento Místico",
  "Espadachim": "Mestre de Armas 1",
  "Rúnico": "Conhecimento Arcano",
  "Dracomante": "Conhecimento Místico",
  "Necromante": "Conhecimento Arcano",
  "Senescal": "Posição Distinta",
  "Xamã": "Guia Espiritual",
});

const CLASSE_ALIASES = Object.freeze({
  "mago": "Feiticeiro",
  "feiticeiro": "Feiticeiro",
  "guerreiro": "Guerreiro",
  "ladino": "Ladino",
  "sacerdote": "Sacerdote",
  "paladino": "Paladino",
  "patrulheiro": "Patrulheiro",
  "bardo": "Bardo",
  "druida": "Druida",
  "espadachim": "Espadachim",
  "runico": "Rúnico",
  "dracomante": "Dracomante",
  "necromante": "Necromante",
  "senescal": "Senescal",
  "xama": "Xamã",
});

function normStr(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Resolve o nome canônico de uma classe a partir de seu nome, slug ou apelido (ex.: 'mago' -> 'Feiticeiro').
 * @param {string} nomeClasse
 * @returns {string|null}
 */
export function resolverClasseCanonica(nomeClasse) {
  if (!nomeClasse || typeof nomeClasse !== "string") return null;
  const key = normStr(nomeClasse).replace(/[-_]+/g, " ");
  if (CLASSE_ALIASES[key]) return CLASSE_ALIASES[key];
  for (const [canonName] of Object.entries(HABILIDADES_AUTOMATICAS_CLASSE)) {
    if (normStr(canonName) === key) return canonName;
  }
  return null;
}

/**
 * Retorna o nome da Habilidade Automática canônica de uma classe (sem conceder bônus de atributos).
 * @param {string} nomeClasse
 * @returns {string|null}
 */
export function obterHabilidadeAutomaticaClasse(nomeClasse) {
  const canon = resolverClasseCanonica(nomeClasse);
  if (!canon) return null;
  return HABILIDADES_AUTOMATICAS_CLASSE[canon] || null;
}

/**
 * Normaliza e valida a escolha atômica do Ponto de Evolução (Sub-módulo 7.2).
 * Opções canônicas aceitas:
 * - +10 PV ('vida', '10_pv', '+10_pv', '+10 pv', '10pv', 'pv')
 * - +10 PM ('mana', '10_pm', '+10_pm', '+10 pm', '10pm', 'pm')
 * - +5 PV e +5 PM ('misto', '5_pv_5_pm', '+5_pv_5_pm', '+5_pv_+5_pm', '+5 pv e +5 pm', '5pv_5pm', 'hibrido')
 * - Aprendiz de Classe ('aprendiz', 'aprendiz_<classe>', 'aprendiz de <classe>')
 * - Caminho ('caminho', 'caminho_<nome>', 'caminho de <nome>')
 *
 * @param {unknown} rawBenefit
 * @param {string|null} [aprendizClassOpt=null]
 * @returns {{ valido: boolean, tipo?: "vida"|"mana"|"misto"|"aprendiz"|"caminho", pvDelta?: number, pmDelta?: number, aprendizClass?: string, caminhoNome?: string, label?: string, erro?: string }}
 */
export function normalizarPontoEvolucao(rawBenefit, aprendizClassOpt = null) {
  const msgAusente =
    "Distribuição do Ponto de Evolução: Exige a escolha de exatamente 1 dos benefícios: +10 Pontos de Mana ('mana' / '10_pm'), +10 Pontos de Vida ('vida' / '10_pv'), +5 PM e +5 PV ('misto' / '5_pv_5_pm'), ou Aprendiz de Classe ('aprendiz').";
  const msgMultiplos =
    "Distribuição do Ponto de Evolução: Não é permitido escolher múltiplos benefícios no mesmo nível. Exige exatamente 1 escolha válida.";

  if (rawBenefit === undefined || rawBenefit === null || rawBenefit === "" || rawBenefit === false) {
    return { valido: false, erro: msgAusente };
  }

  if (Array.isArray(rawBenefit)) {
    if (rawBenefit.length === 0) return { valido: false, erro: msgAusente };
    if (rawBenefit.length > 1) return { valido: false, erro: msgMultiplos };
    return normalizarPontoEvolucao(rawBenefit[0], aprendizClassOpt);
  }

  if (typeof rawBenefit === "object") {
    return { valido: false, erro: msgMultiplos };
  }

  if (typeof rawBenefit !== "string") {
    return { valido: false, erro: msgAusente };
  }

  const rawNorm = normStr(rawBenefit);
  if (!rawNorm || rawNorm === "nenhum" || rawNorm === "none") {
    return { valido: false, erro: msgAusente };
  }

  // Detecta tentativa de passar múltiplos benefícios em string separada por vírgula, barra ou ';'
  if (rawNorm.includes(",") || rawNorm.includes(";") || rawNorm.includes("/") || rawNorm.includes("|")) {
    return { valido: false, erro: msgMultiplos };
  }

  const slug = rawNorm.replace(/\s+/g, "_");

  // 1. +5 PV e +5 PM ('misto')
  const mistoPatterns = new Set([
    "misto",
    "hibrido",
    "5_pv_5_pm",
    "+5_pv_5_pm",
    "+5_pv_+5_pm",
    "5_pv_e_5_pm",
    "+5_pv_e_5_pm",
    "+5_pv_e_+5_pm",
    "5_pm_5_pv",
    "+5_pm_5_pv",
    "+5_pm_+5_pv",
    "5_pm_e_5_pv",
    "+5_pm_e_5_pv",
    "+5_pm_e_+5_pv",
    "5pv_5pm",
    "+5pv_+5pm",
    "5pv_+5pm",
    "+5pv_5pm",
    "5pm_5pv",
    "5pv_e_5pm",
    "+5pv_e_+5pm",
  ]);
  if (mistoPatterns.has(slug)) {
    if (aprendizClassOpt) return { valido: false, erro: msgMultiplos };
    return { valido: true, tipo: "misto", pvDelta: 5, pmDelta: 5, label: "+5 PV e +5 PM" };
  }

  // 2. +10 PV ('vida')
  const vidaPatterns = new Set([
    "vida",
    "pv",
    "10_pv",
    "+10_pv",
    "10pv",
    "+10pv",
    "10_pontos_de_vida",
    "+10_pontos_de_vida",
  ]);
  if (vidaPatterns.has(slug)) {
    if (aprendizClassOpt) return { valido: false, erro: msgMultiplos };
    return { valido: true, tipo: "vida", pvDelta: 10, pmDelta: 0, label: "+10 PV" };
  }

  // 3. +10 PM ('mana')
  const manaPatterns = new Set([
    "mana",
    "pm",
    "10_pm",
    "+10_pm",
    "10pm",
    "+10pm",
    "10_pontos_de_mana",
    "+10_pontos_de_mana",
  ]);
  if (manaPatterns.has(slug)) {
    if (aprendizClassOpt) return { valido: false, erro: msgMultiplos };
    return { valido: true, tipo: "mana", pvDelta: 0, pmDelta: 10, label: "+10 PM" };
  }

  // 4. Aprendiz de Classe ('aprendiz', 'aprendiz_ladino', 'aprendiz de ladino', 'aprendiz: ladino')
  if (slug === "aprendiz" || slug === "aprendiz_de_classe" || slug.startsWith("aprendiz_") || rawNorm.startsWith("aprendiz ")) {
    let extractedClass = aprendizClassOpt;
    if (!extractedClass && slug !== "aprendiz" && slug !== "aprendiz_de_classe") {
      extractedClass = rawBenefit
        .trim()
        .replace(/^aprendiz(?:\s+de|\s*:|_|\s)+/i, "")
        .trim();
    }
    return {
      valido: true,
      tipo: "aprendiz",
      pvDelta: 0,
      pmDelta: 0,
      aprendizClass: extractedClass || "",
      label: extractedClass ? `Aprendiz de ${extractedClass}` : "Aprendiz de Classe",
    };
  }

  // 5. Caminho ('caminho', 'caminho_<nome>', 'caminho de <nome>')
  if (slug === "caminho" || slug.startsWith("caminho_") || rawNorm.startsWith("caminho ")) {
    const extractedPath = rawBenefit
      .trim()
      .replace(/^caminho(?:\s+de|\s*:|_|\s)*/i, "")
      .trim();
    return {
      valido: true,
      tipo: "caminho",
      pvDelta: 0,
      pmDelta: 0,
      caminhoNome: extractedPath || "",
      label: extractedPath ? `Caminho: ${extractedPath}` : "Caminho",
    };
  }

  // 6. Detecta combinações ilegais como "10_pv_10_pm", "10_pv+10_pm", "vida_e_mana", etc.
  if (
    (slug.includes("pv") && slug.includes("pm")) ||
    (slug.includes("vida") && slug.includes("mana")) ||
    (slug.includes("aprendiz") && (slug.includes("pv") || slug.includes("pm") || slug.includes("vida") || slug.includes("mana")))
  ) {
    return { valido: false, erro: msgMultiplos };
  }

  return { valido: false, erro: msgAusente };
}

/**
 * Retorna os benefícios canônicos concedidos ao atingir determinado nível.
 * @param {number} nivel
 * @returns {{ habilidade: boolean, pontoEvolucao: boolean, atributos: boolean }}
 */
export function beneficiosDoNivel(nivel) {
  if (nivel <= 1) {
    // Nível 1 é a criação inicial do personagem
    return { habilidade: false, pontoEvolucao: false, atributos: false };
  }
  if (nivel <= 10) {
    return {
      habilidade: true,
      pontoEvolucao: true,
      atributos: NIVEIS_COM_AUMENTO_ATRIBUTO.includes(nivel),
    };
  }
  // Progressão épica (11 a 20)
  const impar = nivel % 2 === 1;
  return {
    habilidade: impar,
    pontoEvolucao: !impar && nivel !== 16,
    atributos: nivel === 16,
  };
}

/**
 * Retorna a lista de níveis até `nivelMax` que concedem aumento de atributos.
 * @param {number} nivelMax
 * @returns {number[]}
 */
export function niveisDeAtributo(nivelMax = 10) {
  return NIVEIS_COM_AUMENTO_ATRIBUTO.filter((n) => n <= nivelMax);
}

/**
 * Valida a seleção de atributos para aumento de nível.
 * Regra canônica: exatamente 2 atributos DIFERENTES devem receber +1.
 * @param {number} nivel Nível alcançado
 * @param {string[]} atributosEscolhidos Lista com as chaves dos atributos (ex.: ['forca', 'agilidade'])
 * @returns {{ valido: boolean, erro?: string }}
 */
export function validarAumentoAtributos(nivel, atributosEscolhidos) {
  if (!NIVEIS_COM_AUMENTO_ATRIBUTO.includes(nivel)) {
    return {
      valido: false,
      erro: `O nível ${nivel} não concede aumento de atributos. Níveis válidos: ${NIVEIS_COM_AUMENTO_ATRIBUTO.join(", ")}.`,
    };
  }

  if (!Array.isArray(atributosEscolhidos) || atributosEscolhidos.length !== 2) {
    return {
      valido: false,
      erro: "Devem ser selecionados exatamente 2 atributos para incremento no nível.",
    };
  }

  const [attr1, attr2] = atributosEscolhidos;
  if (!ATRIBUTOS_CANONICOS.includes(attr1) || !ATRIBUTOS_CANONICOS.includes(attr2)) {
    return {
      valido: false,
      erro: `Atributos selecionados inválidos. Permitidos: ${ATRIBUTOS_CANONICOS.join(", ")}.`,
    };
  }

  if (attr1 === attr2) {
    return {
      valido: false,
      erro: "Os dois atributos selecionados devem ser DIFERENTES (não é permitido somar +2 no mesmo atributo).",
    };
  }

  return { valido: true };
}

/**
 * Aplica o incremento de +1 em dois atributos diferentes no ator.
 * @param {object} actor Documento do Ator
 * @param {string[]} atributosEscolhidos Ex.: ['forca', 'agilidade']
 * @returns {boolean} Retorna true se aplicado com sucesso
 */
export function aplicarAumentoAtributos(actor, atributosEscolhidos) {
  if (!actor?.system?.attributes) return false;
  const [attr1, attr2] = atributosEscolhidos;

  if (!actor.system.attributes[attr1]) actor.system.attributes[attr1] = { base: 0, value: 0 };
  if (!actor.system.attributes[attr2]) actor.system.attributes[attr2] = { base: 0, value: 0 };

  actor.system.attributes[attr1].base = (actor.system.attributes[attr1].base ?? 0) + 1;
  actor.system.attributes[attr2].base = (actor.system.attributes[attr2].base ?? 0) + 1;

  if (typeof actor.prepareDerivedData === "function") {
    actor.prepareDerivedData();
  }
  return true;
}
