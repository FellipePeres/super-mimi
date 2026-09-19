# Sons do Super Mimi

Os arquivos desta pasta são descobertos automaticamente em tempo de build e
ligados ao momento certo do jogo. Para trocar um som, basta substituir o
arquivo — nenhuma linha de código muda. Extensões aceitas: `.mp3`, `.ogg`,
`.wav`, `.m4a`.

## O que está instalado

| Arquivo | Quando toca | Nível |
|---|---|---|
| `splash.mp3` | cada braçada | −20,4 LUFS |
| `dive.mp3` | mergulho sob tronco | −18,4 LUFS |
| `collect.mp3` | recolheu semente | −17,4 LUFS |
| `star.mp3` | cada estrela revelada na vitória | −17,4 LUFS |
| `win.mp3` | venceu a fase | −15,4 LUFS |
| `error.mp3` | erro no código | −20,4 LUFS |
| `click.mp3` | botões da interface **e** escolha de personagem | −23,9 LUFS |
| `ambient.mp3` | trilha do rio, em loop de 45 s | −26,3 LUFS |

Os níveis não são iguais de propósito: som que toca muito é mais baixo, som de
recompensa é mais alto. Todos foram normalizados a partir dos originais, que
chegaram com 22 dB de diferença entre o mais alto e o mais baixo.

## O que ainda falta

- **`bump`** — o baque de bater numa pedra, tronco ou junco. Sem ele, colidir
  fica mudo. É o único som ausente que o jogo realmente usa.
- **`hop`** — o pulinho na vitória régia. Deixado de fora de propósito; o
  comando `hop()` quase não aparece nas fases.

Para adicionar, é só colocar `bump.mp3` nesta pasta.

## Silêncio no início: o erro que parece bug de código

Todos os arquivos daqui foram aparados para começarem em ~3 ms. O original do
clique tinha **538 ms de silêncio** antes do som — o que se ouvia como "o
clique está atrasado" era literalmente meio segundo de nada tocando primeiro.
O `dive` tinha 228 ms.

Se você trocar um arquivo e o som parecer lento, olhe o começo dele antes de
procurar o problema no código. Nenhum ajuste de programação compensa silêncio
gravado dentro do arquivo.

## Casos especiais

**`click` serve a dois papéis.** A escolha de personagem usa o mesmo arquivo do
clique de interface, com mais presença (veja `select` em `MIX`, dentro de
`../sfx.ts`). Isso evita duplicar os mesmos bytes no bundle. Se um dia quiser
sons distintos, basta colocar um `select.mp3` aqui — ele passa a ter
precedência sobre o apelido automaticamente.

**O `ambient` é um loop costurado.** Foi recortado de uma gravação de 30 min
(23 MB) para 45 s (440 KB), num trecho escolhido por ser o mais estável da
gravação. Os 4 s finais entram por cima dos 4 s iniciais com meia curva de
seno, então a volta do loop não tem emenda audível. Se trocar este arquivo por
outro sem esse tratamento, provavelmente vai ouvir um clique a cada volta.

## Volume

Quem joga regula tudo no controle de som da barra do topo, que tem dois
sliders independentes: **Música do rio** e **Efeitos**. Eles ficam salvos entre
as sessões.

Os padrões estão em `DEFAULT_VOLUME_AMBIENT` (30%) e `DEFAULT_VOLUME_EFFECTS`
(70%), no topo de `../sfx.ts`. A trilha entra bem mais baixa de propósito: ela
toca o tempo todo e só precisa estar presente, não audível.

Para ajustar **um som específico** em relação aos outros, use a tabela `MIX`
no mesmo arquivo — ela multiplica o volume daquele som dentro do barramento de
efeitos. Hoje carrega dois ajustes: `splash` a 0,85 (por tocar muito) e
`select` a 1,45 (por ser o mesmo arquivo do clique, mas precisar de mais
presença). Mexa aqui antes de reeditar um arquivo.

## Onde cuidar

`splash` dispara uma vez por casa percorrida — num `repeat(20)` toca vinte
vezes seguidas. Se trocar este som, teste numa fase do Mundo 2 antes de
decidir.
