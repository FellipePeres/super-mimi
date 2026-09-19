# Guia de arte — Super Mimi

Este é o passo a passo para gerar as imagens da Mimi e do Pipe num gerador de
imagem por IA, e onde colocá-las no projeto.

**O jogo já funciona sem estas imagens.** Enquanto os arquivos não existirem,
as tartarugas são desenhadas em vetor pelo próprio código. Quando você colocar
os PNGs em `src/render/sprites/`, eles entram no lugar automaticamente — não é
preciso mexer em nenhuma linha.

---

## 1. Os 8 arquivos

Você **não** gera a direção oeste: o jogo espelha a imagem do leste.

| # | Arquivo | Quem | Pose |
|---|---|---|---|
| 1 | `mimi-south.png` | Mimi | Nadando em direção a você (sul) |
| 2 | `mimi-north.png` | Mimi | Nadando para longe, de costas (norte) |
| 3 | `mimi-east.png` | Mimi | De perfil, nadando para a direita (leste) |
| 4 | `mimi-portrait.png` | Mimi | Retrato de menu — em pé, acenando |
| 5 | `pipe-south.png` | Pipe | Igual ao #1 |
| 6 | `pipe-north.png` | Pipe | Igual ao #2 |
| 7 | `pipe-east.png` | Pipe | Igual ao #3 |
| 8 | `pipe-portrait.png` | Pipe | Igual ao #4 |

Destino: **`src/render/sprites/`** (a pasta já existe).

---

## 2. Regras técnicas

Se alguma destas falhar, a animação sai errada:

- **PNG com transparência real.** Nada de fundo branco. Confira abrindo a
  imagem sobre um fundo escuro.
- **1024 × 1024 px**, quadrado.
- **Personagem centralizado**, ocupando ~80% do quadro. O jogo usa o centro da
  imagem como eixo de rotação — se a tartaruga estiver deslocada, ela gira
  torta.
- **Mesmo tamanho aparente** nas três poses de jogo (`south`, `north`, `east`).
  Se uma sair maior, a tartaruga "cresce" ao virar.
- **Sem sombra, sem água, sem cenário, sem moldura, sem texto.** A sombra e o
  reflexo são desenhados pelo jogo.

---

## 3. O prompt

Um prompt é montado com **três blocos**: estilo + personagem + pose.

### Bloco 1 — estilo (vai em todas as gerações)

```
cute cartoon turtle character, chibi proportions, big expressive eyes,
soft rounded shapes, flat vector illustration with smooth cel shading,
thick soft dark-teal outline, children's mobile game asset,
bright cheerful palette, top-down three-quarter view (camera above,
tilted about 35 degrees), centered in frame, full body visible,
isolated on a fully transparent background, no shadow, no background,
no scenery, no text, high resolution, crisp clean edges
```

**Negative prompt** (se o gerador aceitar):

```
realistic, photorealistic, 3d render, human, background, water, scenery,
ground shadow, text, watermark, logo, multiple characters, cropped limbs,
blurry, soft focus, gradient background, white background, checkerboard
```

### Bloco 2 — personagem

**MIMI:**
```
lime-green shell with a soft yellow-green hexagon pattern, cream-yellow
belly, rosy pink cheeks, long eyelashes, friendly open smile, wearing a
big pink ribbon bow on top of her head, human-like arms and legs
(four limbs, soft rounded paws), sweet cheerful expression
```

**PIPE:**
```
deep sea-green / olive shell with a darker hexagon pattern, sandy-beige
belly, confident grin, wearing black sunglasses with a subtle blue
reflection, human-like arms and legs (four limbs, soft rounded paws),
cool relaxed expression
```

### Bloco 3 — pose

**SOUTH** — comece por esta, é a mais importante:
```
POSE: seen from above and slightly in front, swimming toward the viewer.
Head points toward the bottom of the frame and the face is fully visible,
looking at the camera. Shell seen from above. Both arms spread out to the
sides mid-stroke, both legs kicking behind, slightly apart.
```

**NORTH:**
```
POSE: seen from directly above, swimming away from the viewer. The back of
the shell fills the frame, head points toward the top of the frame, only
the back of the head is visible. The pink bow / the sunglasses temple arm
must still be clearly readable from behind. Both arms spread to the sides
mid-stroke, legs kicking toward the bottom of the frame.
```

**EAST:**
```
POSE: seen from above, swimming to the right. Body in profile facing the
right edge of the frame, head at the right, tail at the left. Near arm
reaching forward, far arm pulled back, both legs kicking. The bow /
sunglasses clearly readable in profile.
```

**PORTRAIT** — atenção, esta **não** é vista de cima. Troque a linha
`top-down three-quarter view (...)` do bloco 1 por
`front three-quarter view at eye level`:
```
POSE: front three-quarter view at eye level, standing upright on two legs
like a game mascot, full body from head to feet, one hand waving cheerfully
at the viewer, big happy smile, playful bouncy stance.
Character-select portrait.
```

---

## 4. Ordem de geração

Consistência entre imagens de IA é a parte que costuma dar errado. Esta ordem
existe para evitar isso:

1. Gere **`mimi-south`** e repita até ficar do jeito que você quer. Ela vira a
   **referência mestra**.
2. **Na mesma conversa do gerador**, anexe a `mimi-south` como referência e
   gere `mimi-north` e `mimi-east`, pedindo "mesmo personagem, mesma escala,
   mesmo estilo, pose nova".
3. Gere `mimi-portrait` do mesmo jeito.
4. Gere `pipe-south` anexando a `mimi-south` como referência de **estilo**:
   "mesmo estilo de arte e mesma escala, personagem diferente: ...".
5. Repita os passos 2 e 3 para o Pipe.

---

## 5. Opcional: remada de verdade

Sem custo extra de geração — continuam sendo 8 arquivos. Peça cada pose de
jogo como **dois quadros lado a lado numa imagem só**:

```
Render this as a 2-frame sprite sheet, the two frames side by side on one
transparent canvas, identical character at identical scale and identical
vertical position in both. Frame 1: arms reaching forward, legs together.
Frame 2: arms pulled back, legs spread apart. Equal margins, clean gap
between frames.
```

O jogo detecta sozinho: se a imagem for cerca de duas vezes mais larga que
alta, ele fatia nos dois quadros e alterna entre eles conforme a Mimi nada.

**Risco zero:** se os dois quadros saírem inconsistentes, é só usar a versão
de pose única. Nada quebra.

---

## 6. Antes de colocar na pasta

- [ ] Fundo transparente confirmado sobre fundo escuro
- [ ] As três poses de jogo com o mesmo tamanho de personagem
- [ ] Personagem centralizado, sem membro cortado pela borda
- [ ] Laço rosa da Mimi visível nas três poses, inclusive de costas
- [ ] Óculos do Pipe visíveis nas três poses
- [ ] Nomes de arquivo exatamente como na tabela da seção 1

Depois é só copiar para `src/render/sprites/` e recarregar a página.

---

## 7. O que você **não** precisa gerar

Tudo isto é desenhado e animado pelo código, em tempo real:

água e ondulação · reflexos de luz no fundo do rio · vitórias régias (folha e
flor) · pedras · troncos · juncos de margem · bolhas · espuma e esteira ·
sombra na água · sementes douradas · grade e eixos cartesianos · correnteza ·
ícone do app · toda a interface.
