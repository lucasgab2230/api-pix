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
        key: '98765432100',
        name: 'Test User',
        bank: 'Itaú',
        account: '54321-0',
        agency: '0001'
      };

      const result = pixService.registerPixKey(newKey);

      expect(result).toHaveProperty('id');
      expect(result.key).toBe('98765432100');
      expect(result.name).toBe('Test User');
      expect(result.active).toBe(true);
      expect(result).toHaveProperty('createdAt');
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
    });
  });

  describe('getPixKey', () => {
    test('should return the correct PIX key', () => {
      const key = pixService.getPixKey('12345678900');

      expect(key).toBeDefined();
      expect(key.key).toBe('12345678900');
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
      const result = pixService.deletePixKey('12345678900');
      const key = pixService.getPixKey('12345678900');

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
        '12345678900',
        '+5511999999999',
        100.50,
        'Payment'
      );

      expect(transaction).toHaveProperty('id');
      expect(transaction.senderKey).toBe('12345678900');
      expect(transaction.receiverKey).toBe('+5511999999999');
      expect(transaction.amount).toBe(100.50);
      expect(transaction.description).toBe('Payment');
      expect(transaction.status).toBe('completed');
      expect(transaction).toHaveProperty('createdAt');
    });

    test('should throw error for invalid sender key', () => {
      expect(() => {
        pixService.createTransaction('00000000000', '+5511999999999', 50);
      }).toThrow('Invalid PIX key');
    });

    test('should throw error for invalid receiver key', () => {
      expect(() => {
        pixService.createTransaction('12345678900', '00000000000', 50);
      }).toThrow('Invalid PIX key');
    });

    test('should throw error when sending to same key', () => {
      expect(() => {
        pixService.createTransaction('12345678900', '12345678900', 50);
      }).toThrow('Cannot send to same key');
    });

    test('should throw error for inactive keys', () => {
      pixService.deletePixKey('12345678900');

      expect(() => {
        pixService.createTransaction('12345678900', '+5511999999999', 50);
      }).toThrow('Inactive PIX key');
    });
  });

  describe('getTransaction', () => {
    test('should return the correct transaction', () => {
      const created = pixService.createTransaction('12345678900', '+5511999999999', 100);
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
      pixService.createTransaction('12345678900', '+5511999999999', 100);
      pixService.createTransaction('12345678900', '+5511999999999', 50);
      pixService.createTransaction('+5511999999999', '12345678900', 200);
    });

    test('should return all transactions for a PIX key as sender', () => {
      const transactions = pixService.getTransactionsByPixKey('12345678900');

      expect(transactions).toHaveLength(3);
      expect(transactions.every(t => t.senderKey === '12345678900' || t.receiverKey === '12345678900')).toBe(true);
    });

    test('should return all transactions for a PIX key as receiver', () => {
      const transactions = pixService.getTransactionsByPixKey('+5511999999999');

      expect(transactions).toHaveLength(3);
    });
  });

  describe('getAllTransactions', () => {
    test('should return all transactions', () => {
      pixService.createTransaction('12345678900', '+5511999999999', 100);
      pixService.createTransaction('+5511999999999', '12345678900', 50);

      const transactions = pixService.getAllTransactions();

      expect(transactions).toHaveLength(2);
    });
  });
});
