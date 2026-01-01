const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 13 && cleaned.startsWith('55');
};

const isValidCPF = (cpf) => {
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
};

const isValidRandomKey = (key) => {
  return key.length === 36 && key.split('-').length === 5;
};

const validatePixKey = (type, key) => {
  switch (type) {
  case 'cpf':
    if (!isValidCPF(key)) {
      throw new Error('Invalid CPF format');
    }
    break;
  case 'email':
    if (!isValidEmail(key)) {
      throw new Error('Invalid email format');
    }
    break;
  case 'phone':
    if (!isValidPhone(key)) {
      throw new Error('Invalid phone format. Must be in format +55XXYYYYYYYYY');
    }
    break;
  case 'random':
    if (!isValidRandomKey(key)) {
      throw new Error('Invalid random key format');
    }
    break;
  default:
    throw new Error('Invalid PIX key type');
  }
};

const formatAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    throw new Error('Invalid amount');
  }
  return Math.round(num * 100) / 100;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isValidRandomKey,
  validatePixKey,
  formatAmount
};
