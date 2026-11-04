import {
  isValidBirthDate,
  isValidCEP,
  isValidCPF,
  isValidEmail,
  isValidFullName,
  isValidPhone,
  UFS,
} from "./validators";

export const VALOR_MIN = 1000;
export const VALOR_MAX = 50000;
export const VALOR_PASSO = 500;
export const PRAZOS = [12, 24, 36, 48] as const;

export const WHATSAPP_NUMERO = "5586995139158";

export type Lead = {
  valor: number;
  prazo: number;
  motivo: string;
  nome: string;
  cpf: string;
  nascimento: string;
  celular: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  consentimento: boolean;
  origem: string;
};

export const LEAD_VAZIO: Lead = {
  valor: 5000,
  prazo: 24,
  motivo: "",
  nome: "",
  cpf: "",
  nascimento: "",
  celular: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  consentimento: false,
  origem: "",
};

export type Errors = Partial<Record<keyof Lead, string>>;

export function validarSimulacao(l: Lead): Errors {
  const e: Errors = {};
  if (!(l.valor >= VALOR_MIN && l.valor <= VALOR_MAX)) e.valor = "Escolha um valor válido.";
  if (!PRAZOS.includes(l.prazo as (typeof PRAZOS)[number])) e.prazo = "Escolha um prazo.";
  if (!l.motivo.trim()) e.motivo = "Selecione para que é o dinheiro.";
  return e;
}

export function validarDadosPessoais(l: Lead): Errors {
  const e: Errors = {};
  if (!isValidFullName(l.nome)) e.nome = "Informe seu nome completo (nome e sobrenome).";
  if (!isValidCPF(l.cpf)) e.cpf = "CPF inválido. Confira os números.";
  if (!isValidPhone(l.celular)) e.celular = "Informe seu WhatsApp com DDD, ex.: (86) 99999-9999.";
  if (!isValidBirthDate(l.nascimento))
    e.nascimento = "Data inválida. É preciso ter 18 anos ou mais.";
  if (l.email && !isValidEmail(l.email)) e.email = "E-mail inválido.";
  return e;
}

export function validarEndereco(l: Lead): Errors {
  const e: Errors = {};
  if (!isValidCEP(l.cep)) e.cep = "CEP inválido.";
  if (l.logradouro.trim().length < 3) e.logradouro = "Informe a rua/avenida.";
  if (!l.numero.trim()) e.numero = "Informe o número (ou S/N).";
  if (!l.complemento.trim()) e.complemento = "Informe o complemento (ou \"Não tem\").";
  if (l.bairro.trim().length < 2) e.bairro = "Informe o bairro.";
  if (l.cidade.trim().length < 2) e.cidade = "Informe a cidade.";
  if (!UFS.includes(l.uf)) e.uf = "Selecione o estado.";
  return e;
}

export function validarConsentimento(l: Lead): Errors {
  return l.consentimento ? {} : { consentimento: "É necessário aceitar para continuar." };
}

export function validarTudo(l: Lead): Errors {
  return {
    ...validarSimulacao(l),
    ...validarDadosPessoais(l),
    ...validarEndereco(l),
    ...validarConsentimento(l),
  };
}
