import { rollTest } from "../helpers/dice.mjs";

/**
 * Extend the basic Item document.
 * @extends {Item}
 */
export class MightyBladeItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Dados disponíveis para fórmulas de rolagem deste item (inclui os do ator).
   * @returns {object}
   */
  getRollData() {
    const rollData = { ...this.system };
    if (this.actor) rollData.actor = this.actor.getRollData();
    return rollData;
  }

  /**
   * Disparado ao clicar no item na ficha. Comportamento varia por tipo.
   * @param {object} [options]
   * @param {boolean}[options.skipDialog]  Pular o diálogo de opções (Shift+clique).
   * @returns {Promise<ChatMessage>}
   */
  async roll(options = {}) {
    if (this.type === "arma") return this._rollWeapon(options);
    return this._postItemCard();
  }

  /**
   * Rolagem de ataque de uma arma: 2d6 + Força (corpo a corpo) ou Agilidade (à distância).
   * @param {object} [options]
   * @private
   */
  async _rollWeapon({ skipDialog = false } = {}) {
    const actor = this.actor;
    if (!actor) return this._postItemCard();

    const sys = this.system;
    const melee = (sys.distancia ?? "corpo") === "corpo";
    const attrKey = melee ? "forca" : "agilidade";
    const attrLabel = melee ? "Força" : "Agilidade";
    const attrValue = actor.system?.attributes?.[attrKey]?.value ?? 0;
    const forca = actor.system?.attributes?.forca?.value ?? 0;

    // Força Necessária (FN): se FN > Força → ataca como Inapto.
    let inapto = false;
    const fn = Number(sys.fn) || 0;
    if (fn > forca) {
      inapto = true;
      ui.notifications.warn(
        `${this.name}: Força Necessária ${fn} maior que sua Força ${forca}. Você ataca como Inapto (1d6).`
      );
    }

    // Dano: corpo a corpo = dano da arma + Força; à distância = dano fixo.
    const danoBase = Number(sys.dano) || 0;
    const dano = melee ? danoBase + forca : danoBase;
    const tipo = sys.tipo ? ` / ${sys.tipo}` : "";
    const breakdown = melee
      ? `<span style="opacity:0.7;">(${danoBase} arma + ${forca} Força)</span>`
      : `<span style="opacity:0.7;">(distância)</span>`;
    const extraContent =
      `<div style="margin-top:8px;font-size:14px;"><i class="fas fa-burst"></i> ` +
      `Dano: <b>${dano}</b>${tipo} ${breakdown}</div>`;

    return rollTest({
      actor,
      label: `Ataque: ${this.name}`,
      flavor: melee ? "Corpo a corpo" : "À distância",
      attribute: attrValue,
      attributeLabel: attrLabel,
      inapto,
      extraContent,
    });
  }

  /**
   * Publica um card descritivo do item no chat (habilidades, magias, equipamentos…).
   * @private
   */
  async _postItemCard() {
    const sys = this.system ?? {};
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    const description = await TextEditor.enrichHTML(sys.description ?? "", { relativeTo: this });

    const meta = [];
    if (this.type === "habilidade" && sys.tipo) meta.push(`<b>Tipo:</b> ${sys.tipo}`);
    if (sys.categoria) meta.push(`<b>Categoria:</b> ${sys.categoria}`);
    if (sys.custo) meta.push(`<b>Custo:</b> ${sys.custo} PM`);
    if (sys.dificuldade) meta.push(`<b>Dificuldade:</b> ${sys.dificuldade}`);
    if (sys.circulo) meta.push(`<b>Círculo:</b> ${sys.circulo}`);
    if (sys.requisitos) meta.push(`<b>Requisitos:</b> ${sys.requisitos}`);

    const metaHtml = meta.length
      ? `<div style="font-size:11px;opacity:0.85;margin-bottom:6px;">${meta.join(" · ")}</div>`
      : "";

    const content = `
    <div class="mighty-blade item-card" style="border:1px solid var(--color-border-dark, #7a7971);border-radius:6px;overflow:hidden;font-size:13px;">
      <header style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:rgba(0,0,0,0.08);border-bottom:1px solid var(--color-border-light, #b5b3a4);">
        <img src="${this.img}" width="32" height="32" style="border:none;flex:0 0 auto;">
        <div style="font-weight:bold;font-size:15px;">${this.name}</div>
      </header>
      <div style="padding:8px;">
        ${metaHtml}
        <div>${description || "<em>Sem descrição.</em>"}</div>
      </div>
    </div>`;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content,
    });
  }
}
