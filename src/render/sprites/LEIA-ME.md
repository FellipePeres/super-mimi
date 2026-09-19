# Arte dos personagens

Esta pasta está vazia de propósito: as tartarugas são desenhadas em vetor pelo
próprio código, e é assim que o jogo funciona hoje.

Se quiser trocar por arte própria, coloque aqui os PNGs com exatamente estes
nomes:

| Arquivo | Pose |
|---|---|
| `mimi-south.png` | nadando em direção ao observador |
| `mimi-north.png` | nadando para longe, de costas |
| `mimi-east.png` | de perfil, nadando para a direita |
| `mimi-portrait.png` | retrato de menu, em pé |
| `pipe-*.png` | as mesmas quatro poses |

Não existe `west`: o jogo espelha o `east`.

O carregamento é automático — nenhuma linha de código muda. Enquanto um
arquivo não existir, aquela peça continua sendo desenhada em vetor, e nenhuma
requisição é feita por ela.

As especificações (tamanho, transparência, enquadramento) e os prompts prontos
para gerar a arte estão em `ARTE.md`, na raiz do projeto.
