/**
 * Módulo de Regras Canônicas de Músicas de Bardo, Menestrel e Concentração.
 * Mighty Blade 3ª Edição (Foundry VTT v14).
 *
 * Implementa as regras canônicas de:
 * 1. Canção do Bardo & Interrupção de Performance (teste de Vontade contra dano sofrido ou Dif 8).
 * 2. Bônus de Instrumentos de Sopro (+2 para Faunos ou possuidores de maestria/Flauta de Pã/Soprista).
 * 3. Exclusividade estrita de Músicas de efeito contínuo/sustentado (limite de 1 música ativa por vez).
 */

export const DIFICULDADE_INTERRUPCAO_PADRAO = 8;
export const BONUS_INSTRUMENTO_SOPRO = 2;

/**
 * Lista canônica de Músicas com efeito contínuo ou sustentado
 * (requerem tocar/cantar ou concentração contínua).
 */
export const MUSICAS_CONTINUAS_CANONICAS = [
  "poesia-dos-bardos",
  "cancao-da-provocacao",
  "cancao-desesperadora",
  "cancao-do-triunfo",
  "cancao-exultante",
  "cancao-da-sereia",
  "cancao-desconcentrante",
  "cancao-do-requiem",
  "melodia-dancante",
  "melodia-do-enjoo",
  "melodia-do-repouso",
  "melodia-sonifera",
  "melodia-da-furia",
  "melodia-dos-animais",
  "ritmo-dos-animais",
  "solo",
];

/**
 * Instrumentos de sopro canônicos oficiais e seus identificadores.
 */
export const INSTRUMENTOS_SOPRO_CANONICOS = [
  "flauta-de-pa",
  "flauta de pa",
  "flauta de pan",
  "flauta-doce",
  "flauta doce",
  "flauta",
  "chifre",
  "jorvik",
  "gaita-de-fole",
  "gaita de fole",
  "corneta",
  "trompete",
  "trompa",
  "clarinete",
  "oboe",
];

/**
 * Normaliza strings para comparações seguras sem acentos e em minúsculas.
 * @param {string} str
 * @returns {string}
 */
export function normalizarTexto(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Extrai o nome de uma música ou habilidade a partir de um objeto, item ou string.
 * @param {string|object} musica
 * @returns {string}
 */
export function extrairNomeMusica(musica) {
  if (!musica) return "";
  if (typeof musica === "string") return musica.trim();
  return (musica.name || musica.label || musica.id || musica.slug || "").trim();
}

/**
 * Verifica se uma habilidade ou item é do tipo/categoria Música.
 * @param {string|object} item
 * @returns {boolean}
 */
export function isHabilidadeMusica(item) {
  if (!item) return false;
  if (typeof item === "string") {
    const norm = normalizarTexto(item);
    return (
      MUSICAS_CONTINUAS_CANONICAS.some((m) => norm.includes(normalizarTexto(m)) || normalizarTexto(m).includes(norm)) ||
      norm.includes("cancao") ||
      norm.includes("melodia") ||
      norm.includes("ritmo") ||
      norm.includes("musica")
    );
  }

  const categoria = normalizarTexto(
    item.system?.categoria ||
    item.system?.subtipo ||
    item.flags?.["mighty-blade"]?.categoria ||
    ""
  );
  if (categoria === "musica" || categoria === "música") return true;

  const nome = normalizarTexto(item.name || item.label || "");
  return (
    MUSICAS_CONTINUAS_CANONICAS.some((m) => nome.includes(normalizarTexto(m)) || normalizarTexto(m).includes(nome)) ||
    nome.includes("cancao") ||
    nome.includes("melodia") ||
    nome.includes("ritmo")
  );
}

/**
 * Verifica se uma música possui efeito contínuo/sustentado.
 * @param {string|object} musica
 * @returns {boolean}
 */
export function isMusicaContinua(musica) {
  if (!musica) return false;
  const nomeNorm = normalizarTexto(extrairNomeMusica(musica));

  // 1. Verificação contra lista canônica
  if (MUSICAS_CONTINUAS_CANONICAS.some((m) => {
    const normM = normalizarTexto(m);
    return nomeNorm.includes(normM) || normM.includes(nomeNorm);
  })) {
    return true;
  }

  // 2. Metadados do item
  if (typeof musica === "object") {
    if (musica.system?.sustentada === true || musica.system?.continuo === true) {
      return true;
    }
    const desc = normalizarTexto(musica.system?.description || musica.system?.descricao || "");
    if (desc.includes("enquanto") || desc.includes("mantida") || desc.includes("sustentada") || desc.includes("turnos")) {
      return true;
    }
  }

  // 3. Padrões semânticos canônicos (Canção, Melodia, Ritmo)
  if (nomeNorm.startsWith("cancao") || nomeNorm.startsWith("melodia") || nomeNorm.startsWith("ritmo")) {
    return true;
  }

  return false;
}

/**
 * Verifica se um item é um instrumento musical de sopro.
 * @param {string|object} instrumento
 * @returns {boolean}
 */
export function isInstrumentoSopro(instrumento) {
  if (!instrumento) return false;

  const textoIdentificador = typeof instrumento === "string"
    ? instrumento
    : `${instrumento.name || ""} ${instrumento.system?.description || ""} ${instrumento.system?.observacoes || ""} ${instrumento.flags?.["mighty-blade"]?.slug || ""}`;

  const norm = normalizarTexto(textoIdentificador);

  // 1. Palavra 'sopro' explícita
  if (norm.includes("sopro")) return true;

  // 2. Lista de instrumentos canônicos de sopro
  for (const inst of INSTRUMENTOS_SOPRO_CANONICOS) {
    if (norm.includes(normalizarTexto(inst))) return true;
  }

  // 3. Flags ou propriedades estruturadas
  if (typeof instrumento === "object") {
    const subtipo = normalizarTexto(instrumento.system?.subtipo || instrumento.system?.tipo || "");
    if (subtipo === "sopro") return true;
  }

  return false;
}

/**
 * Obtém as Músicas ativas no ator (efeitos ativos, itens ligados ou flags de estado).
 * @param {object} actor
 * @returns {string[]} Lista de nomes de músicas ativas
 */
export function getMusicasAtivas(actor) {
  if (!actor) return [];
  const ativas = new Set();

  // 1. ActiveEffects do Foundry
  const effects = actor.effects
    ? (Array.isArray(actor.effects) ? actor.effects : Array.from(actor.effects.values()))
    : [];
  for (const eff of effects) {
    if (!eff.disabled) {
      const nome = eff.name || eff.label || "";
      if (isMusicaContinua(nome)) {
        ativas.add(nome);
      }
    }
  }

  // 2. Itens marcados como ativos no ator
  const items = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];
  for (const it of items) {
    const isAtivo = it.system?.ativo === true || it.flags?.["mighty-blade"]?.ativo === true;
    if (isAtivo && isMusicaContinua(it)) {
      ativas.add(it.name);
    }
  }

  // 3. Flags diretas no Ator
  const flagMusica = actor.flags?.["mighty-blade"]?.musicaAtiva || actor.system?.musicaAtiva;
  if (flagMusica) {
    if (typeof flagMusica === "string" && flagMusica.trim()) {
      ativas.add(flagMusica.trim());
    } else if (typeof flagMusica === "object" && flagMusica.name) {
      ativas.add(flagMusica.name);
    }
  }

  return Array.from(ativas);
}

/**
 * Ativa uma música no ator, registrando em flag e efeitos se aplicável.
 * @param {object} actor
 * @param {string|object} musica
 */
export function ativarMusica(actor, musica) {
  if (!actor || !musica) return;
  const nome = extrairNomeMusica(musica);

  if (!actor.flags) actor.flags = {};
  if (!actor.flags["mighty-blade"]) actor.flags["mighty-blade"] = {};
  actor.flags["mighty-blade"].musicaAtiva = nome;

  // Atualiza item correspondente se existir
  const items = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];
  const itemMusica = items.find((i) => normalizarTexto(i.name) === normalizarTexto(nome));
  if (itemMusica) {
    if (!itemMusica.system) itemMusica.system = {};
    itemMusica.system.ativo = true;
  }
}

/**
 * Desativa/cancela uma ou todas as Músicas ativas no Ator.
 * @param {object} actor
 * @param {string|null} musicaNome Se null, desativa todas
 * @returns {string[]} Lista de músicas que foram desativadas
 */
export function desativarMusicaAtiva(actor, musicaNome = null) {
  if (!actor) return [];
  const desativadas = [];
  const alvoNorm = musicaNome ? normalizarTexto(musicaNome) : null;

  // 1. Effects
  const effects = actor.effects
    ? (Array.isArray(actor.effects) ? actor.effects : Array.from(actor.effects.values()))
    : [];
  for (const eff of effects) {
    const nome = eff.name || eff.label || "";
    if (isMusicaContinua(nome)) {
      if (!alvoNorm || normalizarTexto(nome) === alvoNorm) {
        eff.disabled = true;
        desativadas.push(nome);
      }
    }
  }

  // 2. Items
  const items = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];
  for (const it of items) {
    if (it.system?.ativo || it.flags?.["mighty-blade"]?.ativo) {
      if (!alvoNorm || normalizarTexto(it.name) === alvoNorm) {
        if (it.system) it.system.ativo = false;
        if (it.flags?.["mighty-blade"]) it.flags["mighty-blade"].ativo = false;
        desativadas.push(it.name);
      }
    }
  }

  // 3. Flags do Ator
  const flagMusica = actor.flags?.["mighty-blade"]?.musicaAtiva;
  if (flagMusica) {
    const nomeFlag = typeof flagMusica === "string" ? flagMusica : flagMusica.name;
    if (!alvoNorm || normalizarTexto(nomeFlag) === alvoNorm) {
      desativadas.push(nomeFlag);
      actor.flags["mighty-blade"].musicaAtiva = null;
    }
  }

  if (actor.system?.musicaAtiva) {
    const nomeSys = typeof actor.system.musicaAtiva === "string" ? actor.system.musicaAtiva : actor.system.musicaAtiva.name;
    if (!alvoNorm || normalizarTexto(nomeSys) === alvoNorm) {
      desativadas.push(nomeSys);
      actor.system.musicaAtiva = null;
    }
  }

  return Array.from(new Set(desativadas));
}

/**
 * Determina se o ator possui afinidade ou maestria em instrumentos de sopro
 * (Raça Fauno, habilidade "Flauta de Pã", habilidade "Soprista" ou efeitos equivalentes).
 * @param {object} actor
 * @returns {boolean}
 */
export function temMaestriaInstrumentoSopro(actor) {
  if (!actor) return false;

  // 1. Raça Fauno
  const raca = normalizarTexto(actor.system?.details?.raca || "");
  if (raca === "fauno") return true;

  const items = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];

  const racaItem = items.find((i) => i.type === "raca");
  if (racaItem && normalizarTexto(racaItem.name) === "fauno") return true;

  // 2. Habilidade "Flauta de Pã" ou "Soprista"
  for (const it of items) {
    if (it.type === "habilidade" || !it.type) {
      const slug = normalizarTexto(it.flags?.["mighty-blade"]?.slug || it.name || "");
      if (slug === "flauta-de-pa" || slug === "flauta de pa" || slug.includes("flauta de pa")) {
        return true;
      }
      if (slug === "soprista" || slug.includes("soprista")) {
        return true;
      }
    }
  }

  // 3. Flags do ator
  if (actor.flags?.["mighty-blade"]?.soprista || actor.flags?.["mighty-blade"]?.maestriaSopro) {
    return true;
  }

  return false;
}

/**
 * Localiza o primeiro instrumento musical equipado pelo Ator.
 * @param {object} actor
 * @returns {object|null}
 */
export function obterInstrumentoEquipado(actor) {
  if (!actor) return null;
  const items = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];

  return items.find((i) => {
    const isEquipado = i.system?.equipado === true || i.flags?.["mighty-blade"]?.equipado === true;
    const cat = normalizarTexto(i.flags?.["mighty-blade"]?.categoria || i.system?.categoria || "");
    const ehMusical = cat === "musical" || isInstrumentoSopro(i);
    return isEquipado && ehMusical;
  }) || null;
}

/**
 * Calcula o bônus concedido ao utilizar instrumentos de sopro.
 * Regra Canônica: Aplica +2 em testes de execução musical quando o item for
 * um instrumento de sopro (ex.: Fauno com Flauta de Pã, ou personagem com Soprista).
 *
 * @param {object|null} actor Ator executando a música
 * @param {string|object} instrumento Instrumento utilizado
 * @param {object} options Opções de cálculo
 * @param {boolean} [options.ignorarRequisitos=false] Concede +2 se o item for de sopro, independente do ator
 * @param {boolean} [options.exigirMaestria=true] Exige que o ator seja Fauno ou possua habilidade de sopro
 * @returns {number} 2 se aplicável, 0 caso contrário
 */
export function calcularBonusInstrumentoSopro(actor, instrumento, options = {}) {
  if (!instrumento) return 0;
  if (!isInstrumentoSopro(instrumento)) return 0;

  // Se ignorarRequisitos for solicitado ou se ator não for fornecido, aplica bônus padrão do instrumento
  if (options.ignorarRequisitos || !actor) {
    return BONUS_INSTRUMENTO_SOPRO;
  }

  // Se o ator possuir maestria canônica (Fauno, Flauta de Pã, Soprista)
  if (temMaestriaInstrumentoSopro(actor)) {
    return BONUS_INSTRUMENTO_SOPRO;
  }

  // Se o próprio instrumento possuir efeito de bônus explícito
  if (typeof instrumento === "object") {
    const efeitos = instrumento.system?.efeitos;
    if (Array.isArray(efeitos) && efeitos.some((e) => e.tipo === "bonusDadoTeste" && Number(e.valor) > 0)) {
      return BONUS_INSTRUMENTO_SOPRO;
    }
  }

  // Se não exigir maestria explicitly set to false
  if (options.exigirMaestria === false) {
    return BONUS_INSTRUMENTO_SOPRO;
  }

  return 0;
}

/**
 * Testa a interrupção da performance musical quando o Bardo sofre dano.
 *
 * Regra Canônica (Subtítulo 13):
 * "Se o Bardo sofrer dano enquanto executa Habilidade do tipo Música,
 *  exige teste de Vontade/Performance (dificuldade proporcional ao dano
 *  ou padrão 8) para não cancelar a música."
 *
 * @param {number} danoSofrido Quantidade de dano sofrido
 * @param {object} actor Ator executando a música
 * @param {object|number} [options={}] Opções ou resultado do teste (se number)
 * @param {number} [options.resultadoTeste] Valor total obtido no teste de Vontade
 * @param {number} [options.dificuldade] Dificuldade customizada (se não informada, usa Math.max(8, danoSofrido))
 * @param {string|object} [options.instrumento] Instrumento em uso para cômputo de bônus
 * @param {number} [options.bonus] Bônus adicional no teste
 * @param {boolean} [options.desativarEmFalha=true] Cancela/desativa automaticamente a música em caso de falha
 * @param {boolean} [options.emExecucao] Força flag indicando se há música em execução
 * @returns {{
 *   exigiuTeste: boolean,
 *   dificuldade: number,
 *   danoSofrido: number,
 *   vontade: number,
 *   bonus: number,
 *   resultadoTeste: number|null,
 *   sucesso: boolean|null,
 *   interrompido: boolean|null,
 *   musicaCancelada: boolean,
 *   musicasAtivas: string[],
 *   motivo: string
 * }}
 */
export function testarInterrupcaoPerformance(danoSofrido, actor, options = {}) {
  const opt = typeof options === "number" ? { resultadoTeste: options } : (options || {});
  const dano = Number(danoSofrido) || 0;

  // 1. Verifica músicas ativas no ator
  const musicasAtivas = getMusicasAtivas(actor);
  const emExecucao = opt.emExecucao ?? (musicasAtivas.length > 0 || opt.musicaAtiva != null);

  // Se não houver performance ativa, nenhum teste é exigido
  if (!emExecucao) {
    return {
      exigiuTeste: false,
      dificuldade: DIFICULDADE_INTERRUPCAO_PADRAO,
      danoSofrido: dano,
      vontade: actor?.system?.attributes?.vontade?.value ?? 0,
      bonus: 0,
      resultadoTeste: opt.resultadoTeste ?? null,
      sucesso: null,
      interrompido: false,
      musicaCancelada: false,
      musicasAtivas: [],
      motivo: "Nenhuma música ativa em execução no momento do dano",
    };
  }

  // Se o dano for 0 ou negativo, não interrompe nem exige teste
  if (dano <= 0) {
    return {
      exigiuTeste: false,
      dificuldade: DIFICULDADE_INTERRUPCAO_PADRAO,
      danoSofrido: dano,
      vontade: actor?.system?.attributes?.vontade?.value ?? 0,
      bonus: 0,
      resultadoTeste: opt.resultadoTeste ?? null,
      sucesso: true,
      interrompido: false,
      musicaCancelada: false,
      musicasAtivas,
      motivo: "Nenhum dano sofrido; a música continua inalterada",
    };
  }

  // 2. Dificuldade canônica: proporcional ao dano ou padrão 8 (o que for maior)
  const dificuldade = opt.dificuldade ?? Math.max(DIFICULDADE_INTERRUPCAO_PADRAO, dano);

  // 3. Modificador de Vontade e bônus de performance/instrumento
  const vontade = actor?.system?.attributes?.vontade?.value ?? 0;
  const instrumento = opt.instrumento ?? obterInstrumentoEquipado(actor);
  const bonusInstrumento = calcularBonusInstrumentoSopro(actor, instrumento);
  const bonusTotal = (Number(opt.bonus) || 0) + bonusInstrumento;

  // 4. Avaliação do resultado do teste
  let sucesso = null;
  let interrompido = null;
  let musicaCancelada = false;

  if (opt.resultadoTeste !== undefined && opt.resultadoTeste !== null) {
    const totalRolagem = Number(opt.resultadoTeste);
    sucesso = totalRolagem >= dificuldade;
    interrompido = !sucesso;

    if (interrompido) {
      if (opt.desativarEmFalha !== false && actor) {
        desativarMusicaAtiva(actor);
        musicaCancelada = true;
      }
    }
  }

  return {
    exigiuTeste: true,
    dificuldade,
    danoSofrido: dano,
    vontade,
    bonus: bonusTotal,
    resultadoTeste: opt.resultadoTeste ?? null,
    sucesso,
    interrompido,
    musicaCancelada,
    musicasAtivas,
    motivo: interrompido === true
      ? `Falha no teste de Vontade (${opt.resultadoTeste} < ${dificuldade}): Música cancelada pelo dano`
      : interrompido === false
      ? `Sucesso no teste de Vontade (${opt.resultadoTeste} >= ${dificuldade}): Música mantida com sucesso`
      : `Teste de Vontade exigido com Dificuldade ${dificuldade} para manter a música ativa`,
  };
}

/**
 * Valida a exclusividade estrita de Músicas de efeito contínuo/sustentado.
 *
 * Regra Canônica (Subtítulo 13):
 * "Bloqueia estritamente a ativação de mais de 1 Música de efeito contínuo/sustentado
 *  ao mesmo tempo (desativa a anterior ou rejeita a nova)."
 *
 * @param {object} actor Ator ativando a música
 * @param {string|object} novaMusica Nome ou objeto da nova música
 * @param {object} [options={}] Opções de validação
 * @param {boolean} [options.desativarAnterior=false] Se true, desativa a música anterior em vez de rejeitar
 * @param {boolean} [options.substituir=false] Alias para desativarAnterior
 * @param {boolean} [options.ativarNova=true] Se true, registra a nova música no ator quando permitida
 * @returns {{
 *   permitida: boolean,
 *   substituida: boolean,
 *   conflito: string|null,
 *   musicaAnterior: string|null,
 *   erro: string|null,
 *   musicasAtivas: string[]
 * }}
 */
export function validarExclusividadeMusicas(actor, novaMusica, options = {}) {
  const opt = options || {};
  const nomeNova = extrairNomeMusica(novaMusica);
  const ativas = getMusicasAtivas(actor);

  // Se a nova música não for contínua/sustentada, é permitida livremente
  if (!isMusicaContinua(novaMusica)) {
    return {
      permitida: true,
      substituida: false,
      conflito: null,
      musicaAnterior: null,
      erro: null,
      musicasAtivas: ativas,
    };
  }

  // Se não houver nenhuma música ativa, permite a ativação
  if (ativas.length === 0) {
    if (opt.ativarNova !== false && actor) {
      ativarMusica(actor, novaMusica);
    }
    return {
      permitida: true,
      substituida: false,
      conflito: null,
      musicaAnterior: null,
      erro: null,
      musicasAtivas: [nomeNova],
    };
  }

  // Verifica se a música ativa já é a própria nova música (manutenção/reafirmação)
  const normNova = normalizarTexto(nomeNova);
  const mesmaAtiva = ativas.find((m) => normalizarTexto(m) === normNova);
  if (mesmaAtiva) {
    return {
      permitida: true,
      substituida: false,
      conflito: null,
      musicaAnterior: null,
      erro: null,
      musicasAtivas: ativas,
    };
  }

  // Há conflito com música anterior diferente
  const conflito = ativas[0];
  const desativar = opt.desativarAnterior === true || opt.substituir === true;

  if (desativar) {
    // Modo Substituição: Desativa a anterior e ativa a nova
    if (actor) {
      desativarMusicaAtiva(actor, conflito);
      if (opt.ativarNova !== false) {
        ativarMusica(actor, novaMusica);
      }
    }
    return {
      permitida: true,
      substituida: true,
      conflito: null,
      musicaAnterior: conflito,
      erro: null,
      musicasAtivas: [nomeNova],
    };
  }

  // Modo Bloqueio Estrito: Rejeita a nova música
  return {
    permitida: false,
    substituida: false,
    conflito,
    musicaAnterior: conflito,
    erro: `Exclusividade de Músicas violada: "${nomeNova}" não pode ser ativada enquanto "${conflito}" estiver ativa. Apenas 1 Música de efeito contínuo/sustentado pode estar ativa simultaneamente.`,
    musicasAtivas: ativas,
  };
}
