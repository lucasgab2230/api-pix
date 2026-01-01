const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface PixKey {
  id: string;
  type: 'cpf' | 'email' | 'phone' | 'random';
  key: string;
  name: string;
  bank: string;
  account: string;
  agency: string;
  balance: number;
  active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  senderKey: string;
  senderName: string;
  receiverKey: string;
  receiverName: string;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePixKeyRequest {
  type: 'cpf' | 'email' | 'phone' | 'random';
  key: string;
  name: string;
  bank: string;
  account: string;
  agency: string;
  initialBalance?: number;
}

export interface CreateTransactionRequest {
  senderKey: string;
  receiverKey: string;
  amount: number;
  description?: string;
}

export interface Balance {
  key: string;
  name: string;
  balance: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  totalSentAmount: number;
  totalReceivedAmount: number;
}

class PixApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
  }

  async getPixKeys(): Promise<PixKey[]> {
    return this.request<PixKey[]>('/pix/keys');
  }

  async getPixKey(key: string): Promise<PixKey> {
    return this.request<PixKey>(`/pix/keys/${encodeURIComponent(key)}`);
  }

  async createPixKey(data: CreatePixKeyRequest): Promise<PixKey> {
    return this.request<PixKey>('/pix/keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePixKey(key: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/pix/keys/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }

  async getBalance(key: string): Promise<Balance> {
    return this.request<Balance>(`/pix/keys/${encodeURIComponent(key)}/balance`);
  }

  async deposit(key: string, amount: number): Promise<{ key: string; amount: number; newBalance: number; timestamp: string }> {
    return this.request(`/pix/keys/${encodeURIComponent(key)}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async withdraw(key: string, amount: number): Promise<{ key: string; amount: number; newBalance: number; timestamp: string }> {
    return this.request(`/pix/keys/${encodeURIComponent(key)}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getStats(key: string): Promise<TransactionStats> {
    return this.request<TransactionStats>(`/pix/keys/${encodeURIComponent(key)}/stats`);
  }

  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransaction(id: string): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/transactions');
  }

  async getTransactionsByPixKey(key: string): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/transactions/pix/${encodeURIComponent(key)}`);
  }

  async cancelTransaction(id: string): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }
}

export const pixApi = new PixApiService();
