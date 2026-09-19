# Super Mimi

Jogo web que ensina lógica de programação. O jogador escreve comandos de
verdade — `if`, `else`, `while`, `repeat`, funções — e a tartaruga **Mimi**
(ou **Pipe**) nada pelo rio até as vitórias régias.

O rio é um plano cartesiano com eixos numerados na tela: `swim(2, 1)` anda
duas casas para a direita e uma para cima, e dá para conferir isso contando
na régua.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 354 testes
npm run build    # build de produção com PWA
```

## Os dois modos

**Fases** — 24 fases em 4 mundos, cada um com um conceito:

| Mundo | Tema | Ensina |
|---|---|---|
| 1 · Riacho Calmo | águas rasas | sequência, coordenadas X/Y |
| 2 · Corredeira | correnteza e pedras | `repeat`, `while`, laço aninhado |
| 3 · Brejo das Sombras | troncos e labirinto | `if / else`, sensores, `dive` |
| 4 · Foz Grande | rio largo | variáveis, funções, parâmetros |

Cada fase dá até 3 estrelas: chegar, caber no limite de linhas e coletar todas
as sementes. A barra de comandos do topo mostra **só** o que a fase liberou —
a progressão do currículo é também a progressão da interface.

Toda fase tem duas dicas, atrás do botão de lâmpada. A primeira mostra o
formato do código com lacunas (`swim(?, ?)`); a segunda entrega a solução, e
só aparece depois de uma confirmação. A solução de cada fase é a mesma que o
`solutions.test.ts` executa, então o código mostrado ao aluno é sempre um que
comprovadamente vence.

**Livre** — rio aberto, todos os comandos liberados, sem objetivo nem estrelas.
O código fica salvo entre as visitas.

## Como está organizado

```
src/
├─ lang/        MimiScript: tokenizer → parser → interpretador
├─ engine/      regras do jogo (World) e execução (Runner)
├─ render/      camadas Pixi: água, grade, tiles, tartaruga, partículas
├─ levels/      as 24 fases, declarativas
├─ ui/          React: telas, editor, barra de comandos, modais
└─ app/         estado (Zustand) e a cola entre motor, desenho e interface
```

Três fronteiras sustentam o resto:

**O interpretador não sabe desenhar.** Ele é um generator que emite eventos
(`swim`, `blocked`, `collect`…). Quem consome decide o ritmo — e é daí que
saem play, pause, passo a passo e controle de velocidade, sem código extra.

**O motor não sabe que existe tela.** `World` recebe ações e devolve eventos,
então as regras são testáveis sem DOM. `GameStage` é o único lugar que conhece
os dois lados.

**Só um arquivo inverte o eixo Y.** O jogo inteiro pensa em cartesiano, com Y
crescendo para cima; a conversão para pixels mora em `render/coords.ts`. Se
essa regra vazar, o aluno vê um eixo Y que mente.

## Erros são material didático

Nenhuma mensagem de erro é um stack trace. Cada uma traz linha, o que
aconteceu em português e uma dica que ensina a regra:

```
Linha 4 — usei `=` para comparar, mas `=` serve para guardar um valor
💡 Para comparar dois valores use `==`. Um `=` sozinho serve para guardar
   um valor numa variável.
```

## Testes

```
mimiscript.test.ts   39 · cada construção da linguagem e cada erro didático
levels.test.ts      194 · mapas consistentes, flor e sementes alcançáveis (BFS)
solutions.test.ts   121 · resolve as 24 fases com MimiScript real até vencer
```

O `solutions.test.ts` é o que garante o currículo: para cada fase existe uma
solução de referência que precisa vencer, caber no limite de linhas e usar
apenas comandos liberados naquela fase.

## Arte

As tartarugas são desenhadas em vetor pelo código e o jogo funciona assim.
Para trocar por arte própria, veja **[ARTE.md](ARTE.md)** — ele traz os prompts
prontos, as 8 imagens necessárias e onde colocá-las. Nenhuma linha de código
muda.

## Som

Os arquivos vivem em `src/audio/files/` e são descobertos automaticamente em
tempo de build — trocar um som é trocar o arquivo, sem mexer em código. O
equilíbrio entre eles está normalizado por papel: o que toca muito é mais
baixo, o que recompensa é mais alto. Detalhes e o que ainda falta em
[src/audio/files/LEIA-ME.md](src/audio/files/LEIA-ME.md).
