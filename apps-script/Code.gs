/**
 * LEADS – Aridiego Pereira Assessoria Bancária
 * Recebe leads do site (Next.js /api/leads) e grava na planilha.
 *
 * • Lead mais novo SEMPRE na linha 2 (topo), logo abaixo do cabeçalho.
 * • Coluna "Nº" numera cada lead (o do topo = total de leads recebidos).
 * • A planilha é organizada automaticamente (cabeçalho, larguras, formatos,
 *   filtro, lista de Status com cores, painel de totais na aba "Resumo").
 *
 * Configuração (uma vez):
 *   1. Cole o token na linha TOKEN_NO_CODIGO abaixo (valor de GOOGLE_SCRIPT_TOKEN no .env.local).
 *      (Alternativa: Propriedades do script > TOKEN. Se as duas existirem, qualquer uma vale.)
 *   2. Rode a função organizarPlanilha uma vez pelo editor (botão ▶ Executar) e autorize.
 *   3. Rode a função testarToken: o log deve mostrar "TOKEN configurado: SIM".
 *   4. Implantar > Gerenciar implantações > ✏ Editar > Versão: "Nova versão" > Implantar
 *      (mantém a mesma URL /exec).
 */

var TOKEN_NO_CODIGO = 'COLE_AQUI_O_TOKEN';

var SPREADSHEET_ID = '1155FP3vk76z4YIDsaBCdgKLdQDk_8-B-1x_WYM7NbB8';
var SHEET_GID = 0;                    // aba do link (gid=0)
var NOME_ABA = 'Leads';               // nome que a aba recebe ao organizar
var NOME_ABA_RESUMO = 'Resumo';
var TIMEZONE = 'America/Fortaleza';   // UTC-3 (Teresina)

var COR_PRETO = '#0A0A0A';
var COR_DOURADO = '#C9A24B';

// [cabeçalho, chave no JSON, largura em px]
var COLUNAS = [
  ['Nº', '_numero', 60],
  ['Data/Hora', '_dataHora', 140],
  ['Status', '_status', 140],
  ['Nome completo', 'nome', 220],
  ['WhatsApp', 'celular', 130],
  ['Abrir WhatsApp', '_linkWhatsapp', 120],
  ['CPF', 'cpf', 120],
  ['Data de nascimento', 'nascimento', 120],
  ['E-mail', 'email', 200],
  ['Valor solicitado', 'valor', 120],
  ['Parcelas', 'prazo', 80],
  ['Motivo', 'motivo', 170],
  ['CEP', 'cep', 90],
  ['Rua/Avenida', 'logradouro', 220],
  ['Número', 'numero', 70],
  ['Complemento', 'complemento', 130],
  ['Bairro', 'bairro', 150],
  ['Cidade', 'cidade', 140],
  ['UF', 'uf', 50],
  ['Consentimento LGPD', '_consentimento', 110],
  ['Origem (UTM)', 'origem', 200],
  ['Protocolo', 'protocolo', 120],
  ['Observações', '_obs', 260],
];

var COLUNAS_TEXTO = ['protocolo', 'cpf', 'celular', 'nascimento', 'cep', 'numero'];

var STATUS = [
  ['Novo', '#FFF4CC', '#7A5B00'],
  ['Em contato', '#DCEBFF', '#0B4AA2'],
  ['Documentação', '#EDE3FF', '#5B2EA6'],
  ['Proposta enviada', '#FFE7D1', '#9A4A00'],
  ['Aprovado', '#D8F5DF', '#146C2E'],
  ['Recusado', '#FBDADA', '#A11B1B'],
  ['Sem resposta', '#ECECEC', '#555555'],
];

/* ============================== ENTRADA ============================== */

function doPost(e) {
  try {
    var dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var validos = tokensValidos_();
    if (!dados.token || validos.indexOf(String(dados.token)) < 0) {
      return json_({ ok: false, erro: 'nao_autorizado', tokenConfigurado: validos.length > 0 });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(25000);
    var numero;
    try {
      var aba = getAba_();
      if (!cabecalhoOk_(aba)) organizarAba_(aba);
      numero = proximoNumero_(aba);
      inserirNoTopo_(aba, montarLinha_(dados, numero), dados.celular);
      atualizarResumo_();
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, numero: numero });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, erro: String(err) });
  }
}

// Abrir a URL /exec no navegador deve mostrar {"ok":true,"status":"online","versao":3,...}
function doGet() {
  return json_({ ok: true, status: 'online', versao: 3, tokenConfigurado: tokensValidos_().length > 0 });
}

function tokensValidos_() {
  var lista = [];
  var prop = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (prop && prop.trim()) lista.push(prop.trim());
  if (TOKEN_NO_CODIGO && TOKEN_NO_CODIGO !== 'COLE_AQUI_O_TOKEN') lista.push(TOKEN_NO_CODIGO.trim());
  return lista;
}

/** Rode pelo editor para conferir a configuração (não mostra o token). */
function testarToken() {
  var v = tokensValidos_();
  console.log('TOKEN configurado: ' + (v.length ? 'SIM' : 'NÃO'));
  v.forEach(function (t) { console.log('Tamanho: ' + t.length + ' (deve ser 48) · começa com: ' + t.slice(0, 4)); });
}

/* ============================ ORGANIZAÇÃO ============================ */

/** Rode manualmente quando quiser reorganizar tudo. Não apaga dados. */
function organizarPlanilha() {
  var aba = getAba_();
  organizarAba_(aba);
  atualizarResumo_();
}

function organizarAba_(aba) {
  var total = COLUNAS.length;
  aba.setName(NOME_ABA);
  SpreadsheetApp.openById(SPREADSHEET_ID).setSpreadsheetTimeZone(TIMEZONE);

  // Cabeçalho (se a linha 1 tiver outro cabeçalho e já houver dados, não sobrescreve)
  var atual = aba.getRange(1, 1, 1, total).getValues()[0];
  var vazio = atual.join('') === '';
  if (!vazio && !cabecalhoOk_(aba) && aba.getLastRow() > 1) {
    throw new Error('A linha 1 já tem outro cabeçalho com dados abaixo. Mova os dados para outra aba e rode organizarPlanilha.');
  }

  // Garante colunas suficientes
  if (aba.getMaxColumns() < total) aba.insertColumnsAfter(aba.getMaxColumns(), total - aba.getMaxColumns());
  var extras = aba.getMaxColumns() - total;
  if (extras > 0 && aba.getRange(1, total + 1, aba.getMaxRows(), extras).getValues().join('').replace(/,/g, '') === '') {
    aba.deleteColumns(total + 1, extras);
  }
  if (aba.getMaxRows() < 500) aba.insertRowsAfter(aba.getMaxRows(), 500 - aba.getMaxRows());

  var cab = aba.getRange(1, 1, 1, total);
  cab.setValues([COLUNAS.map(function (c) { return c[0]; })])
    .setBackground(COR_PRETO)
    .setFontColor(COR_DOURADO)
    .setFontWeight('bold')
    .setFontFamily('Montserrat')
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center')
    .setWrap(true);
  aba.setRowHeight(1, 40);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(4); // Nº, Data, Status, Nome sempre visíveis

  COLUNAS.forEach(function (c, i) { aba.setColumnWidth(i + 1, c[2]); });

  // Formatos das colunas de dados (linha 2 até o fim)
  var linhas = aba.getMaxRows() - 1;
  var dadosRange = aba.getRange(2, 1, linhas, total);
  dadosRange.setFontFamily('Montserrat').setFontSize(10).setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  COLUNAS.forEach(function (c, i) {
    var col = aba.getRange(2, i + 1, linhas, 1);
    if (COLUNAS_TEXTO.indexOf(c[1]) >= 0) col.setNumberFormat('@');
    if (c[1] === 'valor') col.setNumberFormat('"R$" #,##0.00');
    if (c[1] === 'prazo') col.setNumberFormat('0"x"');
    if (c[1] === '_dataHora') col.setNumberFormat('dd/MM/yyyy HH:mm:ss');
    if (['_numero', 'prazo', 'uf', '_consentimento', '_status'].indexOf(c[1]) >= 0) col.setHorizontalAlignment('center');
  });
  aba.getRange(2, idx_('_numero'), linhas, 1).setFontWeight('bold').setFontColor('#8A6A2B');

  // Lista suspensa de Status
  var regraStatus = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS.map(function (s) { return s[0]; }), true)
    .setAllowInvalid(false).build();
  aba.getRange(2, idx_('_status'), linhas, 1).setDataValidation(regraStatus);

  // Cores por Status (começa na linha 1 para a regra acompanhar as linhas inseridas no topo)
  var colStatus = colLetra_(idx_('_status'));
  var regras = [];
  STATUS.forEach(function (s) {
    regras.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + colStatus + '1="' + s[0] + '"')
      .setBackground(s[1]).setFontColor(s[2]).setBold(true)
      .setRanges([aba.getRange(1, idx_('_status'), aba.getMaxRows(), 1)]).build());
  });
  aba.setConditionalFormatRules(regras);

  // Linhas alternadas
  aba.getBandings().forEach(function (b) { b.remove(); });
  aba.getRange(1, 1, aba.getMaxRows(), total)
    .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(COR_PRETO);

  // Filtro no cabeçalho
  if (aba.getFilter()) aba.getFilter().remove();
  aba.getRange(1, 1, aba.getMaxRows(), total).createFilter();

  // Reaplica formatos nas linhas já existentes (ex.: link de WhatsApp)
  for (var r = 2; r <= aba.getLastRow(); r++) formatarLinha_(aba, r);
}

/* =============================== LINHAS =============================== */

function montarLinha_(d, numero) {
  var celular = String(d.celular || '').replace(/\D/g, '');
  var extras = {
    _numero: numero,
    _dataHora: new Date(),
    _status: 'Novo',
    _linkWhatsapp: '', // preenchido como link nativo em inserirNoTopo_ (sem fórmula)
    _consentimento: d.consentimento === true ? 'Sim' : 'Não',
    _obs: '',
  };
  return COLUNAS.map(function (c) {
    var k = c[1];
    if (k in extras) return extras[k];
    var v = d[k];
    if (v === undefined || v === null) return '';
    if (k === 'valor' || k === 'prazo') return Number(v) || '';
    return sanitizar_(String(v));
  });
}

function inserirNoTopo_(aba, linha, celular) {
  aba.insertRowBefore(2);
  // a linha nova herda o estilo do cabeçalho: limpa e aplica o padrão de dados
  var range = aba.getRange(2, 1, 1, linha.length);
  range.clearFormat();
  COLUNAS.forEach(function (c, i) {
    if (COLUNAS_TEXTO.indexOf(c[1]) >= 0) aba.getRange(2, i + 1).setNumberFormat('@');
  });
  range.setValues([linha]);
  definirLinkWhatsapp_(aba, 2, celular);
  formatarLinha_(aba, 2);
}

/** Link clicável nativo (texto rico) — funciona em qualquer idioma/locale da planilha. */
function definirLinkWhatsapp_(aba, r, celular) {
  var digitos = String(celular || '').replace(/\D/g, '');
  var cel = aba.getRange(r, idx_('_linkWhatsapp'));
  if (!digitos) return cel.setValue('');
  cel.setRichTextValue(
    SpreadsheetApp.newRichTextValue()
      .setText('💬 Chamar')
      .setLinkUrl('https://wa.me/55' + digitos)
      .build()
  );
}

/**
 * Rode UMA VEZ pelo editor para consertar linhas antigas que ficaram com #ERRO
 * na coluna "Abrir WhatsApp" (recria o link a partir da coluna WhatsApp).
 */
function corrigirLinksWhatsapp() {
  var aba = getAba_();
  for (var r = 2; r <= aba.getLastRow(); r++) {
    definirLinkWhatsapp_(aba, r, aba.getRange(r, idx_('celular')).getDisplayValue());
  }
}

function formatarLinha_(aba, r) {
  var total = COLUNAS.length;
  var range = aba.getRange(r, 1, 1, total);
  range.setFontFamily('Montserrat').setFontSize(10).setVerticalAlignment('middle')
    .setFontColor('#1A1A1A').setFontWeight('normal')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  aba.setRowHeight(r, 28);
  aba.getRange(r, idx_('valor')).setNumberFormat('"R$" #,##0.00');
  aba.getRange(r, idx_('prazo')).setNumberFormat('0"x"');
  aba.getRange(r, idx_('_dataHora')).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  aba.getRange(r, idx_('_numero')).setFontWeight('bold').setFontColor('#8A6A2B');
  ['_numero', 'prazo', 'uf', '_consentimento', '_status', '_linkWhatsapp'].forEach(function (k) {
    aba.getRange(r, idx_(k)).setHorizontalAlignment('center');
  });
  aba.getRange(r, idx_('_linkWhatsapp')).setFontColor('#128C3E').setFontWeight('bold');
  aba.getRange(r, idx_('_status')).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUS.map(function (s) { return s[0]; }), true)
      .setAllowInvalid(false).build());
}

/** Contador sequencial que nunca repete, mesmo se linhas forem apagadas. */
function proximoNumero_(aba) {
  var props = PropertiesService.getScriptProperties();
  var atual = Number(props.getProperty('CONTADOR_LEADS') || 0);
  if (!atual && aba.getLastRow() > 1) {
    var nums = aba.getRange(2, idx_('_numero'), aba.getLastRow() - 1, 1).getValues()
      .map(function (r) { return Number(r[0]) || 0; });
    atual = Math.max.apply(null, nums.concat([0]));
  }
  var proximo = atual + 1;
  props.setProperty('CONTADOR_LEADS', String(proximo));
  return proximo;
}

/* =============================== RESUMO =============================== */

function atualizarResumo_() {
  var planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  var res = planilha.getSheetByName(NOME_ABA_RESUMO) || planilha.insertSheet(NOME_ABA_RESUMO);
  if (res.getRange('A1').getValue() === 'RESUMO DE LEADS') return; // já montado (fórmulas se atualizam sozinhas)

  // Colunas inteiras (A:A) para as fórmulas continuarem certas quando leads entram no topo
  var L = "'" + NOME_ABA + "'!";
  var col = function (k) { var c = colLetra_(idx_(k)); return L + c + ':' + c; };
  var cStatus = col('_status');
  var cNome = col('nome');
  var cData = col('_dataHora');
  var cValor = col('valor');

  res.clear();
  var linhas = [
    ['RESUMO DE LEADS', ''],
    ['Total de leads na planilha', '=COUNTA(' + cNome + ')-1'],
    ['Leads hoje', '=COUNTIFS(' + cData + ';">="&TODAY();' + cData + ';"<"&(TODAY()+1))'],
    ['Leads últimos 7 dias', '=COUNTIF(' + cData + ';">="&(TODAY()-6))'],
    ['Valor total solicitado', '=SUM(' + cValor + ')'],
    ['Ticket médio', '=IFERROR(AVERAGE(' + cValor + ');0)'],
    ['', ''],
    ['POR STATUS', ''],
  ];
  STATUS.forEach(function (s) { linhas.push([s[0], '=COUNTIF(' + cStatus + ';"' + s[0] + '")']); });
  linhas.push(['Taxa de aprovação', '']);

  // Planilha em português (pt-BR): fórmulas usam ";" como separador de argumentos
  res.getRange(1, 1, linhas.length, 1).setValues(linhas.map(function (l) { return [l[0]]; }));
  linhas.forEach(function (l, i) {
    if (String(l[1]).charAt(0) === '=') res.getRange(i + 1, 2).setFormula(l[1]);
  });
  res.setColumnWidth(1, 240);
  res.setColumnWidth(2, 160);
  res.getRange(1, 1, linhas.length, 2).setFontFamily('Montserrat').setFontSize(11);
  [1, 8].forEach(function (r) {
    res.getRange(r, 1, 1, 2).setBackground(COR_PRETO).setFontColor(COR_DOURADO).setFontWeight('bold');
  });
  res.getRange('B2').setFontSize(18).setFontWeight('bold').setFontColor('#8A6A2B');
  res.getRange('B5:B6').setNumberFormat('"R$" #,##0.00');
  res.getRange(1 + linhas.length - 1, 2).setNumberFormat('0.0%');
  res.getRange(2, 2, linhas.length - 1, 1).setHorizontalAlignment('right');
  // fórmula de aprovação aponta para a linha "Aprovado"
  var linhaAprovado = 9 + STATUS.map(function (s) { return s[0]; }).indexOf('Aprovado');
  res.getRange(linhas.length, 2).setFormula('=IFERROR(B' + linhaAprovado + '/B2;0)');
}

/* ============================== UTILITÁRIOS ============================== */

function getAba_() {
  var planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  var abas = planilha.getSheets();
  for (var i = 0; i < abas.length; i++) if (abas[i].getSheetId() === SHEET_GID) return abas[i];
  return planilha.getSheetByName(NOME_ABA) || abas[0];
}

function cabecalhoOk_(aba) {
  var atual = aba.getRange(1, 1, 1, COLUNAS.length).getValues()[0];
  return COLUNAS.every(function (c, i) { return atual[i] === c[0]; });
}

function idx_(chave) {
  for (var i = 0; i < COLUNAS.length; i++) if (COLUNAS[i][1] === chave) return i + 1;
  throw new Error('Coluna não encontrada: ' + chave);
}

function colLetra_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// Evita injeção de fórmula (=, +, -, @) vinda do formulário
function sanitizar_(texto) {
  texto = texto.slice(0, 300);
  return /^[=+\-@]/.test(texto) ? "'" + texto : texto;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
