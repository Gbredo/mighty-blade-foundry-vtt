import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
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
} from "./test-helper.mjs";

import {
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  CANONICAL_HABILIDADES,
} from "../module/data/canonical-packs-data.mjs";

test("Subtítulo 17: Personagens de Nível Zero (Aspirantes e Desclassificados)", async (t) => {
  // ===========================================================================
  // SUÍTE 1: CRIAR ASPIRANTE (NÍVEL ZERO)
  // ===========================================================================
  await t.test("1. Criação de Aspirante — Recursos e Atributos Iniciais", async (st) => {
    await st.test("1.1 Inicia com 40 PV e 40 PM (em vez de 60/60) e Nível 0", async () => {
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");

      assert.equal(aspirante.system.details.nivel, 0, "Aspirante deve iniciar no Nível 0");
      assert.equal(aspirante.system.details.tipoNivelZero, "aspirante", "Tipo deve ser 'aspirante'");
      assert.equal(aspirante.system.resources.vida.value, PV_INICIAL_ASPIRANTE, "PV atual deve ser 40");
      assert.equal(aspirante.system.resources.vida.max, PV_INICIAL_ASPIRANTE, "PV máximo deve ser 40");
      assert.equal(aspirante.system.resources.vida.baseMax, PV_INICIAL_ASPIRANTE, "PV baseMax deve ser 40");
      assert.equal(aspirante.system.resources.mana.value, PM_INICIAL_ASPIRANTE, "PM atual deve ser 40");
      assert.equal(aspirante.system.resources.mana.max, PM_INICIAL_ASPIRANTE, "PM máximo deve ser 40");
      assert.equal(aspirante.system.resources.mana.baseMax, PM_INICIAL_ASPIRANTE, "PM baseMax deve ser 40");
    });

    await st.test("1.2 Atributos Iniciais da Raça + Habilidade Automática da Raça", async () => {
      // Anão: Força 4, Agilidade 2, Inteligência 3, Vontade 3 | Hab: Coração da Montanha
      const aspiranteAnao = await criarAspirante("Anão", "Guerreiro", "forca");

      // Anão tem Coração da Montanha
      const temHabRacial = aspiranteAnao.items.some(
        (i) => i.name.toLowerCase().includes("coração da montanha") || i.name.toLowerCase().includes("coracao da montanha")
      );
      assert.ok(temHabRacial, "Aspirante deve possuir a habilidade automática racial (Coração da Montanha)");

      // Item de raça registrado
      const racaItem = aspiranteAnao.items.find((i) => i.type === "raca");
      assert.ok(racaItem, "Item de raça deve estar nos itens do ator");
      assert.equal(racaItem.name, "Anão");
    });

    await st.test("1.3 Habilidade Automática da Classe + Apenas 1 modificador de Atributo da Classe", async () => {
      // Guerreiro concede +1 Força e +1 Agilidade. Aspirante escolhe 'forca'.
      // Anão base: Força 4, Agilidade 2, Int 3, Von 3
      // Com apenas Força escolhida: Força 5, Agilidade 2 (permanece o da raça), Int 3, Von 3
      const aspirante = await criarAspirante("Anão", "Guerreiro", "forca");

      assert.equal(aspirante.system.attributes.forca.value, 5, "Força deve receber +1 da classe (4 + 1 = 5)");
      assert.equal(aspirante.system.attributes.agilidade.value, 2, "Agilidade NÃO deve receber bônus ainda (permanece 2)");
      assert.equal(aspirante.system.attributes.inteligencia.value, 3, "Inteligência permanece 3");
      assert.equal(aspirante.system.attributes.vontade.value, 3, "Vontade permanece 3");

      // Habilidade Automática da Classe: Mestre de Armas 1
      const temHabClasse = aspirante.items.some(
        (i) => i.name.toLowerCase().includes("mestre de armas")
      );
      assert.ok(temHabClasse, "Aspirante deve possuir a habilidade automática da classe (Mestre de Armas)");

      // Item de classe deve ter apenas 1 ponto de atributo ativo
      const classeItem = aspirante.items.find((i) => i.type === "classe");
      assert.ok(classeItem, "Item de classe deve estar nos itens do ator");
      assert.equal(classeItem.system.atributos.forca, 1);
      assert.equal(classeItem.system.atributos.agilidade, 0);
    });

    await st.test("1.4 Trava de Nível Zero: Atributo não pode exceder 5", async () => {
      // Astério inicia com Força 5. Guerreiro concede Força e Agilidade.
      // Se tentar escolher 'forca', 5 + 1 = 6 > 5 (bloqueado pela trava!)
      await assert.rejects(
        async () => {
          await criarAspirante("Astério", "Guerreiro", "forca");
        },
        /Trava de Nível Zero.*não pode exceder 5/i,
        "Deve rejeitar atributo que excederia 5 no Nível Zero"
      );

      // Mahok também inicia com Força 5. Tentar escolher 'forca' de Guerreiro deve falhar
      await assert.rejects(
        async () => {
          await criarAspirante("Mahok", "Guerreiro", "forca");
        },
        /Trava de Nível Zero.*não pode exceder 5/i,
        "Mahok com Força 5 não pode escolher Força no Nível Zero"
      );

      // Porém, se Astério escolher 'agilidade' (base 2 -> 2 + 1 = 3 <= 5): permitido!
      const asterioAspirante = await criarAspirante("Astério", "Guerreiro", "agilidade");
      assert.equal(asterioAspirante.system.attributes.forca.value, 5, "Força deve permanecer 5");
      assert.equal(asterioAspirante.system.attributes.agilidade.value, 3, "Agilidade deve ser 2 + 1 = 3");
    });

    await st.test("1.5 Permite seleção que atinge exatamente 5 (teto respeitado)", async () => {
      // Anão (Força 4) + Guerreiro (escolhendo Força) -> 4 + 1 = 5 (exatamente 5, válido!)
      const aspirante = await criarAspirante("Anão", "Guerreiro", "forca");
      assert.equal(aspirante.system.attributes.forca.value, 5, "Atributo 5 é o limite permitido");
    });

    await st.test("1.6 Rejeita atributo escolhido não concedido pela classe", async () => {
      // Feiticeiro concede Inteligência e Vontade. Tentar escolher Força deve ser rejeitado.
      await assert.rejects(
        async () => {
          await criarAspirante("Humano", "Feiticeiro", "forca");
        },
        /não é concedido pela classe Feiticeiro/i,
        "Deve rejeitar atributo que não faz parte dos modificadores da classe"
      );
    });
  });

  // ===========================================================================
  // SUÍTE 2: EVOLUIR ASPIRANTE PARA NÍVEL 1
  // ===========================================================================
  await t.test("2. Evolução de Aspirante para Nível 1", async (st) => {
    const duasHabsGuerreiro = [
      { name: "Ataque Poderoso", type: "habilidade", system: { requisitos: "Força 3" } },
      { name: "Golpe Certeiro", type: "habilidade", system: { requisitos: "" } },
    ];

    await st.test("2.1 Rejeita evolução se Aspirante tiver menos de 10 XP", async () => {
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");
      aspirante.system.details.experiencia = 5; // apenas 5 XP

      await assert.rejects(
        async () => {
          await evoluirAspiranteParaNivel1(aspirante, "agilidade", duasHabsGuerreiro);
        },
        /mínimo 10 XP.*XP atual: 5/i,
        "Deve exigir 10 XP para evoluir para Nível 1"
      );
    });

    await st.test("2.2 Ao atingir 10 XP: torna-se Nível 1 e ganha +20 PV e +20 PM (40 -> 60)", async () => {
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");
      aspirante.system.details.experiencia = 10;

      await evoluirAspiranteParaNivel1(aspirante, "agilidade", duasHabsGuerreiro);

      assert.equal(aspirante.system.details.nivel, 1, "Nível deve ser atualizado para 1");
      assert.equal(aspirante.system.details.tipoNivelZero, "", "tipoNivelZero deve ser limpo");
      assert.equal(aspirante.system.resources.vida.value, PV_NIVEL_1, "PV deve passar para 60");
      assert.equal(aspirante.system.resources.vida.max, PV_NIVEL_1, "PV max deve passar para 60");
      assert.equal(aspirante.system.resources.vida.baseMax, PV_NIVEL_1, "PV baseMax deve ser 60");
      assert.equal(aspirante.system.resources.mana.value, PM_NIVEL_1, "PM deve passar para 60");
      assert.equal(aspirante.system.resources.mana.max, PM_NIVEL_1, "PM max deve passar para 60");
      assert.equal(aspirante.system.resources.mana.baseMax, PM_NIVEL_1, "PM baseMax deve ser 60");
    });

    await st.test("2.3 +1 no segundo Atributo da Classe e concessão das 2 novas Habilidades", async () => {
      // Humano: 3/3/3/3. Aspirante escolheu 'forca' (+1 -> 4).
      // Na evolução, escolhe 'agilidade': Força 4, Agilidade 3 + 1 = 4.
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");
      aspirante.system.details.experiencia = 10;

      await evoluirAspiranteParaNivel1(aspirante, "agilidade", duasHabsGuerreiro);

      assert.equal(aspirante.system.attributes.forca.value, 4, "Força mantém 4");
      assert.equal(aspirante.system.attributes.agilidade.value, 4, "Agilidade agora recebe +1 (3 + 1 = 4)");

      // Verifica as 2 novas habilidades
      const temHab1 = aspirante.items.some((i) => i.name === "Ataque Poderoso");
      const temHab2 = aspirante.items.some((i) => i.name === "Golpe Certeiro");
      assert.ok(temHab1, "Deve possuir Ataque Poderoso");
      assert.ok(temHab2, "Deve possuir Golpe Certeiro");
    });

    await st.test("2.4 No Nível 1 o segundo Atributo PODE ultrapassar 5", async () => {
      // Astério: Força 5, Agilidade 2.
      // Aspirante escolheu 'agilidade' (trava impediria Força).
      // Ao evoluir para Nível 1: escolhe 'forca' como segundo atributo!
      // Agora Força deve atingir 5 + 1 = 6 (permitido no Nível 1!).
      const asterio = await criarAspirante("Astério", "Guerreiro", "agilidade");
      assert.equal(asterio.system.attributes.forca.value, 5);
      assert.equal(asterio.system.attributes.agilidade.value, 3);

      asterio.system.details.experiencia = 10;
      await evoluirAspiranteParaNivel1(asterio, "forca", duasHabsGuerreiro);

      assert.equal(asterio.system.attributes.forca.value, 6, "Força do Astério agora pode ser 6 no Nível 1!");
      assert.equal(asterio.system.attributes.agilidade.value, 3, "Agilidade permanece 3");
    });

    await st.test("2.5 Rejeita repetir o primeiro atributo como segundo atributo", async () => {
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");
      aspirante.system.details.experiencia = 10;

      await assert.rejects(
        async () => {
          await evoluirAspiranteParaNivel1(aspirante, "forca", duasHabsGuerreiro);
        },
        /segundo atributo da classe deve ser diferente do primeiro/i,
        "Não pode escolher duas vezes o mesmo atributo da classe"
      );
    });

    await st.test("2.6 Rejeita se não fornecer exatamente 2 novas habilidades", async () => {
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");
      aspirante.system.details.experiencia = 10;

      await assert.rejects(
        async () => {
          await evoluirAspiranteParaNivel1(aspirante, "agilidade", [duasHabsGuerreiro[0]]);
        },
        /exatamente 2 novas habilidades/i,
        "Deve rejeitar com apenas 1 habilidade"
      );

      await assert.rejects(
        async () => {
          await evoluirAspiranteParaNivel1(aspirante, "agilidade", [...duasHabsGuerreiro, { name: "Terceira" }]);
        },
        /exatamente 2 novas habilidades/i,
        "Deve rejeitar com 3 habilidades"
      );
    });
  });

  // ===========================================================================
  // SUÍTE 3: CRIAR DESCLASSIFICADO (NÍVEL ZERO)
  // ===========================================================================
  await t.test("3. Criação de Desclassificado — Recursos, Antecedente e Atributos Puros", async (st) => {
    await st.test("3.1 Inicia com 30 PV e 30 PM (em vez de 60/60) e Nível 0", async () => {
      const desclassificado = await criarDesclassificado("Humano", "Caçador");

      assert.equal(desclassificado.system.details.nivel, 0, "Desclassificado inicia no Nível 0");
      assert.equal(desclassificado.system.details.tipoNivelZero, "desclassificado", "Tipo é 'desclassificado'");
      assert.equal(desclassificado.system.details.classe, "", "Desclassificado não possui classe inicial");
      assert.equal(desclassificado.system.resources.vida.value, PV_INICIAL_DESCLASSIFICADO, "PV deve ser 30");
      assert.equal(desclassificado.system.resources.vida.max, PV_INICIAL_DESCLASSIFICADO, "PV max deve ser 30");
      assert.equal(desclassificado.system.resources.vida.baseMax, PV_INICIAL_DESCLASSIFICADO, "PV baseMax deve ser 30");
      assert.equal(desclassificado.system.resources.mana.value, PM_INICIAL_DESCLASSIFICADO, "PM deve ser 30");
      assert.equal(desclassificado.system.resources.mana.max, PM_INICIAL_DESCLASSIFICADO, "PM max deve ser 30");
      assert.equal(desclassificado.system.resources.mana.baseMax, PM_INICIAL_DESCLASSIFICADO, "PM baseMax deve ser 30");
    });

    await st.test("3.2 Nenhum ponto extra de Atributo de classe (apenas atributos raciais puros)", async () => {
      // Anão puro: Força 4, Agilidade 2, Inteligência 3, Vontade 3
      const desclassificado = await criarDesclassificado("Anão", "Ferreiro");

      assert.equal(desclassificado.system.attributes.forca.value, 4, "Força deve ser exatamente 4 (racial)");
      assert.equal(desclassificado.system.attributes.agilidade.value, 2, "Agilidade deve ser exatamente 2 (racial)");
      assert.equal(desclassificado.system.attributes.inteligencia.value, 3, "Inteligência deve ser 3 (racial)");
      assert.equal(desclassificado.system.attributes.vontade.value, 3, "Vontade deve ser 3 (racial)");
    });

    await st.test("3.3 Definido por um Antecedente (sem custo de Ponto de Atributo)", async () => {
      const desclassificado = await criarDesclassificado("Elfo", "Caçador");

      assert.equal(desclassificado.system.details.antecedente, "Caçador", "Antecedente registrado nos detalhes");

      // Item de antecedente deve estar na lista de itens
      const temItemAnt = desclassificado.items.some(
        (i) => i.name === "Caçador" && i.system?.categoria === "antecedente"
      );
      assert.ok(temItemAnt, "Item de Antecedente deve ser adicionado ao personagem");

      // Elfo puro: Força 2, Agilidade 4, Inteligência 3, Vontade 3
      assert.equal(desclassificado.system.attributes.forca.value, 2);
      assert.equal(desclassificado.system.attributes.agilidade.value, 4);
      assert.equal(desclassificado.system.attributes.inteligencia.value, 3);
      assert.equal(desclassificado.system.attributes.vontade.value, 3);
    });

    await st.test("3.4 Habilidade Automática da Raça é concedida", async () => {
      const desclassificado = await criarDesclassificado("Anão", "Minerador");
      const temHabRacial = desclassificado.items.some(
        (i) => i.name.toLowerCase().includes("coração da montanha") || i.name.toLowerCase().includes("coracao da montanha")
      );
      assert.ok(temHabRacial, "Deve possuir Coração da Montanha");
    });

    await st.test("3.5 Rejeita criação sem antecedente", async () => {
      await assert.rejects(
        async () => {
          await criarDesclassificado("Humano", null);
        },
        /obrigatoriamente definido por um Antecedente/i,
        "Deve rejeitar criação de Desclassificado sem antecedente"
      );
    });
  });

  // ===========================================================================
  // SUÍTE 4: EVOLUIR DESCLASSIFICADO PARA NÍVEL 1
  // ===========================================================================
  await t.test("4. Evolução de Desclassificado para Nível 1", async (st) => {
    const duasHabsLadino = [
      { name: "Acrobacia", type: "habilidade", system: { requisitos: "" } },
      { name: "Ataque Furtivo", type: "habilidade", system: { requisitos: "Agilidade 3" } },
    ];

    await st.test("4.1 Rejeita evolução se Desclassificado tiver menos de 10 XP", async () => {
      const desclassificado = await criarDesclassificado("Humano", "Grumete");
      desclassificado.system.details.experiencia = 7;

      await assert.rejects(
        async () => {
          await evoluirDesclassificadoParaNivel1(desclassificado, "Ladino", duasHabsLadino);
        },
        /mínimo 10 XP.*XP atual: 7/i,
        "Deve exigir 10 XP para evoluir"
      );
    });

    await st.test("4.2 Ao atingir 10 XP: escolhe Classe Nível 1, ganha +30 PV e +30 PM (30 -> 60)", async () => {
      const desclassificado = await criarDesclassificado("Humano", "Grumete");
      desclassificado.system.details.experiencia = 10;

      await evoluirDesclassificadoParaNivel1(desclassificado, "Ladino", duasHabsLadino);

      assert.equal(desclassificado.system.details.nivel, 1, "Nível deve ser 1");
      assert.equal(desclassificado.system.details.classe, "Ladino", "Classe registrada");
      assert.equal(desclassificado.system.resources.vida.value, PV_NIVEL_1, "PV deve ser 60 (30 + 30)");
      assert.equal(desclassificado.system.resources.vida.max, PV_NIVEL_1, "PV max deve ser 60");
      assert.equal(desclassificado.system.resources.mana.value, PM_NIVEL_1, "PM deve ser 60 (30 + 30)");
      assert.equal(desclassificado.system.resources.mana.max, PM_NIVEL_1, "PM max deve ser 60");
    });

    await st.test("4.3 Ganha Habilidade Automática da Classe", async () => {
      const desclassificado = await criarDesclassificado("Humano", "Grumete");
      desclassificado.system.details.experiencia = 10;

      await evoluirDesclassificadoParaNivel1(desclassificado, "Ladino", duasHabsLadino);

      // Ladino: Gatuno
      const temHabClasse = desclassificado.items.some(
        (i) => i.name.toLowerCase().includes("gatuno")
      );
      assert.ok(temHabClasse, "Deve possuir a habilidade automática Gatuno do Ladino");
    });

    await st.test("4.4 Modificadores da Classe com redutor de -1 ponto no atributo (por possuir Antecedente)", async () => {
      // Ladino normalmente concede +1 Agilidade e +1 Inteligência (total: 2 pontos de atributo).
      // Como o Desclassificado já possui Antecedente, aplica-se o redutor de -1 ponto!
      // Ou seja, ele recebe apenas 1 ponto no atributo (em vez de 2).
      // Humano: 3 Força, 3 Agilidade, 3 Inteligência, 3 Vontade.
      // Se escolher 'agilidade' para o bônus:
      // Agilidade: 3 + 1 = 4
      // Inteligência: 3 + 0 = 3 (devido ao redutor de -1 ponto do antecedente!)
      const desclassificado = await criarDesclassificado("Humano", "Grumete");
      desclassificado.system.details.experiencia = 10;

      await evoluirDesclassificadoParaNivel1(desclassificado, "Ladino", duasHabsLadino, "agilidade");

      assert.equal(desclassificado.system.attributes.agilidade.value, 4, "Agilidade deve receber o único ponto (+1)");
      assert.equal(desclassificado.system.attributes.inteligencia.value, 3, "Inteligência NÃO recebe ponto devido ao redutor de -1");
      assert.equal(desclassificado.system.attributes.forca.value, 3);
      assert.equal(desclassificado.system.attributes.vontade.value, 3);

      // Total de bônus concedido pela classe no item: exatamente 1 ponto (soma = 1)
      const classeItem = desclassificado.items.find((i) => i.type === "classe");
      assert.ok(classeItem);
      const somaBonusClasse =
        classeItem.system.atributos.forca +
        classeItem.system.atributos.agilidade +
        classeItem.system.atributos.inteligencia +
        classeItem.system.atributos.vontade;
      assert.equal(somaBonusClasse, 1, "Classe deve conceder exatamente 1 ponto (redutor de -1 aplicado)");
      assert.equal(classeItem.flags["mighty-blade"].redutorAntecedenteAplicado, true);
    });

    await st.test("4.5 Concede as 2 novas Habilidades escolhidas", async () => {
      const desclassificado = await criarDesclassificado("Humano", "Grumete");
      desclassificado.system.details.experiencia = 10;

      await evoluirDesclassificadoParaNivel1(desclassificado, "Ladino", duasHabsLadino, "agilidade");

      assert.ok(desclassificado.items.some((i) => i.name === "Acrobacia"), "Acrobacia adicionada");
      assert.ok(desclassificado.items.some((i) => i.name === "Ataque Furtivo"), "Ataque Furtivo adicionado");
    });
  });

  // ===========================================================================
  // SUÍTE 5: CENÁRIOS INTEGRADOS, DERIVADOS E CASOS DE BORDA
  // ===========================================================================
  await t.test("5. Cenários Integrados, Estatísticas Derivadas e Casos de Borda", async (st) => {
    await st.test("5.1 Estatísticas derivadas do Aspirante Anão Guerreiro (Bloqueio, Esquiva, Deslocamento, Carga)", async () => {
      // Anão Guerreiro Aspirante:
      // Força: 4 (raça) + 1 (classe) = 5
      // Agilidade: 2 (raça)
      // Inteligência: 3 (raça), Vontade: 3 (raça)
      // Bloqueio base = 5 + Força (5) = 10
      // Esquiva base = 5 + Agilidade (2) = 7
      // Determinação = 8 + max(VON=3, INT=3) = 11  (GB p.36)
      // Carga = Força (5) * 10 = 50 (sem contar Coração da Montanha) ou +20 com Coração da Montanha
      // Deslocamento = floor(AGI/2) + 5 = floor(2/2) + 5 = 6  (GB p.19)
      const aspirante = await criarAspirante("Anão", "Guerreiro", "forca");

      assert.equal(aspirante.system.defesas.bloqueio.value, 10, "Bloqueio deve ser 10");
      assert.equal(aspirante.system.defesas.esquiva.value, 7, "Esquiva deve ser 7");
      assert.equal(aspirante.system.defesas.determinacao.value, 11, "Determinação deve ser 11 (8 + max(VON=3, INT=3), GB p.36)");
      assert.equal(aspirante.system.subattributes.deslocamento.value, 6, "Deslocamento deve ser 6 (floor(2/2) + 5, GB p.19)");
    });

    await st.test("5.2 Preservação de ferimentos residuais na evolução (+20 PV no Aspirante)", async () => {
      // Se o Aspirante tinha 35 PV de 40 (5 pontos de dano)
      const aspirante = await criarAspirante("Humano", "Guerreiro", "forca");
      aspirante.system.resources.vida.value = 35; // 5 de dano
      aspirante.system.details.experiencia = 10;

      await evoluirAspiranteParaNivel1(aspirante, "agilidade", [
        { name: "Hab 1", type: "habilidade" },
        { name: "Hab 2", type: "habilidade" },
      ]);

      assert.equal(aspirante.system.resources.vida.max, 60, "Novo PV max é 60");
      assert.equal(aspirante.system.resources.vida.value, 55, "PV atual deve ser 55 (preservando os 5 de dano)");
    });

    await st.test("5.3 Preservação de ferimentos residuais na evolução (+30 PV no Desclassificado)", async () => {
      // Se o Desclassificado tinha 22 PV de 30 (8 pontos de dano)
      const desclassificado = await criarDesclassificado("Humano", "Mascate");
      desclassificado.system.resources.vida.value = 22; // 8 de dano
      desclassificado.system.details.experiencia = 10;

      await evoluirDesclassificadoParaNivel1(desclassificado, "Guerreiro", [
        { name: "Hab 1", type: "habilidade" },
        { name: "Hab 2", type: "habilidade" },
      ]);

      assert.equal(desclassificado.system.resources.vida.max, 60, "Novo PV max é 60");
      assert.equal(desclassificado.system.resources.vida.value, 52, "PV atual deve ser 52 (preservando os 8 de dano)");
    });

    await st.test("5.4 Aceita passagem de objetos canônicos ou strings indistintamente", async () => {
      const racaAnao = CANONICAL_RACAS.find((r) => r.name === "Anão");
      const classeGuerreiro = CANONICAL_CLASSES.find((c) => c.name === "Guerreiro");

      const aspirante = await criarAspirante(racaAnao, classeGuerreiro, "forca");
      assert.equal(aspirante.system.details.raca, "Anão");
      assert.equal(aspirante.system.details.classe, "Guerreiro");
      assert.equal(aspirante.system.attributes.forca.value, 5);
    });
  });
});
