/**
 * Utilitários e Mapeamentos Canônicos de Ilustrações da Forja e Ícones Temáticos do Mighty Blade 3e.
 */

export function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const RACAS_FORJA_MAP = {
  anao: "anao.png",
  elfo: "elfo.png",
  humano: "humano.png",
  levent: "levent.png",
  dragano: "dragano.png",
  faen: "faen.png",
  fauno: "fauno.png",
  fira: "fira.png",
  gnoll: "gnoll.png",
  hamelin: "hamelin.png",
  juban: "juban.png",
  mahok: "mahok.png",
  metadilio: "metadilio.png",
  naga: "naga.png",
  "naga-m": "naga.png",
  "naga-f": "naga.png",
  "naga-macho": "naga.png",
  "naga-femea": "naga.png",
  orc: "orc.png",
  tailox: "tailox.png",
  centauro: "centauro.png",
  aesir: "aesir.png",
  asterio: "asterio.png",
  asteria: "asterio.png",
  "asterio-m": "asterio.png",
  "asteria-f": "asterio.png",
};

export const CLASSES_FORJA_MAP = {
  bardo: "bardo2.png",
  dracomante: "dracomante.png",
  druida: "druida2.png",
  espadachim: "espadachim2.png",
  feiticeiro: "feiticeiro2.png",
  guerreiro: "guerreiro1.png",
  ladino: "ladino2.png",
  necromante: "necromante.png",
  paladino: "paladino2.png",
  patrulheiro: "patrulheiro2.png",
  runico: "runico2.png",
  sacerdote: "sacerdote2.png",
  senescal: "senescal.png",
  xama: "xama1.png",
  ilusionista: "ilusionista.png",
  artifice: "artifice.png",
};

export const CAMINHOS_FORJA_SLUGS = new Set([
  "amoque", "arconte", "assassino", "avantesma", "aziago", "alquimista",
  "argenteo", "arqueiro", "artifice", "cultista", "cruzado", "domador",
  "escriba", "estrige", "ilusionista", "invocador", "lanceiro", "oraculo",
  "sanguineo", "tohunga", "senescal",
]);

export const ORGANIZACOES_FORJA_MAP = {
  "irmandade-do-anel-de-bronze": "org_anel.png",
  "anel-de-bronze": "org_anel.png",
  "anel": "org_anel.png",
  "espada-de-mirah": "org_espada.png",
  "mirah": "org_espada.png",
  "forjas-de-hou": "org_forja.png",
  "forja": "org_forja.png",
  "hou": "org_forja.png",
  "iris-de-maltas": "org_iris.png",
  "maltas": "org_iris.png",
  "o-arpao": "org_arpao.png",
  "arpao": "org_arpao.png",
  "capuzes-negros": "org_capuz.png",
  "capuz": "org_capuz.png",
  "cesto-de-adagas": "org_cesto.png",
  "cesto": "org_cesto.png",
  "corvos-negros": "org_corvo.png",
  "corvo": "org_corvo.png",
  "cranios-vermelhos": "org_cranio.png",
  "cranio": "org_cranio.png",
  "lobos-dos-mares": "org_lobo.png",
  "lobo": "org_lobo.png",
  "hoste-de-hadorn": "org_hoste.png",
  "hoste": "org_hoste.png",
  "hadorn": "org_hoste.png",
  "guarda-das-fronteiras-rochosas": "org_guarda.png",
  "guarda": "org_guarda.png",
  "fronteiras-rochosas": "org_guarda.png",
};

/**
 * Mapa direto de caminhos legados .webp quebrados para os novos SVGs temáticos próprios do sistema.
 */
export const BROKEN_WEBP_REPLACEMENT_MAP = {
  "icons/consumables/potions/potion-flask-corked-red.webp": "systems/mighty-blade/assets/icons/potion.svg",
  "icons/weapons/bows/bow-short-wood.webp": "systems/mighty-blade/assets/icons/bow.svg",
  "icons/weapons/ammunition/arrow-head-steel.webp": "systems/mighty-blade/assets/icons/arrow.svg",
  "icons/weapons/staves/staff-simple.webp": "systems/mighty-blade/assets/icons/staff.svg",
  "icons/equipment/chest/breastplate-leather-brown.webp": "systems/mighty-blade/assets/icons/armor.svg",
  "icons/equipment/shield/heater-wooden-brown.webp": "systems/mighty-blade/assets/icons/shield.svg",
  "icons/magic/symbols/rune-sigil-horned-blue.webp": "systems/mighty-blade/assets/icons/spell.svg",
};

/**
 * Resolve o ícone SVG temático mais adequado para equipamentos, armas, armaduras e magias.
 * @param {object} item
 * @returns {string}
 */
export function resolveThematicEquipmentIcon(item) {
  if (!item) return "systems/mighty-blade/assets/icons/gear.svg";
  const slug = item.flags?.["mighty-blade"]?.slug || slugify(item.name);
  const cat = String(item.flags?.["mighty-blade"]?.categoria || item.system?.categoria || "").toLowerCase();
  const sub = String(item.system?.subtipo || "").toLowerCase();
  const type = item.type;

  if (type === "magia") {
    return "systems/mighty-blade/assets/icons/spell.svg";
  }

  // Poções, Antídotos, Elixires, Óleos, Venenos, Extratos
  if (
    /^(pocao|antidoto|elixir|oleo|veneno|extrato|unguento|tonico|frasco|acido|fogo-alquimico|cola-carne)/.test(slug) ||
    slug.includes("pocao") ||
    slug.includes("antidoto") ||
    slug.includes("elixir") ||
    slug.includes("veneno") ||
    cat.includes("alquim") ||
    cat.includes("pocao") ||
    cat.includes("consumivel")
  ) {
    return "systems/mighty-blade/assets/icons/potion.svg";
  }

  // Anéis, Amuletos, Colares, Talismãs
  if (
    /^(anel|amuleto|colar|talisma|brinco|medalhao|broche|tiara|coroa)/.test(slug)
  ) {
    return "systems/mighty-blade/assets/icons/ring.svg";
  }

  // Munições e Aljavas
  if (
    /^(flecha|virote|bala|dardo|municao|aljava)/.test(slug) ||
    cat.includes("municao")
  ) {
    return "systems/mighty-blade/assets/icons/arrow.svg";
  }

  // Cajados, Varinhas, Cetros, Orbes, Grimórios, Canalizadores
  if (
    /^(cajado|varinha|cetro|orbe|canalizador|grimorio|simbolo-sagrado)/.test(slug) ||
    cat.includes("canalizador")
  ) {
    return "systems/mighty-blade/assets/icons/staff.svg";
  }

  // Arcos, Bestas, Fundas, Zarabatanas
  if (
    /^(arco|besta|funda|zarabatana)/.test(slug) ||
    cat.includes("projetil") ||
    (type === "arma" && String(item.system?.alcance || "").toLowerCase().includes("disparo"))
  ) {
    return "systems/mighty-blade/assets/icons/bow.svg";
  }

  // Armas Corporais
  if (type === "arma") {
    return "systems/mighty-blade/assets/icons/sword.svg";
  }

  // Escudos vs Armaduras
  if (type === "armadura") {
    if (sub === "escudo" || slug.includes("escudo") || slug.includes("broquel") || slug.includes("pavis")) {
      return "systems/mighty-blade/assets/icons/shield.svg";
    }
    return "systems/mighty-blade/assets/icons/armor.svg";
  }

  return "systems/mighty-blade/assets/icons/gear.svg";
}

/**
 * Resolve a melhor imagem da Forja ou ícone SVG temático para um item ou documento.
 * Substitui automaticamente caminhos legados .webp inexistentes e placeholders genéricos.
 */
export function resolveItemImage(item) {
  if (!item) return "systems/mighty-blade/assets/icons/gear.svg";

  const rawImg = String(item.img || "").trim();

  // 1. Intercepta imediatamente qualquer caminho .webp quebrado mapeado
  if (BROKEN_WEBP_REPLACEMENT_MAP[rawImg]) {
    return resolveThematicEquipmentIcon(item) || BROKEN_WEBP_REPLACEMENT_MAP[rawImg];
  }

  const slug = item.flags?.["mighty-blade"]?.slug || slugify(item.name);
  const type = item.type;

  // 2. Ilustrações Oficiais da Forja (Raças, Classes, Caminhos, Organizações)
  if (type === "raca" || RACAS_FORJA_MAP[slug]) {
    const file = RACAS_FORJA_MAP[slug] || (slug + ".png");
    return "systems/mighty-blade/assets/forja/" + file;
  }
  if (type === "classe" || CLASSES_FORJA_MAP[slug]) {
    const file = CLASSES_FORJA_MAP[slug] || (slug + ".png");
    return "systems/mighty-blade/assets/forja/" + file;
  }
  if (type === "caminho" || CAMINHOS_FORJA_SLUGS.has(slug)) {
    const file = CAMINHOS_FORJA_SLUGS.has(slug) ? (slug + ".png") : (CLASSES_FORJA_MAP[slug] || "caminho.png");
    return "systems/mighty-blade/assets/forja/" + file;
  }
  if (type === "organizacao" || ORGANIZACOES_FORJA_MAP[slug]) {
    const file = ORGANIZACOES_FORJA_MAP[slug] || ("org_" + slug + ".png");
    return "systems/mighty-blade/assets/forja/" + file;
  }

  // 3. Equipamentos, Armas, Armaduras e Magias que estejam usando placeholders genéricos ou .webp quebrados
  const isGenericPlaceholder =
    !rawImg ||
    rawImg.includes("mystery-man") ||
    rawImg.includes("item-bag") ||
    rawImg === "icons/svg/sword.svg" ||
    rawImg.endsWith(".webp");

  if (isGenericPlaceholder && ["equipamento", "arma", "armadura", "magia"].includes(type)) {
    return resolveThematicEquipmentIcon(item);
  }

  return rawImg || "icons/svg/item-bag.svg";
}
