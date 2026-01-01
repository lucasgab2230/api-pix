export interface Bank {
  id: string;
  code: string;
  name: string;
  logo?: string;
  color: string;
  ispb: string;
  active: boolean;
}

export const AVAILABLE_BANKS: Bank[] = [
  {
    id: 'nubank',
    code: '260',
    name: 'Nubank',
    ispb: 'NUBR',
    color: '#820AD1',
    active: true,
  },
  {
    id: 'itau',
    code: '341',
    name: 'Itaú Unibanco',
    ispb: '60701190',
    color: '#FF6A00',
    active: true,
  },
  {
    id: 'bradesco',
    code: '237',
    name: 'Banco Bradesco',
    ispb: '60746948',
    color: '#EC7000',
    active: true,
  },
  {
    id: 'santander',
    code: '033',
    name: 'Banco Santander',
    ispb: '90400888',
    color: '#CC0000',
    active: true,
  },
  {
    id: 'banco-do-brasil',
    code: '001',
    name: 'Banco do Brasil',
    ispb: '00360305',
    color: '#FFCD00',
    active: true,
  },
  {
    id: 'caixa',
    code: '104',
    name: 'Caixa Econômica Federal',
    ispb: '00360306',
    color: '#0D4F8C',
    active: true,
  },
  {
    id: 'inter',
    code: '077',
    name: 'Inter',
    ispb: '00416975',
    color: '#FF7F00',
    active: true,
  },
  {
    id: 'picpay',
    code: '290',
    name: 'PicPay',
    ispb: '29020344',
    color: '#21C25E',
    active: true,
  },
  {
    id: 'original',
    code: '212',
    name: 'Banco Original',
    ispb: '12927723',
    color: '#FF6200',
    active: true,
  },
  {
    id: 'sicoob',
    code: '756',
    name: 'Sicoob',
    ispb: '48883991',
    color: '#004F9F',
    active: true,
  },
  {
    id: 'mercadopago',
    code: '089',
    name: 'Mercado Pago',
    ispb: '09001202',
    color: '#00A859',
    active: true,
  },
];

export interface BankConfig {
  defaultBank: string;
  allowedBanks: string[];
  enableOpenFinance: boolean;
}

const STORAGE_KEY = 'baas_bank_config';

export function getBankConfig(): BankConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading bank config:', error);
  }
  
  return {
    defaultBank: 'nubank',
    allowedBanks: AVAILABLE_BANKS.map(b => b.id),
    enableOpenFinance: false,
  };
}

export function saveBankConfig(config: Partial<BankConfig>): void {
  const currentConfig = getBankConfig();
  const newConfig = { ...currentConfig, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
}

export function getBankById(id: string): Bank | undefined {
  return AVAILABLE_BANKS.find(bank => bank.id === id);
}

export function getBanksByISPB(ispb: string): Bank[] {
  return AVAILABLE_BANKS.filter(bank => bank.ispb === ispb);
}

export function getActiveBanks(): Bank[] {
  return AVAILABLE_BANKS.filter(bank => bank.active);
}

export interface OpenFinanceDataSharing {
  enabled: boolean;
  consentDate?: string;
  scopes: string[];
}

export interface OpenFinanceConsent {
  dataSharing: OpenFinanceDataSharing;
  startDate?: string;
  endDate?: string;
}

export function requestOpenFinanceConsent(scopes: string[]): Promise<OpenFinanceConsent> {
  return new Promise((resolve) => {
    const consent: OpenFinanceConsent = {
      dataSharing: {
        enabled: true,
        consentDate: new Date().toISOString(),
        scopes,
      },
      startDate: new Date().toISOString(),
    };
    
    localStorage.setItem('open_finance_consent', JSON.stringify(consent));
    
    resolve(consent);
  });
}

export function revokeOpenFinanceConsent(): void {
  localStorage.removeItem('open_finance_consent');
  const config = getBankConfig();
  saveBankConfig({ ...config, enableOpenFinance: false });
}

export function getOpenFinanceConsent(): OpenFinanceConsent | null {
  try {
    const stored = localStorage.getItem('open_finance_consent');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading Open Finance consent:', error);
  }
  return null;
}

export const OPEN_FINANCE_SCOPES = {
  ACCOUNTS: 'contas',
  TRANSACTIONS: 'transacoes',
  CREDIT: 'credito',
  INVESTMENTS: 'investimentos',
  PIX_KEYS: 'chaves_pix',
} as const;

export interface OpenFinanceBankData {
  bankId: string;
  accounts: Array<{
    accountNumber: string;
    branch: string;
    balance: number;
    type: 'corrente' | 'poupanca' | 'salario';
  }>;
  pixKeys: Array<{
    key: string;
    type: 'cpf' | 'email' | 'phone' | 'random';
    status: 'active' | 'inactive';
  }>;
}

export function shareDataWithOpenFinance(bankData: OpenFinanceBankData): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const consent = getOpenFinanceConsent();
    if (!consent) {
      resolve({ success: false, message: 'Consentimento Open Finance não concedido' });
      return;
    }

    console.log('Sharing data with Open Finance:', bankData);
    
    setTimeout(() => {
      resolve({ success: true, message: 'Dados compartilhados com sucesso via Open Finance' });
    }, 1000);
  });
}

export function getOpenFinanceAvailableBanks(): Bank[] {
  const config = getBankConfig();
  if (!config.enableOpenFinance) {
    return [];
  }
  
  return AVAILABLE_BANKS.filter(bank => 
    config.allowedBanks.includes(bank.id) && bank.active
  );
}

export function syncOpenFinanceData(): Promise<{ success: boolean; message: string; syncedCount: number }> {
  return new Promise((resolve) => {
    const consent = getOpenFinanceConsent();
    if (!consent) {
      resolve({ success: false, message: 'Consentimento Open Finance não concedido', syncedCount: 0 });
      return;
    }

    console.log('Syncing data with Open Finance...');
    
    setTimeout(() => {
      resolve({ 
        success: true, 
        message: 'Sincronização Open Finance realizada com sucesso', 
        syncedCount: Math.floor(Math.random() * 10) + 1
      });
    }, 1500);
  });
}
