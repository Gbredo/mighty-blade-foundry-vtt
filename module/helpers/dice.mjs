/**
 * Sistema de rolagem do Mighty Blade 3e.
 *
 * Teste padrão: Nd6 + atributo + bônus, onde:
 *   - N = 2 normalmente, ou 1 se o personagem estiver Inapto;
 *   - dados extras (+1d6) concedidos por habilidades somam-se a N;
 *   - a soma de TODOS os dados rolados entra no total.
 *
 * Sucesso Crítico: 2 ou mais dados mostram 6.
 * Falha Crítica:   todos os dados mostram 1.
 *
 * Observação de regra: aqui assumimos que os dados extras somam ao total
 * (3d6 + atributo, etc.). Se na sua mesa os dados extras servem só para
 * "pegar os 2 melhores", ajuste a função `rollTest` abaixo.
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
 * @param {string} [options.title]           Título da janela.
 * @param {string} [options.attributeLabel]  Nome do atributo/teste (para o título).
 * @returns {Promise<object|null>} { extraDice, bonus, difficulty, inapto } ou null se cancelado.
 */
export async function requestTestOptions({ title = "Teste", attributeLabel = "" } = {}) {
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
    <div class="form-group">
      <label>Dificuldade (DV) — opcional</label>
      <input type="number" name="difficulty" placeholder="—" step="1">
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" name="inapto" style="width:auto;"> Inapto (rola apenas 1d6)
      </label>
    </div>
  </div>`;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: attributeLabel ? `Teste de ${attributeLabel}` : title },
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
/*  Rolagem principal                           */
/* -------------------------------------------- */

/**
 * Executa um teste do Mighty Blade e publica o resultado no chat.
 * @param {object} config
 * @param {Actor}  [config.actor]           Ator que rola (para o speaker).
 * @param {string} [config.label]           Título do card.
 * @param {string} [config.flavor]          Subtítulo/contexto.
 * @param {number} [config.attribute]       Valor do atributo a somar.
 * @param {string} [config.attributeLabel]  Nome do atributo (exibido).
 * @param {boolean}[config.inapto]          Se true, rola 1d6 em vez de 2d6.
 * @param {number} [config.baseDice]        Quantidade base de dados (padrão 2).
 * @param {number} [config.extraDice]       Dados extras (+1d6).
 * @param {number} [config.bonus]           Bônus/penalidade fixo.
 * @param {number|null} [config.difficulty] Dificuldade (DV) para determinar Sucesso/Falha.
 * @param {string} [config.extraContent]    HTML extra (ex.: linha de dano).
 * @param {string} [config.rollMode]        Modo de rolagem (público/privado…).
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
  const nDice = Math.max(1, (inapto ? 1 : baseDice) + Math.max(0, Number(extraDice) || 0));

  const terms = [`${nDice}d6`];
  if (attribute) terms.push(`${attribute}`);
  if (bonus) terms.push(`${bonus}`);
  const roll = await new Roll(terms.join(" + ")).evaluate();

  const faces = (roll.dice[0]?.results ?? []).map((r) => r.result);
  const sixes = faces.filter((f) => f === 6).length;
  const allOnes = faces.length > 0 && faces.every((f) => f === 1);
  const critSuccess = sixes >= 2;
  const critFailure = allOnes;

  let outcomeLabel = "";
  let outcomeColor = "";
  if (critSuccess) {
    outcomeLabel = "⚡ Sucesso Crítico";
    outcomeColor = "#1b7f3b";
  } else if (critFailure) {
    outcomeLabel = "💀 Falha Crítica";
    outcomeColor = "#9b1c1c";
  } else if (difficulty !== null && difficulty !== undefined) {
    if (roll.total >= difficulty) {
      outcomeLabel = "Sucesso";
      outcomeColor = "#2e7d32";
    } else {
      outcomeLabel = "Falha";
      outcomeColor = "#b71c1c";
    }
  }

  const cardData = {
    label,
    flavor,
    attributeLabel,
    attribute,
    bonus,
    difficulty,
    inapto,
    dice: faces.map((v) => ({ value: v, isMax: v === 6, isMin: v === 1 })),
    formula: roll.formula,
    total: roll.total,
    outcomeLabel,
    outcomeColor,
    extraContent,
  };

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
/*  Atalho: teste de atributo                   */
/* -------------------------------------------- */

/**
 * Rola um teste de atributo de um ator, abrindo o diálogo de opções.
 * @param {Actor}  actor         Ator que rola.
 * @param {string} attrKey       "forca" | "agilidade" | "inteligencia" | "vontade".
 * @param {object} [options]
 * @param {boolean}[options.skipDialog]  Se true, rola direto sem diálogo (ex.: Shift+clique).
 * @returns {Promise<ChatMessage|null>}
 */
export async function rollAttribute(actor, attrKey, { skipDialog = false } = {}) {
  if (!actor) return null;
  const attributeLabel = ATTRIBUTE_LABELS[attrKey] ?? attrKey;
  const value = actor.system?.attributes?.[attrKey]?.value ?? 0;

  let opts = { extraDice: 0, bonus: 0, difficulty: null, inapto: false };
  if (!skipDialog) {
    const chosen = await requestTestOptions({ attributeLabel });
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
