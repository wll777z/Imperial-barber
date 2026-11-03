# Imperial Barber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o site Imperial Barber fiel à referência, com reservas persistentes e painel administrativo completo.

**Architecture:** Next.js App Router serve o site público, endpoints de reserva e painel autenticado. Supabase fornece PostgreSQL, Auth e Storage; funções transacionais no banco decidem disponibilidade, garantem exclusividade de intervalos e preservam histórico. Nenhuma operação real depende de dados fictícios ou armazenamento do navegador.

**Tech Stack:** TypeScript, Next.js, React, CSS, Supabase JS/SSR, Zod, Vitest, Playwright; Supabase CLI e PostgreSQL para integração. Usar versões estáveis compatíveis no momento da instalação, registrar o lockfile e documentar a versão Node suportada.

**Spec:** `docs/superpowers/specs/2026-11-03-imperial-barber-design.md` (aprovado pelo usuário).

## Global Constraints

- Nome Imperial Barber; paleta preto, dourado e branco quente; títulos serifados; site e painel em português brasileiro.
- Fuso do estabelecimento: America/Sao_Paulo. Instantes persistidos em UTC.
- Uma unidade, uma agenda por profissional; administrador gerencia toda a barbearia; perfis públicos de equipe não são contas de acesso.
- Grade de início a cada dez minutos; disponibilidade para os próximos 60 dias; antecedência mínima de 30 minutos; cancelamento/remarcação do cliente até duas horas antes. Valores configuráveis no painel.
- Preço, duração, serviço e profissional ficam registrados como histórico da reserva. Arquivar registros utilizados, sem apagar o histórico.
- Sem pagamento online, mensagens automáticas, agenda externa, múltiplas unidades ou aplicativo nativo.
- Público lê apenas conteúdo publicado; dados de clientes/reservas protegidos por RLS; nenhuma senha padrão nem chave privilegiada no navegador/Git.
- Não apresentar exemplos de endereço, contato, avaliação, promoção ou estatística como dados reais verificados.
- Variáveis: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Inspecionar presença, nunca imprimir valores.
- Não criar worktree: usar o checkout isolado já existente em `/workspace/Imperial-barber`.

## Review Focus

1. Duas requisições concorrentes, inclusive qualquer profissional e remarcação: só uma ocupa cada intervalo; Task 2/4.
2. Cliente em fuso diferente e datas no limite de antecedência/cancelamento: aplicar o relógio e fuso do servidor; Task 1/2/4.
3. Falha no Supabase ou na configuração: mostrar erro acionável e preservar entradas; nunca informar reserva salva sem persistência; Task 3/4/6.
4. Tentativa de chamar API administrativa sem login ou com usuário Auth que não é administrador: rejeitar também no servidor e banco; Task 2/5.
5. Alterar catálogo/jornada com reservas futuras: manter snapshots e impedir alteração silenciosa que invalide reservas; Task 2/5.

## Estrutura e contratos compartilhados

- `src/app/`: layout, página pública, privacidade, `/agendamento/[token]`, `/admin/login`, `/admin` e rotas API.
- `src/components/site/`: marca, navegação, hero, benefícios, serviços, equipe, depoimentos, localização e rodapé.
- `src/features/booking/`: wizard de quatro etapas, formulário do cliente, acompanhamento e contratos de entrada/saída.
- `src/features/admin/`: layout de painel, agenda, clientes, catálogo, equipe, jornadas, conteúdo e configurações.
- `src/lib/`: tipos de domínio, formatação, validação, clientes Supabase de servidor/navegador e autorização.
- `supabase/migrations/`: schema, RLS, funções de agenda, limites de uso e políticas de imagens.
- `tests/unit/`, `tests/integration/`, `tests/e2e/`: regras puras, banco/API e fluxos no navegador.
- `public/images/`: recursos locais de uso permitido, sem dependência de URL temporária.
- `.env.example`, `README.md`, `docs/deployment.md`: requisitos, comandos e operação.

Contratos em `src/lib/domain.ts` e `src/features/booking/contracts.ts`:

```ts
type Service = { id: string; name: string; description: string; priceCents: number; durationMinutes: number; imageUrl: string | null; active: boolean; sortOrder: number };
type Professional = { id: string; name: string; specialty: string; imageUrl: string | null; active: boolean; sortOrder: number; serviceIds: string[] };
type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type Slot = { startsAt: string; endsAt: string; professionalId: string };
type BookingInput = { serviceId: string; professionalId: string | null; startsAt: string; customer: { name: string; phone: string; email?: string }; consent: true };
type BookingReceipt = { code: string; managementToken: string; startsAt: string; serviceName: string; professionalName: string; priceCents: number; durationMinutes: number };
type ApiErrorCode = 'VALIDATION' | 'CONFLICT' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'TOO_LATE' | 'NOT_FOUND';
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: { code: ApiErrorCode; message: string } };
```

Detalhes de modelo de conteúdo e formulários administrativos são responsabilidade do implementador, dentro do escopo da especificação. IDs são UUID; preços em centavos; datas de API são ISO com offset, nunca horário local ambíguo.

### Task 1: Domínio, validação e infraestrutura executável

**Files:** criar `package.json`, lockfile, configs Next/TypeScript/Vitest/Playwright, `.gitignore`, `.env.example`, `src/lib/domain.ts`, `src/lib/format.ts`, `src/lib/validation.ts`, `src/features/booking/contracts.ts`, `tests/unit/domain.test.ts`.

**Interfaces:** produz os contratos acima; `formatMoney(cents: number): string`, `formatAppointment(iso: string): string`, `bookingSchema` (Zod) e `getServerConfig(): { url: string; anonKey: string; serviceRoleKey: string }`, esta última em módulo `server-only` e sem incluir valores em erros.

- [ ] Criar scripts `dev`, `build`, `start`, `typecheck`, `test`, `test:integration`, `test:e2e`; instalar dependências compatíveis e gerar lockfile. Sem chamada de rede obrigatória em build para fontes.
- [ ] Escrever testes: `formatMoney(4000)` representa R$ 40,00; `formatAppointment('2026-11-04T00:00:00Z')` representa 03/11 às 21h; `bookingSchema.safeParse({...valid, consent:false}).success === false`; rejeitar início sem offset, nome vazio, telefone inválido e campos desconhecidos sensíveis como preço/status.
- [ ] Rodar `npm test -- tests/unit/domain.test.ts`; confirmar falha por módulos/comportamentos ainda ausentes.
- [ ] Implementar tipos, formatos pt-BR e validação de fronteira; normalizar telefone sem exigir email; configuração ausente produz erro seguro.
- [ ] Reexecutar o teste e `npm run typecheck`; esperar sucesso. Commit: `chore: establish app and validated booking domain`.

### Task 2: Banco, disponibilidade transacional e autorização

**Files:** criar `supabase/config.toml`, `supabase/migrations/001_schema.sql`, `002_booking_functions.sql`, `003_policies_and_media.sql`, `tests/integration/database.test.ts`, `tests/integration/fixtures.ts`.

**Interfaces:** produz tabelas `site_settings`, `services`, `professionals`, `professional_services`, `working_hours`, `schedule_blocks`, `customers`, `bookings`, `admin_users`, `request_limits`. `bookings` inclui snapshots, token hash e intervalo temporal. RPCs exclusivas do servidor: `list_slots(p_service_id uuid, p_professional_id uuid, p_date date)`, `create_booking(p_input jsonb, p_token_hash text)`, `manage_booking(p_token_hash text, p_action text, p_starts_at timestamptz default null)`, `consume_limit(p_key text, p_limit int, p_window_seconds int)`. RPCs administrativas autenticadas: `admin_create_booking(p_input jsonb)`, `admin_update_booking(p_id uuid, p_patch jsonb)`, `admin_update_schedule(p_professional_id uuid, p_schedule jsonb)`.

- [ ] Criar fixtures isoladas de teste e testes para duração que atravessa pausa, folga total, profissional desativado/inabilitado, prazo mínimo, limite de 60 dias e cancelamento exatamente duas horas antes. Confirmar intervalos adjacentes permitidos.
- [ ] Adicionar teste concorrente `Promise.allSettled` com duas criações do mesmo slot: `fulfilled.length === 1`; repetir com qualquer profissional quando só existe um elegível; tentar remarcar para intervalo ocupado e verificar reserva original intacta.
- [ ] Adicionar testes de RLS com anon, usuário autenticado comum e administrador: anon não lê clientes/reservas/admin_users, usuário comum não altera catálogo, administrador autorizado altera. Negar RPCs privilegiadas a anon/authenticated comuns.
- [ ] Adicionar testes de snapshot após edição de preço/duração e de jornada nova que invalida reserva futura: histórico permanece e alteração conflitante é rejeitada atomicamente. Arquivar não elimina reservas.
- [ ] Executar `npm run test:integration -- tests/integration/database.test.ts` contra Supabase local ou projeto dedicado de testes; esperar falhas antes das migrações. Não resetar um projeto real com dados do usuário. Sem infraestrutura, registrar execução pendente e avançar trabalho independente.
- [ ] Implementar constraints (preço/duração/status), extensão btree_gist e exclusão por profissional para intervalos ativos `[start,end)`, bloqueio transacional por profissional ao alterar jornadas/reservas, relógio de banco, cálculo de slots em America/Sao_Paulo, snapshot e token hash; selecionar profissional disponível atomicamente. Funções privilegiadas com search_path fixo, concessões mínimas e validação interna completa.
- [ ] Implementar limites persistentes e RLS. `admin_users` só provisionado por operador privilegiado; função de autorização segura sem recursão de políticas. Storage público somente para imagens publicadas; escrita só administrador, limite de tamanho e formatos raster.
- [ ] Reexecutar testes de banco e confirmar contagem de casos executados. Commit: `feat: enforce booking integrity and access in database`.

### Task 3: Site público responsivo e conteúdo persistente

**Files:** criar `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/privacidade/page.tsx`, `src/components/site/*`, `src/lib/content.ts`, `src/lib/supabase/{server,browser,service}.ts`, `public/images/*`, `tests/e2e/site.spec.ts`.

**Interfaces:** consome Service/Professional; produz `getPublicContent(): Promise<PublicContent>` com catálogo e seções publicadas; `BookingLauncher({serviceId?: string})` abre o wizard da Task 4. Definir `PublicContent` no domínio com todos os campos editáveis da especificação. Serviço privilegiado nunca importado por componente cliente.

- [ ] Escrever teste de navegador para título Imperial Barber, navegação móvel por teclado, botões de reserva e ausência de overflow horizontal a 375px; testar falta de configuração e indisponibilidade do banco sem exibir falsa confirmação. Rodar antes da implementação e confirmar falha.
- [ ] Implementar seções da referência e CSS responsivo. A coluna lateral da imagem é referência das telas, não conteúdo estático a reproduzir no site. Usar imagens locais permitidas; documentar origem e não depender de downloads em runtime.
- [ ] Implementar leitura de conteúdo publicado, esconder depoimentos/localização/promoção sem dados reais, apresentar estado de catálogo indisponível e deixar reserva desabilitada se não há backend. Uma configuração visual inicial deve estar identificada como conteúdo inicial no painel.
- [ ] Executar teste de site, verificar capturas desktop/mobile e confirmar foco, contraste e legibilidade. Commit: `feat: build Imperial Barber public website`.

### Task 4: Fluxo completo de reserva e acompanhamento

**Files:** criar `src/features/booking/{wizard,customer-form,management}.tsx`, `src/app/agendamento/[token]/page.tsx`, `src/app/api/slots/route.ts`, `src/app/api/bookings/route.ts`, `src/app/api/bookings/manage/route.ts`, `src/lib/booking-service.ts`, `tests/unit/booking-api.test.ts`, `tests/e2e/booking.spec.ts`.

**Interfaces:** consome RPCs da Task 2; `GET /api/slots?serviceId=&professionalId=&date=YYYY-MM-DD` retorna `ApiResult<Slot[]>`; `POST /api/bookings` recebe BookingInput e retorna `ApiResult<BookingReceipt>`; `POST /api/bookings/manage` recebe `{ token, action: 'view'|'cancel'|'reschedule', startsAt? }`. Status HTTP: validação 400, autorização 401/403, conflito 409, prazo 422, limite 429, indisponibilidade 503.

- [ ] Escrever testes de API para erro de validação, falso preço enviado, hash/token inválido, erro de backend, limite de uso e conflito; erro de backend nunca retorna ok. Usar doubles apenas nos testes unitários e indicar isso no relatório. Confirmar falha antes do código.
- [ ] Implementar endpoints com validação, geração criptográfica de token, armazenamento somente de SHA-256, respostas no-store e mensagens sem dados internos. Rate limits persistentes por origem de requisição confiável e chave do alvo; não confiar em header de IP arbitrário. Documentar contrato do proxy de hospedagem.
- [ ] Implementar wizard de quatro etapas, seleção de qualquer profissional, calendário/horários reais, formulário, resumo e confirmação com código e link privado. Voltar de etapa preserva entradas; mudar serviço/profissional limpa seleção incompatível; conflito atualiza alternativas. Não guardar tokens/dados pessoais em analytics ou logs.
- [ ] Implementar acompanhamento com consulta/cancelamento/remarcação por token; página usa noindex e Referrer-Policy no-referrer, sem recursos de terceiros que recebam o token. Regra de prazo aplicada no servidor/banco.
- [ ] Rodar testes unitários e E2E de reserva, conflito, cancelamento e remarcação com backend de teste real. Testar navegador em fuso diferente e data na virada do dia; expectativa segue São Paulo. Verificar registro no banco depois da confirmação.
- [ ] Commit: `feat: add booking and private appointment management`.

### Task 5: Login e painel de administração

**Files:** criar `src/app/admin/login/page.tsx`, `src/app/admin/(protected)/layout.tsx`, páginas `page.tsx`, `agenda/page.tsx`, `clientes/page.tsx`, `servicos/page.tsx`, `equipe/page.tsx`, `disponibilidade/page.tsx`, `conteudo/page.tsx`, `configuracoes/page.tsx`; `src/features/admin/*`, `src/lib/auth.ts`, `src/app/api/admin/[...resource]/route.ts`, `tests/e2e/admin.spec.ts`, `tests/unit/admin-api.test.ts`.

**Interfaces:** `requireAdmin(): Promise<{userId: string}>` valida usuário com Supabase Auth e vínculo em admin_users; endpoints de CRUD têm allowlist de recursos/campos com schemas por operação, nunca SQL/tabela fornecidos livremente pelo cliente. Mutação de reserva/jornada usa RPCs da Task 2. Operações de conteúdo invalidam cache para refletir no site.

- [ ] Escrever testes: sem sessão recebe 401; usuário comum recebe 403 mesmo chamando API diretamente; recurso/campo desconhecido é rejeitado; somente administrador edita. Rodar antes do código e confirmar falha.
- [ ] Implementar sessão com cookies SSR e verificação de identidade no servidor, login/logout, expiração de sessão e proteção de origem/CSRF para mutações. Nenhum cadastro público de administrador ou senha padrão.
- [ ] Implementar resumo de dados reais, agenda filtrável, criação manual, detalhes, remarcação e estados da reserva; faturamento estimado soma apenas concluídas. Não permitir concluir/não comparecimento antes do início nem restaurar reserva cancelada para um slot ocupado.
- [ ] Implementar lista/histórico de clientes, CRUD/ordenação/arquivamento de serviços e equipe, vínculo de serviços/profissionais, jornadas/pausas/folgas, conteúdo de todas as seções e configurações da agenda. Upload de imagem valida tamanho, MIME e assinatura de arquivo raster, grava em Storage autorizado e permite substituir o recurso exibido.
- [ ] Implementar formulários com estado de salvamento, feedback de erro/sucesso e confirmação para cancelamento/arquivamento; alteração de jornada mostra conflitos e mantém agenda anterior se rejeitada.
- [ ] Executar E2E: entrar, alterar preço e texto, verificar site público atualizado, criar reserva manual, remarcar, cancelar e sair; verificar que novo preço não altera reserva anterior e cliente comum não acessa painel. Commit: `feat: add secure business management dashboard`.

### Task 6: Verificação integrada, documentação e entrega

**Files:** criar `README.md`, `docs/deployment.md`, `.github/workflows/ci.yml`, atualizar `.env.example` e arquivos de teste conforme necessário; configuração reutilizável do ambiente quando a ferramenta estiver disponível.

**Interfaces:** consome todos os comandos e fluxos anteriores; produz procedimento reproduzível de instalação, migração, provisionamento inicial e startup, sem valores secretos. Não depende de processos sobreviverem à restauração do ambiente.

- [ ] Documentar `npm ci`, variáveis, `supabase db push` somente após selecionar o projeto correto, buckets/políticas, criação do primeiro administrador via operador Supabase e desativação de cadastro público. Instruir uso de projeto isolado para testes destrutivos. Dados reais de contato e jornada devem ser revistos antes de abrir reservas.
- [ ] Documentar execução `npm run dev`, prontidão por requisição HTTP e fluxo de reserva; publicação de Next.js com variáveis protegidas, domínio, HTTPS e proxy confiável para limite de uso. Distinguir banco local/de teste do projeto de produção.
- [ ] Criar CI para instalação frozen, tipos, testes unitários e build; integrar banco/E2E de modo explícito, sem apresentar suites ignoradas como aprovadas.
- [ ] Rodar `npm ci`, `npm run typecheck`, `npm test`, `npm run build`; executar testes de banco e navegador disponíveis. Registrar comandos, resultados, número de casos e bloqueios concretos; diagnosticar falhas antes de alegar conclusão.
- [ ] Iniciar aplicação pelo procedimento documentado, verificar resposta HTTP e fluxo funcional; inspecionar capturas em desktop/celular e estados sem configuração, sem horários e erro de rede.
- [ ] Revisão final independente: inspecionar autorização/RLS, concorrência, token, uso de segredos, cobertura do conteúdo editável, qualidade visual e requisitos da especificação. Corrigir achados relevantes e repetir verificações afetadas.
- [ ] Salvar instruções de instalação e startup necessárias no rascunho de configuração do ambiente quando possível. Não afirmar que salvar publica ou aplica configuração.
- [ ] Verificar diff/status e ausência de segredos/saídas geradas no Git; commit de documentação e validação. Relatar o que funciona, o que foi testado de verdade e qualquer dependência externa pendente. Não fazer push nem publicar sem autorização específica.

## Self-review do plano

Cobertura: todas as seções públicas e conteúdo editável na Task 3/5; autenticação, uploads e CRUD na Task 2/5; fluxo de cliente e token na Task 4; disponibilidade, concorrência e histórico na Task 2; execução e evidência na Task 6. Os cinco riscos de Review Focus possuem testes nas tarefas indicadas. Contratos HTTP/TypeScript e RPC são compartilhados explicitamente. Aplicar a mesma especificação a cada tarefa e registrar ajustes técnicos no plano sem reduzir escopo silenciosamente.
