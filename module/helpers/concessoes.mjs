/**
 * Sistema de "Concessões" e "Avanço" (Advancement Estilo D&D 5e) do Mighty Blade 3.5.
 *
 * Uma raça, classe ou habilidade com avanço concede benefícios e escolhas estruturadas
 * ao ator quando é adicionada à ficha (ou reconfigurada pelo botão de Avanço):
 *   - "habilidade":       concede uma habilidade fixa (por slug ou UUID).
 *   - "escolhaAtributo":  o jogador escolhe 1 dos 4 atributos para receber +X
 *                         (ex.: Humano -> Adaptabilidade; ou habilidade Diversidade,
 *                         que bloqueia o atributo já escolhido em Adaptabilidade).
 *   - "origemDraconica":  fluxo multi-passos do Dragano (Passo 1: Herança Elemental
 *                         com 1 Resistência + 1 Vulnerabilidade; Passo 2: 3 Características
 *                         Dracônicas, ou 4 se sacrificar -1 em um Atributo).
 *                         Cria a habilidade-mãe (Linhagem Dracônica) + sub-features reais
 *                         vinculadas (Asas, Escamas, Cauda, etc. — Opção C).
 *   - "escolhaHabilidade": o jogador escolhe K de N habilidades de uma lista.
 */

import { CANONICAL_HABILIDADES } from "../data/canonical-packs-data.mjs";

export const ATRIBUTOS = {
  forca: "Força",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  vontade: "Vontade",
};

export const LINHAGENS_DRACONICAS = [
  {
    id: "fogo-vuln-frio",
    nome: "Vermelho (Res. Fogo / Vuln. Frio)",
    curto: "Vermelho (Fogo / Frio)",
    cor: "#ef4444",
    icone: "fa-fire",
    resistencia: "fogo",
    resistenciaLabel: "Fogo",
    vulnerabilidade: "frio",
    vulnerabilidadeLabel: "Frio",
    descricao:
      "Herança dos Dragões Vermelhos: você recebe Resistência a Fogo (dano dividido por 2) e Vulnerabilidade a Frio (dano dobrado).",
    efeitos: [
      { tipo: "resistencia", dano: "fogo", grau: "resistente" },
      { tipo: "vulnerabilidade", dano: "frio", grau: "vulneravel" },
    ],
  },
  {
    id: "fogo-vuln-eletr",
    nome: "Vermelho (Res. Fogo / Vuln. Eletricidade)",
    curto: "Vermelho (Fogo / Eletricidade)",
    cor: "#f97316",
    icone: "fa-fire",
    resistencia: "fogo",
    resistenciaLabel: "Fogo",
    vulnerabilidade: "eletricidade",
    vulnerabilidadeLabel: "Eletricidade",
    descricao:
      "Herança dos Dragões Vermelhos: você recebe Resistência a Fogo (dano dividido por 2) e Vulnerabilidade a Eletricidade (dano dobrado).",
    efeitos: [
      { tipo: "resistencia", dano: "fogo", grau: "resistente" },
      { tipo: "vulnerabilidade", dano: "eletricidade", grau: "vulneravel" },
    ],
  },
  {
    id: "frio-vuln-fogo",
    nome: "Branco (Res. Frio / Vuln. Fogo)",
    curto: "Branco (Frio / Fogo)",
    cor: "#38bdf8",
    icone: "fa-snowflake",
    resistencia: "frio",
    resistenciaLabel: "Frio",
    vulnerabilidade: "fogo",
    vulnerabilidadeLabel: "Fogo",
    descricao:
      "Herança dos Dragões Brancos: você recebe Resistência a Frio (dano dividido por 2) e Vulnerabilidade a Fogo (dano dobrado).",
    efeitos: [
      { tipo: "resistencia", dano: "frio", grau: "resistente" },
      { tipo: "vulnerabilidade", dano: "fogo", grau: "vulneravel" },
    ],
  },
  {
    id: "frio-vuln-eletr",
    nome: "Branco (Res. Frio / Vuln. Eletricidade)",
    curto: "Branco (Frio / Eletricidade)",
    cor: "#0ea5e9",
    icone: "fa-snowflake",
    resistencia: "frio",
    resistenciaLabel: "Frio",
    vulnerabilidade: "eletricidade",
    vulnerabilidadeLabel: "Eletricidade",
    descricao:
      "Herança dos Dragões Brancos: você recebe Resistência a Frio (dano dividido por 2) e Vulnerabilidade a Eletricidade (dano dobrado).",
    efeitos: [
      { tipo: "resistencia", dano: "frio", grau: "resistente" },
      { tipo: "vulnerabilidade", dano: "eletricidade", grau: "vulneravel" },
    ],
  },
  {
    id: "eletr-vuln-fogo",
    nome: "Verde (Res. Eletricidade / Vuln. Fogo)",
    curto: "Verde (Eletricidade / Fogo)",
    cor: "#22c55e",
    icone: "fa-bolt",
    resistencia: "eletricidade",
    resistenciaLabel: "Eletricidade",
    vulnerabilidade: "fogo",
    vulnerabilidadeLabel: "Fogo",
    descricao:
      "Herança dos Dragões Verdes: você recebe Resistência a Eletricidade (dano dividido por 2) e Vulnerabilidade a Fogo (dano dobrado).",
    efeitos: [
      { tipo: "resistencia", dano: "eletricidade", grau: "resistente" },
      { tipo: "vulnerabilidade", dano: "fogo", grau: "vulneravel" },
    ],
  },
  {
    id: "eletr-vuln-frio",
    nome: "Verde (Res. Eletricidade / Vuln. Frio)",
    curto: "Verde (Eletricidade / Frio)",
    cor: "#10b981",
    icone: "fa-bolt",
    resistencia: "eletricidade",
    resistenciaLabel: "Eletricidade",
    vulnerabilidade: "frio",
    vulnerabilidadeLabel: "Frio",
    descricao:
      "Herança dos Dragões Verdes: você recebe Resistência a Eletricidade (dano dividido por 2) e Vulnerabilidade a Frio (dano dobrado).",
    efeitos: [
      { tipo: "resistencia", dano: "eletricidade", grau: "resistente" },
      { tipo: "vulnerabilidade", dano: "frio", grau: "vulneravel" },
    ],
  },
];

export const CARACTERISTICAS_DRACONICAS = [
  {
    id: "asas",
    slug: "carac-draconica-asas",
    nome: "Asas",
    icone: "fa-feather-pointed",
    img: "icons/svg/wing.svg",
    resumo: "Imune a dano de queda • Pré-requisito: Asas Pesadas",
    descricao:
      "Suas asas permitem amenizar quedas (você é Imune a dano de queda) e planeio curto. Necessário para adquirir Asas Pesadas.",
  },
  {
    id: "barbatanas",
    slug: "carac-draconica-barbatanas",
    nome: "Barbatanas",
    icone: "fa-water",
    img: "icons/svg/aura.svg",
    resumo: "+1d6 nadar, equilibrar e evitar queda • Pré-requisito: Anfíbio",
    descricao:
      "Concede +1d6 em testes para nadar, se equilibrar e evitar ser derrubado. Necessário para adquirir Anfíbio.",
  },
  {
    id: "cauda",
    slug: "carac-draconica-cauda",
    nome: "Cauda",
    icone: "fa-dragon",
    img: "icons/svg/sword.svg",
    resumo: "Ataque desarmado (Força/Contusão) • Pré-requisito: Reflexos Dracônicos",
    descricao:
      "Permite realizar ataques desarmados corporais usando a cauda (Dano: Força / Contusão). Necessário para adquirir Reflexos Dracônicos.",
  },
  {
    id: "garras",
    slug: "carac-draconica-garras",
    nome: "Chifres, Garras e Presas",
    icone: "fa-paw",
    img: "icons/svg/pawprint.svg",
    resumo: "+1d6 desarmado, agarrar e escalar • Pré-requisito: Armas Naturais",
    descricao:
      "Concede +1d6 em ataques desarmados, testes para agarrar e escalar. Necessário para adquirir Armas Naturais.",
  },
  {
    id: "escamas",
    slug: "carac-draconica-escamas",
    nome: "Escamas",
    icone: "fa-shield-halved",
    img: "icons/svg/shield.svg",
    resumo: "Defesa +2 (Bônus de Armadura) • Pré-requisito: Escamas Pesadas",
    descricao:
      "Oferece bônus de Armadura na Defesa de +2 (+2 Bloqueio e +2 Esquiva). Necessário para adquirir Escamas Pesadas.",
  },
  {
    id: "olhos",
    slug: "carac-draconica-olhos",
    nome: "Olhos Dracônicos",
    icone: "fa-eye",
    img: "icons/svg/eye.svg",
    resumo: "+1d6 testes visuais e ataques à distância • Pré-requisito: Membrana Nictitante",
    descricao:
      "Concede +1d6 em testes de percepção visual e ataques à distância. Necessário para adquirir Membrana Nictitante.",
  },
];

/**
 * Retorna a lista efetiva de concessões de um item de raça, classe ou habilidade.
 * @param {Item|object} item
 * @returns {Array<object>}
 */
export function getConcessoes(item) {
  const list = item?.system?.concessoes;
  const slug = item?.flags?.["mighty-blade"]?.slug || "";
  const nomeNorm = String(item?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Garante que Dragano (mesmo vindo de pack legado com `{ tipo: "habilidade", ref: "linhagem-draconica" }`)
  // sempre dispare o Wizard Multi-Passos `origemDraconica`
  if (item?.type === "raca" && (slug === "dragano" || nomeNorm === "dragano")) {
    if (Array.isArray(list) && list.some((c) => c.tipo === "origemDraconica")) {
      return list;
    }
    return [
      {
        tipo: "origemDraconica",
        ref: "linhagem-draconica",
        titulo: "Linhagem & Características Dracônicas",
        escolhaDraconica: true,
      },
    ];
  }

  // Garante que Humano sempre dispare o Wizard `escolhaAtributo` para Adaptabilidade
  if (item?.type === "raca" && (slug === "humano" || nomeNorm === "humano")) {
    if (Array.isArray(list) && list.some((c) => c.tipo === "escolhaAtributo")) {
      return list;
    }
    return [
      {
        tipo: "escolhaAtributo",
        ref: "adaptabilidade",
        valor: 1,
        titulo: "Adaptabilidade",
      },
    ];
  }

  if (Array.isArray(list) && list.length) return list;

  if (item?.system?.habilidadeUuid) {
    return [{ tipo: "habilidade", uuid: item.system.habilidadeUuid }];
  }
  return [];
}

/**
 * Descobre qual atributo já foi escolhido em uma habilidade específica do ator (ex.: Adaptabilidade).
 * @param {Actor|object} actor
 * @param {string} nomeOuSlugHabilidade
 * @returns {string|null}
 */
export function obterAtributoEscolhidoDeHabilidade(actor, nomeOuSlugHabilidade = "Adaptabilidade") {
  if (!actor) return null;
  const rawItems = Array.isArray(actor.items)
    ? actor.items
    : Array.from(actor.items?.values?.() || []);
  const alvoNorm = String(nomeOuSlugHabilidade || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const hab = rawItems.find((i) => {
    if (i.type !== "habilidade") return false;
    const n = String(i.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    const s = String(i.flags?.["mighty-blade"]?.slug || "").toLowerCase();
    return n === alvoNorm || n.startsWith(alvoNorm) || s === alvoNorm;
  });

  if (!hab) return null;
  const ef = (hab.system?.efeitos || []).find((e) => e.tipo === "bonusAtributo" && Number(e.valor) > 0);
  if (ef?.atributo) return ef.atributo;
  if (hab.system?.bonusAtributo?.atributo) return hab.system.bonusAtributo.atributo;
  return hab.flags?.["mighty-blade"]?.advancementChoices?.atributo || null;
}

/**
 * Aplica os dados de uma escolha de atributo (Adaptabilidade ou Diversidade) em um objeto de item.
 * @param {object} itemData Objeto do item de habilidade
 * @param {string} atributo Chave do atributo ("forca" | "agilidade" | "inteligencia" | "vontade")
 * @param {number} [valor=1] Valor do bônus
 * @param {object} [opts={}] Opções extras (ex: { actor })
 * @returns {object} itemData mutado
 */
export function aplicarEscolhaAtributoNoItem(itemData, atributo, valor = 1, opts = {}) {
  if (!itemData || !atributo || !ATRIBUTOS[atributo]) {
    throw new Error(`Atributo inválido para avanço: "${atributo}".`);
  }

  if (opts.excluirAtributo && atributo === opts.excluirAtributo) {
    throw new Error(
      `O atributo ${ATRIBUTOS[atributo]} já foi selecionado em ${opts.excluirMotivo || "Adaptabilidade"} e não pode ser repetido.`
    );
  }

  const sinal = valor >= 0 ? `+${valor}` : `${valor}`;
  const labelAttr = ATRIBUTOS[atributo];

  itemData.system = itemData.system || {};
  itemData.system.bonusAtributo = { atributo, valor };
  itemData.system.efeitos = [{ tipo: "bonusAtributo", atributo, valor }];

  itemData.flags = itemData.flags || {};
  itemData.flags["mighty-blade"] = itemData.flags["mighty-blade"] || {};
  itemData.flags["mighty-blade"].hasAdvancement = true;
  itemData.flags["mighty-blade"].advancementType = "escolhaAtributo";
  itemData.flags["mighty-blade"].chosenAttribute = atributo;
  itemData.flags["mighty-blade"].advancementSummary = `${sinal} ${labelAttr}`;
  itemData.flags["mighty-blade"].advancementChoices = {
    atributo,
    valor,
  };

  return itemData;
}

/**
 * Constrói e valida o conjunto de itens resultantes do Avanço de Origem Dracônica (Opção C):
 * 1. Configura o item-mãe `Linhagem Dracônica` com a Herança Elemental (Resistência + Vulnerabilidade)
 *    e, se aplicável, a penalidade opcional de `-1 Atributo` pelo Sacrifício Dracônico.
 * 2. Constrói os 3 (ou 4) itens `habilidade` reais para as Características Dracônicas escolhidas,
 *    vinculados à raça e à habilidade-mãe.
 *
 * @param {object} escolhas
 * @param {string} escolhas.linhagemId ID da linhagem elemental (ex: "fogo-vuln-frio")
 * @param {string[]} escolhas.caracteristicasIds Array com 3 (ou 4) IDs de características ("asas", "escamas", etc.)
 * @param {string|null} [escolhas.atributoPenalizado=null] Atributo que sofre -1 caso escolha 4 características
 * @param {string|null} [escolhas.sacrificioAtributo=null] Alias para atributoPenalizado
 * @param {object} [context={}]
 * @param {object} [context.parentItemData=null] Objeto base da habilidade Linhagem Dracônica
 * @param {string} [context.raceId=null] ID do item de raça no ator
 * @param {string} [context.sourceRaceId=null] Alias para raceId
 * @param {string} [context.parentAbilityId=null] ID do item Linhagem Dracônica no ator
 * @returns {{ parentItem: object, subFeatureItems: object[], parentItemData: object, subFeatureItemsData: object[], summary: string }}
 */
export function construirItensOrigemDraconica(
  { linhagemId, caracteristicasIds = [], atributoPenalizado = null, sacrificioAtributo = null } = {},
  { parentItemData = null, raceId = null, sourceRaceId = null, parentAbilityId = null } = {}
) {
  const effectiveRaceId = raceId || sourceRaceId || null;
  const effectiveSacrificio = atributoPenalizado || sacrificioAtributo || null;

  const linhagem = LINHAGENS_DRACONICAS.find((l) => l.id === linhagemId);
  if (!linhagem) {
    throw new Error(`Linhagem Dracônica inválida ou não selecionada: "${linhagemId}".`);
  }

  const usaSacrificio = Boolean(effectiveSacrificio);
  if (usaSacrificio && !ATRIBUTOS[effectiveSacrificio]) {
    throw new Error(`Atributo penalizado inválido no Sacrifício Dracônico: "${effectiveSacrificio}".`);
  }

  const qtdEsperada = usaSacrificio ? 4 : 3;
  const caracsUnicas = Array.from(new Set(caracteristicasIds));
  if (caracsUnicas.length !== qtdEsperada) {
    throw new Error(
      `Origem Dracônica exige exatamente ${qtdEsperada} Características Dracônicas distintas (selecionadas: ${caracsUnicas.length}).`
    );
  }

  const slugifyStr = (str) =>
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const caracsObjs = caracsUnicas.map((cid) => {
    const cidNorm = slugifyStr(cid);
    const found = CARACTERISTICAS_DRACONICAS.find(
      (c) =>
        c.id === cid ||
        c.slug === cid ||
        slugifyStr(c.nome) === cidNorm ||
        c.nome.toLowerCase() === String(cid).toLowerCase()
    );
    if (!found) {
      throw new Error(`Característica Dracônica desconhecida: "${cid}".`);
    }
    return found;
  });

  // 1. Prepara o item-mãe (Linhagem Dracônica)
  const canonicalParent =
    parentItemData ||
    CANONICAL_HABILIDADES.find((h) => h.flags?.["mighty-blade"]?.slug === "linhagem-draconica") || {
      name: "Linhagem Dracônica",
      type: "habilidade",
      img: "icons/svg/aura.svg",
      system: {
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
        requisitos: "Raça: Dragano",
        description: "<p>Concede a herança elemental e características físicas de seus ancestrais dracônicos.</p>",
      },
      flags: { "mighty-blade": { slug: "linhagem-draconica", automatica: true } },
    };

  const parentItem = foundry.utils.deepClone(canonicalParent);
  const efeitosParent = foundry.utils.deepClone(linhagem.efeitos);
  if (usaSacrificio) {
    efeitosParent.push({
      tipo: "bonusAtributo",
      atributo: effectiveSacrificio,
      valor: -1,
    });
  }

  const caracsNomes = caracsObjs.map((c) => c.nome).join(", ");
  const sacrificioLabel = usaSacrificio ? ` • -1 ${ATRIBUTOS[effectiveSacrificio]}` : "";
  const summary = `${linhagem.curto}${sacrificioLabel}`;

  parentItem.system = parentItem.system || {};
  parentItem.system.efeitos = efeitosParent;
  parentItem.system.description = `
    <p><strong>Herança Elemental:</strong> ${linhagem.nome} — <em>Resistência a ${linhagem.resistenciaLabel}</em> e <em>Vulnerabilidade a ${linhagem.vulnerabilidadeLabel}</em>.</p>
    ${usaSacrificio ? `<p><strong>Sacrifício Dracônico:</strong> -1 em ${ATRIBUTOS[effectiveSacrificio]} em troca da 4ª Característica Dracônica.</p>` : ""}
    <p><strong>Características Dracônicas (${caracsObjs.length}):</strong> ${caracsNomes}.</p>
  `.trim();

  parentItem.flags = parentItem.flags || {};
  parentItem.flags["mighty-blade"] = parentItem.flags["mighty-blade"] || {};
  if (effectiveRaceId) parentItem.flags["mighty-blade"].sourceRaceId = effectiveRaceId;
  parentItem.flags["mighty-blade"].hasAdvancement = true;
  parentItem.flags["mighty-blade"].advancementType = "origemDraconica";
  parentItem.flags["mighty-blade"].chosenLineage = linhagem.id;
  parentItem.flags["mighty-blade"].chosenTraits = caracsObjs.map((c) => c.id);
  parentItem.flags["mighty-blade"].chosenSacrificeAttribute = effectiveSacrificio;
  parentItem.flags["mighty-blade"].advancementSummary = summary;
  parentItem.flags["mighty-blade"].advancementChoices = {
    linhagemId: linhagem.id,
    resistencia: linhagem.resistencia,
    vulnerabilidade: linhagem.vulnerabilidade,
    atributoPenalizado: effectiveSacrificio,
    caracteristicasIds: caracsObjs.map((c) => c.id),
  };

  // 2. Prepara os sub-itens reais de Características Dracônicas
  const subFeatureItems = caracsObjs.map((cObj) => {
    const canonicalSub = CANONICAL_HABILIDADES.find(
      (h) => h.flags?.["mighty-blade"]?.slug === cObj.slug || h.name.toLowerCase() === cObj.nome.toLowerCase()
    );
    const subItem = canonicalSub
      ? foundry.utils.deepClone(canonicalSub)
      : {
          name: cObj.nome,
          type: "habilidade",
          img: cObj.img,
          system: {
            tipo: cObj.id === "cauda" ? "acao" : "suporte",
            categoria: "caracteristica",
            custo: 0,
            requisitos: "Dragano (Origem Dracônica)",
            efeitos: [],
            description: `<p>${cObj.descricao}</p>`,
          },
          flags: { "mighty-blade": { slug: cObj.slug } },
        };

    subItem.flags = subItem.flags || {};
    subItem.flags["mighty-blade"] = subItem.flags["mighty-blade"] || {};
    subItem.flags["mighty-blade"].slug = cObj.slug;
    subItem.flags["mighty-blade"].subFeatureId = cObj.id;
    subItem.flags["mighty-blade"].parentSlug = "linhagem-draconica";
    subItem.flags["mighty-blade"].parentAbilityName = "Linhagem Dracônica";
    subItem.flags["mighty-blade"].originLabel = "Origem Dracônica";
    subItem.flags["mighty-blade"].isSubFeature = true;
    subItem.flags["mighty-blade"].automatica = true;
    if (effectiveRaceId) subItem.flags["mighty-blade"].sourceRaceId = effectiveRaceId;
    if (parentAbilityId) subItem.flags["mighty-blade"].parentAbilityId = parentAbilityId;

    return subItem;
  });

  return {
    parentItem,
    subFeatureItems,
    parentItemData: parentItem,
    subFeatureItemsData: subFeatureItems,
    summary,
  };
}

/**
 * Diálogo estilo D&D 5e Advancement: escolher 1 atributo que receberá um bônus (+1).
 * Suporta filtrar/bloquear atributos já escolhidos (ex: Diversidade bloqueando o atributo de Adaptabilidade).
 *
 * @param {object} [opts]
 * @param {string} [opts.titulo]
 * @param {string} [opts.subtitulo]
 * @param {number} [opts.valor]
 * @param {Actor} [opts.actor]
 * @param {string[]} [opts.atributosExcluidos]
 * @param {string} [opts.motivoExclusao]
 * @param {string} [opts.atributoInicial]
 * @returns {Promise<string|null>} chave do atributo ("forca"…) ou null se cancelado.
 */
export async function escolherAtributo({
  titulo = "Adaptabilidade",
  subtitulo = "Escolha 1 Atributo para receber o bônus racial.",
  valor = 1,
  actor = null,
  atributosExcluidos = [],
  motivoExclusao = "Adaptabilidade",
  atributoInicial = null,
} = {}) {
  const excluidosSet = new Set((atributosExcluidos || []).map((a) => String(a).toLowerCase()));
  const disponiveis = Object.keys(ATRIBUTOS).filter((k) => !excluidosSet.has(k));
  const defaultKey =
    atributoInicial && disponiveis.includes(atributoInicial) ? atributoInicial : disponiveis[0] || "forca";

  const cardsHtml = Object.entries(ATRIBUTOS)
    .map(([key, label]) => {
      const isBlocked = excluidosSet.has(key);
      const isChecked = !isBlocked && key === defaultKey;
      const curVal = Number(actor?.system?.attributes?.[key]?.value ?? 3);
      const nextVal = curVal + valor;

      return `
        <label class="mb-adv-attr-card ${isBlocked ? "is-blocked" : ""} ${isChecked ? "is-selected" : ""}" data-attr="${key}" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:${isChecked ? "rgba(217,119,6,0.16)" : "#18181b"};border:1px solid ${isChecked ? "#f59e0b" : "rgba(255,255,255,0.12)"};border-radius:8px;cursor:${isBlocked ? "not-allowed" : "pointer"};opacity:${isBlocked ? "0.48" : "1"};transition:all 0.15s ease;">
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="radio" name="atributo" value="${key}" ${isChecked ? "checked" : ""} ${isBlocked ? "disabled" : ""} style="accent-color:#f59e0b;width:16px;height:16px;" />
            <div>
              <strong style="font-size:14px;color:#f8fafc;display:block;">${label}</strong>
              ${
                isBlocked
                  ? `<span style="font-size:11px;color:#f87171;"><i class="fas fa-ban"></i> Já selecionado em ${motivoExclusao}</span>`
                  : `<span style="font-size:11px;color:#94a3b8;">Bônus permanente de <b>+${valor}</b></span>`
              }
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:13px;">
            ${
              actor
                ? `<span style="color:#94a3b8;background:#0f172a;padding:3px 8px;border-radius:4px;border:1px solid #334155;">${curVal} <i class="fas fa-arrow-right" style="font-size:10px;color:#f59e0b;"></i> <b style="color:#fbbf24;">${nextVal}</b></span>`
                : `<span style="color:#fbbf24;background:rgba(245,158,11,0.15);padding:3px 8px;border-radius:4px;border:1px solid rgba(245,158,11,0.4);">+${valor}</span>`
            }
          </div>
        </label>
      `;
    })
    .join("");

  const content = `
    <div class="dnd-advancement-wizard" style="display:flex;flex-direction:column;gap:12px;padding:6px 2px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:8px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);display:flex;align-items:center;justify-content:center;color:#fbbf24;font-size:18px;">
            <i class="fas fa-sparkles"></i>
          </div>
          <div>
            <strong style="display:block;font-size:15px;color:#f8fafc;letter-spacing:0.3px;">${titulo}</strong>
            <span style="font-size:12px;color:#94a3b8;">${subtitulo}</span>
          </div>
        </div>
        <span style="font-size:11px;font-weight:700;color:#fbbf24;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);padding:3px 8px;border-radius:999px;white-space:nowrap;">
          ESCOLHIDO: 1 DE 1
        </span>
      </div>

      <div class="mb-adv-attr-list" style="display:flex;flex-direction:column;gap:8px;">
        ${cardsHtml}
      </div>
    </div>
  `;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `Avanço — ${titulo} • Passo 1 de 1` },
    content: toTrustedDialogContent(content),
    rejectClose: false,
    render: (event, dialog) => {
      const root = dialog?.element ?? event?.target;
      if (!root?.querySelectorAll) return;
      const cards = root.querySelectorAll(".mb-adv-attr-card:not(.is-blocked)");
      cards.forEach((card) => {
        card.addEventListener("click", () => {
          const radio = card.querySelector('input[type="radio"]');
          if (radio && !radio.disabled) {
            radio.checked = true;
            cards.forEach((c) => {
              const r = c.querySelector('input[type="radio"]');
              const sel = r && r.checked;
              c.style.background = sel ? "rgba(217,119,6,0.16)" : "#18181b";
              c.style.borderColor = sel ? "#f59e0b" : "rgba(255,255,255,0.12)";
            });
          }
        });
      });
    },
    buttons: [
      {
        action: "ok",
        label: "✓ Concluir Avanço",
        icon: "",
        default: true,
        callback: (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button?.closest?.("form, dialog");
          return root?.querySelector('[name="atributo"]:checked')?.value ?? null;
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return typeof result === "string" && ATRIBUTOS[result] ? result : null;
}

/**
 * Em navegadores Foundry VTT v14, encapsula o HTML num `<div>` puro sem atributos
 * para que `DialogV2._initializeApplicationOptions` confie no HTML sem sanitizar inputs/estilos.
 * Em ambiente Node (testes unitários), retorna a string HTML diretamente.
 * @param {string} htmlString
 * @returns {HTMLElement|string}
 */
function toTrustedDialogContent(htmlString) {
  if (
    typeof document !== "undefined" &&
    typeof HTMLElement !== "undefined" &&
    typeof document.createElement === "function"
  ) {
    const div = document.createElement("div");
    div.innerHTML = htmlString;
    return div;
  }
  return htmlString;
}

/**
 * Wizard Multi-Passos estilo D&D 5e para a Origem Dracônica do Dragano:
 * - Passo 1 de 2: Herança Elemental (Resistência + Vulnerabilidade)
 * - Passo 2 de 2: Características Dracônicas (3 escolhas padrão, ou 4 com Sacrifício Dracônico de -1 Atributo)
 *
 * @param {object} [opts]
 * @param {string} [opts.titulo]
 * @param {Actor} [opts.actor]
 * @param {object} [opts.estadoInicial] Escolhas prévias ao reconfigurar
 * @returns {Promise<{linhagemId: string, caracteristicasIds: string[], atributoPenalizado: string|null}|null>}
 */
export async function escolherOrigemDraconica({
  titulo = "Dragano",
  actor = null,
  estadoInicial = null,
} = {}) {
  const initLinhagem = estadoInicial?.linhagemId || LINHAGENS_DRACONICAS[0].id;
  const initAtribPenalizado = estadoInicial?.atributoPenalizado || "";
  const initUsaSacrificio = Boolean(initAtribPenalizado);
  const initCaracs = Array.isArray(estadoInicial?.caracteristicasIds) && estadoInicial.caracteristicasIds.length
    ? estadoInicial.caracteristicasIds
    : ["asas", "escamas", "cauda"];

  const linhagensHtml = LINHAGENS_DRACONICAS.map((l) => {
    const isSel = l.id === initLinhagem;
    return `
      <label class="mb-drac-linhagem-card ${isSel ? "is-selected" : ""}" data-linhagem="${l.id}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:${isSel ? "rgba(217,119,6,0.16)" : "#18181b"};border:1px solid ${isSel ? "#f59e0b" : "rgba(255,255,255,0.12)"};border-radius:8px;cursor:pointer;transition:all 0.15s ease;">
        <input type="radio" name="linhagemId" value="${l.id}" ${isSel ? "checked" : ""} style="margin-top:4px;accent-color:#f59e0b;" />
        <div style="flex:1;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <strong style="font-size:13.5px;color:#f8fafc;">
              <i class="fas ${l.icone}" style="color:${l.cor};margin-right:4px;"></i> ${l.curto}
            </strong>
            <div style="display:flex;gap:4px;">
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.35);font-weight:700;">
                Res: ${l.resistenciaLabel}
              </span>
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.35);font-weight:700;">
                Vuln: ${l.vulnerabilidadeLabel}
              </span>
            </div>
          </div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;line-height:1.35;">${l.descricao}</div>
        </div>
      </label>
    `;
  }).join("");

  const attrPenaltyOptions = Object.entries(ATRIBUTOS)
    .map(([k, label]) => {
      const curVal = Number(actor?.system?.attributes?.[k]?.value ?? 3);
      const sel = initAtribPenalizado === k || (!initAtribPenalizado && k === "inteligencia");
      return `<option value="${k}" ${sel ? "selected" : ""}>${label} (${curVal} → ${curVal - 1})</option>`;
    })
    .join("");

  const caracsHtml = CARACTERISTICAS_DRACONICAS.map((c) => {
    const isChecked = initCaracs.includes(c.id);
    return `
      <div class="mb-drac-carac-card" data-carac="${c.id}" style="padding:9px 12px;background:${isChecked ? "rgba(217,119,6,0.15)" : "#18181b"};border:1px solid ${isChecked ? "#f59e0b" : "rgba(255,255,255,0.12)"};border-radius:8px;transition:all 0.15s ease;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;margin:0;">
            <input type="checkbox" name="caracId" value="${c.id}" class="mb-carac-checkbox" ${isChecked ? "checked" : ""} style="accent-color:#f59e0b;width:16px;height:16px;" />
            <img src="${c.img}" width="28" height="28" style="border-radius:5px;border:1px solid rgba(255,255,255,0.15);background:#0f172a;padding:2px;" />
            <div>
              <strong style="font-size:13.5px;color:#f8fafc;display:block;">${c.nome}</strong>
              <span style="font-size:11px;color:#fbbf24;">${c.resumo}</span>
            </div>
          </label>
          <button type="button" class="mb-toggle-carac-desc" title="Inspecionar Detalhes" style="width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <div class="mb-carac-detail-box" style="display:none;margin-top:8px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.12);font-size:11.5px;color:#cbd5e1;line-height:1.4;">
          ${c.descricao}
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <div class="dnd-advancement-wizard mb-draconic-wizard" style="display:flex;flex-direction:column;gap:12px;padding:4px 2px;min-width:460px;">
      <!-- Cabeçalho Dinâmico estilo D&D 5e -->
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:8px;background:rgba(245,158,11,0.16);border:1px solid rgba(245,158,11,0.45);display:flex;align-items:center;justify-content:center;color:#fbbf24;font-size:18px;">
            <i class="fas fa-dragon"></i>
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:6px;">
              <strong style="font-size:15px;color:#f8fafc;">${titulo}</strong>
              <span class="mb-wizard-step-pill" style="font-size:11px;color:#fbbf24;background:rgba(245,158,11,0.15);padding:1px 7px;border-radius:4px;font-weight:700;">Passo 1 de 2</span>
            </div>
            <span class="mb-wizard-step-subtitle" style="font-size:12px;color:#94a3b8;">Linhagem Dracônica: Escolha sua herança elemental</span>
          </div>
        </div>
        <span class="mb-wizard-counter-badge" style="font-size:11px;font-weight:700;color:#22c55e;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.35);padding:3px 9px;border-radius:999px;white-space:nowrap;">
          ESCOLHIDO: 1 DE 1
        </span>
      </div>

      <!-- PASSO 1: HERANÇA ELEMENTAL -->
      <div class="mb-wizard-step" data-step="1" style="display:flex;flex-direction:column;gap:7px;max-height:390px;overflow-y:auto;padding-right:4px;">
        ${linhagensHtml}
      </div>

      <!-- PASSO 2: CARACTERÍSTICAS DRACÔNICAS + SACRIFÍCIO DRACÔNICO -->
      <div class="mb-wizard-step" data-step="2" style="display:none;flex-direction:column;gap:10px;">
        <!-- Card de Sacrifício Dracônico (-1 Atributo por 4ª Característica) -->
        <div style="padding:10px 12px;background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.35);border-radius:8px;display:flex;flex-direction:column;gap:8px;">
          <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;margin:0;">
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="checkbox" name="usarSacrificio" class="mb-sacrificio-toggle" ${initUsaSacrificio ? "checked" : ""} style="accent-color:#38bdf8;width:15px;height:15px;" />
              <span style="font-size:12.5px;font-weight:700;color:#38bdf8;">
                <i class="fas fa-scale-balanced"></i> Sacrifício Dracônico (Regra Opcional Canônica)
              </span>
            </div>
            <span style="font-size:10.5px;color:#94a3b8;">-1 Atributo → +1 Característica</span>
          </label>
          <div class="mb-sacrificio-select-wrap" style="display:${initUsaSacrificio ? "flex" : "none"};align-items:center;justify-content:space-between;gap:10px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:11.5px;color:#cbd5e1;">Atributo reduzido em <b>-1</b>:</span>
            <select name="atributoPenalizado" style="flex:1;max-width:220px;height:30px;background:#18181b;color:#f8fafc;border:1px solid #38bdf8;border-radius:6px;padding:2px 8px;font-size:12px;">
              ${attrPenaltyOptions}
            </select>
          </div>
        </div>

        <div class="mb-carac-validation-msg" style="display:none;padding:6px 10px;border-radius:6px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;font-size:12px;font-weight:600;"></div>

        <div style="display:flex;flex-direction:column;gap:7px;max-height:310px;overflow-y:auto;padding-right:4px;">
          ${caracsHtml}
        </div>
      </div>

      <!-- Barra de Navegação Multi-Passos (Anterior / Reiniciar / Próximo) -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(255,255,255,0.12);">
        <div style="display:flex;gap:6px;">
          <button type="button" class="mb-wiz-prev-btn" style="display:none;padding:5px 12px;border-radius:6px;background:#27272a;border:1px solid #3f3f46;color:#e4e4e7;font-size:12px;font-weight:600;cursor:pointer;">
            « Anterior
          </button>
          <button type="button" class="mb-wiz-reset-btn" style="padding:5px 12px;border-radius:6px;background:#27272a;border:1px solid #3f3f46;color:#cbd5e1;font-size:12px;cursor:pointer;">
            ↻ Reiniciar
          </button>
        </div>
        <button type="button" class="mb-wiz-next-btn" style="padding:6px 16px;border-radius:6px;background:#d97706;border:1px solid #f59e0b;color:#0f172a;font-size:12.5px;font-weight:700;cursor:pointer;">
          Próximo Passo: Características »
        </button>
      </div>
    </div>
  `;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `Advancement — ${titulo} (Origem Dracônica)` },
    content: toTrustedDialogContent(content),
    rejectClose: false,
    render: (event, dialog) => {
      const root = dialog?.element ?? event?.target;
      if (!root?.querySelector) return;
      const wiz = root.querySelector(".mb-draconic-wizard");
      if (!wiz) return;

      const step1 = wiz.querySelector('.mb-wizard-step[data-step="1"]');
      const step2 = wiz.querySelector('.mb-wizard-step[data-step="2"]');
      const stepPill = wiz.querySelector(".mb-wizard-step-pill");
      const stepSub = wiz.querySelector(".mb-wizard-step-subtitle");
      const counterBadge = wiz.querySelector(".mb-wizard-counter-badge");
      const prevBtn = wiz.querySelector(".mb-wiz-prev-btn");
      const nextBtn = wiz.querySelector(".mb-wiz-next-btn");
      const resetBtn = wiz.querySelector(".mb-wiz-reset-btn");
      const sacToggle = wiz.querySelector(".mb-sacrificio-toggle");
      const sacWrap = wiz.querySelector(".mb-sacrificio-select-wrap");
      const valMsg = wiz.querySelector(".mb-carac-validation-msg");

      let currentStep = 1;

      function getMaxCaracs() {
        return sacToggle && sacToggle.checked ? 4 : 3;
      }

      function getCheckedCaracs() {
        return Array.from(wiz.querySelectorAll(".mb-carac-checkbox:checked"));
      }

      function updateCounterAndStyles() {
        wiz.querySelectorAll(".mb-drac-linhagem-card").forEach((card) => {
          const r = card.querySelector('input[type="radio"]');
          const sel = r && r.checked;
          card.style.background = sel ? "rgba(217,119,6,0.16)" : "#18181b";
          card.style.borderColor = sel ? "#f59e0b" : "rgba(255,255,255,0.12)";
        });

        const max = getMaxCaracs();
        const checked = getCheckedCaracs();
        wiz.querySelectorAll(".mb-drac-carac-card").forEach((card) => {
          const cb = card.querySelector(".mb-carac-checkbox");
          const sel = cb && cb.checked;
          card.style.background = sel ? "rgba(217,119,6,0.15)" : "#18181b";
          card.style.borderColor = sel ? "#f59e0b" : "rgba(255,255,255,0.12)";
          if (cb && !sel) {
            cb.disabled = checked.length >= max;
            card.style.opacity = checked.length >= max ? "0.55" : "1";
          } else if (cb) {
            cb.disabled = false;
            card.style.opacity = "1";
          }
        });

        if (currentStep === 1) {
          counterBadge.textContent = "ESCOLHIDO: 1 DE 1";
          counterBadge.style.color = "#22c55e";
        } else {
          counterBadge.textContent = "ESCOLHIDO: " + checked.length + " DE " + max;
          const complete = checked.length === max;
          counterBadge.style.color = complete ? "#22c55e" : "#fbbf24";
          if (complete && valMsg) valMsg.style.display = "none";
        }
      }

      function setStep(step) {
        currentStep = step;
        if (step === 1) {
          step1.style.display = "flex";
          step2.style.display = "none";
          stepPill.textContent = "Passo 1 de 2";
          stepSub.textContent = "Linhagem Dracônica: Escolha sua herança elemental";
          prevBtn.style.display = "none";
          nextBtn.style.display = "inline-block";
        } else {
          step1.style.display = "none";
          step2.style.display = "flex";
          stepPill.textContent = "Passo 2 de 2";
          stepSub.textContent = "Características Dracônicas: Escolha suas adaptações anatômicas";
          prevBtn.style.display = "inline-block";
          nextBtn.style.display = "none";
        }
        updateCounterAndStyles();
      }

      wiz.querySelectorAll(".mb-drac-linhagem-card").forEach((card) => {
        card.addEventListener("click", () => {
          const r = card.querySelector('input[type="radio"]');
          if (r) r.checked = true;
          updateCounterAndStyles();
        });
      });

      wiz.querySelectorAll(".mb-carac-checkbox").forEach((cb) => {
        cb.addEventListener("change", () => updateCounterAndStyles());
      });

      wiz.querySelectorAll(".mb-toggle-carac-desc").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const detail = btn.closest(".mb-drac-carac-card")?.querySelector(".mb-carac-detail-box");
          if (detail) {
            detail.style.display = detail.style.display === "none" ? "block" : "none";
          }
        });
      });

      if (sacToggle) {
        sacToggle.addEventListener("change", () => {
          sacWrap.style.display = sacToggle.checked ? "flex" : "none";
          const max = getMaxCaracs();
          const checked = getCheckedCaracs();
          if (checked.length > max) {
            checked.slice(max).forEach((cb) => {
              cb.checked = false;
            });
          } else if (checked.length < max) {
            for (const cb of wiz.querySelectorAll(".mb-carac-checkbox")) {
              if (getCheckedCaracs().length >= max) break;
              if (!cb.checked) cb.checked = true;
            }
          }
          updateCounterAndStyles();
        });
      }

      nextBtn?.addEventListener("click", () => setStep(2));
      prevBtn?.addEventListener("click", () => setStep(1));
      resetBtn?.addEventListener("click", () => {
        const firstRadio = wiz.querySelector('input[name="linhagemId"]');
        if (firstRadio) firstRadio.checked = true;
        if (sacToggle) {
          sacToggle.checked = false;
          sacWrap.style.display = "none";
        }
        const allCbs = Array.from(wiz.querySelectorAll(".mb-carac-checkbox"));
        allCbs.forEach((cb, idx) => {
          cb.checked = idx < 3;
        });
        setStep(1);
      });

      updateCounterAndStyles();
    },
    buttons: [
      {
        action: "ok",
        label: "✓ Concluir Avanço",
        icon: "",
        default: true,
        callback: (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button?.closest?.("form, dialog");
          const linhagemId = root?.querySelector('[name="linhagemId"]:checked')?.value || LINHAGENS_DRACONICAS[0].id;
          const usaSacrificio = Boolean(root?.querySelector('[name="usarSacrificio"]')?.checked);
          const atributoPenalizado = usaSacrificio
            ? root?.querySelector('[name="atributoPenalizado"]')?.value || "inteligencia"
            : null;
          const max = usaSacrificio ? 4 : 3;
          let caracteristicasIds = Array.from(root?.querySelectorAll('[name="caracId"]:checked') ?? []).map(
            (el) => el.value
          );

          // Garante a quantidade exata caso o usuário clique em Concluir direto do Passo 1
          if (caracteristicasIds.length < max) {
            for (const c of CARACTERISTICAS_DRACONICAS) {
              if (caracteristicasIds.length >= max) break;
              if (!caracteristicasIds.includes(c.id)) caracteristicasIds.push(c.id);
            }
          } else if (caracteristicasIds.length > max) {
            caracteristicasIds = caracteristicasIds.slice(0, max);
          }

          return {
            linhagemId,
            caracteristicasIds,
            atributoPenalizado,
          };
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return result && typeof result === "object" && result.linhagemId ? result : null;
}

/**
 * Diálogo: escolher K de N habilidades (Advancement Wizard).
 * @param {object} opts
 * @param {string} [opts.titulo]
 * @param {Array<{uuid:string,name:string,img:string}>} opts.opcoes
 * @param {number} [opts.quantidade]
 * @returns {Promise<string[]|null>} UUIDs escolhidos, ou null se cancelado.
 */
export async function escolherHabilidades({ titulo = "Concessão", opcoes = [], quantidade = 1, actor = null } = {}) {
  if (!opcoes.length) return null;

  let actorHasExclusive = false;
  if (actor) {
    actorHasExclusive = actor.items.some((i) => {
      const n = i.name.toLowerCase();
      return n.includes("dogma") || n.includes("pacto") || n.includes("conhecimento místico");
    });
  }

  const inputType = quantidade > 1 ? "checkbox" : "radio";
  const rows = opcoes
    .map((o) => {
      let disabledHtml = "";
      let exclusiveClass = "";
      if (o.isExclusive) {
        exclusiveClass = "exclusive-opt";
        if (actorHasExclusive) {
          disabledHtml = ` disabled title="Bloqueado por exclusividade mútua: Pacto, Dogma e Conhecimento Místico não podem coexistir." `;
        }
      }

      let subHtml = "";
      if (o.subChoices && o.subChoices.length > 0) {
        const subOpts = o.subChoices.map((sub) => `<option value="${sub.uuid}">${sub.name}</option>`).join("");
        subHtml = `
          <div class="sub-choice-container" data-parent="${o.uuid}" style="display:none; padding-left: 40px; padding-bottom: 6px;">
            <select class="sub-choice-select" style="width:100%;height:32px;background:#18181b;color:#fff;border:1px solid #3f3f46;border-radius:4px;" disabled>
              ${subOpts}
            </select>
          </div>
        `;
      }

      return `
        <label style="display:flex;gap:10px;align-items:center;padding:8px 12px;background:#18181b;border:1px solid rgba(255,255,255,0.12);border-radius:6px;margin-bottom:6px;cursor:pointer;transition:border-color 0.2s; opacity: ${disabledHtml ? "0.5" : "1"};" ${disabledHtml}>
          <input type="${inputType}" name="opt" value="${o.uuid}" class="main-opt ${exclusiveClass}" ${disabledHtml} style="accent-color:#22c55e;">
          <img src="${o.img}" width="30" height="30" style="border:none;border-radius:4px;flex:0 0 auto;object-fit:cover;">
          <span style="font-weight:600;font-size:13px;color:#f3f4f6;${disabledHtml ? "text-decoration:line-through; color:#999;" : ""}">${o.name}</span>
        </label>
        ${subHtml}
      `;
    })
    .join("");

  const content = `
    <div class="dnd-advancement-content" style="display:flex;flex-direction:column;gap:10px;padding:6px 2px;">
      <div style="display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">
        <i class="fas fa-award" style="font-size:20px;color:#fbbf24;"></i>
        <div>
          <strong style="display:block;font-size:15px;color:#f3f4f6;">Avanço de Habilidade</strong>
          <span style="font-size:12px;color:#9ca3af;">${titulo}: Escolha <b>${quantidade}</b> das opções disponíveis abaixo.</span>
        </div>
      </div>
      <div style="max-height:360px;overflow-y:auto;padding-right:4px;">
        ${rows}
      </div>
    </div>
  `;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${titulo} — Escolha (${quantidade})` },
    content: toTrustedDialogContent(content),
    rejectClose: false,
    render: (event, dialog) => {
      const dlg = dialog?.element ?? event?.target;
      if (!dlg?.querySelectorAll) return;
      const mainOpts = dlg.querySelectorAll(".main-opt");
      const exclusiveOpts = dlg.querySelectorAll(".exclusive-opt");

      mainOpts.forEach((opt) => {
        opt.addEventListener("change", () => {
          const subContainer = dlg.querySelector(`.sub-choice-container[data-parent="${opt.value}"]`);
          if (subContainer) {
            const select = subContainer.querySelector("select");
            if (opt.checked) {
              subContainer.style.display = "block";
              select.disabled = false;
            } else {
              subContainer.style.display = "none";
              select.disabled = true;
            }
          }

          if (opt.classList.contains("exclusive-opt")) {
            const anyExclusiveChecked = Array.from(exclusiveOpts).some((o) => o.checked);
            exclusiveOpts.forEach((o) => {
              if (!o.checked) {
                if (anyExclusiveChecked) {
                  o.disabled = true;
                  o.closest("label").style.opacity = "0.5";
                  o.closest("label").title = "Bloqueado por exclusividade mútua.";
                } else if (!actorHasExclusive) {
                  o.disabled = false;
                  o.closest("label").style.opacity = "1";
                  o.closest("label").title = "";
                }
              }
            });
          }
        });
      });
    },
    buttons: [
      {
        action: "ok",
        label: "Confirmar",
        icon: "fas fa-check",
        default: true,
        callback: (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button?.closest?.("form, dialog");
          const checked = Array.from(root?.querySelectorAll('[name="opt"]:checked') ?? []);
          const results = [];
          checked.forEach((el) => {
            results.push(el.value);
            const subContainer = root.querySelector(`.sub-choice-container[data-parent="${el.value}"]`);
            if (subContainer) {
              const select = subContainer.querySelector("select");
              if (!select.disabled && select.value) {
                results.push(select.value);
              }
            }
          });
          return results;
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return Array.isArray(result) && result.length ? result : null;
}

/**
 * Resolve uma referência em um Item. Aceita UUID do Foundry OU um slug estável
 * (`flags["mighty-blade"].slug`), buscando nos compêndios de Item do sistema,
 * nos itens do mundo e, como fallback seguro, no catálogo canônico em memória.
 * @param {string} ref  UUID ou slug.
 * @returns {Promise<Item|object|null>}
 */
export async function resolveRef(ref) {
  if (!ref) return null;

  // Tenta como UUID direto (ex.: "Item.xxxx", "Compendium.mighty-blade.racas.Item.xxxx").
  if (typeof fromUuid === "function" && ref.includes(".")) {
    const doc = await fromUuid(ref).catch(() => null);
    if (doc) return doc;
  }

  // Busca por slug nos compêndios de Item.
  if (typeof game !== "undefined" && game?.packs) {
    for (const pack of game.packs) {
      if (pack.documentName !== "Item") continue;
      const index = await pack.getIndex({ fields: ["flags.mighty-blade.slug"] });
      const entry = index.find((e) => foundry.utils.getProperty(e, "flags.mighty-blade.slug") === ref);
      if (entry) return pack.getDocument(entry._id);
    }
  }

  // Fallback: itens do mundo.
  if (typeof game !== "undefined" && Array.isArray(game?.items?.contents || game?.items)) {
    const worldItem = game.items.find?.((i) => i.getFlag?.("mighty-blade", "slug") === ref);
    if (worldItem) return worldItem;
  }

  // Fallback canônico em memória (funciona mesmo sem compêndios sincronizados ou em testes headless)
  const canonical = CANONICAL_HABILIDADES.find(
    (h) => h.flags?.["mighty-blade"]?.slug === ref || h.name.toLowerCase() === String(ref).toLowerCase()
  );
  if (canonical) {
    return {
      ...foundry.utils.deepClone(canonical),
      toObject() {
        return foundry.utils.deepClone(canonical);
      },
    };
  }

  return null;
}

/**
 * Resolve uma lista de refs (UUID ou slug) em objetos simples para o diálogo.
 * @param {string[]} refs
 * @returns {Promise<Array<{uuid:string,name:string,img:string}>>}
 */
export async function resolveOpcoes(refs = []) {
  const out = [];
  for (const ref of refs) {
    const doc = await resolveRef(ref);
    if (doc) {
      const optionData = { uuid: doc.uuid || ref, name: doc.name, img: doc.img, isExclusive: false, subChoices: null };
      const nameLower = doc.name.toLowerCase();
      if (nameLower.includes("dogma") || nameLower.includes("pacto") || nameLower.includes("conhecimento místico")) {
        optionData.isExclusive = true;
      }

      const concessoes = doc.system?.concessoes || [];
      const subChoiceConcessao = concessoes.find((c) => c.tipo === "escolhaHabilidade");
      if (subChoiceConcessao) {
        const subOpts = [];
        for (const subRef of subChoiceConcessao.opcoes || []) {
          const subDoc = await resolveRef(subRef);
          if (subDoc) subOpts.push({ uuid: subDoc.uuid || subRef, name: subDoc.name });
        }
        optionData.subChoices = subOpts;
      }

      out.push(optionData);
    }
  }
  return out;
}
