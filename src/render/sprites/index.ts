/// <reference types="vite/client" />

/**
 * Descoberta automática da arte dos personagens.
 *
 * Mesma ideia do áudio: o Vite resolve este glob em tempo de build, então o
 * jogo só tenta carregar arquivos que realmente existem. Com a pasta vazia,
 * as tartarugas são desenhadas em vetor e **nenhuma requisição é feita** — sem
 * 404 no console e sem o service worker devolver a página HTML no lugar de uma
 * imagem, que quebrava o renderizador.
 *
 * Para usar arte própria, coloque aqui os PNGs com estes nomes:
 *
 *   mimi-south   mimi-north   mimi-east   mimi-portrait
 *   pipe-south   pipe-north   pipe-east   pipe-portrait
 *
 * Não existe `west`: o jogo espelha o `east`. Veja `ARTE.md` na raiz.
 */
const discovered = import.meta.glob('./*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const SPRITES = new Map<string, string>()

for (const [path, url] of Object.entries(discovered)) {
  const name = path.split('/').pop()?.replace(/\.png$/, '')
  if (name) SPRITES.set(name, url)
}

/** URL do sprite, ou `undefined` se esse arquivo não foi adicionado. */
export function spriteUrl(name: string): string | undefined {
  return SPRITES.get(name)
}

/** True quando existe arte para o personagem inteiro (as três direções). */
export function hasGameArt(character: string): boolean {
  return ['south', 'north', 'east'].every((dir) => SPRITES.has(`${character}-${dir}`))
}
