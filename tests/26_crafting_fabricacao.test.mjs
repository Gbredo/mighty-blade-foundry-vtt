/**
 * Suíte de Testes Automatizados - Subtítulo 26: Sistema de Fabricação (Crafting), Mineração e Avaliação
 * Mighty Blade 3ª Edição (Guia do Herói, Cap. IV, pág. 47–56; Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 * - Caso 1: Tabela Canônica de Produção de Itens (Artesão)
 *   * <= 6: Falha no trabalho, perda de 50% das matérias-primas.
 *   * Falha Crítica: Falha no trabalho, perda de 100% das matérias-primas e ferramentas quebradas.
 *   * 7 a 9: Produz item de Qualidade Baixa (preço x0.5, dano -1, defesa -1, risco de quebra CD 12).
 *   * 10 a 15: Produz item de Qualidade Mediana/Comum (preço x1.0, atributos padrão).
 *   * 16 a 20: Produz item de Qualidade Alta (preço x3.0, +2 na Dificuldade para encantar, ataque +1, FN -1).
 *   * >= 21: Produz uma Obra-Prima (preço x10.0, ataque +1, dano +1, defesa +1, FN -1, +2 em testes de ferramentas).
 *
 * - Caso 2: Regras Especiais de Materiais na Produção
 *   * Aço Crisol nunca pode ser de qualidade baixa (7 a 9 vira mediana).
 *   * Bronze nunca pode ser obra-prima (>= 21 fica restrito a alta).
 *   * Propriedades canônicas de Aço Anão e Prata Fria.
 *
 * - Caso 3: Dedicação de Tempo e Bônus de Fabricação
 *   * Gastar o dobro do tempo necessário concede +2 no teste de fabricação.
 *   * Tempo normal não concede bônus.
 *   * Transformação de Qualidade Alta para Obra-Prima com bônus de dedicação.
 *
 * - Caso 4: Desmontagem e Reaproveitamento de Materiais
 *   * Destruir um item fornece exatamente 50% do material necessário para criar um novo.
 *   * Suporte a números diretos e objetos de itens/matéria-prima.
 *
 * - Caso 5: Sistema de Avaliação de Itens (Guia do Herói, pág. 53)
 *   * Exame de 1 minuto em Inteligência.
 *   * Limiar 10+: Avalia qualidade e histórico de conserto/modificação.
 *   * Limiar 14+: Avalia quantidade de pessoas e se foi feito no tempo normal ou dobro.
 *   * Limiar 18+: Avalia propriedades mágicas e tipo geral de encantamento.
 *
 * - Caso 6: Prospecção Mineral, Garimpagem e Mineração (Guia do Herói, pág. 48–49)
 *   * Procura de jazida mineral (Inteligência Dif 16, 1 dia).
 *   * Materiais preciosos exigem sucesso decisivo na busca.
 *   * Garimpagem diária vs Mineração semanal.
 *   * Garimpagem de Aluvião élfica (teste único de Inteligência com peneira).
 *
 * - Caso 7: Conserto, Custo de Matéria-Prima, Risco de Quebra e Integração com Actor Mock
 *   * Matéria-prima = 50% do preço de venda do item.
 *   * Conserto não exige teste, consome 50% do tempo e material original.
 *   * Teste de risco de quebra de itens de qualidade baixa (CD 12).
 *   * Métodos de conveniência no Actor Mock.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
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
} from "./test-helper.mjs";

// ============================================================================
// CASO 1: TABELA CANÔNICA DE PRODUÇÃO DE ITENS (ARTESÃO)
// ============================================================================
test("Subtítulo 26 - Caso 1: Tabela Canônica de Produção de Itens (Artesão)", async (t) => {
  await t.test("1.1 - Resultado <= 6: Falha no trabalho e perda de 50% das matérias-primas", () => {
    const res6 = avaliarResultadoProducao(6);
    assert.equal(res6.sucesso, false, "Rolagem 6 deve resultar em insucesso");
    assert.equal(res6.qualidade, "falha", "Qualidade deve ser 'falha'");
    assert.equal(res6.perdaMateriaPrima, 0.5, "Perde 50% (0.5) das matérias-primas em falha comum");
    assert.equal(res6.ferramentasQuebradas, false, "Ferramentas não quebram em falha simples");
    assert.equal(res6.multiplicadorPreco, 0, "Multiplicador de preço deve ser 0");

    const res3 = avaliarResultadoProducao(3);
    assert.equal(res3.sucesso, false);
    assert.equal(res3.qualidade, "falha");
    assert.equal(res3.perdaMateriaPrima, 0.5);
  });

  await t.test("1.2 - Falha Crítica: Perde 100% das matérias-primas e quebra ferramentas", () => {
    const resCritico = avaliarResultadoProducao(4, { falhaCritica: true });
    assert.equal(resCritico.sucesso, false, "Falha crítica deve ser insucesso");
    assert.equal(resCritico.qualidade, "falha", "Qualidade deve ser 'falha'");
    assert.equal(resCritico.perdaMateriaPrima, 1.0, "Perde 100% (1.0) das matérias-primas");
    assert.equal(resCritico.ferramentasQuebradas, true, "Ferramentas devem ser quebradas");
    assert.equal(resCritico.falhaCritica, true, "Flag falhaCritica deve ser true");

    const resCritStr = avaliarResultadoProducao(5, { critico: "falha" });
    assert.equal(resCritStr.perdaMateriaPrima, 1.0);
    assert.equal(resCritStr.ferramentasQuebradas, true);
  });

  await t.test("1.3 - Resultado 7 a 9: Produz item de Qualidade Baixa", () => {
    for (const valor of [7, 8, 9]) {
      const res = avaliarResultadoProducao(valor);
      assert.equal(res.sucesso, true, `Rolagem ${valor} deve ser sucesso`);
      assert.equal(res.qualidade, "baixa", `Rolagem ${valor} deve produzir qualidade baixa`);
      assert.equal(res.perdaMateriaPrima, 0, "Não há perda de material no sucesso");
      assert.equal(res.ferramentasQuebradas, false, "Ferramentas intactas");
      assert.equal(res.multiplicadorPreco, 0.5, "Itens de qualidade baixa custam metade (0.5x)");
      assert.equal(res.modificadores.dano, -1, "Armas de qualidade baixa causam -1 de dano");
      assert.equal(res.modificadores.defesa, -1, "Armaduras/escudos de qualidade baixa têm Defesa -1");
      assert.equal(res.modificadores.riscoQuebra, true, "Item de qualidade baixa possui risco de quebra");
      assert.equal(res.modificadores.cdTesteQuebra, 12, "CD de teste de quebra é 12");
    }
  });

  await t.test("1.4 - Resultado 10 a 15: Produz item de Qualidade Mediana / Comum", () => {
    for (const valor of [10, 12, 15]) {
      const res = avaliarResultadoProducao(valor);
      assert.equal(res.sucesso, true, `Rolagem ${valor} deve ser sucesso`);
      assert.equal(res.qualidade, "mediana", `Rolagem ${valor} deve produzir qualidade mediana`);
      assert.equal(res.multiplicadorPreco, 1.0, "Multiplicador de preço deve ser 1.0x");
      assert.equal(res.modificadores.dano, 0, "Sem modificador de dano");
      assert.equal(res.modificadores.defesa, 0, "Sem modificador de defesa");
      assert.equal(res.modificadores.riscoQuebra, false, "Sem risco de quebra");
    }
  });

  await t.test("1.5 - Resultado 16 a 20: Produz item de Qualidade Alta (+2 na Dificuldade para encantar)", () => {
    for (const valor of [16, 18, 20]) {
      const res = avaliarResultadoProducao(valor);
      assert.equal(res.sucesso, true, `Rolagem ${valor} deve ser sucesso`);
      assert.equal(res.qualidade, "alta", `Rolagem ${valor} deve produzir qualidade alta`);
      assert.equal(res.multiplicadorPreco, 3.0, "Itens de qualidade alta custam o triplo (3.0x)");
      assert.equal(res.dificuldadeEncantarMod, 2, "Concede +2 na Dificuldade para encantar");
      assert.equal(res.dificuldadeEncantar, 2, "Alias dificuldadeEncantar deve ser 2");
      assert.equal(res.modificadores.ataque, 1, "Armas de qualidade alta concedem +1 em rolagens de ataque");
      assert.equal(res.modificadores.fn, -1, "Armaduras de qualidade alta têm FN -1 (mínimo 1)");
      assert.equal(res.modificadores.bonusTestes, 1, "Ferramentas/kits de qualidade alta dão +1 em testes adequados");
    }
  });

  await t.test("1.6 - Resultado >= 21: Produz uma Obra-Prima", () => {
    for (const valor of [21, 23, 28]) {
      const res = avaliarResultadoProducao(valor);
      assert.equal(res.sucesso, true, `Rolagem ${valor} deve ser sucesso`);
      assert.equal(res.qualidade, "obra-prima", `Rolagem ${valor} deve produzir obra-prima`);
      assert.equal(res.multiplicadorPreco, 10.0, "Obras-primas custam dez vezes o preço normal (10.0x)");
      assert.equal(res.dificuldadeEncantarMod, 2, "Mantém bônus de qualidade alta para encantar (+2)");
      assert.equal(res.modificadores.ataque, 1, "Armas de obra-prima recebem +1 no ataque");
      assert.equal(res.modificadores.dano, 1, "Armas de obra-prima causam +1 de dano");
      assert.equal(res.modificadores.defesa, 1, "Armaduras e escudos de obra-prima têm Defesa +1");
      assert.equal(res.modificadores.fn, -1, "Armaduras de obra-prima têm FN -1");
      assert.equal(res.modificadores.bonusTestes, 2, "Outros itens concedem +2 nas rolagens adequadas (em vez de +1)");
    }
  });
});

// ============================================================================
// CASO 2: REGRAS ESPECIAIS DE MATERIAIS NA PRODUÇÃO
// ============================================================================
test("Subtítulo 26 - Caso 2: Regras Especiais de Materiais na Produção", async (t) => {
  await t.test("2.1 - Aço Crisol: Nunca pode ser de qualidade baixa (7 a 9 resulta em mediana)", () => {
    const resCrisolBaixo = avaliarResultadoProducao(8, { material: "crisol" });
    assert.equal(resCrisolBaixo.sucesso, true);
    assert.equal(resCrisolBaixo.qualidade, "mediana", "Crisol converte 7-9 em qualidade mediana");
    assert.equal(resCrisolBaixo.multiplicadorPreco, 1.0);

    const resAcoComum = avaliarResultadoProducao(8, { material: "aco" });
    assert.equal(resAcoComum.qualidade, "baixa", "Aço comum em 8 deve ser qualidade baixa");
  });

  await t.test("2.2 - Bronze: Nunca pode ser obra-prima (>= 21 fica restrito a alta)", () => {
    const resBronze = avaliarResultadoProducao(23, { material: "bronze" });
    assert.equal(resBronze.sucesso, true);
    assert.equal(resBronze.qualidade, "alta", "Bronze converte obra-prima (>=21) em qualidade alta");
    assert.equal(resBronze.multiplicadorPreco, 3.0);

    const resAcoObraPrima = avaliarResultadoProducao(23, { material: "aco" });
    assert.equal(resAcoObraPrima.qualidade, "obra-prima", "Aço comum em 23 deve ser obra-prima");
  });

  await t.test("2.3 - Tabela de Materiais Especiais Canônicos", () => {
    assert.ok(MATERIAIS_ESPECIAIS["aco-anao"], "Aço Anão deve estar registrado");
    assert.equal(MATERIAIS_ESPECIAIS["aco-anao"].multiplicadorCusto, 1.5, "Aço anão custa 1.5x");
    assert.equal(MATERIAIS_ESPECIAIS["aco-anao"].modDano, 1, "Armas de aço anão causam Dano +1");
    assert.equal(MATERIAIS_ESPECIAIS["aco-anao"].modDefesa, 1, "Armaduras/escudos de aço anão dão Defesa +1");

    assert.ok(MATERIAIS_ESPECIAIS["bronze"], "Bronze deve estar registrado");
    assert.equal(MATERIAIS_ESPECIAIS["bronze"].multiplicadorCusto, 3.0, "Bronze custa 3x");
    assert.equal(MATERIAIS_ESPECIAIS["bronze"].modDano, -1, "Armas de bronze causam Dano -1");
    assert.equal(MATERIAIS_ESPECIAIS["bronze"].modFN, 1, "Bronze aumenta FN em +1");

    assert.ok(MATERIAIS_ESPECIAIS["crisol"], "Crisol deve estar registrado");
    assert.equal(MATERIAIS_ESPECIAIS["crisol"].multiplicadorCusto, 2.0, "Crisol custa 2x");
    assert.equal(MATERIAIS_ESPECIAIS["crisol"].modFN, -1, "Crisol reduz FN em -1");

    assert.ok(MATERIAIS_ESPECIAIS["prata-fria"], "Prata Fria deve estar registrada");
    assert.equal(MATERIAIS_ESPECIAIS["prata-fria"].multiplicadorCusto, 2.0, "Prata fria custa 2x");
    assert.equal(MATERIAIS_ESPECIAIS["prata-fria"].modDano, 1, "Armas de prata fria causam Dano +1");
  });
});

// ============================================================================
// CASO 3: DEDICAÇÃO DE TEMPO E BÔNUS DE FABRICAÇÃO
// ============================================================================
test("Subtítulo 26 - Caso 3: Dedicação de Tempo e Bônus de Fabricação", async (t) => {
  await t.test("3.1 - Gastar o dobro do tempo concede exatamente +2 de bônus no teste", () => {
    assert.equal(calcularBonusDedicacaoTempo(true), 2, "Boolean true deve conceder bônus 2");
    assert.equal(calcularBonusDedicacaoTempo(2), 2, "Multiplicador numérico 2 deve conceder 2");
    assert.equal(calcularBonusDedicacaoTempo("dobro"), 2, "String 'dobro' deve conceder 2");
    assert.equal(calcularBonusDedicacaoTempo("2x"), 2, "String '2x' deve conceder 2");
    assert.equal(calcularBonusDedicacaoTempo({ dobro: true }), 2, "Objeto com { dobro: true } deve conceder 2");
    assert.equal(calcularBonusDedicacaoTempo({ fator: 2 }), 2, "Objeto com { fator: 2 } deve conceder 2");
  });

  await t.test("3.2 - Tempo normal ou insuficiente não concede bônus (0)", () => {
    assert.equal(calcularBonusDedicacaoTempo(false), 0, "Boolean false deve retornar 0");
    assert.equal(calcularBonusDedicacaoTempo(1), 0, "Multiplicador 1x deve retornar 0");
    assert.equal(calcularBonusDedicacaoTempo("normal"), 0, "String 'normal' deve retornar 0");
    assert.equal(calcularBonusDedicacaoTempo(null), 0, "null deve retornar 0");
    assert.equal(calcularBonusDedicacaoTempo(undefined), 0, "undefined deve retornar 0");
  });

  await t.test("3.3 - Aplicação prática: Dedicação de tempo eleva resultado de 19 para 21 (Obra-Prima)", () => {
    const rolagemBase = 19;
    const resSemDedicacao = avaliarResultadoProducao(rolagemBase);
    assert.equal(resSemDedicacao.qualidade, "alta", "Sem dedicação de tempo, 19 é qualidade alta");

    const bonus = calcularBonusDedicacaoTempo("dobro");
    assert.equal(bonus, 2, "Bônus deve ser +2");

    const rolagemFinal = rolagemBase + bonus;
    assert.equal(rolagemFinal, 21, "19 + 2 resulta em 21");

    const resComDedicacao = avaliarResultadoProducao(rolagemFinal);
    assert.equal(resComDedicacao.qualidade, "obra-prima", "Com o bônus de dedicação, o item se torna uma Obra-Prima!");
  });

  await t.test("3.4 - Cálculo de tempo dobrado e dias de trabalho por material", () => {
    const tempoNormalEspada = calcularTempoProducao("ferraria", 3, { material: "aco" });
    assert.equal(tempoNormalEspada.diasBase, 3, "Espada de aço com FN 3 leva 3 dias");
    assert.equal(tempoNormalEspada.diasFinais, 3);
    assert.equal(tempoNormalEspada.bonusTeste, 0);

    const tempoDobradoEspada = calcularTempoProducao("ferraria", 3, { material: "aco", dobro: true });
    assert.equal(tempoDobradoEspada.diasBase, 3);
    assert.equal(tempoDobradoEspada.diasFinais, 6, "Gastar o dobro leva 6 dias");
    assert.equal(tempoDobradoEspada.bonusTeste, 2, "Concede +2 no teste de fabricação");

    const tempoAcoAnao = calcularTempoProducao("ferraria", 4, { material: "aco-anao" });
    assert.equal(tempoAcoAnao.diasFinais, 6, "Aço anão leva 1.5x o tempo da FN (4 * 1.5 = 6)");

    const tempoCrisol = calcularTempoProducao("ferraria", 2, { material: "crisol" });
    assert.equal(tempoCrisol.diasFinais, 4, "Aço crisol leva o dobro da FN em dias (2 * 2 = 4)");
  });
});

// ============================================================================
// CASO 4: DESMONTAGEM E REAPROVEITAMENTO DE MATERIAIS
// ============================================================================
test("Subtítulo 26 - Caso 4: Desmontagem e Reaproveitamento de Materiais", async (t) => {
  await t.test("4.1 - Destruir item fornece exatamente 50% do material/custo original", () => {
    assert.equal(calcularMaterialDesmontagem(100), 50, "100 moedas de matéria-prima recuperam 50");
    assert.equal(calcularMaterialDesmontagem(250), 125, "250 recupera 125");
    assert.equal(calcularMaterialDesmontagem(10), 5, "10 recupera 5");
    assert.equal(calcularMaterialDesmontagem(0), 0, "0 recupera 0");
  });

  await t.test("4.2 - Suporte a objetos com propriedades estruturadas", () => {
    const itemComMateriaPrima = { materiaPrima: 80, nome: "Armadura de Ferro" };
    assert.equal(calcularMaterialDesmontagem(itemComMateriaPrima), 40, "Recupera 40 de matéria-prima");

    const itemComCusto = { custo: 500, nome: "Escudo Reforçado" };
    assert.equal(calcularMaterialDesmontagem(itemComCusto), 250, "Recupera metade do custo");

    const itemComPreco = { preco: 300 };
    assert.equal(calcularMaterialDesmontagem(itemComPreco), 150, "Recupera metade do preço");
  });

  await t.test("4.3 - Ciclo de reaproveitamento de item com defeito (Qualidade Baixa)", () => {
    const custoMateriaPrimaOriginal = 120;
    const testeRuim = avaliarResultadoProducao(8); // Qualidade Baixa
    assert.equal(testeRuim.qualidade, "baixa", "Item saiu com qualidade baixa");

    // Artesão decide não ficar com a arma defeituosa e a destrói para reaproveitar
    const materialReaproveitado = calcularMaterialDesmontagem(custoMateriaPrimaOriginal);
    assert.equal(materialReaproveitado, 60, "Recupera exatamente 60 (50%) dos materiais originais");

    // Novo ciclo de produção com dedicação de tempo (+2)
    const materialNecessarioNovo = custoMateriaPrimaOriginal - materialReaproveitado;
    assert.equal(materialNecessarioNovo, 60, "O artesão agora precisa gastar apenas 60 moedas adicionais");
  });
});

// ============================================================================
// CASO 5: SISTEMA DE AVALIAÇÃO DE ITENS (GUIA DO HERÓI, PÁG. 53)
// ============================================================================
test("Subtítulo 26 - Caso 5: Sistema de Avaliação de Itens (Guia do Herói, pág. 53)", async (t) => {
  await t.test("5.1 - Exame com menos de 1 minuto falha por tempo insuficiente", () => {
    const resRapido = avaliarItem(20, { tempoExameMinutos: 0.5 });
    assert.equal(resRapido.sucesso, false);
    assert.equal(resRapido.grau, "tempo-insuficiente");
    assert.equal(resRapido.identificaQualidade, false);
  });

  await t.test("5.2 - Teste < 10: Falha na avaliação (não identifica nada)", () => {
    const resFalha = avaliarItem(9);
    assert.equal(resFalha.sucesso, false);
    assert.equal(resFalha.grau, "falha");
    assert.equal(resFalha.identificaQualidade, false);
    assert.equal(resFalha.identificaHistorico, false);
    assert.equal(resFalha.identificaMagia, false);
  });

  await t.test("5.3 - Teste 10 a 13 (Grau Básico): Identifica qualidade e consertos/modificações", () => {
    for (const valor of [10, 12, 13]) {
      const res = avaliarItem(valor);
      assert.equal(res.sucesso, true);
      assert.equal(res.grau, "basico");
      assert.equal(res.identificaQualidade, true, "Deve identificar qualidade do item");
      assert.equal(res.detalhes.consertosEModificacoes, true, "Deve identificar se foi consertado ou modificado");
      assert.equal(res.identificaHistorico, false, "Não identifica quantidade de trabalhadores ainda");
      assert.equal(res.identificaMagia, false, "Não identifica propriedades mágicas");
    }
  });

  await t.test("5.4 - Teste 14 a 17 (Grau Detalhado): Identifica artífices e dedicação de tempo", () => {
    for (const valor of [14, 16, 17]) {
      const res = avaliarItem(valor);
      assert.equal(res.sucesso, true);
      assert.equal(res.grau, "detalhado");
      assert.equal(res.identificaQualidade, true);
      assert.equal(res.identificaHistorico, true, "Deve identificar histórico detalhado");
      assert.equal(res.detalhes.quantidadeArtesaos, true, "Sabe quantas pessoas trabalharam no item");
      assert.equal(res.detalhes.dedicacaoTempo, true, "Sabe se foi feito no dobro do tempo");
      assert.equal(res.identificaMagia, false, "Não identifica propriedades mágicas ainda");
    }
  });

  await t.test("5.5 - Teste >= 18 (Grau Mágico): Identifica propriedades mágicas e tipo de encantamento", () => {
    for (const valor of [18, 22]) {
      const res = avaliarItem(valor);
      assert.equal(res.sucesso, true);
      assert.equal(res.grau, "magico");
      assert.equal(res.identificaQualidade, true);
      assert.equal(res.identificaHistorico, true);
      assert.equal(res.identificaMagia, true, "Identifica que possui propriedades mágicas");
      assert.equal(res.detalhes.propriedadesMagicas, true);
      assert.equal(res.detalhes.tipoEncantamentoGeral, true, "Identifica tipo geral de encantamento");
      assert.equal(res.detalhes.efeitosExatosConhecidos, false, "Não revela fórmulas/efeitos exatos (apenas tipo geral)");
    }
  });
});

// ============================================================================
// CASO 6: PROSPECÇÃO MINERAL, GARIMPAGEM E MINERAÇÃO (GUIA DO HERÓI, PÁG. 48–49)
// ============================================================================
test("Subtítulo 26 - Caso 6: Prospecção Mineral, Garimpagem e Mineração (Guia do Herói, pág. 48–49)", async (t) => {
  await t.test("6.1 - Procura de Jazida Mineral: Inteligência Dif 16 (1 dia)", () => {
    const resSucesso = procurarJazidaMineral(16, { material: "ferro" });
    assert.equal(resSucesso.sucesso, true, "16 é sucesso na procura de jazida");
    assert.equal(resSucesso.encontrouJazida, true);
    assert.equal(resSucesso.tempoGastoDias, 1);

    const resFalha = procurarJazidaMineral(15, { material: "ferro" });
    assert.equal(resFalha.sucesso, false, "15 é falha na procura");
    assert.equal(resFalha.encontrouJazida, false);
  });

  await t.test("6.2 - Materiais Preciosos (ouro, prata, gemas) exigem sucesso decisivo na busca", () => {
    const resOuroNormal = procurarJazidaMineral(16, { material: "ouro", precioso: true, decisivo: false });
    assert.equal(resOuroNormal.sucesso, false, "Sucesso comum (16 sem decisivo) não encontra materiais preciosos");

    const resOuroDecisivo = procurarJazidaMineral(17, { material: "ouro", precioso: true, decisivo: true });
    assert.equal(resOuroDecisivo.sucesso, true, "Com sucesso decisivo encontra jazida preciosa");
    assert.equal(resOuroDecisivo.encontrouJazida, true);
  });

  await t.test("6.3 - Falha Crítica na Procura: Falso veio e perda de 1 dia explorando à toa", () => {
    const resCritico = procurarJazidaMineral(5, { falhaCritica: true });
    assert.equal(resCritico.sucesso, false);
    assert.equal(resCritico.encontrouJazida, false);
    assert.equal(resCritico.falhaCritica, true);
    assert.equal(resCritico.diasPerdidos, 1, "Perde pelo menos 1 dia explorando a falsa jazida");
  });

  await t.test("6.4 - Extração Mineral: Garimpagem diária por tipo de material", () => {
    // Materiais comuns (hulha, argila, sílica): resultado em kg
    const extComum = extrairMinerio("garimpagem", 14, "comum", { inteligencia: 3 });
    assert.equal(extComum.metodo, "garimpagem");
    assert.equal(extComum.quantidade, 14, "Materiais comuns rendem kg igual ao resultado do teste (14 kg)");
    assert.equal(extComum.unidade, "kg");
    assert.equal(extComum.periodo, "dia");
    assert.equal(extComum.diasDisponiveis, 3, "Jazida dura Int (3) dias de garimpagem");

    // Metais comuns (ferro, cobre): resultado / 10 em kg
    const extMetal = extrairMinerio("garimpagem", 15, "metal", { inteligencia: 4 });
    assert.equal(extMetal.quantidade, 1.5, "Metais normais rendem resultado / 10 em kg (15 / 10 = 1.5 kg)");
    assert.equal(extMetal.unidade, "kg");

    // Materiais preciosos (ouro, gemas): resultado em pepitas
    const extOuro = extrairMinerio("garimpagem", 12, "precioso", { inteligencia: 2 });
    assert.equal(extOuro.quantidade, 12, "Preciosos rendem pepitas igual ao teste (12 pepitas)");
    assert.equal(extOuro.unidade, "pepitas");
  });

  await t.test("6.5 - Extração Mineral: Mineração semanal e duração em anos", () => {
    const extMina = extrairMinerio("mineracao", 20, "metal", { inteligencia: 5 });
    assert.equal(extMina.metodo, "mineracao");
    assert.equal(extMina.quantidade, 2.0, "20 / 10 = 2 kg por semana");
    assert.equal(extMina.periodo, "semana", "Mineração calcula rendimento por semana");
    assert.equal(extMina.anosDisponiveis, 5, "Mineração esgota a jazida após Int (5) anos");
    assert.equal(extMina.extraiTodaJazida, true, "Mineração permite extrair toda a jazida mineral");
  });

  await t.test("6.6 - Garimpagem de Aluvião Élfica (peneira a céu aberto, teste único)", () => {
    const extAluviao = extrairMinerio("aluviao", 16, "precioso");
    assert.equal(extAluviao.metodo, "aluviao");
    assert.equal(extAluviao.quantidade, 16);
    assert.equal(extAluviao.unidade, "pepitas");
    assert.equal(extAluviao.periodo, "unico", "Apenas um teste pode ser feito por jazida");
    assert.equal(extAluviao.exigeCeuAberto, true);
    assert.equal(extAluviao.exigePeneira, true);
    assert.equal(extAluviao.atributoUtilizado, "inteligencia");
  });
});

// ============================================================================
// CASO 7: CONSERTO, MATÉRIA-PRIMA, RISCO DE QUEBRA E ACTOR MOCK
// ============================================================================
test("Subtítulo 26 - Caso 7: Conserto, Custo de Matéria-Prima, Risco de Quebra e Actor Mock", async (t) => {
  await t.test("7.1 - Custo de Matéria-Prima é exatamente metade (50%) do preço de venda", () => {
    assert.equal(calcularCustoMateriaPrima(100), 50);
    assert.equal(calcularCustoMateriaPrima(350), 175);
    assert.equal(calcularCustoMateriaPrima(0), 0);
  });

  await t.test("7.2 - Conserto não requer teste e consome 50% de tempo e material original", () => {
    const reparo = calcularConsertoItem(6, 80);
    assert.equal(reparo.tempoConsertoDias, 3, "6 dias viram 3 dias de conserto");
    assert.equal(reparo.materialConserto, 40, "80 de material viram 40 de material de reparo");
    assert.equal(reparo.requerTeste, false, "Não é necessário nenhum teste para consertar");
  });

  await t.test("7.3 - Risco de Quebra de Item de Qualidade Baixa (Dificuldade 12)", () => {
    const testeResiste = verificarRiscoQuebraQualidadeBaixa(11);
    assert.equal(testeResiste.quebrou, false, "Rolagem 11 não quebra o item");
    assert.equal(testeResiste.requerConserto, false);

    const testeQuebra = verificarRiscoQuebraQualidadeBaixa(12);
    assert.equal(testeQuebra.quebrou, true, "Rolagem 12 atinge a CD e o item quebra");
    assert.equal(testeQuebra.requerConserto, true, "O item precisa ser consertado");

    const testeQuebraCritica = verificarRiscoQuebraQualidadeBaixa(15);
    assert.equal(testeQuebraCritica.quebrou, true);
  });

  await t.test("7.4 - Métodos integrados no Actor Mock", () => {
    const actorArtesao = createMockActor({
      name: "Thorin Ferreiro",
      attributes: { forca: 4, agilidade: 2, inteligencia: 3, vontade: 2 },
    });

    // Teste de produção através do ator
    const resProducao = actorArtesao.avaliarResultadoProducao(22);
    assert.equal(resProducao.qualidade, "obra-prima");
    assert.equal(resProducao.sucesso, true);

    // Dedicação de tempo através do ator
    const bonusDedicacao = actorArtesao.calcularBonusDedicacaoTempo("dobro");
    assert.equal(bonusDedicacao, 2);

    // Desmontagem através do ator
    const materialRecuperado = actorArtesao.calcularMaterialDesmontagem(400);
    assert.equal(materialRecuperado, 200);

    // Avaliação de item através do ator
    const avaliacao = actorArtesao.avaliarItem(18);
    assert.equal(avaliacao.grau, "magico");
    assert.equal(avaliacao.identificaMagia, true);

    // Prospecção e extração através do ator
    const jazida = actorArtesao.procurarJazidaMineral(16, { material: "ferro" });
    assert.equal(jazida.encontrouJazida, true);

    const extracao = actorArtesao.extrairMinerio("garimpagem", 15, "metal");
    assert.equal(extracao.quantidade, 1.5);
    assert.equal(extracao.diasDisponiveis, 3, "Usa Inteligência 3 do ator");
  });

  await t.test("7.5 - Verificação das Áreas de Produção Canônicas de Drakon", () => {
    const areasEsperadas = [
      "alvenaria", "arte", "ceramica", "correaria", "engenharia",
      "entalhe", "ferraria", "marcenaria", "mecanica", "ourivesaria"
    ];

    for (const area of areasEsperadas) {
      assert.ok(AREAS_PRODUCAO_CANONICAS[area], `Área de produção '${area}' deve existir`);
      assert.ok(AREAS_PRODUCAO_CANONICAS[area].atributos.length > 0, `Área '${area}' deve possuir atributos definidos`);
      assert.ok(AREAS_PRODUCAO_CANONICAS[area].ferramentas, `Área '${area}' deve exigir ferramentas`);
    }
  });
});
