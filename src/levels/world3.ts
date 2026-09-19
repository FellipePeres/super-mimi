import type { LevelSpec } from './schema'

/**
 * Mundo 3 — Brejo das Sombras
 *
 * Objetivo de currículo: a Mimi decide sozinha. Aqui entram os sensores
 * (`front`, `canSwim`) e o `if / else`.
 *
 * O salto conceitual do mundo é este: até agora o aluno dizia o caminho; a
 * partir daqui ele escreve uma *regra* que descobre o caminho.
 */
export const WORLD_3: LevelSpec[] = [
  {
    id: '3-1',
    world: 3,
    index: 1,
    title: 'Olhe antes de nadar',
    goal: 'Desvie da pedra escondida e chegue em (5, 0).',
    teaches: 'O comando if',
    briefing: [
      'O `if` faz uma pergunta antes de agir: `if (condição) { ... }`.',
      '`canSwim(1, 0)` responde `true` se dá para nadar uma casa à direita, e `false` se tem algo no caminho.',
      'Junte os dois: "se der para ir à direita, vá; senão, suba".',
    ],
    hints: [
      {
        text: 'Pergunte antes de agir: se dá para ir à direita, vá; se não dá, suba. No fim, desça de volta para a linha da flor.',
        code: 'while (x < ?) {\n  if (canSwim(1, 0)) {\n    swim(1, 0)\n  } else {\n    swim(0, ?)\n  }\n}\nwhile (y > 0) {\n  swim(0, -1)\n}',
      },
      {
        text: 'A regra desvia sozinha da pedra escondida.',
        code: 'while (x < 5) {\n  if (canSwim(1, 0)) {\n    swim(1, 0)\n  } else {\n    swim(0, 1)\n  }\n}\nwhile (y > 0) {\n  swim(0, -1)\n}',
      },
    ],
    width: 6,
    height: 5,
    map: [
      '......',
      '......',
      '......',
      '......',
      '..#..*',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'if', 'else', 'canSwim', 'x', 'y'],
    parLines: 8,
    starterCode: '',
  },

  {
    id: '3-2',
    world: 3,
    index: 2,
    title: 'Desvio automático',
    goal: 'Atravesse o campo de pedras até (7, 0).',
    teaches: 'if dentro de while',
    briefing: [
      'Agora são várias pedras, em posições diferentes. Contar casas não funciona mais.',
      'A regra é sempre a mesma: se dá para seguir em frente, siga; se não dá, contorne por cima.',
      'Coloque o `if` dentro de um `while` e deixe a regra rodar até o fim do rio.',
    ],
    hints: [
      {
        text: 'É a mesma regra da fase anterior. Se ela estiver certa, funciona para qualquer quantidade de pedras — só muda onde parar.',
        code: 'while (x < ?) {\n  if (canSwim(1, 0)) {\n    swim(1, 0)\n  } else {\n    swim(0, 1)\n  }\n}\nwhile (y > 0) {\n  swim(0, -1)\n}',
      },
      {
        text: 'A flor está em (7, 0).',
        code: 'while (x < 7) {\n  if (canSwim(1, 0)) {\n    swim(1, 0)\n  } else {\n    swim(0, 1)\n  }\n}\nwhile (y > 0) {\n  swim(0, -1)\n}',
      },
    ],
    width: 8,
    height: 5,
    map: [
      '........',
      '........',
      '........',
      '........',
      '..#.#.#*',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'if', 'else', 'canSwim', 'x', 'y'],
    parLines: 12,
    starterCode: '',
  },

  {
    id: '3-3',
    world: 3,
    index: 3,
    title: 'Pedra ou água?',
    goal: 'Use o sensor de frente para chegar em (0, 5).',
    teaches: 'O sensor front',
    briefing: [
      'O sensor `front` diz o **nome** do que está logo à frente da Mimi: `"water"`, `"rock"`, `"lily"` ou `"edge"`.',
      'Compare com `==` (dois sinais de igual), assim: `if (front == "rock") { ... }`.',
      'Um `=` sozinho serve para guardar um valor numa variável; para comparar são sempre dois.',
    ],
    hints: [
      {
        text: 'Aponte a Mimi para cima e suba enquanto der. Quando front disser que tem pedra, dê um passo para o lado. No fim, volte para a coluna 0.',
        code: 'face("north")\nwhile (y < ?) {\n  if (front == "rock") {\n    swim(1, 0)\n  } else {\n    swim(0, 1)\n  }\n}\nwhile (x > 0) {\n  swim(-1, 0)\n}',
      },
      {
        text: 'A flor está em (0, 5), no alto à esquerda.',
        code: 'face("north")\nwhile (y < 5) {\n  if (front == "rock") {\n    swim(1, 0)\n  } else {\n    swim(0, 1)\n  }\n}\nwhile (x > 0) {\n  swim(-1, 0)\n}',
      },
    ],
    width: 6,
    height: 6,
    map: [
      '*.....',
      '#.....',
      '......',
      '.#....',
      '......',
      '......',
    ],
    start: { x: 0, y: 0 },
    facing: 'north',
    allowed: [
      'swim', 'repeat', 'while', 'if', 'else',
      'canSwim', 'front', 'face', 'turn', 'forward', 'x', 'y',
    ],
    parLines: 12,
    starterCode: '',
  },

  {
    id: '3-4',
    world: 3,
    index: 4,
    title: 'Por baixo do tronco',
    goal: 'Mergulhe sob os troncos e chegue em (7, 2).',
    teaches: 'O comando dive',
    briefing: [
      'Troncos boiam na superfície e bloqueiam a passagem — mas a Mimi é tartaruga, ela mergulha.',
      '`dive()` passa por baixo do tronco que estiver **bem à frente**, caindo na casa seguinte.',
      'Use `front == "log"` para saber quando mergulhar e quando simplesmente nadar.',
    ],
    hints: [
      {
        text: 'Uma regra só: se o que está à frente for tronco, mergulhe; se não for, siga em frente.',
        code: 'while (x < ?) {\n  if (front == "log") {\n    dive()\n  } else {\n    forward(1)\n  }\n}',
      },
      {
        text: 'A flor está em (7, 2), na mesma linha do começo.',
        code: 'while (x < 7) {\n  if (front == "log") {\n    dive()\n  } else {\n    forward(1)\n  }\n}',
      },
    ],
    width: 8,
    height: 5,
    map: [
      '........',
      '........',
      '..=..=.*',
      '........',
      '........',
    ],
    start: { x: 0, y: 2 },
    facing: 'east',
    allowed: [
      'swim', 'repeat', 'while', 'if', 'else',
      'canSwim', 'front', 'dive', 'forward', 'face', 'turn', 'x', 'y',
    ],
    parLines: 10,
    starterCode: '',
  },

  {
    id: '3-5',
    world: 3,
    index: 5,
    title: 'O labirinto do brejo',
    goal: 'Encontre a saída até a flor em (6, 5).',
    teaches: 'Decisão com vários casos',
    briefing: [
      'O brejo tem corredores estreitos. Em cada cruzamento existe mais de uma escolha.',
      'Use `else if` para testar um caso depois do outro: primeiro tente em frente, depois para cima, depois para o lado.',
      'A ordem dos testes muda o caminho que a Mimi encontra.',
    ],
    hints: [
      {
        text: 'A linha de baixo está livre até o fim. Vá até a coluna que sobe sem parede e siga por ela.',
        code: 'swim(?, 0)   // atravessa pela linha de baixo\nswim(0, ?)   // sobe pela coluna livre\nswim(?, 0)   // entra na flor',
      },
      {
        text: 'O corredor livre é a coluna 5.',
        code: 'swim(5, 0)\nswim(0, 5)\nswim(1, 0)',
      },
    ],
    width: 7,
    height: 6,
    // A borda direita é fechada em y=2 e y=4, então subir pela lateral não
    // resolve: o caminho passa obrigatoriamente pela coluna 5.
    map: [
      '..#...*',
      '..#.#.#',
      '....#..',
      '.####.#',
      '....#..',
      '.......',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: [
      'swim', 'repeat', 'while', 'if', 'else',
      'canSwim', 'front', 'left', 'right', 'face', 'turn', 'forward', 'x', 'y',
    ],
    parLines: 16,
    starterCode: '',
  },

  {
    id: '3-6',
    world: 3,
    index: 6,
    title: 'Siga a parede',
    goal: 'Contorne a ilha de pedras até a flor em (8, 4).',
    teaches: 'Regra geral, não rota fixa',
    briefing: [
      'Esta é a fase que separa "decorar o caminho" de "escrever uma regra".',
      'A técnica clássica de labirinto: mantenha uma das mãos sempre na parede e siga em frente.',
      'Se a regra estiver certa, ela funciona para qualquer ilha — não só para esta.',
    ],
    hints: [
      {
        text: 'A ilha de pedras não chega nas bordas. Contorne por fora: vá até o fim pela linha de baixo e depois suba.',
        code: 'swim(?, 0)\nswim(0, ?)',
      },
      {
        text: 'A flor está em (8, 2), do outro lado da ilha.',
        code: 'swim(8, 0)\nswim(0, 2)',
      },
    ],
    width: 9,
    height: 5,
    map: [
      '.........',
      '..#####..',
      '..#####.*',
      '..#####..',
      '.........',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: [
      'swim', 'repeat', 'while', 'if', 'else',
      'canSwim', 'front', 'left', 'right', 'face', 'turn', 'forward', 'x', 'y',
    ],
    parLines: 16,
    starterCode: '',
  },
]
