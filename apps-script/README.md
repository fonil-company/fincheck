# Apps Script → Planilha de leads

Planilha: https://docs.google.com/spreadsheets/d/1155FP3vk76z4YIDsaBCdgKLdQDk_8-B-1x_WYM7NbB8/edit

## Atualizar o script
1. Planilha → **Extensões → Apps Script** → apague tudo em `Código.gs` → cole o `apps-script/Code.gs` → Salvar.
2. **⚙ Configurações do projeto → Propriedades do script**: `TOKEN` = valor de `GOOGLE_SCRIPT_TOKEN` do `.env.local`.
3. No topo do editor, escolha a função **organizarPlanilha** → **▶ Executar** → autorize. (Organiza a aba "Leads" e cria a aba "Resumo".)
4. **Implantar → Gerenciar implantações → ✏ Editar → Versão: Nova versão → Implantar.** A URL `/exec` continua a mesma.

## O que o script faz
- Lead novo sempre na **linha 2** (topo).
- Coluna **Nº**: número sequencial do lead (o do topo = total recebido). Nunca repete, mesmo apagando linhas.
- Cabeçalho preto/dourado, colunas congeladas, filtro, larguras, formatos (R$, data, CPF/CEP como texto).
- **Status** com lista suspensa e cores: Novo, Em contato, Documentação, Proposta enviada, Aprovado, Recusado, Sem resposta.
- Coluna **Abrir WhatsApp** com link clicável e coluna **Observações** livre para a equipe.
- Aba **Resumo**: total de leads, leads de hoje, últimos 7 dias, valor total, ticket médio, contagem por status e taxa de aprovação.

Para zerar o contador Nº: Propriedades do script → apague `CONTADOR_LEADS`.
