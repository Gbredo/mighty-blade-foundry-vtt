const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FOUNDRY_DIR = "d:\\Projetos\\mighty-blade-foundry-vtt";
const WEBSITE_DIR = "d:\\Projetos\\MightyBlade3eWebsite";

// Load compiled rules-core data
const { RACAS } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/racas.js"));
const { CLASSES } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/classes.js"));
const { HABILIDADES } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/habilidades.js"));
const { EQUIPAMENTOS } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/equipamentos.js"));
const { CAMINHOS } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/caminhos.js"));
const { ORGANIZACOES } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/organizacoes.js"));

function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deterministicId(prefix, slug) {
  return crypto.createHash("md5").update(prefix + ":" + slug).digest("hex").substring(0, 16);
}

function mdToHtml(md) {
  if (!md) return "";
  let html = String(md)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^\s*\*\s+(.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return "<p>" + html + "</p>";
}

const RACAS_FORJA_MAP = {
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
};

const CLASSES_FORJA_MAP = {
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

const CAMINHOS_FORJA_SLUGS = new Set([
  "amoque", "arconte", "assassino", "avantesma", "aziago", "alquimista",
  "argenteo", "arqueiro", "artifice", "cultista", "cruzado", "domador",
  "escriba", "estrige", "ilusionista", "invocador", "lanceiro", "oraculo",
  "sanguineo", "tohunga", "senescal",
]);

const ORGANIZACOES_FORJA_MAP = {
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

function buildRaceItem(raca) {
  const autoHabId = raca.habilidadeAutomatica;
  const autoHab = HABILIDADES[autoHabId];
  const slug = slugify(raca.id);
  const autoSlug = autoHab ? slugify(autoHab.nome) : slugify(autoHabId);
  const diarioId = deterministicId("diario-raca", slug);

  const imgFile = RACAS_FORJA_MAP[slug] || "raca.png";
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  let shortIntro = "";
  if (raca.descricao) {
    shortIntro = raca.descricao.split("\n\n")[0] || raca.descricao;
  }

  let descHtml = '<div class="mb-item-summary">';
  if (shortIntro) {
    descHtml += '<p class="mb-lead-lore">' + shortIntro + '</p>';
  } else {
    descHtml += '<p>Raça ' + raca.nome + ' de Mighty Blade 3e.</p>';
  }

  descHtml += '<div class="mb-journal-link-card" style="margin: 10px 0; padding: 10px; background: rgba(217, 119, 6, 0.12); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">';
  descHtml += '<span style="font-weight: bold; color: #f59e0b; font-size: 0.95rem;"><i class="fas fa-book-open"></i> Biologia, Cultura e Nomes</span>';
  descHtml += '<a class="content-link open-lore-journal-btn" draggable="true" data-uuid="Compendium.mighty-blade.diarios.' + diarioId + '" data-slug="' + slug + '" data-type="JournalEntry" style="background:#d97706;color:#1e1e2d;padding:4px 10px;border-radius:4px;font-weight:bold;text-decoration:none;cursor:pointer;"><i class="fas fa-book"></i> Abrir Diário</a>';
  descHtml += '</div>';

  if (raca.faixasEtarias) {
    const f = raca.faixasEtarias;
    descHtml += '<div class="faixas-etarias" style="margin-top:6px; font-size:0.85rem; color:#94a3b8;"><strong>Faixas Etárias:</strong> Filhote (' + f.filhote + 'a) · Adulto (' + f.adulto + 'a) · Idoso (' + f.idoso + 'a) · Ancião (' + f.anciao + 'a)</div>';
  }

  if (raca.classesComuns) {
    const cc = Array.isArray(raca.classesComuns) ? raca.classesComuns.join(", ") : raca.classesComuns;
    descHtml += '<div class="classes-comuns" style="margin-top:4px; font-size:0.85rem; color:#94a3b8;"><strong>Classes Comuns:</strong> ' + cc + '</div>';
  }
  descHtml += '</div>';

  const concessoes = [];
  if (raca.id === "humano") {
    concessoes.push({ tipo: "escolhaAtributo", ref: autoSlug, valor: 1 });
  } else {
    concessoes.push({ tipo: "habilidade", ref: autoSlug });
  }

  return {
    name: raca.nome,
    type: "raca",
    img: imgPath,
    system: {
      atributos: {
        forca: Number(raca.atributos?.forca) || 0,
        agilidade: Number(raca.atributos?.agilidade) || 0,
        inteligencia: Number(raca.atributos?.inteligencia) || 0,
        vontade: Number(raca.atributos?.vontade) || 0,
      },
      habilidadeUuid: "",
      habilidadeAutomatica: {
        nome: autoHab?.nome || raca.habilidadeAutomatica || "",
        descricao: autoHab?.descricao || "",
        tipo: (autoHab?.tipo || "suporte").toLowerCase(),
        categoria: (autoHab?.categoria || "caracteristica").toLowerCase(),
        custo: Number(autoHab?.custoMana ?? autoHab?.custo) || 0,
      },
      concessoes,
      classesComuns: Array.isArray(raca.classesComuns) ? raca.classesComuns.join(", ") : (raca.classesComuns || ""),
      description: descHtml,
    },
    flags: {
      "mighty-blade": {
        slug,
        diarioId,
        lore: {
          biologia: raca.biologia || "",
          cultura: raca.cultura || "",
          faixasEtarias: raca.faixasEtarias || null,
          nomes: raca.nomes || null,
        },
      },
    },
  };
}

function buildClassItem(classe) {
  const slug = slugify(classe.id);
  const diarioId = deterministicId("diario-classe", slug);
  const imgFile = CLASSES_FORJA_MAP[slug] || "guerreiro1.png";
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  let shortIntro = "";
  if (classe.descricao) {
    shortIntro = classe.descricao.split("\n\n")[0] || classe.descricao;
  }

  let descHtml = '<div class="mb-item-summary">';
  if (shortIntro) {
    descHtml += '<p class="mb-lead-lore">' + shortIntro + '</p>';
  } else {
    descHtml += '<p>Classe ' + classe.nome + ' de Mighty Blade 3e.</p>';
  }

  descHtml += '<div class="mb-journal-link-card" style="margin: 10px 0; padding: 10px; background: rgba(217, 119, 6, 0.12); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">';
  descHtml += '<span style="font-weight: bold; color: #f59e0b; font-size: 0.95rem;"><i class="fas fa-book-open"></i> História e Tradição da Classe</span>';
  descHtml += '<a class="content-link open-lore-journal-btn" draggable="true" data-uuid="Compendium.mighty-blade.diarios.' + diarioId + '" data-slug="' + slug + '" data-type="JournalEntry" style="background:#d97706;color:#1e1e2d;padding:4px 10px;border-radius:4px;font-weight:bold;text-decoration:none;cursor:pointer;"><i class="fas fa-book"></i> Abrir Diário</a>';
  descHtml += '</div>';

  if (classe.racasComuns) {
    descHtml += '<div style="margin-top:6px; font-size:0.85rem; color:#94a3b8;"><strong>Raças Comuns:</strong> ' + classe.racasComuns + '</div>';
  }

  if (classe.listaHabilidades?.length) {
    descHtml += '<div style="margin-top:6px; font-size:0.85rem; color:#94a3b8;"><strong>Arsenal (' + classe.listaHabilidades.length + ' Habilidades):</strong> ' + classe.listaHabilidades.slice(0, 8).join(", ") + '...</div>';
  }
  descHtml += '</div>';

  const concessoes = (classe.habilidadesAutomaticas || []).map((habId) => {
    const habDoc = HABILIDADES[habId];
    return {
      tipo: "habilidade",
      ref: habDoc ? slugify(habDoc.nome) : slugify(habId),
    };
  });

  return {
    name: classe.nome,
    type: "classe",
    img: imgPath,
    system: {
      atributos: {
        forca: Number(classe.bonusAtributos?.forca) || 0,
        agilidade: Number(classe.bonusAtributos?.agilidade) || 0,
        inteligencia: Number(classe.bonusAtributos?.inteligencia) || 0,
        vontade: Number(classe.bonusAtributos?.vontade) || 0,
      },
      habilidadeUuid: "",
      concessoes,
      vida: 60,
      mana: 60,
      equipamentoInicial: "",
      description: descHtml,
    },
    flags: {
      "mighty-blade": {
        slug,
        diarioId,
        conjurador: !!classe.conjurador,
      },
    },
  };
}

function buildCaminhoItem(caminho) {
  const slug = slugify(caminho.id);
  const diarioId = deterministicId("diario-caminho", slug);
  const imgFile = CAMINHOS_FORJA_SLUGS.has(slug) ? slug + ".png" : (CLASSES_FORJA_MAP[slug] || "caminho.png");
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  let shortIntro = "";
  if (caminho.descricao) {
    shortIntro = caminho.descricao.split("\n\n")[0] || caminho.descricao;
  }

  let descHtml = '<div class="mb-item-summary">';
  if (shortIntro) {
    descHtml += '<p class="mb-lead-lore">' + shortIntro + '</p>';
  } else {
    descHtml += '<p>Caminho ' + caminho.nome + ' de Mighty Blade 3e.</p>';
  }

  descHtml += '<div class="mb-journal-link-card" style="margin: 10px 0; padding: 10px; background: rgba(217, 119, 6, 0.12); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">';
  descHtml += '<span style="font-weight: bold; color: #f59e0b; font-size: 0.95rem;"><i class="fas fa-book-open"></i> Tradição e Segredos do Caminho</span>';
  descHtml += '<a class="content-link open-lore-journal-btn" draggable="true" data-uuid="Compendium.mighty-blade.diarios.' + diarioId + '" data-slug="' + slug + '" data-type="JournalEntry" style="background:#d97706;color:#1e1e2d;padding:4px 10px;border-radius:4px;font-weight:bold;text-decoration:none;cursor:pointer;"><i class="fas fa-book"></i> Abrir Diário</a>';
  descHtml += '</div>';

  if (caminho.requisitosTexto) {
    descHtml += '<div style="margin-top:6px; font-size:0.85rem; color:#f59e0b;"><strong>Pré-Requisitos:</strong> ' + caminho.requisitosTexto + '</div>';
  }

  if (caminho.racasComuns) {
    descHtml += '<div style="margin-top:4px; font-size:0.85rem; color:#94a3b8;"><strong>Raças Comuns:</strong> ' + caminho.racasComuns + '</div>';
  }
  descHtml += '</div>';

  return {
    name: caminho.nome,
    type: "caminho",
    img: imgPath,
    system: {
      requisitos: caminho.requisitosTexto || "",
      habilidadeAutomatica: caminho.habilidadeAutomatica || "",
      racasComuns: caminho.racasComuns || "",
      description: descHtml,
    },
    flags: {
      "mighty-blade": {
        slug,
        diarioId,
      },
    },
  };
}

function buildOrganizacaoItem(org) {
  const slug = slugify(org.id);
  const diarioId = deterministicId("diario-org", slug);
  const imgFile = ORGANIZACOES_FORJA_MAP[slug] || "org_" + slug + ".png";
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  let shortIntro = "";
  if (org.descricao) {
    shortIntro = org.descricao.split("\n\n")[0] || org.descricao;
  }

  let descHtml = '<div class="mb-item-summary">';
  if (shortIntro) {
    descHtml += '<p class="mb-lead-lore">' + shortIntro + '</p>';
  } else {
    descHtml += '<p>Organização ' + org.nome + ' de Mighty Blade 3e.</p>';
  }

  descHtml += '<div class="mb-journal-link-card" style="margin: 10px 0; padding: 10px; background: rgba(217, 119, 6, 0.12); border: 1px solid rgba(217, 119, 6, 0.4); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">';
  descHtml += '<span style="font-weight: bold; color: #f59e0b; font-size: 0.95rem;"><i class="fas fa-book-open"></i> Crônicas e Estatuto Oficial</span>';
  descHtml += '<a class="content-link open-lore-journal-btn" draggable="true" data-uuid="Compendium.mighty-blade.diarios.' + diarioId + '" data-slug="' + slug + '" data-type="JournalEntry" style="background:#d97706;color:#1e1e2d;padding:4px 10px;border-radius:4px;font-weight:bold;text-decoration:none;cursor:pointer;"><i class="fas fa-book"></i> Abrir Diário</a>';
  descHtml += '</div>';

  if (org.tipo) {
    descHtml += '<div style="margin-top:6px; font-size:0.85rem; color:#94a3b8;"><strong>Tipo:</strong> ' + org.tipo + '</div>';
  }
  if (org.sede) {
    descHtml += '<div style="margin-top:4px; font-size:0.85rem; color:#94a3b8;"><strong>Sede:</strong> ' + org.sede + '</div>';
  }
  if (org.lideranca) {
    descHtml += '<div style="margin-top:4px; font-size:0.85rem; color:#94a3b8;"><strong>Liderança:</strong> ' + org.lideranca + '</div>';
  }
  if (org.ingresso) {
    descHtml += '<div style="margin-top:4px; font-size:0.85rem; color:#94a3b8;"><strong>Ingresso:</strong> ' + org.ingresso + '</div>';
  }
  descHtml += '</div>';

  return {
    name: org.nome,
    type: "organizacao",
    img: imgPath,
    system: {
      tipo: org.tipo || "Ordem",
      sede: org.sede || "",
      lideranca: org.lideranca || "",
      ingresso: org.ingresso || "",
      description: descHtml,
    },
    flags: {
      "mighty-blade": {
        slug,
        diarioId,
      },
    },
  };
}

function buildAbilityOrSpellItem(hab) {
  const isMagia = hab.categoria === "Magia" || hab.tipo === "Magia";
  const slug = slugify(hab.nome || hab.id);

  const reqStr = Array.isArray(hab.requisitos) ? hab.requisitos.join(", ") : (hab.requisitos || "");
  let descHtml = mdToHtml(hab.descricao || "");

  if (isMagia) {
    let fonte = "arcana";
    const reqLower = reqStr.toLowerCase();
    const nomeLower = (hab.nome || "").toLowerCase();
    if (
      reqLower.includes("místic") ||
      reqLower.includes("mistic") ||
      reqLower.includes("sacerdote") ||
      reqLower.includes("druida") ||
      reqLower.includes("xamã") ||
      reqLower.includes("xama") ||
      nomeLower.includes("divin") ||
      nomeLower.includes("sagrad") ||
      nomeLower.includes("cura")
    ) {
      fonte = "mistica";
    }

    return {
      isMagia: true,
      data: {
        name: hab.nome,
        type: "magia",
        img: "icons/magic/symbols/rune-sigil-horned-blue.webp",
        system: {
          fonte,
          custo: Number(hab.custoMana ?? hab.custo) || 0,
          dificuldade: Number(hab.dificuldade) || 8,
          circulo: Number(hab.circulo) || 1,
          description: reqStr ? "<p><strong>Requisitos:</strong> " + reqStr + "</p>" + descHtml : descHtml,
        },
        flags: {
          "mighty-blade": {
            slug,
            tipo: hab.tipo || "Acao",
          },
        },
      },
    };
  }

  const tipoLower = (hab.tipo || "suporte").toLowerCase();
  let tipoFoundry = "suporte";
  if (tipoLower.includes("acao") || tipoLower.includes("ação")) tipoFoundry = "acao";
  else if (tipoLower.includes("reacao") || tipoLower.includes("reação")) tipoFoundry = "reacao";

  const catLower = (hab.categoria || "tecnica").toLowerCase();
  let catFoundry = "tecnica";
  if (catLower.includes("caracteristica")) catFoundry = "caracteristica";
  else if (catLower.includes("padrao") || catLower.includes("padrão")) catFoundry = "padrao";
  else if (catLower.includes("musica") || catLower.includes("música")) catFoundry = "musica";
  else if (catLower.includes("especial")) catFoundry = "especial";

  let bonusAtributo = { atributo: "", valor: 0 };
  const attrEfeito = hab.efeitos?.find((e) => e.tipo === "bonusAtributo");
  if (attrEfeito) {
    bonusAtributo = { atributo: attrEfeito.atributo, valor: Number(attrEfeito.valor) || 0 };
  }

  return {
    isMagia: false,
    data: {
      name: hab.nome,
      type: "habilidade",
      img: "icons/svg/aura.svg",
      system: {
        tipo: tipoFoundry,
        categoria: catFoundry,
        custo: Number(hab.custoMana ?? hab.custo) || 0,
        dificuldade: Number(hab.dificuldade) || 0,
        requisitos: reqStr,
        bonusAtributo,
        efeitos: hab.efeitos || [],
        description: descHtml,
      },
      flags: {
        "mighty-blade": {
          slug,
          automatica: !!hab.automatica,
          opcoes: hab.opcoes || [],
        },
      },
    },
  };
}

function buildEquipmentItem(eqp) {
  const slug = slugify(eqp.nome || eqp.id);
  const cat = eqp.categoria;
  const obs = eqp.observacoes ? "<p>" + eqp.observacoes + "</p>" : "";

  if (cat === "Arma" || cat === "Projetil" || (cat === "Conjuracao" && (eqp.danoBonusFor || eqp.danoFixo))) {
    const danoStr = eqp.danoBonusFor
      ? "FOR+" + eqp.danoBonusFor
      : eqp.danoFixo
      ? "" + eqp.danoFixo
      : "0";

    return {
      name: eqp.nome,
      type: "arma",
      img: cat === "Projetil" ? "icons/weapons/bows/bow-short-wood.webp" :
           cat === "Conjuracao" ? "icons/weapons/staves/staff-simple.webp" :
           "icons/svg/sword.svg",
      system: {
        dano: danoStr,
        tipoDano: Array.isArray(eqp.tipoDano) ? eqp.tipoDano : [],
        fn: Number(eqp.fn) || 0,
        alcance: eqp.alcance || "Adjacente (1m)",
        propriedades: Array.isArray(eqp.propriedades) ? eqp.propriedades : [],
        equipado: false,
        efeitos: [],
        peso: Number(eqp.pesoKg) || 0,
        quantidade: 1,
        custo: Number(eqp.custo) || 0,
        description: obs,
      },
      flags: {
        "mighty-blade": {
          slug,
          categoria: cat,
        },
      },
    };
  }

  if (cat === "Defesa") {
    const isEscudo = !!eqp.isEscudo;
    const isPesada = (eqp.propriedades && eqp.propriedades.includes("Pesada")) || (Number(eqp.pesoKg) >= 20);
    const isRigida = eqp.propriedades && eqp.propriedades.includes("Rigida");

    return {
      name: eqp.nome,
      type: "armadura",
      img: isEscudo ? "icons/equipment/shield/heater-wooden-brown.webp" : "icons/equipment/chest/breastplate-leather-brown.webp",
      system: {
        defesa: Number(eqp.defesa) || 0,
        fn: Number(eqp.fn) || 0,
        subtipo: isEscudo ? "escudo" : "armadura",
        pesada: !!isPesada,
        rigida: !!isRigida,
        equipado: false,
        efeitos: [],
        peso: Number(eqp.pesoKg) || 0,
        quantidade: 1,
        custo: Number(eqp.custo) || 0,
        description: obs,
      },
      flags: {
        "mighty-blade": {
          slug,
          categoria: cat,
        },
      },
    };
  }

  const isCanalizador = eqp.propriedades && eqp.propriedades.includes("Canalizador");
  let img = "icons/svg/item-bag.svg";
  if (cat === "Pocao") img = "icons/consumables/potions/potion-flask-corked-red.webp";
  else if (cat === "Municao") img = "icons/weapons/ammunition/arrow-head-steel.webp";
  else if (cat === "Conjuracao") img = "icons/weapons/staves/staff-simple.webp";

  return {
    name: eqp.nome,
    type: "equipamento",
    img,
    system: {
      canalizador: !!isCanalizador,
      equipado: false,
      efeitos: [],
      peso: Number(eqp.pesoKg) || 0,
      quantidade: 1,
      custo: Number(eqp.custo) || 0,
      description: obs,
    },
    flags: {
      "mighty-blade": {
        slug,
        categoria: cat,
      },
    },
  };
}

function buildJournalEntryForRace(raca) {
  const slug = slugify(raca.id);
  const diarioId = deterministicId("diario-raca", slug);
  const imgFile = RACAS_FORJA_MAP[slug] || "raca.png";
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  const pages = [];

  let bioHtml = '<div style="text-align:center;margin-bottom:16px;">' +
    '<img src="' + imgPath + '" alt="' + raca.nome + '" style="max-height:300px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);border:2px solid #30363d;" />' +
    '</div>' +
    '<h2>Visão Geral & Biologia</h2>' +
    (raca.biologia ? mdToHtml(raca.biologia) : (raca.descricao ? mdToHtml(raca.descricao) : "<p>Sem registros biológicos.</p>"));

  if (raca.faixasEtarias) {
    const f = raca.faixasEtarias;
    bioHtml += '<hr><h3>Faixas Etárias & Ciclos</h3><ul>' +
      '<li><strong>Filhote:</strong> ' + f.filhote + ' anos</li>' +
      (f.crianca ? '<li><strong>Criança:</strong> ' + f.crianca + ' anos</li>' : '') +
      (f.adolescente ? '<li><strong>Adolescente:</strong> ' + f.adolescente + ' anos</li>' : '') +
      '<li><strong>Adulto:</strong> ' + f.adulto + ' anos</li>' +
      '<li><strong>Idoso:</strong> ' + f.idoso + ' anos</li>' +
      '<li><strong>Ancião:</strong> ' + f.anciao + ' anos</li>' +
      '</ul>';
  }
  pages.push({
    _id: deterministicId("p1-bio", slug),
    name: "Biologia & Fisiologia",
    type: "text",
    title: { show: true, level: 1 },
    text: { content: bioHtml, format: 1 },
  });

  if (raca.cultura) {
    pages.push({
      _id: deterministicId("p2-cul", slug),
      name: "Cultura & Sociedade",
      type: "text",
      title: { show: true, level: 1 },
      text: { content: "<h2>Cultura & Sociedade</h2>" + mdToHtml(raca.cultura), format: 1 },
    });
  }

  if (raca.nomes) {
    let nomesEx = [];
    if (raca.nomes.masculinos?.length) nomesEx.push("<h4>Nomes Masculinos</h4><p>" + raca.nomes.masculinos.join(", ") + "</p>");
    if (raca.nomes.femininos?.length) nomesEx.push("<h4>Nomes Femininos</h4><p>" + raca.nomes.femininos.join(", ") + "</p>");
    if (raca.nomes.sobrenomes?.length) nomesEx.push("<h4>Sobrenomes e Clãs</h4><p>" + raca.nomes.sobrenomes.join(", ") + "</p>");

    pages.push({
      _id: deterministicId("p3-nom", slug),
      name: "Nomes & Tradições",
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: "<h2>Nomes & Tradições</h2>" + (raca.nomes.lore ? mdToHtml(raca.nomes.lore) : "") + nomesEx.join(""),
        format: 1,
      },
    });
  }

  return {
    _id: diarioId,
    name: "Diário: " + raca.nome,
    pages,
    img: imgPath,
    flags: {
      "mighty-blade": {
        slug,
        tipo: "raca",
      },
    },
  };
}

function buildJournalEntryForClass(classe) {
  const slug = slugify(classe.id);
  const diarioId = deterministicId("diario-classe", slug);
  const imgFile = CLASSES_FORJA_MAP[slug] || "guerreiro1.png";
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  const pages = [
    {
      _id: deterministicId("p1-cls", slug),
      name: "História e Papel no Mundo",
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: '<div style="text-align:center;margin-bottom:16px;">' +
          '<img src="' + imgPath + '" alt="' + classe.nome + '" style="max-height:300px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);border:2px solid #30363d;" />' +
          '</div>' +
          '<h2>História e Papel no Mundo</h2>' +
          mdToHtml(classe.descricao || "") +
          (classe.racasComuns ? '<p><strong>Raças Mais Frequentes:</strong> ' + classe.racasComuns + '</p>' : ''),
        format: 1,
      },
    },
  ];

  if (classe.listaHabilidades?.length) {
    pages.push({
      _id: deterministicId("p2-cls", slug),
      name: "Arsenal & Habilidades",
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: '<h2>Arsenal da Classe (' + classe.listaHabilidades.length + ' Habilidades)</h2>' +
          '<p>Esta classe tem acesso às seguintes habilidades oficiais de treinamento:</p>' +
          '<ul>' + classe.listaHabilidades.map((h) => '<li><strong>' + h + '</strong></li>').join("") + '</ul>',
        format: 1,
      },
    });
  }

  return {
    _id: diarioId,
    name: "Diário: " + classe.nome,
    pages,
    img: imgPath,
    flags: {
      "mighty-blade": {
        slug,
        tipo: "classe",
      },
    },
  };
}

function buildJournalEntryForCaminho(caminho) {
  const slug = slugify(caminho.id);
  const diarioId = deterministicId("diario-caminho", slug);
  const imgFile = CAMINHOS_FORJA_SLUGS.has(slug) ? slug + ".png" : (CLASSES_FORJA_MAP[slug] || "caminho.png");
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  const pages = [
    {
      _id: deterministicId("p1-cam", slug),
      name: "Tradição e Práticas",
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: '<div style="text-align:center;margin-bottom:16px;">' +
          '<img src="' + imgPath + '" alt="' + caminho.nome + '" style="max-height:300px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);border:2px solid #30363d;" />' +
          '</div>' +
          '<h2>Tradição do Caminho</h2>' +
          mdToHtml(caminho.descricao || "") +
          '<hr>' +
          '<p><strong>Pré-Requisitos de Acesso:</strong> ' + (caminho.requisitosTexto || "Nenhum") + '</p>' +
          (caminho.racasComuns ? '<p><strong>Raças Comuns:</strong> ' + caminho.racasComuns + '</p>' : ''),
        format: 1,
      },
    },
  ];

  return {
    _id: diarioId,
    name: "Diário: " + caminho.nome,
    pages,
    img: imgPath,
    flags: {
      "mighty-blade": {
        slug,
        tipo: "caminho",
      },
    },
  };
}

function buildJournalEntryForOrg(org) {
  const slug = slugify(org.id);
  const diarioId = deterministicId("diario-org", slug);
  const imgFile = ORGANIZACOES_FORJA_MAP[slug] || "org_" + slug + ".png";
  const imgPath = "systems/mighty-blade/assets/forja/" + imgFile;

  const pages = [
    {
      _id: deterministicId("p1-org", slug),
      name: "Crônicas e Estatuto",
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: '<div style="text-align:center;margin-bottom:16px;">' +
          '<img src="' + imgPath + '" alt="' + org.nome + '" style="max-height:220px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);border:2px solid #30363d;" />' +
          '</div>' +
          '<h2>Crônicas e História</h2>' +
          mdToHtml(org.descricao || "") +
          '<hr>' +
          '<h3>Estatuto da Organização</h3>' +
          '<ul>' +
          '<li><strong>Tipo:</strong> ' + org.tipo + '</li>' +
          '<li><strong>Sede Oficial:</strong> ' + (org.sede || "Não especificada") + '</li>' +
          '<li><strong>Liderança:</strong> ' + (org.lideranca || "Não especificada") + '</li>' +
          '<li><strong>Condições de Ingresso:</strong> ' + (org.ingresso || "Não especificado") + '</li>' +
          '</ul>',
        format: 1,
      },
    },
  ];

  return {
    _id: diarioId,
    name: "Diário: " + org.nome,
    pages,
    img: imgPath,
    flags: {
      "mighty-blade": {
        slug,
        tipo: "organizacao",
      },
    },
  };
}

async function run() {
  console.log("=== EXPORTADOR DE CONTEÚDO CANÔNICO MIGHTY BLADE 3e ===");

  const racasList = Object.values(RACAS);
  const canonicalRacas = racasList.map(buildRaceItem);
  console.log("✓ Raças processadas: " + canonicalRacas.length);

  const classesList = Object.values(CLASSES);
  const canonicalClasses = classesList.map(buildClassItem);
  console.log("✓ Classes processadas: " + canonicalClasses.length);

  const caminhosList = Object.values(CAMINHOS);
  const canonicalCaminhos = caminhosList.map(buildCaminhoItem);
  console.log("✓ Caminhos processados: " + canonicalCaminhos.length);

  const orgsList = Object.values(ORGANIZACOES);
  const canonicalOrganizacoes = orgsList.map(buildOrganizacaoItem);
  console.log("✓ Organizações processadas: " + canonicalOrganizacoes.length);

  const habsList = Object.values(HABILIDADES);
  const canonicalHabilidades = [];
  const canonicalMagias = [];

  for (const hab of habsList) {
    const res = buildAbilityOrSpellItem(hab);
    if (res.isMagia) {
      canonicalMagias.push(res.data);
    } else {
      canonicalHabilidades.push(res.data);
    }
  }
  console.log("✓ Habilidades processadas: " + canonicalHabilidades.length);
  console.log("✓ Magias processadas: " + canonicalMagias.length);

  const equipList = Object.values(EQUIPAMENTOS);
  const canonicalEquipamentos = equipList.map(buildEquipmentItem);
  console.log("✓ Equipamentos processados: " + canonicalEquipamentos.length);

  const canonicalDiarios = [
    ...racasList.map(buildJournalEntryForRace),
    ...classesList.map(buildJournalEntryForClass),
    ...caminhosList.map(buildJournalEntryForCaminho),
    ...orgsList.map(buildJournalEntryForOrg),
  ];
  console.log("✓ Diários (JournalEntry) processados: " + canonicalDiarios.length);

  const dataOutputDir = path.join(FOUNDRY_DIR, "module", "data");
  if (!fs.existsSync(dataOutputDir)) fs.mkdirSync(dataOutputDir, { recursive: true });

  const totalItems =
    canonicalRacas.length +
    canonicalClasses.length +
    canonicalCaminhos.length +
    canonicalOrganizacoes.length +
    canonicalHabilidades.length +
    canonicalMagias.length +
    canonicalEquipamentos.length;

  const mjsContent = '/**\n' +
    ' * CANONICAL CONTENT PACK DATA\n' +
    ' * Gerado automaticamente a partir de @mighty-blade/rules-core.\n' +
    ' * Total de itens: ' + totalItems + ' | Diários: ' + canonicalDiarios.length + '\n' +
    ' */\n\n' +
    'export const CANONICAL_RACAS = ' + JSON.stringify(canonicalRacas, null, 2) + ';\n\n' +
    'export const CANONICAL_CLASSES = ' + JSON.stringify(canonicalClasses, null, 2) + ';\n\n' +
    'export const CANONICAL_CAMINHOS = ' + JSON.stringify(canonicalCaminhos, null, 2) + ';\n\n' +
    'export const CANONICAL_ORGANIZACOES = ' + JSON.stringify(canonicalOrganizacoes, null, 2) + ';\n\n' +
    'export const CANONICAL_HABILIDADES = ' + JSON.stringify(canonicalHabilidades, null, 2) + ';\n\n' +
    'export const CANONICAL_MAGIAS = ' + JSON.stringify(canonicalMagias, null, 2) + ';\n\n' +
    'export const CANONICAL_EQUIPAMENTOS = ' + JSON.stringify(canonicalEquipamentos, null, 2) + ';\n\n' +
    'export const CANONICAL_DIARIOS = ' + JSON.stringify(canonicalDiarios, null, 2) + ';\n';

  const mjsPath = path.join(dataOutputDir, "canonical-packs-data.mjs");
  fs.writeFileSync(mjsPath, mjsContent, "utf-8");
  console.log("\n🎉 Arquivo ES Module gerado com sucesso: " + mjsPath);

  const packsMap = {
    racas: canonicalRacas,
    classes: canonicalClasses,
    caminhos: canonicalCaminhos,
    organizacoes: canonicalOrganizacoes,
    habilidades: canonicalHabilidades,
    magias: canonicalMagias,
    equipamentos: canonicalEquipamentos,
    diarios: canonicalDiarios,
  };

  for (const [packName, items] of Object.entries(packsMap)) {
    const packSrcDir = path.join(FOUNDRY_DIR, "packs", packName + "_src");
    if (fs.existsSync(packSrcDir)) fs.rmSync(packSrcDir, { recursive: true, force: true });
    fs.mkdirSync(packSrcDir, { recursive: true });

    for (const item of items) {
      const itemSlug = item.flags?.["mighty-blade"]?.slug || item._id;
      const itemPath = path.join(packSrcDir, itemSlug + ".json");
      fs.writeFileSync(itemPath, JSON.stringify(item, null, 2), "utf-8");
    }
    console.log("📁 Exportados " + items.length + " itens para packs/" + packName + "_src");
  }

  console.log("\n✅ SUCESSO: Todos os " + totalItems + " itens e " + canonicalDiarios.length + " diários canônicos foram compilados e preparados!");
}

run().catch((err) => {
  console.error("❌ Erro fatal na exportação:", err);
  process.exit(1);
});
