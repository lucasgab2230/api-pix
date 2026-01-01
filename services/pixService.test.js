const pixService = require('./pixService');

describe('PixService', () => {
  beforeEach(() => {
    pixService.pixKeys.clear();
    pixService.transactions.clear();
    pixService.initializeMockData();
  });

  describe('registerPixKey', () => {
    test('should register a new PIX key with CPF', () => {
      const newKey = {
        type: 'cpf',
        key: '52998224725',
        name: 'Test User',
        bank: 'Itaú',
        account: '54321-0',
        agency: '0001'
      };

      const result = pixService.registerPixKey(newKey);

      expect(result).toHaveProperty('id');
      expect(result.key).toBe('52998224725');
      expect(result.name).toBe('Test User');
      expect(result.active).toBe(true);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('balance', 0);
    });

    test('should register a new PIX key with email', () => {
      const newKey = {
        type: 'email',
        key: 'test@email.com',
        name: 'Test User',
        bank: 'Bradesco',
        account: '11111-1',
        agency: '0001'
      };

      const result = pixService.registerPixKey(newKey);

      expect(result).toHaveProperty('id');
      expect(result.key).toBe('test@email.com');
      expect(result.active).toBe(true);
      expect(result).toHaveProperty('balance', 0);
    });

    test('should throw error for invalid CPF format', () => {
      const newKey = {
        type: 'cpf',
        key: '12345678900',
        name: 'Test User',
        bank: 'Itaú',
        account: '54321-0',
        agency: '0001'
      };

      expect(() => {
        pixService.registerPixKey(newKey);
      }).toThrow('Invalid CPF format');
    });
  });

  describe('getPixKey', () => {
    test('should return the correct PIX key', () => {
      const key = pixService.getPixKey('52998224725');

      expect(key).toBeDefined();
      expect(key.key).toBe('52998224725');
      expect(key.name).toBe('João Silva');
    });

    test('should return undefined for non-existent key', () => {
      const key = pixService.getPixKey('00000000000');

      expect(key).toBeUndefined();
    });
  });

  describe('getAllPixKeys', () => {
    test('should return all PIX keys', () => {
      const keys = pixService.getAllPixKeys();

      expect(keys).toHaveLength(3);
      expect(keys.every(k => k.active === true)).toBe(true);
    });
  });

  describe('deletePixKey', () => {
    test('should deactivate a PIX key', () => {
      const result = pixService.deletePixKey('52998224725');
      const key = pixService.getPixKey('52998224725');

      expect(result).toBe(true);
      expect(key.active).toBe(false);
    });

    test('should return false for non-existent key', () => {
      const result = pixService.deletePixKey('00000000000');

      expect(result).toBe(false);
    });
  });

  describe('createTransaction', () => {
    test('should create a valid transaction', () => {
      const transaction = pixService.createTransaction(
        '52998224725',
        '+5511999999999',
        100.50,
        'Payment'
      );

      expect(transaction).toHaveProperty('id');
      expect(transaction.senderKey).toBe('52998224725');
      expect(transaction.receiverKey).toBe('+5511999999999');
      expect(transaction.amount).toBe(100.50);
      expect(transaction.description).toBe('Payment');
      expect(transaction.status).toBe('pending');
      expect(transaction).toHaveProperty('createdAt');
    });

    test('should throw error for invalid sender key', () => {
      expect(() => {
        pixService.createTransaction('00000000000', '+5511999999999', 50);
      }).toThrow('Invalid PIX key');
    });

    test('should throw error for invalid receiver key', () => {
      expect(() => {
        pixService.createTransaction('52998224725', '00000000000', 50);
      }).toThrow('Invalid PIX key');
    });

    test('should throw error when sending to same key', () => {
      expect(() => {
        pixService.createTransaction('52998224725', '52998224725', 50);
      }).toThrow('Cannot send to same key');
    });

    test('should throw error for inactive keys', () => {
      pixService.deletePixKey('52998224725');

      expect(() => {
        pixService.createTransaction('52998224725', '+5511999999999', 50);
      }).toThrow('Inactive PIX key');
    });

    test('should throw error for insufficient balance', () => {
      pixService.registerPixKey({
        type: 'cpf',
        key: '12345678909',
        name: 'Low Balance User',
        bank: 'Test Bank',
        account: '00000-0',
        agency: '0001',
        initialBalance: 10
      });

      expect(() => {
        pixService.createTransaction('12345678909', '+5511999999999', 50);
      }).toThrow('Insufficient balance');
    });
  });

  describe('getTransaction', () => {
    test('should return the correct transaction', () => {
      const created = pixService.createTransaction('52998224725', '+5511999999999', 100);
      const found = pixService.getTransaction(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    test('should return undefined for non-existent transaction', () => {
      const found = pixService.getTransaction('non-existent-id');

      expect(found).toBeUndefined();
    });
  });

  describe('getTransactionsByPixKey', () => {
    beforeEach(() => {
      pixService.createTransaction('52998224725', '+5511999999999', 100);
      pixService.createTransaction('52998224725', '+5511999999999', 50);
      pixService.createTransaction('+5511999999999', '52998224725', 200);
    });

    test('should return all transactions for a PIX key as sender', () => {
      const transactions = pixService.getTransactionsByPixKey('52998224725');

      expect(transactions).toHaveLength(3);
      expect(transactions.every(t => t.senderKey === '52998224725' || t.receiverKey === '52998224725')).toBe(true);
    });

    test('should return all transactions for a PIX key as receiver', () => {
      const transactions = pixService.getTransactionsByPixKey('+5511999999999');

      expect(transactions).toHaveLength(3);
    });
  });

  describe('getAllTransactions', () => {
    test('should return all transactions', () => {
      pixService.createTransaction('52998224725', '+5511999999999', 100);
      pixService.createTransaction('+5511999999999', '52998224725', 50);

      const transactions = pixService.getAllTransactions();

      expect(transactions).toHaveLength(2);
    });
  });

  describe('Balance Management', () => {
    test('should deposit funds to a PIX key', () => {
      const result = pixService.deposit('52998224725', 500);

      expect(result.amount).toBe(500);
      expect(result.newBalance).toBe(5500);
    });

    test('should withdraw funds from a PIX key', () => {
      const result = pixService.withdraw('52998224725', 500);

      expect(result.amount).toBe(500);
      expect(result.newBalance).toBe(4500);
    });

    test('should throw error when withdrawing insufficient funds', () => {
      expect(() => {
        pixService.withdraw('52998224725', 10000);
      }).toThrow('Insufficient balance');
    });

    test('should return balance for a PIX key', () => {
      const balance = pixService.getBalance('52998224725');

      expect(balance.key).toBe('52998224725');
      expect(balance.balance).toBe(5000);
    });
  });

  describe('Transaction Limits', () => {
    test('should enforce single transaction limit', () => {
      expect(() => {
        pixService.createTransaction('52998224725', '+5511999999999', 15000);
      }).toThrow('Single transaction limit exceeded');
    });

    test('should cancel a pending transaction', () => {
      const transaction = pixService.createTransaction('52998224725', '+5511999999999', 100);
      const cancelled = pixService.cancelTransaction(transaction.id);

      expect(cancelled.status).toBe('cancelled');
    });

    test('should throw error when cancelling completed transaction', () => {
      const transaction = pixService.createTransaction('52998224725', '+5511999999999', 100);
      
      setTimeout(() => {
        expect(() => {
          pixService.cancelTransaction(transaction.id);
        }).toThrow('Cannot cancel transaction');
      }, 200);
    });
  });
});
