/**
 * Módulo de Faixas Etárias, Envelhecimento e Efeitos Biológicos do Mighty Blade 3e.
 *
 * Consolida as regras canônicas do Guia Básico, Guia do Herói e Diários de Raça:
 * - 6 Faixas Etárias Canônicas: Filhote, Criança, Adolescente, Adulto, Idoso, Ancião.
 *
 * Efeitos por Faixa:
 * 1. Filhotes:
 *    - Todos os Atributos = 1.
 *    - 5 PV e 5 PM.
 *    - Sem benefícios raciais (sem bônus de atributos raciais e sem habilidade racial).
 *    - Tamanho Miúdo (modificador -2).
 *
 * 2. Crianças:
 *    - Atributos Iniciais -3 (mínimo 1).
 *    - 10 PV e 10 PM.
 *    - Sem benefícios raciais (sem atributos raciais e sem habilidade racial).
 *    - Tamanho Pequeno (modificador -1).
 *
 * 3. Adolescentes:
 *    - Atributos Iniciais -1 (mínimo 2).
 *    - Metade dos PVs/PMs de um adulto (30 PV e 30 PM).
 *    - Recebem Habilidade Racial (habilidade racial ativa).
 *    - Tamanho Médio (modificador 0).
 *
 * 4. Adultos:
 *    - Atributos Iniciais integrais.
 *    - 60 PV e 60 PM (padrão de adulto).
 *    - Benefícios raciais integrais.
 *    - Tamanho Médio (modificador 0).
 *
 * 5. Idosos:
 *    - Exige teste de FOR e AGI (Dificuldade 10).
 *    - Falha reduz -1 permanente (mínimo 2).
 *    - Concede +1 livre em Vontade ou Inteligência.
 *
 * 6. Anciãos:
 *    - Aplica -1 imediato em todos os Atributos ao entrar na faixa (mínimo 1).
 *    - Testes anuais com Dificuldade 12.
 *
 * 7. Exceção Elfos e Levents (Raças Longevas):
 *    - Não perdem Atributos por idade.
 *    - Ao atingirem Idoso ganham +1 Vontade ou Inteligência.
 *    - Testes a cada ciclo de anos (Elfos: 50 anos, Levents: 25 anos).
 *    - Ao acumularem 10 falhas entram em falência orgânica e morrem placidamente
 *      em dias iguais à sua Vontade.
 */

// ============================================================================
// CONSTANTES CANÔNICAS
// ============================================================================

export const FAIXA_FILHOTE = "filhote";
export const FAIXA_CRIANCA = "crianca";
export const FAIXA_ADOLESCENTE = "adolescente";
export const FAIXA_ADULTO = "adulto";
export const FAIXA_IDOSO = "idoso";
export const FAIXA_ANCIAO = "anciao";

export const FAIXAS_ETARIAS = [
  FAIXA_FILHOTE,
  FAIXA_CRIANCA,
  FAIXA_ADOLESCENTE,
  FAIXA_ADULTO,
  FAIXA_IDOSO,
  FAIXA_ANCIAO,
];

export const FAIXAS_ETARIAS_LABELS = {
  [FAIXA_FILHOTE]: "Filhote",
  [FAIXA_CRIANCA]: "Criança",
  [FAIXA_ADOLESCENTE]: "Adolescente",
  [FAIXA_ADULTO]: "Adulto",
  [FAIXA_IDOSO]: "Idoso",
  [FAIXA_ANCIAO]: "Ancião",
};

export const TAMANHOS_FAIXA = {
  [FAIXA_FILHOTE]: { tamanho: "miudo", modificador: -2, rotulo: "Miúdo" },
  [FAIXA_CRIANCA]: { tamanho: "pequeno", modificador: -1, rotulo: "Pequeno" },
  [FAIXA_ADOLESCENTE]: { tamanho: "medio", modificador: 0, rotulo: "Médio" },
  [FAIXA_ADULTO]: { tamanho: "medio", modificador: 0, rotulo: "Médio" },
  [FAIXA_IDOSO]: { tamanho: "medio", modificador: 0, rotulo: "Médio" },
  [FAIXA_ANCIAO]: { tamanho: "medio", modificador: 0, rotulo: "Médio" },
};

export const DIFICULDADE_TESTE_IDOSO = 10;
export const DIFICULDADE_TESTE_ANCIAO = 12;
export const LIMITE_FALHAS_LONGEVOS = 10;

export const RACAS_LONGEVAS = ["elfo", "levent"];

export const CICLOS_ANOS_LONGEVAS = {
  elfo: 50,
  levent: 25,
};

// ============================================================================
// HELPERS DE NORMALIZAÇÃO E INSPEÇÃO
// ============================================================================

/**
 * Normaliza qualquer string (sem acentos, minúsculo, sem espaços extras).
 * @param {string} str
 * @returns {string}
 */
export function normalizarString(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normaliza o identificador da faixa etária.
 * @param {string} faixa
 * @returns {"filhote"|"crianca"|"adolescente"|"adulto"|"idoso"|"anciao"}
 */
export function normalizarFaixaEtaria(faixa) {
  const norm = normalizarString(faixa);
  if (norm.includes("filhot")) return FAIXA_FILHOTE;
  if (norm.includes("crianc")) return FAIXA_CRIANCA;
  if (norm.includes("adolesc")) return FAIXA_ADOLESCENTE;
  if (norm.includes("adult")) return FAIXA_ADULTO;
  if (norm.includes("idos")) return FAIXA_IDOSO;
  if (norm.includes("ancia")) return FAIXA_ANCIAO;
  return norm || FAIXA_ADULTO;
}

/**
 * Obtém a raça normalizada do ator.
 * @param {object} actor
 * @returns {string}
 */
export function obterRacaAtor(actor) {
  if (!actor) return "";
  if (typeof actor === "string") return normalizarString(actor);

  const racaDetalhe = actor.system?.details?.raca;
  if (racaDetalhe) return normalizarString(racaDetalhe);

  const rawItems = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values?.() || []))
    : [];
  const racaDoc = rawItems.find((i) => i.type === "raca");
  return normalizarString(racaDoc?.name || "");
}

/**
 * Verifica se a raça ou ator pertence às raças longevas canônicas (Elfo ou Levent).
 * @param {object|string} actorOuRaca
 * @returns {boolean}
 */
export function isRacaLongeva(actorOuRaca) {
  const racaNorm = typeof actorOuRaca === "string"
    ? normalizarString(actorOuRaca)
    : obterRacaAtor(actorOuRaca);
  return RACAS_LONGEVAS.some((r) => racaNorm.includes(r));
}

/**
 * Obtém os anos do ciclo de envelhecimento para raças longevas.
 * @param {object|string} actorOuRaca
 * @returns {number|null}
 */
export function obterCicloAnos(actorOuRaca) {
  const racaNorm = typeof actorOuRaca === "string"
    ? normalizarString(actorOuRaca)
    : obterRacaAtor(actorOuRaca);
  if (racaNorm.includes("elfo")) return CICLOS_ANOS_LONGEVAS.elfo;
  if (racaNorm.includes("levent")) return CICLOS_ANOS_LONGEVAS.levent;
  return null;
}

/**
 * Normaliza o atributo de escolha mental (Vontade ou Inteligência).
 * @param {string} escolha
 * @returns {"vontade"|"inteligencia"}
 */
export function normalizarEscolhaMental(escolha) {
  const norm = normalizarString(escolha);
  if (norm.includes("int")) return "inteligencia";
  return "vontade";
}

/**
 * Obtém ou inicializa os Atributos Iniciais canônicos do personagem.
 * @param {object} actor
 * @param {object} opcoes
 * @returns {{ forca: number, agilidade: number, inteligencia: number, vontade: number }}
 */
export function obterAtributosIniciais(actor, opcoes = {}) {
  if (opcoes.atributosIniciais) {
    return {
      forca: Number(opcoes.atributosIniciais.forca) || 0,
      agilidade: Number(opcoes.atributosIniciais.agilidade) || 0,
      inteligencia: Number(opcoes.atributosIniciais.inteligencia) || 0,
      vontade: Number(opcoes.atributosIniciais.vontade) || 0,
    };
  }

  const flagAttrs = actor?.getFlag?.("mighty-blade", "atributosIniciais") ||
                    actor?.flags?.["mighty-blade"]?.atributosIniciais ||
                    actor?.system?.details?.atributosIniciais;
  if (flagAttrs) {
    return {
      forca: Number(flagAttrs.forca) || 0,
      agilidade: Number(flagAttrs.agilidade) || 0,
      inteligencia: Number(flagAttrs.inteligencia) || 0,
      vontade: Number(flagAttrs.vontade) || 0,
    };
  }

  const attrs = {
    forca: Number(actor?.system?.attributes?.forca?.base ?? actor?.system?.attributes?.forca?.value ?? 0),
    agilidade: Number(actor?.system?.attributes?.agilidade?.base ?? actor?.system?.attributes?.agilidade?.value ?? 0),
    inteligencia: Number(actor?.system?.attributes?.inteligencia?.base ?? actor?.system?.attributes?.inteligencia?.value ?? 0),
    vontade: Number(actor?.system?.attributes?.vontade?.base ?? actor?.system?.attributes?.vontade?.value ?? 0),
  };

  if (typeof actor?.setFlag === "function") {
    actor.setFlag("mighty-blade", "atributosIniciais", attrs);
  } else if (actor?.system?.details) {
    actor.system.details.atributosIniciais = attrs;
  }

  return attrs;
}

/**
 * Obtém a faixa etária atual registrada no ator.
 * @param {object} actor
 * @returns {"filhote"|"crianca"|"adolescente"|"adulto"|"idoso"|"anciao"}
 */
export function obterFaixaEtaria(actor) {
  if (!actor) return FAIXA_ADULTO;
  const salva = actor.system?.details?.faixaEtaria ||
                actor.getFlag?.("mighty-blade", "faixaEtaria") ||
                actor.flags?.["mighty-blade"]?.faixaEtaria;
  return salva ? normalizarFaixaEtaria(salva) : FAIXA_ADULTO;
}

/**
 * Obtém o tamanho e modificador associados a uma faixa etária.
 * @param {string} faixa
 * @returns {{ tamanho: string, modificador: number, rotulo: string }}
 */
export function obterTamanhoFaixa(faixa) {
  const norm = normalizarFaixaEtaria(faixa);
  return TAMANHOS_FAIXA[norm] || TAMANHOS_FAIXA[FAIXA_ADULTO];
}

// ============================================================================
// MOTOR PRINCIPAL: APLICAR FAIXA ETÁRIA
// ============================================================================

/**
 * Aplica os efeitos biológicos e mecânicos de uma faixa etária ao Ator.
 *
 * @param {object} actor - Instância do Ator (MightyBladeActor ou MockActor).
 * @param {string} faixaEtaria - Faixa ("filhote", "crianca", "adolescente", "adulto", "idoso", "anciao").
 * @param {object} [opcoes={}] - Opções customizadas de aplicação:
 *    - `atributosIniciais`: { forca, agilidade, inteligencia, vontade }
 *    - `aumentoMental`: "vontade" | "inteligencia" (para Idoso / Longevos)
 *    - `testeForca`: number | boolean (resultado ou rolagem do teste de FOR no Idoso)
 *    - `testeAgilidade`: number | boolean (resultado ou rolagem do teste de AGI no Idoso)
 *    - `testeAnual`: number | boolean (rolagem do teste anual de Ancião, DV 12)
 *    - `testeCiclo`: number | boolean (rolagem do teste de ciclo de Longevos, DV 10)
 *    - `falhasCiclo` | `falhasAcumuladas`: number (número de falhas de ciclos de envelhecimento acumuladas)
 *    - `raca`: string (override da raça)
 * @returns {object} Resumo com os dados aplicados
 */
export function aplicarFaixaEtaria(actor, faixaEtaria, opcoes = {}) {
  const faixa = normalizarFaixaEtaria(faixaEtaria);
  const rotulo = FAIXAS_ETARIAS_LABELS[faixa];
  const tamanhoInfo = TAMANHOS_FAIXA[faixa];

  const raca = opcoes.raca || obterRacaAtor(actor);
  const longevo = isRacaLongeva(raca);

  const attrsIniciais = obterAtributosIniciais(actor, opcoes);
  const attrsAtuais = {
    forca: Number(actor?.system?.attributes?.forca?.value ?? actor?.system?.attributes?.forca?.base ?? attrsIniciais.forca),
    agilidade: Number(actor?.system?.attributes?.agilidade?.value ?? actor?.system?.attributes?.agilidade?.base ?? attrsIniciais.agilidade),
    inteligencia: Number(actor?.system?.attributes?.inteligencia?.value ?? actor?.system?.attributes?.inteligencia?.base ?? attrsIniciais.inteligencia),
    vontade: Number(actor?.system?.attributes?.vontade?.value ?? actor?.system?.attributes?.vontade?.base ?? attrsIniciais.vontade),
  };

  let novosAtributos = { ...attrsIniciais };
  let pv = 60;
  let pm = 60;
  let beneficiosRaciais = true;
  let habilidadeRacial = true;
  let aumentoMentalAplicado = null;
  let falenciaOrganica = false;
  let diasDeVidaRestantes = null;
  let cicloAnos = null;
  let falhasAcumuladas = 0;

  const testes = {
    forca: null,
    agilidade: null,
    anual: null,
    ciclo: null,
  };

  switch (faixa) {
    case FAIXA_FILHOTE: {
      // Filhotes: Todos Atributos = 1; 5 PV e 5 PM; sem benefícios raciais; Tamanho Miúdo (-2).
      novosAtributos = {
        forca: 1,
        agilidade: 1,
        inteligencia: 1,
        vontade: 1,
      };
      pv = 5;
      pm = 5;
      beneficiosRaciais = false;
      habilidadeRacial = false;
      break;
    }

    case FAIXA_CRIANCA: {
      // Crianças: Atributos Iniciais -3 (mínimo 1); 10 PV e 10 PM; sem benefícios raciais; Tamanho Pequeno (-1).
      novosAtributos = {
        forca: Math.max(1, attrsIniciais.forca - 3),
        agilidade: Math.max(1, attrsIniciais.agilidade - 3),
        inteligencia: Math.max(1, attrsIniciais.inteligencia - 3),
        vontade: Math.max(1, attrsIniciais.vontade - 3),
      };
      pv = 10;
      pm = 10;
      beneficiosRaciais = false;
      habilidadeRacial = false;
      break;
    }

    case FAIXA_ADOLESCENTE: {
      // Adolescentes: Atributos Iniciais -1 (mínimo 2); metade dos PVs/PMs de um adulto (30/30); recebem Habilidade Racial.
      novosAtributos = {
        forca: Math.max(2, attrsIniciais.forca - 1),
        agilidade: Math.max(2, attrsIniciais.agilidade - 1),
        inteligencia: Math.max(2, attrsIniciais.inteligencia - 1),
        vontade: Math.max(2, attrsIniciais.vontade - 1),
      };
      pv = 30;
      pm = 30;
      beneficiosRaciais = true;
      habilidadeRacial = true;
      break;
    }

    case FAIXA_ADULTO: {
      // Adultos: Atributos Iniciais integrais; 60 PV e 60 PM; benefícios raciais integrais; Tamanho Médio (0).
      novosAtributos = { ...attrsIniciais };
      pv = 60;
      pm = 60;
      beneficiosRaciais = true;
      habilidadeRacial = true;
      break;
    }

    case FAIXA_IDOSO: {
      pv = 60;
      pm = 60;
      beneficiosRaciais = true;
      habilidadeRacial = true;

      // Escolha livre de aumento mental (+1 em Vontade ou Inteligência)
      aumentoMentalAplicado = normalizarEscolhaMental(
        opcoes.aumentoMental || opcoes.atributoMentalBonus || "vontade"
      );

      if (longevo) {
        // Exceção Elfos e Levents: Não perdem Atributos por idade.
        // Ao atingirem Idoso ganham +1 Vontade ou Inteligência.
        novosAtributos = { ...attrsIniciais };
        novosAtributos[aumentoMentalAplicado] += 1;

        cicloAnos = obterCicloAnos(raca);
        falhasAcumuladas = Number(opcoes.falhasCiclo ?? opcoes.falhasAcumuladas ?? actor?.system?.details?.falhasEnvelhecimento ?? 0);
        if (opcoes.falhasAdicionais) {
          falhasAcumuladas += Number(opcoes.falhasAdicionais);
        }

        if (opcoes.testeCiclo !== undefined) {
          const resultado = opcoes.testeCiclo;
          const sucesso = typeof resultado === "boolean" ? resultado : resultado >= DIFICULDADE_TESTE_IDOSO;
          testes.ciclo = { resultado, sucesso };
          if (!sucesso) {
            falhasAcumuladas += 1;
          }
        }

        if (falhasAcumuladas >= LIMITE_FALHAS_LONGEVOS) {
          falenciaOrganica = true;
          diasDeVidaRestantes = novosAtributos.vontade;
        }
      } else {
        // Regra Padrão (Humanos, Anões, etc.):
        // Exige teste de FOR e AGI (Dificuldade 10). Falha reduz -1 permanente (mínimo 2).
        let forcaFinal = attrsIniciais.forca;
        let agilidadeFinal = attrsIniciais.agilidade;

        // Teste de Força
        if (opcoes.testeForca !== undefined || opcoes.rolagens?.forca !== undefined || Array.isArray(opcoes.falhas)) {
          let sucessoForca = true;
          if (opcoes.testeForca !== undefined) {
            sucessoForca = typeof opcoes.testeForca === "boolean" ? opcoes.testeForca : opcoes.testeForca >= DIFICULDADE_TESTE_IDOSO;
          } else if (opcoes.rolagens?.forca !== undefined) {
            sucessoForca = opcoes.rolagens.forca >= DIFICULDADE_TESTE_IDOSO;
          } else if (Array.isArray(opcoes.falhas)) {
            sucessoForca = !opcoes.falhas.some((f) => normalizarString(f).includes("for"));
          }

          testes.forca = {
            resultado: opcoes.testeForca ?? opcoes.rolagens?.forca,
            sucesso: sucessoForca,
            perda: sucessoForca ? 0 : 1,
          };

          if (!sucessoForca) {
            forcaFinal = Math.max(2, attrsIniciais.forca - 1);
          }
        }

        // Teste de Agilidade
        if (opcoes.testeAgilidade !== undefined || opcoes.rolagens?.agilidade !== undefined || Array.isArray(opcoes.falhas)) {
          let sucessoAgilidade = true;
          if (opcoes.testeAgilidade !== undefined) {
            sucessoAgilidade = typeof opcoes.testeAgilidade === "boolean" ? opcoes.testeAgilidade : opcoes.testeAgilidade >= DIFICULDADE_TESTE_IDOSO;
          } else if (opcoes.rolagens?.agilidade !== undefined) {
            sucessoAgilidade = opcoes.rolagens.agilidade >= DIFICULDADE_TESTE_IDOSO;
          } else if (Array.isArray(opcoes.falhas)) {
            sucessoAgilidade = !opcoes.falhas.some((f) => normalizarString(f).includes("agi"));
          }

          testes.agilidade = {
            resultado: opcoes.testeAgilidade ?? opcoes.rolagens?.agilidade,
            sucesso: sucessoAgilidade,
            perda: sucessoAgilidade ? 0 : 1,
          };

          if (!sucessoAgilidade) {
            agilidadeFinal = Math.max(2, attrsIniciais.agilidade - 1);
          }
        }

        novosAtributos = {
          forca: forcaFinal,
          agilidade: agilidadeFinal,
          inteligencia: attrsIniciais.inteligencia + (aumentoMentalAplicado === "inteligencia" ? 1 : 0),
          vontade: attrsIniciais.vontade + (aumentoMentalAplicado === "vontade" ? 1 : 0),
        };
      }
      break;
    }

    case FAIXA_ANCIAO: {
      pv = 60;
      pm = 60;
      beneficiosRaciais = true;
      habilidadeRacial = true;

      if (longevo) {
        // Elfos e Levents não entram na categoria Ancião e não sofrem perdas por idade
        novosAtributos = { ...attrsAtuais };
      } else {
        // Anciãos: Aplica -1 imediato em todos os Atributos ao entrar na faixa; testes anuais com Dificuldade 12.
        // Base de cálculo para entrada: atributos que o personagem possuía antes de virar ancião
        const baseCalculo = opcoes.atributosBase || attrsAtuais;
        novosAtributos = {
          forca: Math.max(1, baseCalculo.forca - 1),
          agilidade: Math.max(1, baseCalculo.agilidade - 1),
          inteligencia: Math.max(1, baseCalculo.inteligencia - 1),
          vontade: Math.max(1, baseCalculo.vontade - 1),
        };

        // Processa teste anual caso fornecido nas opções
        if (opcoes.testeAnual !== undefined || opcoes.rolagens?.anual !== undefined) {
          const res = opcoes.testeAnual ?? opcoes.rolagens?.anual;
          const sucessoAnual = typeof res === "boolean" ? res : res >= DIFICULDADE_TESTE_ANCIAO;
          testes.anual = { resultado: res, sucesso: sucessoAnual };

          if (!sucessoAnual) {
            const attrPerda = normalizarString(opcoes.atributoPerdaAnual || "forca");
            if (novosAtributos[attrPerda] !== undefined) {
              novosAtributos[attrPerda] = Math.max(1, novosAtributos[attrPerda] - 1);
            }
          }
        }
      }
      break;
    }
  }

  // ==========================================================================
  // ATUALIZAÇÃO NO MODELO DO ATOR
  // ==========================================================================

  if (actor && actor.system) {
    if (!actor.system.details) actor.system.details = {};
    actor.system.details.faixaEtaria = faixa;
    actor.system.details.faixaEtariaRotulo = rotulo;
    actor.system.details.tamanho = tamanhoInfo.tamanho;
    actor.system.details.modificadorTamanho = tamanhoInfo.modificador;
    actor.system.details.beneficiosRaciais = beneficiosRaciais;
    actor.system.details.habilidadeRacial = habilidadeRacial;

    // Atualiza atributos
    if (!actor.system.attributes) actor.system.attributes = {};
    for (const [attr, val] of Object.entries(novosAtributos)) {
      if (!actor.system.attributes[attr]) {
        actor.system.attributes[attr] = { base: val, value: val };
      } else {
        actor.system.attributes[attr].base = val;
        actor.system.attributes[attr].value = val;
      }
    }

    // Atualiza recursos (PV e PM)
    if (!actor.system.resources) actor.system.resources = {};
    if (!actor.system.resources.vida) actor.system.resources.vida = { value: pv, max: pv };
    actor.system.resources.vida.baseMax = pv;
    actor.system.resources.vida.max = pv;
    actor.system.resources.vida.value = Math.min(Number(actor.system.resources.vida.value) || pv, pv);

    if (!actor.system.resources.mana) actor.system.resources.mana = { value: pm, max: pm };
    actor.system.resources.mana.baseMax = pm;
    actor.system.resources.mana.max = pm;
    actor.system.resources.mana.value = Math.min(Number(actor.system.resources.mana.value) || pm, pm);

    // Gestão de Falência Orgânica em Longevos
    if (falenciaOrganica) {
      actor.system.details.falenciaOrganica = true;
      actor.system.details.diasDeVidaRestantes = diasDeVidaRestantes;
      actor.system.details.falhasEnvelhecimento = falhasAcumuladas;
      actor.system.details.estadoBiologico = "falencia_organica";
    }

    // Grava flags Foundry
    if (typeof actor.setFlag === "function") {
      actor.setFlag("mighty-blade", "faixaEtaria", faixa);
      actor.setFlag("mighty-blade", "tamanho", tamanhoInfo.tamanho);
      actor.setFlag("mighty-blade", "modificadorTamanho", tamanhoInfo.modificador);
      actor.setFlag("mighty-blade", "beneficiosRaciais", beneficiosRaciais);
      actor.setFlag("mighty-blade", "habilidadeRacial", habilidadeRacial);
      actor.setFlag("mighty-blade", "atributosIniciais", attrsIniciais);
      if (falenciaOrganica) {
        actor.setFlag("mighty-blade", "falenciaOrganica", true);
        actor.setFlag("mighty-blade", "diasDeVidaRestantes", diasDeVidaRestantes);
        actor.setFlag("mighty-blade", "falhasEnvelhecimento", falhasAcumuladas);
      }
    }

    // Dispara recálculo de derivados se disponível
    if (typeof actor.prepareDerivedData === "function") {
      actor.prepareDerivedData();
    }
  }

  return {
    sucesso: true,
    faixaEtaria: faixa,
    faixaEtariaRotulo: rotulo,
    rotulo,
    tamanho: tamanhoInfo.tamanho,
    modificadorTamanho: tamanhoInfo.modificador,
    tamanhoInfo,
    atributos: novosAtributos,
    atributosIniciais: attrsIniciais,
    atributosAnteriores: attrsAtuais,
    recursos: { pv, pm },
    pv,
    pm,
    beneficiosRaciais,
    habilidadeRacial,
    aumentoMental: aumentoMentalAplicado,
    aumentoMentalAplicado,
    testes,
    isLongevo: longevo,
    raca,
    cicloAnos,
    falhasAcumuladas,
    falenciaOrganica,
    diasDeVidaRestantes,
    actor,
  };
}

// ============================================================================
// HELPERS COMPLEMENTARES: TESTES ESPECÍFICOS E CICLOS
// ============================================================================

/**
 * Executa o teste de envelhecimento de Idoso (FOR e AGI, Dificuldade 10).
 * Falha reduz -1 permanente (mínimo 2).
 * Longevos são imunes à perda de atributos por idade.
 *
 * @param {object} actor
 * @param {object} [opcoes={}]
 * @returns {object}
 */
export function testarEnvelhecimentoIdoso(actor, opcoes = {}) {
  const raca = opcoes.raca || obterRacaAtor(actor);
  if (isRacaLongeva(raca)) {
    return {
      imune: true,
      razao: "Elfos e Levents não perdem atributos por idade.",
      atributos: {
        forca: Number(actor?.system?.attributes?.forca?.value ?? 0),
        agilidade: Number(actor?.system?.attributes?.agilidade?.value ?? 0),
      },
    };
  }

  const forcaAtual = Number(actor?.system?.attributes?.forca?.value ?? 2);
  const agilidadeAtual = Number(actor?.system?.attributes?.agilidade?.value ?? 2);

  const testeForca = opcoes.testeForca ?? opcoes.rolagens?.forca;
  const testeAgilidade = opcoes.testeAgilidade ?? opcoes.rolagens?.agilidade;

  const sucessoForca = typeof testeForca === "boolean" ? testeForca : Number(testeForca) >= DIFICULDADE_TESTE_IDOSO;
  const sucessoAgilidade = typeof testeAgilidade === "boolean" ? testeAgilidade : Number(testeAgilidade) >= DIFICULDADE_TESTE_IDOSO;

  const novaForca = sucessoForca ? forcaAtual : Math.max(2, forcaAtual - 1);
  const novaAgilidade = sucessoAgilidade ? agilidadeAtual : Math.max(2, agilidadeAtual - 1);

  if (actor?.system?.attributes) {
    if (actor.system.attributes.forca) {
      actor.system.attributes.forca.value = novaForca;
      actor.system.attributes.forca.base = novaForca;
    }
    if (actor.system.attributes.agilidade) {
      actor.system.attributes.agilidade.value = novaAgilidade;
      actor.system.attributes.agilidade.base = novaAgilidade;
    }
    if (typeof actor.prepareDerivedData === "function") {
      actor.prepareDerivedData();
    }
  }

  return {
    dificuldade: DIFICULDADE_TESTE_IDOSO,
    forca: { sucesso: sucessoForca, anterior: forcaAtual, valor: novaForca, perda: sucessoForca ? 0 : 1 },
    agilidade: { sucesso: sucessoAgilidade, anterior: agilidadeAtual, valor: novaAgilidade, perda: sucessoAgilidade ? 0 : 1 },
    atributos: { forca: novaForca, agilidade: novaAgilidade },
  };
}

/**
 * Executa o teste anual de envelhecimento de Ancião (Dificuldade 12).
 *
 * @param {object} actor
 * @param {object} [opcoes={}]
 * @returns {object}
 */
export function testarEnvelhecimentoAnual(actor, opcoes = {}) {
  const raca = opcoes.raca || obterRacaAtor(actor);
  if (isRacaLongeva(raca)) {
    return {
      imune: true,
      razao: "Elfos e Levents não entram na categoria Ancião.",
    };
  }

  const rolagem = opcoes.rolagem ?? opcoes.testeAnual ?? 0;
  const sucesso = typeof rolagem === "boolean" ? rolagem : Number(rolagem) >= DIFICULDADE_TESTE_ANCIAO;
  const atributoAfetado = normalizarString(opcoes.atributo || opcoes.atributoPerda || "forca");

  let valorAnterior = Number(actor?.system?.attributes?.[atributoAfetado]?.value ?? 1);
  let novoValor = valorAnterior;

  if (!sucesso) {
    novoValor = Math.max(1, valorAnterior - 1);
    if (actor?.system?.attributes?.[atributoAfetado]) {
      actor.system.attributes[atributoAfetado].value = novoValor;
      actor.system.attributes[atributoAfetado].base = novoValor;
      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      }
    }
  }

  return {
    dificuldade: DIFICULDADE_TESTE_ANCIAO,
    sucesso,
    rolagem,
    atributoAfetado,
    valorAnterior,
    novoValor,
    penalidadeAplicada: sucesso ? 0 : 1,
  };
}

/**
 * Processa a passagem de um ciclo de envelhecimento para raças longevas (Elfos e Levents).
 * Ao acumularem 10 falhas entram em falência orgânica e morrem placidamente em dias iguais à sua Vontade.
 *
 * @param {object} actor
 * @param {object} [opcoes={}]
 * @returns {object}
 */
export function processarCicloLongevo(actor, opcoes = {}) {
  const raca = opcoes.raca || obterRacaAtor(actor);
  if (!isRacaLongeva(raca)) {
    return {
      aplicavel: false,
      razao: "Apenas Elfos e Levents realizam testes de ciclos de longevidade.",
    };
  }

  const cicloAnos = obterCicloAnos(raca);
  let falhasAtuais = Number(
    actor?.system?.details?.falhasEnvelhecimento ??
    actor?.getFlag?.("mighty-blade", "falhasEnvelhecimento") ??
    opcoes.falhasAcumuladas ??
    0
  );

  if (opcoes.falhasAdicionais) {
    falhasAtuais += Number(opcoes.falhasAdicionais);
  }

  let sucessoTeste = true;
  if (opcoes.teste !== undefined || opcoes.sucesso !== undefined || opcoes.falha !== undefined) {
    if (opcoes.sucesso !== undefined) sucessoTeste = Boolean(opcoes.sucesso);
    else if (opcoes.falha !== undefined) sucessoTeste = !opcoes.falha;
    else sucessoTeste = Number(opcoes.teste) >= DIFICULDADE_TESTE_IDOSO;

    if (!sucessoTeste) {
      falhasAtuais += 1;
    }
  }

  const falenciaOrganica = falhasAtuais >= LIMITE_FALHAS_LONGEVOS;
  const vontadeAtor = Number(actor?.system?.attributes?.vontade?.value ?? actor?.system?.attributes?.vontade?.base ?? 2);
  const diasDeVidaRestantes = falenciaOrganica ? vontadeAtor : null;

  if (actor?.system?.details) {
    actor.system.details.falhasEnvelhecimento = falhasAtuais;
    actor.system.details.falenciaOrganica = falenciaOrganica;
    actor.system.details.diasDeVidaRestantes = diasDeVidaRestantes;
    if (falenciaOrganica) {
      actor.system.details.estadoBiologico = "falencia_organica";
    }
  }

  if (typeof actor?.setFlag === "function") {
    actor.setFlag("mighty-blade", "falhasEnvelhecimento", falhasAtuais);
    actor.setFlag("mighty-blade", "falenciaOrganica", falenciaOrganica);
    if (falenciaOrganica) {
      actor.setFlag("mighty-blade", "diasDeVidaRestantes", diasDeVidaRestantes);
    }
  }

  return {
    raca,
    cicloAnos,
    sucessoTeste,
    falhasAcumuladas: falhasAtuais,
    falhasRestantes: Math.max(0, LIMITE_FALHAS_LONGEVOS - falhasAtuais),
    falenciaOrganica,
    diasDeVidaRestantes,
  };
}
