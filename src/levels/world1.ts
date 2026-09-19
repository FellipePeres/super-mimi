import type { LevelSpec } from './schema'

/**
 * Mundo 1 — Riacho Calmo
 *
 * Objetivo de currículo: ler o plano cartesiano e dar comandos em sequência.
 * Nada de laços nem condições ainda — só `swim`, e a descoberta de que a
 * ordem dos comandos importa.
 */
export const WORLD_1: LevelSpec[] = [
  {
    id: '1-1',
    world: 1,
    index: 1,
    title: 'Primeiro mergulho',
    goal: 'Leve a Mimi até a flor em (4, 0).',
    teaches: 'O comando swim',
    briefing: [
      'O rio é um plano cartesiano. Cada casa tem um endereço: o primeiro número é o **X** (direita), o segundo é o **Y** (cima).',
      'A Mimi começa em (0, 0), o cantinho de baixo à esquerda. A flor está em (4, 0).',
      'O comando `swim(x, y)` diz **quantas casas andar**, não para onde ir. `swim(4, 0)` significa "ande 4 casas para a direita e 0 para cima".',
    ],
    hints: [
      {
        text: 'Um comando só resolve. O primeiro número é quantas casas para o lado, o segundo é quantas para cima.',
        code: 'swim(?, ?)',
      },
      {
        text: 'A flor está 4 casas à direita e nenhuma acima.',
        code: 'swim(4, 0)',
      },
    ],
    width: 6,
    height: 5,
    map: [
      '......',
      '......',
      '......',
      '......',
      '....*.',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim'],
    parLines: 1,
    starterCode: '// Escreva o comando e aperte Executar.\n',
  },

  {
    id: '1-2',
    world: 1,
    index: 2,
    title: 'Subindo o rio',
    goal: 'Suba até a flor em (0, 4).',
    teaches: 'O eixo Y',
    briefing: [
      'Agora a flor está **em cima**, não à direita.',
      'No plano cartesiano, o Y cresce para cima. Então subir é um Y positivo.',
      'Repare nos números na beirada do rio: eles mostram o X embaixo e o Y à esquerda.',
    ],
    hints: [
      {
        text: 'Desta vez o movimento é vertical. O que entra no lugar do segundo número?',
        code: 'swim(0, ?)',
      },
      {
        text: 'Zero casas para o lado, 4 para cima.',
        code: 'swim(0, 4)',
      },
    ],
    width: 6,
    height: 5,
    map: [
      '*.....',
      '......',
      '......',
      '......',
      '......',
    ],
    start: { x: 0, y: 0 },
    facing: 'north',
    allowed: ['swim'],
    parLines: 1,
    starterCode: '',
  },

  {
    id: '1-3',
    world: 1,
    index: 3,
    title: 'Na diagonal',
    goal: 'Chegue à flor em (4, 3).',
    teaches: 'Os dois eixos juntos',
    briefing: [
      'A flor está à direita **e** para cima. Dá para fazer tudo num comando só.',
      '`swim(4, 3)` anda 4 casas no X e depois 3 no Y — repare que a Mimi faz primeiro o movimento lateral e só depois sobe.',
      'Você também pode usar dois comandos separados, se preferir ver cada passo.',
    ],
    hints: [
      {
        text: 'Dá para resolver os dois eixos num comando só. Conte na régua de baixo e na da esquerda.',
        code: 'swim(?, ?)',
      },
      {
        text: 'Quatro para a direita, três para cima.',
        code: 'swim(4, 3)',
      },
    ],
    width: 6,
    height: 5,
    map: [
      '......',
      '....*.',
      '......',
      '......',
      '......',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim'],
    parLines: 1,
    starterCode: '',
  },

  {
    id: '1-4',
    world: 1,
    index: 4,
    title: 'Tem pedra no caminho',
    goal: 'Contorne a pedra e chegue em (4, 0).',
    teaches: 'Planejar a rota',
    briefing: [
      'Tem uma pedra bem no meio do caminho, em (2, 0). A Mimi não passa por dentro dela.',
      'Se você mandar nadar direto, ela bate e para — sem quebrar nada, mas sem chegar.',
      'A saída é dar a volta: suba, atravesse por cima da pedra e desça de novo.',
    ],
    hints: [
      {
        text: 'A pedra está na linha de baixo. Suba, atravesse por cima dela e desça.',
        code: 'swim(0, 1)   // sai da linha da pedra\nswim(?, 0)   // atravessa\nswim(0, -1)  // desce de volta',
      },
      {
        text: 'Três movimentos: subir, atravessar, descer.',
        code: 'swim(0, 1)\nswim(4, 0)\nswim(0, -1)',
      },
    ],
    width: 6,
    height: 5,
    map: [
      '......',
      '......',
      '......',
      '......',
      '..#.*.',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim'],
    parLines: 3,
    starterCode: '',
  },

  {
    id: '1-5',
    world: 1,
    index: 5,
    title: 'Sementes pelo caminho',
    goal: 'Pegue as 2 sementes e chegue à flor em (5, 2).',
    teaches: 'O comando collect',
    briefing: [
      'As bolinhas douradas são sementes. Elas valem a terceira estrela da fase.',
      'Passar por cima não basta: quando a Mimi estiver **em cima** da semente, use `collect()` para recolher.',
      'Repare que `collect()` tem os parênteses vazios — ele não precisa de nenhum número.',
    ],
    hints: [
      {
        text: 'Nade até ficar em cima da semente antes de chamar collect(). Depois siga para a próxima.',
        code: 'swim(?, 0)\ncollect()\nswim(?, 0)\ncollect()\nswim(0, ?)',
      },
      {
        text: 'As sementes estão em (2, 0) e (5, 0); a flor está em (5, 2).',
        code: 'swim(2, 0)\ncollect()\nswim(3, 0)\ncollect()\nswim(0, 2)',
      },
    ],
    width: 6,
    height: 5,
    map: [
      '......',
      '......',
      '.....*',
      '......',
      '......',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    seeds: [
      { x: 2, y: 0 },
      { x: 5, y: 0 },
    ],
    allowed: ['swim', 'collect'],
    parLines: 5,
    starterCode: '',
  },

  {
    id: '1-6',
    world: 1,
    index: 6,
    title: 'O grande S',
    goal: 'Atravesse as duas barreiras até a flor em (0, 5).',
    teaches: 'Sequência mais longa',
    briefing: [
      'Duas paredes de pedra cortam o rio, cada uma deixando a passagem de um lado.',
      'Não existe atalho: é preciso ir de um lado ao outro, subindo aos poucos.',
      'Antes de escrever, siga o caminho com o dedo na tela e anote quantas casas em cada trecho.',
    ],
    hints: [
      {
        text: 'São quatro trechos. Cada parede deixa a passagem de um lado só, então é subir, atravessar, subir e atravessar de volta.',
        code: 'swim(0, ?)   // sobe até passar a primeira parede\nswim(?, 0)   // atravessa o rio\nswim(0, ?)   // sobe de novo\nswim(?, ?)   // volta e chega na flor',
      },
      {
        text: 'O caminho completo até a flor em (0, 5).',
        code: 'swim(0, 2)\nswim(5, 0)\nswim(0, 2)\nswim(-5, 1)',
      },
    ],
    width: 7,
    height: 6,
    map: [
      '*......',
      '.......',
      '#####..',
      '.......',
      '..#####',
      '.......',
    ],
    start: { x: 0, y: 0 },
    facing: 'north',
    allowed: ['swim'],
    parLines: 4,
    starterCode: '',
  },
]
