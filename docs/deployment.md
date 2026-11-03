# Publicação e operação

## Projeto Supabase

1. Crie um projeto Supabase de produção sob sua conta. Anote a URL, a anon key e a service role key usando a interface segura do provedor. Nunca envie essas chaves por chat nem as registre no Git. A service role fica somente no servidor.
2. Use as mesmas três variáveis de `.env.example` no ambiente seguro da hospedagem Next.js. A URL e a anon key são públicas por definição; RLS protege os dados. A service role não pode receber prefixo `NEXT_PUBLIC_`.
3. Aplique os arquivos SQL de `supabase/migrations`, em ordem, pelo SQL Editor, ou use `npx supabase link` e `npx supabase db push` após conferir que o projeto selecionado é o correto. Não execute reset ou testes destrutivos no projeto real. Teste primeiro em staging.
4. Em Authentication, desabilite novos cadastros públicos. Configure a URL do site e redirects do domínio real. Crie o primeiro usuário administrativo usando o painel Authentication do Supabase, com senha escolhida pelo responsável e email confirmado conforme seu procedimento de acesso.
5. Copie o UUID desse usuário e execute no SQL Editor, substituindo o marcador pelo UUID real:

```sql
insert into public.admin_users(user_id) values ('UUID-DO-USUARIO-AUTH');
```

Somente um operador privilegiado deve conceder essa função. Não há endpoint de autopromoção, convite aberto ou senha de administrador padrão. Usuários Auth sem esse vínculo não entram no painel. Para recuperar uma senha, o operador pode emitir a recuperação pelo Supabase após validar a identidade do responsável.

6. As migrações criam o bucket público `site-images`, com escrita restrita ao administrador, limite de 5 MB e formatos JPEG, PNG e WebP. Ele deve conter apenas imagens autorizadas para publicação, sem documentos privados. Não torne buckets de dados pessoais públicos.
7. Entre em `/admin`, instale/revise o catálogo, adicione equipe real e serviços atendidos, configure jornadas/pausas e contatos. Revise o texto de privacidade, responsável e prazo de retenção. Só então abra a agenda nas configurações.

## Hospedagem Next.js

Use um provedor com runtime Node.js, HTTPS e suporte a Next.js App Router/Proxy. Instalação `npm ci`, build `npm run build`, inicialização `npm start`. Não serve como exportação estática. Configure variáveis em staging e produção separadamente.

O proxy de borda deve validar os domínios recebidos, preservar o Host público e sobrescrever o header de IP de clientes. Configure `TRUSTED_IP_HEADER` somente se esse header for gerado/sobrescrito pela sua infraestrutura (por exemplo, o header documentado do seu provedor). Sem ele, há limite compartilhado conservador, reduzindo capacidade para todos em vez de confiar em IP falsificado. Revise os limites para o volume de tráfego real.

As mutações exigem Origin do mesmo Host; não remova essa proteção. Não habilite CORS aberto para o painel. Reserve `SUPABASE_SERVICE_ROLE_KEY` para os módulos de servidor. Use TLS verificado, não publique `.env.local`, arquivos de fixtures, dumps ou relatórios com credenciais.

Não registre corpos de requisições nem URLs de acompanhamento `/agendamento/<token>` em logs, analytics, monitoramento de erros ou cache de CDN. Essa URL é uma credencial privada. Configure a borda para redigir o caminho nessas rotas e aplicar no-store. As páginas já enviam noindex/no-referrer e não carregam recursos de terceiros. O banco guarda apenas o hash do token.

Administração e APIs não devem ser armazenadas em cache compartilhado. Imagens no bucket público são conteúdo de marketing. Revise backups, retenção de dados e acesso administrativo conforme a operação do estabelecimento. Limites persistentes são limpos após um dia; dados de agendamento não são apagados automaticamente nesta versão.

## Verificação depois de publicar

- Abra site e painel em celular e desktop; confira fontes, imagens, contato e links reais.
- Teste com cliente de staging: escolha serviço/profissional/dia, reserve, confira o banco, abra o link privado, remarque e cancele.
- Tente reservar duas vezes o mesmo intervalo: uma deve retornar conflito. Intervalos adjacentes são permitidos.
- Confira jornada, folgas e horário de Brasília; edite preço e confirme que o histórico da reserva mantém o anterior.
- Sem login, `/api/admin/bookings` deve retornar 401. Usuário Auth comum deve receber 403. Nenhuma reserva/cliente deve estar visível com a anon key.
- Envie imagem válida e tente arquivo HTML disfarçado: somente a imagem deve ser aceita.

O preparo do código e o salvamento de instruções do ambiente não publicam o site, configuram DNS ou comprovam que a hospedagem real foi validada.

## Ambiente local gerenciado

O checkout `/workspace/Imperial-barber` já está isolado; não crie outro worktree. Dependências e volumes podem ser preservados por snapshot, mas processos não devem ser considerados ativos após restaurar a máquina.

No ambiente preparado, Docker Hub distribui as imagens oficiais permitidas:

```sh
cd /workspace/Imperial-barber
SUPABASE_HOME="$PWD/.superpowers/supabase" \
SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io \
npx supabase start --ignore-health-check \
  -x realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
node scripts/local-env.mjs
npm run dev
```

A flag acima contorna somente a sonda wget defeituosa do container, não comprova a saúde do serviço. Nesse ambiente o wget envia até loopback ao proxy. Verifique diretamente endpoints locais dentro dos containers com `wget -Y off` (somente loopback) e execute a suíte live para comprovar Auth/REST/Storage. Não declare prontidão pela saída do CLI nem use a flag para encobrir um serviço que realmente falhou.

```sh
docker exec supabase_auth_Imperial-barber wget -Y off -qO- http://127.0.0.1:9999/health
docker exec supabase_storage_Imperial-barber wget -Y off -qO- http://127.0.0.1:5000/status
npm run test:e2e:live
```

Não altere proxies para acessar destinos externos bloqueados. Em outra infraestrutura onde a sonda funciona normalmente, use `npx supabase start` sem essa flag. Não execute `local-fixture.mjs` novamente se quiser preservar o administrador de teste já criado; suas credenciais locais estão no arquivo ignorado `.superpowers/local/admin.json`.
