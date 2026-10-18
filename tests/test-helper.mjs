/**
 * Test Helper compartilhado para os testes automatizados do Mighty Blade 3e.
 */

// Shim globals do Foundry VTT se não existirem no ambiente Node.js
if (!globalThis.foundry) {
  globalThis.foundry = {
    abstract: {
      TypeDataModel: class {
        constructor(data = {}, { parent = null } = {}) {
          Object.assign(this, data);
          this.parent = parent;
        }
      },
    },
    data: {
      fields: {
        SchemaField: class {},
        NumberField: class {},
        StringField: class {},
        ArrayField: class {},
      },
    },
    utils: {
      getProperty(obj, path) {
        if (!obj || !path) return undefined;
        return path.split(".").reduce((acc, part) => acc?.[part], obj);
      },
      setProperty(obj, path, val) {
        if (!obj || !path) return;
        const parts = path.split(".");
        const last = parts.pop();
        let target = obj;
        for (const part of parts) {
          if (!target[part]) target[part] = {};
          target = target[part];
        }
        target[last] = val;
      },
      mergeObject(a, b) {
        return Object.assign({}, a, b);
      },
      deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
      },
    },
  };
}

if (!globalThis.ui) {
  globalThis.ui = {
    notifications: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  };
}

if (!globalThis.Actor) {
  globalThis.Actor = class Actor {
    constructor(data = {}) {
      Object.assign(this, data);
    }
    static async create(data = {}) {
      return createMockActor(data);
    }
  };
}

if (!globalThis.game) {
  globalThis.game = {
    packs: {
      get: () => null,
      [Symbol.iterator]: function* () {},
    },
    items: [],
  };
}

const { MightyBladeActor } = await import("../module/documents/actor.mjs");
const { default: MightyBladeCharacterData } = await import("../module/data/actor-character.mjs");
import {
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
} from "../module/data/canonical-packs-data.mjs";
import {
  aplicarEscolhaAtributoNoItem,
  construirItensOrigemDraconica,
  obterAtributoEscolhidoDeHabilidade,
  LINHAGENS_DRACONICAS,
  CARACTERISTICAS_DRACONICAS,
} from "../module/helpers/concessoes.mjs";
import {
  validarHabilidadeExclusivaCriacao,
  HABILIDADES_EXCLUSIVAS_CRIACAO,
  validarClasseRaca,
  validarIncompatibilidadePactoMisticismo,
  adquirirHabilidadeSync,
} from "../module/helpers/restricoes.mjs";
import {
  avaliarRequisitos,
  parseRequisitosTexto,
  validarCaminhoPrestigio,
  CAMINHOS_PRESTIGIO,
  checarMarcoNarrativo,
  norm,
} from "../module/helpers/requisitos.mjs";
import {
  beneficiosDoNivel,
  niveisDeAtributo,
  validarAumentoAtributos,
  aplicarAumentoAtributos,
  NIVEIS_COM_AUMENTO_ATRIBUTO,
  ATRIBUTOS_CANONICOS,
  TETO_NIVEL_PADRAO,
  NIVEL_MINIMO_APRENDIZ,
  OPCOES_PONTO_EVOLUCAO,
  HABILIDADES_AUTOMATICAS_CLASSE,
  resolverClasseCanonica,
  obterHabilidadeAutomaticaClasse,
  normalizarPontoEvolucao,
} from "../module/helpers/progressao.mjs";
import {
  calcularDano,
  aplicarDano,
  consumirMana,
  recuperarMana,
  temCondicao,
  adicionarCondicao,
  removerCondicao,
  isActorInapto,
  ELEMENTOS_CANONICOS,
} from "../module/helpers/danos-condicoes.mjs";
import {
  calcularPV,
  calcularPM,
  calcularCarga,
  calcularDeslocamento,
  calcularDeterminacao,
  calcularDefesaBase,
  calcularEsquiva,
  calcularBloqueio,
  calcularEstatisticasDerivadas,
} from "../module/helpers/estatisticas-derivadas.mjs";
import {
  avaliarSobrecarga,
  calcularCapacidadeCarga,
  updateInventoryWeight,
  checkMovementStatus,
  calcularDanoQueda,
  calculateFallDamage,
  calcularFolegoSufocamento,
  processarSufocamento,
  calcularFolegoAgua,
  calcularFolegoFumaca,
} from "../module/helpers/carga-ambiente.mjs";
import {
  PACTOS_CANONICOS,
  normalizarPacto,
  aplicarEfeitosPacto,
  isImuneMedoOuMental,
  verificarInaptidaoLuzSolar,
  testarInfeccaoDoenca,
  aplicarCuraOuPurificacao,
  avaliarAtaqueContraTirania,
  aplicarVirulencia,
  testarResistenciaDoencaOuVeneno,
} from "../module/helpers/pactos-vilao.mjs";
import {
  validarLimiteInvocacoes,
  calcularEscalonamentoInvocacao,
  calcularManutencaoControle,
  aplicarManutencaoControle,
  calcularLimiteInvocacoes,
  TABELA_BASE_INVOCACOES,
  CUSTO_MANUTENCAO_PADRAO,
} from "../module/helpers/invocacoes.mjs";
import {
  atualizarEstadoSaude,
  aplicarCondicao,
  obterEstadoSaude,
  definirEstadoSaude,
  falharTesteSobrevivencia,
  passarTesteSobrevivencia,
  isMorto,
  isPorUmFio,
  isSaudavel,
  podeRealizarAcoes,
  podeRealizarReacoes,
  isAtaqueInapto,
  isPercepcaoVisualInapta,
  obterPenalidadeDefesa,
  obterPenalidadeTestes,
  obterFonteMedo,
  podeAproximarFonteMedo,
  ESTADO_SAUDAVEL,
  ESTADO_POR_UM_FIO,
  ESTADO_MORTO,
  CONDICAO_ATORDOADO,
  CONDICAO_CEGO,
  CONDICAO_AMEDRONTADO,
} from "../module/helpers/estados-saude.mjs";
import {
  calcularArmaMaoEMeia,
  processarPropriedadeTranspor,
  processarPropriedadeTrespassar,
  verificarPropriedadeCarregar,
  processarPropriedadeGancho,
  verificarPenalidadeArmaduraSemTunica,
  itemPossuiPropriedade,
  equipWeapon,
  calculateAttackVsTarget,
  equipArmor,
  processCombatTurn,
} from "../module/helpers/combate-tatico.mjs";
import {
  verificarSintonizacao,
  sintonizarItem,
  calcularCustoMana,
  calcularDificuldadeMagia,
  verificarInaptidaoConjuracao,
  validarRegistroGrimorio,
  calcularCustoSimboloProfano,
  aplicarCustoSimboloProfano,
  DIFICULDADE_SINTONIZACAO,
  CUSTO_PM_SINTONIZACAO,
  REDUCAO_PM_FOCO_MAGICO,
  REDUCAO_DIFICULDADE_ASSESTE_MAGICO,
  CUSTO_PV_SIMBOLO_PROFANO,
  PROPRIEDADES_GEMAS,
  CLASSES_CONJURADORAS_CANONICAS,
  CLASSES_TREINO_ARMADURA_CONJURACAO,
} from "../module/helpers/magia.mjs";
import {
  validarAcoesTurno,
  validarReacao,
  podeExecutarAcao,
  obterAcoesRestantes,
  ControladorEconomiaTurno,
  TIPOS_ACAO,
  COMBINACOES_TURNO_VALIDAS,
  LIMITE_REACOES_POR_RODADA,
  podeTrocarMovimentoPorPadrao,
  PODE_TROCAR_MOVIMENTO_POR_PADRAO,
} from "../module/helpers/economia-turno.mjs";
import {
  processarAtaqueLocalizado,
  processarEncontrao,
  processarFintar,
  processarInterceptar,
  MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO,
  DISTANCIA_MINIMA_ENCONTRAO,
  PENALIDADE_ESQUIVA_ENCONTRAO,
  BONUS_ATAQUE_FINTAR,
  CONFRONTO_INTERCEPTAR_ATRIBUTO,
} from "../module/helpers/manobras-combate.mjs";
import {
  processarApostasia,
  validarHabilidadeApostata,
  aplicarCanalizacaoApostata,
  validarIncompatibilidadeReligiosaProfana,
  podeConjurarMagiaOuHabilidade,
  isItemPunicao,
  isItemMagiaMistica,
  isItemMito,
  isItemDogmaOuCodigoOuVoto,
  CLASSES_RELIGIOSAS_CANONICAS,
  TIPOS_CANALIZACAO_APOSTATA,
  BONUS_CANALIZACAO_RESISTENCIA,
} from "../module/helpers/apostasia.mjs";
import {
  conheceReceita,
  processarEtapaAlquimia,
  sortearPocaoDoCaos,
  TABELA_POCAO_DO_CAOS,
  ETAPAS_ALQUIMIA,
  PROCESSOS_ALQUIMICOS_INFO,
  normalizarReceita,
  extrairHabilidadesAlquimia,
  HABILIDADE_HERBALISMO,
  HABILIDADE_ALQUIMIA_BASICA,
  HABILIDADE_ALQUIMIA_AVANCADA,
  RARIDADES_PERMITIDAS_HERBALISMO,
} from "../module/helpers/alquimia.mjs";
import {
  calcularCustoAntecedenteCriacao,
  validarAntecedentePosterior,
  calcularOuroInicialPorNivel,
  calcularOuroPorFormula,
  aplicarOuroInicial,
  aplicarAntecedentePosterior,
  obterBonusMoedasAntecedente,
  TABELA_OURO_INICIAL_POR_NIVEL,
  TAXA_PROGRESSAO_OURO,
  OURO_BASE_NIVEL_1,
  NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR,
  CUSTO_ATRIBUTO_CRIACAO_ANTECEDENTE,
  CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR,
  BONUS_MOEDAS_ANTECEDENTE,
} from "../module/helpers/economia.mjs";
import {
  calcularCapacidadeTatuagem,
  validarTatuarMagia,
  calcularBeneficioTatuagemMagica,
  tatuarObjeto,
  conjurarObjetoTatuado,
  recolherObjetoTatuado,
  obterTamanhoPersonagem,
  obterGrauComplexidadeMagia,
  isTatuagemTohunga,
  CAPACIDADE_TATUAGEM_TAMANHO,
  GC_TATUAGEM_TOHUNGA,
  CUSTO_PM_TATUAR_OBJETO,
  CUSTO_PM_INVOCAR_OBJETO,
  REDUCAO_DIFICULDADE_TATUAGEM,
  REDUCAO_MANA_TATUAGEM,
  PISO_MANA_TATUAGEM,
  TATUAGENS_TOHUNGA_CANONICAS,
} from "../module/helpers/tatuagens.mjs";
import {
  aplicarFaixaEtaria,
  testarEnvelhecimentoIdoso,
  testarEnvelhecimentoAnual,
  processarCicloLongevo,
  isRacaLongeva,
  obterFaixaEtaria,
  obterTamanhoFaixa,
  obterAtributosIniciais,
  obterCicloAnos,
  FAIXAS_ETARIAS,
  FAIXA_FILHOTE,
  FAIXA_CRIANCA,
  FAIXA_ADOLESCENTE,
  FAIXA_ADULTO,
  FAIXA_IDOSO,
  FAIXA_ANCIAO,
  FAIXAS_ETARIAS_LABELS,
  TAMANHOS_FAIXA,
  DIFICULDADE_TESTE_IDOSO,
  DIFICULDADE_TESTE_ANCIAO,
  LIMITE_FALHAS_LONGEVOS,
  RACAS_LONGEVAS,
  CICLOS_ANOS_LONGEVAS,
} from "../module/helpers/envelhecimento.mjs";
import {
  criarAspirante,
  evoluirAspiranteParaNivel1,
  criarDesclassificado,
  evoluirDesclassificadoParaNivel1,
  PV_INICIAL_ASPIRANTE,
  PM_INICIAL_ASPIRANTE,
  PV_INICIAL_DESCLASSIFICADO,
  PM_INICIAL_DESCLASSIFICADO,
  PV_NIVEL_1,
  PM_NIVEL_1,
  XP_REQUISITO_NIVEL_1,
  TETO_ATRIBUTO_NIVEL_ZERO,
  REDUTOR_ATRIBUTO_ANTECEDENTE,
} from "../module/helpers/nivel-zero.mjs";
import {
  STATUS_LEGAL,
  SANCOES_LEGAIS,
  ITENS_ILICITOS_CANONICOS,
  AMBIENTES_PATRULHADOS,
  AMBIENTES_NAO_PATRULHADOS,
  isAmbientePatrulhado,
  verificarStatusLegal,
  verificarPorteIlegal,
  apreenderItensIlegais,
  simularAbordagemPatrulha,
} from "../module/helpers/status-legal.mjs";
import {
  calcularDefesaObjeto,
  calcularDefesaAlvoEspecifico,
  classificarPorteObjeto,
  DEFESA_OBJETO_PEQUENO,
  DEFESA_OBJETO_MEDIO,
  DEFESA_OBJETO_GRANDE,
  DEFESA_OBJETO_GIGANTE,
  DEFESA_OBJETO_COLOSSAL,
  TABELA_DEFESA_OBJETOS,
  LIMITES_TAMANHO_OBJETO_METROS,
  FORMULA_MOVIMENTO_OBJETO,
  MODIFICADOR_MOVIMENTO_PADRAO_MEDIA,
  MODIFICADOR_DEFESA_ALVO_ESPECIFICO,
  ALVOS_ESPECIFICOS_CANONICOS,
} from "../module/helpers/objetos-inanimados.mjs";
import {
  aplicarModificadoresAmbiente,
  calcularEfeitoMagiaNoAmbiente,
  normalizarAmbiente,
  extrairElementoMagia,
  normalizarElementoMagia,
  isAmbienteGelado,
  isAmbienteQuente,
  isAmbienteSubaquatico,
  AMBIENTES_CANONICOS,
  CATEGORIAS_AMBIENTE,
  MODIFICADORES_DIFICULDADE_FOGO_GELADO,
  DANO_ADICIONAL_FOGO_QUENTE,
  RAIO_ELETRICIDADE_SUBAQUATICO_METROS,
} from "../module/helpers/ambiente-elemental.mjs";
import {
  avaliarResultadoProducao,
  calcularBonusDedicacaoTempo,
  calcularMaterialDesmontagem,
  avaliarItem,
  procurarJazidaMineral,
  extrairMinerio,
  calcularCustoMateriaPrima,
  calcularConsertoItem,
  verificarRiscoQuebraQualidadeBaixa,
  calcularTempoProducao,
  BONUS_DEDICACAO_TEMPO,
  FATOR_MATERIAL_DESMONTAGEM,
  FATOR_CUSTO_MATERIA_PRIMA,
  FATOR_CONSERTO_TEMPO,
  FATOR_CONSERTO_MATERIAL,
  DIFICULDADE_PROCURAR_JAZIDA,
  DIFICULDADE_TESTE_QUEBRA_BAIXA,
  DIFICULDADE_AVALIACAO_QUALIDADE,
  DIFICULDADE_AVALIACAO_HISTORICO,
  DIFICULDADE_AVALIACAO_MAGICA,
  AREAS_PRODUCAO_CANONICAS,
  QUALIDADES_ITEM,
  MATERIAIS_ESPECIAIS,
} from "../module/helpers/crafting.mjs";
import {
  avaliarRolagemDados,
  calcularMultiplicadorDanoCritico,
  verificarDuplaInaptidao,
  resolverConfrontoOposto,
  normalizarBeneficioMagia,
  BENEFICIOS_CRITICO_MAGIA,
  MOTIVOS_VITORIA_CONFRONTO,
  CRITERIO_CRITICO_MIN_SEIS,
  CRITERIO_FALHA_CRITICA_VALOR,
  MULTIPLICADOR_CRITICO_BASE,
} from "../module/helpers/resolucao-dados.mjs";

export {
  criarAspirante,
  evoluirAspiranteParaNivel1,
  criarDesclassificado,
  evoluirDesclassificadoParaNivel1,
  PV_INICIAL_ASPIRANTE,
  PM_INICIAL_ASPIRANTE,
  PV_INICIAL_DESCLASSIFICADO,
  PM_INICIAL_DESCLASSIFICADO,
  PV_NIVEL_1,
  PM_NIVEL_1,
  XP_REQUISITO_NIVEL_1,
  TETO_ATRIBUTO_NIVEL_ZERO,
  REDUTOR_ATRIBUTO_ANTECEDENTE,
  MightyBladeCharacterData,
  beneficiosDoNivel,
  niveisDeAtributo,
  validarAumentoAtributos,
  aplicarAumentoAtributos,
  NIVEIS_COM_AUMENTO_ATRIBUTO,
  ATRIBUTOS_CANONICOS,
  TETO_NIVEL_PADRAO,
  NIVEL_MINIMO_APRENDIZ,
  OPCOES_PONTO_EVOLUCAO,
  HABILIDADES_AUTOMATICAS_CLASSE,
  resolverClasseCanonica,
  obterHabilidadeAutomaticaClasse,
  normalizarPontoEvolucao,
  calcularDano,
  aplicarDano,
  consumirMana,
  recuperarMana,
  temCondicao,
  adicionarCondicao,
  removerCondicao,
  isActorInapto,
  ELEMENTOS_CANONICOS,
  calcularPV,
  calcularPM,
  calcularCarga,
  calcularDeslocamento,
  calcularDeterminacao,
  calcularDefesaBase,
  calcularEsquiva,
  calcularBloqueio,
  calcularEstatisticasDerivadas,
  avaliarSobrecarga,
  calcularCapacidadeCarga,
  updateInventoryWeight,
  checkMovementStatus,
  calcularDanoQueda,
  calculateFallDamage,
  calcularFolegoSufocamento,
  processarSufocamento,
  calcularFolegoAgua,
  calcularFolegoFumaca,
  PACTOS_CANONICOS,
  normalizarPacto,
  aplicarEfeitosPacto,
  isImuneMedoOuMental,
  verificarInaptidaoLuzSolar,
  testarInfeccaoDoenca,
  aplicarCuraOuPurificacao,
  avaliarAtaqueContraTirania,
  aplicarVirulencia,
  testarResistenciaDoencaOuVeneno,
  atualizarEstadoSaude,
  aplicarCondicao,
  obterEstadoSaude,
  definirEstadoSaude,
  falharTesteSobrevivencia,
  passarTesteSobrevivencia,
  isMorto,
  isPorUmFio,
  isSaudavel,
  podeRealizarAcoes,
  podeRealizarReacoes,
  isAtaqueInapto,
  isPercepcaoVisualInapta,
  obterPenalidadeDefesa,
  obterPenalidadeTestes,
  obterFonteMedo,
  podeAproximarFonteMedo,
  ESTADO_SAUDAVEL,
  ESTADO_POR_UM_FIO,
  ESTADO_MORTO,
  CONDICAO_ATORDOADO,
  CONDICAO_CEGO,
  CONDICAO_AMEDRONTADO,
  validarLimiteInvocacoes,
  calcularEscalonamentoInvocacao,
  calcularManutencaoControle,
  aplicarManutencaoControle,
  calcularLimiteInvocacoes,
  TABELA_BASE_INVOCACOES,
  CUSTO_MANUTENCAO_PADRAO,
  calcularArmaMaoEMeia,
  processarPropriedadeTranspor,
  processarPropriedadeTrespassar,
  verificarPropriedadeCarregar,
  processarPropriedadeGancho,
  verificarPenalidadeArmaduraSemTunica,
  itemPossuiPropriedade,
  equipWeapon,
  calculateAttackVsTarget,
  equipArmor,
  processCombatTurn,
  avaliarRequisitos,
  parseRequisitosTexto,
  validarCaminhoPrestigio,
  CAMINHOS_PRESTIGIO,
  checarMarcoNarrativo,
  verificarSintonizacao,
  sintonizarItem,
  calcularCustoMana,
  calcularDificuldadeMagia,
  verificarInaptidaoConjuracao,
  validarRegistroGrimorio,
  calcularCustoSimboloProfano,
  aplicarCustoSimboloProfano,
  DIFICULDADE_SINTONIZACAO,
  CUSTO_PM_SINTONIZACAO,
  REDUCAO_PM_FOCO_MAGICO,
  REDUCAO_DIFICULDADE_ASSESTE_MAGICO,
  CUSTO_PV_SIMBOLO_PROFANO,
  PROPRIEDADES_GEMAS,
  CLASSES_CONJURADORAS_CANONICAS,
  CLASSES_TREINO_ARMADURA_CONJURACAO,
  validarAcoesTurno,
  validarReacao,
  podeExecutarAcao,
  obterAcoesRestantes,
  ControladorEconomiaTurno,
  TIPOS_ACAO,
  COMBINACOES_TURNO_VALIDAS,
  LIMITE_REACOES_POR_RODADA,
  podeTrocarMovimentoPorPadrao,
  PODE_TROCAR_MOVIMENTO_POR_PADRAO,
  processarAtaqueLocalizado,
  processarEncontrao,
  processarFintar,
  processarInterceptar,
  MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO,
  DISTANCIA_MINIMA_ENCONTRAO,
  PENALIDADE_ESQUIVA_ENCONTRAO,
  BONUS_ATAQUE_FINTAR,
  CONFRONTO_INTERCEPTAR_ATRIBUTO,
  processarApostasia,
  validarHabilidadeApostata,
  aplicarCanalizacaoApostata,
  validarIncompatibilidadeReligiosaProfana,
  podeConjurarMagiaOuHabilidade,
  isItemPunicao,
  isItemMagiaMistica,
  isItemMito,
  isItemDogmaOuCodigoOuVoto,
  CLASSES_RELIGIOSAS_CANONICAS,
  TIPOS_CANALIZACAO_APOSTATA,
  BONUS_CANALIZACAO_RESISTENCIA,
  calcularCustoAntecedenteCriacao,
  validarAntecedentePosterior,
  calcularOuroInicialPorNivel,
  calcularOuroPorFormula,
  aplicarOuroInicial,
  aplicarAntecedentePosterior,
  obterBonusMoedasAntecedente,
  TABELA_OURO_INICIAL_POR_NIVEL,
  TAXA_PROGRESSAO_OURO,
  OURO_BASE_NIVEL_1,
  NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR,
  CUSTO_ATRIBUTO_CRIACAO_ANTECEDENTE,
  CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR,
  BONUS_MOEDAS_ANTECEDENTE,
  conheceReceita,
  processarEtapaAlquimia,
  sortearPocaoDoCaos,
  TABELA_POCAO_DO_CAOS,
  ETAPAS_ALQUIMIA,
  PROCESSOS_ALQUIMICOS_INFO,
  normalizarReceita,
  extrairHabilidadesAlquimia,
  HABILIDADE_HERBALISMO,
  HABILIDADE_ALQUIMIA_BASICA,
  HABILIDADE_ALQUIMIA_AVANCADA,
  RARIDADES_PERMITIDAS_HERBALISMO,
  calcularCapacidadeTatuagem,
  validarTatuarMagia,
  calcularBeneficioTatuagemMagica,
  tatuarObjeto,
  conjurarObjetoTatuado,
  recolherObjetoTatuado,
  obterTamanhoPersonagem,
  obterGrauComplexidadeMagia,
  isTatuagemTohunga,
  CAPACIDADE_TATUAGEM_TAMANHO,
  GC_TATUAGEM_TOHUNGA,
  CUSTO_PM_TATUAR_OBJETO,
  CUSTO_PM_INVOCAR_OBJETO,
  REDUCAO_DIFICULDADE_TATUAGEM,
  REDUCAO_MANA_TATUAGEM,
  PISO_MANA_TATUAGEM,
  TATUAGENS_TOHUNGA_CANONICAS,
  aplicarFaixaEtaria,
  testarEnvelhecimentoIdoso,
  testarEnvelhecimentoAnual,
  processarCicloLongevo,
  isRacaLongeva,
  obterFaixaEtaria,
  obterTamanhoFaixa,
  obterAtributosIniciais,
  obterCicloAnos,
  FAIXAS_ETARIAS,
  FAIXA_FILHOTE,
  FAIXA_CRIANCA,
  FAIXA_ADOLESCENTE,
  FAIXA_ADULTO,
  FAIXA_IDOSO,
  FAIXA_ANCIAO,
  FAIXAS_ETARIAS_LABELS,
  TAMANHOS_FAIXA,
  DIFICULDADE_TESTE_IDOSO,
  DIFICULDADE_TESTE_ANCIAO,
  LIMITE_FALHAS_LONGEVOS,
  RACAS_LONGEVAS,
  CICLOS_ANOS_LONGEVAS,
  STATUS_LEGAL,
  SANCOES_LEGAIS,
  ITENS_ILICITOS_CANONICOS,
  AMBIENTES_PATRULHADOS,
  AMBIENTES_NAO_PATRULHADOS,
  isAmbientePatrulhado,
  verificarStatusLegal,
  verificarPorteIlegal,
  apreenderItensIlegais,
  simularAbordagemPatrulha,
  calcularDefesaObjeto,
  calcularDefesaAlvoEspecifico,
  classificarPorteObjeto,
  DEFESA_OBJETO_PEQUENO,
  DEFESA_OBJETO_MEDIO,
  DEFESA_OBJETO_GRANDE,
  DEFESA_OBJETO_GIGANTE,
  DEFESA_OBJETO_COLOSSAL,
  TABELA_DEFESA_OBJETOS,
  LIMITES_TAMANHO_OBJETO_METROS,
  FORMULA_MOVIMENTO_OBJETO,
  MODIFICADOR_MOVIMENTO_PADRAO_MEDIA,
  MODIFICADOR_DEFESA_ALVO_ESPECIFICO,
  ALVOS_ESPECIFICOS_CANONICOS,
  aplicarModificadoresAmbiente,
  calcularEfeitoMagiaNoAmbiente,
  normalizarAmbiente,
  extrairElementoMagia,
  normalizarElementoMagia,
  isAmbienteGelado,
  isAmbienteQuente,
  isAmbienteSubaquatico,
  AMBIENTES_CANONICOS,
  CATEGORIAS_AMBIENTE,
  MODIFICADORES_DIFICULDADE_FOGO_GELADO,
  DANO_ADICIONAL_FOGO_QUENTE,
  RAIO_ELETRICIDADE_SUBAQUATICO_METROS,
  avaliarResultadoProducao,
  calcularBonusDedicacaoTempo,
  calcularMaterialDesmontagem,
  avaliarItem,
  procurarJazidaMineral,
  extrairMinerio,
  calcularCustoMateriaPrima,
  calcularConsertoItem,
  verificarRiscoQuebraQualidadeBaixa,
  calcularTempoProducao,
  BONUS_DEDICACAO_TEMPO,
  FATOR_MATERIAL_DESMONTAGEM,
  FATOR_CUSTO_MATERIA_PRIMA,
  FATOR_CONSERTO_TEMPO,
  FATOR_CONSERTO_MATERIAL,
  DIFICULDADE_PROCURAR_JAZIDA,
  DIFICULDADE_TESTE_QUEBRA_BAIXA,
  DIFICULDADE_AVALIACAO_QUALIDADE,
  DIFICULDADE_AVALIACAO_HISTORICO,
  DIFICULDADE_AVALIACAO_MAGICA,
  AREAS_PRODUCAO_CANONICAS,
  QUALIDADES_ITEM,
  MATERIAIS_ESPECIAIS,
  avaliarRolagemDados,
  calcularMultiplicadorDanoCritico,
  verificarDuplaInaptidao,
  resolverConfrontoOposto,
  normalizarBeneficioMagia,
  BENEFICIOS_CRITICO_MAGIA,
  MOTIVOS_VITORIA_CONFRONTO,
  CRITERIO_CRITICO_MIN_SEIS,
  CRITERIO_FALHA_CRITICA_VALOR,
  MULTIPLICADOR_CRITICO_BASE,
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  CANONICAL_RACAS as RACES,
  CANONICAL_CLASSES as CLASSES,
  validarHabilidadeExclusivaCriacao,
  HABILIDADES_EXCLUSIVAS_CRIACAO,
};

export function createMockActor(data = {}) {
  const parseAttr = (a) => {
    if (typeof a === "number") return { value: a, base: a };
    const base = a?.base ?? a?.value ?? 0;
    const value = a?.value ?? a?.base ?? 0;
    return { value, base, ...(a || {}) };
  };

  const inAttrs = { ...(data.attributes || {}), ...(data.system?.attributes || {}) };
  const sysExtra = { ...(data.system || {}) };
  delete sysExtra.attributes;

  const actor = {
    name: data.name || "Herói Teste",
    system: {
      attributes: {
        forca: parseAttr(inAttrs.forca),
        agilidade: parseAttr(inAttrs.agilidade),
        inteligencia: parseAttr(inAttrs.inteligencia),
        vontade: parseAttr(inAttrs.vontade),
      },
      resources: {
        vida: { value: 60, max: 60, ...(data.resources?.vida || {}) },
        mana: { value: 60, max: 60, ...(data.resources?.mana || {}) },
      },
      defesas: {
        bloqueio: { value: 0, ...(data.defesas?.bloqueio || {}) },
        esquiva: { value: 0, ...(data.defesas?.esquiva || {}) },
        determinacao: { value: 0, ...(data.defesas?.determinacao || {}) },
      },
      subattributes: {
        deslocamento: { value: 0, ...(data.subattributes?.deslocamento || {}) },
        corrida: { value: 0, ...(data.subattributes?.corrida || {}) },
        carga: { value: 0, max: 0, ...(data.subattributes?.carga || {}) },
      },
      details: {
        nivel: 1,
        raca: "",
        classe: "",
        caminho: "",
        aprendiz: "",
        antecedente: "",
        ...(data.details || {}),
      },
      ...sysExtra,
    },
    items: data.items ? [...data.items] : [],
    effects: data.effects ? [...data.effects] : [],
    flags: data.flags || {},
    getFlag(scope, key) {
      return this.flags?.[scope]?.[key];
    },
    setFlag(scope, key, val) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = val;
    },
    prepareDerivedData() {
      this.system.parent = this;
      MightyBladeCharacterData.prototype.prepareDerivedData.call(this.system);
      return this;
    },
    async update(changes = {}) {
      for (const [key, val] of Object.entries(changes)) {
        foundry.utils.setProperty(this, key, val);
      }
      this.prepareDerivedData();
      return this;
    },
    addItem(item) {
      const wasFullVida = this.system?.resources?.vida?.value === this.system?.resources?.vida?.max;
      const wasFullMana = this.system?.resources?.mana?.value === this.system?.resources?.mana?.max;
      this.items.push(item);
      this.prepareDerivedData();
      if (wasFullVida && this.system?.resources?.vida) {
        this.system.resources.vida.value = this.system.resources.vida.max;
      }
      if (wasFullMana && this.system?.resources?.mana) {
        this.system.resources.mana.value = this.system.resources.mana.max;
      }
      return item;
    },
    removeItem(predicate) {
      const predFn = typeof predicate === "string"
        ? (i) => i.id === predicate || i._id === predicate || i.name === predicate
        : typeof predicate === "function"
        ? predicate
        : (i) => i === predicate || (predicate && (i.id === predicate.id || i._id === predicate._id || i.name === predicate.name));
      const idx = this.items.findIndex(predFn);
      if (idx !== -1) {
        const removed = this.items.splice(idx, 1)[0];
        this.prepareDerivedData();
        return removed;
      }
      return null;
    },
    equipItem(itemOrId, equipado = true) {
      const item = typeof itemOrId === "string"
        ? this.items.find((i) => i.id === itemOrId || i._id === itemOrId || i.name === itemOrId)
        : this.items.find((i) => i === itemOrId || (i.id && i.id === itemOrId.id) || (i.name && i.name === itemOrId.name));
      if (item) {
        item.system = item.system || {};
        item.system.equipado = equipado;
        this.prepareDerivedData();
      }
      return item;
    },
    async createEmbeddedDocuments(type, docs = []) {
      if (type === "Item") {
        const created = docs.map((d) => {
          const item = JSON.parse(JSON.stringify(d));
          item._id = item._id || Math.random().toString(36).substring(2, 9);
          item.id = item.id || item._id;
          item.getFlag = function (scope, k) {
            return this.flags?.[scope]?.[k];
          };
          item.setFlag = function (scope, k, v) {
            this.flags = this.flags || {};
            this.flags[scope] = this.flags[scope] || {};
            this.flags[scope][k] = v;
          };
          return item;
        });
        this.items.push(...created);
        this.prepareDerivedData();
        return created;
      }
      return [];
    },
    async deleteEmbeddedDocuments(type, ids = []) {
      if (type === "Item") {
        const idSet = new Set(ids);
        this.items = this.items.filter((i) => !idSet.has(i.id) && !idSet.has(i._id));
        this.prepareDerivedData();
      }
      return this;
    },
    async applyLevelUp(params = {}) {
      return MightyBladeActor.prototype.applyLevelUp.call(this, params);
    },
    async addLevelAbility(abilityData) {
      return MightyBladeActor.prototype.addLevelAbility.call(this, abilityData);
    },
    async _grantAprendizAbility(className) {
      return MightyBladeActor.prototype._grantAprendizAbility.call(this, className);
    },
    async setAprendiz(className) {
      return MightyBladeActor.prototype.setAprendiz.call(this, className);
    },
    async clearDetail(key) {
      return MightyBladeActor.prototype.clearDetail.call(this, key);
    },
    calcularDano(dano, elemento) {
      return calcularDano(dano, elemento, this);
    },
    async aplicarDano(dano, elemento) {
      const res = aplicarDano(this, dano, elemento);
      await this.update({ "system.resources.vida.value": res.vidaRestante });
      return res;
    },
    async consumirMana(quantidade) {
      const res = consumirMana(this, quantidade);
      await this.update({
        "system.resources.mana.value": res.manaRestante,
        "system.resources.vida.value": res.vidaRestante,
        "system.details.condicao": this.system?.details?.condicao || "",
      });
      return res;
    },
    temCondicao(cond) {
      return temCondicao(this, cond);
    },
    isExausto() {
      return temCondicao(this, "exausto");
    },
    isInapto() {
      return isActorInapto(this);
    },
    avaliarSobrecarga(opts = {}) {
      return avaliarSobrecarga(this, opts);
    },
    calcularDanoQueda(metros, opts = {}) {
      return calcularDanoQueda(metros, this, opts);
    },
    calcularFolegoSufocamento(ambienteOuOpts = {}) {
      return calcularFolegoSufocamento(this, ambienteOuOpts);
    },
    aplicarPacto(pactoNome, opcoes = {}) {
      return aplicarEfeitosPacto(pactoNome, this, opcoes);
    },
    aplicarVirulencia(alvos = [], opcoes = {}) {
      return aplicarVirulencia(this, alvos, opcoes);
    },
    atualizarEstadoSaude(deltaPV, opcoes = {}) {
      return atualizarEstadoSaude(this, deltaPV, opcoes);
    },
    aplicarCondicao(condicaoNome, opcoes = {}) {
      return aplicarCondicao(this, condicaoNome, opcoes);
    },
    removerCondicao(condicaoNome) {
      return removerCondicao(this, condicaoNome);
    },
    obterEstadoSaude() {
      return obterEstadoSaude(this);
    },
    definirEstadoSaude(novoEstado) {
      return definirEstadoSaude(this, novoEstado);
    },
    falharTesteSobrevivencia() {
      return falharTesteSobrevivencia(this);
    },
    passarTesteSobrevivencia() {
      return passarTesteSobrevivencia(this);
    },
    podeRealizarAcoes() {
      return podeRealizarAcoes(this);
    },
    podeRealizarReacoes() {
      return podeRealizarReacoes(this);
    },
    isMorto() {
      return isMorto(this);
    },
    isPorUmFio() {
      return isPorUmFio(this);
    },
    isSaudavel() {
      return isSaudavel(this);
    },
    isAtaqueInapto(opcoes = {}) {
      return isAtaqueInapto(this, opcoes);
    },
    isPercepcaoVisualInapta() {
      return isPercepcaoVisualInapta(this);
    },
    obterPenalidadeDefesa(tipo = "todas") {
      return obterPenalidadeDefesa(this, tipo);
    },
    obterPenalidadeTestes(contexto = {}) {
      return obterPenalidadeTestes(this, contexto);
    },
    podeAproximarFonteMedo(fonte = null) {
      return podeAproximarFonteMedo(this, fonte);
    },
    obterFonteMedo() {
      return obterFonteMedo(this);
    },
    async _onCaminhoCreated(caminho) {
      return MightyBladeActor.prototype._onCaminhoCreated.call(this, caminho);
    },
    async _onCaminhoDeleted(caminho) {
      return MightyBladeActor.prototype._onCaminhoDeleted.call(this, caminho);
    },
    async _onClassCreated(classe) {
      return MightyBladeActor.prototype._onClassCreated.call(this, classe);
    },
    async _onHabilidadeCreated(hab) {
      return MightyBladeActor.prototype._onHabilidadeCreated.call(this, hab);
    },
    async _onMagiaCreated(magia, options = {}) {
      return MightyBladeActor.prototype._onMagiaCreated.call(this, magia, options);
    },
    async _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
      return MightyBladeActor.prototype._onCreateEmbeddedDocuments.call(this, embeddedName, documents, result, options, userId);
    },
    validarAcoesTurno(acoes, opcoes = {}) {
      return validarAcoesTurno(acoes, { actor: this, ...opcoes });
    },
    validarReacao(reacoes = 1, opcoes = {}) {
      return validarReacao(reacoes, { actor: this, ...opcoes });
    },
    processarApostasia(patronoOuVoto, opcoes = {}) {
      return processarApostasia(this, patronoOuVoto, opcoes);
    },
    validarHabilidadeApostata(opcoes = {}) {
      return validarHabilidadeApostata(this, opcoes);
    },
    aplicarCanalizacaoApostata(tipo = "rd") {
      return aplicarCanalizacaoApostata(this, tipo);
    },
    validarIncompatibilidadeReligiosaProfana(novoItem) {
      return validarIncompatibilidadeReligiosaProfana(this, novoItem);
    },
    podeConjurarMagiaOuHabilidade(item) {
      return podeConjurarMagiaOuHabilidade(this, item);
    },
    aplicarFaixaEtaria(faixa, opcoes = {}) {
      return aplicarFaixaEtaria(this, faixa, opcoes);
    },
    testarEnvelhecimentoIdoso(opcoes = {}) {
      return testarEnvelhecimentoIdoso(this, opcoes);
    },
    testarEnvelhecimentoAnual(opcoes = {}) {
      return testarEnvelhecimentoAnual(this, opcoes);
    },
    processarCicloLongevo(opcoes = {}) {
      return processarCicloLongevo(this, opcoes);
    },
    obterFaixaEtaria() {
      return obterFaixaEtaria(this);
    },
    verificarPorteIlegal(contextoAmbiente = "metropole") {
      return verificarPorteIlegal(this, contextoAmbiente);
    },
    apreenderItensIlegais() {
      return apreenderItensIlegais(this);
    },
    calcularDefesaAlvoEspecifico(tipoAlvo = "membro", opcoes = {}) {
      return calcularDefesaAlvoEspecifico(this, tipoAlvo, opcoes);
    },
    aplicarModificadoresAmbiente(magiaOuEfeito, tipoAmbiente, opcoes = {}) {
      return aplicarModificadoresAmbiente(magiaOuEfeito, tipoAmbiente, { actor: this, ...opcoes });
    },
    calcularEfeitoMagiaNoAmbiente(magia, ambiente, opcoes = {}) {
      return calcularEfeitoMagiaNoAmbiente(magia, ambiente, { actor: this, ...opcoes });
    },
    avaliarResultadoProducao(resultadoTeste, opcoes = {}) {
      return avaliarResultadoProducao(resultadoTeste, opcoes);
    },
    calcularBonusDedicacaoTempo(dedicacaoTempo) {
      return calcularBonusDedicacaoTempo(dedicacaoTempo);
    },
    calcularMaterialDesmontagem(custoOuMaterialOriginal) {
      return calcularMaterialDesmontagem(custoOuMaterialOriginal);
    },
    avaliarItem(resultadoTeste, opcoes = {}) {
      return avaliarItem(resultadoTeste, opcoes);
    },
    procurarJazidaMineral(resultadoTeste, opcoes = {}) {
      return procurarJazidaMineral(resultadoTeste, opcoes);
    },
    extrairMinerio(metodo, resultadoTeste, tipoMaterial = "comum", opcoes = {}) {
      const int = this.system?.attributes?.inteligencia?.value ?? 2;
      return extrairMinerio(metodo, resultadoTeste, tipoMaterial, { inteligencia: int, ...opcoes });
    },
    avaliarRolagemDados(dadosRolados, modificadorAtributo, opcoes = {}) {
      const mod = modificadorAtributo !== undefined
        ? modificadorAtributo
        : Number(this.system?.attributes?.forca?.value ?? 0);
      return avaliarRolagemDados(dadosRolados, mod, opcoes);
    },
    verificarDuplaInaptidao(opcoes = {}) {
      return verificarDuplaInaptidao(this, opcoes);
    },
    resolverConfrontoOposto(resultadoB, opcoes = {}) {
      return resolverConfrontoOposto(this, resultadoB, opcoes);
    },
  };

  actor.system.parent = actor;
  Object.setPrototypeOf(actor.system, MightyBladeCharacterData.prototype);
  actor.prepareDerivedData();

  return actor;
}

globalThis.createMockActor = createMockActor;

function wrapCharacterProxy(actor, baseAttributes) {
  let preLevelUpStats = null;

  const proxy = new Proxy(actor, {
    get(target, prop) {
      if (prop === "_rawActor") return target;
      if (prop === "_baseAttributes") return baseAttributes;
      if (prop === "_snapshotStats") {
        return () => {
          preLevelUpStats = {
            pv: target.system.resources.vida.value,
            pm: target.system.resources.mana.value,
            pvMax: target.system.resources.vida.max,
            pmMax: target.system.resources.mana.max,
            vida: target.system.resources.vida.value,
            mana: target.system.resources.mana.value,
            pvAtual: target.system.resources.vida.value,
            pmAtual: target.system.resources.mana.value,
            determinacao: target.system.defesas.determinacao.value,
            esquiva: target.system.defesas.esquiva.value,
            bloqueio: target.system.defesas.bloqueio.value,
            deslocamento: target.system.subattributes.deslocamento.value,
            carga: target.system.subattributes.carga.max,
          };
        };
      }
      if (prop === "_clearSnapshotStats") {
        return () => {
          preLevelUpStats = null;
        };
      }
      if (prop === "stats") {
        if (preLevelUpStats) return preLevelUpStats;
        return {
          pv: target.system.resources.vida.value,
          pm: target.system.resources.mana.value,
          pvMax: target.system.resources.vida.max,
          pmMax: target.system.resources.mana.max,
          vida: target.system.resources.vida.value,
          mana: target.system.resources.mana.value,
          pvAtual: target.system.resources.vida.value,
          pmAtual: target.system.resources.mana.value,
          determinacao: target.system.defesas.determinacao.value,
          esquiva: target.system.defesas.esquiva.value,
          bloqueio: target.system.defesas.bloqueio.value,
          deslocamento: target.system.subattributes.deslocamento.value,
          carga: target.system.subattributes.carga.max,
        };
      }
      if (prop === "attributes") {
        return {
          forca: target.system.attributes.forca.value,
          agilidade: target.system.attributes.agilidade.value,
          inteligencia: target.system.attributes.inteligencia.value,
          vontade: target.system.attributes.vontade.value,
        };
      }
      if (prop === "baseAttributes") {
        return baseAttributes;
      }
      if (prop === "abilities") {
        return target.items.filter((i) => i.type === "habilidade");
      }
      if (prop === "level") {
        return target.system.details.nivel;
      }
      if (prop === "aprendiz") {
        return target.system.details.aprendiz;
      }
      return target[prop];
    },
  });

  return proxy;
}

export function createCharacter(options = {}) {
  const {
    raceId,
    raca,
    classId,
    classe,
    humanBonusAttribute,
    adaptabilidade,
    draconicOrigin,
    origemDraconica,
    level = 1,
    nivel = 1,
    abilities = [],
    habilidades = [],
  } = options;

  const targetLevel = level || nivel || 1;
  const raceKey = (raceId || raca || "").toString().toLowerCase().trim();
  const classKey = (classId || classe || "").toString().toLowerCase().trim();

  // Sub-módulo 7.3.1: Aprendiz de Classe bloqueado no Nível 1
  if (
    targetLevel < 2 &&
    (options.aprendiz ||
      options.aprendizClass ||
      String(options.evolutionPoint || "")
        .toLowerCase()
        .includes("aprendiz"))
  ) {
    throw new Error(
      "Aprendiz de Classe bloqueado no Nível 1: Aprendiz de Classe só pode ser adquirido a partir do Nível 2."
    );
  }

  // Mapeamento de sinônimos/aliases comuns
  const raceAliasMap = {
    "anao": "Anão",
    "asterio": "Astério",
    "asteria": "Astéria",
    "metadilio": "Metadílio",
    "naga": "Naga (Macho)",
    "naga macho": "Naga (Macho)",
    "naga femea": "Naga (Fêmea)",
    "naga_macho": "Naga (Macho)",
    "naga_femea": "Naga (Fêmea)",
    "naga-m": "Naga (Macho)",
    "naga-f": "Naga (Fêmea)",
  };

  const classAliasMap = {
    "mago": "Feiticeiro",
    "runico": "Rúnico",
    "xama": "Xamã",
  };

  const resolvedRaceName = raceAliasMap[raceKey] || raceKey;
  const resolvedClassName = classAliasMap[classKey] || classKey;

  let raceDoc = null;
  if (resolvedRaceName) {
    raceDoc = CANONICAL_RACAS.find((r) => {
      const n = r.name.toLowerCase();
      const nNorm = r.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const slug = r.flags?.["mighty-blade"]?.slug || "";
      return n === resolvedRaceName.toLowerCase() || nNorm === resolvedRaceName.toLowerCase() || slug === resolvedRaceName.toLowerCase();
    });
  }

  const isHumano = (raceDoc && raceDoc.name.toLowerCase() === "humano") || raceKey === "humano";
  const isDragano = (raceDoc && raceDoc.name.toLowerCase() === "dragano") || raceKey === "dragano";
  const hasExplicitLevel = options.level !== undefined || options.nivel !== undefined;
  const humanBonus = humanBonusAttribute || adaptabilidade || (isHumano && hasExplicitLevel ? "vontade" : undefined);
  const draconicChoice = draconicOrigin || origemDraconica;

  if (isHumano && !humanBonus) {
    throw new Error("Selecione o atributo extra da Adaptabilidade Humana.");
  }

  let classDoc = null;
  if (resolvedClassName) {
    classDoc = CANONICAL_CLASSES.find((c) => {
      const n = c.name.toLowerCase();
      const nNorm = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const slug = c.flags?.["mighty-blade"]?.slug || "";
      return n === resolvedClassName.toLowerCase() || nNorm === resolvedClassName.toLowerCase() || slug === resolvedClassName.toLowerCase();
    });
  }

  const actor = createMockActor({
    name: options.name || "Herói Teste",
    details: {
      nivel: targetLevel,
      raca: raceDoc?.name || "",
      classe: classDoc?.name || "",
    },
  });

  if (raceDoc && classDoc) {
    const check = validarClasseRaca({ items: [raceDoc], system: { details: {} } }, classDoc.name);
    if (!check.permitido) throw new Error(check.motivo);
  }

  if (raceDoc) {
    actor.addItem(raceDoc);
    if (isDragano && draconicChoice) {
      const { parentItemData, subFeatureItemsData } = construirItensOrigemDraconica(
        draconicChoice,
        { sourceRaceId: raceDoc._id || "race-dragano" }
      );
      parentItemData._id = parentItemData._id || "hab-linhagem-draconica";
      actor.addItem(parentItemData);
      for (const sub of subFeatureItemsData) {
        sub.flags = sub.flags || {};
        sub.flags["mighty-blade"] = sub.flags["mighty-blade"] || {};
        sub.flags["mighty-blade"].parentAbilityId = parentItemData._id;
        actor.addItem(sub);
      }
    } else if (raceDoc.system?.habilidadeAutomatica?.nome) {
      actor.addItem({
        name: raceDoc.system.habilidadeAutomatica.nome,
        type: "habilidade",
        system: {
          tipo: raceDoc.system.habilidadeAutomatica.tipo || "suporte",
          categoria: raceDoc.system.habilidadeAutomatica.categoria || "caracteristica",
          custo: raceDoc.system.habilidadeAutomatica.custo || 0,
        },
      });
    }
  }

  if (isHumano && humanBonus) {
    const attrNorm = humanBonus.toLowerCase().trim();
    const adaptItem = actor.items.find((i) => i.type === "habilidade" && i.name === "Adaptabilidade");
    if (adaptItem) {
      aplicarEscolhaAtributoNoItem(adaptItem, attrNorm, 1);
    } else {
      actor.addItem(
        aplicarEscolhaAtributoNoItem(
          { name: "Adaptabilidade", type: "habilidade", system: {} },
          attrNorm,
          1
        )
      );
    }
  }

  if (classDoc) {
    actor.addItem(classDoc);
    const conc = classDoc.system?.concessoes?.find((c) => c.tipo === "habilidade");
    const autoHabilidadeMap = {
      "mestre-de-armas-1": "Mestre de Armas 1",
      "conhecimento-arcano": "Conhecimento Arcano",
      "gatuno": "Gatuno",
      "conhecimento-mistico": "Conhecimento Místico",
      "arqueria": "Arqueria",
      "poesia-dos-bardos": "Poesia dos Bardos",
      "posicao-distinta": "Posição Distinta",
      "guia-espiritual": "Guia Espiritual",
    };
    const autoNome = conc?.ref ? (autoHabilidadeMap[conc.ref] || conc.ref) : classDoc.system?.habilidadeAutomatica?.nome;
    if (autoNome) {
      actor.addItem({
        name: autoNome,
        type: "habilidade",
        system: { tipo: "suporte", categoria: "classe" },
      });
    }
  }

  const extraAbilities = [...abilities, ...habilidades];
  for (const hab of extraAbilities) {
    if (typeof hab === "string") {
      actor.addItem({ name: hab, type: "habilidade" });
    } else if (hab && typeof hab === "object") {
      actor.addItem(hab);
    }
  }

  actor.prepareDerivedData();
  actor.system.resources.vida.value = actor.system.resources.vida.max;
  actor.system.resources.mana.value = actor.system.resources.mana.max;

  const raceAttrs = raceDoc?.system?.atributos || { forca: 0, agilidade: 0, inteligencia: 0, vontade: 0 };
  const classAttrs = classDoc?.system?.atributos || { forca: 0, agilidade: 0, inteligencia: 0, vontade: 0 };
  const baseAttributes = {
    forca: (raceAttrs.forca || 0) + (classAttrs.forca || 0) + (isHumano && humanBonus === "forca" ? 1 : 0),
    agilidade: (raceAttrs.agilidade || 0) + (classAttrs.agilidade || 0) + (isHumano && humanBonus === "agilidade" ? 1 : 0),
    inteligencia: (raceAttrs.inteligencia || 0) + (classAttrs.inteligencia || 0) + (isHumano && humanBonus === "inteligencia" ? 1 : 0),
    vontade: (raceAttrs.vontade || 0) + (classAttrs.vontade || 0) + (isHumano && humanBonus === "vontade" ? 1 : 0),
  };

  return wrapCharacterProxy(actor, baseAttributes);
}

export function levelUp(char, options = {}) {
  const actor = char?._rawActor || char;
  const curLevel = Number(actor.system?.details?.nivel) || 1;
  const {
    targetLevel,
    nextLevel,
    level,
    nivel,
    attributeIncreases,
    evolutionPoint,
    benefit,
    pontoEvolucao,
    evolutionPoints,
    benefits,
    aprendizClass,
    classeAprendiz,
    aprendiz,
    newAbility,
    novaHabilidade,
    ability,
    habilidade,
    newAbilities,
  } = options;

  const lvl = targetLevel ?? nextLevel ?? level ?? nivel ?? (curLevel + 1);

  // 1. Sub-módulo 7.4: Teto Canônico de Nível (Nível 10)
  if (curLevel >= 10 || lvl > 10) {
    throw new Error(
      "Teto de Nível atingido: O nível máximo de evolução padrão no Mighty Blade 3e é o Nível 10 — Nível máximo alcançado (10)."
    );
  }

  // 2. Sub-módulo 1.5: Validação de Incremento de Atributos nos Níveis 4, 7 e 10
  if (attributeIncreases !== undefined) {
    if (!Array.isArray(attributeIncreases) || (lvl !== 4 && lvl !== 7 && lvl !== 10)) {
      throw new Error(`Nível ${lvl} não permite alocação de atributos.`);
    }
    if (attributeIncreases.length === 2 && attributeIncreases[0] === attributeIncreases[1]) {
      throw new Error(`É necessário escolher dois atributos DIFERENTES para incrementar no Nível ${lvl}.`);
    }
    const val = validarAumentoAtributos(lvl, attributeIncreases);
    if (!val.valido) {
      throw new Error(val.erro || `É necessário escolher dois atributos DIFERENTES para incrementar no Nível ${lvl}.`);
    }
  }

  // 3. Sub-módulo 7.2: Distribuição Atômica do Ponto de Evolução
  const providedBenefits = [evolutionPoint, benefit, pontoEvolucao, evolutionPoints, benefits].filter(
    (v) => v !== undefined
  );
  if (providedBenefits.length > 1) {
    throw new Error(
      "Distribuição do Ponto de Evolução: Não é permitido escolher múltiplos benefícios no mesmo nível. Exige exatamente 1 escolha válida."
    );
  }

  const rawBenefit = providedBenefits[0];
  const rawAprendizOpt = aprendizClass ?? classeAprendiz ?? aprendiz ?? null;
  const parsedBenefit = normalizarPontoEvolucao(rawBenefit, rawAprendizOpt);

  // 4. Sub-módulo 7.3.1: Liberação de Aprendiz de Classe a partir do Nível 2
  if (parsedBenefit.tipo === "aprendiz" && lvl < 2) {
    throw new Error(
      "Aprendiz de Classe bloqueado no Nível 1: Aprendiz de Classe só pode ser adquirido a partir do Nível 2."
    );
  }

  if (lvl <= curLevel) {
    throw new Error(`Nível alvo (${lvl}) deve ser estritamente maior que o nível atual (${curLevel}).`);
  }

  if (!parsedBenefit.valido) {
    throw new Error(parsedBenefit.erro);
  }

  // 5. Sub-módulo 7.3: Regras de Aprendiz de Classe Único
  let resolvedAprendizClass = "";
  let aprendizAutoAbilityName = "";
  if (parsedBenefit.tipo === "aprendiz") {
    if (!parsedBenefit.aprendizClass) {
      throw new Error("Uma classe secundária deve ser informada para o benefício Aprendiz de Classe.");
    }
    resolvedAprendizClass = resolverClasseCanonica(parsedBenefit.aprendizClass) || "";
    if (!resolvedAprendizClass) {
      throw new Error(`Classe secundária de Aprendiz inválida: "${parsedBenefit.aprendizClass}".`);
    }

    const currentAprendiz = (actor.system?.details?.aprendiz || "").trim();
    if (currentAprendiz) {
      throw new Error(
        `O personagem já possui uma classe de Aprendiz (${currentAprendiz}). O herói já é Aprendiz de ${currentAprendiz}. As regras do Mighty Blade não permitem acumular múltiplos aprendizes de classe.`
      );
    }

    const primaryClassDoc = actor.items.find((i) => i.type === "classe");
    const primaryClass = (primaryClassDoc?.name || actor.system?.details?.classe || "").trim();
    if (primaryClass && norm(primaryClass) === norm(resolvedAprendizClass)) {
      throw new Error(
        `O personagem já pertence à classe principal ${primaryClass} e não pode escolher a mesma classe como Aprendiz.`
      );
    }

    const racaCheck = validarClasseRaca(actor, resolvedAprendizClass);
    if (!racaCheck.permitido) {
      throw new Error(racaCheck.motivo);
    }

    const pactoCheck = validarIncompatibilidadePactoMisticismo(actor, {
      tipo: "aprendiz",
      nome: resolvedAprendizClass,
    });
    if (!pactoCheck.permitido) {
      throw new Error(pactoCheck.motivo);
    }

    aprendizAutoAbilityName = obterHabilidadeAutomaticaClasse(resolvedAprendizClass) || "";
  }

  // 6. Sub-módulo 7.1: Ganho de Habilidade por Nível (exatamente 1 nova habilidade)
  const abilityInput = newAbility ?? novaHabilidade ?? ability ?? habilidade ?? newAbilities;
  if (Array.isArray(abilityInput) && abilityInput.length !== 1) {
    throw new Error(
      `Ganho de Habilidade por Nível: O personagem recebe exatamente 1 nova habilidade por nível alcançado (foram informadas ${abilityInput.length}).`
    );
  }
  const singleNewAbility = Array.isArray(abilityInput) ? abilityInput[0] : abilityInput;

  // Snapshot do estado prévio para atomicidade total em caso de falha na habilidade
  const prevNivel = actor.system.details.nivel;
  const prevAprendiz = actor.system.details.aprendiz;
  const prevEvolucao = actor.system.details.evolucao;
  const prevCaminho = actor.system.details.caminho;
  const prevAttrsBase = {
    forca: actor.system.attributes.forca.base,
    agilidade: actor.system.attributes.agilidade.base,
    inteligencia: actor.system.attributes.inteligencia.base,
    vontade: actor.system.attributes.vontade.base,
  };
  const prevItems = [...actor.items];

  if (typeof char?._snapshotStats === "function") {
    char._snapshotStats();
  }

  try {
    actor.system.details.nivel = lvl;

    if (attributeIncreases && Array.isArray(attributeIncreases)) {
      for (const attr of attributeIncreases) {
        actor.system.attributes[attr].base = (actor.system.attributes[attr].base || 0) + 1;
      }
    }

    if (parsedBenefit.tipo === "aprendiz") {
      actor.system.details.aprendiz = resolvedAprendizClass;
      actor.system.details.evolucao = `Aprendiz de ${resolvedAprendizClass}`;
    } else if (parsedBenefit.tipo === "caminho" && parsedBenefit.caminhoNome) {
      actor.system.details.caminho = parsedBenefit.caminhoNome;
      actor.system.details.evolucao = `Caminho: ${parsedBenefit.caminhoNome}`;
    }

    actor.prepareDerivedData();

    if (singleNewAbility !== undefined && singleNewAbility !== null) {
      adquirirHabilidadeSync(actor, singleNewAbility);
    }

    // Concede Habilidade Automática da classe de Aprendiz (sem conceder bônus de atributos iniciais)
    if (parsedBenefit.tipo === "aprendiz" && aprendizAutoAbilityName) {
      const alreadyHasAuto = actor.items.some(
        (i) => i.type === "habilidade" && norm(i.name) === norm(aprendizAutoAbilityName)
      );
      if (!alreadyHasAuto) {
        actor.addItem({
          name: aprendizAutoAbilityName,
          type: "habilidade",
          system: { tipo: "suporte", categoria: "classe" },
          flags: {
            "mighty-blade": {
              sourceAprendiz: true,
              sourceAprendizClass: resolvedAprendizClass,
            },
          },
          getFlag(scope, k) {
            return this.flags?.[scope]?.[k];
          },
        });
      }
    }

    // Aplica bônus de PV / PM do Ponto de Evolução
    if (parsedBenefit.pvDelta > 0) {
      const curBaseVida = Number(actor.system.resources.vida.baseMax ?? actor.system.resources.vida.max) || 60;
      const curValVida = Number(actor.system.resources.vida.value) || 60;
      actor.system.resources.vida.baseMax = curBaseVida + parsedBenefit.pvDelta;
      actor.system.resources.vida.max = curBaseVida + parsedBenefit.pvDelta;
      actor.system.resources.vida.value = curValVida + parsedBenefit.pvDelta;
    }

    if (parsedBenefit.pmDelta > 0) {
      const curBaseMana = Number(actor.system.resources.mana.baseMax ?? actor.system.resources.mana.max) || 60;
      const curValMana = Number(actor.system.resources.mana.value) || 60;
      actor.system.resources.mana.baseMax = curBaseMana + parsedBenefit.pmDelta;
      actor.system.resources.mana.max = curBaseMana + parsedBenefit.pmDelta;
      actor.system.resources.mana.value = curValMana + parsedBenefit.pmDelta;
    }

    actor.prepareDerivedData();
    actor.system.resources.vida.value = actor.system.resources.vida.max;
    actor.system.resources.mana.value = actor.system.resources.mana.max;
  } catch (err) {
    actor.system.details.nivel = prevNivel;
    actor.system.details.aprendiz = prevAprendiz;
    actor.system.details.evolucao = prevEvolucao;
    actor.system.details.caminho = prevCaminho;
    actor.system.attributes.forca.base = prevAttrsBase.forca;
    actor.system.attributes.agilidade.base = prevAttrsBase.agilidade;
    actor.system.attributes.inteligencia.base = prevAttrsBase.inteligencia;
    actor.system.attributes.vontade.base = prevAttrsBase.vontade;
    actor.items = prevItems;
    actor.prepareDerivedData();
    if (typeof char?._clearSnapshotStats === "function") {
      char._clearSnapshotStats();
    }
    throw err;
  }

  return wrapCharacterProxy(actor, char?._baseAttributes || {});
}

globalThis.createCharacter = createCharacter;
globalThis.levelUp = levelUp;

/**
 * Adiciona uma habilidade ao personagem aplicando as travas do motor de restrições.
 * Lança Error se proibida; ao adquirir Pacto, revoga Dogma/Conhecimento Místico.
 */
export function addAbility(char, habilidade) {
  adquirirHabilidadeSync(char, habilidade);
  return char;
}

