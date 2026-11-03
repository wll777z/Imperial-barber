# Imperial Barber — projeto para aprovação

Status: proposta de projeto; implementação ainda não iniciada.

## Objetivo e decisões confirmadas

Criar o site completo Imperial Barber seguindo a imagem fornecida, com agendamento online e painel protegido. O usuário confirmou que o profissional deve gerenciar serviços, preços, duração, horários disponíveis, equipe, fotos, textos e reservas. Confirmou também a abordagem de sistema próprio com Next.js e Supabase.

O repositório `/workspace/Imperial-barber` está vazio, com branch local sem commits. Não existe aplicação anterior a preservar. A referência visual está na conversa; ela não é um conjunto de arquivos de imagens utilizáveis diretamente. Este documento é uma proposta: as decisões abaixo ainda não confirmadas individualmente são recomendações do responsável técnico.

## Abordagens consideradas

1. Sistema próprio com Next.js e Supabase: liberdade de composição visual, painel e regras de agenda específicos, persistência em PostgreSQL, autenticação e armazenamento de fotos. Exige configurar um projeto Supabase e hospedagem. Abordagem escolhida pelo usuário.
2. WordPress com plugins: edição de conteúdo pronta, mas maior dependência de plugins/licenças e menor controle sobre o fluxo visual e a concorrência de reservas. Não escolhido.

## Site e identidade visual

- Paleta preto, dourado e branco quente; títulos serifados, texto de interface sem serifa, bordas discretas e botões dourados com contraste legível.
- Reproduzir a hierarquia e composição da referência: faixa de promoção, marca com coroa, navegação, hero fotográfico, benefícios, serviços, chamada para reservar, explicação do processo, barbeiros, depoimentos, localização e rodapé.
- A coluna direita da referência representa exemplos de logo, painel e etapas do agendamento; serão telas e componentes do sistema, não uma coluna de imagens estáticas na página pública.
- Layout responsivo com menu móvel, cartões adaptáveis e fluxo de reserva utilizável em telas pequenas. Navegação por teclado, foco visível, rótulos de campos e mensagens de erro acessíveis.
- Fotos e identidade serão recursos locais ou URLs de armazenamento autorizados. Usar recursos gerados ou de uso permitido quando disponíveis; não prometer uma cópia fotográfica exata das pessoas da referência. Os conectores Sites, Higgsfield e GitHub não estão acessíveis nesta sessão; o desenvolvimento será feito no repositório local.
- Nome Imperial Barber fixado como identidade inicial. Demais textos, promoção, benefícios, fotos, contatos, endereço, links sociais e depoimentos editáveis no painel. Logo e foto do hero também substituíveis.
- Endereço, telefone, depoimentos e métricas da referência são exemplos, não dados reais do estabelecimento. Conteúdo de exemplo ficará identificado no painel e não será apresentado publicamente como avaliação ou estatística verificada. Endereço/contato reais e promoção ativa serão configurados antes da publicação comercial.

## Agendamento do cliente

1. Escolher serviço ativo, vendo preço, duração e descrição.
2. Escolher profissional habilitado para o serviço, ou qualquer profissional disponível.
3. Escolher data e um horário realmente disponível; informar nome, telefone e email opcional.
4. Revisar os dados, concordar com o uso dos dados para atender à reserva e confirmar.

A reserva será gravada no banco e receberá código e página privada de acompanhamento. A confirmação será exibida no próprio site; email e WhatsApp automáticos não fazem parte desta entrega. O cliente poderá acessar sua reserva por link privado com token aleatório, nunca por sequência de IDs ou apenas pelo telefone.

Proposta de operação: reserva confirmada imediatamente; cliente pode cancelar ou remarcar até duas horas antes do atendimento, usando seu link privado. O administrador pode confirmar, cancelar, remarcar, marcar concluída ou não comparecimento. Datas passadas e alterações incoerentes de estado serão rejeitadas. Sem pagamento antecipado; o preço mostrado é o preço do serviço na reserva, e o pagamento ocorre no estabelecimento.

## Regras de agenda

- Fuso do estabelecimento: America/Sao_Paulo. Instantes persistidos em UTC e apresentados no fuso do estabelecimento, sem depender do fuso do navegador.
- Uma unidade e uma agenda por profissional. Serviços vinculados aos profissionais habilitados, com duração positiva e preço em centavos.
- Horários semanais, intervalos, folgas e bloqueios por data editáveis; duração do serviço deve caber integralmente numa faixa de trabalho e não atravessar intervalos.
- Grade de início a cada dez minutos; disponibilidade para os próximos 60 dias, com antecedência mínima de 30 minutos. Valores configuráveis no painel.
- Não aceitar sobreposição de agendamentos do mesmo profissional. Restrição transacional no PostgreSQL para intervalos ativos, além da conferência no servidor; checar disponibilidade novamente no momento de confirmar ou remarcar.
- Na opção qualquer profissional, o servidor seleciona um profissional elegível e tenta reservar atomicamente; conflito concorrente retorna alternativas atualizadas, sem duplicar a reserva.
- Preço, duração, serviço e profissional ficam registrados como histórico da reserva. Alterar preço ou duração do catálogo não altera reservas anteriores. Registros usados em reservas são arquivados em vez de excluídos.
- Mudança de horário de trabalho não cancela reservas existentes silenciosamente: mostrar conflitos e exigir que sejam resolvidos ou que a mudança seja ajustada.
- Horários padrão sugeridos apenas para configuração inicial: segunda a sábado, 09h–20h. O painel deve permitir substituir esse padrão antes de receber reservas reais.

## Painel administrativo

Rotas protegidas de login e painel com navegação para resumo, agenda, clientes, serviços, profissionais e configurações. O resumo mostra somente métricas reais das reservas; faturamento é o total dos serviços marcados como concluídos, identificado como estimativa, sem processamento financeiro.

- Agenda: filtros por data/profissional/status, detalhes, criação manual de reserva, confirmação, cancelamento e remarcação, incluindo as mesmas proteções contra conflito.
- Clientes: busca e histórico de atendimentos; acesso limitado ao administrador. Sem programa de marketing ou exportação pública dos contatos.
- Serviços: criar, editar, ordenar, ativar/arquivar, preço, duração e foto.
- Equipe: criar, editar, ordenar, ativar/arquivar, foto, especialidades e serviços atendidos.
- Disponibilidade: jornada semanal, pausas, folgas e bloqueios por profissional.
- Conteúdo: edição dos campos e imagens definidos na seção do site, incluindo depoimentos autorizados; sem editor livre de código HTML.
- Configurações: dados do estabelecimento, regras de antecedência/cancelamento e visibilidade de seções opcionais.

Proposta de permissões: nesta versão, o dono/profissional responsável é administrador e pode gerenciar toda a barbearia. Perfis públicos de barbeiros são registros da equipe, sem contas individuais obrigatórias. Não inclui acesso de funcionário restrito à própria agenda nem múltiplas unidades.

## Arquitetura e segurança

- Next.js com TypeScript para site, painel e endpoints no servidor; estilos responsivos e componentes reutilizáveis.
- Supabase PostgreSQL para configurações, serviços, equipe, jornadas, bloqueios, clientes e reservas; migrações versionadas para tabelas, índices, funções transacionais e políticas de acesso.
- Supabase Auth para administradores, com cadastro público de administradores desabilitado. Primeiro administrador criado pelo responsável do projeto Supabase e vinculado à lista de administradores por procedimento documentado; nenhuma senha padrão ou conta administrativa demonstrativa pública.
- Supabase Storage para imagens, com leitura pública somente de imagens publicadas e upload restrito ao administrador. Validar formato e tamanho; não aceitar arquivos executáveis ou HTML.
- Público lê apenas catálogo e conteúdo publicado. Dados de clientes e reservas protegidos por RLS; escritas e consultas de reserva via endpoints com validação no servidor. Chave privilegiada exclusivamente no servidor, nunca no bundle do navegador ou no Git.
- APIs públicas de reserva e consulta com limites de uso persistentes e validação de entradas. Token de acompanhamento armazenado como hash; não registrar dados pessoais ou tokens em logs.
- Dados mínimos para operar; texto de privacidade claro, sem alegar certificação jurídica. Sem dados de cartão de crédito.
- Variáveis esperadas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY. Configurar valores reais por arquivo local ignorado ou configurações seguras de hospedagem, nunca por chat ou documento versionado.

## Critérios de entrega e validação

1. Site reproduz a organização visual da referência em desktop e celular e todos os botões principais abrem o fluxo correto.
2. Reserva válida persiste e bloqueia o intervalo; duas requisições concorrentes para o mesmo intervalo não criam duas reservas.
3. Disponibilidade respeita duração, jornada, pausas, folgas, fuso, antecedência e reservas existentes.
4. Cliente consulta, cancela ou remarca somente com seu token válido e dentro da regra aplicável.
5. Login administrativo protege todas as operações internas; visitante não consegue ler clientes, reservas ou realizar alterações administrativas.
6. Alterações do painel persistem e aparecem no site; preço alterado não modifica o histórico de reservas.
7. Build e checagem de tipos passam; testes das regras críticas e testes de integração cobrem concorrência e autorização. Teste funcional percorre o fluxo de cliente e o fluxo administrativo.
8. Documentar instalação, migrações, criação do administrador, variáveis, execução e publicação. Separar claramente recursos verificados com Supabase real de demonstrações locais.

## Limites e dependências externas

Não inclui pagamentos online, envio automático de email/SMS/WhatsApp, integração com agenda externa, múltiplas unidades ou aplicativo nativo. Links de contato podem usar o WhatsApp configurado pelo administrador.

Implementação e verificações locais podem avançar sem serviços pagos. Para verificar persistência, autenticação, armazenamento e concorrência no ambiente real, é necessário um projeto Supabase acessível com as credenciais e migrações aplicadas. Hospedagem/domínio e publicação pública exigem acesso ao provedor escolhido. A ausência dessas dependências será reportada como pendência concreta; não será substituída por agendamentos fictícios ou armazenamento local apresentado como sistema de produção.

## Decisões delegadas ao responsável técnico

Organização das pastas e componentes, biblioteca de ícones, detalhes de tipografia e animação, escolha de imagens permitidas, nomes de tabelas, ferramentas de teste e implementação dos limites de requisição. Devem preservar o visual solicitado e os critérios acima. O próximo passo, após aprovação deste documento, é o plano de implementação.
