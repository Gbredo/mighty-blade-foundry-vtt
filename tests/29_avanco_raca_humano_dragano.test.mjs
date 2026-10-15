import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  addAbility,
  levelUp,
} from "./test-helper.mjs";
import {
  CANONICAL_RACAS,
  CANONICAL_HABILIDADES,
} from "../module/data/canonical-packs-data.mjs";
import {
  LINHAGENS_DRACONICAS,
  CARACTERISTICAS_DRACONICAS,
  obterAtributoEscolhidoDeHabilidade,
  construirItensOrigemDraconica,
} from "../module/helpers/concessoes.mjs";
import {
  validarAquisicaoHabilidade,
  filtrarHabilidadesElegiveis,
} from "../module/helpers/restricoes.mjs";
import {
  avaliarRequisitos,
  parseRequisitosTexto,
} from "../module/helpers/requisitos.mjs";
import { calcularDano } from "../module/helpers/danos-condicoes.mjs";
import {
  calcularDanoQueda,
  calcularFolegoAgua,
} from "../module/helpers/carga-ambiente.mjs";

describe("Subtítulo 29 — Sistema de Avanço (D&D 5e) e Sub-Features Raciais: Humano & Dragano", () => {
  describe("Caso 1: Metadados Canônicos de Avanço e Sub-Features nos Compêndios", () => {
    test("1.1 - Raça Humano possui concessão estruturada do tipo escolhaAtributo (Adaptabilidade)", () => {
      const humano = CANONICAL_RACAS.find((r) => r.flags?.["mighty-blade"]?.slug === "humano");
      assert.ok(humano, "Raça Humano deve existir em CANONICAL_RACAS");
      const conc = humano.system?.concessoes?.[0];
      assert.ok(conc, "Humano deve possuir concessão");
      assert.equal(conc.tipo, "escolhaAtributo");
      assert.equal(conc.ref, "adaptabilidade");
      assert.equal(conc.valor, 1);
    });

    test("1.2 - Raça Dragano possui concessão estruturada do tipo origemDraconica", () => {
      const dragano = CANONICAL_RACAS.find((r) => r.flags?.["mighty-blade"]?.slug === "dragano");
      assert.ok(dragano, "Raça Dragano deve existir em CANONICAL_RACAS");
      const conc = dragano.system?.concessoes?.[0];
      assert.ok(conc, "Dragano deve possuir concessão");
      assert.equal(conc.tipo, "origemDraconica");
      assert.equal(conc.ref, "linhagem-draconica");
      assert.equal(conc.escolhaDraconica, true);
    });

    test("1.3 - As 6 Características Dracônicas existem como Sub-Features em CANONICAL_HABILIDADES e são ocultadas da compra avulsa", () => {
      const idsEsperados = [
        "asas",
        "barbatanas",
        "cauda",
        "garras",
        "escamas",
        "olhos",
      ];
      for (const subId of idsEsperados) {
        const sub = CANONICAL_HABILIDADES.find((h) => h.flags?.["mighty-blade"]?.subFeatureId === subId);
        assert.ok(sub, `Sub-feature '${subId}' deve existir em CANONICAL_HABILIDADES`);
        assert.equal(sub.flags["mighty-blade"].isSubFeature, true);
        assert.equal(sub.flags["mighty-blade"].parentSlug, "linhagem-draconica");
        assert.equal(sub.flags["mighty-blade"].originLabel, "Origem Dracônica");
      }

      const dummyActor = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "forca",
      });
      const elegiveis = filtrarHabilidadesElegiveis(dummyActor, CANONICAL_HABILIDADES);
      for (const subId of idsEsperados) {
        assert.equal(
          elegiveis.some((h) => h.flags?.["mighty-blade"]?.subFeatureId === subId),
          false,
          `Sub-feature '${subId}' não deve aparecer na lista de habilidades avulsas elegíveis`
        );
      }
    });
  });

  describe("Caso 2: Humano — Adaptabilidade e Diversidade com Exclusão de Atributo", () => {
    test("2.1 - Adaptabilidade aplica +1 no atributo escolhido e registra metadados de avanço", () => {
      const humano = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "forca",
      });
      // Humano (3) + Guerreiro (+1) + Adaptabilidade (+1) = 5 em baseAttributes
      assert.equal(humano.baseAttributes.forca, 5);
      assert.equal(obterAtributoEscolhidoDeHabilidade(humano, "Adaptabilidade"), "forca");

      const adaptItem = humano.items.find((i) => i.name === "Adaptabilidade");
      assert.ok(adaptItem);
      assert.equal(adaptItem.flags?.["mighty-blade"]?.chosenAttribute, "forca");
      assert.equal(adaptItem.flags?.["mighty-blade"]?.advancementSummary, "+1 Força");
    });

    test("2.2 - Diversidade bloqueia o atributo já escolhido em Adaptabilidade e permite outro atributo", () => {
      const humano = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "forca",
      });

      const checkRepetido = validarAquisicaoHabilidade(humano, {
        name: "Diversidade",
        type: "habilidade",
        atributo: "forca",
      });
      assert.equal(checkRepetido.permitido, false);
      assert.match(checkRepetido.motivo, /Adaptabilidade/i);

      assert.throws(
        () => addAbility(humano, { name: "Diversidade", type: "habilidade", atributo: "forca" }),
        /Adaptabilidade/i
      );

      // Escolhendo um atributo diferente (Vontade) funciona e soma +1 em Vontade
      const vonAntes = humano.attributes.vontade;
      addAbility(humano, { name: "Diversidade", type: "habilidade", atributo: "vontade" });
      assert.equal(humano.attributes.vontade, vonAntes + 1);
    });
  });

  describe("Caso 3: Dragano — Origem Dracônica (Opção C: Habilidade-Mãe + Sub-Features Vinculadas)", () => {
    test("3.1 - Criação de Dragano com 3 Características Dracônicas aplica Resistência, Vulnerabilidade, +2 Defesa (Escamas) e Imunidade a Queda (Asas)", () => {
      const draganoSemEscamas = createCharacter({
        raceId: "dragano",
        classId: "guerreiro",
        draconicOrigin: {
          linhagemId: "fogo-vuln-frio",
          caracteristicasIds: ["asas", "barbatanas", "cauda"],
        },
      });
      const dragano = createCharacter({
        raceId: "dragano",
        classId: "guerreiro",
        draconicOrigin: {
          linhagemId: "fogo-vuln-frio",
          caracteristicasIds: ["asas", "escamas", "chifres-garras-e-presas"],
        },
      });

      const nomesHab = dragano.abilities.map((h) => h.name);
      assert.ok(nomesHab.includes("Linhagem Dracônica"));
      assert.ok(nomesHab.includes("Asas"));
      assert.ok(nomesHab.includes("Escamas"));
      assert.ok(nomesHab.includes("Chifres, Garras e Presas"));

      // Sub-features apontam para a habilidade-mãe Linhagem Dracônica
      const mae = dragano.abilities.find((h) => h.name === "Linhagem Dracônica");
      const subEscamas = dragano.abilities.find((h) => h.name === "Escamas");
      assert.equal(subEscamas.flags?.["mighty-blade"]?.parentAbilityId, mae._id);
      assert.equal(subEscamas.flags?.["mighty-blade"]?.isSubFeature, true);

      // Escamas concede +2 na Defesa (Bloqueio e Esquiva)
      assert.equal(
        dragano.system.defesas.bloqueio.value,
        draganoSemEscamas.system.defesas.bloqueio.value + 2
      );
      assert.equal(
        dragano.system.defesas.esquiva.value,
        draganoSemEscamas.system.defesas.esquiva.value + 2
      );

      // Resistência a Fogo (divide por 2) e Vulnerabilidade a Frio (dobra)
      assert.equal(calcularDano(10, "fogo", dragano), 5);
      assert.equal(calcularDano(10, "frio", dragano), 20);

      // Asas concede imunidade a dano de queda
      const queda = calcularDanoQueda(12, dragano, { danoTotal: 42 });
      assert.equal(queda.danoFinal, 0);
      assert.equal(queda.imuneQueda, true);
    });

    test("3.2 - Sacrifício Dracônico (-1 Atributo) permite escolher 4 Características Dracônicas e reduz o atributo sacrificado", () => {
      const draganoSemSacrificio = createCharacter({
        raceId: "dragano",
        classId: "feiticeiro",
        draconicOrigin: {
          linhagemId: "eletr-vuln-fogo",
          caracteristicasIds: ["asas", "barbatanas", "cauda"],
        },
      });
      const draganoSacrificio = createCharacter({
        raceId: "dragano",
        classId: "feiticeiro",
        draconicOrigin: {
          linhagemId: "eletr-vuln-fogo",
          caracteristicasIds: ["asas", "barbatanas", "cauda", "olhos-draconicos"],
          sacrificioAtributo: "forca",
        },
      });

      assert.equal(draganoSacrificio.attributes.forca, draganoSemSacrificio.attributes.forca - 1);

      const subFeatures = draganoSacrificio.abilities.filter(
        (h) => h.flags?.["mighty-blade"]?.isSubFeature
      );
      assert.equal(subFeatures.length, 4);

      // Barbatanas garante fôlego infinito embaixo d'água
      assert.equal(calcularFolegoAgua(draganoSacrificio), Infinity);
    });

    test("3.3 - Sub-Features desbloqueiam pré-requisitos de habilidades raciais avançadas do Dragano", () => {
      // Verifica que o parser de requisitos preserva 'Chifres, Garras e Presas' como token único
      const tokens = parseRequisitosTexto("Raça Dragano, Chifres, Garras e Presas");
      assert.equal(tokens.length, 2);
      assert.equal(tokens[1], "Chifres, Garras e Presas");

      const dragano = createCharacter({
        raceId: "dragano",
        classId: "guerreiro",
        draconicOrigin: {
          linhagemId: "fogo-vuln-frio",
          caracteristicasIds: ["asas", "escamas", "chifres-garras-e-presas"],
        },
      });

      // No Nível 1: Escamas desbloqueia Escamas Pesadas; Chifres, Garras e Presas desbloqueia Armas Naturais
      assert.equal(avaliarRequisitos("Raça Dragano, Escamas", dragano).atende, true);
      assert.equal(avaliarRequisitos("Raça Dragano, Chifres, Garras e Presas", dragano).atende, true);

      // Como não escolheu Cauda, não atende requisito de Cauda Chicote
      assert.equal(avaliarRequisitos("Raça Dragano, Cauda", dragano).atende, false);

      // No Nível 2: Asas desbloqueia Asas Pesadas
      levelUp(dragano, { targetLevel: 2, evolutionPoint: "10_pv" });
      assert.equal(avaliarRequisitos("Raça Dragano, Asas, Nível 2", dragano).atende, true);
    });
  });
});
