export const RACES_DATA = [
  {
    name: "Aesir",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 4, agilidade: 2, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Vigor Nórdico",
        descricao:
          "Você nasceu em uma região gelada. Você é Resistente à Frio e não é afetado nem por efeitos de climas gelados nem por efeitos provenientes de danos por Frio (como Enregelamento).",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Bardo, Druida, Guerreiro, Patrulheiro e Rúnico",
      description: "<p>Habitantes das terras gélidas do norte.</p>",
    },
  },
  {
    name: "Anão",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 4, agilidade: 2, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Coração da Montanha",
        descricao:
          "Você é imune a todos os venenos naturais e mágicos e rola +1d6 em testes para resistir à fadiga, doenças e quaisquer outros efeitos físicos. Além disso, sua Carga é calculada como se você tivesse Força +2.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Guerreiro, Paladino, Sacerdote e Rúnico",
      description: "<p>Mestres da forja e das montanhas.</p>",
    },
  },
  {
    name: "Elfo",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 2, agilidade: 4, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Benção de Lathellanis",
        descricao:
          "Você é imune a todas as doenças de origem natural ou mágica, Dreno de Energia e efeitos que causem Envelhecimento. Além disso, você rola +1d6 em todos os seus testes de Inteligência para perceber e rastrear alvos.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Druida, Mago, Patrulheiro, Sacerdote e Xamã",
      description: "<p>Guardiões das florestas antigas.</p>",
    },
  },
  {
    name: "Faen",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 2, agilidade: 4, inteligencia: 3, vontade: 2 },
      habilidadeAutomatica: {
        nome: "Constituição Feérica",
        descricao:
          "Você possui asas que permitem voar (com o dobro da movimentação normal). Não pode pairar por mais de 1 hora sem descanso. Impossível mover-se em silêncio voando. O dano de Encontrão em voo é duplicado.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Patrulheiro, Ladino, Mago",
      description: "<p>Pequenos seres feéricos com asas.</p>",
    },
  },
  {
    name: "Fauno",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 3, agilidade: 3, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Patas com Cascos",
        descricao:
          "Rola +1d6 em testes de correr, saltar ou desviar de obstáculos. Deslocamento +1. Ataques desarmados com cascos causam Força +2/Contusão.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Bardo, Druida, Patrulheiro, Xamã",
      description: "<p>Protetores da natureza com pernas de bode.</p>",
    },
  },
  {
    name: "Fira",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 3, agilidade: 3, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Habitante do Deserto",
        descricao:
          "Resistente a Fogo. Pode passar 5 dias sem água. Não é afetado por climas quentes ou áridos.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Espadachim, Feiticeiro, Paladino, Rúnico e Sacerdote",
      description: "<p>Povo do deserto com afinidade ao fogo.</p>",
    },
  },
  {
    name: "Humano",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 3, agilidade: 3, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Adaptabilidade",
        descricao:
          "Você tem +1 em qualquer um dos seus Atributos a sua escolha (Essa escolha deve ser feita na criação da ficha).",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns:
        "Bardo, Espadachim, Feiticeiro, Guerreiro, Ladino, Mago, Sacerdote e Rúnico",
      description: "<p>Versáteis e ambiciosos.</p>",
    },
  },
  {
    name: "Juban",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 4, agilidade: 2, inteligencia: 3, vontade: 4 },
      habilidadeAutomatica: {
        nome: "Corpo Pesado",
        descricao:
          "+1d6 para não ser derrubado e para realizar Encontrões. Inapto em natação, escalada e salto. Levantar-se é uma Ação de Rodada Completa. Carga calculada com Força +2.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Paladino, Sacerdote e Guerreiro",
      description: "<p>Grandes homens-leão, fortes e honrados.</p>",
    },
  },
  {
    name: "Levent",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 2, agilidade: 3, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Asas Pesadas",
        descricao:
          "Pode voar (precisa de espaço para impulso). Deslocamento em voo é o dobro do normal. Dano de Encontrão em voo é duplicado.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Druida, Espadachim, Sacerdote, Xamã",
      description: "<p>Humanoides alados das montanhas.</p>",
    },
  },
  {
    name: "Mahok",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 5, agilidade: 2, inteligencia: 2, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Pele de Pedra",
        descricao:
          "+1d6 para evitar queda, resistir doenças/venenos, empurrar/segurar peso. Inapto em escalar, saltar, correr. Levantar é Ação Completa. Impossível nadar. Ataque desarmado = Força +2. Defesa +4 (Bônus de Armadura). Pele conta como Armadura Pesada. Não pode usar armaduras.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Druida, Guerreiro e Rúnico",
      description: "<p>Seres robustos com pele rochosa.</p>",
    },
  },
  {
    name: "Tailox",
    type: "raca",
    img: "icons/svg/mystery-man.svg",
    system: {
      atributos: { forca: 2, agilidade: 4, inteligencia: 3, vontade: 3 },
      habilidadeAutomatica: {
        nome: "Pernas Vulpinas",
        descricao:
          "+1d6 para saltar, correr e mover em silêncio. Deslocamento +1. Distância de salto +1 metro.",
        tipo: "suporte",
        categoria: "caracteristica",
        custo: 0,
      },
      classesComuns: "Bardo, Druida, Espadachim, Patrulheiro e Xamã",
      description: "<p>Povo raposa, ágeis e astutos.</p>",
    },
  },
];

export async function createRaces() {
  let createdRacesCount = 0;
  let createdAbilitiesCount = 0;

  for (const raceData of RACES_DATA) {
    // 1. Extract Ability Data
    const abilityInfo = raceData.system.habilidadeAutomatica;
    let abilityUuid = null;

    if (abilityInfo && abilityInfo.nome) {
      // Create the Ability Item
      const abilityData = {
        name: abilityInfo.nome,
        type: "habilidade",
        img: raceData.img, // Use same image for now
        system: {
          description: abilityInfo.descricao,
          tipo: abilityInfo.tipo || "suporte",
          categoria: abilityInfo.categoria || "caracteristica",
          custo: abilityInfo.custo || 0,
          requisitos: `Raça: ${raceData.name}`,
        },
      };

      const createdAbility = await Item.create(abilityData);
      if (createdAbility) {
        abilityUuid = createdAbility.uuid;
        createdAbilitiesCount++;
      }
    }

    // 2. Prepare Race Data
    const newRaceData = {
      ...raceData,
      system: {
        ...raceData.system,
        habilidadeUuid: abilityUuid, // Link the created ability
      },
    };

    // Remove the old embedded data to keep it clean
    // delete newRaceData.system.habilidadeAutomatica;

    // 3. Create Race Item
    await Item.create(newRaceData);
    createdRacesCount++;
  }

  ui.notifications.info(
    `Criadas ${createdRacesCount} Raças e ${createdAbilitiesCount} Habilidades Oficiais!`
  );
}
