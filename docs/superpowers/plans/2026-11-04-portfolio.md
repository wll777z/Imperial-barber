# Galeria Imperial Barber — plano de implementação

> Execução: Superpowers executing-plans, no projeto existente.

**Objetivo:** adicionar Nossos Trabalhos com os quatro filtros solicitados, fotos ampliáveis e agendamento próximo, sem alterar serviços, preços ou fluxos existentes.

**Especificação:** pedido do usuário de 04/11/2026: IMG_3860 = degradê/cortes; IMG_3861 = desenho/cortes; IMG_3862 = luzes e platinados; IMG_3863 = logo original. Somente recorte convencional e otimização dos originais; nenhuma imagem recriada.

**Arquitetura:** catálogo tipado em `src/lib/portfolio.ts`; componente cliente `src/components/site/work-gallery.tsx` recebe as fotos e o botão de agendamento existente. Estado de filtro e dialog nativo para ampliação. Fotos sem arquivo têm `src: null` e não criam elementos de imagem nem links quebrados. Estilos restritos à nova seção.

## Tarefa 1 — galeria

- [x] Verificar em navegador que a seção ainda não existe (RED).
- [x] Registrar categorias, descrições e nomes dos arquivos no catálogo; manter `src: null` enquanto os originais estiverem indisponíveis.
- [x] Inserir seção após serviços; quatro filtros, estado vazio, miniaturas quadradas, ampliação com fechamento por botão, Escape e fundo; devolver foco e permitir teclado.
- [x] Reutilizar BookingLauncher; manter preços, serviços, painel, cabeçalho e rodapé.
- [x] Verificar filtros, estado vazio, ausência de imagens quebradas, agendamento, responsividade; exercitar fotos ampliadas com imagem identificada como fixture apenas durante verificação local.
- [x] Rodar testes existentes, typecheck, build e revisão.

## Tarefa 2 — arquivos originais (bloqueada pelo envio)

- [ ] Obter os quatro arquivos originais acessíveis no ambiente. Os anexos da conversa são visíveis, mas não expõem arquivos locais ou identificadores de download.
- [ ] Inspecionar dimensões e recortar apenas as barras do Instagram, sem alterar cabelo ou pessoas; gerar WebP otimizado em public/images/barbearia e preencher o catálogo.
- [ ] Copiar IMG_3863.png intacto como logo oficial e criar favicon por redução convencional.
- [ ] Verificar as quatro imagens no computador e celular; conferir categorias e cortes na ampliação.

**Cuidados de revisão:** categoria Cortes inclui desenhos; Luzes não entra em Cortes; ausência de fotografia não autoriza substitutos; modal deve preservar foco, Escape e rolagem; nenhuma mudança de catálogo comercial.

**Limitação registrada:** não usar os arquivos `generated_images` como se fossem recortes fiéis das fotografias. Manter a identidade já aplicada até receber o arquivo exato IMG_3863.

**Verificação da tarefa 1:** 22 testes unitários, 4 E2E, typecheck e build passaram. Dois cenários temporários com logo como fixture verificaram galeria preenchida em 390 e 1440 px (filtros, Enter, Escape, botão, fundo, foco e rolagem). Catálogo restaurado para `src: null` antes da compilação final. Revisão independente sem problemas materiais. Tarefa 2 continua bloqueada; nenhuma afirmação de recorte ou integração dos originais foi feita.
