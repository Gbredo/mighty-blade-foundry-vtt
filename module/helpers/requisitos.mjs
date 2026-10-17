/**
 * Módulo de Avaliação de Pré-Requisitos para o Mighty Blade 3e.
 * Avalia requisitos de Caminhos, Habilidades e Especializações contra o Ator.
 */

/** Normaliza string para comparação sem acentos, minúsculo e sem pontuações */
export function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function cleanObsidianWikilinks(str) {
  if (!str) return "";
  return String(str)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .trim();
}

/**
 * Quebra uma string de requisitos ("Inteligência 5, Herbalismo." ou "FOR 6 + Fúria") em array de requisitos individuais.
 * @param {string} texto
 * @returns {string[]}
 */
export function parseRequisitosTexto(texto) {
  if (!texto) return [];
  let raw = cleanObsidianWikilinks(String(texto))
    .replace(/Chifres,\s*Garras\s+e\s+Presas/gi, "Chifres__CHIFRES_COMMA__Garras e Presas");

  // Protege vírgulas dentro de sentenças de idioma (ex.: "Saber falar Arkadis, Ctónico, Draen ou Quoratus")
  raw = raw.replace(/(?:saber\s+falar|falar|idioma:?)\s+[^.]+/gi, (match) => {
    return match.replace(/,/g, "__LANG_COMMA__");
  });

  const parts = raw.includes(",")
    ? raw.split(",")
    : raw.split(/\s*\+\s*/);
  return parts
    .map((t) =>
      t
        .replace(/Chifres__CHIFRES_COMMA__Garras e Presas/g, "Chifres, Garras e Presas")
        .replace(/__LANG_COMMA__/g, ",")
        .replace(/\.+\s*$/, "")
        .trim()
    )
    .filter(Boolean);
}

/**
 * Verifica se um marco ou requisito narrativo foi registrado na ficha do personagem.
 * Suporta flags em flags['mighty-blade'], system.marcos, ou itens embutidos.
 * @param {string} nTexto Texto normalizado do requisito narrativo
 * @param {Actor} actor Ator alvo
 * @param {Array<object>} [rawItems=[]] Itens brutos do ator
 * @returns {boolean}
 */
export function checarMarcoNarrativo(nTexto, actor, rawItems = []) {
  if (!actor) return false;
  const mbFlags = actor.flags?.["mighty-blade"] || {};
  const sysMarcos = actor.system?.marcos;

  const marcosList = [
    ...(Array.isArray(mbFlags.marcos) ? mbFlags.marcos : []),
    ...(Array.isArray(sysMarcos) ? sysMarcos : []),
  ].map(norm);

  const marcosObj = {
    ...(typeof mbFlags.marcos === "object" && !Array.isArray(mbFlags.marcos) ? mbFlags.marcos : {}),
    ...(typeof sysMarcos === "object" && !Array.isArray(sysMarcos) ? sysMarcos : {}),
  };

  // 1. Sangramento / Ficar Por um Fio devido a Sangramento (Sanguíneo)
  if (nTexto.includes("sangramento") || nTexto.includes("fio")) {
    if (
      mbFlags.sangramentoPorUmFio === true ||
      mbFlags.ficarPorUmFioSangramento === true ||
      mbFlags.sangramento === true ||
      marcosObj.sangramentoPorUmFio === true ||
      marcosObj.sangramento === true ||
      marcosObj.porUmFio === true ||
      marcosList.some((m) => m.includes("sangramento") || m.includes("fio")) ||
      rawItems.some((i) => {
        const n = norm(i.name);
        return n.includes("sangramento") || (n.includes("fio") && n.includes("sangr"));
      })
    ) {
      return true;
    }
  }

  // 2. Sobrenatural / Destruiu ou Matou criatura sobrenatural (Estrige)
  if (nTexto.includes("sobrenatural") || nTexto.includes("matado algo") || nTexto.includes("destru")) {
    if (
      mbFlags.destruiuSobrenatural === true ||
      mbFlags.matouSobrenatural === true ||
      mbFlags.sobrenatural === true ||
      marcosObj.destruiuSobrenatural === true ||
      marcosObj.matouSobrenatural === true ||
      marcosObj.sobrenatural === true ||
      marcosList.some((m) => m.includes("sobrenatural")) ||
      rawItems.some((i) => norm(i.name).includes("sobrenatural"))
    ) {
      return true;
    }
  }

  // 3. Ordem da Espada de Mirah (Arconte)
  if (nTexto.includes("ordem") || nTexto.includes("mirah") || nTexto.includes("irmao")) {
    if (
      mbFlags.irmaoOrdemMirah === true ||
      mbFlags.ordemMirah === true ||
      mbFlags.ordem === true ||
      marcosObj.ordemMirah === true ||
      marcosObj.ordem === true ||
      marcosList.some((m) => m.includes("ordem") || m.includes("mirah")) ||
      rawItems.some((i) => norm(i.name).includes("ordem") || norm(i.name).includes("mirah"))
    ) {
      return true;
    }
  }

  // 4. Efeito de Dreno de Energia (Avantesma)
  if (nTexto.includes("dreno")) {
    if (
      mbFlags.drenoEnergia === true ||
      mbFlags.dreno === true ||
      marcosObj.drenoEnergia === true ||
      marcosList.some((m) => m.includes("dreno")) ||
      rawItems.some((i) => norm(i.name).includes("dreno"))
    ) {
      return true;
    }
  }

  // 5. Genérico em marcosList
  if (marcosList.some((m) => nTexto.includes(m) || m.includes(nTexto))) {
    return true;
  }

  return false;
}

/**
 * Extrai o conjunto normalizado de idiomas conhecidos pelo ator.
 * @param {object} actor
 * @returns {Set<string>}
 */
export function obterIdiomasAtor(actor) {
  const tokens = new Set();
  if (!actor) return tokens;

  const rawItems = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];

  for (const it of rawItems) {
    if (it.type === "idioma") {
      const slug = it.flags?.["mighty-blade"]?.slug || norm(it.name);
      if (slug) tokens.add(norm(slug));
      if (it.name) tokens.add(norm(it.name));
    }
  }

  const rawDetailsIdiomas = actor.system?.details?.idiomas || actor.system?.idiomas || "";
  if (typeof rawDetailsIdiomas === "string" && rawDetailsIdiomas.trim()) {
    const partes = rawDetailsIdiomas.split(/[,;\n\r]+/).map((p) => norm(p.trim())).filter(Boolean);
    for (const p of partes) {
      tokens.add(p);
      if (p === "track'kar'a" || p === "track-kar-a" || p === "trackkara") {
        tokens.add("trackkara");
        tokens.add("track-kar-a");
      }
    }
  } else if (Array.isArray(rawDetailsIdiomas)) {
    for (const p of rawDetailsIdiomas) {
      const np = norm(String(p));
      if (np) tokens.add(np);
    }
  }

  return tokens;
}

/**
 * Avalia uma string ou array de pré-requisitos contra os dados de um Ator.
 * @param {string|string[]} requisitosTexto String ou lista de requisitos (ex.: "Inteligência 5, Herbalismo.")
 * @param {Actor} actor Ator alvo no Foundry VTT
 * @param {object} [options={}] Opções de validação (ex: { modoEstrito: true })
 * @returns {{ atende: boolean, itens: Array<object>, falhas: string[] }}
 */
export function avaliarRequisitos(requisitosTexto, actor, options = {}) {
  if (!requisitosTexto || !actor) {
    return { atende: true, itens: [], falhas: [] };
  }

  const reqsRaw = Array.isArray(requisitosTexto)
    ? requisitosTexto
    : parseRequisitosTexto(requisitosTexto);

  if (!reqsRaw.length) {
    return { atende: true, itens: [], falhas: [] };
  }

  // Agrupa requisitos de raça permitida em um único item disjuntivo (OR),
  // pois um personagem possui apenas uma raça (ex: "Astério, Astéria" ou "Humano, Mahok").
  const isRacaReq = (t) => {
    return /^(?:ra[çc]a:?\s*)?(humano|an[ãa]o|elfo|fauno|juban|tailox|aesir|ast[ée]rio|ast[ée]ria|centauro|dragano|faen|fira|gnoll|hamelin|levent|mahok|metad[íi]lio|naga|orc)(?:\s*(?:,|ou)\s*(humano|an[ãa]o|elfo|fauno|juban|tailox|aesir|ast[ée]rio|ast[ée]ria|centauro|dragano|faen|fira|gnoll|hamelin|levent|mahok|metad[íi]lio|naga|orc))*$/i.test(t.trim());
  };

  const racaReqs = [];
  const outrosReqs = [];
  for (const r of reqsRaw) {
    if (isRacaReq(r)) {
      racaReqs.push(r.trim());
    } else {
      outrosReqs.push(r);
    }
  }

  const reqs = [];
  if (racaReqs.length > 0) {
    reqs.push(racaReqs.join(" ou "));
  }
  reqs.push(...outrosReqs);

  // Extrai atributos vivos do ator (valor derivado ou base)
  const attrs = actor.system?.attributes || {};
  const getAttrVal = (attr) => {
    if (typeof attr === "number") return attr;
    return Number(attr?.value ?? attr?.base ?? 0);
  };
  const forca = getAttrVal(attrs.forca);
  const agilidade = getAttrVal(attrs.agilidade);
  const inteligencia = getAttrVal(attrs.inteligencia);
  const vontade = getAttrVal(attrs.vontade);

  const atributosAtor = {
    forca,
    agilidade,
    inteligencia,
    vontade,
  };

  const nivelAtor = Number(actor.system?.details?.nivel) || 1;
  const antecedenteAtor = norm(actor.system?.details?.antecedente || "");

  // Coleta segura de itens embutidos (suporta Collection do Foundry ou Array puro)
  const rawItems = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];

  const racaDoc = rawItems.find((i) => i.type === "raca");
  const racaAtor = norm(racaDoc?.name || actor.system?.details?.raca || "");

  const classeDoc = rawItems.find((i) => i.type === "classe");
  const classeAtor = norm(classeDoc?.name || actor.system?.details?.classe || "");

  // Lista de nomes e slugs de habilidades/recursos que o herói já possui
  const habilidadesAtor = rawItems
    .filter((i) => [
      "habilidade",
      "magia",
      "antecedente",
      "caracteristica",
      "talento",
      "marco",
      "beneficio",
    ].includes(i.type))
    .map((i) => ({
      name: i.name,
      normName: norm(i.name),
      slug: norm(typeof i.getFlag === "function" ? (i.getFlag("mighty-blade", "slug") || "") : (i.flags?.["mighty-blade"]?.slug || "")),
    }));

  const itens = reqs.map((req) => {
    const texto = req.trim();
    const nTexto = norm(texto);

    // 1. Requisito de Atributo (ex: "Inteligência 5", "Força 6", "Vontade 4 ou mais", "FOR 6", "AGI 4", "INT 5", "VON 3")
    const mAttr = texto.match(/^(?:atributo\s+)?(for[çc]a|for|agilidade|agi|intelig[êe]ncia|int|vontade|von)(?:\s+m[íi]nim[ao])?\s+(\d+)(?:\s*(?:ou mais|\+))?$/i);
    if (mAttr) {
      const rawKey = norm(mAttr[1]);
      const mapAttr = {
        for: "forca",
        forca: "forca",
        agi: "agilidade",
        agilidade: "agilidade",
        int: "inteligencia",
        inteligencia: "inteligencia",
        von: "vontade",
        vontade: "vontade",
      };
      const attrKey = mapAttr[rawKey] || rawKey;
      const alvo = parseInt(mAttr[2], 10);
      const atual = atributosAtor[attrKey] || 0;
      const atende = atual >= alvo;
      return {
        texto,
        tipo: "atributo",
        atributo: attrKey,
        alvo,
        atual,
        atende,
        detalhe: atende ? `Atendido (${atual}/${alvo})` : `Você possui ${atual} (Requer ${alvo})`,
      };
    }

    // 2. Requisito de Nível (ex: "Nível 3", "Nível 5", "Nível 10")
    const mNivel = texto.match(/^n[íi]vel\s+(\d+)(?:\s*(?:ou mais|\+))?$/i);
    if (mNivel) {
      const alvo = parseInt(mNivel[1], 10);
      const atende = nivelAtor >= alvo;
      return {
        texto,
        tipo: "nivel",
        alvo,
        atual: nivelAtor,
        atende,
        detalhe: atende ? `Atendido (Nível ${nivelAtor})` : `Você é Nível ${nivelAtor} (Requer Nível ${alvo})`,
      };
    }

    // 3. Requisito de Raça Exclusiva / Restritiva ("Todas exceto Aesires")
    const mExcetoRaca = texto.match(/^(?:todas|qualquer\s+ra[çc]a)?\s*exceto\s+([a-zçãéíóú\s,]+)$/i);
    if (mExcetoRaca) {
      const racasProibidas = mExcetoRaca[1].split(/[,/]| e /i).map(norm);
      const ehProibido = racasProibidas.some((r) => racaAtor && (racaAtor.includes(r) || r.includes(racaAtor)));
      const atende = !ehProibido;
      return {
        texto,
        tipo: "raca",
        atende,
        detalhe: atende
          ? `Raça permitida (${racaDoc?.name || racaAtor || "qualquer"})`
          : `Raça incompatível (${racaDoc?.name || racaAtor} é proibida)`,
      };
    }

    // 4. Requisito de Raça explícito ou canônico (ex: "Raça: Anão", "Raça Dragano", "Humano, Mahok", "Astério, Astéria")
    const mRaca = texto.match(/^(?:ra[çc]a:?\s*)?(humano|an[ãa]o|elfo|fauno|juban|tailox|aesir|ast[ée]rio|ast[ée]ria|centauro|dragano|faen|fira|gnoll|hamelin|levent|mahok|metad[íi]lio|naga|orc)(?:\s*(?:,|ou)\s*(humano|an[ãa]o|elfo|fauno|juban|tailox|aesir|ast[ée]rio|ast[ée]ria|centauro|dragano|faen|fira|gnoll|hamelin|levent|mahok|metad[íi]lio|naga|orc))*$/i);
    if (mRaca && racaAtor) {
      const racasPermitidas = texto.replace(/^ra[çc]a:?\s*/i, "").split(/[,/]| ou /i).map(norm);
      const atendeRaca = racasPermitidas.some((r) => {
        if (racaAtor.includes(r) || r.includes(racaAtor)) return true;
        if ((r === "asterio" && racaAtor === "asteria") || (r === "asteria" && racaAtor === "asterio")) return true;
        return false;
      });
      return {
        texto,
        tipo: "raca",
        atende: atendeRaca,
        detalhe: atendeRaca
          ? `Raça compatível (${racaDoc?.name || racaAtor})`
          : `Requer Raça ${texto} (personagem é ${racaDoc?.name || actor.system?.details?.raca || "sem raça"})`,
      };
    }

    // 5. Incompatibilidade explícita de Habilidades / Fúrias
    // Ex: "Incompatível com Fúria de Batalha", "Não pode usar simultaneamente com Fúria de Batalha"
    const mIncompativel = texto.match(/^(?:incompat[íi]vel com|n[ãa]o compat[íi]vel com|n[ãa]o pode usar simultaneamente com|n[ãa]o pode possuir)\s+(.+)$/i);
    if (mIncompativel) {
      const habProibida = norm(mIncompativel[1]);
      const temConflito = habilidadesAtor.some(
        (h) => h.normName === habProibida || h.normName.includes(habProibida) || habProibida.includes(h.normName) || h.slug === habProibida
      );
      const atende = !temConflito;
      return {
        texto,
        tipo: "incompatibilidade",
        atende,
        detalhe: atende
          ? `Sem conflito de exclusividade`
          : `Conflito de exclusividade com ${mIncompativel[1]} (já adquirida)`,
      };
    }

    // 6. Requisito Genérico de "Uma habilidade de Fúria qualquer" (Amoque)
    const ehReqFuriaGenerica =
      (nTexto.includes("furia") && (nTexto.includes("qualquer") || nTexto.includes("habilidade") || nTexto.includes("uma"))) ||
      nTexto === "furia";
    if (ehReqFuriaGenerica) {
      const temFuria = habilidadesAtor.some((h) => h.normName.includes("furia") || h.slug.includes("furia"));
      return {
        texto,
        tipo: "habilidade",
        atende: temFuria,
        detalhe: temFuria ? "Possui habilidade de Fúria" : "Requer uma habilidade de Fúria (não possui)",
      };
    }

    // 6.1 Requisito de Característica Dracônica (ex: "Características Dracônicas (Barbatanas) para Draganos", "Características Dracônicas (Cauda)")
    const mCaracDraconica = texto.match(/caracter[íi]sticas?\s+drac[ôo]nicas?\s*\(([^)]+)\)(\s+para\s+draganos?)?/i);
    if (mCaracDraconica) {
      const subNome = norm(mCaracDraconica[1]);
      const apenasParaDragano = Boolean(mCaracDraconica[2]);
      const isDragano = racaAtor.includes("dragano") || racaAtor.includes("draconiano");
      if (apenasParaDragano && racaAtor && !isDragano) {
        return {
          texto,
          tipo: "habilidade",
          atende: true,
          detalhe: `Isento para raça ${racaDoc?.name || racaAtor}`,
        };
      }
      const temSub = habilidadesAtor.some(
        (h) => h.normName === subNome || h.normName.includes(subNome) || subNome.includes(h.normName)
      );
      return {
        texto,
        tipo: "habilidade",
        atende: temSub,
        detalhe: temSub ? `Possui Característica Dracônica (${mCaracDraconica[1]})` : `Requer Característica Dracônica: ${mCaracDraconica[1]}`,
      };
    }

    // 6.2 Requisito genérico de "ao menos uma Habilidade de Maldição"
    if (nTexto.includes("habilidade de maldicao")) {
      const temMaldicao = habilidadesAtor.some((h) => h.normName.includes("maldicao") || h.slug.includes("maldicao"));
      return {
        texto,
        tipo: "habilidade",
        atende: temMaldicao,
        detalhe: temMaldicao ? "Possui habilidade de Maldição" : "Requer ao menos uma Habilidade de Maldição",
      };
    }

    // 6.3 Requisito de "Raça Florestal"
    if (nTexto === "raca florestal") {
      const racasFlorestais = ["elfo", "faen", "silfo", "fauno", "satiro", "tailox", "centauro", "gnoll", "juban"];
      const ehFlorestal = racasFlorestais.some((r) => racaAtor.includes(r)) || habilidadesAtor.some((h) => h.normName === "raca florestal");
      return {
        texto,
        tipo: "raca",
        atende: ehFlorestal,
        detalhe: ehFlorestal ? "Raça Florestal compatível" : "Requer Raça Florestal",
      };
    }

    // 6.4 Requisito de Idioma ("Saber falar Arkadis, Ctónico, Draen, Quoratus ou Track'kar'a", "Saber falar...", "Falar...")
    const mIdioma = texto.match(/^(?:saber\s+falar|falar|idioma:?)\s+(.+)$/i);
    if (mIdioma) {
      const idiomasOpcoes = mIdioma[1].split(/[,/]| ou /i).map(norm).filter(Boolean);
      const idiomasAtor = obterIdiomasAtor(actor);
      const atendeIdioma = idiomasOpcoes.some((id) => {
        return (
          idiomasAtor.has(id) ||
          (id === "trackkara" && (idiomasAtor.has("track-kar-a") || idiomasAtor.has("trackkara"))) ||
          (id === "track'kar'a" && (idiomasAtor.has("track-kar-a") || idiomasAtor.has("trackkara")))
        );
      });
      return {
        texto,
        tipo: "idioma",
        atende: atendeIdioma,
        detalhe: atendeIdioma
          ? "Idioma requerido conhecido"
          : `Requer falar um dos seguintes idiomas: ${mIdioma[1]}`,
      };
    }

    // 7. Requisitos de Habilidades / Magias / Antecedentes específicos
    // Ex: "Herbalismo", "Conhecimento Arcano", "Dogma", "Pacto", "Teleporte 1", "Artesão"
    const cleanPunc = (s) => s.replace(/[:\-–—]/g, " ").replace(/\bcombater\b/g, "combate").replace(/\bolho da aguia\b/g, "olhos de aguia").replace(/\s+/g, " ").trim();
    const nTextoClean = cleanPunc(nTexto);
    const temHabilidade = habilidadesAtor.some((h) => {
      const hClean = cleanPunc(h.normName);
      return (
        h.normName === nTexto ||
        hClean === nTextoClean ||
        h.normName.includes(nTexto) ||
        nTexto.includes(h.normName) ||
        hClean.includes(nTextoClean) ||
        nTextoClean.includes(hClean) ||
        h.slug === nTexto
      );
    });
    const temAntecedente = antecedenteAtor === nTexto || antecedenteAtor.includes(nTexto);

    if (temHabilidade || temAntecedente) {
      return {
        texto,
        tipo: "habilidade",
        atende: true,
        detalhe: temHabilidade ? "Habilidade adquirida" : "Antecedente adquirido",
      };
    }

    // 8. Requisitos Narrativos ou Interpretativos (Marcos de Campanha)
    // Ex: "Ter sido aceito como Irmão da Ordem...", "Ficar Por um Fio devido a Sangramento", "Matado algo sobrenatural", "ter destruído 1 criatura sobrenatural"
    const narrativos = [
      "ter sido aceito",
      "irmao da ordem",
      "ficar por um fio",
      "matado algo",
      "destruido",
      "dreno de energia",
      "efeito de dreno",
      "sobrenatural",
    ];
    if (narrativos.some((palavra) => nTexto.includes(palavra))) {
      const marcoCumprido = checarMarcoNarrativo(nTexto, actor, rawItems);
      const modoEstrito = Boolean(
        options.modoEstrito ||
        options.validarNarrativos ||
        actor.flags?.["mighty-blade"]?.modoEstrito ||
        actor.flags?.["mighty-blade"]?.validacaoEstritaNarrativa
      );

      if (marcoCumprido) {
        return {
          texto,
          tipo: "narrativo",
          atende: true,
          detalhe: "Marco histórico/narrativo cumprido",
        };
      }

      if (modoEstrito) {
        return {
          texto,
          tipo: "narrativo",
          atende: false,
          detalhe: `Requisito narrativo não cumprido: "${texto}" não registrado na ficha`,
        };
      }

      return {
        texto,
        tipo: "narrativo",
        atende: true,
        detalhe: "Requisito Narrativo (validar com o Mestre)",
      };
    }

    // 7. Falha: habilidade ou pré-requisito não atendido
    return {
      texto,
      tipo: "habilidade",
      atende: false,
      detalhe: `Requer ${texto} (não possui)`,
    };
  });

  const falhas = itens.filter((i) => !i.atende).map((i) => `${i.texto} (${i.detalhe})`);

  return {
    atende: itens.every((i) => i.atende),
    itens,
    falhas,
  };
}

/** Lista canônica de fúrias mutuamente exclusivas */
export const FURIAS_EXCLUSIVAS = [
  "furia bestial",
  "furia de batalha",
  "furia orc",
];

/**
 * Retorna as fúrias atualmente ativas/mantidas por um ator.
 * Avalia efeitos ativos (ActiveEffects), itens ativados e flags de estado.
 * @param {object} actor Ator alvo
 * @returns {string[]} Lista de nomes normalizados das fúrias ativas
 */
export function getFuriasAtivas(actor) {
  if (!actor) return [];
  const ativas = new Set();

  // 1. Efeitos Ativos (ActiveEffects) não desativados
  const effects = actor.effects
    ? (Array.isArray(actor.effects) ? actor.effects : Array.from(actor.effects.values()))
    : [];
  for (const eff of effects) {
    if (!eff.disabled) {
      const label = norm(eff.name || eff.label || "");
      for (const f of FURIAS_EXCLUSIVAS) {
        if (label.includes(f) || f.includes(label)) ativas.add(f);
      }
    }
  }

  // 2. Itens marcados como ativos/ligados
  const items = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];
  for (const item of items) {
    const isAtivo = item.system?.ativo === true || item.flags?.["mighty-blade"]?.ativo === true;
    if (isAtivo) {
      const n = norm(item.name);
      for (const f of FURIAS_EXCLUSIVAS) {
        if (n.includes(f) || f.includes(n)) ativas.add(f);
      }
    }
  }

  // 3. Flags diretas de estado no Ator
  const flagFuria = actor.flags?.["mighty-blade"]?.furiaAtiva || actor.system?.furiaAtiva;
  if (flagFuria) {
    const normFlag = norm(flagFuria);
    for (const f of FURIAS_EXCLUSIVAS) {
      if (normFlag.includes(f) || f.includes(normFlag)) ativas.add(f);
    }
  }

  return Array.from(ativas);
}

/**
 * Valida a exclusividade mútua entre Fúrias canônicas (Fúria Bestial, Fúria de Batalha, Fúria Orc).
 * Caso o personagem tente ativar ou manter uma Fúria quando outra já estiver ativa, a operação é rejeitada.
 * @param {object} actor
 * @param {string} furiaAlvo Nome da fúria a ativar/manter
 * @returns {{ permitida: boolean, conflito: string|null, erro: string|null, furiasAtivas: string[] }}
 */
export function validarExclusividadeFurias(actor, furiaAlvo) {
  const ativas = getFuriasAtivas(actor);
  const nAlvo = norm(furiaAlvo);

  const ehFuriaExclusiva = FURIAS_EXCLUSIVAS.find((f) => nAlvo.includes(f) || f.includes(nAlvo));
  if (!ehFuriaExclusiva) {
    return { permitida: true, conflito: null, erro: null, furiasAtivas: ativas };
  }

  // Verifica se há alguma outra fúria exclusiva já ativa
  const conflito = ativas.find((f) => f !== ehFuriaExclusiva);
  if (conflito) {
    return {
      permitida: false,
      conflito,
      erro: `Exclusividade de Fúrias violada: "${furiaAlvo}" não pode ser ativada/mantida simultaneamente com "${conflito}".`,
      furiasAtivas: ativas,
    };
  }

  return { permitida: true, conflito: null, erro: null, furiasAtivas: ativas };
}

/**
 * Mapa complementar de pré-requisitos canônicos para habilidades cujos requisitos
 * compostos são validados diretamente pelo nome quando não informados no objeto.
 */
export const REQUISITOS_HABILIDADES_CANONICAS = {
  "forca interior": "Vontade 4 ou mais",
  "voador eximio": "Força 3",
  "aprendiz arcano": "Inteligência 5",
  "nervos de aco": "Nível 5",
  "vontade de ferro": "Nível 5",
  "mestre de armas 2": "Nível 5, Mestre de Armas 1",
  "mestre de armas 3": "Nível 10, Mestre de Armas 2",
  "mestre especialista": "Nível 10",
  "furia brutal": "Nível 10, Fúria Colérica",
  "chamas internas 1": "Fira",
  "chamas internas 2": "Fira, Chamas Internas 1",
  "sopro de fogo": "Fira, Chamas Internas 1, Vontade 5",
  "ataque furioso": "Nível 5", // GB Guia do Vilão p.72: apenas Nível 5, sem requisito de Força
  "imparavel": "Astério, Astéria, Juban, Vontade 5, Fortaleza", // GB p.67: Astério, Astéria e Juban
  "sopro draconico": "Dragano, Linhagem Dracônica",
  "furia de batalha": "Todas exceto Aesires",
  "furia orc": "Orc",
};

/**
 * Formata uma mensagem de erro clara e padronizada para falhas em avaliarRequisitos.
 * @param {string} nomeHabilidade
 * @param {{ atende: boolean, itens: Array<object>, falhas: string[] }} evalResult
 * @returns {string}
 */
export function formatarErroRequisitos(nomeHabilidade, evalResult) {
  if (!evalResult || evalResult.atende) return "";
  const labelAttr = {
    forca: "Força",
    agilidade: "Agilidade",
    inteligencia: "Inteligência",
    vontade: "Vontade",
  };
  const mensagens = evalResult.itens
    .filter((i) => !i.atende)
    .map((it) => {
      if (it.tipo === "atributo") {
        const nomeAttr = labelAttr[it.atributo] || it.texto;
        return `Requer ${nomeAttr} ${it.alvo} ou superior (atual: ${it.atual})`;
      }
      if (it.tipo === "nivel") {
        return `Requer Nível ${it.alvo} ou superior (atual: ${it.atual})`;
      }
      if (it.tipo === "raca") {
        return `Requer Raça ${it.texto}`;
      }
      if (it.tipo === "incompatibilidade") {
        return it.detalhe;
      }
      return `Requer a habilidade ${it.texto}`;
    });

  return `Pré-requisitos não atendidos para "${nomeHabilidade}": ${mensagens.join("; ")} — ${evalResult.falhas.join(", ")}`;
}

/**
 * Ativa uma habilidade de Fúria no ator respeitando a exclusividade mútua canônica
 * entre Fúria Bestial, Fúria de Batalha e Fúria Orc.
 * - Por padrão (`opcoes.substituir = false`), lança erro se outra fúria já estiver ativa.
 * - Com `opcoes.substituir = true`, desativa automaticamente a fúria anterior e ativa a nova.
 *
 * @param {object} actor
 * @param {string} furiaNome
 * @param {{ substituir?: boolean }} [opcoes={}]
 * @returns {{ ativada: string, desativadas: string[], furiasAtivas: string[] }}
 */
export function ativarFuria(actor, furiaNome, opcoes = {}) {
  if (!actor || !furiaNome) {
    throw new Error("Ator e nome da Fúria são obrigatórios.");
  }

  const check = validarExclusividadeFurias(actor, furiaNome);
  const desativadas = [];

  if (!check.permitida) {
    if (!opcoes.substituir) {
      throw new Error(check.erro);
    }
    // Modo substituição: desativa fúrias anteriores conflitantes
    for (const fAtiva of check.furiasAtivas) {
      desativarFuria(actor, fAtiva);
      desativadas.push(fAtiva);
    }
  }

  const nAlvo = norm(furiaNome);
  const effects = Array.isArray(actor.effects) ? actor.effects : [];
  let eff = effects.find((e) => norm(e.name || e.label || "") === nAlvo);
  if (eff) {
    eff.disabled = false;
  } else if (Array.isArray(actor.effects)) {
    actor.effects.push({ name: furiaNome, disabled: false });
  }

  const items = Array.isArray(actor.items) ? actor.items : [];
  const itemFuria = items.find((i) => norm(i.name) === nAlvo);
  if (itemFuria) {
    itemFuria.system = itemFuria.system || {};
    itemFuria.system.ativo = true;
  }

  return {
    ativada: furiaNome,
    desativadas,
    furiasAtivas: getFuriasAtivas(actor),
  };
}

/**
 * Desativa uma Fúria específica (ou todas se `furiaNome` for omitido) no ator.
 * @param {object} actor
 * @param {string} [furiaNome]
 * @returns {string[]} Fúrias que permaneceram ativas
 */
export function desativarFuria(actor, furiaNome = "") {
  if (!actor) return [];
  const nAlvo = norm(furiaNome);

  const effects = Array.isArray(actor.effects)
    ? actor.effects
    : (actor.effects ? Array.from(actor.effects.values()) : []);
  for (const eff of effects) {
    const label = norm(eff.name || eff.label || "");
    if (!nAlvo || label.includes(nAlvo) || nAlvo.includes(label)) {
      eff.disabled = true;
    }
  }

  const items = Array.isArray(actor.items)
    ? actor.items
    : (actor.items ? Array.from(actor.items.values()) : []);
  for (const item of items) {
    const n = norm(item.name);
    if (!nAlvo || n.includes(nAlvo) || nAlvo.includes(n)) {
      if (item.system?.ativo) item.system.ativo = false;
      if (item.flags?.["mighty-blade"]?.ativo) item.flags["mighty-blade"].ativo = false;
    }
  }

  if (actor.flags?.["mighty-blade"]?.furiaAtiva) {
    const fFlag = norm(actor.flags["mighty-blade"].furiaAtiva);
    if (!nAlvo || fFlag.includes(nAlvo) || nAlvo.includes(fFlag)) {
      delete actor.flags["mighty-blade"].furiaAtiva;
    }
  }

  return getFuriasAtivas(actor);
}

/**
 * Tabela canônica dos 8 Caminhos de Prestígio (Classes Avançadas) de Mighty Blade 3e.
 */
export const CAMINHOS_PRESTIGIO = {
  amoque: {
    nome: "Amoque",
    slug: "amoque",
    requisitos: "Força 6, Uma habilidade de Fúria qualquer.",
    atributos: { forca: 6 },
    habilidades: ["furia"],
    descricao: "Exige FOR 6 + qualquer habilidade de Fúria.",
  },
  argenteo: {
    nome: "Argênteo",
    slug: "argenteo",
    requisitos: "Inteligência 5, Teleporte 1.",
    atributos: { inteligencia: 5 },
    habilidades: ["Teleporte 1"],
    descricao: "Exige INT 5 + Teleporte 1.",
  },
  artifice: {
    nome: "Artífice",
    slug: "artifice",
    requisitos: "Inteligência 5, Conhecimento Arcano.",
    atributos: { inteligencia: 5 },
    habilidades: ["Conhecimento Arcano"],
    descricao: "Exige INT 5 + Conhecimento Arcano.",
  },
  assassino: {
    nome: "Assassino",
    slug: "assassino",
    requisitos: "Agilidade 4, Ataque Aleijador.",
    atributos: { agilidade: 4 },
    habilidades: ["Ataque Aleijador"],
    descricao: "Exige AGI 4 + Ataque Aleijador.",
  },
  sanguineo: {
    nome: "Sanguíneo",
    slug: "sanguineo",
    requisitos: "Vontade 5, Conhecimento Arcano, Ficar Por um Fio devido a Sangramento.",
    atributos: { vontade: 5 },
    habilidades: ["Conhecimento Arcano"],
    narrativo: "Ficar Por um Fio devido a Sangramento",
    descricao: "Exige VON 5 + Conhecimento Arcano + ter ficado Por um Fio devido a Sangramento.",
  },
  estrige: {
    nome: "Estrige",
    slug: "estrige",
    requisitos: "Inteligência 4, Matado algo sobrenatural.",
    atributos: { inteligencia: 4 },
    narrativo: "Matado algo sobrenatural",
    descricao: "Exige INT 4 + ter destruído 1 criatura sobrenatural.",
  },
  tohunga: {
    nome: "Tohunga",
    slug: "tohunga",
    requisitos: "Vontade 3, Artesão.",
    atributos: { vontade: 3 },
    habilidades: ["Artesão"],
    descricao: "Exige VON 3 + Artesão.",
  },
  lanceiro: {
    nome: "Lanceiro",
    slug: "lanceiro",
    requisitos: "Força 3, Sem Escapatória.",
    atributos: { forca: 3 },
    habilidades: ["Sem Escapatória"],
    descricao: "Exige FOR 3 + Sem Escapatória.",
  },
};

/**
 * Validação canônica estrita para ingresso em Caminhos de Prestígio (Classes Avançadas).
 * Avalia atributos, habilidades, antecedentes e marcos narrativos com rejeição estrita e diagnóstico detalhado.
 * @param {string|object} caminhoOuNome Item do Caminho, nome do Caminho ou texto de requisitos
 * @param {Actor} actor Ator alvo
 * @param {object} [options={}] Opções adicionais de validação
 * @returns {{ atende: boolean, caminho: string, itens: Array<object>, falhas: string[], erro: string|null }}
 */
export function validarCaminhoPrestigio(caminhoOuNome, actor, options = {}) {
  if (!caminhoOuNome || !actor) {
    return {
      atende: false,
      caminho: "",
      itens: [],
      falhas: ["Ator ou Caminho inválido."],
      erro: "Ator ou Caminho inválido.",
    };
  }

  let nomeCaminho = "";
  let requisitosTexto = "";

  if (typeof caminhoOuNome === "string") {
    nomeCaminho = caminhoOuNome.trim();
    const slug = norm(nomeCaminho);
    const def = CAMINHOS_PRESTIGIO[slug];
    if (def) {
      nomeCaminho = def.nome;
      requisitosTexto = def.requisitos;
    } else {
      requisitosTexto = caminhoOuNome;
    }
  } else if (typeof caminhoOuNome === "object") {
    nomeCaminho = caminhoOuNome.name || "";
    requisitosTexto = caminhoOuNome.system?.requisitos || "";
    if (!requisitosTexto && nomeCaminho) {
      const slug = norm(nomeCaminho);
      const def = CAMINHOS_PRESTIGIO[slug];
      if (def) requisitosTexto = def.requisitos;
    }
  }

  // Validação estrita por padrão para caminhos de prestígio
  const opts = {
    modoEstrito: true,
    ...options,
  };

  const resultado = avaliarRequisitos(requisitosTexto, actor, opts);

  const erro = resultado.atende
    ? null
    : `Pré-requisitos não atendidos para o Caminho "${nomeCaminho}":\n• ${resultado.falhas.join("\n• ")}`;

  return {
    ...resultado,
    caminho: nomeCaminho,
    erro,
  };
}

