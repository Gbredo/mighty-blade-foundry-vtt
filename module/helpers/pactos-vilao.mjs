/**
 * Módulo de Pactos, Maldições e Efeitos Colaterais (Guia do Vilão) do Mighty Blade 3e.
 *
 * Consolida as regras oficiais do Guia do Vilão (pág. 49, 86-91) para o Caminho Cultista e Pactos Sombrios:
 * - Pacto da Loucura: +2 Determinação, Imunidade a Medo e Efeitos Mentais, -1 fixo em Inteligência.
 * - Pacto da Escuridão: Visão normal sem olhos e na escuridão, mas Inaptidão em todos os testes sob luz solar direta.
 * - Pacto da Pestilência: Falha automática em testes contra infecção, mas imunidade total aos sintomas (continua como vetor transmissor).
 * - Pacto da Tirania: Inimigos devem realizar teste de Vontade contra a Determinação do Cultista para atacá-lo.
 * - Habilidade Virulência (Cultista): Criaturas vivas ao redor realizam testes de resistência contra doenças e venenos como Inaptas.
 */

import { temCondicao, adicionarCondicao, removerCondicao } from "./danos-condicoes.mjs";
import { calcularDeterminacao } from "./estatisticas-derivadas.mjs";

export const PACTOS_CANONICOS = [
  "pacto da loucura",
  "pacto da escuridao",
  "pacto da pestilencia",
  "pacto da tirania",
  "pacto da ambicao",
  "pacto da destruicao",
];

/**
 * Normaliza o nome do pacto para busca e comparações canônicas.
 * @param {string} nome
 * @returns {string}
 */
export function normalizarPacto(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Aplica os efeitos canônicos de um Pacto Infernal/Primordial ao Ator.
 *
 * @param {string} pactoNome Nome do Pacto (ex: "Pacto da Loucura", "Pacto da Escuridão", etc.)
 * @param {object} actor Instância ou objeto do Ator
 * @param {object} [opcoes={}] Opções contextuais (ex: { luzSolar: boolean })
 * @returns {object} Resumo dos efeitos aplicados
 */
export function aplicarEfeitosPacto(pactoNome, actor, opcoes = {}) {
  if (!actor || !actor.system) {
    throw new Error("Ator inválido para aplicação de pacto.");
  }

  const pNorm = normalizarPacto(pactoNome);
  actor.system.pactos = actor.system.pactos || {};
  actor.system.detalhesPacto = actor.system.detalhesPacto || {};

  // Garante que o item da habilidade exista no inventário do ator
  const itens = actor.items ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values())) : [];
  const jaTemItem = itens.some((i) => normalizarPacto(i.name) === pNorm);

  const garantirItem = (nomeExibicao, efeitos = []) => {
    if (!jaTemItem) {
      const novoItem = {
        id: `pacto-${pNorm.replace(/\s+/g, "-")}`,
        name: nomeExibicao,
        type: "habilidade",
        system: {
          tipo: "Suporte",
          categoria: "Característica",
          requisito: "Pacto",
          efeitos,
        },
      };
      if (typeof actor.addItem === "function") {
        actor.addItem(novoItem);
      } else if (Array.isArray(actor.items)) {
        actor.items.push(novoItem);
      }
    }
  };

  switch (pNorm) {
    case "pacto da loucura": {
      // 1. +2 Determinação (reconhecido canonicamente por nome no actor-character.mjs e estatisticas-derivadas.mjs)
      garantirItem("Pacto da Loucura");

      // 2. Redução fixa de 1 em Inteligência (sem perder idiomas)
      const intBase = Number(actor.system.attributes?.inteligencia?.base ?? actor.system.attributes?.inteligencia?.value ?? 0);
      const novaInt = Math.max(1, intBase - 1);
      if (actor.system.attributes?.inteligencia) {
        actor.system.attributes.inteligencia.base = novaInt;
        actor.system.attributes.inteligencia.value = novaInt;
      }

      // Preserva explicitamente idiomas conhecidos
      actor.system.details = actor.system.details || {};
      const idiomasAtuais = actor.system.details.idiomas || "";
      actor.system.detalhesPacto.idiomasPreservados = idiomasAtuais;

      // 3. Imunidade a Medo e Efeitos Mentais
      actor.system.imunidadesMentais = new Set(actor.system.imunidadesMentais || []);
      actor.system.imunidadesMentais.add("medo");
      actor.system.imunidadesMentais.add("amedrontado");
      actor.system.imunidadesMentais.add("mental");
      actor.system.imunidadesMentais.add("efeitos mentais");

      // Se o ator já possuía a condição 'amedrontado', remove-a
      if (temCondicao(actor, "amedrontado")) {
        removerCondicao(actor, "amedrontado");
      }

      // 4. Se a Inteligência cair para 1: instintos básicos (sem leitura complexa, sem magia/música)
      const instintosBasicos = novaInt <= 1;
      actor.system.detalhesPacto.instintosBasicos = instintosBasicos;
      actor.system.detalhesPacto.bloquearMagiaEMusica = instintosBasicos;
      actor.system.detalhesPacto.concentracaoRestrita = instintosBasicos;

      actor.system.pactos.loucura = true;

      // Recalcula dados derivados se o ator suportar
      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      } else {
        // Fallback manual para mock simples
        if (actor.system.defesas?.determinacao) {
          const v = Number(actor.system.attributes?.vontade?.value ?? 0);
          actor.system.defesas.determinacao.value = v + 2;
        }
      }

      return {
        sucesso: true,
        pacto: "Pacto da Loucura",
        bonusDeterminacao: 2,
        determinacaoFinal: actor.system.defesas?.determinacao?.value,
        modificadorInteligencia: -1,
        inteligenciaFinal: novaInt,
        imuneMedoEMental: true,
        instintosBasicos,
        bloquearMagiaEMusica: instintosBasicos,
      };
    }

    case "pacto da escuridao": {
      garantirItem("Pacto da Escuridão");

      actor.system.sentidos = actor.system.sentidos || {};
      actor.system.sentidos.visaoSemOlhos = true;
      actor.system.sentidos.visaoEscuridao = true;
      actor.system.sentidos.verInvisivel = true;
      actor.system.sentidos.verIlusoes = true;
      actor.system.sentidos.imuneCegueira = true;

      actor.system.pactos.escuridao = {
        visaoNormalSemOlhos: true,
        visaoNaEscuridao: true,
        verInvisivel: true,
        verIlusoes: true,
        inaptoLuzSolar: true,
      };

      const sobLuzSolar = Boolean(opcoes.luzSolar);
      if (sobLuzSolar) {
        adicionarCondicao(actor, "inapto");
      }

      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      }

      return {
        sucesso: true,
        pacto: "Pacto da Escuridão",
        visaoSemOlhos: true,
        visaoEscuridao: true,
        verInvisivel: true,
        verIlusoes: true,
        inaptoSobLuzSolar: true,
        inaptoAtualmente: sobLuzSolar,
      };
    }

    case "pacto da pestilencia": {
      garantirItem("Pacto da Pestilência");

      actor.system.pactos.pestilencia = {
        falhaAutomaticaInfeccao: true,
        falhaAutomaticaSintomas: true,
        imunidadeSintomas: true,
        vetorTransmissor: true,
        detectarDoencasToque: true,
        doencasAtivas: actor.system.pactos?.pestilencia?.doencasAtivas || [],
      };

      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      }

      return {
        sucesso: true,
        pacto: "Pacto da Pestilência",
        falhaAutomaticaInfeccao: true,
        falhaAutomaticaSintomas: true,
        imunidadeTotalSintomas: true,
        vetorTransmissor: true,
        detectarDoencasToque: true,
      };
    }

    case "pacto da tirania": {
      garantirItem("Pacto da Tirania");

      const det = actor.system.defesas?.determinacao?.value ?? calcularDeterminacao(actor).value;
      actor.system.pactos.tirania = {
        auraAtiva: true,
        tipoEfeito: "mental",
        dificuldade: det,
      };

      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      }

      return {
        sucesso: true,
        pacto: "Pacto da Tirania",
        auraTirania: true,
        tipoEfeito: "mental",
        dificuldadeAura: det,
      };
    }

    case "pacto da destruicao": {
      garantirItem("Pacto da Destruição");
      actor.system.pactos.destruicao = {
        danoExtraVontade: true,
      };
      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      }
      return {
        sucesso: true,
        pacto: "Pacto da Destruição",
        danoExtraVontade: true,
      };
    }

    case "pacto da ambicao": {
      garantirItem("Pacto da Ambição");
      actor.system.pactos.ambicao = true;
      if (typeof actor.prepareDerivedData === "function") {
        actor.prepareDerivedData();
      }
      return {
        sucesso: true,
        pacto: "Pacto da Ambição",
      };
    }

    default:
      throw new Error(`Pacto desconhecido: "${pactoNome}". Pactos válidos: ${PACTOS_CANONICOS.join(", ")}`);
  }
}

/**
 * Verifica se um Ator é imune a medo, condição amedrontado ou efeitos mentais.
 * Personagens com Pacto da Loucura possuem essa imunidade canônica.
 *
 * @param {object} actor
 * @param {string} [tipoEfeito="mental"] "medo", "amedrontado", "mental", etc.
 * @returns {boolean}
 */
export function isImuneMedoOuMental(actor, tipoEfeito = "mental") {
  if (!actor) return false;
  const nEfeito = String(tipoEfeito || "").toLowerCase().trim();

  // Verifica flag do Pacto da Loucura
  if (actor.system?.pactos?.loucura === true) {
    return true;
  }

  // Verifica Set de imunidades mentais
  if (actor.system?.imunidadesMentais instanceof Set) {
    if (
      actor.system.imunidadesMentais.has(nEfeito) ||
      actor.system.imunidadesMentais.has("mental") ||
      actor.system.imunidadesMentais.has("medo")
    ) {
      return true;
    }
  }

  // Verifica itens no ator
  const itens = actor.items ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values())) : [];
  return itens.some((i) => normalizarPacto(i.name) === "pacto da loucura");
}

/**
 * Avalia se o Ator está Inapto por estar sob luz solar direta (Pacto da Escuridão).
 *
 * @param {object} actor
 * @param {object} ambiente Informações de ambiente, ex: { luzSolar: true, sobLuzSolar: true }
 * @returns {{ inapto: boolean, motivo?: string }}
 */
export function verificarInaptidaoLuzSolar(actor, ambiente = {}) {
  if (!actor) return { inapto: false };

  const temPactoEscuridao =
    actor.system?.pactos?.escuridao?.inaptoLuzSolar === true ||
    (actor.items &&
      (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values())).some(
        (i) => normalizarPacto(i.name) === "pacto da escuridao"
      ));

  if (!temPactoEscuridao) {
    return { inapto: false };
  }

  const sobLuz = Boolean(ambiente.luzSolar ?? ambiente.sobLuzSolar ?? false);
  if (sobLuz) {
    return {
      inapto: true,
      motivo: "Inaptidão absoluta em todos os testes sob luz solar direta (Maldição do Pacto da Escuridão).",
    };
  }

  return { inapto: false };
}

/**
 * Processa a tentativa de infecção por doença em um Ator.
 * Se o Ator tiver o Pacto da Pestilência:
 * - Falha automaticamente nos testes contra infecção e para resistir a sintomas.
 * - Porém, NÃO sofre os sintomas (imunidade aos efeitos adversos).
 * - Torna-se portador e vetor transmissor ativo da doença.
 *
 * @param {object} actor
 * @param {string|object} doenca Identificador ou objeto da doença (ex: { nome: "Febre Vermelha" })
 * @returns {{ infectado: boolean, falhaAutomatica: boolean, sofreSintomas: boolean, vetorTransmissor: boolean, doenca: string }}
 */
export function testarInfeccaoDoenca(actor, doenca) {
  if (!actor) {
    return { infectado: false, falhaAutomatica: false, sofreSintomas: false, vetorTransmissor: false, doenca: "" };
  }

  const nomeDoenca = typeof doenca === "string" ? doenca : doenca?.nome || "Doença Desconhecida";
  const temPacto =
    actor.system?.pactos?.pestilencia?.falhaAutomaticaInfeccao === true ||
    (actor.items &&
      (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values())).some(
        (i) => normalizarPacto(i.name) === "pacto da pestilencia"
      ));

  if (temPacto) {
    actor.system.pactos = actor.system.pactos || {};
    actor.system.pactos.pestilencia = actor.system.pactos.pestilencia || {
      falhaAutomaticaInfeccao: true,
      imunidadeSintomas: true,
      vetorTransmissor: true,
      doencasAtivas: [],
    };

    const doencas = actor.system.pactos.pestilencia.doencasAtivas || [];
    if (!doencas.includes(nomeDoenca)) {
      doencas.push(nomeDoenca);
      actor.system.pactos.pestilencia.doencasAtivas = doencas;
    }

    return {
      infectado: true,
      falhaAutomatica: true,
      sofreSintomas: false,
      vetorTransmissor: true,
      doenca: nomeDoenca,
    };
  }

  // Comportamento normal para alvo sem o pacto (não falha automaticamente)
  return {
    infectado: false,
    falhaAutomatica: false,
    sofreSintomas: false,
    vetorTransmissor: false,
    doenca: nomeDoenca,
  };
}

/**
 * Trata o efeito colateral canônico quando um portador do Pacto da Pestilência
 * é alvo da magia Purgar ou consome um Antídoto Universal:
 * - Cura 1 doença da sua lista ativa.
 * - Porém, sofre os sintomas violentos daquela doença durante 1 dia completo.
 *
 * @param {object} actor
 * @param {string} [metodo="purgar"] "purgar" ou "antidoto universal"
 * @returns {{ curado: boolean, doencaRemovida: string|null, sofreSintomasPor1Dia: boolean, duracao: string }}
 */
export function aplicarCuraOuPurificacao(actor, metodo = "purgar") {
  if (!actor) return { curado: false, doencaRemovida: null, sofreSintomasPor1Dia: false, duracao: "" };

  const doencas = actor.system?.pactos?.pestilencia?.doencasAtivas || [];
  if (!doencas.length) {
    return {
      curado: false,
      doencaRemovida: null,
      sofreSintomasPor1Dia: false,
      duracao: "",
      motivo: "Nenhuma doença alojada no organismo.",
    };
  }

  const doencaRemovida = doencas.shift();
  actor.system.detalhesPacto = actor.system.detalhesPacto || {};
  actor.system.detalhesPacto.sintomasTemporarios = {
    doenca: doencaRemovida,
    duracao: "1 dia",
    ativo: true,
  };

  return {
    curado: true,
    doencaRemovida,
    sofreSintomasPor1Dia: true,
    duracao: "1 dia",
    metodo,
  };
}

/**
 * Avalia a tentativa de um atacante de golpear ou alvejar um Cultista com o Pacto da Tirania.
 *
 * Regras Canônicas (Guia do Vilão, pág. 91):
 * - Inimigos devem realizar teste de Vontade contra a Determinação do Cultista.
 * - Falha no teste: o inimigo não pode atacar.
 * - Sucesso no teste: pode atacar, mas com redutor no teste igual à sua própria Vontade.
 * - Uma vez que supere a aura, não é mais afetado até o próximo nascer ou pôr do sol.
 * - Efeito Mental: criaturas imunes a efeitos mentais (ex: Pacto da Loucura) ignoram a aura completamente.
 *
 * @param {object} atacante Ator que está tentando atacar
 * @param {object} cultista Ator cultista com o Pacto da Tirania
 * @param {number} [rolagemVontade] Resultado da rolagem do teste de Vontade do atacante (opcional)
 * @param {object} [opcoes={}] Opções adicionais (ex: { jaSuperou: boolean })
 * @returns {{ podeAtacar: boolean, exigiuTeste: boolean, dificuldade: number, rolagem?: number, redutor: number, superouAura: boolean, motivo: string }}
 */
export function avaliarAtaqueContraTirania(atacante, cultista, rolagemVontade, opcoes = {}) {
  if (!atacante || !cultista) {
    return {
      podeAtacar: true,
      exigiuTeste: false,
      dificuldade: 0,
      redutor: 0,
      superouAura: false,
      motivo: "Parâmetros inválidos.",
    };
  }

  // 1. Criaturas imunes a efeitos mentais (ex: Pacto da Loucura) ignoram o efeito
  if (isImuneMedoOuMental(atacante, "mental")) {
    return {
      podeAtacar: true,
      exigiuTeste: false,
      dificuldade: 0,
      redutor: 0,
      superouAura: true,
      motivo: "Atacante é imune a efeitos mentais (Pacto da Loucura) e ignora a Aura de Tirania.",
    };
  }

  // 2. Se já superou a aura no ciclo atual
  const cultistaId = cultista.id || cultista.name || "cultista";
  const jaSuperou = opcoes.jaSuperou || atacante.flags?.["mighty-blade"]?.superouTirania?.[cultistaId] === true;
  if (jaSuperou) {
    return {
      podeAtacar: true,
      exigiuTeste: false,
      dificuldade: 0,
      redutor: 0,
      superouAura: true,
      motivo: "Atacante já superou a Aura de Tirania deste cultista neste ciclo.",
    };
  }

  // 3. Dificuldade do teste = Determinação do Cultista
  const dificuldade = cultista.system?.defesas?.determinacao?.value ?? calcularDeterminacao(cultista).value;

  // Se a rolagem não foi fornecida, apenas informa que o teste é obrigatório
  if (rolagemVontade === undefined) {
    return {
      podeAtacar: false,
      exigiuTeste: true,
      dificuldade,
      redutor: 0,
      superouAura: false,
      motivo: `O atacante deve realizar um teste de Vontade contra Dificuldade ${dificuldade} (Determinação do Cultista) para poder atacar.`,
    };
  }

  // 4. Falha no teste de Vontade
  if (rolagemVontade < dificuldade) {
    return {
      podeAtacar: false,
      exigiuTeste: true,
      dificuldade,
      rolagem: rolagemVontade,
      redutor: 0,
      superouAura: false,
      motivo: `Falha no teste de Vontade (${rolagemVontade} < ${dificuldade}). O atacante é subjugado e não pode atacar o Cultista.`,
    };
  }

  // 5. Sucesso no teste de Vontade
  const vonAtacante = Number(atacante.system?.attributes?.vontade?.value ?? 0);
  if (!atacante.flags) atacante.flags = {};
  if (!atacante.flags["mighty-blade"]) atacante.flags["mighty-blade"] = {};
  if (!atacante.flags["mighty-blade"].superouTirania) atacante.flags["mighty-blade"].superouTirania = {};
  atacante.flags["mighty-blade"].superouTirania[cultistaId] = true;

  return {
    podeAtacar: true,
    exigiuTeste: true,
    dificuldade,
    rolagem: rolagemVontade,
    redutor: vonAtacante,
    superouAura: true,
    motivo: `Sucesso no teste de Vontade (${rolagemVontade} >= ${dificuldade}). O atacante supera a opressão e pode atacar, sofrendo redutor de -${vonAtacante} (sua Vontade) no teste.`,
  };
}

/**
 * Habilidade Virulência (Caminho Cultista, Requer Pacto da Pestilência).
 *
 * Regra Canônica (Guia do Vilão, pág. 90):
 * "Sua presença diminui a imunidade das criaturas vivas ao redor.
 * Todas as criaturas vivas a uma quantidade de metros igual à sua Determinação ao seu redor
 * fazem seus testes para resistir a infecções e aos efeitos de doenças e venenos como se fossem Inaptas."
 *
 * @param {object} actor Cultista que emana a aura de Virulência
 * @param {Array<object>} alvos Lista de criaturas/atores no combate
 * @param {object} [opcoes={}] Opções adicionais (ex: distancias: { [id]: number })
 * @returns {{ sucesso: boolean, cultista: string, raioMetros: number, alvosAfetados: Array<object>, alvosIgnorados: Array<object> }}
 */
export function aplicarVirulencia(actor, alvos = [], opcoes = {}) {
  if (!actor) {
    throw new Error("Ator cultista inválido para aplicar Virulência.");
  }

  const raioMetros = actor.system?.defesas?.determinacao?.value ?? calcularDeterminacao(actor).value;
  const alvosAfetados = [];
  const alvosIgnorados = [];

  for (const itemAlvo of alvos) {
    const alvo = itemAlvo.target || itemAlvo.actor || itemAlvo;
    const distancia = Number(
      itemAlvo.distancia ??
      opcoes.distancias?.[alvo.id || alvo.name] ??
      itemAlvo.distanciaMetros ??
      0
    );

    // 1. O próprio cultista não é afetado por sua própria aura
    if (alvo === actor || (alvo.id && actor.id && alvo.id === actor.id)) {
      continue;
    }

    // 2. Apenas criaturas vivas são afetadas (construtos e mortos-vivos são imunes a aflições biológicas)
    const tipoAlvo = String(alvo.system?.details?.tipo || alvo.type || "").toLowerCase();
    const racaAlvo = String(alvo.system?.details?.raca || "").toLowerCase();
    const isNaoVivo =
      tipoAlvo.includes("construto") ||
      tipoAlvo.includes("morto-vivo") ||
      racaAlvo.includes("golem") ||
      racaAlvo.includes("esqueleto") ||
      racaAlvo.includes("zumbi");

    if (isNaoVivo) {
      alvosIgnorados.push({
        alvo,
        motivo: "Não é criatura viva (imune a patógenos biológicos).",
      });
      continue;
    }

    // 3. Verifica distância em relação ao raio de Determinação
    if (distancia > raioMetros) {
      alvosIgnorados.push({
        alvo,
        distancia,
        raioMetros,
        motivo: `Fora do alcance da aura (${distancia}m > ${raioMetros}m).`,
      });
      continue;
    }

    // 4. Aplica a debilitação biológica ao alvo
    if (!alvo.system) alvo.system = {};
    alvo.system.virulencia = {
      ativa: true,
      cultistaId: actor.id || actor.name,
      raioMetros,
    };
    alvo.system.inaptoDoencasVenenos = true;

    alvosAfetados.push({
      alvo,
      distancia,
      inaptoContraDoencasVenenos: true,
    });
  }

  return {
    sucesso: true,
    cultista: actor.name || "Cultista",
    raioMetros,
    alvosAfetados,
    alvosIgnorados,
  };
}

/**
 * Avalia se um teste de resistência contra infecção, doença ou veneno deve ser realizado como Inapto.
 *
 * @param {object} alvo Criatura realizando o teste
 * @param {object} [contexto={}] Contexto do teste (ex: { tipo: "doenca"|"veneno" })
 * @returns {{ inapto: boolean, dadosRolados: number, motivo: string }}
 */
export function testarResistenciaDoencaOuVeneno(alvo, contexto = {}) {
  if (!alvo) {
    return { inapto: false, dadosRolados: 2, motivo: "Alvo inválido." };
  }

  const sobVirulencia = alvo.system?.inaptoDoencasVenenos === true || alvo.system?.virulencia?.ativa === true;
  if (sobVirulencia) {
    return {
      inapto: true,
      dadosRolados: 1, // Regra canônica de Inaptidão no MB3e: rola 1d6 ao invés de 2d6
      motivo: "Alvo sob efeito da Virulência do Cultista: realiza testes contra doenças e venenos como Inapto (1d6).",
    };
  }

  return {
    inapto: false,
    dadosRolados: 2,
    motivo: "Teste de resistência padrão (2d6).",
  };
}
