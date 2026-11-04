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

## Tarefa 2 — arquivos originais recebidos pelo GitHub

- [x] Obter os quatro arquivos originais acessíveis no ambiente: commit ed47145 enviado pelo usuário.
- [x] Inspecionar dimensões e recortar apenas as barras do Instagram, sem alterar cabelo ou pessoas; gerar WebP otimizado em public/images/barbearia e preencher o catálogo.
- [x] Copiar IMG_3863.png intacto como logo oficial e criar favicon por redução convencional.
- [x] Verificar as quatro imagens no computador e celular; conferir categorias e cortes na ampliação.

**Cuidados de revisão:** categoria Cortes inclui desenhos; Luzes não entra em Cortes; ausência de fotografia não autoriza substitutos; modal deve preservar foco, Escape e rolagem; nenhuma mudança de catálogo comercial.

**Fidelidade:** nenhum arquivo de generated_images foi usado como substituto dos trabalhos reais. A logo agora é o arquivo exato IMG_3863. Serviços sem fotografia e retratos de equipe sem foto real usam espaços neutros. Imagens personalizadas do CMS permanecem preservadas; apenas os dois caminhos antigos de fotos artificiais recebem tratamento de substituição.

**Correção da abertura:** a logo original IMG_3863 é a imagem principal da página inicial. No computador fica em destaque ao lado do título; no celular, acima do texto. Usa contain e proporção preservada, com movimento suave e opção de pausa. Conteúdo local e padrão atualizados; galeria e agendamento conferidos em navegador, assim como logo completa e ausência de rolagem horizontal. Build passou.

**Verificação:** 22 testes unitários, 4 E2E, typecheck e build passaram após integrar os originais. O E2E persistido usa as três fotos reais e verifica contagens por filtro, ampliação, Escape, foco, carregamento, celular e agendamento. Revisão independente sem problemas bloqueantes; enquadramento do banner e documentação foram ajustados. Banco local atualizado somente nos campos de mídia; nomes, preços, durações dos serviços e IDs de agendamentos conferidos antes/depois sem alterações. Publicação na hospedagem continua condicionada ao acesso de rede e à configuração do banco de produção.
