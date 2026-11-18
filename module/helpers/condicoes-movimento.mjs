/**
 * Penalidade de movimento por condição (Fase 4) — a mesma regra do site (rules-core: resolverPenalidades
 * e numerosDaFicha). A tabela vem do site pelo export: CANONICAL_CONDICOES_MOVIMENTO (gb e mc).
 *
 * - Agarrando, Agarrado: sem movimento.
 * - Fatigado, Imobilizado, Inconsciente, Paralisado, Por um Fio (e Exausto no Guia Básico): sem ações → 0 m.
 * - Atordoado: Deslocamento -1; a Corrida acompanha o mesmo multiplicador.
 * - Enregelado (e, com o Manual do Combatente, Caído, Fatigado e Exausto): metade, arredondada para cima.
 */
import { CANONICAL_CONDICOES_MOVIMENTO } from "../data/canonical-packs-data.mjs";

const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, "-");

/** Ids das condições ativas no Actor que a tabela conhece (com as implicações). */
export function condicoesComImplicacoes(ids, tabela) {
  const vistas = new Set();
  const fila = [...ids].map(normalizar).filter((c) => tabela[c]);
  while (fila.length) {
    const c = fila.pop();
    if (vistas.has(c)) continue;
    vistas.add(c);
    for (const i of tabela[c]?.implica ?? []) fila.push(i);
  }
  return vistas;
}

/** Junta as condições do Actor: as da ficha do site (condicoesAtivas), os status do token e as aflições. */
export function condicoesDoActor(system, parent) {
  const ids = [...(system?.details?.condicoesAtivas ?? [])];
  if (parent?.statuses instanceof Set) ids.push(...parent.statuses);
  for (const a of system?.details?.aflicoes ?? []) ids.push(a?.id, a?.nome);
  // Por um Fio automático com 0 PV, como o site faz ao zerar a Vida
  if (Number(system?.resources?.vida?.value) === 0 && Number(system?.resources?.vida?.max) > 0) ids.push("por-um-fio");
  return ids.filter(Boolean);
}

/**
 * @returns {{ deslocamento: number, corrida: number, condicoes: string[] }}
 */
export function aplicarCondicoesNoMovimento(deslocamento, corrida, ids, { usarManualDoCombatente = false, tabelas = CANONICAL_CONDICOES_MOVIMENTO } = {}) {
  const tabela = (usarManualDoCombatente ? tabelas?.mc : tabelas?.gb) ?? {};
  const ativas = condicoesComImplicacoes(ids, tabela);
  if (ativas.size === 0) return { deslocamento, corrida, condicoes: [] };
  const p = { deslocamento: 0, metade: false, semMov: false };
  for (const c of ativas) {
    const t = tabela[c];
    if (t.deslocamento) p.deslocamento += t.deslocamento;
    if (t.deslocamentoMetade) p.metade = true;
    if (t.semMovimento || t.semAcoes) p.semMov = true;
  }
  let d = deslocamento;
  let c = corrida;
  if (p.semMov) {
    d = 0;
    c = 0;
  } else {
    if (p.deslocamento) {
      const mult = d > 0 ? c / d : 0;
      d = Math.max(0, d + p.deslocamento);
      c = Math.round(d * mult);
    }
    if (p.metade) {
      d = Math.max(1, Math.ceil(d / 2));
      c = Math.max(2, Math.ceil(c / 2));
    }
  }
  return { deslocamento: d, corrida: c, condicoes: [...ativas] };
}
