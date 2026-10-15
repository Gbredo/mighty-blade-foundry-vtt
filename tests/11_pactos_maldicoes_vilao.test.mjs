/**
 * Suíte de Testes Automatizados - Subtítulo 11: Pactos, Maldições e Efeitos Colaterais (Guia do Vilão)
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos Canônicos Cobertos:
 * - Caso 50: Pacto da Loucura — Ampliação de Determinação (+2), Imunidade a Medo e Efeitos Mentais,
 *   Redução de Inteligência (-1 fixo sem perda de idiomas) e Instintos Básicos em INT <= 1.
 * - Caso 51: Pacto da Escuridão — Visão Sobrenatural sem Olhos e na Escuridão,
 *   Imunidade a Ilusões/Invisibilidade e Inaptidão Crítica sob Luz Solar Direta.
 * - Caso 52: Pacto da Pestilência — Falha Automática em Infecção e Resistência a Sintomas,
 *   Imunidade aos Efeitos Clínicos, Vetor Ativo de Contágio e Efeito Colateral de Purificação (Purgar/Antídoto).
 * - Caso 53: Pacto da Tirania — Teste de Vontade contra Determinação do Cultista para atacá-lo,
 *   Penalidade no Ataque (-Vontade do atacante) e Imunidade de Criaturas Imunes a Efeitos Mentais (Pacto da Loucura).
 * - Caso 54: Habilidade Virulência (Caminho Cultista) — Supressão da Imunidade Biológica de Alvos ao Redor
 *   (Raio = Determinação em metros; Testes Inaptos contra Doenças e Venenos; Exclusão de Construtos/Mortos-Vivos).
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  aplicarEfeitosPacto,
  isImuneMedoOuMental,
  verificarInaptidaoLuzSolar,
  testarInfeccaoDoenca,
  aplicarCuraOuPurificacao,
  avaliarAtaqueContraTirania,
  aplicarVirulencia,
  testarResistenciaDoencaOuVeneno,
  PACTOS_CANONICOS,
  normalizarPacto,
} from "./test-helper.mjs";

// ============================================================================
// CASO 50: PACTO DA LOUCURA (O INOMINÁVEL)
// ============================================================================
test("Caso 50: Pacto da Loucura (O Inominável)", async (t) => {
  await t.test("50.1 - Ampliação de Determinação (+2 fixo na Determinação)", () => {
    const cultista = createMockActor({
      name: "Cultista da Loucura",
      attributes: {
        vontade: { base: 4, value: 4 },
        inteligencia: { base: 3, value: 3 },
      },
    });

    assert.equal(cultista.system.defesas.determinacao.value, 4, "Determinação inicial deve ser 4 (Vontade 4)");

    const res = aplicarEfeitosPacto("Pacto da Loucura", cultista);
    assert.equal(res.sucesso, true);
    assert.equal(res.bonusDeterminacao, 2, "Bônus deve ser +2");
    assert.equal(cultista.system.defesas.determinacao.value, 6, "Determinação com Pacto da Loucura deve ser 6 (4 + 2)");
  });

  await t.test("50.2 - Redução fixa de Inteligência (-1) com preservação estrita de idiomas", () => {
    const cultista = createMockActor({
      name: "Arquivista Herege",
      attributes: {
        inteligencia: { base: 4, value: 4 },
        vontade: { base: 3, value: 3 },
      },
      details: {
        idiomas: "Comum, Valiriano, Ctônico",
      },
    });

    const res = aplicarEfeitosPacto("Pacto da Loucura", cultista);
    assert.equal(res.inteligenciaFinal, 3, "Inteligência deve ter sido reduzida de 4 para 3 (-1 fixo)");
    assert.equal(cultista.system.attributes.inteligencia.value, 3);
    assert.equal(
      cultista.system.details.idiomas,
      "Comum, Valiriano, Ctônico",
      "Não deve perder idiomas conhecidos no processo"
    );
  });

  await t.test("50.3 - Instintos Básicos quando Inteligência é reduzida a 1 (bloqueio de Magia e Música)", () => {
    const fanatico = createMockActor({
      name: "Fanático Insano",
      attributes: {
        inteligencia: { base: 2, value: 2 },
        vontade: { base: 4, value: 4 },
      },
    });

    const res = aplicarEfeitosPacto("Pacto da Loucura", fanatico);
    assert.equal(res.inteligenciaFinal, 1, "Inteligência 2 reduzida em 1 cai para 1");
    assert.equal(res.instintosBasicos, true, "Deve ativar estado de instintos básicos");
    assert.equal(res.bloquearMagiaEMusica, true, "Deve bloquear uso de habilidades dos tipos Magia e Música");
    assert.equal(fanatico.system.detalhesPacto.instintosBasicos, true);
    assert.equal(fanatico.system.detalhesPacto.bloquearMagiaEMusica, true);
  });

  await t.test("50.4 - Imunidade a Medo e Efeitos Mentais (remove e previne condição amedrontado)", () => {
    const cultista = createMockActor({
      name: "Profeta do Vazio",
      attributes: {
        inteligencia: { base: 3, value: 3 },
        vontade: { base: 3, value: 3 },
      },
      details: {
        condicao: "Amedrontado",
      },
    });

    assert.equal(cultista.temCondicao("amedrontado"), true, "Começa amedrontado antes do pacto");

    aplicarEfeitosPacto("Pacto da Loucura", cultista);

    assert.equal(
      cultista.temCondicao("amedrontado"),
      false,
      "Condição amedrontado deve ser removida imediatamente após selar o pacto"
    );
    assert.equal(isImuneMedoOuMental(cultista, "medo"), true, "Deve ser imune a efeitos de medo");
    assert.equal(isImuneMedoOuMental(cultista, "amedrontado"), true, "Deve ser imune à condição amedrontado");
    assert.equal(isImuneMedoOuMental(cultista, "mental"), true, "Deve ser imune a qualquer efeito mental");
  });
});

// ============================================================================
// CASO 51: PACTO DA ESCURIDÃO (NEHEMOTH)
// ============================================================================
test("Caso 51: Pacto da Escuridão (Nehemoth)", async (t) => {
  await t.test("51.1 - Visão normal sem olhos, na escuridão, contra ilusões e invisibilidade", () => {
    const cultista = createMockActor({
      name: "Sussurrador Cego",
      attributes: { agilidade: { base: 3, value: 3 } },
    });

    const res = aplicarEfeitosPacto("Pacto da Escuridão", cultista);
    assert.equal(res.sucesso, true);
    assert.equal(res.visaoSemOlhos, true, "Deve ver normalmente sem olhos ou vendado");
    assert.equal(res.visaoEscuridao, true, "Deve enxergar na escuridão total");
    assert.equal(res.verInvisivel, true, "Deve distinguir criaturas invisíveis");
    assert.equal(res.verIlusoes, true, "Deve enxergar através de ilusões");

    assert.equal(cultista.system.sentidos.visaoSemOlhos, true);
    assert.equal(cultista.system.sentidos.verInvisivel, true);
  });

  await t.test("51.2 - Maldição Solar: Inaptidão em todos os testes sob luz solar direta", () => {
    const cultista = createMockActor({
      name: "Sombra Noturna",
      attributes: { agilidade: { base: 4, value: 4 } },
    });

    aplicarEfeitosPacto("Pacto da Escuridão", cultista);

    // Em caverna ou à noite (sem luz solar direta)
    const checagemNoite = verificarInaptidaoLuzSolar(cultista, { luzSolar: false });
    assert.equal(checagemNoite.inapto, false, "Na escuridão/noite NÃO deve estar Inapto");

    // Sob luz solar direta
    const checagemDia = verificarInaptidaoLuzSolar(cultista, { luzSolar: true });
    assert.equal(checagemDia.inapto, true, "Sob luz solar direta DEVE estar Inapto");
    assert.ok(checagemDia.motivo.includes("luz solar direta"), "Deve justificar pela maldição solar do pacto");
  });

  await t.test("51.3 - Aplicação do pacto já em ambiente solar impõe inaptidão imediata", () => {
    const cultista = createMockActor({ name: "Cultista Emboscado" });
    const res = aplicarEfeitosPacto("Pacto da Escuridão", cultista, { luzSolar: true });

    assert.equal(res.inaptoAtualmente, true, "Deve acusar inaptidão ativa no retorno");
    assert.equal(cultista.isInapto(), true, "Actor deve estar na condição Inapto");
  });
});

// ============================================================================
// CASO 52: PACTO DA PESTILÊNCIA (ERESHKIGAL)
// ============================================================================
test("Caso 52: Pacto da Pestilência (Ereshkigal)", async (t) => {
  await t.test("52.1 - Falha automática em testes contra infecção e para resistir a sintomas", () => {
    const cultista = createMockActor({
      name: "Vetor Maldito",
      attributes: { vontade: { base: 5, value: 5 } },
    });

    aplicarEfeitosPacto("Pacto da Pestilência", cultista);

    const resultadoInfeccao = testarInfeccaoDoenca(cultista, {
      nome: "Peste Vermelha",
      dificuldade: 8,
    });

    assert.equal(resultadoInfeccao.infectado, true, "Deve contrair a infecção");
    assert.equal(
      resultadoInfeccao.falhaAutomatica,
      true,
      "Deve falhar automaticamente mesmo com Vontade alta"
    );
    assert.equal(resultadoInfeccao.doenca, "Peste Vermelha");
  });

  await t.test("52.2 - Imunidade total aos sintomas e vetor ativo de contágio", () => {
    const cultista = createMockActor({ name: "Portador Sadio" });
    aplicarEfeitosPacto("Pacto da Pestilência", cultista);

    testarInfeccaoDoenca(cultista, "Febre Purulenta");
    testarInfeccaoDoenca(cultista, "Podridão Negra");

    assert.equal(
      cultista.system.pactos.pestilencia.imunidadeSintomas,
      true,
      "Deve possuir imunidade aos sintomas"
    );
    assert.equal(
      cultista.system.pactos.pestilencia.vetorTransmissor,
      true,
      "Deve ser vetor transmissor de infecção"
    );
    assert.equal(
      cultista.system.pactos.pestilencia.detectarDoencasToque,
      true,
      "Deve ser capaz de detectar doenças com o toque"
    );
    assert.deepEqual(
      cultista.system.pactos.pestilencia.doencasAtivas,
      ["Febre Purulenta", "Podridão Negra"],
      "Deve alojar ambas as doenças ativas em seu organismo"
    );
  });

  await t.test("52.3 - Efeito Colateral de Purgar / Antídoto Universal: Cura doença mas sofre sintomas por 1 dia", () => {
    const cultista = createMockActor({ name: "Cultista Alvo de Exorcismo" });
    aplicarEfeitosPacto("Pacto da Pestilência", cultista);

    testarInfeccaoDoenca(cultista, "Varíola Corrosiva");
    assert.equal(cultista.system.pactos.pestilencia.doencasAtivas.length, 1);

    // Alvo de magia Purgar
    const resultadoCura = aplicarCuraOuPurificacao(cultista, "purgar");
    assert.equal(resultadoCura.curado, true, "Deve ser curado de uma doença");
    assert.equal(resultadoCura.doencaRemovida, "Varíola Corrosiva");
    assert.equal(
      resultadoCura.sofreSintomasPor1Dia,
      true,
      "Deve sofrer os sintomas violentos por 1 dia completo"
    );
    assert.equal(resultadoCura.duracao, "1 dia");
    assert.equal(
      cultista.system.pactos.pestilencia.doencasAtivas.length,
      0,
      "A doença deve ter sido expurgada do organismo"
    );
    assert.equal(cultista.system.detalhesPacto.sintomasTemporarios.ativo, true);
  });
});

// ============================================================================
// CASO 53: PACTO DA TIRANIA (VIRZÚ)
// ============================================================================
test("Caso 53: Pacto da Tirania (Virzú)", async (t) => {
  await t.test("53.1 - Exigência de teste de Vontade contra Determinação do Cultista para atacá-lo", () => {
    const cultista = createMockActor({
      name: "Tirano de Virzú",
      attributes: { vontade: { base: 4, value: 4 } },
    });
    aplicarEfeitosPacto("Pacto da Tirania", cultista);

    const atacante = createMockActor({
      name: "Guerreiro Ousado",
      attributes: { vontade: { base: 3, value: 3 } },
    });

    // Tentativa de ataque sem teste de Vontade rolado
    const avaliacao = avaliarAtaqueContraTirania(atacante, cultista);
    assert.equal(avaliacao.podeAtacar, false, "Não pode atacar sem realizar o teste");
    assert.equal(avaliacao.exigiuTeste, true, "Deve exigir o teste");
    assert.equal(
      avaliacao.dificuldade,
      cultista.system.defesas.determinacao.value,
      "Dificuldade deve ser igual à Determinação do Cultista"
    );
  });

  await t.test("53.2 - Falha no teste de Vontade: Atacante é subjugado e não pode atacar", () => {
    const cultista = createMockActor({
      name: "Cultista Soberano",
      attributes: { vontade: { base: 5, value: 5 } },
    });
    aplicarEfeitosPacto("Pacto da Tirania", cultista);
    const det = cultista.system.defesas.determinacao.value; // 5

    const atacante = createMockActor({
      name: "Soldado Fraco",
      attributes: { vontade: { base: 2, value: 2 } },
    });

    // Rolagem 4 (menor que Dificuldade 5)
    const avaliacao = avaliarAtaqueContraTirania(atacante, cultista, 4);
    assert.equal(avaliacao.podeAtacar, false, "Falha no teste deve impedir o ataque");
    assert.equal(avaliacao.superouAura, false);
    assert.ok(avaliacao.motivo.includes("Falha no teste de Vontade"));
  });

  await t.test("53.3 - Sucesso no teste de Vontade: Atacante pode atacar com redutor igual à sua Vontade", () => {
    const cultista = createMockActor({
      name: "Cultista Soberano",
      attributes: { vontade: { base: 4, value: 4 } },
    });
    aplicarEfeitosPacto("Pacto da Tirania", cultista);
    const det = cultista.system.defesas.determinacao.value; // 4

    const atacante = createMockActor({
      name: "Paladino Determinado",
      attributes: { vontade: { base: 3, value: 3 } },
    });

    // Rolagem 6 (maior ou igual a 4)
    const avaliacao = avaliarAtaqueContraTirania(atacante, cultista, 6);
    assert.equal(avaliacao.podeAtacar, true, "Deve permitir o ataque após sucesso no teste");
    assert.equal(avaliacao.redutor, 3, "Redutor no ataque deve ser igual à Vontade do atacante (3)");
    assert.equal(avaliacao.superouAura, true, "Deve registrar superação da aura");

    // Segundo ataque no mesmo ciclo não exige novo teste
    const segundoAtaque = avaliarAtaqueContraTirania(atacante, cultista);
    assert.equal(segundoAtaque.podeAtacar, true, "Não deve exigir novo teste no mesmo ciclo");
    assert.equal(segundoAtaque.redutor, 0, "Segundo ataque não sofre mais o redutor");
  });

  await t.test("53.4 - Imunidade Cruzada Canônica: Cultista da Loucura ignora a Aura de Tirania", () => {
    const cultistaTirania = createMockActor({
      name: "Senhor da Tirania",
      attributes: { vontade: { base: 5, value: 5 } },
    });
    aplicarEfeitosPacto("Pacto da Tirania", cultistaTirania);

    const cultistaLoucura = createMockActor({
      name: "Seguidor da Loucura",
      attributes: { vontade: { base: 2, value: 2 }, inteligencia: { base: 3, value: 3 } },
    });
    aplicarEfeitosPacto("Pacto da Loucura", cultistaLoucura);

    // O cultista da loucura ataca o cultista da tirania:
    // Por ser imune a efeitos mentais, ele NÃO é afetado pela Aura de Tirania!
    const avaliacao = avaliarAtaqueContraTirania(cultistaLoucura, cultistaTirania);
    assert.equal(
      avaliacao.podeAtacar,
      true,
      "Portador do Pacto da Loucura deve poder atacar imediatamente sem teste"
    );
    assert.equal(avaliacao.exigiuTeste, false, "Não deve exigir teste de Vontade");
    assert.equal(avaliacao.redutor, 0, "Não deve aplicar redutor ao ataque");
    assert.ok(avaliacao.motivo.includes("imune a efeitos mentais"));
  });
});

// ============================================================================
// CASO 54: HABILIDADE VIRULÊNCIA (CAMINHO CULTISTA)
// ============================================================================
test("Caso 54: Habilidade Virulência (Caminho Cultista)", async (t) => {
  await t.test("54.1 - Raio de ação da aura é igual à Determinação do Cultista em metros", () => {
    const cultista = createMockActor({
      name: "Cultista Pestilento",
      attributes: { vontade: { base: 5, value: 5 }, inteligencia: { base: 3, value: 3 } },
    });
    // Determinação = 5
    const det = cultista.system.defesas.determinacao.value;

    const alvoProximo = createMockActor({ name: "Guarda Próximo" }); // 4 metros
    const alvoDistante = createMockActor({ name: "Arqueiro Longe" }); // 8 metros

    const alvos = [
      { target: alvoProximo, distancia: 4 },
      { target: alvoDistante, distancia: 8 },
    ];

    const res = aplicarVirulencia(cultista, alvos);
    assert.equal(res.sucesso, true);
    assert.equal(res.raioMetros, det, `Raio deve ser ${det} metros (Determinação do cultista)`);
    assert.equal(res.alvosAfetados.length, 1, "Apenas o alvo dentro do raio deve ser afetado");
    assert.equal(res.alvosAfetados[0].alvo.name, "Guarda Próximo");
    assert.equal(res.alvosIgnorados.length, 1, "O alvo a 8m deve ser ignorado por estar fora do raio");
    assert.equal(res.alvosIgnorados[0].alvo.name, "Arqueiro Longe");
  });

  await t.test("54.2 - Alvos afetados realizam testes contra doenças e venenos como Inaptos (1d6)", () => {
    const cultista = createMockActor({
      name: "Vetor Supremo",
      attributes: { vontade: { base: 6, value: 6 } },
    });
    const vitima = createMockActor({ name: "Cobaia Humana" });

    // Aplica Virulência na vítima (a 2 metros de distância)
    aplicarVirulencia(cultista, [{ target: vitima, distancia: 2 }]);

    const testeVeneno = testarResistenciaDoencaOuVeneno(vitima, { tipo: "veneno" });
    assert.equal(testeVeneno.inapto, true, "Teste de resistência deve ser Inapto");
    assert.equal(testeVeneno.dadosRolados, 1, "Inaptidão no MB3e rola 1d6 ao invés de 2d6");
    assert.ok(testeVeneno.motivo.includes("Virulência"));

    // Criatura não afetada faz teste padrão
    const inocente = createMockActor({ name: "Criatura Longe" });
    const testeNormal = testarResistenciaDoencaOuVeneno(inocente, { tipo: "veneno" });
    assert.equal(testeNormal.inapto, false, "Criatura fora da virulência não é Inapta");
    assert.equal(testeNormal.dadosRolados, 2, "Teste padrão rola 2d6");
  });

  await t.test("54.3 - Seletividade Biológica: Construtos, Mortos-Vivos e o próprio Cultista não são afetados", () => {
    const cultista = createMockActor({
      name: "Sacerdote da Peste",
      attributes: { vontade: { base: 4, value: 4 } },
    });

    const golem = createMockActor({
      name: "Golem de Ferro",
      details: { tipo: "construto", raca: "Golem" },
    });

    const zumbi = createMockActor({
      name: "Cão Mastim Zumbi",
      details: { tipo: "morto-vivo" },
    });

    const guerreiro = createMockActor({
      name: "Cavaleiro Humano",
      details: { tipo: "humanoide", raca: "Humano" },
    });

    const alvos = [
      { target: cultista, distancia: 0 },
      { target: golem, distancia: 2 },
      { target: zumbi, distancia: 3 },
      { target: guerreiro, distancia: 2 },
    ];

    const res = aplicarVirulencia(cultista, alvos);

    // O cultista é excluído da lista de alvos
    assert.equal(
      res.alvosAfetados.some((a) => a.alvo === cultista),
      false,
      "O próprio cultista não deve ser afetado por sua aura"
    );

    // Construtos e Mortos-Vivos são ignorados
    assert.equal(
      res.alvosAfetados.some((a) => a.alvo === golem),
      false,
      "Golem de Ferro (Construto) não deve ser afetado"
    );
    assert.equal(
      res.alvosAfetados.some((a) => a.alvo === zumbi),
      false,
      "Zumbi (Morto-Vivo) não deve ser afetado"
    );

    // Apenas a criatura viva é afetada
    assert.equal(res.alvosAfetados.length, 1);
    assert.equal(res.alvosAfetados[0].alvo.name, "Cavaleiro Humano");
  });
});

// ============================================================================
// CASO EXTRA: NORMALIZAÇÃO E INTEGRAÇÃO DE PACTOS CANÔNICOS
// ============================================================================
test("Pactos Canônicos: Catálogo Oficial e Normalização", () => {
  const pactosEsperados = [
    "pacto da loucura",
    "pacto da escuridao",
    "pacto da pestilencia",
    "pacto da tirania",
    "pacto da ambicao",
    "pacto da destruicao",
  ];

  for (const p of pactosEsperados) {
    assert.ok(
      PACTOS_CANONICOS.includes(p),
      `Catálogo deve conter ${p}`
    );
  }

  assert.equal(normalizarPacto("Pacto da Escuridão"), "pacto da escuridao");
  assert.equal(normalizarPacto("  PACTO DA PESTILÊNCIA  "), "pacto da pestilencia");
  assert.equal(normalizarPacto("Pacto da Tirania"), "pacto da tirania");
});
