/**
 * Módulo de Regras Canônicas de Fabricação (Crafting), Mineração e Avaliação de Itens.
 * Mighty Blade 3ª Edição (Guia do Herói, Cap. IV: Equipamento, pág. 47–56).
 *
 * Implementa as regras oficiais:
 * - Subtítulo 26.1: Tabela Canônica de Produção de Itens (Artesão)
 *   * <= 6 (ou Falha Crítica): Falha no trabalho (sucesso: false, qualidade: "falha").
 *     Perde de 50% a 100% das matérias-primas e quebra ferramentas em falhas críticas.
 *   * 7 a 9: Produz item de Qualidade Baixa (qualidade: "baixa", sucesso: true).
 *   * 10 a 15: Produz item de Qualidade Mediana (qualidade: "mediana", sucesso: true).
 *   * 16 a 20: Produz item de Qualidade Alta (qualidade: "alta", +2 na Dificuldade para encantar).
 *   * >= 21: Produz uma Obra-Prima (qualidade: "obra-prima").
 * - Subtítulo 26.2: Dedicação de Tempo e Bônus
 *   * Gastar o dobro do tempo necessário concede +2 no teste de fabricação.
 * - Subtítulo 26.3: Desmontagem e Reaproveitamento de Materiais
 *   * Destruir um item fornece exatamente metade (50%) do material necessário para produzir um novo.
 * - Subtítulo 26.4: Sistema de Avaliação de Itens (pág. 53)
 *   * Exame de 1 minuto + teste de Inteligência:
 *     - 10+: Identifica qualidade (baixa, mediana, alta, obra-prima) e se foi consertado/modificado.
 *     - 14+: Identifica quantidade de pessoas e se foi feito no tempo normal ou dobro do tempo.
 *     - 18+: Identifica se possui propriedades mágicas e tipo geral de encantamento.
 * - Subtítulo 26.5: Prospeção, Garimpagem e Mineração (pág. 48–49)
 *   * Procura de jazida: Inteligência Dif 16 (1 dia). Preciosos exigem sucesso decisivo.
 *   * Extração: Garimpagem (Força/dia) vs Mineração (Força/semana).
 */

/* ------------------------------------------------------------------------- */
/* CONSTANTES E TABELAS CANÔNICAS                                            */
/* ------------------------------------------------------------------------- */

export const BONUS_DEDICACAO_TEMPO = 2;
export const FATOR_MATERIAL_DESMONTAGEM = 0.5;
export const FATOR_CUSTO_MATERIA_PRIMA = 0.5;
export const FATOR_CONSERTO_TEMPO = 0.5;
export const FATOR_CONSERTO_MATERIAL = 0.5;

export const DIFICULDADE_PROCURAR_JAZIDA = 16;
export const DIFICULDADE_TESTE_QUEBRA_BAIXA = 12;

export const DIFICULDADE_AVALIACAO_QUALIDADE = 10;
export const DIFICULDADE_AVALIACAO_HISTORICO = 14;
export const DIFICULDADE_AVALIACAO_MAGICA = 18;

/**
 * Áreas de produção canônicas de Drakon (Guia do Herói, pág. 49–52).
 */
export const AREAS_PRODUCAO_CANONICAS = {
  alvenaria: {
    id: "alvenaria",
    nome: "Alvenaria",
    atributos: ["forca"],
    ferramentas: "instrumentos-alvenaria",
    reparavel: true,
    unidadeTempoPadrao: "dias-por-decimo-custo",
  },
  arte: {
    id: "arte",
    nome: "Arte",
    atributos: ["inteligencia", "vontade"],
    ferramentas: "kit-escrita",
    reparavel: false,
    unidadeTempoPadrao: "dias",
  },
  ceramica: {
    id: "ceramica",
    nome: "Cerâmica",
    atributos: ["agilidade", "inteligencia"],
    ferramentas: "instrumentos-ceramica",
    reparavel: false,
    unidadeTempoPadrao: "dias",
  },
  correaria: {
    id: "correaria",
    nome: "Correaria",
    atributos: ["agilidade", "inteligencia"],
    ferramentas: "instrumentos-costura",
    reparavel: true,
    unidadeTempoPadrao: "dias-fn",
  },
  engenharia: {
    id: "engenharia",
    nome: "Engenharia",
    atributos: ["inteligencia"],
    ferramentas: "instrumentos-precisao",
    reparavel: true,
    unidadeTempoPadrao: "variavel",
  },
  entalhe: {
    id: "entalhe",
    nome: "Entalhe",
    atributos: ["forca", "agilidade"],
    ferramentas: "instrumentos-talha",
    reparavel: true,
    unidadeTempoPadrao: "dias-fn",
  },
  ferraria: {
    id: "ferraria",
    nome: "Ferraria",
    atributos: ["forca"],
    ferramentas: "instrumentos-forja",
    reparavel: true,
    unidadeTempoPadrao: "dias-fn",
  },
  marcenaria: {
    id: "marcenaria",
    nome: "Marcenaria",
    atributos: ["forca"],
    ferramentas: "instrumentos-talha",
    reparavel: true,
    unidadeTempoPadrao: "dias-fn",
  },
  mecanica: {
    id: "mecanica",
    nome: "Mecânica",
    atributos: ["agilidade", "inteligencia"],
    ferramentas: "instrumentos-precisao",
    reparavel: true,
    unidadeTempoPadrao: "dias",
  },
  ourivesaria: {
    id: "ourivesaria",
    nome: "Ourivesaria",
    atributos: ["inteligencia"],
    ferramentas: "instrumentos-precisao",
    reparavel: true,
    unidadeTempoPadrao: "dias-por-cinco-moedas",
  },
};

/**
 * Dados de modificadores canônicos das qualidades de itens (Guia do Herói, pág. 53–54).
 */
export const QUALIDADES_ITEM = {
  falha: {
    id: "falha",
    nome: "Falha na Produção",
    sucesso: false,
    multiplicadorPreco: 0,
    ataque: 0,
    bonusAtaque: 0,
    dano: 0,
    bonusDano: 0,
    defesa: 0,
    modDefesa: 0,
    fn: 0,
    modFN: 0,
    bonusTestes: 0,
    dificuldadeEncantarMod: 0,
    riscoQuebra: false,
  },
  baixa: {
    id: "baixa",
    nome: "Qualidade Baixa",
    sucesso: true,
    multiplicadorPreco: 0.5,
    ataque: 0,
    bonusAtaque: 0,
    dano: -1,
    bonusDano: -1,
    defesa: -1,
    modDefesa: -1,
    fn: 0,
    modFN: 0,
    bonusTestes: 0,
    dificuldadeEncantarMod: 0,
    riscoQuebra: true,
    cdTesteQuebra: 12,
  },
  mediana: {
    id: "mediana",
    nome: "Qualidade Mediana",
    sucesso: true,
    multiplicadorPreco: 1.0,
    ataque: 0,
    bonusAtaque: 0,
    dano: 0,
    bonusDano: 0,
    defesa: 0,
    modDefesa: 0,
    fn: 0,
    modFN: 0,
    bonusTestes: 0,
    dificuldadeEncantarMod: 0,
    riscoQuebra: false,
  },
  alta: {
    id: "alta",
    nome: "Qualidade Alta",
    sucesso: true,
    multiplicadorPreco: 3.0,
    ataque: 1,
    bonusAtaque: 1,
    dano: 0,
    bonusDano: 0,
    defesa: 0,
    modDefesa: 0,
    fn: -1,
    modFN: -1,
    bonusTestes: 1,
    dificuldadeEncantarMod: 2,
    riscoQuebra: false,
  },
  "obra-prima": {
    id: "obra-prima",
    nome: "Obra-Prima",
    sucesso: true,
    multiplicadorPreco: 10.0,
    ataque: 1,
    bonusAtaque: 1,
    dano: 1,
    bonusDano: 1,
    defesa: 1,
    modDefesa: 1,
    fn: -1,
    modFN: -1,
    bonusTestes: 2,
    dificuldadeEncantarMod: 2,
    riscoQuebra: false,
  },
};

/**
 * Propriedades canônicas dos materiais especiais (Guia do Herói, pág. 54–56).
 */
export const MATERIAIS_ESPECIAIS = {
  aco: {
    id: "aco",
    nome: "Aço Comum",
    multiplicadorCusto: 1.0,
    modDano: 0,
    modDefesa: 0,
    modFN: 0,
    multiplicadorTempo: 1.0,
  },
  "aco-anao": {
    id: "aco-anao",
    nome: "Aço Anão",
    multiplicadorCusto: 1.5,
    modDano: 1,
    modDefesa: 1,
    modFN: 0,
    multiplicadorTempo: 1.5,
  },
  bronze: {
    id: "bronze",
    nome: "Bronze",
    multiplicadorCusto: 3.0,
    modDano: -1,
    modDefesa: 0,
    modFN: 1,
    multiplicadorTempo: 0.5,
    impedeObraPrima: true,
  },
  crisol: {
    id: "crisol",
    nome: "Aço Crisol",
    multiplicadorCusto: 2.0,
    modDano: 0,
    modDefesa: 0,
    modFN: -1,
    multiplicadorTempo: 2.0,
    impedeQualidadeBaixa: true,
  },
  "prata-fria": {
    id: "prata-fria",
    nome: "Prata Fria",
    multiplicadorCusto: 2.0,
    modDano: 1,
    modDefesa: 0,
    modFN: 0,
    multiplicadorTempo: 1.0,
  },
};

/* ------------------------------------------------------------------------- */
/* FUNÇÕES PRINCIPAIS DE FABRICAÇÃO (CRAFTING)                               */
/* ------------------------------------------------------------------------- */

/**
 * Avalia o resultado de um teste de fabricação de item de acordo com a
 * Tabela Canônica de Produção de Itens (Guia do Herói, pág. 52–53).
 *
 * Faixas canônicas:
 * - <= 6 (ou Falha Crítica): Falha no trabalho (sucesso: false, qualidade: "falha").
 *   * Perde de 50% a 100% das matérias-primas e quebra ferramentas em falhas críticas.
 * - 7 a 9: Produz item de Qualidade Baixa (qualidade: "baixa", sucesso: true).
 *   * Exceção canônica: Crisol nunca pode ser de qualidade baixa (vira mediana).
 * - 10 a 15: Produz item de Qualidade Mediana (qualidade: "mediana", sucesso: true).
 * - 16 a 20: Produz item de Qualidade Alta (qualidade: "alta", +2 na Dificuldade para encantar).
 * - >= 21: Produz uma Obra-Prima (qualidade: "obra-prima").
 *   * Exceção canônica: Bronze nunca pode ser obra-prima (fica restrito a alta).
 *
 * @param {number} resultadoTeste Total obtido no teste de produção (Inteligência ou Força).
 * @param {object} [opcoes={}] Opções de contexto.
 * @param {boolean} [opcoes.falhaCritica=false] Se foi rolada falha crítica explícita.
 * @param {string|boolean} [opcoes.critico=false] Se houve sucesso ou falha crítica.
 * @param {string} [opcoes.material="aco"] Material utilizado (ex: "crisol", "bronze", "aco-anao").
 * @param {number} [opcoes.perdaMateriaPrima] Override explícito da perda de material (0.5 a 1.0).
 * @param {boolean} [opcoes.ferramentasQuebradas] Override explícito de ferramentas quebradas.
 * @returns {object} Resultado detalhado da produção.
 */
export function avaliarResultadoProducao(resultadoTeste, opcoes = {}) {
  const valor = Number(resultadoTeste) || 0;
  const materialKey = String(opcoes.material || "").toLowerCase().trim();
  const materialInfo = MATERIAIS_ESPECIAIS[materialKey] || null;

  const isFalhaCritica = Boolean(
    opcoes.falhaCritica ||
    opcoes.critico === "falha" ||
    (opcoes.critico === true && valor <= 6)
  );

  // <= 6 ou Falha Crítica: Falha no trabalho
  if (isFalhaCritica || valor <= 6) {
    const perdaMateriaPrima = opcoes.perdaMateriaPrima !== undefined
      ? Number(opcoes.perdaMateriaPrima)
      : (isFalhaCritica ? 1.0 : 0.5);

    const ferramentasQuebradas = opcoes.ferramentasQuebradas !== undefined
      ? Boolean(opcoes.ferramentasQuebradas)
      : isFalhaCritica;

    return {
      sucesso: false,
      qualidade: "falha",
      resultadoTeste: valor,
      falhaCritica: isFalhaCritica,
      perdaMateriaPrima,
      ferramentasQuebradas,
      multiplicadorPreco: 0,
      dificuldadeEncantarMod: 0,
      dificuldadeEncantar: 0,
      dificuldadeEncantamento: 0,
      modificadores: { ...QUALIDADES_ITEM.falha },
      mensagem: isFalhaCritica
        ? "Falha Crítica! Você perdeu 100% da matéria-prima e quebrou suas ferramentas de trabalho."
        : "O trabalho não foi concluído com sucesso. Você perdeu metade da matéria-prima.",
    };
  }

  // 7 a 9: Qualidade Baixa (ou mediana se crisol)
  if (valor >= 7 && valor <= 9) {
    let qualidade = "baixa";
    let mensagem = "Você produziu um item de qualidade baixa.";

    if (materialInfo?.impedeQualidadeBaixa || materialKey === "crisol") {
      qualidade = "mediana";
      mensagem = "Aço Crisol não aceita qualidade baixa: item produzido com qualidade mediana.";
    }

    const dadosQualidade = QUALIDADES_ITEM[qualidade];

    return {
      sucesso: true,
      qualidade,
      resultadoTeste: valor,
      falhaCritica: false,
      perdaMateriaPrima: 0,
      ferramentasQuebradas: false,
      multiplicadorPreco: dadosQualidade.multiplicadorPreco,
      dificuldadeEncantarMod: dadosQualidade.dificuldadeEncantarMod,
      dificuldadeEncantar: dadosQualidade.dificuldadeEncantarMod,
      dificuldadeEncantamento: dadosQualidade.dificuldadeEncantarMod,
      modificadores: { ...dadosQualidade },
      mensagem,
    };
  }

  // 10 a 15: Qualidade Mediana
  if (valor >= 10 && valor <= 15) {
    const dadosQualidade = QUALIDADES_ITEM.mediana;

    return {
      sucesso: true,
      qualidade: "mediana",
      resultadoTeste: valor,
      falhaCritica: false,
      perdaMateriaPrima: 0,
      ferramentasQuebradas: false,
      multiplicadorPreco: dadosQualidade.multiplicadorPreco,
      dificuldadeEncantarMod: dadosQualidade.dificuldadeEncantarMod,
      dificuldadeEncantar: dadosQualidade.dificuldadeEncantarMod,
      dificuldadeEncantamento: dadosQualidade.dificuldadeEncantarMod,
      modificadores: { ...dadosQualidade },
      mensagem: "Você produziu um item comum de qualidade mediana.",
    };
  }

  // 16 a 20: Qualidade Alta (+2 em Dificuldade para encantar)
  if (valor >= 16 && valor <= 20) {
    const dadosQualidade = QUALIDADES_ITEM.alta;

    return {
      sucesso: true,
      qualidade: "alta",
      resultadoTeste: valor,
      falhaCritica: false,
      perdaMateriaPrima: 0,
      ferramentasQuebradas: false,
      multiplicadorPreco: dadosQualidade.multiplicadorPreco,
      dificuldadeEncantarMod: dadosQualidade.dificuldadeEncantarMod, // +2
      dificuldadeEncantar: dadosQualidade.dificuldadeEncantarMod,
      dificuldadeEncantamento: dadosQualidade.dificuldadeEncantarMod,
      modificadores: { ...dadosQualidade },
      mensagem: "Você produziu um item de qualidade alta! (+2 na Dificuldade para encantar).",
    };
  }

  // >= 21: Obra-Prima (ou Alta se bronze)
  let qualidade = "obra-prima";
  let mensagem = "Você produziu uma verdadeira Obra-Prima!";

  if (materialInfo?.impedeObraPrima || materialKey === "bronze") {
    qualidade = "alta";
    mensagem = "Itens de bronze não podem ser obras-primas: item produzido com qualidade alta.";
  }

  const dadosQualidade = QUALIDADES_ITEM[qualidade];

  return {
    sucesso: true,
    qualidade,
    resultadoTeste: valor,
    falhaCritica: false,
    perdaMateriaPrima: 0,
    ferramentasQuebradas: false,
    multiplicadorPreco: dadosQualidade.multiplicadorPreco,
    dificuldadeEncantarMod: dadosQualidade.dificuldadeEncantarMod, // +2
    dificuldadeEncantar: dadosQualidade.dificuldadeEncantarMod,
    dificuldadeEncantamento: dadosQualidade.dificuldadeEncantarMod,
    modificadores: { ...dadosQualidade },
    mensagem,
  };
}

/**
 * Calcula o bônus concedido por gastar tempo adicional na produção.
 * Regra Canônica: Gastar o dobro do tempo necessário concede bônus de +2 no teste de fabricação.
 *
 * @param {boolean|number|string|object} dedicacaoTempo Indicação da dedicação de tempo.
 *   - true / "dobro" / "2x" / número >= 2 / { dobro: true } => concede +2
 *   - false / 1 / "normal" / <= 1 => concede 0
 * @returns {number} Bônus a ser somado no teste (+2 ou 0).
 */
export function calcularBonusDedicacaoTempo(dedicacaoTempo) {
  if (!dedicacaoTempo) return 0;

  if (typeof dedicacaoTempo === "boolean") {
    return dedicacaoTempo ? BONUS_DEDICACAO_TEMPO : 0;
  }

  if (typeof dedicacaoTempo === "number") {
    return dedicacaoTempo >= 2 ? BONUS_DEDICACAO_TEMPO : 0;
  }

  if (typeof dedicacaoTempo === "string") {
    const s = dedicacaoTempo.trim().toLowerCase();
    if (s === "dobro" || s === "2x" || s === "2" || s === "duplo" || s.includes("dobro")) {
      return BONUS_DEDICACAO_TEMPO;
    }
    return 0;
  }

  if (typeof dedicacaoTempo === "object" && dedicacaoTempo !== null) {
    if (
      dedicacaoTempo.dobro ||
      dedicacaoTempo.dobroDoTempo ||
      dedicacaoTempo.dedicacaoDobro ||
      Number(dedicacaoTempo.fator) >= 2 ||
      Number(dedicacaoTempo.multiplicador) >= 2 ||
      Number(dedicacaoTempo.tempoGasto) >= 2 * Number(dedicacaoTempo.tempoNecessario || 1)
    ) {
      return BONUS_DEDICACAO_TEMPO;
    }
  }

  return 0;
}

/**
 * Calcula a quantidade ou custo de material reaproveitado ao destruir/desmontar um item.
 * Regra Canônica: Destruir um item fornece exatamente metade do material necessário
 * para criar um novo (50% do material/custo original).
 *
 * @param {number|object} custoOuMaterialOriginal Valor numérico ou objeto contendo custo/matéria-prima.
 * @returns {number} Valor de matéria-prima recuperada (50%).
 */
export function calcularMaterialDesmontagem(custoOuMaterialOriginal) {
  if (typeof custoOuMaterialOriginal === "number") {
    return custoOuMaterialOriginal * FATOR_MATERIAL_DESMONTAGEM;
  }

  if (typeof custoOuMaterialOriginal === "object" && custoOuMaterialOriginal !== null) {
    const base = Number(
      custoOuMaterialOriginal.materialRecuperavel ??
      custoOuMaterialOriginal.materiaPrima ??
      custoOuMaterialOriginal.materialOriginal ??
      custoOuMaterialOriginal.material ??
      custoOuMaterialOriginal.custo ??
      custoOuMaterialOriginal.preco ??
      0
    );
    return base * FATOR_MATERIAL_DESMONTAGEM;
  }

  const parsed = Number(custoOuMaterialOriginal);
  return isNaN(parsed) ? 0 : parsed * FATOR_MATERIAL_DESMONTAGEM;
}

/* ------------------------------------------------------------------------- */
/* AVALIAÇÃO DE ITENS (GUIA DO HERÓI, PÁG. 53)                               */
/* ------------------------------------------------------------------------- */

/**
 * Avalia um item através de um teste de Inteligência após exame de pelo menos 1 minuto.
 *
 * Limiares Canônicos:
 * - < 10: Falha na avaliação; nenhuma informação confiável.
 * - 10+: Identifica a qualidade (baixa, mediana, alta, obra-prima) e se já foi consertado/modificado.
 * - 14+: Identifica quantas pessoas trabalharam nele e se foi feito no tempo normal ou dobro do tempo.
 * - 18+: Identifica se possui propriedades mágicas e seu tipo geral de encantamento (mas não fórmulas exatas).
 *
 * @param {number} resultadoTeste Resultado do teste de Inteligência.
 * @param {object} [opcoes={}] Opções contextuais (ex: tempoExameMinutos).
 * @returns {object} Dados decodificados da avaliação.
 */
export function avaliarItem(resultadoTeste, opcoes = {}) {
  const resultado = Number(resultadoTeste) || 0;
  const tempoExame = Number(opcoes.tempoExameMinutos ?? 1);

  if (tempoExame < 1) {
    return {
      sucesso: false,
      grau: "tempo-insuficiente",
      resultadoTeste: resultado,
      mensagem: "O artesão precisa examinar o item por pelo menos 1 minuto antes de realizar o teste.",
      identificaQualidade: false,
      identificaHistorico: false,
      identificaMagia: false,
    };
  }

  if (resultado < DIFICULDADE_AVALIACAO_QUALIDADE) {
    return {
      sucesso: false,
      grau: "falha",
      resultadoTeste: resultado,
      tempoExameMinutos: tempoExame,
      mensagem: "O artesão não conseguiu determinar detalhes sobre a manufatura ou qualidade do item.",
      identificaQualidade: false,
      identificaHistorico: false,
      identificaMagia: false,
    };
  }

  const identificaQualidade = resultado >= DIFICULDADE_AVALIACAO_QUALIDADE; // >= 10
  const identificaHistorico = resultado >= DIFICULDADE_AVALIACAO_HISTORICO; // >= 14
  const identificaMagia = resultado >= DIFICULDADE_AVALIACAO_MAGICA;         // >= 18

  let grau = "basico";
  if (identificaMagia) {
    grau = "magico";
  } else if (identificaHistorico) {
    grau = "detalhado";
  }

  return {
    sucesso: true,
    grau,
    resultadoTeste: resultado,
    tempoExameMinutos: tempoExame,
    identificaQualidade,
    identificaHistorico,
    identificaMagia,
    detalhes: {
      qualidade: identificaQualidade,
      consertosEModificacoes: identificaQualidade,
      quantidadeArtesaos: identificaHistorico,
      dedicacaoTempo: identificaHistorico,
      propriedadesMagicas: identificaMagia,
      tipoEncantamentoGeral: identificaMagia,
      efeitosExatosConhecidos: false, // O livro ressalta: "mas não suas propriedades exatas"
    },
  };
}

/* ------------------------------------------------------------------------- */
/* MINERAÇÃO E EXTRAÇÃO MINERAL (GUIA DO HERÓI, PÁG. 48–49)                  */
/* ------------------------------------------------------------------------- */

/**
 * Realiza a prospecção de uma jazida mineral na área (1 dia de trabalho).
 * Regra: Teste de Inteligência (Dificuldade 16).
 * Materiais preciosos (ouro, prata, gemas) exigem sucesso decisivo.
 * Falha crítica resulta em falso veio e perda de 1 dia de trabalho.
 *
 * @param {number} resultadoTeste Resultado da rolagem de Inteligência.
 * @param {object} [opcoes={}] Configurações de material e rolagem crítica.
 * @returns {object} Resultado da prospecção.
 */
export function procurarJazidaMineral(resultadoTeste, opcoes = {}) {
  const valor = Number(resultadoTeste) || 0;
  const isPrecioso = Boolean(
    opcoes.precioso ||
    opcoes.raro ||
    ["ouro", "prata", "gema", "gemas"].includes(String(opcoes.material || "").toLowerCase())
  );
  const isFalhaCritica = Boolean(opcoes.falhaCritica || opcoes.critico === "falha");

  if (isFalhaCritica) {
    return {
      sucesso: false,
      encontrouJazida: false,
      falhaCritica: true,
      diasPerdidos: 1,
      mensagem: "O personagem acredita falsamente ter achado uma jazida e gasta pelo menos um dia explorando à toa.",
    };
  }

  if (valor < DIFICULDADE_PROCURAR_JAZIDA) {
    return {
      sucesso: false,
      encontrouJazida: false,
      falhaCritica: false,
      diasPerdidos: 1,
      mensagem: "Nenhum veio mineral encontrado na área explorada.",
    };
  }

  if (isPrecioso) {
    const isDecisivo = Boolean(
      opcoes.decisivo ||
      opcoes.sucessoDecisivo ||
      opcoes.critico === "decisivo" ||
      opcoes.critico === true ||
      valor >= 18
    );
    if (!isDecisivo) {
      return {
        sucesso: false,
        encontrouJazida: false,
        falhaCritica: false,
        diasPerdidos: 1,
        mensagem: "Materiais preciosos (ouro, prata ou gemas) só são encontrados com um sucesso decisivo no teste.",
      };
    }
  }

  return {
    sucesso: true,
    encontrouJazida: true,
    material: opcoes.material || (isPrecioso ? "ouro" : "ferro"),
    tempoGastoDias: 1,
    mensagem: "Veio mineral localizado com sucesso!",
  };
}

/**
 * Calcula o rendimento de extração mineral por Garimpagem, Mineração ou Aluvião.
 *
 * Fórmulas Canônicas:
 * - Materiais comuns (hulha, sílica, argila): resultado em kg.
 * - Outros materiais (metais normais): resultado / 10 em kg.
 * - Materiais raros/preciosos (ouro, prata, gemas): resultado em pepitas.
 * - Garimpagem: por dia; jazida esgota após (Inteligência) dias.
 * - Mineração: por semana; jazida esgota após (Inteligência) anos; extrai o veio completo.
 * - Aluvião (Elfos): teste de Inteligência a céu aberto com peneira; apenas 1 teste por veio.
 *
 * @param {string} metodo "garimpagem", "mineracao" ou "aluviao".
 * @param {number} resultadoTeste Resultado do teste de Força ou Inteligência.
 * @param {string} [tipoMaterial="comum"] "comum", "metal" ou "precioso".
 * @param {object} [opcoes={}] Inteligência do personagem e parâmetros adicionais.
 * @returns {object} Quantidade e métricas de extração.
 */
export function extrairMinerio(metodo, resultadoTeste, tipoMaterial = "comum", opcoes = {}) {
  const valor = Number(resultadoTeste) || 0;
  const inteligencia = Number(opcoes.inteligencia ?? opcoes.int ?? 2);
  const metodoNorm = String(metodo).toLowerCase().trim();
  const tipoNorm = String(tipoMaterial).toLowerCase().trim();

  const isComum = tipoNorm === "comum" || ["hulha", "silica", "argila"].includes(tipoNorm);
  const isPrecioso = tipoNorm === "precioso" || tipoNorm === "raro" || ["ouro", "prata", "gema", "gemas"].includes(tipoNorm);

  let quantidade = 0;
  let unidade = "kg";

  if (isComum) {
    quantidade = valor;
    unidade = "kg";
  } else if (isPrecioso) {
    quantidade = valor;
    unidade = "pepitas";
  } else {
    // Metais e demais materiais minerais
    quantidade = Math.max(0, valor / 10);
    unidade = "kg";
  }

  if (metodoNorm === "mineracao" || metodoNorm === "mineração") {
    return {
      metodo: "mineracao",
      quantidade,
      unidade,
      periodo: "semana",
      duracaoAnos: inteligencia,
      anosDisponiveis: inteligencia,
      duracaoJazida: `${inteligencia} anos`,
      extraiTodaJazida: true,
    };
  }

  if (metodoNorm === "aluviao" || metodoNorm === "aluvião") {
    return {
      metodo: "aluviao",
      quantidade,
      unidade,
      periodo: "unico",
      limiteTestes: 1,
      exigeCeuAberto: true,
      exigePeneira: true,
      atributoUtilizado: "inteligencia",
    };
  }

  // Garimpagem padrão
  return {
    metodo: "garimpagem",
    quantidade,
    unidade,
    periodo: "dia",
    duracaoDias: inteligencia,
    diasDisponiveis: inteligencia,
    duracaoJazida: `${inteligencia} dias`,
    extraiTodaJazida: false,
  };
}

/* ------------------------------------------------------------------------- */
/* UTILITÁRIOS ADICIONAIS DE CRAFTING                                        */
/* ------------------------------------------------------------------------- */

/**
 * Calcula o custo monetário da matéria-prima para a construção de um item (50% do preço de venda).
 *
 * @param {number} precoItem Preço de tabela do item.
 * @returns {number} Custo em moedas da matéria-prima.
 */
export function calcularCustoMateriaPrima(precoItem) {
  const preco = Number(precoItem) || 0;
  return preco * FATOR_CUSTO_MATERIA_PRIMA;
}

/**
 * Calcula o custo e tempo para consertar um item danificado.
 * Regra: Consertar não exige teste, consome 50% do tempo e 50% da matéria-prima original.
 *
 * @param {number} tempoOriginalDias Tempo original de fabricação em dias.
 * @param {number} custoMaterialOriginal Custo original da matéria-prima.
 * @returns {object} Tempo e custo reduzidos para o reparo.
 */
export function calcularConsertoItem(tempoOriginalDias = 1, custoMaterialOriginal = 0) {
  const t = Number(tempoOriginalDias) || 1;
  const c = Number(custoMaterialOriginal) || 0;

  return {
    tempoConsertoDias: t * FATOR_CONSERTO_TEMPO,
    materialConserto: c * FATOR_CONSERTO_MATERIAL,
    requerTeste: false,
  };
}

/**
 * Verifica se um item de Qualidade Baixa quebra durante o uso.
 * Regra: Rolagem do Mestre contra Dificuldade 12; se o teste for bem-sucedido (>= 12), o item quebra.
 *
 * @param {number} rolagemTesteQuebra Resultado do teste do Mestre.
 * @returns {object} Situação do item.
 */
export function verificarRiscoQuebraQualidadeBaixa(rolagemTesteQuebra) {
  const rolagem = Number(rolagemTesteQuebra) || 0;
  const quebrou = rolagem >= DIFICULDADE_TESTE_QUEBRA_BAIXA;

  return {
    resultadoTeste: rolagem,
    dificuldade: DIFICULDADE_TESTE_QUEBRA_BAIXA,
    quebrou,
    requerConserto: quebrou,
  };
}

/**
 * Calcula o tempo necessário em dias para produzir um item em uma dada área de produção.
 * Aplica modificadores de material e dedicação de tempo dobrado.
 *
 * @param {string} area ID da área de produção (ex: "ferraria", "entalhe", "marcenaria").
 * @param {number} parametro FN do item ou custo de estrutura.
 * @param {object} [opcoes={}] Opções de material, dedicação e trabalhadores.
 * @returns {object} Detalhamento dos dias necessários.
 */
export function calcularTempoProducao(area, parametro = 1, opcoes = {}) {
  const fnOuCusto = Number(parametro) || 1;
  const material = String(opcoes.material || "").toLowerCase();
  const dobroDoTempo = Boolean(
    opcoes.dobro ||
    opcoes.dobroDoTempo ||
    opcoes.dedicacaoTempo === "dobro" ||
    opcoes.dedicacaoTempo === 2
  );

  let diasBase = fnOuCusto;

  if (material === "aco-anao" || material === "aço-anão") {
    diasBase = fnOuCusto * 1.5;
  } else if (material === "crisol") {
    diasBase = fnOuCusto * 2;
  } else if (material === "bronze") {
    diasBase = Math.max(1, fnOuCusto * 0.5);
  } else if (opcoes.tipoItem === "instrumento-musical") {
    diasBase = fnOuCusto * 5;
  }

  if (opcoes.numTrabalhadores && Number(opcoes.numTrabalhadores) > 1) {
    diasBase = diasBase / Number(opcoes.numTrabalhadores);
  }

  const diasFinais = dobroDoTempo ? diasBase * 2 : diasBase;

  return {
    diasBase,
    diasFinais,
    dobroDoTempo,
    bonusTeste: dobroDoTempo ? BONUS_DEDICACAO_TEMPO : 0,
  };
}
