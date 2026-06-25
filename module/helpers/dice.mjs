/**
 * Sistema de rolagem do Mighty Blade 3e.
 *
 * Teste padrão: Nd6 + atributo + bônus, onde N = 2 (ou 1 se Inapto) + dados
 * extras de habilidades. A soma de TODOS os dados entra no total.
 *
 * Sucesso Crítico: 2 ou mais dados mostram 6 (impossível com 1 dado).
 * Falha Crítica:   todos os dados mostram 1 (um único 1 no 1d6 do Inapto conta).
 *
 * Inaptidão (errata): Inapto rola 1d6; bônus fixos continuam valendo; cada dado
 * extra (+1d6) NÃO é rolado, vira +2 fixo.
 */

const CARD_TEMPLATE = "systems/mighty-blade/templates/chat/roll-card.hbs";

const ATTRIBUTE_LABELS = {
  forca: "Força",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  vontade: "Vontade",
};

/* -------------------------------------------- */
/*  Diálogo de opções                           */
/* -------------------------------------------- */

/**
 * Abre um diálogo pedindo as opções da rolagem.
 * @param {object} [options]
 * @param {string} [options.title]            Título da janela.
 * @param {string} [options.attributeLabel]   Nome do atributo/teste (para o título).
 * @param {boolean}[options.showDifficulty]   Mostrar o campo de Dificuldade (DV).
 * @returns {Promise<object|null>} { extraDice, bonus, difficulty, inapto } ou null se cancelado.
 */
export async function requestTestOptions({ title = "Teste", attributeLabel = "", showDifficulty = true } = {}) {
  const difficultyField = showDifficulty
    ? `<div class="form-group">
        <label>Dificuldade (DV) — opcional</label>
        <input type="number" name="difficulty" placeholder="—" step="1">
      </div>`
    : "";

  const content = `
  <div class="mighty-blade-roll-dialog" style="display:flex;flex-direction:column;gap:8px;">
    <div class="form-group">
      <label>Dados extras (+1d6 por habilidade)</label>
      <input type="number" name="extraDice" value="0" min="0" step="1" autofocus>
    </div>
    <div class="form-group">
      <label>Bônus / Penalidade fixo</label>
      <input type="number" name="bonus" value="0" step="1">
    </div>
    ${difficultyField}
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" name="inapto" style="width:auto;"> Inapto (rola apenas 1d6)
      </label>
    </div>
  </div>`;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: attributeLabel ? `${title} de ${attributeLabel}` : title },
    content,
    rejectClose: false,
    buttons: [
      {
        action: "roll",
        label: "Rolar",
        icon: "fas fa-dice-d6",
        default: true,
        callback: (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button.closest("form, dialog");
          const field = (name) => root?.querySelector(`[name="${name}"]`);
          const diff = field("difficulty")?.value ?? "";
          return {
            extraDice: Number(field("extraDice")?.value) || 0,
            bonus: Number(field("bonus")?.value) || 0,
            difficulty: diff === "" ? null : Number(diff),
            inapto: !!field("inapto")?.checked,
          };
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return result && typeof result === "object" ? result : null;
}

/* -------------------------------------------- */
/*  Núcleo: pool de dados e resultado           */
/* -------------------------------------------- */

/**
 * Monta e avalia o pool de dados do Mighty Blade, sem publicar no chat.
 * @returns {Promise<object>} { roll, faces, critSuccess, critFailure, total, formula, effectiveBonus, inaptoNote }
 */
async function evaluatePool({ attribute = 0, inapto = false, baseDice = 2, extraDice = 0, bonus = 0 } = {}) {
  const extra = Math.max(0, Number(extraDice) || 0);
  let effectiveBonus = Number(bonus) || 0;
  let nDice;
  let inaptoNote = "";

  if (inapto) {
    nDice = 1;
    if (extra > 0) {
      effectiveBonus += extra * 2;
      inaptoNote = `+${extra}d6 → +${extra * 2} (Inapto)`;
    }
  } else {
    nDice = baseDice + extra;
  }

  const terms = [`${nDice}d6`];
  if (attribute) terms.push(`${attribute}`);
  if (effectiveBonus) terms.push(`${effectiveBonus}`);
  const roll = await new Roll(terms.join(" + ")).evaluate();

  const faces = (roll.dice[0]?.results ?? []).map((r) => r.result);
  const sixes = faces.filter((f) => f === 6).length;

  return {
    roll,
    faces,
    critSuccess: sixes >= 2,
    critFailure: faces.length > 0 && faces.every((f) => f === 1),
    total: roll.total,
    formula: roll.formula,
    effectiveBonus,
    inaptoNote,
  };
}

/**
 * Determina o desfecho (rótulo/cor) a partir dos críticos e da dificuldade.
 * @returns {{label:string, color:string, success:(boolean|null)}}
 */
function resolveOutcome({ critSuccess, critFailure, total, difficulty }) {
  if (critSuccess) return { label: "⚡ Sucesso Crítico", color: "#1b7f3b", success: true };
  if (critFailure) return { label: "💀 Falha Crítica", color: "#9b1c1c", success: false };
  if (difficulty !== null && difficulty !== undefined) {
    const ok = total >= difficulty;
    return { label: ok ? "Sucesso" : "Falha", color: ok ? "#2e7d32" : "#b71c1c", success: ok };
  }
  return { label: "", color: "", success: null };
}

/**
 * Renderiza o card e publica a mensagem de chat.
 * @returns {Promise<ChatMessage>}
 */
async function postRollCard({ actor = null, speaker = null, roll, cardData, rollMode = null }) {
  const content = await foundry.applications.handlebars.renderTemplate(CARD_TEMPLATE, cardData);
  const messageData = {
    speaker: speaker ?? ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  };
  ChatMessage.applyRollMode(messageData, rollMode ?? game.settings.get("core", "rollMode"));
  return ChatMessage.create(messageData);
}

/* -------------------------------------------- */
/*  Teste genérico                              */
/* -------------------------------------------- */

/**
 * Executa um teste do Mighty Blade e publica o resultado no chat.
 * @param {object} config — ver propriedades abaixo.
 * @returns {Promise<ChatMessage>}
 */
export async function rollTest({
  actor = null,
  speaker = null,
  label = "Teste",
  flavor = "",
  attribute = 0,
  attributeLabel = "",
  inapto = false,
  baseDice = 2,
  extraDice = 0,
  bonus = 0,
  difficulty = null,
  extraContent = "",
  rollMode = null,
} = {}) {
  const r = await evaluatePool({ attribute, inapto, baseDice, extraDice, bonus });
  const outcome = resolveOutcome({
    critSuccess: r.critSuccess,
    critFailure: r.critFailure,
    total: r.total,
    difficulty,
  });

  const cardData = {
    label,
    flavor,
    attributeLabel,
    attribute,
    bonus: r.effectiveBonus,
    inaptoNote: r.inaptoNote,
    difficulty,
    inapto,
    dice: r.faces.map((v) => ({ value: v, isMax: v === 6, isMin: v === 1 })),
    formula: r.formula,
    total: r.total,
    outcomeLabel: outcome.label,
    outcomeColor: outcome.color,
    extraContent,
  };

  return postRollCard({ actor, speaker, roll: r.roll, cardData, rollMode });
}

/**
 * Rola um teste de atributo de um ator, abrindo o diálogo de opções.
 * @returns {Promise<ChatMessage|null>}
 */
export async function rollAttribute(actor, attrKey, { skipDialog = false } = {}) {
  if (!actor) return null;
  const attributeLabel = ATTRIBUTE_LABELS[attrKey] ?? attrKey;
  const value = actor.system?.attributes?.[attrKey]?.value ?? 0;

  let opts = { extraDice: 0, bonus: 0, difficulty: null, inapto: false };
  if (!skipDialog) {
    const chosen = await requestTestOptions({ title: "Teste", attributeLabel });
    if (!chosen) return null;
    opts = chosen;
  }

  return rollTest({
    actor,
    label: `Teste de ${attributeLabel}`,
    attribute: value,
    attributeLabel,
    ...opts,
  });
}

/* -------------------------------------------- */
/*  Conjuração de magias                        */
/* -------------------------------------------- */

/**
 * Diálogo de Sucesso Crítico em magia: o jogador escolhe 1 dos 4 efeitos.
 * @returns {Promise<"semMana"|"dano"|"area"|"duracao">}
 */
async function escolherEfeitoCritico() {
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: "Sucesso Crítico — Escolha o efeito" },
    content: `<p style="margin:0 0 8px;">Conjuração com Sucesso Crítico! Escolha <b>um</b> efeito:</p>`,
    rejectClose: false,
    buttons: [
      { action: "semMana", label: "Não gastar Mana", icon: "fas fa-bolt", default: true },
      { action: "dano", label: "Dobrar dano", icon: "fas fa-burst" },
      { action: "area", label: "Dobrar área", icon: "fas fa-up-right-and-down-left-from-center" },
      { action: "duracao", label: "Dobrar duração", icon: "fas fa-clock" },
    ],
  });
  return typeof result === "string" ? result : "semMana";
}

/**
 * Conjura uma magia: teste de 2d6 + Inteligência (Arcana) ou Vontade (Mística)
 * vs Dificuldade. A Mana só é gasta no sucesso. Sucesso Crítico abre o modal de
 * efeitos. Inapto (ex.: armadura pesada) pode ser marcado no diálogo.
 *
 * @param {Item} item     Item do tipo "magia".
 * @param {object} [options]
 * @param {boolean}[options.skipDialog]     Pular o diálogo (Shift+clique).
 * @param {number} [options.difficultyMod]  Modificador de Dificuldade (ex.: Asseste Mágico: -1).
 * @param {number} [options.costMod]        Redução de Custo de Mana (ex.: Foco Mágico: -5).
 *                                          (damage/cura mods virão com as propriedades de item equipado.)
 * @returns {Promise<ChatMessage|null>}
 */
export async function castSpell(item, { skipDialog = false, difficultyMod = 0, costMod = 0 } = {}) {
  const actor = item.actor;
  if (!actor) return item._postItemCard?.();

  const sys = item.system ?? {};
  const fonte = sys.fonte === "mistica" ? "mistica" : "arcana";
  const attrKey = fonte === "mistica" ? "vontade" : "inteligencia";
  const attrLabel = fonte === "mistica" ? "Vontade" : "Inteligência";
  const attrValue = actor.system?.attributes?.[attrKey]?.value ?? 0;
  const dificuldade = Math.max(0, (Number(sys.dificuldade) || 0) + (Number(difficultyMod) || 0));
  const custo = Math.max(0, (Number(sys.custo) || 0) - (Number(costMod) || 0));

  // Mãos: para conjurar é preciso 1 mão livre OU um item Canalizador equipado.
  const eq = actor.system?.equipamento ?? {};
  if ((eq.maosLivres ?? 2) < 1 && !eq.temCanalizador) {
    return ui.notifications.warn(
      `${actor.name} não pode conjurar: precisa de uma mão livre ou de um item Canalizador equipado.`
    );
  }

  let opts = { extraDice: 0, bonus: 0, inapto: false };
  if (!skipDialog) {
    const chosen = await requestTestOptions({
      title: `Conjurar ${item.name}`,
      attributeLabel: "",
      showDifficulty: false,
    });
    if (!chosen) return null;
    opts = chosen;
  }

  // Armadura equipada com FN > Força → conjura como Inapto.
  const inapto = opts.inapto || !!eq.inaptoArmadura;

  const r = await evaluatePool({
    attribute: attrValue,
    inapto,
    extraDice: opts.extraDice,
    bonus: opts.bonus,
  });
  const outcome = resolveOutcome({
    critSuccess: r.critSuccess,
    critFailure: r.critFailure,
    total: r.total,
    difficulty: dificuldade,
  });

  // Decide gasto de Mana e efeito de crítico.
  let spendMana = false;
  let critEffect = "";
  if (r.critSuccess) {
    const efeito = await escolherEfeitoCritico();
    if (efeito === "semMana") {
      spendMana = false;
      critEffect = "Não gastou Mana";
    } else {
      spendMana = true;
      critEffect = { dano: "Dano dobrado", area: "Área dobrada", duracao: "Duração dobrada" }[efeito] ?? "";
    }
  } else if (outcome.success) {
    spendMana = true; // sucesso normal → gasta
  } // falha / falha crítica → não gasta

  // Deduz a Mana (clampando em 0) e monta a linha informativa.
  let manaInfo;
  if (spendMana && custo > 0) {
    const atual = actor.system?.resources?.mana?.value ?? 0;
    if (atual < custo) ui.notifications.warn(`${actor.name} não tem Mana suficiente (${atual}/${custo} PM).`);
    await actor.update({ "system.resources.mana.value": Math.max(0, atual - custo) });
    manaInfo = `Custo: ${custo} PM (gasto)`;
  } else if (custo > 0) {
    manaInfo = r.critSuccess
      ? `Custo: ${custo} PM (não gasto — crítico)`
      : `Custo: ${custo} PM (não gasto — falha)`;
  } else {
    manaInfo = "Custo: 0 PM";
  }

  const extra = [
    `<div style="margin-top:8px;font-size:12px;">Fonte: <b>${fonte === "mistica" ? "Mística" : "Arcana"}</b> (${attrLabel})</div>`,
    `<div style="font-size:12px;">${manaInfo}</div>`,
  ];
  if (critEffect) extra.push(`<div style="font-size:12px;"><b>Efeito crítico:</b> ${critEffect}</div>`);

  const cardData = {
    label: `Conjuração: ${item.name}`,
    flavor: fonte === "mistica" ? "Selo Místico" : "Runa Arcana",
    attributeLabel: attrLabel,
    attribute: attrValue,
    bonus: r.effectiveBonus,
    inaptoNote: r.inaptoNote,
    difficulty: dificuldade,
    inapto,
    dice: r.faces.map((v) => ({ value: v, isMax: v === 6, isMin: v === 1 })),
    formula: r.formula,
    total: r.total,
    outcomeLabel: outcome.label,
    outcomeColor: outcome.color,
    extraContent: extra.join(""),
  };

  return postRollCard({ actor, roll: r.roll, cardData });
}
