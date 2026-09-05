/**
 * Utilitários e Mapeamentos Canônicos de Ilustrações da Forja do Mighty Blade 3e.
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
  raca: "humano.png",
  "nova-raca": "humano.png",
};

export const CLASSES_FORJA_MAP = {
  classe: "guerreiro1.png",
  "nova-classe": "guerreiro1.png",
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
 * Resolve a melhor imagem da Forja para um item ou documento.
 * Se já possuir imagem válida (diferente dos placeholders padrão do Foundry), preserva-a.
 */
export function resolveItemImage(item) {
  if (!item) return "icons/svg/item-bag.svg";

  if (item.img && !item.img.includes("mystery-man") && !item.img.includes("item-bag")) {
    return item.img;
  }

  const slug = item.flags?.["mighty-blade"]?.slug || slugify(item.name);
  const type = item.type;

  if (type === "raca" || RACAS_FORJA_MAP[slug]) {
    const file = RACAS_FORJA_MAP[slug] || "humano.png";
    return "systems/mighty-blade/assets/forja/" + file;
  }
  if (type === "classe" || CLASSES_FORJA_MAP[slug]) {
    const file = CLASSES_FORJA_MAP[slug] || "guerreiro1.png";
    return "systems/mighty-blade/assets/forja/" + file;
  }
  if (type === "caminho" || CAMINHOS_FORJA_SLUGS.has(slug)) {
    const file = CAMINHOS_FORJA_SLUGS.has(slug) ? (slug + ".png") : (CLASSES_FORJA_MAP[slug] || "espadachim2.png");
    return "systems/mighty-blade/assets/forja/" + file;
  }
  if (type === "organizacao" || ORGANIZACOES_FORJA_MAP[slug]) {
    const file = ORGANIZACOES_FORJA_MAP[slug] || "org_espada.png";
    return "systems/mighty-blade/assets/forja/" + file;
  }

  return item.img || "icons/svg/item-bag.svg";
}
