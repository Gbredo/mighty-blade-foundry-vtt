import test from "node:test";
import assert from "node:assert/strict";

import {
  avaliarRequisitos,
  parseRequisitosTexto,
  validarCaminhoPrestigio,
  CAMINHOS_PRESTIGIO,
  checarMarcoNarrativo,
} from "../module/helpers/requisitos.mjs";

import {
  CANONICAL_CAMINHOS,
  CANONICAL_HABILIDADES,
  CANONICAL_MAGIAS,
} from "../module/data/canonical-packs-data.mjs";

import { createMockActor } from "./test-helper.mjs";

// Utilitários de compêndio
function findCompendioCaminho(nome) {
  return CANONICAL_CAMINHOS.find((c) => c.name.toLowerCase() === nome.toLowerCase());
}

function findCompendioHabilidade(nome) {
  return CANONICAL_HABILIDADES.find((h) => h.name.toLowerCase() === nome.toLowerCase());
}

function findCompendioMagia(nome) {
  return CANONICAL_MAGIAS.find((m) => m.name.toLowerCase() === nome.toLowerCase());
}

test("Subtítulo 14: Validação de Entrada em Caminhos de Prestígio (Classes Avançadas)", async (t) => {

  // =========================================================================
  // Caso 14.1: Caminho Amoque (Exige FOR 6 + qualquer habilidade de Fúria)
  // =========================================================================
  await t.test("Caso 14.1: Caminho Amoque (FOR 6 + qualquer habilidade de Fúria)", async (t1) => {
    const caminhoDoc = findCompendioCaminho("Amoque");
    assert.ok(caminhoDoc, "Amoque deve existir no compêndio canônico");
    assert.match(caminhoDoc.system.requisitos, /for[çc]a\s+6/i, "Deve exigir Força 6");
    assert.match(caminhoDoc.system.requisitos, /f[úu]ria/i, "Deve exigir habilidade de Fúria");

    await t1.test("14.1.1 - Sucesso com FOR 6 e Fúria de Batalha", () => {
      const ator = createMockActor({
        attributes: { forca: 6 },
        items: [{ name: "Fúria de Batalha", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true, "FOR 6 + Fúria de Batalha deve ser aprovado");
      assert.equal(res.falhas.length, 0);
      assert.equal(res.erro, null);
    });

    await t1.test("14.1.2 - Sucesso com FOR 7 (acima do mínimo) e Fúria Bestial", () => {
      const ator = createMockActor({
        attributes: { forca: 7 },
        items: [{ name: "Fúria Bestial", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio("Amoque", ator);
      assert.equal(res.atende, true, "FOR 7 + Fúria Bestial deve ser aprovado");
      assert.equal(res.falhas.length, 0);
    });

    await t1.test("14.1.3 - Sucesso com FOR 6 e Fúria Orc", () => {
      const ator = createMockActor({
        attributes: { forca: 6 },
        items: [{ name: "Fúria Orc", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true, "FOR 6 + Fúria Orc deve ser aprovado");
    });

    await t1.test("14.1.4 - Rejeição estrita com FOR 5 (abaixo de 6) mesmo possuindo Fúria", () => {
      const ator = createMockActor({
        attributes: { forca: 5 },
        items: [{ name: "Fúria de Batalha", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false, "FOR 5 deve ser estritamente rejeitado");
      assert.ok(res.falhas.some((f) => f.includes("Força 6") && f.includes("possui 5")));
      assert.match(res.erro, /Força 6/);
    });

    await t1.test("14.1.5 - Rejeição estrita com FOR 6 mas sem nenhuma habilidade de Fúria", () => {
      const ator = createMockActor({
        attributes: { forca: 6 },
        items: [{ name: "Ataque Poderoso", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false, "Sem Fúria deve ser rejeitado");
      assert.ok(res.falhas.some((f) => f.includes("Fúria") && f.includes("não possui")));
    });

    await t1.test("14.1.6 - Rejeição dupla com FOR 4 e sem habilidade de Fúria", () => {
      const ator = createMockActor({
        attributes: { forca: 4 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2, "Deve detalhar as 2 pendências");
      assert.ok(res.falhas.some((f) => f.includes("Força 6")));
      assert.ok(res.falhas.some((f) => f.includes("Fúria")));
    });

    await t1.test("14.1.7 - Validação via _onCaminhoCreated (Rejeição e Aceitação no Ator)", async () => {
      const atorInvalido = createMockActor({
        attributes: { forca: 5 },
        items: [],
      });
      const itemCaminho = {
        id: "caminho-amoque-1",
        name: "Amoque",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      atorInvalido.items.push(itemCaminho);

      const okInvalido = await atorInvalido._onCaminhoCreated(itemCaminho);
      assert.equal(okInvalido, false, "Deve rejeitar criação de caminho inválido");
      assert.equal(atorInvalido.items.length, 0, "Item inválido deve ser removido da ficha");
      assert.equal(atorInvalido.system.details.caminho, "", "system.details.caminho não deve ser atualizado");

      // Agora herói válido
      const atorValido = createMockActor({
        attributes: { forca: 6 },
        items: [{ name: "Fúria de Batalha", type: "habilidade" }],
      });
      const itemValido = {
        id: "caminho-amoque-2",
        name: "Amoque",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      atorValido.items.push(itemValido);
      const okValido = await atorValido._onCaminhoCreated(itemValido);
      assert.equal(okValido, true, "Deve aceitar criação de caminho válido");
      assert.equal(atorValido.system.details.caminho, "Amoque");
    });
  });

  // =========================================================================
  // Caso 14.2: Caminho Argênteo (Exige INT 5 + Teleporte 1)
  // =========================================================================
  await t.test("Caso 14.2: Caminho Argênteo (INT 5 + Teleporte 1)", async (t2) => {
    const caminhoDoc = findCompendioCaminho("Argênteo");
    assert.ok(caminhoDoc, "Argênteo deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /intelig[êe]ncia\s+5/i);
    assert.match(caminhoDoc.system.requisitos, /teleporte\s+1/i);

    await t2.test("14.2.1 - Sucesso com INT 5 e magia Teleporte 1", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        items: [{ name: "Teleporte 1", type: "magia" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true, "INT 5 + Teleporte 1 deve ser aprovado");
      assert.equal(res.falhas.length, 0);
    });

    await t2.test("14.2.2 - Sucesso com INT 6 e habilidade Teleporte 1", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 6 },
        items: [{ name: "Teleporte 1", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio("Argênteo", ator);
      assert.equal(res.atende, true, "INT 6 + Teleporte 1 deve ser aprovado");
    });

    await t2.test("14.2.3 - Rejeição estrita com INT 4 mesmo com Teleporte 1", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        items: [{ name: "Teleporte 1", type: "magia" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Inteligência 5") && f.includes("possui 4")));
    });

    await t2.test("14.2.4 - Rejeição estrita com INT 5 mas sem Teleporte 1", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        items: [{ name: "Mísseis Mágicos", type: "magia" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Teleporte 1") && f.includes("não possui")));
    });

    await t2.test("14.2.5 - Rejeição dupla com INT 3 e sem Teleporte 1", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 3 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2);
    });

    await t2.test("14.2.6 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        items: [{ name: "Teleporte 1", type: "magia" }],
      });
      const item = {
        id: "c-arg-1",
        name: "Argênteo",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Argênteo");
    });
  });

  // =========================================================================
  // Caso 14.3: Caminho Artífice (Exige INT 5 + Conhecimento Arcano)
  // =========================================================================
  await t.test("Caso 14.3: Caminho Artífice (INT 5 + Conhecimento Arcano)", async (t3) => {
    const caminhoDoc = findCompendioCaminho("Artífice");
    assert.ok(caminhoDoc, "Artífice deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /intelig[êe]ncia\s+5/i);
    assert.match(caminhoDoc.system.requisitos, /conhecimento\s+arcano/i);

    await t3.test("14.3.1 - Sucesso com INT 5 e Conhecimento Arcano", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
      assert.equal(res.falhas.length, 0);
    });

    await t3.test("14.3.2 - Sucesso com INT 7 e Conhecimento Arcano", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 7 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio("Artífice", ator);
      assert.equal(res.atende, true);
    });

    await t3.test("14.3.3 - Rejeição estrita com INT 4 mesmo com Conhecimento Arcano", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Inteligência 5") && f.includes("possui 4")));
    });

    await t3.test("14.3.4 - Rejeição estrita com INT 5 mas sem Conhecimento Arcano", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Conhecimento Arcano") && f.includes("não possui")));
    });

    await t3.test("14.3.5 - Rejeição dupla com INT 2 e sem Conhecimento Arcano", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 2 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2);
    });

    await t3.test("14.3.6 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
      });
      const item = {
        id: "c-art-1",
        name: "Artífice",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Artífice");
    });
  });

  // =========================================================================
  // Caso 14.4: Caminho Assassino (Exige AGI 4 + Ataque Aleijador)
  // =========================================================================
  await t.test("Caso 14.4: Caminho Assassino (AGI 4 + Ataque Aleijador)", async (t4) => {
    const caminhoDoc = findCompendioCaminho("Assassino");
    assert.ok(caminhoDoc, "Assassino deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /agilidade\s+4/i);
    assert.match(caminhoDoc.system.requisitos, /ataque\s+aleijador/i);

    await t4.test("14.4.1 - Sucesso com AGI 4 e Ataque Aleijador", () => {
      const ator = createMockActor({
        attributes: { agilidade: 4 },
        items: [{ name: "Ataque Aleijador", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
      assert.equal(res.falhas.length, 0);
    });

    await t4.test("14.4.2 - Sucesso com AGI 5 e Ataque Aleijador", () => {
      const ator = createMockActor({
        attributes: { agilidade: 5 },
        items: [{ name: "Ataque Aleijador", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio("Assassino", ator);
      assert.equal(res.atende, true);
    });

    await t4.test("14.4.3 - Rejeição estrita com AGI 3 mesmo com Ataque Aleijador", () => {
      const ator = createMockActor({
        attributes: { agilidade: 3 },
        items: [{ name: "Ataque Aleijador", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Agilidade 4") && f.includes("possui 3")));
    });

    await t4.test("14.4.4 - Rejeição estrita com AGI 4 mas sem Ataque Aleijador", () => {
      const ator = createMockActor({
        attributes: { agilidade: 4 },
        items: [{ name: "Ataque Furtivo", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Ataque Aleijador") && f.includes("não possui")));
    });

    await t4.test("14.4.5 - Rejeição dupla com AGI 2 e sem Ataque Aleijador", () => {
      const ator = createMockActor({
        attributes: { agilidade: 2 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2);
    });

    await t4.test("14.4.6 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { agilidade: 4 },
        items: [{ name: "Ataque Aleijador", type: "habilidade" }],
      });
      const item = {
        id: "c-ass-1",
        name: "Assassino",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Assassino");
    });
  });

  // =========================================================================
  // Caso 14.5: Caminho Sanguíneo (VON 5 + Conhecimento Arcano + Por um Fio Sangramento)
  // =========================================================================
  await t.test("Caso 14.5: Caminho Sanguíneo (VON 5 + Conhecimento Arcano + Sangramento Por um Fio)", async (t5) => {
    const caminhoDoc = findCompendioCaminho("Sanguíneo");
    assert.ok(caminhoDoc, "Sanguíneo deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /vontade\s+5/i);
    assert.match(caminhoDoc.system.requisitos, /conhecimento\s+arcano/i);
    assert.match(caminhoDoc.system.requisitos, /(ficar|ficado)\s+por\s+um\s+fio.*sangramento/i);

    await t5.test("14.5.1 - Sucesso com VON 5, Conhecimento Arcano e flag sangramentoPorUmFio", () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
        flags: {
          "mighty-blade": {
            sangramentoPorUmFio: true,
          },
        },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true, "Deve aprovar quando todos os requisitos são cumpridos");
      assert.equal(res.falhas.length, 0);
    });

    await t5.test("14.5.2 - Sucesso com marco registrado em lista de marcos do ator", () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
        flags: {
          "mighty-blade": {
            marcos: ["sangramento-por-um-fio"],
          },
        },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
    });

    await t5.test("14.5.3 - Sucesso com marco registrado via Item embutido", () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        items: [
          { name: "Conhecimento Arcano", type: "habilidade" },
          { name: "Ficou Por um Fio devido a Sangramento", type: "marco" },
        ],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
    });

    await t5.test("14.5.4 - Rejeição estrita com VON 4 mesmo com Conhecimento Arcano e marco", () => {
      const ator = createMockActor({
        attributes: { vontade: 4 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
        flags: { "mighty-blade": { sangramentoPorUmFio: true } },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Vontade 5") && f.includes("possui 4")));
    });

    await t5.test("14.5.5 - Rejeição estrita sem Conhecimento Arcano mesmo com VON 5 e marco", () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        items: [],
        flags: { "mighty-blade": { sangramentoPorUmFio: true } },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Conhecimento Arcano") && f.includes("não possui")));
    });

    await t5.test("14.5.6 - Rejeição estrita sem marco de Sangramento (em validação estrita)", () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
        flags: {}, // Sem marcos
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false, "Validação estrita deve reprovar sem o marco registrado");
      assert.ok(
        res.falhas.some((f) => f.includes("Sangramento") && f.includes("não registrado na ficha")),
        "Mensagem de erro deve detalhar que o marco narrativo não foi registrado"
      );
    });

    await t5.test("14.5.7 - Rejeição tripla quando VON < 5, sem Conhecimento Arcano e sem marco", () => {
      const ator = createMockActor({
        attributes: { vontade: 3 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 3, "Deve listar todas as 3 falhas");
    });

    await t5.test("14.5.8 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        items: [{ name: "Conhecimento Arcano", type: "habilidade" }],
        flags: { "mighty-blade": { sangramentoPorUmFio: true } },
      });
      const item = {
        id: "c-sang-1",
        name: "Sanguíneo",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Sanguíneo");
    });
  });

  // =========================================================================
  // Caso 14.6: Caminho Estrige (Exige INT 4 + ter destruído criatura sobrenatural)
  // =========================================================================
  await t.test("Caso 14.6: Caminho Estrige (INT 4 + ter destruído criatura sobrenatural)", async (t6) => {
    const caminhoDoc = findCompendioCaminho("Estrige");
    assert.ok(caminhoDoc, "Estrige deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /intelig[êe]ncia\s+4/i);
    assert.match(caminhoDoc.system.requisitos, /sobrenatural/i);

    await t6.test("14.6.1 - Sucesso com INT 4 e flag destruiuSobrenatural", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        flags: { "mighty-blade": { destruiuSobrenatural: true } },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
      assert.equal(res.falhas.length, 0);
    });

    await t6.test("14.6.2 - Sucesso com flag matouSobrenatural ou marcos: ['sobrenatural']", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 5 },
        flags: { "mighty-blade": { matouSobrenatural: true } },
      });
      const res = validarCaminhoPrestigio("Estrige", ator);
      assert.equal(res.atende, true);
    });

    await t6.test("14.6.3 - Sucesso com Item de marco sobrenatural", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        items: [{ name: "Destruiu Criatura Sobrenatural", type: "marco" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
    });

    await t6.test("14.6.4 - Sucesso com formulação do prompt 'INT 4 + ter destruído 1 criatura sobrenatural'", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        flags: { "mighty-blade": { destruiuSobrenatural: true } },
      });
      const res = avaliarRequisitos("INT 4 + ter destruído 1 criatura sobrenatural", ator, { modoEstrito: true });
      assert.equal(res.atende, true);
      assert.equal(res.falhas.length, 0);
    });

    await t6.test("14.6.5 - Rejeição estrita com INT 3 mesmo tendo destruído sobrenatural", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 3 },
        flags: { "mighty-blade": { destruiuSobrenatural: true } },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Inteligência 4") && f.includes("possui 3")));
    });

    await t6.test("14.6.6 - Rejeição estrita com INT 4 mas SEM marco sobrenatural (modo estrito)", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        flags: {},
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(
        res.falhas.some((f) => f.includes("sobrenatural") && f.includes("não registrado na ficha")),
        "Deve acusar falta do marco sobrenatural"
      );
    });

    await t6.test("14.6.7 - Rejeição dupla com INT 2 e sem marco", () => {
      const ator = createMockActor({
        attributes: { inteligencia: 2 },
        flags: {},
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2);
    });

    await t6.test("14.6.8 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { inteligencia: 4 },
        flags: { "mighty-blade": { destruiuSobrenatural: true } },
      });
      const item = {
        id: "c-est-1",
        name: "Estrige",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Estrige");
    });
  });

  // =========================================================================
  // Caso 14.7: Caminho Tohunga (Exige VON 3 + Artesão)
  // =========================================================================
  await t.test("Caso 14.7: Caminho Tohunga (VON 3 + Artesão)", async (t7) => {
    const caminhoDoc = findCompendioCaminho("Tohunga");
    assert.ok(caminhoDoc, "Tohunga deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /vontade\s+3/i);
    assert.match(caminhoDoc.system.requisitos, /artes[ãa]o/i);

    await t7.test("14.7.1 - Sucesso com VON 3 e antecedente Artesão", () => {
      const ator = createMockActor({
        attributes: { vontade: 3 },
        details: { antecedente: "Artesão" },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true, "VON 3 + Antecedente Artesão deve ser aprovado");
      assert.equal(res.falhas.length, 0);
    });

    await t7.test("14.7.2 - Sucesso com VON 3 e Item Artesão no inventário", () => {
      const ator = createMockActor({
        attributes: { vontade: 3 },
        items: [{ name: "Artesão", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio("Tohunga", ator);
      assert.equal(res.atende, true, "VON 3 + Item Artesão deve ser aprovado");
    });

    await t7.test("14.7.3 - Sucesso com VON 5 e Artesão", () => {
      const ator = createMockActor({
        attributes: { vontade: 5 },
        details: { antecedente: "Artesão" },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true);
    });

    await t7.test("14.7.4 - Rejeição estrita com VON 2 mesmo sendo Artesão", () => {
      const ator = createMockActor({
        attributes: { vontade: 2 },
        details: { antecedente: "Artesão" },
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Vontade 3") && f.includes("possui 2")));
    });

    await t7.test("14.7.5 - Rejeição estrita com VON 3 mas sem Artesão", () => {
      const ator = createMockActor({
        attributes: { vontade: 3 },
        details: { antecedente: "Soldado" },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Artesão") && f.includes("não possui")));
    });

    await t7.test("14.7.6 - Rejeição dupla com VON 1 e sem Artesão", () => {
      const ator = createMockActor({
        attributes: { vontade: 1 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2);
    });

    await t7.test("14.7.7 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { vontade: 3 },
        details: { antecedente: "Artesão" },
      });
      const item = {
        id: "c-toh-1",
        name: "Tohunga",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Tohunga");
    });
  });

  // =========================================================================
  // Caso 14.8: Caminho Lanceiro (Exige FOR 3 + Sem Escapatória)
  // =========================================================================
  await t.test("Caso 14.8: Caminho Lanceiro (FOR 3 + Sem Escapatória)", async (t8) => {
    const caminhoDoc = findCompendioCaminho("Lanceiro");
    assert.ok(caminhoDoc, "Lanceiro deve existir no compêndio");
    assert.match(caminhoDoc.system.requisitos, /for[çc]a\s+3/i);
    assert.match(caminhoDoc.system.requisitos, /sem\s+escapat[óo]ria/i);

    await t8.test("14.8.1 - Sucesso com FOR 3 e Sem Escapatória", () => {
      const ator = createMockActor({
        attributes: { forca: 3 },
        items: [{ name: "Sem Escapatória", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, true, "FOR 3 + Sem Escapatória deve ser aprovado");
      assert.equal(res.falhas.length, 0);
    });

    await t8.test("14.8.2 - Sucesso com FOR 5 e Sem Escapatória", () => {
      const ator = createMockActor({
        attributes: { forca: 5 },
        items: [{ name: "Sem Escapatória", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio("Lanceiro", ator);
      assert.equal(res.atende, true);
    });

    await t8.test("14.8.3 - Rejeição estrita com FOR 2 mesmo com Sem Escapatória", () => {
      const ator = createMockActor({
        attributes: { forca: 2 },
        items: [{ name: "Sem Escapatória", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Força 3") && f.includes("possui 2")));
    });

    await t8.test("14.8.4 - Rejeição estrita com FOR 3 mas sem Sem Escapatória", () => {
      const ator = createMockActor({
        attributes: { forca: 3 },
        items: [{ name: "Mestre de Armas 1", type: "habilidade" }],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.ok(res.falhas.some((f) => f.includes("Sem Escapatória") && f.includes("não possui")));
    });

    await t8.test("14.8.5 - Rejeição dupla com FOR 1 e sem Sem Escapatória", () => {
      const ator = createMockActor({
        attributes: { forca: 1 },
        items: [],
      });
      const res = validarCaminhoPrestigio(caminhoDoc, ator);
      assert.equal(res.atende, false);
      assert.equal(res.falhas.length, 2);
    });

    await t8.test("14.8.6 - Adoção via _onCaminhoCreated", async () => {
      const ator = createMockActor({
        attributes: { forca: 3 },
        items: [{ name: "Sem Escapatória", type: "habilidade" }],
      });
      const item = {
        id: "c-lan-1",
        name: "Lanceiro",
        type: "caminho",
        system: { requisitos: caminhoDoc.system.requisitos },
      };
      ator.items.push(item);
      const ok = await ator._onCaminhoCreated(item);
      assert.equal(ok, true);
      assert.equal(ator.system.details.caminho, "Lanceiro");
    });
  });

  // =========================================================================
  // Caso 14.9: Regras Globais, Exclusividade e Diagnóstico de Erros
  // =========================================================================
  await t.test("Caso 14.9: Regras Globais de Caminhos de Prestígio", async (t9) => {
    await t9.test("14.9.1 - Tabela canônica CAMINHOS_PRESTIGIO contém os 8 caminhos mapeados", () => {
      const chaves = Object.keys(CAMINHOS_PRESTIGIO);
      assert.equal(chaves.length, 8, "Devem existir exatamente 8 caminhos mapeados");
      const esperados = ["amoque", "argenteo", "artifice", "assassino", "sanguineo", "estrige", "tohunga", "lanceiro"];
      for (const esp of esperados) {
        assert.ok(CAMINHOS_PRESTIGIO[esp], `Caminho '${esp}' deve estar presente em CAMINHOS_PRESTIGIO`);
        assert.ok(CAMINHOS_PRESTIGIO[esp].nome);
        assert.ok(CAMINHOS_PRESTIGIO[esp].requisitos);
      }
    });

    await t9.test("14.9.2 - parseRequisitosTexto decompõe adequadamente requisitos com '+' ou ','", () => {
      const req1 = parseRequisitosTexto("FOR 6 + qualquer habilidade de Fúria");
      assert.deepEqual(req1, ["FOR 6", "qualquer habilidade de Fúria"]);

      const req2 = parseRequisitosTexto("Força 6, Uma habilidade de Fúria qualquer.");
      assert.deepEqual(req2, ["Força 6", "Uma habilidade de Fúria qualquer"]);

      const req3 = parseRequisitosTexto("VON 5 + Conhecimento Arcano + ter ficado Por um Fio devido a Sangramento");
      assert.deepEqual(req3, ["VON 5", "Conhecimento Arcano", "ter ficado Por um Fio devido a Sangramento"]);
    });

    await t9.test("14.9.3 - Exclusividade de Caminhos: Adotar novo caminho remove o anterior", async () => {
      const ator = createMockActor({
        attributes: { forca: 6, agilidade: 4 },
        items: [
          { name: "Fúria de Batalha", type: "habilidade" },
          { name: "Ataque Aleijador", type: "habilidade" },
        ],
      });

      // 1. Adota Amoque
      const itemAmoque = {
        id: "cam-1",
        name: "Amoque",
        type: "caminho",
        system: { requisitos: CAMINHOS_PRESTIGIO.amoque.requisitos },
      };
      ator.items.push(itemAmoque);
      await ator._onCaminhoCreated(itemAmoque);
      assert.equal(ator.system.details.caminho, "Amoque");

      // 2. Adota Assassino
      const itemAssassino = {
        id: "cam-2",
        name: "Assassino",
        type: "caminho",
        system: { requisitos: CAMINHOS_PRESTIGIO.assassino.requisitos },
      };
      ator.items.push(itemAssassino);
      await ator._onCaminhoCreated(itemAssassino);

      assert.equal(ator.system.details.caminho, "Assassino");
      // O anterior deve ter sido deletado
      const caminhosAtuais = ator.items.filter((i) => i.type === "caminho");
      assert.equal(caminhosAtuais.length, 1, "Apenas 1 caminho deve permanecer ativo");
      assert.equal(caminhosAtuais[0].name, "Assassino");
    });

    await t9.test("14.9.4 - Remoção de caminho via _onCaminhoDeleted limpa system.details.caminho", async () => {
      const ator = createMockActor({
        details: { caminho: "Lanceiro" },
        items: [],
      });
      const itemLanceiro = { id: "cam-lan", name: "Lanceiro", type: "caminho" };
      await ator._onCaminhoDeleted(itemLanceiro);
      assert.equal(ator.system.details.caminho, "", "Deve limpar o caminho após deleção");
    });

    await t9.test("14.9.5 - Formatação das mensagens de erro e diagnóstico", () => {
      const ator = createMockActor({ attributes: { forca: 2 }, items: [] });
      const res = validarCaminhoPrestigio("Lanceiro", ator);
      assert.equal(res.atende, false);
      assert.ok(res.erro.includes("Pré-requisitos não atendidos para o Caminho \"Lanceiro\":"));
      assert.ok(res.erro.includes("• Força 3 (Você possui 2 (Requer 3))"));
      assert.ok(res.erro.includes("• Sem Escapatória (Requer Sem Escapatória (não possui))"));
    });

    await t9.test("14.9.6 - Tratamento seguro para parâmetros inválidos ou nulos", () => {
      assert.equal(validarCaminhoPrestigio(null, null).atende, false);
      assert.equal(validarCaminhoPrestigio("Amoque", null).atende, false);
      const ator = createMockActor();
      assert.equal(validarCaminhoPrestigio(null, ator).atende, false);
    });
  });
});
