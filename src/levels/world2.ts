import type { LevelSpec } from './schema'

/**
 * Mundo 2 — Corredeira
 *
 * Objetivo de currículo: perceber que repetir comandos à mão não escala.
 * O `parLines` aqui é a ferramenta pedagógica principal — ele torna a solução
 * "copiar e colar dez vezes" possível, mas não premiada.
 */
export const WORLD_2: LevelSpec[] = [
  {
    id: '2-1',
    world: 2,
    index: 1,
    title: 'Repita comigo',
    goal: 'Chegue à flor em (7, 0) usando poucas linhas.',
    teaches: 'O laço repeat',
    briefing: [
      'Dá para escrever `swim(1, 0)` sete vezes. Funciona — mas dá trabalho e enche o editor.',
      'O `repeat` faz o mesmo em duas linhas: `repeat(7) { swim(1, 0) }`.',
      'O número entre parênteses diz quantas vezes; tudo que estiver entre as chaves `{ }` se repete.',
    ],
    hints: [
      {
        text: 'Em vez de repetir swim(1, 0) sete vezes, diga quantas vezes repetir.',
        code: 'repeat(?) {\n  swim(1, 0)\n}',
      },
      {
        text: 'São sete casas até a flor.',
        code: 'repeat(7) {\n  swim(1, 0)\n}',
      },
    ],
    width: 8,
    height: 5,
    map: [
      '........',
      '........',
      '........',
      '........',
      '.......*',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat'],
    parLines: 3,
    starterCode: '',
  },

  {
    id: '2-2',
    world: 2,
    index: 2,
    title: 'A escada',
    goal: 'Suba a escada até a flor em (5, 5).',
    teaches: 'Repetir um padrão',
    briefing: [
      'O caminho é sempre o mesmo par de movimentos: uma casa para a direita, uma para cima.',
      'Quando um **padrão** se repete, ele cabe dentro de um `repeat` — não importa quantos comandos o padrão tenha.',
      'Dentro das chaves podem ir vários comandos, um por linha.',
    ],
    hints: [
      {
        text: 'O padrão que se repete tem dois comandos: um para o lado e um para cima.',
        code: 'repeat(?) {\n  swim(1, 0)\n  swim(0, 1)\n}',
      },
      {
        text: 'Cinco degraus, cada um com os dois movimentos.',
        code: 'repeat(5) {\n  swim(1, 0)\n  swim(0, 1)\n}',
      },
    ],
    width: 7,
    height: 6,
    // As pedras formam um corredor em degraus dos dois lados da diagonal:
    // subir antes de andar, ou andar antes de subir, esbarra na parede.
    map: [
      '....#*.',
      '...#..#',
      '..#..#.',
      '.#..#..',
      '#..#...',
      '..#....',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat'],
    parLines: 4,
    starterCode: '',
  },

  {
    id: '2-3',
    world: 2,
    index: 3,
    title: 'Até a outra margem',
    goal: 'Nade para a direita até a flor em (9, 0).',
    teaches: 'O laço while',
    briefing: [
      'O `while` repete **enquanto** uma condição for verdadeira, sem você contar as casas.',
      '`while (x < 9) { swim(1, 0) }` quer dizer: "enquanto o X for menor que 9, ande uma casa".',
      'O `x` é um sensor: ele sempre vale a coluna onde a Mimi está agora.',
    ],
    hints: [
      {
        text: 'O while repete enquanto a condição for verdadeira. O sensor x vale a coluna onde a Mimi está agora.',
        code: 'while (x < ?) {\n  swim(1, 0)\n}',
      },
      {
        text: 'Enquanto não chegar na coluna 9, avance uma casa.',
        code: 'while (x < 9) {\n  swim(1, 0)\n}',
      },
    ],
    width: 10,
    height: 5,
    map: [
      '..........',
      '..........',
      '..........',
      '..........',
      '.........*',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'x', 'y'],
    parLines: 3,
    starterCode: '',
  },

  {
    id: '2-4',
    world: 2,
    index: 4,
    title: 'Colheita em série',
    goal: 'Colete as 4 sementes e termine na flor em (8, 0).',
    teaches: 'Ação dentro do laço',
    briefing: [
      'As sementes estão espalhadas de duas em duas casas.',
      'Se o padrão "andar 2 e coletar" se repete, ele cabe num `repeat` — inclusive o `collect()`.',
      'Cuidado com a ordem: coletar antes de andar recolhe a casa errada.',
    ],
    hints: [
      {
        text: 'As sementes estão de duas em duas casas. Ande até a próxima e só então colete — coletar antes recolhe a casa errada.',
        code: 'repeat(?) {\n  swim(?, 0)\n  collect()\n}',
      },
      {
        text: 'Quatro sementes, duas casas entre cada uma.',
        code: 'repeat(4) {\n  swim(2, 0)\n  collect()\n}',
      },
    ],
    width: 9,
    height: 5,
    map: [
      '.........',
      '.........',
      '.........',
      '.........',
      '........*',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    seeds: [
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 6, y: 0 },
      { x: 8, y: 0 },
    ],
    allowed: ['swim', 'collect', 'repeat', 'while', 'x', 'y'],
    parLines: 4,
    starterCode: '',
  },

  {
    id: '2-5',
    world: 2,
    index: 5,
    title: 'Correnteza',
    goal: 'Atravesse a correnteza até a flor em (8, 4).',
    teaches: 'O rio também age',
    briefing: [
      'As faixas com setas são correnteza: ao parar nelas, a Mimi é **empurrada** uma casa a mais.',
      'Isso muda a conta. Um `repeat` com número fixo pode passar do ponto.',
      'O `while` se vira melhor aqui, porque ele olha onde a Mimi está de verdade a cada volta.',
    ],
    hints: [
      {
        text: 'Suba primeiro para a linha da flor. Depois use while: ele confere onde a Mimi está de verdade a cada volta, então a correnteza não estraga a conta.',
        code: 'swim(0, ?)        // sobe até a linha da flor\nwhile (x < ?) {\n  swim(1, 0)\n}',
      },
      {
        text: 'A flor está em (8, 4).',
        code: 'swim(0, 4)\nwhile (x < 8) {\n  swim(1, 0)\n}',
      },
    ],
    width: 9,
    height: 5,
    map: [
      '..~~~~..*',
      '.........',
      '.........',
      '.........',
      '.........',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    currents: [
      { x: 2, y: 4, dir: 'east' },
      { x: 3, y: 4, dir: 'east' },
      { x: 4, y: 4, dir: 'east' },
      { x: 5, y: 4, dir: 'east' },
    ],
    allowed: ['swim', 'repeat', 'while', 'x', 'y'],
    parLines: 4,
    starterCode: '',
  },

  {
    id: '2-6',
    world: 2,
    index: 6,
    title: 'A escadaria',
    goal: 'Suba os três degraus até a flor em (9, 6).',
    teaches: 'Laço dentro de laço',
    briefing: [
      'O caminho é uma escada de três degraus largos, e todos são iguais: três casas para a direita, duas para cima.',
      'Dentro de cada degrau também tem repetição — três passos, depois dois passos.',
      'Um `repeat` pode ficar **dentro** de outro: o de fora conta os degraus, o de dentro conta os passos de cada trecho.',
    ],
    hints: [
      {
        text: 'Três degraus iguais. Por fora, um repeat conta os degraus; por dentro, dois repeat contam os passos de cada trecho.',
        code: 'repeat(?) {\n  repeat(?) { swim(1, 0) }   // para a direita\n  repeat(?) { swim(0, 1) }   // para cima\n}',
      },
      {
        text: 'Três degraus de três casas para a direita e duas para cima.',
        code: 'repeat(3) {\n  repeat(3) { swim(1, 0) }\n  repeat(2) { swim(0, 1) }\n}',
      },
    ],
    width: 10,
    height: 7,
    // O corredor É a escada: tudo que não faz parte do caminho é pedra, então
    // o padrão de três degraus iguais é a única solução possível.
    map: [
      '#########*',
      '#########.',
      '######....',
      '######.###',
      '###....###',
      '###.######',
      '....######',
    ],
    start: { x: 0, y: 0 },
    facing: 'east',
    allowed: ['swim', 'repeat', 'while', 'turn', 'forward', 'x', 'y'],
    parLines: 8,
    starterCode: '',
  },
]
