import type { LevelSpec } from './schema'

/**
 * Mundo 4 — Foz Grande
 *
 * Objetivo de currículo: guardar valores (`let`) e criar comandos próprios
 * (`function`). É aqui que o aluno passa de "usar a linguagem" para
 * "ampliar a linguagem".
 */
export const WORLD_4: LevelSpec[] = [
  {
    id: '4-1',
    world: 4,
    index: 1,
    title: 'Guarde o número',
    goal: 'Use uma variável para chegar à flor em (6, 4).',
    teaches: 'O comando let',
    briefing: [
      'Uma variável é uma caixinha com nome: `let passos = 3` guarda o número 3 dentro de `passos`.',
      'Depois você usa o nome no lugar do número: `swim(passos, 0)`.',
      'A vantagem aparece quando o mesmo número se repete: muda num lugar só e vale para tudo.',
    ],
    hints: [
      {
        text: 'Guarde um número numa variável e use o nome dela no lugar do número. Dá até para fazer conta com ela.',
        code: 'let passos = ?\nswim(passos + ?, passos + ?)',
      },
      {
        text: 'A flor está em (6, 4).',
        code: 'let passos = 2\nswim(passos + 4, passos + 2)',
      },
    ],
    width: 7,
    height: 5,
    map: [
      '......*',
      '.......',
      '.......',
      '.......',
      '.......',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'if', 'else', 'let', 'x', 'y'],
    parLines: 4,
    starterCode: 'let passos = 2\n',
  },

  {
    id: '4-2',
    world: 4,
    index: 2,
    title: 'Contando sementes',
    goal: 'Colete as 5 sementes e chegue à flor em (9, 4).',
    teaches: 'Variável que muda',
    briefing: [
      'Uma variável pode mudar de valor no meio do programa: `total = total + 1`.',
      'Isso é o que chamamos de **contador** — ele acumula quantas vezes algo aconteceu.',
      'Use `say(total)` para a Mimi mostrar o valor num balãozinho e você conferir se a conta bate.',
    ],
    hints: [
      {
        text: 'Ande uma casa, colete e some 1 no contador. O if evita sair do rio na última semente.',
        code: 'let total = 0\nrepeat(?) {\n  swim(1, 0)\n  collect()\n  total = total + 1\n  if (x < ?) {\n    swim(1, 0)\n  }\n}\nswim(0, ?)',
      },
      {
        text: 'Cinco sementes, uma casa vazia entre cada uma, e a flor em (9, 4).',
        code: 'let total = 0\nrepeat(5) {\n  swim(1, 0)\n  collect()\n  total = total + 1\n  if (x < 9) {\n    swim(1, 0)\n  }\n}\nswim(0, 4)',
      },
    ],
    width: 10,
    height: 5,
    map: [
      '.........*',
      '..........',
      '..........',
      '..........',
      '..........',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    seeds: [
      { x: 1, y: 0 },
      { x: 3, y: 0 },
      { x: 5, y: 0 },
      { x: 7, y: 0 },
      { x: 9, y: 0 },
    ],
    allowed: ['swim', 'collect', 'repeat', 'while', 'if', 'else', 'let', 'say', 'x', 'y'],
    parLines: 8,
    starterCode: 'let total = 0\n',
  },

  {
    id: '4-3',
    world: 4,
    index: 3,
    title: 'Sua primeira função',
    goal: 'Crie um comando novo e chegue à flor em (6, 6).',
    teaches: 'O comando function',
    briefing: [
      'Uma função é um comando que **você** inventa: `function degrau() { swim(1, 0) swim(0, 1) }`.',
      'Depois de criada, use como qualquer outro comando: escreva `degrau()` e tudo lá dentro acontece.',
      'Dar nome a um pedaço de código é a forma mais simples de deixar o programa legível.',
    ],
    hints: [
      {
        text: 'Dê um nome ao par de movimentos que se repete. Depois é só chamar esse nome quantas vezes precisar.',
        code: 'function degrau() {\n  swim(1, 0)\n  swim(0, 1)\n}\nrepeat(?) {\n  degrau()\n}',
      },
      {
        text: 'São seis degraus até a flor em (6, 6).',
        code: 'function degrau() {\n  swim(1, 0)\n  swim(0, 1)\n}\nrepeat(6) {\n  degrau()\n}',
      },
    ],
    width: 8,
    height: 7,
    // Mesmo corredor em degraus da fase 2-2, agora com seis lances.
    map: [
      '.....#*.',
      '....#..#',
      '...#..#.',
      '..#..#..',
      '.#..#...',
      '#..#....',
      '..#.....',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'if', 'else', 'let', 'function', 'x', 'y'],
    parLines: 7,
    starterCode: 'function degrau() {\n  \n}\n',
  },

  {
    id: '4-4',
    world: 4,
    index: 4,
    title: 'Função com parâmetro',
    goal: 'Use uma função que recebe um número e chegue em (8, 5).',
    teaches: 'Parâmetros',
    briefing: [
      'Uma função pode receber um valor: `function avancar(n) { swim(n, 0) }`.',
      'O `n` é um **parâmetro** — um espaço em branco que se preenche na hora de chamar: `avancar(3)`.',
      'Assim uma função só resolve vários casos, em vez de você escrever uma para cada número.',
    ],
    hints: [
      {
        text: 'O n entre parênteses é um espaço em branco que você preenche na hora de chamar. Assim uma função só serve para qualquer distância.',
        code: 'function andar(n) {\n  swim(n, 0)\n}\nfunction subir(n) {\n  swim(0, n)\n}\nandar(?)\nsubir(?)',
      },
      {
        text: 'A borda de baixo e a coluna 8 estão livres até a flor em (8, 5).',
        code: 'function andar(n) {\n  swim(n, 0)\n}\nfunction subir(n) {\n  swim(0, n)\n}\nandar(8)\nsubir(5)',
      },
    ],
    width: 9,
    height: 6,
    map: [
      '....#...*',
      '....#....',
      '.#..#....',
      '.#..#....',
      '.#.......',
      '.........',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'if', 'else', 'let', 'function', 'x', 'y'],
    parLines: 10,
    starterCode: 'function andar(n) {\n  swim(n, 0)\n}\n',
  },

  {
    id: '4-5',
    world: 4,
    index: 5,
    title: 'Tudo junto',
    goal: 'Colete as 3 sementes e chegue à flor em (9, 5).',
    teaches: 'Combinar tudo',
    briefing: [
      'Esta fase junta tudo: sequência, laço, condição, variável e função.',
      'Comece dividindo o problema em partes e dê um nome de função para cada parte.',
      'Um programa bom não é o mais curto — é o que se entende ao ler em voz alta.',
    ],
    hints: [
      {
        text: 'Pegue uma semente de cada vez, voltando para a linha de baixo quando precisar atravessar — ela é a única sempre livre.',
        code: 'swim(0, ?)\nswim(?, 0)\ncollect()\nswim(?, ?)\ncollect()\nswim(0, ?)\nswim(?, 0)\ncollect()\nswim(?, ?)',
      },
      {
        text: 'As sementes estão em (2, 2), (5, 4) e (8, 1); a flor em (9, 5).',
        code: 'swim(0, 2)\nswim(2, 0)\ncollect()\nswim(3, 2)\ncollect()\nswim(0, -3)\nswim(3, 0)\ncollect()\nswim(1, 4)',
      },
    ],
    width: 10,
    height: 6,
    map: [
      '.........*',
      '...#...#..',
      '...#...#..',
      '.......#..',
      '...#......',
      '..........',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    seeds: [
      { x: 2, y: 2 },
      { x: 5, y: 4 },
      { x: 8, y: 1 },
    ],
    allowed: [
      'swim', 'collect', 'repeat', 'while', 'if', 'else', 'let',
      'function', 'canSwim', 'front', 'face', 'turn', 'forward', 'say', 'x', 'y',
    ],
    parLines: 18,
    starterCode: '',
  },

  {
    id: '4-6',
    world: 4,
    index: 6,
    title: 'A grande travessia',
    goal: 'Cruze a foz inteira até a flor em (11, 6).',
    teaches: 'O desafio final',
    briefing: [
      'A foz é larga, tem correnteza, troncos e pedras. Nenhuma rota decorada sobrevive até o fim.',
      'Escreva regras, não caminhos: a Mimi precisa saber o que fazer diante de cada obstáculo.',
      'Se chegou até aqui, você já sabe tudo que precisa. Vá com calma e teste em passo a passo.',
    ],
    hints: [
      {
        text: 'A linha de baixo atravessa a foz inteira sem obstáculo. Use ela como estrada: desça, atravesse, suba para pegar cada coisa.',
        code: 'swim(?, 0)\nswim(0, ?)\ncollect()\nswim(0, ?)\nswim(?, 0)\nswim(0, ?)\ncollect()\nswim(0, ?)\nswim(?, 0)   // a correnteza empurra o resto',
      },
      {
        text: 'Repare no último passo: a correnteza em (10, 6) empurra a Mimi para dentro da flor sozinha.',
        code: 'swim(3, 0)\nswim(0, 3)\ncollect()\nswim(0, -3)\nswim(6, 0)\nswim(0, 2)\ncollect()\nswim(0, 4)\nswim(1, 0)',
      },
    ],
    width: 12,
    height: 7,
    map: [
      '..........~*',
      '....#.....~.',
      '..=.#..=....',
      '....#.......',
      '..#....=..#.',
      '....~~~.....',
      '............',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    currents: [
      { x: 4, y: 1, dir: 'east' },
      { x: 5, y: 1, dir: 'east' },
      { x: 6, y: 1, dir: 'east' },
      { x: 10, y: 5, dir: 'north' },
      { x: 10, y: 6, dir: 'east' },
    ],
    seeds: [
      { x: 3, y: 3 },
      { x: 9, y: 2 },
    ],
    allowed: [
      'swim', 'collect', 'repeat', 'while', 'if', 'else', 'let', 'function',
      'canSwim', 'front', 'left', 'right', 'dive', 'face', 'turn', 'forward',
      'say', 'onLily', 'x', 'y',
    ],
    parLines: 24,
    starterCode: '',
  },
]
