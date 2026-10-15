/**
 * Suíte de Testes Automatizados - Subtítulo 28: Estatísticas de Objetos Inanimados e Alvos Específicos
 * Mighty Blade 3ª Edição.
 *
 * Casos de Teste Cobertos:
 * 1. calcularDefesaObjeto(objeto, opcoes):
 *    - Defesa Base de Objetos Inanimados conforme porte/tamanho:
 *      * Pequeno (até 1m): Defesa 6.
 *      * Médio (até 2m): Defesa 5.
 *      * Grande (até 4m): Defesa 4.
 *      * Gigante / Colossal (> 4m): Defesa 3.
 *    - Modificador de Objetos em Movimento:
 *      * Se o objeto estiver rolando, caindo ou em movimento (`emMovimento: true`),
 *        soma-se +1d6 (ou rolagem configurada/média) ao valor de Defesa do objeto.
 *
 * 2. calcularDefesaAlvoEspecifico(defensor, tipoAlvoEspecifico, opcoes):
 *    - Ataque Localizado / Alvo Específico:
 *      * Visar membros específicos, garganta, armas empunhadas ou amuletos equipados
 *        adiciona +4 na Defesa do alvo (consistente com manobras-combate.mjs).
 */

import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
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
} from "./test-helper.mjs";

describe("Subtítulo 28: Estatísticas de Objetos Inanimados e Alvos Específicos (Mighty Blade 3e)", () => {
  /* ------------------------------------------------------------------------- */
  /* 1. CONSTANTES CANÔNICAS DO SISTEMA                                        */
  /* ------------------------------------------------------------------------- */
  describe("1. Constantes Canônicas", () => {
    it("1.1 - Valores canônicos de Defesa por porte de objeto inanimado", () => {
      assert.equal(DEFESA_OBJETO_PEQUENO, 6, "Objeto pequeno tem Defesa base 6");
      assert.equal(DEFESA_OBJETO_MEDIO, 5, "Objeto médio tem Defesa base 5");
      assert.equal(DEFESA_OBJETO_GRANDE, 4, "Objeto grande tem Defesa base 4");
      assert.equal(DEFESA_OBJETO_GIGANTE, 3, "Objeto gigante tem Defesa base 3");
      assert.equal(DEFESA_OBJETO_COLOSSAL, 3, "Objeto colossal tem Defesa base 3");
    });

    it("1.2 - Limites canônicos de dimensões em metros", () => {
      assert.equal(LIMITES_TAMANHO_OBJETO_METROS.PEQUENO_ATE, 1.0, "Pequeno é até 1m");
      assert.equal(LIMITES_TAMANHO_OBJETO_METROS.MEDIO_ATE, 2.0, "Médio é até 2m");
      assert.equal(LIMITES_TAMANHO_OBJETO_METROS.GRANDE_ATE, 4.0, "Grande é até 4m");
    });

    it("1.3 - Constante de Alvo Específico deve ser exatamente +4", () => {
      assert.equal(MODIFICADOR_DEFESA_ALVO_ESPECIFICO, 4, "Alvo específico confere +4 de Defesa");
      assert.equal(FORMULA_MOVIMENTO_OBJETO, "+1d6", "Fórmula de movimento é +1d6");
      assert.equal(MODIFICADOR_MOVIMENTO_PADRAO_MEDIA, 3, "Média canônica de 1d6 é 3");
    });

    it("1.4 - Lista de alvos específicos canônicos contém itens essenciais", () => {
      assert.ok(ALVOS_ESPECIFICOS_CANONICOS.includes("membro"), "Deve incluir membro");
      assert.ok(ALVOS_ESPECIFICOS_CANONICOS.includes("garganta"), "Deve incluir garganta");
      assert.ok(ALVOS_ESPECIFICOS_CANONICOS.includes("arma_empunhada"), "Deve incluir arma empunhada");
      assert.ok(ALVOS_ESPECIFICOS_CANONICOS.includes("amuleto_equipado"), "Deve incluir amuleto equipado");
    });
  });

  /* ------------------------------------------------------------------------- */
  /* 2. DEFESA BASE DE OBJETOS INANIMADOS POR PORTE / TAMANHO                 */
  /* ------------------------------------------------------------------------- */
  describe("2. Defesa Base de Objetos Inanimados por Porte / Tamanho", () => {
    it("2.1 - Objeto Pequeno (até 1m) possui Defesa 6", () => {
      // Por identificador textual
      const resTexto = calcularDefesaObjeto("pequeno");
      assert.equal(resTexto.defesaBase, 6);
      assert.equal(resTexto.defesaTotal, 6);
      assert.equal(resTexto.porte, "pequeno");
      assert.equal(resTexto.emMovimento, false);

      // Por dimensão exata de 1m
      const res1m = calcularDefesaObjeto(1.0);
      assert.equal(res1m.defesaBase, 6);
      assert.equal(res1m.porte, "pequeno");

      // Por dimensão menor que 1m (ex: 0.4m)
      const res04m = calcularDefesaObjeto(0.4);
      assert.equal(res04m.defesaBase, 6);
      assert.equal(res04m.porte, "pequeno");

      // Por objeto com propriedade de tamanho
      const resObj = calcularDefesaObjeto({ nome: "Caixa Pequena", tamanho: "pequeno" });
      assert.equal(resObj.defesaBase, 6);

      // Por objeto com metros numéricos
      const resObjMetros = calcularDefesaObjeto({ nome: "Vaso de Cristal", metros: 0.8 });
      assert.equal(resObjMetros.defesaBase, 6);
    });

    it("2.2 - Objeto Médio (até 2m) possui Defesa 5", () => {
      // Por identificador textual
      const resTexto = calcularDefesaObjeto("medio");
      assert.equal(resTexto.defesaBase, 5);
      assert.equal(resTexto.defesaTotal, 5);
      assert.equal(resTexto.porte, "medio");

      // Com acento "médio"
      const resAcento = calcularDefesaObjeto("médio");
      assert.equal(resAcento.defesaBase, 5);

      // Por dimensão acima de 1m até 2m (ex: 1.2m, 2.0m)
      const res12m = calcularDefesaObjeto(1.2);
      assert.equal(res12m.defesaBase, 5);
      assert.equal(res12m.porte, "medio");

      const res2m = calcularDefesaObjeto(2.0);
      assert.equal(res2m.defesaBase, 5);
      assert.equal(res2m.porte, "medio");

      // Por objeto Foundry com system.tamanho
      const resObj = calcularDefesaObjeto({
        name: "Porta de Madeira",
        system: { tamanho: "medio" },
      });
      assert.equal(resObj.defesaBase, 5);
    });

    it("2.3 - Objeto Grande (até 4m) possui Defesa 4", () => {
      // Por identificador textual
      const resTexto = calcularDefesaObjeto("grande");
      assert.equal(resTexto.defesaBase, 4);
      assert.equal(resTexto.defesaTotal, 4);
      assert.equal(resTexto.porte, "grande");

      // Por dimensão acima de 2m até 4m (ex: 2.5m, 4.0m)
      const res25m = calcularDefesaObjeto(2.5);
      assert.equal(res25m.defesaBase, 4);
      assert.equal(res25m.porte, "grande");

      const res4m = calcularDefesaObjeto(4.0);
      assert.equal(res4m.defesaBase, 4);
      assert.equal(res4m.porte, "grande");

      // Por objeto com dimensoes
      const resObj = calcularDefesaObjeto({
        name: "Carroça de Suprimentos",
        dimensoes: { altura: 3.2 },
      });
      assert.equal(resObj.defesaBase, 4);
    });

    it("2.4 - Objeto Gigante / Colossal (> 4m) possui Defesa 3", () => {
      // Por identificador "gigante"
      const resGigante = calcularDefesaObjeto("gigante");
      assert.equal(resGigante.defesaBase, 3);
      assert.equal(resGigante.porte, "gigante");

      // Por identificador "colossal"
      const resColossal = calcularDefesaObjeto("colossal");
      assert.equal(resColossal.defesaBase, 3);

      // Por identificador "enorme"
      const resEnorme = calcularDefesaObjeto("enorme");
      assert.equal(resEnorme.defesaBase, 3);

      // Por dimensão acima de 4m (ex: 4.1m, 8m, 15m)
      const res41m = calcularDefesaObjeto(4.1);
      assert.equal(res41m.defesaBase, 3);
      assert.equal(res41m.porte, "gigante");

      const res15m = calcularDefesaObjeto(15.0);
      assert.equal(res15m.defesaBase, 3);
      assert.equal(res15m.porte, "gigante");

      // Por objeto grande estrutura
      const resTorre = calcularDefesaObjeto({ name: "Torre de Menagem", metros: 12 });
      assert.equal(resTorre.defesaBase, 3);
    });

    it("2.5 - Classificação padrão para objeto sem tamanho especificado assume Médio (5)", () => {
      const res = calcularDefesaObjeto({});
      assert.equal(res.porte, "medio");
      assert.equal(res.defesaBase, 5);
      assert.equal(res.defesaTotal, 5);
    });

    it("2.6 - Função classificarPorteObjeto classifica corretamente faixas e textos", () => {
      assert.equal(classificarPorteObjeto(0.9).porte, "pequeno");
      assert.equal(classificarPorteObjeto(1.0).porte, "pequeno");
      assert.equal(classificarPorteObjeto(1.01).porte, "medio");
      assert.equal(classificarPorteObjeto(2.0).porte, "medio");
      assert.equal(classificarPorteObjeto(2.01).porte, "grande");
      assert.equal(classificarPorteObjeto(4.0).porte, "grande");
      assert.equal(classificarPorteObjeto(4.01).porte, "gigante");
      assert.equal(classificarPorteObjeto("2.5m").porte, "grande");
      assert.equal(classificarPorteObjeto("0.5 metros").porte, "pequeno");
    });
  });

  /* ------------------------------------------------------------------------- */
  /* 3. MODIFICADOR DE OBJETOS EM MOVIMENTO (+1d6)                             */
  /* ------------------------------------------------------------------------- */
  describe("3. Modificador de Objetos em Movimento (+1d6)", () => {
    it("3.1 - Objeto estático não recebe bônus de movimento", () => {
      const res = calcularDefesaObjeto("medio", { emMovimento: false });
      assert.equal(res.emMovimento, false);
      assert.equal(res.modificadorMovimento, 0);
      assert.equal(res.formulaMovimento, "+0");
      assert.equal(res.defesaTotal, 5);
    });

    it("3.2 - Objeto em movimento com valor pré-determinado soma exatamente o valor", () => {
      // Objeto Pequeno (6) + movimento 4 = 10
      const resPequeno = calcularDefesaObjeto("pequeno", {
        emMovimento: true,
        valorMovimento: 4,
      });
      assert.equal(resPequeno.defesaBase, 6);
      assert.equal(resPequeno.emMovimento, true);
      assert.equal(resPequeno.modificadorMovimento, 4);
      assert.equal(resPequeno.defesaTotal, 10);
      assert.equal(resPequeno.formulaMovimento, "+1d6");

      // Objeto Médio (5) + movimento 1 = 6
      const resMedio = calcularDefesaObjeto("medio", {
        emMovimento: true,
        valorMovimento: 1,
      });
      assert.equal(resMedio.defesaBase, 5);
      assert.equal(resMedio.defesaTotal, 6);

      // Objeto Grande (4) + movimento 6 = 10
      const resGrande = calcularDefesaObjeto("grande", {
        emMovimento: true,
        valorMovimento: 6,
      });
      assert.equal(resGrande.defesaBase, 4);
      assert.equal(resGrande.defesaTotal, 10);

      // Objeto Gigante (3) + movimento 5 = 8
      const resGigante = calcularDefesaObjeto("gigante", {
        emMovimento: true,
        valorMovimento: 5,
      });
      assert.equal(resGigante.defesaBase, 3);
      assert.equal(resGigante.defesaTotal, 8);
    });

    it("3.3 - Reconhece flags 'rolando' e 'caindo' como em movimento", () => {
      // Barril rolando
      const barrilRolando = calcularDefesaObjeto("medio", { rolando: true, valorMovimento: 3 });
      assert.equal(barrilRolando.emMovimento, true);
      assert.equal(barrilRolando.defesaTotal, 8); // 5 + 3

      // Rocha caindo
      const rochaCaindo = calcularDefesaObjeto("grande", { caindo: true, valorMovimento: 2 });
      assert.equal(rochaCaindo.emMovimento, true);
      assert.equal(rochaCaindo.defesaTotal, 6); // 4 + 2

      // No próprio objeto
      const objetoComFlag = calcularDefesaObjeto({ tamanho: "pequeno", emMovimento: true }, { valorMovimento: 4 });
      assert.equal(objetoComFlag.emMovimento, true);
      assert.equal(objetoComFlag.defesaTotal, 10);
    });

    it("3.4 - Suporta opção usarMedia: true somando a média canônica (+3)", () => {
      const res = calcularDefesaObjeto("medio", { emMovimento: true, usarMedia: true });
      assert.equal(res.emMovimento, true);
      assert.equal(res.modificadorMovimento, 3);
      assert.equal(res.defesaTotal, 8); // 5 + 3 = 8
    });

    it("3.5 - Suporta rolagem personalizada via rolagemFn", () => {
      let chamadas = 0;
      const fnCustom = () => {
        chamadas++;
        return 5;
      };

      const res = calcularDefesaObjeto("grande", { emMovimento: true, rolagemFn: fnCustom });
      assert.equal(chamadas, 1);
      assert.equal(res.modificadorMovimento, 5);
      assert.equal(res.defesaTotal, 9); // 4 + 5 = 9
    });

    it("3.6 - Rolagem padrão 1d6 gera modificador entre 1 e 6", () => {
      for (let i = 0; i < 20; i++) {
        const res = calcularDefesaObjeto("pequeno", { emMovimento: true });
        assert.equal(res.defesaBase, 6);
        assert.ok(res.modificadorMovimento >= 1 && res.modificadorMovimento <= 6);
        assert.equal(res.defesaTotal, 6 + res.modificadorMovimento);
        assert.ok(res.defesaTotal >= 7 && res.defesaTotal <= 12);
      }
    });
  });

  /* ------------------------------------------------------------------------- */
  /* 4. ALVO ESPECÍFICO / ATAQUE LOCALIZADO (+4 NA DEFESA)                     */
  /* ------------------------------------------------------------------------- */
  describe("4. Alvo Específico / Ataque Localizado (calcularDefesaAlvoEspecifico)", () => {
    it("4.1 - Visar membros específicos adiciona exatamente +4 na Defesa do defensor", () => {
      const defensor = createMockActor({
        attributes: { forca: 6, agilidade: 4 }, // Defesa base 11 (Bloqueio 11, Esquiva 9)
      });

      const res = calcularDefesaAlvoEspecifico(defensor, "membro específico");

      assert.equal(res.valido, true);
      assert.equal(res.bonusDefesa, 4);
      assert.equal(res.modificadorDefesa, 4);
      assert.equal(res.defesaOriginal, 11);
      assert.equal(res.defesaModificada, 15); // 11 + 4
      assert.equal(res.defesaFinal, 15);
      assert.equal(res.bloqueioModificado, 15); // 11 + 4
      assert.equal(res.esquivaModificada, 13); // 9 + 4
    });

    it("4.2 - Visar garganta adiciona +4 na Defesa", () => {
      const res = calcularDefesaAlvoEspecifico(12, "garganta");

      assert.equal(res.defesaOriginal, 12);
      assert.equal(res.bonusDefesa, 4);
      assert.equal(res.defesaModificada, 16);
      assert.equal(res.tipoAlvoEspecifico, "garganta");
    });

    it("4.3 - Visar armas empunhadas adiciona +4 na Defesa", () => {
      const defensor = createMockActor({
        attributes: { forca: 4, agilidade: 6 }, // Esquiva 11 (5 + 6), Bloqueio 9 (5 + 4) -> Defesa 11
      });

      const res = calcularDefesaAlvoEspecifico(defensor, "armas empunhadas");

      assert.equal(res.bonusDefesa, 4);
      assert.equal(res.defesaOriginal, 11);
      assert.equal(res.defesaModificada, 15);
      assert.equal(res.tipoAlvoEspecifico, "armas empunhadas");
    });

    it("4.4 - Visar amuletos equipados adiciona +4 na Defesa", () => {
      const res = calcularDefesaAlvoEspecifico(10, "amuletos equipados");

      assert.equal(res.defesaOriginal, 10);
      assert.equal(res.bonusDefesa, 4);
      assert.equal(res.defesaModificada, 14);
      assert.equal(res.tipoAlvoEspecifico, "amuletos equipados");
    });

    it("4.5 - Alvo específico visando parte de um objeto inanimado calcula defesa base + 4", () => {
      // Visar trinco de uma porta média (Defesa 5) -> 5 + 4 = 9
      const porta = { tamanho: "medio", nome: "Porta de Carvalho" };
      const resPorta = calcularDefesaAlvoEspecifico(porta, "trinco");

      assert.equal(resPorta.defesaOriginal, 5);
      assert.equal(resPorta.bonusDefesa, 4);
      assert.equal(resPorta.defesaModificada, 9);

      // Visar ponto fraco de objeto pequeno (Defesa 6) -> 6 + 4 = 10
      const cofre = { tamanho: "pequeno", nome: "Cofre" };
      const resCofre = calcularDefesaAlvoEspecifico(cofre, "fechadura");

      assert.equal(resCofre.defesaOriginal, 6);
      assert.equal(resCofre.defesaModificada, 10);
    });

    it("4.6 - Objeto inanimado em movimento com alvo específico soma ambos os modificadores", () => {
      // Objeto pequeno (6) em movimento (média 3) = Defesa 9. Com alvo específico (+4) = 13.
      const objetoEmMovimento = {
        tamanho: "pequeno",
        emMovimento: true,
      };

      const res = calcularDefesaAlvoEspecifico(objetoEmMovimento, "engrenagem", {
        valorMovimento: 3,
      });

      assert.equal(res.defesaOriginal, 9); // 6 + 3
      assert.equal(res.bonusDefesa, 4);
      assert.equal(res.defesaModificada, 13); // 9 + 4
    });

    it("4.7 - Chamada direta através do método createMockActor.calcularDefesaAlvoEspecifico", () => {
      const ator = createMockActor({
        attributes: { forca: 6, agilidade: 5 }, // Bloqueio 11 (5 + 6) -> Defesa 11
      });

      const res = ator.calcularDefesaAlvoEspecifico("garganta");
      assert.equal(res.defesaOriginal, 11);
      assert.equal(res.defesaModificada, 15);
      assert.equal(res.bonusDefesa, 4);
    });

    it("4.8 - Suporta modificador customizado caso haja habilidade especial", () => {
      const res = calcularDefesaAlvoEspecifico(10, "olho", { modificadorCustomizado: 6 });
      assert.equal(res.bonusDefesa, 6);
      assert.equal(res.defesaModificada, 16);
    });
  });
});
