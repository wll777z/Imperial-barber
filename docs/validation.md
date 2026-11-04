# Validação da entrega

Implementação local do Imperial Barber. Nenhum site de produção foi publicado e nenhum commit foi enviado ao GitHub nesta sessão.

## Evidência executada

- Instalação limpa `npm ci`, checagem de tipos e compilação de produção foram executadas com sucesso. A compilação final também passou após o passe de revisão.
- `npm test`: 20 testes aprovados (domínio, validação, origem das requisições, arquivos de imagem, Storage local e conteúdo configurável realmente renderizado).
- `npm run test:integration`: 20 testes aprovados no PostgreSQL 17 real e descartável. Incluem concorrência, intervalos adjacentes, qualquer profissional, snapshots, jornadas e bloqueios, regras de prazo, consentimento, agrupamento do histórico e permissões com os defaults do Supabase.
- `npm run test:e2e:live`: 6 cenários aprovados contra Auth/REST/Storage reais do Supabase local: fluxo do cliente, concorrência HTTP, gestão pelo painel, usuário comum bloqueado, ACLs reais e preservação do aviso de conflito.
- `npm run test:e2e`: 3 cenários de modo sem backend, navegação desktop/celular e proteção de rotas. A execução final passou após todas as correções.

O runner de navegador emite avisos de configuração de cor do terminal (NO_COLOR/FORCE_COLOR). Eles não correspondem a falhas da aplicação. O CI foi criado, mas ainda não executado no GitHub.

Os testes não provam operação no provedor de produção: domínio, credenciais reais, backups, configuração de logs e publicação ainda precisam ser aplicados pelo responsável.

## Revisão independente e correções

Uma revisão independente do branch encontrou quatro itens. Todos foram tratados em um único passe de correções, sem uma segunda revisão:

1. **Permissões de funções no Supabase.** O Supabase concede EXECUTE explicitamente às roles de API por default; revogar apenas PUBLIC era insuficiente. A migração 008 revoga todas essas permissões e concede somente as RPCs previstas a cada role. A suíte isolada agora reproduz os defaults, e uma consulta somente leitura de `has_function_privilege` comprova a restrição no Supabase real. A regressão falhou antes e passou após a correção.
2. **Persistência de foto do Storage local.** URLs HTTP só são aceitas quando pertencem ao endpoint de Storage loopback efetivamente configurado. Outros destinos HTTP continuam bloqueados. Testes verificam upload → salvar registro → exibir imagem, além da validação unitária.
3. **Conteúdo editorial restante.** Fundos da chamada de reserva e apresentação da equipe, etapas, títulos auxiliares, descrições, frases e chamadas agora têm campos no painel. Testes de renderização e de persistência verificam os valores configurados. Rótulos funcionais de navegação/formulários permanecem componentes da interface.
4. **Mensagem de falha de confirmação.** Foi classificada como importante pelo efeito no usuário. O aviso de conflito permanece visível durante a atualização de alternativas. Um teste de navegador observou o alerta vazio antes da correção e o aviso preservado depois.

Não há itens menores adiados da revisão. A correspondência fotográfica exata não foi julgada pelo revisor, que não recebeu o anexo original; o implementador seguiu a composição fornecida. Publicação também não foi julgada porque não foi executada.

## Decisões de execução e seus limites

- O catálogo, imagens e administrador de demonstração são locais; não representam equipe, clientes, avaliações ou credenciais de produção.
- Fotografias geradas substituem uma fonte de imagens externa que retornou bloqueio de acesso. Elas mantêm o estilo solicitado; o dono deve enviar fotos reais autorizadas quando desejar representá-lo.
- A disponibilidade privada de remarcação usa a duração histórica da reserva, mesmo que o catálogo mude. Isso exige uma RPC adicional protegida pelo token da reserva.
- O CLI usa `SUPABASE_HOME` dentro de um diretório ignorado porque a home do executor é somente leitura; futuras inicializações devem preservar essa variável.
- As imagens oficiais Supabase vieram do Docker Hub permitido após o ECR negar acesso. A disponibilidade do registro deve ser verificada em outra infraestrutura.
- As sondas wget de Auth/Storage encaminhavam loopback ao proxy. A flag suportada de inicialização permitiu subir os containers e a prontidão foi comprovada separadamente com consultas locais e testes funcionais. O indicador de saúde Docker permanece sujeito a essa limitação; não dispensar a validação funcional.
- O progresso foi registrado em ledger local equivalente, pois os scripts da skill eram recursos de nuvem, sem caminho executável instalado. Commits, testes e este documento preservam o resultado.
- O trabalho permanece na branch local `work`, no checkout isolado já existente. Push, merge, publicação de site e criação de domínio não foram feitos. Os scripts do ambiente foram salvos em rascunho, o que não os executa nem publica o ambiente.

## Consultar a demonstração

As capturas estão em `/workspace/imperial-barber-preview/`. Elas mostram a versão local e não são um link público interativo. O servidor pode ser iniciado por `npm run dev`; as instruções completas estão no README e no guia de operação. Dados reais de contato, equipe e funcionamento devem ser revisados antes de receber clientes.
