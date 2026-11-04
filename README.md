# Imperial Barber

Site responsivo em português, inspirado na referência preto/dourado, com agendamento persistente e painel para gerenciar o estabelecimento. Next.js 16, React 19, TypeScript e Supabase (PostgreSQL, Auth e Storage).

## Executar

Requer Node.js 22 ou superior (validado em Node 24) e npm. Na raiz:

```sh
npm ci
cp .env.example .env.local
# Configure as três variáveis Supabase em .env.local, sem versionar seus valores.
npm run dev
```

O site abre na porta 3000; `/admin` é o painel. Sem Supabase configurado, o site mostra o catálogo visual demonstrativo e informa que a agenda está indisponível. Nenhuma reserva é simulada como salva. Em um Supabase local, o site identifica o ambiente de demonstração.

Para produção: `npm run build` e `npm start`. Veja [publicação e operação](docs/deployment.md) para migrações, administrador e segurança. O repositório não contém senhas padrão, usuário administrador de produção ou segredos.

## O que está incluído

- Site com identidade Imperial, hero, benefícios, serviços, equipe, depoimentos opcionais, localização e contatos.
- Foto principal com efeito de profundidade 3D e movimento de câmera em CSS, controle de pausa e respeito à preferência por movimento reduzido. A imagem continua editável pelo painel; não requer vídeo ou biblioteca 3D.
- Agendamento em quatro etapas: serviço, profissional, data/hora e confirmação. O servidor valida novamente a disponibilidade, sem confiar no preço ou duração enviados pelo navegador.
- Link privado para consultar, cancelar e remarcar a reserva. Guarde o link: não há envio automático de mensagens.
- Login administrativo, resumo com métricas reais, agenda, criação manual, status, clientes/histórico, serviços, equipe, jornadas, pausas, bloqueios, fotos e conteúdo editável.
- Preços em centavos, histórico de serviço/profissional/preço/duração, fuso America/Sao_Paulo, proteção transacional contra intervalos sobrepostos, RLS, limites persistentes e uploads de imagens validados.

A agenda começa fechada. Cadastre profissionais reais, vincule serviços, configure jornadas e revise contatos/regras em `/admin/configuracoes` antes de ativá-la. Depoimentos, promoção e localização só devem ser publicados com dados autorizados do estabelecimento. Os cinco preços iniciais são sugestões da referência, editáveis pelo painel.

Sem pagamentos online, WhatsApp/email automáticos, múltiplas unidades ou sincronização com calendários externos nesta versão. Links de contato abrem o WhatsApp configurado.

## Testes

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e        # modo SEM backend, independente de .env.local
npm run test:integration # PostgreSQL descartável imperial_test; destrói somente os schemas desse banco
npm run test:e2e:live    # Supabase LOCAL com fixture e administrador de teste
```

Os testes de banco usam PostgreSQL real, com schemas mínimos de Auth/Storage para testar RLS e funções. Os testes E2E live usam os serviços reais de Auth, REST e Storage do Supabase local. Esses dois níveis não substituem a verificação após publicar em seu provedor.

Para integração SQL: suba `postgres:17-alpine` em `127.0.0.1:54328`, crie o banco **imperial_test** e configure `TEST_DATABASE_URL` se necessário. A suíte recusa resetar banco de outro nome; use somente uma instância isolada. O modo de autenticação trust utilizado no ambiente de teste é exclusivo desse container local; nunca use em produção.

### Supabase local

Requer Docker. O CLI está nas dependências de desenvolvimento.

```sh
SUPABASE_HOME="$PWD/.superpowers/supabase" npx supabase start
node scripts/local-env.mjs
node scripts/local-fixture.mjs
npm run test:e2e:live
```

`local-env.mjs` grava bindings locais em `.env.local` sem imprimir valores e preserva arquivos preexistentes que não foram gerados por ele. `local-fixture.mjs` só aceita Supabase em loopback, cria um administrador exclusivo de teste e guarda suas credenciais em `.superpowers/local/admin.json`, ignorado pelo Git. Não envia email e não cria usuário de produção. A suíte live grava dados de teste; nunca deve usar um banco comercial.

Neste ambiente gerenciado, o registro ECR não está permitido. Foi utilizada a distribuição oficial com `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`. As sondas wget de Auth/Storage enviam loopback ao proxy e podem marcar os containers como unhealthy; consulte a correção e as verificações funcionais em [operação](docs/deployment.md). Não desative TLS ou verificação de imagens.

O Playwright usa Chromium em `/usr/bin/chromium`. Em outra máquina, instale o navegador com `npx playwright install chromium` e defina `CHROMIUM_PATH` como o executável local, ou ajuste a configuração. Capturas e relatórios ficam em `test-results/`, ignorado.

## Imagens

As fotografias em `public/images` foram geradas para este projeto. Não representam funcionários ou clientes reais. A imagem de serviços é uma grade de seis cenas, posicionada por CSS nos cartões iniciais; fotos individuais enviadas pelo painel são exibidas inteiras no enquadramento do cartão, sem o recorte da grade inicial. O profissional pode substituir logo, hero, fotos de serviços/equipe e localização pelo painel. A marca padrão é um desenho tipográfico com ícones Lucide (licença ISC).

Projeto aprovado: [especificação](docs/superpowers/specs/2026-11-03-imperial-barber-design.md). Plano: [implementação](docs/superpowers/plans/2026-11-03-imperial-barber.md).

Para explorar um catálogo local organizado após os testes: `node scripts/local-demo.mjs`. Esse script só aceita loopback, arquiva fixtures com nomes específicos da suíte, preserva o histórico e adiciona cinco serviços e um profissional explicitamente identificado como demonstração. Não o execute para configurar um estabelecimento real.

Relatório da entrega e decisões técnicas: [validação](docs/validation.md). A migração 008 é obrigatória: ela revoga os grants explícitos padrão do Supabase nas funções internas e limita cada RPC à role prevista.
