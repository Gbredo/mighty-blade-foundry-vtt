const fs = require("fs");
const path = require("path");

const FOUNDRY_DIR = "d:\\Projetos\\mighty-blade-foundry-vtt";
const WEBSITE_DIR = "d:\\Projetos\\MightyBlade3eWebsite";

// Load compiled rules-core data
const { RACAS } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/racas.js"));
const { CLASSES } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/classes.js"));
const { HABILIDADES } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/habilidades.js"));
const { EQUIPAMENTOS } = require(path.join(WEBSITE_DIR, "packages/rules-core/dist/data/equipamentos.js"));

function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  return `<p>${html}</p>`;
}

function buildRaceItem(raca) {
  const autoHabId = raca.habilidadeAutomatica;
  const autoHab = HABILIDADES[autoHabId];

  let descParts = [];
  if (raca.descricao) descParts.push(`<div class="lore">${mdToHtml(raca.descricao)}</div>`);
  if (raca.faixasEtarias) {
    const f = raca.faixasEtarias;
    descParts.push(`
      <div class="faixas-etarias" style="margin-top:8px;">
        <strong>Faixas Etárias:</strong> Filhote (${f.filhote} anos) · Adulto (${f.adulto} anos) · Idoso (${f.idoso} anos) · Ancião (${f.anciao} anos)
      </div>
    `);
  }
  if (raca.biologia) {
    descParts.push(`<div class="biologia" style="margin-top:8px;"><strong>Biologia:</strong>${mdToHtml(raca.biologia)}</div>`);
  }
  if (raca.cultura) {
    descParts.push(`<div class="cultura" style="margin-top:8px;"><strong>Cultura & Sociedade:</strong>${mdToHtml(raca.cultura)}</div>`);
  }
  if (raca.nomes?.lore) {
    let nomesEx = [];
    if (raca.nomes.masculinos?.length) nomesEx.push(`<b>Masculinos:</b> ${raca.nomes.masculinos.slice(0, 8).join(", ")}`);
    if (raca.nomes.femininos?.length) nomesEx.push(`<b>Femininos:</b> ${raca.nomes.femininos.slice(0, 8).join(", ")}`);
    if (raca.nomes.sobrenomes?.length) nomesEx.push(`<b>Sobrenomes:</b> ${raca.nomes.sobrenomes.slice(0, 6).join(", ")}`);
    descParts.push(`
      <div class="nomes" style="margin-top:8px;">
        <strong>Nomes e Tradições:</strong><br>${mdToHtml(raca.nomes.lore)}
        ${nomesEx.length ? `<div style="font-size:12px;opacity:0.85;margin-top:4px;">${nomesEx.join("<br>")}</div>` : ""}
      </div>
    `);
  }

  const slug = slugify(raca.id);
  const autoSlug = autoHab ? slugify(autoHab.nome) : slugify(autoHabId);

  const concessoes = [];
  if (raca.id === "humano") {
    concessoes.push({ tipo: "escolhaAtributo", ref: autoSlug, valor: 1 });
  } else {
    concessoes.push({ tipo: "habilidade", ref: autoSlug });
  }

  return {
    name: raca.nome,
    type: "raca",
    img: "icons/svg/mystery-man.svg",
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
      description: descParts.join("") || `<p>Raça ${raca.nome} de Mighty Blade 3e.</p>`,
    },
    flags: {
      "mighty-blade": {
        slug,
      },
    },
  };
}

function buildClassItem(classe) {
  const descParts = [];
  if (classe.descricao) {
    descParts.push(`<div class="lore">${mdToHtml(classe.descricao)}</div>`);
  }
  if (classe.racasComuns) {
    descParts.push(`<div style="margin-top:8px;"><strong>Raças Comuns:</strong> ${classe.racasComuns}</div>`);
  }
  if (classe.listaHabilidades?.length) {
    descParts.push(`
      <div style="margin-top:8px;font-size:12px;opacity:0.9;">
        <strong>Habilidades Disponíveis:</strong> ${classe.listaHabilidades.join(", ")}
      </div>
    `);
  }

  const slug = slugify(classe.id);
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
    img: "icons/svg/shield.svg",
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
      description: descParts.join("") || `<p>Classe ${classe.nome} de Mighty Blade 3e.</p>`,
    },
    flags: {
      "mighty-blade": {
        slug,
        conjurador: !!classe.conjurador,
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
          description: reqStr ? `<p><strong>Requisitos:</strong> ${reqStr}</p>${descHtml}` : descHtml,
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
  const obs = eqp.observacoes ? `<p>${eqp.observacoes}</p>` : "";

  if (cat === "Arma" || cat === "Projetil" || (cat === "Conjuracao" && (eqp.danoBonusFor || eqp.danoFixo))) {
    const danoStr = eqp.danoBonusFor
      ? `FOR+${eqp.danoBonusFor}`
      : eqp.danoFixo
      ? `${eqp.danoFixo}`
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

async function run() {
  console.log("=== EXPORTADOR DE CONTEÚDO CANÔNICO MIGHTY BLADE 3e ===");

  const racasList = Object.values(RACAS);
  const canonicalRacas = racasList.map(buildRaceItem);
  console.log(`✓ Raças processadas: ${canonicalRacas.length}`);

  const classesList = Object.values(CLASSES);
  const canonicalClasses = classesList.map(buildClassItem);
  console.log(`✓ Classes processadas: ${canonicalClasses.length}`);

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
  console.log(`✓ Habilidades processadas: ${canonicalHabilidades.length}`);
  console.log(`✓ Magias processadas: ${canonicalMagias.length}`);

  const equipList = Object.values(EQUIPAMENTOS);
  const canonicalEquipamentos = equipList.map(buildEquipmentItem);
  console.log(`✓ Equipamentos processados: ${canonicalEquipamentos.length}`);

  const dataOutputDir = path.join(FOUNDRY_DIR, "module", "data");
  if (!fs.existsSync(dataOutputDir)) fs.mkdirSync(dataOutputDir, { recursive: true });

  const totalItems = canonicalRacas.length + canonicalClasses.length + canonicalHabilidades.length + canonicalMagias.length + canonicalEquipamentos.length;

  const mjsContent = `/**
 * CANONICAL CONTENT PACK DATA
 * Gerado automaticamente a partir de @mighty-blade/rules-core.
 * Total de itens: ${totalItems}
 */

export const CANONICAL_RACAS = ${JSON.stringify(canonicalRacas, null, 2)};

export const CANONICAL_CLASSES = ${JSON.stringify(canonicalClasses, null, 2)};

export const CANONICAL_HABILIDADES = ${JSON.stringify(canonicalHabilidades, null, 2)};

export const CANONICAL_MAGIAS = ${JSON.stringify(canonicalMagias, null, 2)};

export const CANONICAL_EQUIPAMENTOS = ${JSON.stringify(canonicalEquipamentos, null, 2)};
`;

  const mjsPath = path.join(dataOutputDir, "canonical-packs-data.mjs");
  fs.writeFileSync(mjsPath, mjsContent, "utf-8");
  console.log(`\n🎉 Arquivo ES Module gerado com sucesso: ${mjsPath}`);

  const packsMap = {
    racas: canonicalRacas,
    classes: canonicalClasses,
    habilidades: canonicalHabilidades,
    magias: canonicalMagias,
    equipamentos: canonicalEquipamentos,
  };

  for (const [packName, items] of Object.entries(packsMap)) {
    const packSrcDir = path.join(FOUNDRY_DIR, "packs", `${packName}_src`);
    if (fs.existsSync(packSrcDir)) fs.rmSync(packSrcDir, { recursive: true, force: true });
    fs.mkdirSync(packSrcDir, { recursive: true });

    for (const item of items) {
      const itemSlug = item.flags["mighty-blade"].slug;
      const itemPath = path.join(packSrcDir, `${itemSlug}.json`);
      fs.writeFileSync(itemPath, JSON.stringify(item, null, 2), "utf-8");
    }
    console.log(`📁 Exportados ${items.length} itens para packs/${packName}_src`);
  }

  // Also copy this build script into FOUNDRY_DIR/scripts/export_canonical_content.cjs for future runs!
  fs.copyFileSync(__filename, path.join(FOUNDRY_DIR, "scripts", "export_canonical_content.cjs"));

  console.log(`\n✅ SUCESSO: Todos os ${totalItems} itens canônicos foram compilados e preparados!`);
}

run().catch((err) => {
  console.error("❌ Erro fatal na exportação:", err);
  process.exit(1);
});
