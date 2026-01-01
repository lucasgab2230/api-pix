export type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

export interface PixKeyData {
  type: PixKeyType;
  key: string;
  name: string;
  bank: string;
  account: string;
  agency: string;
}

export interface TransactionLimits {
  daily: number;
  single: number;
  frequency: number;
}

export const BACEN_LIMITS: TransactionLimits = {
  daily: 50000,
  single: 15000,
  frequency: 20
};

export const BACEN_STATUS = {
  pending: 'pending',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled'
} as const;

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 13 && cleaned.startsWith('55');
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;

  return true;
}

export function isValidRandomKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

export function validatePixKey(type: PixKeyType, key: string): { valid: boolean; error?: string } {
  switch (type) {
    case 'cpf':
      if (!isValidCPF(key)) {
        return { valid: false, error: 'CPF inválido. Verifique os dígitos.' };
      }
      break;
    case 'email':
      if (!isValidEmail(key)) {
        return { valid: false, error: 'E-mail inválido. Verifique o formato.' };
      }
      break;
    case 'phone':
      if (!isValidPhone(key)) {
        return { valid: false, error: 'Telefone inválido. Use formato +55XXYYYYYYYYY' };
      }
      break;
    case 'random':
      if (!isValidRandomKey(key)) {
        return { valid: false, error: 'Chave aleatória inválida.' };
      }
      break;
    default:
      return { valid: false, error: 'Tipo de chave PIX inválido' };
  }

  return { valid: true };
}

export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: 'Valor deve ser um número' };
  }
  if (amount <= 0) {
    return { valid: false, error: 'Valor deve ser maior que zero' };
  }
  if (amount > BACEN_LIMITS.single) {
    return { valid: false, error: `Valor máximo por transação: R$ ${BACEN_LIMITS.single.toLocaleString('pt-BR')}` };
  }
  return { valid: true };
}

export function validateBankAccount(account: string): { valid: boolean; error?: string } {
  const cleaned = account.replace(/\D/g, '');
  if (cleaned.length < 5 || cleaned.length > 12) {
    return { valid: false, error: 'Número da conta inválido' };
  }
  return { valid: true };
}

export function validateAgency(agency: string): { valid: boolean; error?: string } {
  const cleaned = agency.replace(/\D/g, '');
  if (cleaned.length < 3 || cleaned.length > 5) {
    return { valid: false, error: 'Número da agência inválido' };
  }
  return { valid: true };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  }
  return phone;
}

export function maskCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, g1, g2, g3, g4) => {
    return g1 + '.' + g2 + '.' + g3 + (g4 ? '-' + g4 : '');
  });
}

export function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) {
    return '+' + cleaned;
  } else if (cleaned.length <= 4) {
    return '+' + cleaned.substring(0, 2) + ' (' + cleaned.substring(2);
  } else if (cleaned.length <= 9) {
    return '+' + cleaned.substring(0, 2) + ' (' + cleaned.substring(2, 4) + ') ' + cleaned.substring(4);
  } else {
    return '+' + cleaned.substring(0, 2) + ' (' + cleaned.substring(2, 4) + ') ' + cleaned.substring(4, 9) + '-' + cleaned.substring(9, 13);
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface ComplianceCheck {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

export function performKYCCheck(data: PixKeyData): ComplianceCheck {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!data.name || data.name.length < 3) {
    errors.push('Nome incompleto ou inválido');
  }

  if (!data.bank || data.bank.length < 2) {
    errors.push('Banco não informado');
  }

  const accountValid = validateBankAccount(data.account);
  if (!accountValid.valid) {
    errors.push(accountValid.error || 'Conta bancária inválida');
  }

  const agencyValid = validateAgency(data.agency);
  if (!agencyValid.valid) {
    errors.push(agencyValid.error || 'Agência bancária inválida');
  }

  const keyValid = validatePixKey(data.type, data.key);
  if (!keyValid.valid) {
    errors.push(keyValid.error || 'Chave PIX inválida');
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors
  };
}

export function checkAMLTransaction(amount: number, frequency: number, dailyTotal: number): ComplianceCheck {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (amount > 10000) {
    warnings.push('Transação acima de R$ 10.000,00 - verificação adicional recomendada');
  }

  if (frequency >= 15) {
    warnings.push('Alta frequência de transações no período');
  }

  if (dailyTotal > 40000) {
    warnings.push('Volume diário elevado de transações');
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors
  };
}
