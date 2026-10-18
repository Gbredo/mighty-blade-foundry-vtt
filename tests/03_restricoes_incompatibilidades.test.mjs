/**
 * Bloco 3 — Restrições e Incompatibilidades Raciais / Pactos.
 * Mighty Blade 3e (Foundry VTT v14 / Test Runner Nativo Node.js).
 *
 * Sub-módulos:
 * 3.1 Restrições da Raça Naga (Sacerdote/Dogma e dimorfismo sexual).
 * 3.2 Incompatibilidade absoluta Pacto × Misticismo (Guia do Vilão).
 * 3.3 Trava e restrições físicas de Nanismo.
 * 3.4 Proibições raciais específicas (Astério/Intuição, Mahok/Sentidos Apurados, Aesir/Fúria Bestial).
 * 3.5 Trava de habilidades exclusivas de criação nos Níveis 2+.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createMockActor, createCharacter, addAbility } from "./test-helper.mjs";
import {
  CANONICAL_CLASSES,
  CANONICAL_EQUIPAMENTOS,
  CANONICAL_HABILIDADES,
  CANONICAL_MAGIAS,
} from "../module/data/canonical-packs-data.mjs";
import { filtrarItensCompendioParaAtor } from "../module/apps/compendium-browser.mjs";
import {
  validarClasseRaca,
  validarAquisicaoHabilidade,
  validarAcessoMagia,
  validarIncompatibilidadePactoMisticismo,
  adicionarPacto,
  validarAquisicaoNanismo,
  podeEmpunharArma,
  calcularMaosArma,
  filtrarHabilidadesElegiveis,
} from "../module/helpers/restricoes.mjs";

const arma = (nome) => {
  const a = CANONICAL_EQUIPAMENTOS.find((e) => e.name === nome);
  assert.ok(a, `Arma canônica "${nome}" deve existir`);
  return a;
};
const nomes = (char) => char.items.map((i) => i.name);

describe("Bloco 3 — Restrições e Incompatibilidades Raciais / Pactos", () => {
  // ===========================================================================
  describe("Sub-módulo 3.1 — Restrições da Raça Naga", () => {
    for (const raceId of ["naga_macho", "naga_femea"]) {
      test(`3.1.1 ${raceId}: criar como Sacerdote lança exceção de validação`, () => {
        assert.throws(
          () => createCharacter({ raceId, classId: "sacerdote", level: 1 }),
          /Nagas não podem escolher a classe Sacerdote/i,
        );
      });

      test(`3.1.1 ${raceId}: adquirir Dogma é bloqueado (e addAbility lança exceção)`, () => {
        const naga = createCharacter({ raceId, classId: "guerreiro", level: 2 });
        const res = validarAquisicaoHabilidade(naga, "Dogma");
        assert.equal(res.permitido, false);
        assert.match(res.motivo, /Glycon/i);
        assert.throws(() => addAbility(naga, "Dogma"), /Nagas não podem possuir Dogma/i);
        assert.equal(nomes(naga).includes("Dogma"), false, "Dogma não pode entrar na ficha");
      });
    }

    test("3.1.2 Naga Fêmea é elegível para Feiticeiro, Necromante e Rúnico", () => {
      for (const classe of ["Feiticeiro", "Necromante", "Rúnico"]) {
        assert.doesNotThrow(() => createCharacter({ raceId: "naga_femea", classId: classe }));
      }
    });

    test("3.1.2 Naga Macho: classes arcanas bloqueadas, combatentes liberadas", () => {
      assert.throws(() => createCharacter({ raceId: "naga_macho", classId: "feiticeiro" }), /aptidão mágica\/arcana/i);
      assert.throws(() => createCharacter({ raceId: "naga_macho", classId: "necromante" }));
      for (const classe of ["Guerreiro", "Espadachim", "Paladino", "Rúnico"]) {
        assert.doesNotThrow(() => createCharacter({ raceId: "naga_macho", classId: classe }));
      }
    });

    test("3.1.2 Naga Macho não acessa Conhecimento Místico nem magias místicas", () => {
      const macho = createCharacter({ raceId: "naga_macho", classId: "guerreiro" });
      assert.equal(validarAquisicaoHabilidade(macho, "Conhecimento Místico").permitido, false);

      const mistica = CANONICAL_MAGIAS.find((m) => m.system?.fonte === "mistica");
      assert.ok(mistica, "Deve existir ao menos uma magia mística canônica");
      assert.equal(validarAcessoMagia(macho, mistica).permitido, false);
    });

    test("3.1.2 Naga Fêmea acessa magias arcanas de sua classe (e bloqueia magias exclusivas de outra classe)", () => {
      const femea = createCharacter({ raceId: "naga_femea", classId: "feiticeiro" });
      const arcanaFeiticeiro = CANONICAL_MAGIAS.find(
        (m) => m.system?.fonte === "arcana" && m.system?.acesso?.includes("Feiticeiro"),
      );
      assert.ok(arcanaFeiticeiro, "Deve existir magia arcana acessível a Feiticeiro");
      assert.equal(validarAcessoMagia(femea, arcanaFeiticeiro).permitido, true);

      const arcanaArtifice = CANONICAL_MAGIAS.find(
        (m) => m.system?.fonte === "arcana" && m.system?.acesso?.length === 1 && m.system.acesso[0] === "Artífice",
      );
      assert.ok(arcanaArtifice, "Deve existir magia arcana exclusiva de Artífice");
      assert.equal(validarAcessoMagia(femea, arcanaArtifice).permitido, false);
    });

    test("3.1 Controle: Humano pode ser Sacerdote normalmente", () => {
      assert.doesNotThrow(() =>
        createCharacter({ raceId: "humano", classId: "sacerdote", humanBonusAttribute: "vontade" }),
      );
      assert.equal(validarClasseRaca(createMockActor({ details: { raca: "Humano" } }), "Sacerdote").permitido, true);
    });
  });

  // ===========================================================================
  describe("Sub-módulo 3.2 — Incompatibilidade Absoluta Pacto × Misticismo", () => {
    const criarCultista = () =>
      createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "forca",
        level: 3,
        abilities: ["Pacto da Tirania"],
      });

    test("3.2.1 Cultista com Pacto não pode adquirir Conhecimento Místico", () => {
      const c = criarCultista();
      assert.equal(validarAquisicaoHabilidade(c, "Conhecimento Místico").permitido, false);
      assert.throws(() => addAbility(c, "Conhecimento Místico"), /Conhecimento Místico/i);
    });

    test("3.2.1 Cultista com Pacto não pode adquirir Dogma", () => {
      const c = criarCultista();
      assert.throws(() => addAbility(c, "Dogma"), /Dogma/i);
    });

    test("3.2.1 Cultista com Pacto não pode ser Aprendiz de Sacerdote", () => {
      const c = criarCultista();
      assert.equal(validarIncompatibilidadePactoMisticismo(c, { tipo: "aprendiz", nome: "Sacerdote" }).permitido, false);
      assert.equal(validarIncompatibilidadePactoMisticismo(c, "Aprendiz de Sacerdote").permitido, false);
    });

    test("3.2.1 Caminho Cultista (sem item de Pacto) também bloqueia misticismo", () => {
      const c = createMockActor({ details: { raca: "Humano", nivel: 3, caminho: "Cultista" } });
      assert.equal(validarAquisicaoHabilidade(c, "Dogma").permitido, false);
    });

    test("3.2.2 Sacerdote que adquire Pacto perde Dogma e Conhecimento Místico (addAbility)", () => {
      const sacerdote = createCharacter({
        raceId: "humano",
        classId: "sacerdote",
        humanBonusAttribute: "vontade",
        abilities: ["Dogma"],
      });
      assert.ok(nomes(sacerdote).includes("Dogma"));
      assert.ok(nomes(sacerdote).includes("Conhecimento Místico"), "Sacerdote recebe Conhecimento Místico automático");

      addAbility(sacerdote, "Pacto da Loucura");

      assert.equal(nomes(sacerdote).includes("Dogma"), false);
      assert.equal(nomes(sacerdote).includes("Conhecimento Místico"), false);
      assert.equal(nomes(sacerdote).includes("Pacto da Loucura"), true);
    });

    for (const classe of ["Druida", "Dracomante"]) {
      test(`3.2.2 ${classe} com misticismo perde Dogma/Conhecimento Místico ao adquirir Pacto (adicionarPacto)`, async () => {
        const heroi = createMockActor({
          details: { raca: "Humano", classe, nivel: 4 },
          items: [
            { id: "cm", name: "Conhecimento Místico", type: "habilidade" },
            { id: "dg", name: "Dogma", type: "habilidade" },
            { id: "neutra", name: "Ataque Poderoso", type: "habilidade" },
          ],
        });
        const r = await adicionarPacto(heroi, { name: "Pacto da Escuridão" });
        assert.deepEqual(r.habilidadesRemovidas.sort(), ["Conhecimento Místico", "Dogma"].sort());
        assert.equal(nomes(heroi).includes("Pacto da Escuridão"), true);
        assert.equal(nomes(heroi).includes("Ataque Poderoso"), true, "Habilidades neutras são preservadas");
      });
    }
  });

  // ===========================================================================
  describe("Sub-módulo 3.3 — Trava e Restrições Físicas de Nanismo", () => {
    test("3.3.1 Metadílio não pode selecionar Nanismo", () => {
      const m = createCharacter({ raceId: "metadilio", classId: "ladino" });
      const res = validarAquisicaoNanismo(m);
      assert.equal(res.permitido, false);
      assert.match(res.motivo, /Metadílio/i);
      assert.throws(() => addAbility(m, "Nanismo"));
    });

    test("3.3.2 Nanismo é permitido no Nível 1 e bloqueado do Nível 2 ao 10", () => {
      assert.doesNotThrow(() => addAbility(createCharacter({ raceId: "anao", classId: "guerreiro", level: 1 }), "Nanismo"));
      for (let nivel = 2; nivel <= 10; nivel++) {
        const c = createCharacter({ raceId: "anao", classId: "guerreiro", level: nivel });
        assert.equal(validarAquisicaoNanismo(c).permitido, false, `Nível ${nivel} deve bloquear Nanismo`);
      }
    });

    test("3.3.3 Armas corporais de duas mãos são inaptas com Nanismo; disparo continua apto", () => {
      const anao = createCharacter({ raceId: "anao", classId: "guerreiro", abilities: ["Nanismo"] });
      assert.equal(podeEmpunharArma(anao, arma("Alabarda")).apto, false);
      assert.equal(podeEmpunharArma(anao, arma("Machado Pesado")).apto, false);
      assert.equal(podeEmpunharArma(anao, arma("Arco Longo")).apto, true);
    });

    test("3.3.3 Armas corporais com FN >= 5 exigem duas mãos com Nanismo", () => {
      const nanico = createCharacter({ raceId: "anao", classId: "guerreiro", abilities: ["Nanismo"] });
      const normal = createCharacter({ raceId: "anao", classId: "guerreiro" });
      const machado = arma("Machado de Batalha"); // FN 5, Mão-e-Meia

      assert.equal(calcularMaosArma(nanico, machado), 2);
      assert.equal(calcularMaosArma(normal, machado), 1, "Sem Nanismo, o Anão empunha com 1 mão");
      assert.equal(calcularMaosArma(nanico, arma("Martelo de Guerra")), 1, "FN 4 não exige 2 mãos");
    });
  });

  // ===========================================================================
  describe("Sub-módulo 3.4 — Proibições Raciais Específicas de Habilidades", () => {
    test("3.4.1 Astério e Astéria não podem adquirir Intuição", () => {
      for (const raceId of ["asterio", "asteria"]) {
        const c = createCharacter({ raceId, classId: "guerreiro", level: 2 });
        assert.throws(() => addAbility(c, "Intuição"), /Astério/i);
      }
      const h = createCharacter({ raceId: "humano", classId: "ladino", humanBonusAttribute: "agilidade", level: 2 });
      assert.doesNotThrow(() => addAbility(h, "Intuição"));
    });

    test("3.4.2 Mahok não pode adquirir Sentidos Apurados", () => {
      const m = createCharacter({ raceId: "mahok", classId: "guerreiro", level: 2 });
      assert.throws(() => addAbility(m, "Sentidos Apurados"), /Mahok/i);
      const e = createCharacter({ raceId: "elfo", classId: "patrulheiro", level: 2 });
      assert.doesNotThrow(() => addAbility(e, "Sentidos Apurados"));
    });

    test("3.4.3 Fúria Bestial: Aesir apenas com Espírito Animal Lobo ou Urso", () => {
      for (const esp of ["Lobo", "Urso"]) {
        const a = createMockActor({ details: { raca: "Aesir", espiritoAnimal: esp, nivel: 2 } });
        assert.equal(validarAquisicaoHabilidade(a, "Fúria Bestial").permitido, true, esp);
      }
      for (const esp of ["Corvo", "Águia", ""]) {
        const a = createMockActor({ details: { raca: "Aesir", espiritoAnimal: esp, nivel: 2 } });
        const r = validarAquisicaoHabilidade(a, "Fúria Bestial");
        assert.equal(r.permitido, false, `Espírito "${esp}" deve bloquear`);
        assert.match(r.motivo, /Lobo ou Urso/i);
      }
      const humano = createMockActor({ details: { raca: "Humano", espiritoAnimal: "Lobo" } });
      assert.equal(validarAquisicaoHabilidade(humano, "Fúria Bestial").permitido, false);
    });
  });

  // ===========================================================================
  describe("Sub-módulo 3.5 — Trava de Habilidades Exclusivas de Criação nos Níveis 2+", () => {
    const EXCLUSIVAS = [
      ["Isnuu", "faen"],
      ["Fulgurante", "fira"],
      ["Escamas Pesadas", "dragano"],
      ["Braços Extras", "mahok"],
      ["Olhos de Águia", "levent"],
      ["Fortaleza", "asterio"],
      ["Duro como Pedra", "anao"],
    ];

    for (const [hab, raceId] of EXCLUSIVAS) {
      test(`3.5.1 ${hab}: elegível no Nível 1 e bloqueada nos Níveis 2 a 10`, () => {
        const nv1 = createCharacter({ raceId, classId: "guerreiro", level: 1 });
        assert.equal(validarAquisicaoHabilidade(nv1, hab).permitido, true, `${hab} deve ser elegível no Nível 1`);

        for (let nivel = 2; nivel <= 10; nivel++) {
          const c = createCharacter({ raceId, classId: "guerreiro", level: nivel });
          const r = validarAquisicaoHabilidade(c, hab);
          assert.equal(r.permitido, false, `${hab} deve ser bloqueada no Nível ${nivel}`);
          assert.match(r.motivo, /Nível 1/i);
        }
      });
    }

    test("3.5.1 Lista de opções na evolução remove exclusivas de criação e mantém as comuns", () => {
      const opcoes = CANONICAL_HABILIDADES.filter((h) =>
        ["Isnuu", "Fulgurante", "Escamas Pesadas", "Braços Extras", "Olho da Águia", "Fortaleza", "Duro como Pedra", "Atletismo", "Bolsos Fundos"].includes(h.name),
      );
      assert.ok(opcoes.length >= 8, "Habilidades canônicas devem existir no compêndio");

      const nv1 = createCharacter({ raceId: "mahok", classId: "guerreiro", level: 1 });
      assert.ok(filtrarHabilidadesElegiveis(nv1, opcoes).some((h) => h.name === "Braços Extras"));

      const nv5 = createCharacter({ raceId: "mahok", classId: "guerreiro", level: 5 });
      const elegiveis = filtrarHabilidadesElegiveis(nv5, opcoes).map((h) => h.name);
      for (const [hab] of EXCLUSIVAS) assert.equal(elegiveis.includes(hab), false, `${hab} não pode aparecer no Nível 5`);
      assert.ok(elegiveis.includes("Atletismo"), "Habilidades gerais comuns continuam disponíveis");
    });

    test("3.5.1 Flag declarativa somenteCriacao: true também bloqueia após o Nível 1", () => {
      const hab = { name: "Habilidade Homebrew Inata", type: "habilidade", system: { somenteCriacao: true } };
      const nv1 = createCharacter({ raceId: "orc", classId: "guerreiro", level: 1 });
      const nv2 = createCharacter({ raceId: "orc", classId: "guerreiro", level: 2 });
      assert.equal(validarAquisicaoHabilidade(nv1, hab).permitido, true);
      assert.equal(validarAquisicaoHabilidade(nv2, hab).permitido, false);
    });
  });

  // ===========================================================================
  describe("Sub-módulo 3.6 — Integração Runtime: MightyBladeActor & Compendium Browser", () => {
    test("3.6.1 Naga Fêmea pode adquirir Conhecimento Místico e magias místicas compatíveis com seu acesso (fora de Sacerdote/Dogma)", () => {
      const femea = createCharacter({ raceId: "naga_femea", classId: "druida", level: 2 });
      assert.ok(femea.items.some((i) => i.name === "Conhecimento Místico"), "Naga Druida possui Conhecimento Místico automaticamente");

      const misticaDruida = CANONICAL_MAGIAS.find(
        (m) => m.system?.fonte === "mistica" && m.system?.acesso?.includes("Druida"),
      );
      assert.ok(misticaDruida, "Deve existir magia mística acessível a Druida");
      assert.equal(validarAcessoMagia(femea, misticaDruida).permitido, true);

      const misticaSacerdote = CANONICAL_MAGIAS.find(
        (m) => m.system?.fonte === "mistica" && m.system?.acesso?.length === 1 && m.system.acesso[0] === "Sacerdote",
      );
      assert.ok(misticaSacerdote, "Deve existir magia mística exclusiva de Sacerdote");
      assert.equal(validarAcessoMagia(femea, misticaSacerdote).permitido, false);
    });

    test("3.6.2 Hook _onClassCreated bloqueia e remove classe Sacerdote arrastada para Naga", async () => {
      const naga = createMockActor({
        name: "Naga Guerreira",
        details: { raca: "Naga (Fêmea)", classe: "Sacerdote" },
        items: [{ id: "cls-sac", name: "Sacerdote", type: "classe" }],
      });

      const ok = await naga._onClassCreated({ id: "cls-sac", name: "Sacerdote", type: "classe" });
      assert.equal(ok, false, "_onClassCreated deve rejeitar Sacerdote para Naga");
      assert.equal(naga.items.some((i) => i.name === "Sacerdote"), false, "Item de classe ilegal deve ser deletado");
      assert.equal(naga.system.details.classe, "", "Detalhe de classe deve ser limpo");
    });

    test("3.6.3 Hook _onHabilidadeCreated bloqueia habilidade proibida e revoga Dogma ao receber Pacto", async () => {
      const asterio = createMockActor({
        name: "Minos",
        details: { raca: "Astério", nivel: 2 },
        items: [{ id: "hab-int", name: "Intuição", type: "habilidade" }],
      });

      const okInt = await asterio._onHabilidadeCreated({ id: "hab-int", name: "Intuição", type: "habilidade" });
      assert.equal(okInt, false, "_onHabilidadeCreated deve rejeitar Intuição para Astério");
      assert.equal(asterio.items.some((i) => i.name === "Intuição"), false);

      // Revogação automática de Dogma/Conhecimento Místico quando Pacto é adicionado via ficha
      const devoto = createMockActor({
        name: "Devoto Corrompido",
        details: { raca: "Humano", classe: "Sacerdote", nivel: 3 },
        items: [
          { id: "hab-cm", name: "Conhecimento Místico", type: "habilidade" },
          { id: "hab-dg", name: "Dogma", type: "habilidade" },
          { id: "hab-pacto", name: "Pacto da Loucura", type: "habilidade" },
        ],
      });

      const okPacto = await devoto._onHabilidadeCreated({ id: "hab-pacto", name: "Pacto da Loucura", type: "habilidade" });
      assert.equal(okPacto, true);
      assert.equal(devoto.items.some((i) => i.name === "Dogma"), false, "Dogma deve ser revogado pelo hook");
      assert.equal(devoto.items.some((i) => i.name === "Conhecimento Místico"), false, "Conhecimento Místico deve ser revogado pelo hook");
      assert.equal(devoto.items.some((i) => i.name === "Pacto da Loucura"), true, "Pacto deve permanecer");
    });

    test("3.6.4 Compendium Browser filtra dinamicamente classes e habilidades incompatíveis", () => {
      const nagaMacho = createCharacter({ raceId: "naga_macho", classId: "guerreiro", level: 2 });
      const classesVisiveis = filtrarItensCompendioParaAtor(CANONICAL_CLASSES, "classe", nagaMacho).map((c) => c.name);

      assert.equal(classesVisiveis.includes("Sacerdote"), false, "Sacerdote oculto para Naga Macho");
      assert.equal(classesVisiveis.includes("Feiticeiro"), false, "Feiticeiro oculto para Naga Macho");
      assert.equal(classesVisiveis.includes("Necromante"), false, "Necromante oculto para Naga Macho");
      assert.equal(classesVisiveis.includes("Rúnico"), true, "Rúnico visível para Naga Macho");
      assert.equal(classesVisiveis.includes("Espadachim"), true, "Espadachim visível para Naga Macho");

      const habsVisiveisNv2 = filtrarItensCompendioParaAtor(CANONICAL_HABILIDADES, "habilidade", nagaMacho).map((h) => h.name);
      assert.equal(habsVisiveisNv2.includes("Dogma"), false, "Dogma oculto para Naga");
      assert.equal(habsVisiveisNv2.includes("Nanismo"), false, "Nanismo oculto no Nível 2+");
      assert.equal(habsVisiveisNv2.includes("Isnuu"), false, "Isnuu oculto no Nível 2+");
      assert.equal(habsVisiveisNv2.includes("Durão"), false, "Durão oculto sem organização O Arpão");
      assert.equal(habsVisiveisNv2.includes("Atletismo"), true, "Habilidade geral visível no Nível 2+");
    });
  });

  // ===========================================================================
  describe("Sub-módulo 3.7 — Paridade SSOT (habilidades.base) e Controle de Acesso (Feiticeiro × Sacerdote)", () => {
    test("3.7.1 Todas as 174 magias e 644 habilidades principais possuem acesso e tipoAcesso do SSOT", () => {
      // Fase C2: +11 magias adicionadas do Guia do Herói -> 174
      assert.equal(CANONICAL_MAGIAS.length, 174, "Total exato de 174 magias de habilidades.base");
      for (const m of CANONICAL_MAGIAS) {
        assert.ok(Array.isArray(m.system?.acesso) && m.system.acesso.length > 0, `Magia "${m.name}" deve ter acesso definido`);
        assert.ok(m.system?.tipoAcesso, `Magia "${m.name}" deve ter tipoAcesso definido`);
      }

      const habsPrincipais = CANONICAL_HABILIDADES.filter((h) => !h.flags?.["mighty-blade"]?.isSubFeature);
      // Fase C3b: +70 habilidades novas adicionadas do Canção do Bardo (574 + 70 = 644)
      assert.equal(habsPrincipais.length, 644, "Total exato de 644 habilidades principais de habilidades.base");
      for (const h of habsPrincipais) {
        assert.ok(Array.isArray(h.system?.acesso) && h.system.acesso.length > 0, `Habilidade "${h.name}" deve ter acesso definido`);
        assert.ok(h.system?.tipoAcesso, `Habilidade "${h.name}" deve ter tipoAcesso definido`);
      }
    });

    test("3.7.2 Daniel (Aesir Feiticeiro, Corvos Negros, Acólito) não vê magias de Sacerdote no Compendium Browser", () => {
      const daniel = createMockActor({
        name: "Daniel",
        details: {
          raca: "Aesir",
          classe: "Feiticeiro",
          organizacao: "Corvos Negros",
          antecedente: "Acólito",
          nivel: 1,
        },
        items: [
          { name: "Aesir", type: "raca" },
          { name: "Feiticeiro", type: "classe" },
          { name: "Corvos Negros", type: "organizacao" },
          { name: "Acólito", type: "antecedente" },
          { name: "Conhecimento Arcano", type: "habilidade" },
        ],
      });

      const magiasDaniel = filtrarItensCompendioParaAtor(CANONICAL_MAGIAS, "magia", daniel).map((m) => m.name);

      // Magias de Sacerdote / Druida / Necromante NÃO podem aparecer para Feiticeiro
      for (const proibida of [
        "Abençoar Aliados 1",
        "Abençoar Aliados 2",
        "Abençoar Objeto",
        "Acalmar Animais",
        "Animação Necromântica",
        "Arma Espiritual",
        "Asas Celestiais",
        "Caminhada Mágica",
        "Cura Sagrada 1",
      ]) {
        assert.equal(magiasDaniel.includes(proibida), false, `"${proibida}" não pode aparecer para Feiticeiro`);
      }

      // Magias de Feiticeiro DEVEM aparecer para Daniel
      for (const permitida of [
        "Arco Voltaico",
        "Aríete Mágico",
        "Bola de Fogo",
        "Congelar",
        "Incandescer",
        "Relâmpago 1",
        "Telecinésia",
      ]) {
        assert.equal(magiasDaniel.includes(permitida), true, `"${permitida}" deve aparecer para Feiticeiro`);
      }
    });

    test("3.7.3 Sacerdote vê magias de Sacerdote e só desbloqueia magias de Feiticeiro se for Aprendiz de Feiticeiro", () => {
      const sacerdote = createCharacter({
        raceId: "humano",
        classId: "sacerdote",
        humanBonusAttribute: "vontade",
        level: 2,
      });

      const magiasSac = filtrarItensCompendioParaAtor(CANONICAL_MAGIAS, "magia", sacerdote).map((m) => m.name);
      assert.equal(magiasSac.includes("Abençoar Aliados 1"), true);
      assert.equal(magiasSac.includes("Abençoar Aliados 2"), true);
      assert.equal(magiasSac.includes("Abençoar Objeto"), true);
      assert.equal(magiasSac.includes("Bola de Fogo"), false, "Bola de Fogo é exclusiva de Feiticeiro");

      // Ao adquirir Aprendiz de Feiticeiro, passa a ter acesso às magias de Feiticeiro também
      sacerdote.system.details.aprendiz = "Feiticeiro";
      const magiasSacAprendiz = filtrarItensCompendioParaAtor(CANONICAL_MAGIAS, "magia", sacerdote).map((m) => m.name);
      assert.equal(magiasSacAprendiz.includes("Bola de Fogo"), true, "Aprendiz de Feiticeiro libera magias de Feiticeiro");
    });

    test("3.7.4 Hook _onMagiaCreated bloqueia magias sem acesso de classe ou sem pré-requisitos atendidos", async () => {
      const daniel = createMockActor({
        name: "Daniel",
        details: { raca: "Aesir", classe: "Feiticeiro", nivel: 1 },
        items: [
          { id: "m-abenc", name: "Abençoar Aliados 1", type: "magia" },
        ],
      });

      const okSac = await daniel._onMagiaCreated({ id: "m-abenc", name: "Abençoar Aliados 1", type: "magia" });
      assert.equal(okSac, false, "Feiticeiro não pode adicionar Abençoar Aliados 1");
      assert.equal(daniel.items.some((i) => i.name === "Abençoar Aliados 1"), false);

      // Sacerdote Nv1 sem Abençoar Aliados 1 tentando adicionar Abençoar Aliados 2 (Requer Nível 5, Abençoar Aliados 1)
      const sacNv1 = createMockActor({
        name: "Clérigo Iniciante",
        details: { raca: "Humano", classe: "Sacerdote", nivel: 1 },
        items: [
          { id: "m-abenc2", name: "Abençoar Aliados 2", type: "magia" },
        ],
      });

      const okNv5 = await sacNv1._onMagiaCreated({ id: "m-abenc2", name: "Abençoar Aliados 2", type: "magia" });
      assert.equal(okNv5, false, "Sacerdote Nv1 sem Abençoar Aliados 1 não pode adicionar Abençoar Aliados 2");
      assert.equal(sacNv1.items.some((i) => i.name === "Abençoar Aliados 2"), false);
    });
  });

  // ===========================================================================
  describe("Sub-módulo 3.8 — Restrições de Raça e Idioma das Habilidades Gerais (Etapa J)", () => {
    test("3.8.1 Aesir não pode adquirir Fúria de Batalha", () => {
      const aesir = createCharacter({ raceId: "aesir", classId: "guerreiro", level: 1 });
      const res = validarAquisicaoHabilidade(aesir, "Fúria de Batalha");
      assert.equal(res.permitido, false);
      assert.match(res.motivo, /Não disponível para Aesir/i);
    });

    test("3.8.2 Astério (m e f) não pode adquirir Apóstata nem Mimetismo Social", () => {
      const asterioM = createCharacter({ raceId: "asterio", classId: "guerreiro", level: 1 });
      const asteriaF = createCharacter({ raceId: "asteria", classId: "guerreiro", level: 1 });

      for (const char of [asterioM, asteriaF]) {
        const checkApostata = validarAquisicaoHabilidade(char, "Apóstata");
        assert.equal(checkApostata.permitido, false);
        assert.match(checkApostata.motivo, /Não disponível para Astéri/i);

        const checkMimetismo = validarAquisicaoHabilidade(char, "Mimetismo Social");
        assert.equal(checkMimetismo.permitido, false);
        assert.match(checkMimetismo.motivo, /Não disponível para Astéri/i);
      }
    });

    test("3.8.3 Mahok não pode adquirir Sentidos Apurados", () => {
      const mahok = createCharacter({ raceId: "mahok", classId: "guerreiro", level: 1 });
      const res = validarAquisicaoHabilidade(mahok, "Sentidos Apurados");
      assert.equal(res.permitido, false);
      assert.match(res.motivo, /Não disponível para Mahok/i);
    });

    test("3.8.4 Teurgia: bloqueada sem idioma exótico, liberada se falar Arkadis (ou outro da lista)", () => {
      const semIdioma = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 });
      semIdioma.system.details.idiomas = "Burguês Tebryniano, Caint";

      const resSem = validarAquisicaoHabilidade(semIdioma, "Teurgia");
      assert.equal(resSem.permitido, false);
      assert.match(resSem.motivo, /Requer falar um destes idiomas/i);

      // Liberada se falar Arkadis
      const comArkadis = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 });
      comArkadis.system.details.idiomas = "Burguês Tebryniano, Arkadis";
      const resArkadis = validarAquisicaoHabilidade(comArkadis, "Teurgia");
      assert.equal(resArkadis.permitido, true);

      // Liberada se falar Track'kar'a
      const comTrack = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 });
      comTrack.system.details.idiomas = "Track'kar'a";
      const resTrack = validarAquisicaoHabilidade(comTrack, "Teurgia");
      assert.equal(resTrack.permitido, true);
    });

    test("3.8.5 Humano pode adquirir todas as habilidades gerais canônicas", () => {
      const humano = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "forca",
        level: 1,
      });
      humano.system.details.idiomas = "Burguês Tebryniano, Arkadis";

      const habsGerais = [
        "Atletismo", "Recursos", "Fúria de Batalha", "Sentidos Apurados",
        "Intuição", "Força Heróica", "Agilidade Heróica", "Inteligência Heróica",
        "Vontade Heróica", "Nervos de Aço", "Vontade de Ferro", "Mimetismo Social",
        "Apóstata", "Teurgia"
      ];

      for (const hab of habsGerais) {
        const res = validarAquisicaoHabilidade(humano, hab);
        assert.equal(res.permitido, true, `Humano deve poder adquirir ${hab}: ${res.motivo}`);
      }

      // Nanismo isolado: permitido
      assert.equal(validarAquisicaoHabilidade(humano, "Nanismo").permitido, true);
      // Gigantismo isolado: permitido
      assert.equal(validarAquisicaoHabilidade(humano, "Gigantismo").permitido, true);
    });
  });
});
