/**
 * Suíte de Testes Automatizados - Subtítulo 16: Sistema de Alquimia, Preparo de Poções e Extratos
 * Mighty Blade 3ª Edição (Guia do Herói, Cap. IV, pág. 74–82; Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 * - Caso 16.1: Conhecimento de Receitas e Habilidades Alquímicas (conheceReceita)
 *   * Herbalismo: Poções básicas comuns e incomuns (exceto raras/muito raras/ilegais).
 *   * Herbalismo: Proibição estrita de receitas que exijam o processo de Destilação.
 *   * Alquimia Básica: Conhece todas as poções básicas e libera o processo de Destilação.
 *   * Alquimia Avançada: Conhece todas as receitas (básicas e avançadas, qualquer raridade).
 *   * Personagens sem treinamento alquímico não conhecem receitas.
 *   * Suporte a múltiplos formatos (strings, slugs, Sets, Items Foundry e Mock Actor).
 *
 * - Caso 16.2: Processamento Sequencial de Etapas Alquímicas (processarEtapaAlquimia)
 *   * Os 6 processos canônicos: Infusão, Maceração, Tintura, Tisana, Fermentação, Destilação.
 *   * Sucesso em etapa intermediária consome ingredientes da etapa e avança na cadeia.
 *   * Falha intermediária: descarta apenas ingredientes usados até aquela etapa;
 *     ingredientes de etapas posteriores permanecem no inventário.
 *   * Sucesso na etapa final produz a dose canônica da poção.
 *
 * - Caso 16.3: Sucesso Crítico e Falha Crítica Alquímica
 *   * Sucesso Crítico (dois dados 6 ou sucesso decisivo): gera +1 dose adicional cumulativa.
 *   * Sucessos críticos múltiplos em poções complexas geram doses adicionais cumulativas (2, 3+ doses).
 *   * Falha Crítica (dois dados 1 ou falha desastrosa): gera obrigatoriamente uma Poção do Caos.
 *
 * - Caso 16.4: Tabela Oficial 2d6 de Poção do Caos (sortearPocaoDoCaos)
 *   * Cobertura de todos os 11 resultados canônicos (2 a 12) da pág. 76 do Guia do Herói.
 *   * Validação de propriedades dos efeitos caóticos (permanente, reversão por Antídoto Universal).
 *   * Clamping de limites e geração aleatória robusta quando o dado não é fornecido.
 *
 * - Caso 16.5: Ciclo Completo de Fabricação e Crafting Integrado no Inventário
 *   * Fabricação de poção de etapa única (Elixir de Cura).
 *   * Fabricação de poção complexa multi-etapas (Extrato Regenerativo: Infusão -> Fermentação -> Tintura).
 *   * Descarte parcial de inventário em falha intermediária com preservação de ingredientes caros.
 *   * Criação de Poção do Caos no inventário do ator em caso de desastre alquímico.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
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
} from "./test-helper.mjs";

/* ------------------------------------------------------------------------- */
/* CASO 16.1: CONHECIMENTO DE RECEITAS (conheceReceita)                      */
/* ------------------------------------------------------------------------- */

test("Caso 16.1: Conhecimento de Receitas e Habilidades Alquímicas", async (t) => {
  // Receitas Canônicas de Teste
  const antidotoBasico = {
    nome: "Antídoto Básico",
    tipo: "basica",
    raridade: "Comum",
    processos: ["Infusao"],
  };

  const elixirRestauracao = {
    nome: "Elixir da Restauração",
    tipo: "basica",
    raridade: "Incomum",
    processos: ["Tisana"],
  };

  const pocaoBasicaRara = {
    nome: "Poção Básica Rara",
    tipo: "basica",
    raridade: "Raro",
    processos: ["Maceracao"],
  };

  const pocaoBasicaMuitoRara = {
    nome: "Poção Básica Muito Rara",
    tipo: "basica",
    raridade: "Muito Raro",
    processos: ["Infusao"],
  };

  const pocaoBasicaIlegal = {
    nome: "Extrato Tóxico Básico",
    tipo: "basica",
    raridade: "Ilegal",
    processos: ["Maceracao"],
  };

  const pocaoBasicaComDestilacao = {
    nome: "Álcool Alquímico Puro",
    tipo: "basica",
    raridade: "Comum",
    processos: ["Destilacao"],
  };

  const antidotoAvancado = {
    nome: "Antídoto Avançado",
    tipo: "avancada",
    raridade: "Incomum",
    processos: ["Infusao"],
  };

  const elixirAgilidade = {
    nome: "Elixir da Agilidade",
    tipo: "avancada",
    raridade: "Raro",
    processos: ["Maceracao", "Tisana"],
  };

  const elixirDosDeuses = {
    nome: "Elixir dos Deuses",
    tipo: "avancada",
    raridade: "Muito Raro",
    processos: ["Maceracao", "Tisana", "Tintura"],
  };

  const venenoReal = {
    nome: "Veneno Real",
    tipo: "avancada",
    raridade: "Ilegal",
    processos: ["Maceracao", "Tisana"],
  };

  await t.test(
    "16.1.1 - Personagem sem habilidades de alquimia não conhece nenhuma receita",
    () => {
      assert.equal(conheceReceita([], antidotoBasico), false);
      assert.equal(conheceReceita(null, elixirRestauracao), false);
      assert.equal(conheceReceita(["Luta", "Esquiva"], antidotoBasico), false);
    }
  );

  await t.test(
    "16.1.2 - Herbalismo: Conhece poções básicas Comuns e Incomuns",
    () => {
      const habilidades = ["Herbalismo"];
      assert.equal(
        conheceReceita(habilidades, antidotoBasico),
        true,
        "Deve conhecer Antídoto Básico (Comum)"
      );
      assert.equal(
        conheceReceita(habilidades, elixirRestauracao),
        true,
        "Deve conhecer Elixir da Restauração (Incomum)"
      );
    }
  );

  await t.test(
    "16.1.3 - Herbalismo: NÃO conhece poções básicas Raras, Muito Raras ou Ilegais",
    () => {
      const habilidades = ["Herbalismo"];
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaRara),
        false,
        "Não pode conhecer básica Rara"
      );
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaMuitoRara),
        false,
        "Não pode conhecer básica Muito Rara"
      );
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaIlegal),
        false,
        "Não pode conhecer básica Ilegal"
      );
    }
  );

  await t.test(
    "16.1.4 - Herbalismo: NÃO conhece nem pode realizar poções que exigem Destilação",
    () => {
      const habilidades = ["Herbalismo"];
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaComDestilacao),
        false,
        "Herbalismo não domina o processo de Destilação"
      );
    }
  );

  await t.test(
    "16.1.5 - Herbalismo: NÃO conhece nenhuma poção avançada",
    () => {
      const habilidades = ["Herbalismo"];
      assert.equal(conheceReceita(habilidades, antidotoAvancado), false);
      assert.equal(conheceReceita(habilidades, elixirAgilidade), false);
      assert.equal(conheceReceita(habilidades, elixirDosDeuses), false);
      assert.equal(conheceReceita(habilidades, venenoReal), false);
    }
  );

  await t.test(
    "16.1.6 - Alquimia Básica: Conhece todas as poções básicas e libera Destilação",
    () => {
      const habilidades = ["Alquimia Básica"];
      assert.equal(
        conheceReceita(habilidades, antidotoBasico),
        true,
        "Conhece básica comum"
      );
      assert.equal(
        conheceReceita(habilidades, elixirRestauracao),
        true,
        "Conhece básica incomum"
      );
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaRara),
        true,
        "Alquimia Básica conhece básica Rara"
      );
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaMuitoRara),
        true,
        "Alquimia Básica conhece básica Muito Rara"
      );
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaIlegal),
        true,
        "Alquimia Básica conhece básica Ilegal"
      );
      assert.equal(
        conheceReceita(habilidades, pocaoBasicaComDestilacao),
        true,
        "Alquimia Básica libera processo de Destilação"
      );
    }
  );

  await t.test(
    "16.1.7 - Alquimia Básica: NÃO conhece poções avançadas",
    () => {
      const habilidades = ["Alquimia Básica"];
      assert.equal(conheceReceita(habilidades, antidotoAvancado), false);
      assert.equal(conheceReceita(habilidades, elixirAgilidade), false);
      assert.equal(conheceReceita(habilidades, elixirDosDeuses), false);
      assert.equal(conheceReceita(habilidades, venenoReal), false);
    }
  );

  await t.test(
    "16.1.8 - Alquimia Avançada: Conhece todas as receitas (básicas e avançadas, qualquer raridade)",
    () => {
      const habilidades = ["Alquimia Avançada"];
      // Básicas
      assert.equal(conheceReceita(habilidades, antidotoBasico), true);
      assert.equal(conheceReceita(habilidades, elixirRestauracao), true);
      assert.equal(conheceReceita(habilidades, pocaoBasicaRara), true);
      assert.equal(conheceReceita(habilidades, pocaoBasicaComDestilacao), true);
      // Avançadas
      assert.equal(conheceReceita(habilidades, antidotoAvancado), true);
      assert.equal(conheceReceita(habilidades, elixirAgilidade), true);
      assert.equal(conheceReceita(habilidades, elixirDosDeuses), true);
      assert.equal(conheceReceita(habilidades, venenoReal), true);
    }
  );

  await t.test(
    "16.1.9 - Suporte a Mock Actor do Foundry e itens embutidos",
    () => {
      const actorHerbalista = createMockActor({
        name: "Druida Elfo",
        items: [{ name: "Herbalismo", type: "habilidade" }],
      });

      const actorAlquimistaMestre = createMockActor({
        name: "Alquimista Argênteo",
        items: [
          { name: "Alquimia Básica", type: "habilidade" },
          { name: "Alquimia Avançada", type: "habilidade" },
        ],
      });

      assert.equal(conheceReceita(actorHerbalista, antidotoBasico), true);
      assert.equal(conheceReceita(actorHerbalista, antidotoAvancado), false);

      assert.equal(conheceReceita(actorAlquimistaMestre, antidotoAvancado), true);
      assert.equal(conheceReceita(actorAlquimistaMestre, venenoReal), true);
    }
  );

  await t.test(
    "16.1.10 - Normalização robusta de receitas aninhadas (system.receita e flags)",
    () => {
      const itemFoundryPocao = {
        name: "Elixir Especial",
        system: {
          raridade: "Incomum",
          receita: {
            tipo: "basica",
            processoPrincipal: "Tisana",
          },
        },
      };

      assert.equal(conheceReceita(["Herbalismo"], itemFoundryPocao), true);
    }
  );
});

/* ------------------------------------------------------------------------- */
/* CASO 16.2: PROCESSAMENTO DE ETAPAS ALQUÍMICAS SEQUENCIAIS                 */
/* ------------------------------------------------------------------------- */

test("Caso 16.2: Processamento Sequencial de Etapas Alquímicas", async (t) => {
  await t.test("16.2.1 - Constantes canônicas dos 6 processos de refino", () => {
    assert.deepEqual(ETAPAS_ALQUIMIA, [
      "Infusão",
      "Maceração",
      "Tintura",
      "Tisana",
      "Fermentação",
      "Destilação",
    ]);

    assert.equal(PROCESSOS_ALQUIMICOS_INFO.Infusao.nome, "Infusão");
    assert.equal(PROCESSOS_ALQUIMICOS_INFO.Destilacao.nome, "Destilação");
    assert.equal(PROCESSOS_ALQUIMICOS_INFO.Maceracao.nome, "Maceração");
    assert.equal(PROCESSOS_ALQUIMICOS_INFO.Tintura.nome, "Tintura");
    assert.equal(PROCESSOS_ALQUIMICOS_INFO.Tisana.nome, "Tisana");
    assert.equal(PROCESSOS_ALQUIMICOS_INFO.Fermentacao.nome, "Fermentação");
  });

  await t.test(
    "16.2.2 - Sucesso em etapa intermediária consome ingredientes da etapa e avança na cadeia",
    () => {
      const etapa1 = {
        nome: "Infusão",
        processo: "Infusao",
        dificuldade: 10,
        etapaFinal: false,
        proximaEtapa: "Fermentação",
      };

      const ingredientesUsados = ["erva-dos-passos", "flor-de-isura"];
      const ingredientesRestantes = ["folha-de-oliveira", "tarantula", "coracao-de-grifo"];

      const resultado = processarEtapaAlquimia(
        etapa1,
        { total: 11, dados: [5, 6] },
        ingredientesUsados,
        ingredientesRestantes
      );

      assert.equal(resultado.sucesso, true);
      assert.equal(resultado.etapaConcluida, true);
      assert.equal(resultado.etapaFinal, false);
      assert.equal(resultado.dosesProduzidas, 0);
      assert.equal(resultado.pocaoFinalizada, null);
      assert.equal(resultado.proximaEtapa, "Fermentação");
      assert.deepEqual(resultado.ingredientesDescartados, ingredientesUsados);
      assert.deepEqual(resultado.ingredientesPreservados, ingredientesRestantes);
    }
  );

  await t.test(
    "16.2.3 - Falha em etapa intermediária descarta apenas ingredientes da etapa e preserva posteriores",
    () => {
      // Exemplo canônico do Guia do Herói pág. 75: Extrato Regenerativo falha na etapa 2 (Fermentação)
      const etapa2 = {
        nome: "Fermentação",
        processo: "Fermentacao",
        dificuldade: 14,
        etapaFinal: false,
      };

      // Ingredientes consumidos na etapa 1 e etapa 2:
      const ingredientesUsados = [
        "erva-dos-passos",
        "flor-de-isura",
        "folha-de-oliveira",
        "tarantula",
      ];
      // Ingrediente valioso reservado para a etapa 3 (Tintura):
      const ingredientesRestantes = ["coracao-de-grifo"];

      const resultado = processarEtapaAlquimia(
        etapa2,
        { total: 11, dados: [5, 6] }, // Falha (11 < 14)
        ingredientesUsados,
        ingredientesRestantes
      );

      assert.equal(resultado.sucesso, false);
      assert.equal(resultado.falhaCritica, false);
      assert.equal(resultado.etapaConcluida, false);
      assert.equal(resultado.dosesProduzidas, 0);
      assert.equal(resultado.pocaoFinalizada, null);

      // Regra canônica: usados são descartados, posteriores são preservados!
      assert.deepEqual(resultado.ingredientesDescartados, ingredientesUsados);
      assert.deepEqual(resultado.ingredientesPreservados, ["coracao-de-grifo"]);
      assert.ok(
        resultado.ingredientesPreservados.includes("coracao-de-grifo"),
        "Coração de Grifo deve ser preservado no inventário"
      );
    }
  );

  await t.test(
    "16.2.4 - Sucesso na etapa final produz a poção acabada (1 dose padrão)",
    () => {
      const etapaFinal = {
        nome: "Tintura",
        processo: "Tintura",
        dificuldade: 16,
        nomePocao: "Extrato Regenerativo",
        etapaFinal: true,
      };

      const ingredientesUsados = [
        "erva-dos-passos",
        "flor-de-isura",
        "folha-de-oliveira",
        "tarantula",
        "coracao-de-grifo",
      ];
      const ingredientesRestantes = [];

      const resultado = processarEtapaAlquimia(
        etapaFinal,
        { total: 17, dados: [5, 6, 6].slice(0, 2) }, // Total 17 sem ser par de 6
        ingredientesUsados,
        ingredientesRestantes
      );

      assert.equal(resultado.sucesso, true);
      assert.equal(resultado.etapaFinal, true);
      assert.equal(resultado.dosesProduzidas, 1);
      assert.notEqual(resultado.pocaoFinalizada, null);
      assert.equal(resultado.pocaoFinalizada?.nome, "Extrato Regenerativo");
      assert.equal(resultado.pocaoFinalizada?.doses, 1);
    }
  );
});

/* ------------------------------------------------------------------------- */
/* CASO 16.3: SUCESSO CRÍTICO E FALHA CRÍTICA ALQUÍMICA                      */
/* ------------------------------------------------------------------------- */

test("Caso 16.3: Sucesso Crítico e Falha Crítica Alquímica", async (t) => {
  await t.test(
    "16.3.1 - Sucesso Crítico (dois dados 6) gera +1 dose adicional da poção (total 2 doses)",
    () => {
      const etapaUnica = {
        nome: "Infusão",
        processo: "Infusao",
        dificuldade: 10,
        nomePocao: "Elixir de Cura",
        etapaFinal: true,
      };

      const resultado = processarEtapaAlquimia(
        etapaUnica,
        { total: 14, dados: [6, 6] }, // Dois dados 6 = Sucesso Decisivo / Crítico
        ["flor-de-isura", "erva-dos-passos"],
        []
      );

      assert.equal(resultado.sucesso, true);
      assert.equal(resultado.sucessoCritico, true);
      assert.equal(resultado.falhaCritica, false);
      assert.equal(
        resultado.dosesProduzidas,
        2,
        "Deve gerar 2 doses (1 base + 1 adicional por crítico)"
      );
      assert.equal(resultado.pocaoFinalizada?.doses, 2);
    }
  );

  await t.test(
    "16.3.2 - Sucessos Críticos cumulativos em múltiplas etapas acumulam doses adicionais (3 doses)",
    () => {
      // Etapa 1 com Sucesso Crítico
      const etapa1 = {
        nome: "Infusão",
        processo: "Infusao",
        dificuldade: 12,
        etapaFinal: false,
      };

      const resEtapa1 = processarEtapaAlquimia(
        etapa1,
        { total: 15, dados: [6, 6] }, // Crítico na etapa 1 (+1 dose acumulada)
        ["erva-dos-passos", "flor-de-isura"],
        ["coracao-de-grifo"]
      );

      assert.equal(resEtapa1.sucessoCritico, true);
      assert.equal(resEtapa1.dosesAcumuladas, 1);

      // Etapa 2 (Final) também obtém Sucesso Crítico
      const etapa2 = {
        nome: "Tintura",
        processo: "Tintura",
        dificuldade: 16,
        nomePocao: "Elixir da Força",
        etapaFinal: true,
        dosesAcumuladas: resEtapa1.dosesAcumuladas, // Passa doses acumuladas da etapa anterior
      };

      const resEtapa2 = processarEtapaAlquimia(
        etapa2,
        { total: 17, dados: [6, 6] }, // Crítico na etapa 2 (+1 dose acumulada adicional)
        ["erva-dos-passos", "flor-de-isura", "coracao-de-grifo"],
        []
      );

      assert.equal(resEtapa2.sucessoCritico, true);
      // Regra canônica: 1 base + 1 do 1º crítico + 1 do 2º crítico = 3 doses!
      assert.equal(
        resEtapa2.dosesProduzidas,
        3,
        "Deve gerar 3 doses por conta de 2 sucessos críticos cumulativos"
      );
      assert.equal(resEtapa2.pocaoFinalizada?.doses, 3);
    }
  );

  await t.test(
    "16.3.3 - Falha Crítica (dois dados 1) gera obrigatoriamente uma Poção do Caos",
    () => {
      const etapa = {
        nome: "Destilação",
        processo: "Destilacao",
        dificuldade: 15,
        nomePocao: "Elixir da Inteligência",
        etapaFinal: true,
      };

      const resultado = processarEtapaAlquimia(
        etapa,
        { total: 5, dados: [1, 1], rolagemCaos: 2 }, // Dois dados 1 = Falha Crítica
        ["cogumelo-vermelho", "folha-de-oliveira", "ossos-de-hidra"],
        []
      );

      assert.equal(resultado.sucesso, false);
      assert.equal(resultado.falhaCritica, true);
      assert.equal(resultado.sucessoCritico, false);
      assert.equal(resultado.dosesProduzidas, 1, "Gera 1 Poção do Caos");
      assert.notEqual(resultado.pocaoDoCaos, null);
      assert.equal(resultado.pocaoDoCaos?.nome, "Poção do Caos");
      assert.equal(resultado.pocaoDoCaos?.rolagem, 2);
      assert.equal(resultado.pocaoDoCaos?.efeito, "Dedos de Tentáculos");
      assert.equal(resultado.pocaoFinalizada, null, "A poção original foi arruinada");
    }
  );

  await t.test(
    "16.3.4 - Falha Crítica intermediária gera Poção do Caos e preserva ingredientes posteriores",
    () => {
      const etapa1 = {
        nome: "Infusão",
        processo: "Infusao",
        dificuldade: 10,
        etapaFinal: false,
      };

      const resultado = processarEtapaAlquimia(
        etapa1,
        { total: 4, dados: [1, 1], rolagemCaos: 12 },
        ["erva-dos-passos"],
        ["dente-de-dragao"]
      );

      assert.equal(resultado.falhaCritica, true);
      assert.notEqual(resultado.pocaoDoCaos, null);
      assert.equal(resultado.pocaoDoCaos?.rolagem, 12);
      assert.equal(resultado.pocaoDoCaos?.efeito, "Metamorfose em Pequeno Animal");
      assert.deepEqual(resultado.ingredientesDescartados, ["erva-dos-passos"]);
      assert.deepEqual(resultado.ingredientesPreservados, ["dente-de-dragao"]);
    }
  );
});

/* ------------------------------------------------------------------------- */
/* CASO 16.4: TABELA OFICIAL 2d6 DE POÇÃO DO CAOS (sortearPocaoDoCaos)       */
/* ------------------------------------------------------------------------- */

test("Caso 16.4: Tabela Oficial 2d6 de Poção do Caos", async (t) => {
  const casosOficiais = [
    {
      rolagem: 2,
      efeito: "Dedos de Tentáculos",
      trecho: "Seus dedos se tornam tentáculos",
    },
    {
      rolagem: 3,
      efeito: "Atributo Reduzido",
      trecho: "Um de seus Atributos é reduzido em -2",
    },
    {
      rolagem: 4,
      efeito: "Fala Animal",
      trecho: "Você não consegue mais falar",
    },
    {
      rolagem: 5,
      efeito: "Alopecia Total",
      trecho: "Você perde todos os pelos do corpo",
    },
    {
      rolagem: 6,
      efeito: "Corpo Peludo Colorido",
      trecho: "Seu corpo inteiro fica coberto de pelos",
    },
    {
      rolagem: 7,
      efeito: "Olhos de Animal",
      trecho: "Seus olhos adquirem a aparência dos olhos de um animal",
    },
    {
      rolagem: 8,
      efeito: "Pelos Coloridos",
      trecho: "Todos os seus pelos mudam para uma cor aleatória",
    },
    {
      rolagem: 9,
      efeito: "Surdez Vegetal",
      trecho: "Você fica surdo por conta de plantas",
    },
    {
      rolagem: 10,
      efeito: "Cauda Animal",
      trecho: "Você desenvolve uma cauda de um animal",
    },
    {
      rolagem: 11,
      efeito: "Pele Colorida",
      trecho: "A cor da sua pele muda para uma cor aleatória",
    },
    {
      rolagem: 12,
      efeito: "Metamorfose em Pequeno Animal",
      trecho: "Você se transforma em um pequeno animal aleatório",
    },
  ];

  for (const c of casosOficiais) {
    await t.test(
      `16.4.${c.rolagem} - Rolagem ${c.rolagem}: ${c.efeito}`,
      () => {
        const pocao = sortearPocaoDoCaos(c.rolagem);
        assert.equal(pocao.nome, "Poção do Caos");
        assert.equal(pocao.rolagem, c.rolagem);
        assert.equal(pocao.efeito, c.efeito);
        assert.ok(
          pocao.descricao.includes(c.trecho),
          `Descrição deve conter trecho canônico: ${c.trecho}`
        );
        assert.equal(pocao.permanente, true);
        assert.equal(pocao.reversao, "Antídoto Universal");
      }
    );
  }

  await t.test(
    "16.4.13 - Clamping de valores fora dos limites de 2d6 (abaixo de 2 ou acima de 12)",
    () => {
      const pocaoMin = sortearPocaoDoCaos(1);
      assert.equal(pocaoMin.rolagem, 2, "Clampa valor 1 no mínimo 2");

      const pocaoMax = sortearPocaoDoCaos(15);
      assert.equal(pocaoMax.rolagem, 12, "Clampa valor 15 no máximo 12");
    }
  );

  await t.test(
    "16.4.14 - Rolagem automática 2d6 aleatória quando argumento for omitido",
    () => {
      for (let i = 0; i < 20; i++) {
        const pocao = sortearPocaoDoCaos();
        assert.ok(
          pocao.rolagem >= 2 && pocao.rolagem <= 12,
          `Rolagem aleatória ${pocao.rolagem} deve estar entre 2 e 12`
        );
        assert.ok(TABELA_POCAO_DO_CAOS[pocao.rolagem]);
      }
    }
  );
});

/* ------------------------------------------------------------------------- */
/* CASO 16.5: INTEGRAÇÃO COM ATOR E INVENTÁRIO (CRAFTING COMPLETO)          */
/* ------------------------------------------------------------------------- */

test("Caso 16.5: Ciclo Completo de Fabricação e Crafting Integrado", async (t) => {
  await t.test(
    "16.5.1 - Fabricação completa de Elixir de Cura com consumo de ingredientes no inventário",
    async () => {
      const ator = createMockActor({
        name: "Alquimista Valen",
        items: [
          { name: "Alquimia Básica", type: "habilidade" },
          { id: "ing1", name: "Flor de Isura", type: "equipamento", system: { quantidade: 2 } },
          { id: "ing2", name: "Erva dos Passos", type: "equipamento", system: { quantidade: 3 } },
        ],
      });

      const receitaElixirCura = {
        nome: "Elixir de Cura",
        tipo: "basica",
        raridade: "Comum",
        etapas: [{ processo: "Infusao", dificuldade: 10, etapaFinal: true }],
      };

      // 1. Valida conhecimento
      assert.equal(conheceReceita(ator, receitaElixirCura), true);

      // 2. Executa a etapa com sucesso
      const res = processarEtapaAlquimia(
        receitaElixirCura.etapas[0],
        { total: 12, dados: [5, 4] },
        ["Flor de Isura", "Erva dos Passos"],
        [],
        { nomePocao: "Elixir de Cura" }
      );

      assert.equal(res.sucesso, true);
      assert.equal(res.dosesProduzidas, 1);

      // 3. Simula atualização do inventário do ator
      ator.items.find((i) => i.name === "Flor de Isura").system.quantidade -= 1;
      ator.items.find((i) => i.name === "Erva dos Passos").system.quantidade -= 1;
      await ator.createEmbeddedDocuments("Item", [
        {
          name: res.pocaoFinalizada.nome,
          type: "equipamento",
          system: { quantidade: res.dosesProduzidas },
        },
      ]);

      assert.equal(ator.items.find((i) => i.name === "Flor de Isura").system.quantidade, 1);
      assert.equal(ator.items.find((i) => i.name === "Erva dos Passos").system.quantidade, 2);
      assert.ok(ator.items.some((i) => i.name === "Elixir de Cura"));
    }
  );

  await t.test(
    "16.5.2 - Ciclo de 3 etapas com falha intermediária preserva o ingrediente raro no ator",
    async () => {
      const ator = createMockActor({
        name: "Mestre Iátrico",
        items: [
          { name: "Alquimia Avançada", type: "habilidade" },
          { id: "ing1", name: "Erva dos Passos", system: { quantidade: 1 } },
          { id: "ing2", name: "Flor de Isura", system: { quantidade: 1 } },
          { id: "ing3", name: "Folha de Oliveira", system: { quantidade: 1 } },
          { id: "ing4", name: "Tarântula", system: { quantidade: 1 } },
          { id: "ing5", name: "Coração de Grifo", system: { quantidade: 1 } },
        ],
      });

      // Etapa 1: Infusão (Sucesso)
      const res1 = processarEtapaAlquimia(
        { processo: "Infusao", dificuldade: 12, etapaFinal: false },
        { total: 13, dados: [4, 5] },
        ["Erva dos Passos", "Flor de Isura"],
        ["Folha de Oliveira", "Tarântula", "Coração de Grifo"]
      );
      assert.equal(res1.sucesso, true);

      // Etapa 2: Fermentação (Falha comum)
      const res2 = processarEtapaAlquimia(
        { processo: "Fermentacao", dificuldade: 14, etapaFinal: false },
        { total: 9, dados: [2, 3] }, // Falhou
        ["Erva dos Passos", "Flor de Isura", "Folha de Oliveira", "Tarântula"],
        ["Coração de Grifo"]
      );
      assert.equal(res2.sucesso, false);

      // Aplica perdas no inventário: remove os 4 primeiros, preserva Coração de Grifo
      for (const desc of res2.ingredientesDescartados) {
        ator.removeItem(desc);
      }

      assert.equal(ator.items.some((i) => i.name === "Coração de Grifo"), true);
      assert.equal(ator.items.some((i) => i.name === "Erva dos Passos"), false);
      assert.equal(ator.items.some((i) => i.name === "Folha de Oliveira"), false);
    }
  );

  await t.test(
    "16.5.3 - Desastre em laboratório gera Poção do Caos no inventário do ator",
    async () => {
      const ator = createMockActor({
        name: "Aprendiz Imprudente",
        items: [{ name: "Alquimia Básica", type: "habilidade" }],
      });

      const resDesastre = processarEtapaAlquimia(
        { processo: "Tisana", dificuldade: 10, etapaFinal: true },
        { total: 4, dados: [1, 1], rolagemCaos: 9 }, // Falha crítica!
        ["Folha de Eucalipto"],
        []
      );

      assert.equal(resDesastre.falhaCritica, true);
      assert.equal(resDesastre.pocaoDoCaos?.efeito, "Surdez Vegetal");

      // Adiciona a Poção do Caos no ator
      await ator.createEmbeddedDocuments("Item", [
        {
          name: resDesastre.pocaoDoCaos.nome,
          type: "equipamento",
          system: {
            quantidade: resDesastre.dosesProduzidas,
            description: `<p><strong>${resDesastre.pocaoDoCaos.efeito}:</strong> ${resDesastre.pocaoDoCaos.descricao}</p>`,
          },
        },
      ]);

      const itemPocao = ator.items.find((i) => i.name === "Poção do Caos");
      assert.ok(itemPocao);
      assert.ok(itemPocao.system.description.includes("Surdez Vegetal"));
      assert.equal(itemPocao.system.quantidade, 1);
    }
  );
});
