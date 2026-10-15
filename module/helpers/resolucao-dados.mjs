/**
 * Módulo de Resolução de Dados, Graus de Sucesso e Dupla Inaptidão do Mighty Blade 3e.
 *
 * Implementa as regras canônicas para o Subtítulo 24:
 * 1. Critérios de Sucesso Decisivo (Acerto Crítico):
 *    - Ocorre sempre que 2 ou mais dados resultarem em 6 na rolagem (ex: [6, 6], [6, 6, 3]).
 *    - Em Magias: O jogador escolhe exatamente 1 benefício:
 *      1. Custo de Mana reduzido a 0 PM (custoZeroPM: true).
 *      2. Dano da magia multiplicado por 2 (danoMultiplicado2: true).
 *      3. Área de efeito ou duração multiplicada por 2 (areaOuDuracaoMultiplicada2: true).
 *    - Em Ataques Físicos: O dano é multiplicado por 2 (danoMultiplicado2: true).
 *
 * 2. Regra de Adição de Multiplicadores:
 *    - Habilidades que multiplicam o dano (ex: Ataque Devastador que dá 2x dano) somam os multiplicadores
 *      no acerto crítico: 2 + 2 = 4x o dano (jamais multiplicação exponencial 2 x 2 = 4).
 *    - Helper: calcularMultiplicadorDanoCritico(multiplicadorBase, multiplicadorExtra).
 *
 * 3. Critérios de Falha Crítica:
 *    - Ocorre quando todos os dados rolados resultam em 1 (ex: [1, 1], [1, 1, 1], ou [1] em Inapto).
 *    - Aplica falha automática (falhaAutomatica: true, falhaCritica: true) e efeito colateral grave.
 *
 * 4. Trava Absoluta de Dupla Inaptidão:
 *    - Se duas ou mais condições impuserem Inaptidão no mesmo teste (ex: estar Distraído E usar arma com FN > Força),
 *      a ação falha automaticamente (0% de chance de sucesso, falhaAutomatica: true, duplaInaptidao: true)
 *      sem necessidade de rolagem.
 *
 * 5. Resolução de Confrontos Opostos e Empates:
 *    1. Um Sucesso Decisivo em um confronto vence automaticamente qualquer resultado que não seja Sucesso Decisivo.
 *    2. Se ambos obtiverem Sucesso Decisivo (ou ambos normais), vence a maior soma total (Dados + Atributo).
 *    3. Em caso de empate na soma, vence o personagem com o Atributo mais alto.
 *    4. Se o Atributo for idêntico, cada um rola 1d6 para desempate rápido.
 */

export const BENEFICIOS_CRITICO_MAGIA = Object.freeze({
  CUSTO_ZERO_PM: "custoZeroPM",
  DANO_MULTIPLICADO_2: "danoMultiplicado2",
  AREA_DURACAO_MULTIPLICADA_2: "areaOuDuracaoMultiplicada2",
});

export const MOTIVOS_VITORIA_CONFRONTO = Object.freeze({
  SUCESSO_DECISIVO: "sucesso_decisivo",
  FALHA_AUTOMATICA_OPONENTE: "falha_automatica_oponente",
  MAIOR_TOTAL: "maior_total",
  MAIOR_ATRIBUTO: "maior_atributo",
  DESEMPATE_1D6: "desempate_1d6",
  EMPATE: "empate",
});

export const CRITERIO_CRITICO_MIN_SEIS = 2;
export const CRITERIO_FALHA_CRITICA_VALOR = 1;
export const MULTIPLICADOR_CRITICO_BASE = 2;

/**
 * Normaliza qualquer texto de benefício de magia ou chave de opção.
 * @param {string|object|Array} val
 * @returns {string|null}
 */
export function normalizarBeneficioMagia(val) {
  if (!val) return null;

  if (Array.isArray(val)) {
    if (val.length === 1) return normalizarBeneficioMagia(val[0]);
    throw new Error("Em Magias, o jogador deve escolher exatamente 1 benefício no Sucesso Decisivo.");
  }

  if (typeof val === "object") {
    const chavesAtivas = Object.entries(val)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
    if (chavesAtivas.length > 1) {
      throw new Error("Em Magias, o jogador deve escolher exatamente 1 benefício no Sucesso Decisivo.");
    }
    if (chavesAtivas.length === 1) {
      return normalizarBeneficioMagia(chavesAtivas[0]);
    }
    return null;
  }

  const str = String(val)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (
    str === "custozeropm" ||
    str === "custo_zero" ||
    str === "custo_zero_pm" ||
    str === "manazero" ||
    str === "mana_zero" ||
    str === "0pm" ||
    str === "pm_zero" ||
    str === "custo 0 pm"
  ) {
    return BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM;
  }

  if (
    str === "danomultiplicado2" ||
    str === "dano_multiplicado_2" ||
    str === "danomultiplicado" ||
    str === "dano_dobrado" ||
    str === "dobrodano" ||
    str === "dobro_dano" ||
    str === "dano 2x" ||
    str === "2x dano"
  ) {
    return BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2;
  }

  if (
    str === "areaouduracaomultiplicada2" ||
    str === "area_duracao_multiplicada_2" ||
    str === "area_duracao" ||
    str === "areadobrada" ||
    str === "area_dobrada" ||
    str === "duracaodobrada" ||
    str === "duracao_dobrada" ||
    str === "area 2x" ||
    str === "duracao 2x"
  ) {
    return BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2;
  }

  return val;
}

/**
 * Regra de Adição de Multiplicadores do Mighty Blade 3e:
 * Habilidades que multiplicam o dano (ex: Ataque Devastador que dá 2x dano)
 * somam os multiplicadores no acerto crítico: 2 + 2 = 4x o dano (jamais multiplicação exponencial 2 x 2 = 4).
 *
 * @param {number|object} multiplicadorBase Multiplicador base (padrão 2 para acerto crítico)
 * @param {number|number[]} [multiplicadorExtra=0] Multiplicador extra de habilidade(s)
 * @returns {number} Multiplicador final de dano aditivamente somado
 */
export function calcularMultiplicadorDanoCritico(multiplicadorBase = 2, multiplicadorExtra = 0) {
  if (typeof multiplicadorBase === "object" && multiplicadorBase !== null) {
    const obj = multiplicadorBase;
    const base = Number(obj.base ?? obj.multiplicadorBase ?? 2);
    const extra = obj.extra ?? obj.multiplicadorExtra ?? 0;
    return calcularMultiplicadorDanoCritico(base, extra);
  }

  const base = Number(multiplicadorBase) || 2;

  if (Array.isArray(multiplicadorExtra)) {
    const somaExtras = multiplicadorExtra.reduce((acc, val) => acc + (Number(val) || 0), 0);
    return base + somaExtras;
  }

  const extra = Number(multiplicadorExtra) || 0;
  return base + extra;
}

/**
 * Trava Absoluta de Dupla Inaptidão do Mighty Blade 3e:
 * Se duas ou mais condições impuserem Inaptidão no mesmo teste (ex: estar Distraído E usar arma com FN > Força),
 * a ação falha automaticamente (0% de chance de sucesso, falhaAutomatica: true, duplaInaptidao: true)
 * sem necessidade de rolagem.
 *
 * @param {Array|number|Set|object} fontesInaptidao Lista de fontes, quantidade de fontes ou objeto com contexto
 * @param {object} [opcoes={}] Opções adicionais (contexto de ação, itens, atributos)
 * @returns {{
 *   duplaInaptidao: boolean,
 *   falhaAutomatica: boolean,
 *   chanceSucesso: number,
 *   permitida: boolean,
 *   podeRolar: boolean,
 *   totalFontes: number,
 *   fontes: string[],
 *   mensagem: string
 * }}
 */
export function verificarDuplaInaptidao(fontesInaptidao, opcoes = {}) {
  let fontes = [];

  if (typeof fontesInaptidao === "number") {
    const count = Math.max(0, Math.floor(fontesInaptidao));
    fontes = Array.from({ length: count }, (_, i) => `Fonte de Inaptidão ${i + 1}`);
  } else if (Array.isArray(fontesInaptidao)) {
    fontes = fontesInaptidao
      .filter((f) => {
        if (!f) return false;
        if (typeof f === "string") return f.trim().length > 0;
        if (typeof f === "object") {
          if (f.ativo === false || f.inapto === false) return false;
          return true;
        }
        return Boolean(f);
      })
      .map((f) => (typeof f === "string" ? f : f.nome || f.name || f.tipo || f.motivo || "Fonte de Inaptidão"));
  } else if (fontesInaptidao instanceof Set) {
    fontes = Array.from(fontesInaptidao).map((f) =>
      typeof f === "string" ? f : f.nome || f.name || "Fonte de Inaptidão"
    );
  } else if (fontesInaptidao && typeof fontesInaptidao === "object") {
    // Pode ser um Ator ou objeto com fontes/condicoes
    if (Array.isArray(fontesInaptidao.fontes)) {
      return verificarDuplaInaptidao(fontesInaptidao.fontes, opcoes);
    }

    // Se for um Actor (ou estrutura mock de Actor)
    const actor = fontesInaptidao;
    const condicoesAtor = [];

    // Checar condições do ator
    const conditions = actor.system?.conditions || actor.conditions || [];
    if (Array.isArray(conditions)) {
      for (const cond of conditions) {
        const nomeNorm = String(cond.name || cond.id || cond)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        if (
          nomeNorm.includes("distraido") ||
          nomeNorm.includes("cego") ||
          nomeNorm.includes("exausto")
        ) {
          condicoesAtor.push(cond.name || cond.id || cond);
        }
      }
    }

    // Checar se o ator tem método temCondicao
    if (typeof actor.temCondicao === "function") {
      if (actor.temCondicao("Distraído") && !condicoesAtor.some((c) => String(c).toLowerCase().includes("distraido"))) {
        condicoesAtor.push("Distraído");
      }
      if (actor.temCondicao("Cego") && !condicoesAtor.some((c) => String(c).toLowerCase().includes("cego"))) {
        condicoesAtor.push("Cego");
      }
      if (actor.temCondicao("Exausto") && !condicoesAtor.some((c) => String(c).toLowerCase().includes("exausto"))) {
        condicoesAtor.push("Exausto");
      }
    }

    // Checar Força Necessária (FN) de arma / armadura no contexto
    const item = opcoes.item || opcoes.arma || opcoes.equipamento;
    if (item) {
      const forca = Number(
        actor.system?.attributes?.forca?.value ?? actor.system?.attributes?.forca?.base ?? 0
      );
      const fn = Number(item.system?.fn ?? item.fn ?? 0);
      if (fn > forca) {
        condicoesAtor.push(`FN Excessiva (${item.name || "Equipamento"}: FN ${fn} > Força ${forca})`);
      }
    }

    if (actor.system?.equipamento?.inaptoArmadura) {
      condicoesAtor.push("Armadura com FN inadequada");
    }

    if (Array.isArray(opcoes.fontesExtras)) {
      condicoesAtor.push(...opcoes.fontesExtras);
    }

    fontes = condicoesAtor;
  }

  const totalFontes = fontes.length;
  const duplaInaptidao = totalFontes >= 2;

  return {
    duplaInaptidao,
    falhaAutomatica: duplaInaptidao,
    chanceSucesso: duplaInaptidao ? 0 : (totalFontes === 1 ? null : 1),
    permitida: !duplaInaptidao,
    podeRolar: !duplaInaptidao,
    totalFontes,
    fontes,
    mensagem: duplaInaptidao
      ? "Trava Absoluta de Dupla Inaptidão: a ação falha automaticamente sem rolagem (0% de chance de sucesso)."
      : totalFontes === 1
      ? "Inaptidão simples: personagem rola 1d6 e bônus extras de dados convertem-se em +2 fixo."
      : "Nenhuma inaptidão ativa.",
  };
}

/**
 * Avalia uma rolagem de dados no sistema Mighty Blade 3e.
 *
 * Processa:
 * - Critérios de Sucesso Decisivo (2 ou mais dados 6).
 * - Benefícios de Sucesso Decisivo em Magia (escolha estrita de exatamente 1).
 * - Multiplicador de dano em Ataques Físicos e Magias (com adição de multiplicadores).
 * - Falha Crítica (todos os dados 1) e efeito colateral grave.
 * - Integração com Trava de Dupla Inaptidão (bloqueia rolagem e impõe falha automática).
 *
 * @param {number[]|number|object} dadosRolados Array de números rolados nos dados (ex: [6, 6], [1, 1])
 * @param {number} [modificadorAtributo=0] Modificador do atributo testado
 * @param {object} [opcoes={}] Configurações adicionais
 * @param {number} [opcoes.dificuldade] Dificuldade do teste (DV)
 * @param {number} [opcoes.dv] Sinônimo de dificuldade
 * @param {number} [opcoes.bonus] Bônus fixo aplicado à soma
 * @param {string} [opcoes.tipo="geral"] "magia", "ataque", "fisico", "geral"
 * @param {boolean} [opcoes.isMagia=false] Indica se a rolagem é de conjuração de magia
 * @param {string} [opcoes.beneficioMagia] Escolha de benefício no crítico de magia
 * @param {number} [opcoes.multiplicadorExtra=0] Multiplicador extra de habilidade (ex: Ataque Devastador)
 * @param {boolean} [opcoes.duplaInaptidao=false] Sinalizador explícito de dupla inaptidão
 * @param {Array|object} [opcoes.fontesInaptidao] Lista/contexto de fontes de inaptidão
 * @param {string} [opcoes.efeitoColateral] Descrição de efeito colateral personalizado
 * @returns {object} Resultado completo da rolagem
 */
export function avaliarRolagemDados(dadosRolados, modificadorAtributo = 0, opcoes = {}) {
  const modAtributo = Number(modificadorAtributo) || 0;
  const bonus = Number(opcoes.bonus || opcoes.bonusFixo || 0);

  // 1. Verificação de Dupla Inaptidão prévia
  if (opcoes.duplaInaptidao === true) {
    return {
      dados: [],
      faces: [],
      somaDados: 0,
      modificadorAtributo: modAtributo,
      bonus,
      total: 0,
      sucesso: false,
      falhaAutomatica: true,
      duplaInaptidao: true,
      sucessoDecisivo: false,
      acertoCritico: false,
      falhaCritica: false,
      efeitoColateralGrave: false,
      chanceSucesso: 0,
      podeRolar: false,
      multiplicadorDano: 0,
      custoZeroPM: false,
      danoMultiplicado2: false,
      areaOuDuracaoMultiplicada2: false,
      motivo: "Trava Absoluta de Dupla Inaptidão: a ação falha automaticamente sem rolagem.",
    };
  }

  if (opcoes.fontesInaptidao) {
    const checagemDupla = verificarDuplaInaptidao(opcoes.fontesInaptidao, opcoes);
    if (checagemDupla.duplaInaptidao) {
      return {
        dados: [],
        faces: [],
        somaDados: 0,
        modificadorAtributo: modAtributo,
        bonus,
        total: 0,
        sucesso: false,
        falhaAutomatica: true,
        duplaInaptidao: true,
        sucessoDecisivo: false,
        acertoCritico: false,
        falhaCritica: false,
        efeitoColateralGrave: false,
        chanceSucesso: 0,
        podeRolar: false,
        multiplicadorDano: 0,
        custoZeroPM: false,
        danoMultiplicado2: false,
        areaOuDuracaoMultiplicada2: false,
        fontesInaptidao: checagemDupla.fontes,
        motivo: checagemDupla.mensagem,
      };
    }
  }

  // 2. Extração das faces roladas
  let faces = [];
  if (Array.isArray(dadosRolados)) {
    faces = dadosRolados.map((d) => (typeof d === "number" ? d : Number(d?.result ?? d?.value ?? d)));
  } else if (typeof dadosRolados === "number") {
    faces = [dadosRolados];
  } else if (dadosRolados && typeof dadosRolados === "object") {
    if (Array.isArray(dadosRolados.faces)) {
      faces = dadosRolados.faces.map(Number);
    } else if (Array.isArray(dadosRolados.results)) {
      faces = dadosRolados.results.map((r) => Number(r.result ?? r));
    } else if (dadosRolados.dice?.[0]?.results) {
      faces = dadosRolados.dice[0].results.map((r) => Number(r.result));
    }
  }

  const somaDados = faces.reduce((acc, val) => acc + val, 0);
  const total = somaDados + modAtributo + bonus;

  // 3. Critérios de Sucesso Decisivo (2 ou mais dados resultam em 6)
  const seis = faces.filter((f) => f === 6).length;
  const sucessoDecisivo = seis >= CRITERIO_CRITICO_MIN_SEIS;
  const acertoCritico = sucessoDecisivo;

  // 4. Critérios de Falha Crítica (todos os dados rolados resultam em 1)
  const falhaCritica = faces.length > 0 && faces.every((f) => f === CRITERIO_FALHA_CRITICA_VALOR);

  // 5. Determinação de sucesso / falha
  let sucesso = null;
  let falhaAutomatica = false;
  let efeitoColateralGrave = false;
  let efeitoColateral = null;

  if (falhaCritica) {
    sucesso = false;
    falhaAutomatica = true;
    efeitoColateralGrave = true;
    efeitoColateral =
      opcoes.efeitoColateral ||
      "Efeito colateral grave: falha desastrosa com perda de equilíbrio, quebra de concentração ou ricochete.";
  } else if (sucessoDecisivo) {
    sucesso = true;
    falhaAutomatica = false;
  } else {
    const diff = opcoes.dificuldade ?? opcoes.dv;
    if (diff !== undefined && diff !== null) {
      sucesso = total >= Number(diff);
    }
  }

  // 6. Benefícios de Magia ou Ataque Físico
  const isMagia = Boolean(
    opcoes.isMagia ||
      opcoes.tipo === "magia" ||
      opcoes.tipo === "magico" ||
      opcoes.magia === true
  );

  let custoZeroPM = false;
  let danoMultiplicado2 = false;
  let areaOuDuracaoMultiplicada2 = false;
  let multiplicadorDano = 1;
  let beneficioEscolhido = null;

  if (sucessoDecisivo) {
    if (isMagia) {
      const escolhaBruta =
        opcoes.beneficioMagia ?? opcoes.escolhaCriticoMagia ?? opcoes.beneficio ?? opcoes.escolha;
      const escolha = normalizarBeneficioMagia(escolhaBruta);

      if (escolha) {
        if (escolha === BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM) {
          custoZeroPM = true;
          beneficioEscolhido = BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM;
        } else if (escolha === BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2) {
          danoMultiplicado2 = true;
          beneficioEscolhido = BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2;
          multiplicadorDano = calcularMultiplicadorDanoCritico(2, opcoes.multiplicadorExtra);
        } else if (escolha === BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2) {
          areaOuDuracaoMultiplicada2 = true;
          beneficioEscolhido = BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2;
        } else {
          throw new Error(
            `Benefício de magia inválido: "${escolha}". Escolha exatamente 1 entre: ` +
              `${BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM}, ${BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2}, ` +
              `${BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2}.`
          );
        }
      }
    } else {
      // Ataque Físico padrão
      danoMultiplicado2 = true;
      multiplicadorDano = calcularMultiplicadorDanoCritico(2, opcoes.multiplicadorExtra);
    }
  }

  return {
    dados: faces,
    faces,
    somaDados,
    modificadorAtributo: modAtributo,
    bonus,
    total,
    sucesso,
    sucessoDecisivo,
    acertoCritico,
    falhaCritica,
    falhaAutomatica,
    efeitoColateralGrave,
    efeitoColateral,
    duplaInaptidao: false,
    danoMultiplicado2,
    multiplicadorDano,
    custoZeroPM,
    areaOuDuracaoMultiplicada2,
    beneficioEscolhido,
    beneficiosDisponiveisMagia: isMagia && sucessoDecisivo
      ? [
          BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM,
          BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2,
          BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2,
        ]
      : null,
  };
}

/**
 * Normaliza os dados de um participante em um confronto oposto.
 * @param {object|number} participante
 * @param {string} [fallbackNome="Participante"]
 * @param {object} [opcoes={}]
 * @returns {object}
 */
function normalizarParticipante(participante, fallbackNome = "Participante", opcoes = {}) {
  if (typeof participante === "number") {
    return {
      nome: fallbackNome,
      total: participante,
      atributo: 0,
      somaDados: participante,
      sucessoDecisivo: false,
      acertoCritico: false,
      falhaCritica: false,
      falhaAutomatica: false,
      dados: [],
    };
  }

  const dados = Array.isArray(participante?.dados)
    ? participante.dados
    : Array.isArray(participante?.faces)
    ? participante.faces
    : [];

  const seis = dados.filter((d) => d === 6).length;
  const todosUns = dados.length > 0 && dados.every((d) => d === 1);

  const sucessoDecisivo = Boolean(
    participante?.sucessoDecisivo ??
      participante?.acertoCritico ??
      participante?.critSuccess ??
      seis >= CRITERIO_CRITICO_MIN_SEIS
  );

  const falhaCritica = Boolean(
    participante?.falhaCritica ?? participante?.critFailure ?? todosUns
  );

  const falhaAutomatica = Boolean(
    participante?.falhaAutomatica ?? participante?.duplaInaptidao ?? falhaCritica
  );

  // Atributo: suporta atributo direto ou extração do sistema do ator
  let atributo = Number(
    participante?.atributo ??
      participante?.modificadorAtributo ??
      participante?.valorAtributo ??
      0
  );

  if (!atributo && participante?.system?.attributes) {
    const nomeAttr = opcoes.atributo || "forca";
    const attrObj = participante.system.attributes[nomeAttr];
    atributo = Number(attrObj?.value ?? attrObj?.base ?? 0);
  }

  const somaDados = participante?.somaDados ?? dados.reduce((a, b) => a + b, 0);
  const total = Number(
    participante?.total ?? (somaDados + atributo + (Number(participante?.bonus) || 0))
  );

  const nome = participante?.nome ?? participante?.name ?? fallbackNome;

  return {
    ...participante,
    nome,
    dados,
    somaDados,
    sucessoDecisivo,
    acertoCritico: sucessoDecisivo,
    falhaCritica,
    falhaAutomatica,
    atributo,
    total,
  };
}

/**
 * Resolução Canônica de Confrontos Opostos e Empates no Mighty Blade 3e:
 *
 * 1. Um Sucesso Decisivo em um confronto vence automaticamente qualquer resultado que não seja Sucesso Decisivo.
 * 2. Se ambos obtiverem Sucesso Decisivo (ou ambos normais), vence a maior soma total (Dados + Atributo).
 * 3. Em caso de empate na soma, vence o personagem com o Atributo mais alto.
 * 4. Se o Atributo for idêntico, cada um rola 1d6 para desempate rápido.
 *
 * @param {object|number} resultadoA Resultado do participante A (ou objeto avaliarRolagemDados)
 * @param {object|number} resultadoB Resultado do participante B (ou objeto avaliarRolagemDados)
 * @param {object} [opcoes={}] Configurações de confronto e dados determinísticos de desempate
 * @param {string} [opcoes.nomeA="Participante A"] Nome do participante A
 * @param {string} [opcoes.nomeB="Participante B"] Nome do participante B
 * @param {number} [opcoes.dadoDesempateA] Valor de 1d6 injetado para desempate de A (para testes determinísticos)
 * @param {number} [opcoes.dadoDesempateB] Valor de 1d6 injetado para desempate de B (para testes determinísticos)
 * @param {string} [opcoes.atributo] Nome do atributo a extrair caso atores sejam passados
 * @returns {{
 *   vencedor: "A"|"B"|"empate",
 *   vencedorNome: string|null,
 *   perdedorNome: string|null,
 *   vencedorParticipante: object|null,
 *   perdedorParticipante: object|null,
 *   empate: boolean,
 *   motivo: string,
 *   detalhe: string,
 *   participanteA: object,
 *   participanteB: object,
 *   dadosDesempate?: { a: number, b: number }
 * }}
 */
export function resolverConfrontoOposto(resultadoA, resultadoB, opcoes = {}) {
  const partA = normalizarParticipante(resultadoA, opcoes.nomeA || "Participante A", opcoes);
  const partB = normalizarParticipante(resultadoB, opcoes.nomeB || "Participante B", opcoes);

  // Regra Preliminar: Falha Automática / Falha Crítica / Dupla Inaptidão
  if (partA.falhaAutomatica && !partB.falhaAutomatica) {
    return {
      vencedor: "B",
      vencedorNome: partB.nome,
      perdedorNome: partA.nome,
      vencedorParticipante: partB,
      perdedorParticipante: partA,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.FALHA_AUTOMATICA_OPONENTE,
      detalhe: `${partA.nome} sofreu Falha Automática/Crítica, concedendo a vitória a ${partB.nome}.`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  if (partB.falhaAutomatica && !partA.falhaAutomatica) {
    return {
      vencedor: "A",
      vencedorNome: partA.nome,
      perdedorNome: partB.nome,
      vencedorParticipante: partA,
      perdedorParticipante: partB,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.FALHA_AUTOMATICA_OPONENTE,
      detalhe: `${partB.nome} sofreu Falha Automática/Crítica, concedendo a vitória a ${partA.nome}.`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  // 1. Um Sucesso Decisivo em um confronto vence automaticamente qualquer resultado que não seja Sucesso Decisivo.
  if (partA.sucessoDecisivo && !partB.sucessoDecisivo) {
    return {
      vencedor: "A",
      vencedorNome: partA.nome,
      perdedorNome: partB.nome,
      vencedorParticipante: partA,
      perdedorParticipante: partB,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.SUCESSO_DECISIVO,
      detalhe: `Sucesso Decisivo de ${partA.nome} vence automaticamente resultado sem Sucesso Decisivo.`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  if (partB.sucessoDecisivo && !partA.sucessoDecisivo) {
    return {
      vencedor: "B",
      vencedorNome: partB.nome,
      perdedorNome: partA.nome,
      vencedorParticipante: partB,
      perdedorParticipante: partA,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.SUCESSO_DECISIVO,
      detalhe: `Sucesso Decisivo de ${partB.nome} vence automaticamente resultado sem Sucesso Decisivo.`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  // 2. Se ambos obtiverem Sucesso Decisivo (ou ambos normais), vence a maior soma total (Dados + Atributo).
  if (partA.total > partB.total) {
    return {
      vencedor: "A",
      vencedorNome: partA.nome,
      perdedorNome: partB.nome,
      vencedorParticipante: partA,
      perdedorParticipante: partB,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.MAIOR_TOTAL,
      detalhe: `${partA.nome} vence por maior soma total (${partA.total} vs ${partB.total}).`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  if (partB.total > partA.total) {
    return {
      vencedor: "B",
      vencedorNome: partB.nome,
      perdedorNome: partA.nome,
      vencedorParticipante: partB,
      perdedorParticipante: partA,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.MAIOR_TOTAL,
      detalhe: `${partB.nome} vence por maior soma total (${partB.total} vs ${partA.total}).`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  // 3. Em caso de empate na soma, vence o personagem com o Atributo mais alto.
  if (partA.atributo > partB.atributo) {
    return {
      vencedor: "A",
      vencedorNome: partA.nome,
      perdedorNome: partB.nome,
      vencedorParticipante: partA,
      perdedorParticipante: partB,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.MAIOR_ATRIBUTO,
      detalhe: `Empate na soma total (${partA.total}). ${partA.nome} vence pelo atributo mais alto (${partA.atributo} vs ${partB.atributo}).`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  if (partB.atributo > partA.atributo) {
    return {
      vencedor: "B",
      vencedorNome: partB.nome,
      perdedorNome: partA.nome,
      vencedorParticipante: partB,
      perdedorParticipante: partA,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.MAIOR_ATRIBUTO,
      detalhe: `Empate na soma total (${partB.total}). ${partB.nome} vence pelo atributo mais alto (${partB.atributo} vs ${partA.atributo}).`,
      participanteA: partA,
      participanteB: partB,
    };
  }

  // 4. Se o Atributo for idêntico, cada um rola 1d6 para desempate rápido.
  let dadoA = opcoes.dadoDesempateA ?? opcoes.desempateA;
  let dadoB = opcoes.dadoDesempateB ?? opcoes.desempateB;

  if (dadoA === undefined || dadoB === undefined) {
    dadoA = Math.floor(Math.random() * 6) + 1;
    dadoB = Math.floor(Math.random() * 6) + 1;
  }

  dadoA = Number(dadoA);
  dadoB = Number(dadoB);

  if (dadoA > dadoB) {
    return {
      vencedor: "A",
      vencedorNome: partA.nome,
      perdedorNome: partB.nome,
      vencedorParticipante: partA,
      perdedorParticipante: partB,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.DESEMPATE_1D6,
      detalhe: `Empate na soma (${partA.total}) e atributos idênticos (${partA.atributo}). ${partA.nome} vence no desempate de 1d6 (${dadoA} vs ${dadoB}).`,
      dadosDesempate: { a: dadoA, b: dadoB },
      participanteA: partA,
      participanteB: partB,
    };
  }

  if (dadoB > dadoA) {
    return {
      vencedor: "B",
      vencedorNome: partB.nome,
      perdedorNome: partA.nome,
      vencedorParticipante: partB,
      perdedorParticipante: partA,
      empate: false,
      motivo: MOTIVOS_VITORIA_CONFRONTO.DESEMPATE_1D6,
      detalhe: `Empate na soma (${partB.total}) e atributos idênticos (${partB.atributo}). ${partB.nome} vence no desempate de 1d6 (${dadoB} vs ${dadoA}).`,
      dadosDesempate: { a: dadoA, b: dadoB },
      participanteA: partA,
      participanteB: partB,
    };
  }

  return {
    vencedor: "empate",
    vencedorNome: null,
    perdedorNome: null,
    vencedorParticipante: null,
    perdedorParticipante: null,
    empate: true,
    motivo: MOTIVOS_VITORIA_CONFRONTO.EMPATE,
    detalhe: `Empate estrito na soma (${partA.total}), atributo (${partA.atributo}) e desempate de 1d6 (${dadoA} vs ${dadoB}).`,
    dadosDesempate: { a: dadoA, b: dadoB },
    participanteA: partA,
    participanteB: partB,
  };
}
