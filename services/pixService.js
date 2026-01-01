const { v4: uuidv4 } = require('uuid');
const { validatePixKey, formatAmount } = require('../utils/validators');

const TRANSACTION_LIMITS = {
  DAILY: 50000,
  SINGLE: 10000,
  FREQUENCY: 20
};

class PixService {
  constructor() {
    this.pixKeys = new Map();
    this.transactions = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    this.registerPixKey({
      type: 'cpf',
      key: '52998224725',
      name: 'João Silva',
      bank: 'Banco do Brasil',
      account: '12345-6',
      agency: '0001',
      initialBalance: 5000.00
    });

    this.registerPixKey({
      type: 'email',
      key: 'joao.silva@email.com',
      name: 'João Silva',
      bank: 'Banco do Brasil',
      account: '12345-6',
      agency: '0001',
      initialBalance: 5000.00
    });

    this.registerPixKey({
      type: 'phone',
      key: '+5511999999999',
      name: 'Maria Santos',
      bank: 'Nubank',
      account: '98765-4',
      agency: '0001',
      initialBalance: 3000.00
    });
  }

  registerPixKey(pixData) {
    const { type, key } = pixData;
    
    validatePixKey(type, key);

    const id = uuidv4();
    const pixKey = {
      id,
      type,
      key,
      name: pixData.name,
      bank: pixData.bank,
      account: pixData.account,
      agency: pixData.agency,
      balance: pixData.initialBalance || 0,
      createdAt: new Date().toISOString(),
      active: true,
      dailyTransactionCount: 0,
      dailyTransactionAmount: 0
    };
    this.pixKeys.set(key, pixKey);
    return pixKey;
  }

  getPixKey(key) {
    return this.pixKeys.get(key);
  }

  getAllPixKeys() {
    return Array.from(this.pixKeys.values()).map(key => ({
      id: key.id,
      type: key.type,
      key: key.key,
      name: key.name,
      bank: key.bank,
      account: key.account,
      agency: key.agency,
      balance: key.balance,
      active: key.active,
      createdAt: key.createdAt
    }));
  }

  getTransactionStats(pixKey) {
    const transactions = this.getTransactionsByPixKey(pixKey);
    const sent = transactions.filter(t => t.senderKey === pixKey && t.status === 'completed');
    const received = transactions.filter(t => t.receiverKey === pixKey && t.status === 'completed');

    return {
      totalTransactions: transactions.length,
      totalSent: sent.length,
      totalReceived: received.length,
      totalSentAmount: sent.reduce((sum, t) => sum + t.amount, 0),
      totalReceivedAmount: received.reduce((sum, t) => sum + t.amount, 0)
    };
  }

  deletePixKey(key) {
    const pixKey = this.pixKeys.get(key);
    if (pixKey) {
      pixKey.active = false;
      this.pixKeys.set(key, pixKey);
      return true;
    }
    return false;
  }

  getBalance(key) {
    const pixKey = this.pixKeys.get(key);
    if (!pixKey) {
      throw new Error('PIX key not found');
    }
    return {
      key: pixKey.key,
      name: pixKey.name,
      balance: pixKey.balance
    };
  }

  deposit(key, amount) {
    const pixKey = this.pixKeys.get(key);
    if (!pixKey) {
      throw new Error('PIX key not found');
    }
    if (!pixKey.active) {
      throw new Error('Inactive PIX key');
    }
    const validatedAmount = formatAmount(amount);
    pixKey.balance += validatedAmount;
    this.pixKeys.set(key, pixKey);
    return {
      key,
      amount: validatedAmount,
      newBalance: pixKey.balance,
      timestamp: new Date().toISOString()
    };
  }

  withdraw(key, amount) {
    const pixKey = this.pixKeys.get(key);
    if (!pixKey) {
      throw new Error('PIX key not found');
    }
    if (!pixKey.active) {
      throw new Error('Inactive PIX key');
    }
    const validatedAmount = formatAmount(amount);
    if (pixKey.balance < validatedAmount) {
      throw new Error('Insufficient balance');
    }
    pixKey.balance -= validatedAmount;
    this.pixKeys.set(key, pixKey);
    return {
      key,
      amount: validatedAmount,
      newBalance: pixKey.balance,
      timestamp: new Date().toISOString()
    };
  }

  checkTransactionLimits(senderKey, amount) {
    const sender = this.pixKeys.get(senderKey);
    if (!sender) {
      throw new Error('PIX key not found');
    }

    const today = new Date().toDateString();
    if (sender.lastTransactionDate !== today) {
      sender.dailyTransactionCount = 0;
      sender.dailyTransactionAmount = 0;
      sender.lastTransactionDate = today;
    }

    if (amount > TRANSACTION_LIMITS.SINGLE) {
      throw new Error(`Single transaction limit exceeded. Maximum: R$${TRANSACTION_LIMITS.SINGLE.toFixed(2)}`);
    }

    if (sender.dailyTransactionAmount + amount > TRANSACTION_LIMITS.DAILY) {
      throw new Error(`Daily transaction limit exceeded. Maximum: R$${TRANSACTION_LIMITS.DAILY.toFixed(2)}`);
    }

    if (sender.dailyTransactionCount >= TRANSACTION_LIMITS.FREQUENCY) {
      throw new Error(`Daily transaction frequency limit exceeded. Maximum: ${TRANSACTION_LIMITS.FREQUENCY} transactions`);
    }

    return true;
  }

  createTransaction(senderPixKey, receiverPixKey, amount, description = '') {
    const validatedAmount = formatAmount(amount);
    
    const sender = this.getPixKey(senderPixKey);
    const receiver = this.getPixKey(receiverPixKey);

    if (!sender || !receiver) {
      throw new Error('Invalid PIX key');
    }

    if (!sender.active || !receiver.active) {
      throw new Error('Inactive PIX key');
    }

    if (senderPixKey === receiverPixKey) {
      throw new Error('Cannot send to same key');
    }

    this.checkTransactionLimits(senderPixKey, validatedAmount);

    if (sender.balance < validatedAmount) {
      throw new Error('Insufficient balance');
    }

    const transaction = {
      id: uuidv4(),
      senderKey: senderPixKey,
      senderName: sender.name,
      receiverKey: receiverPixKey,
      receiverName: receiver.name,
      amount: validatedAmount,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.transactions.set(transaction.id, transaction);

    setTimeout(() => {
      this.processTransaction(transaction.id);
    }, 100);

    return transaction;
  }

  processTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const sender = this.getPixKey(transaction.senderKey);
    const receiver = this.getPixKey(transaction.receiverKey);

    try {
      sender.balance -= transaction.amount;
      receiver.balance += transaction.amount;

      sender.dailyTransactionCount += 1;
      sender.dailyTransactionAmount += transaction.amount;

      transaction.status = 'completed';
      transaction.updatedAt = new Date().toISOString();

      this.pixKeys.set(transaction.senderKey, sender);
      this.pixKeys.set(transaction.receiverKey, receiver);
      this.transactions.set(transactionId, transaction);
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error.message;
      transaction.updatedAt = new Date().toISOString();
      this.transactions.set(transactionId, transaction);
    }
  }

  cancelTransaction(transactionId) {
    const transaction = this.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Cannot cancel transaction with status: ' + transaction.status);
    }

    transaction.status = 'cancelled';
    transaction.updatedAt = new Date().toISOString();
    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  getTransaction(id) {
    return this.transactions.get(id);
  }

  getTransactionsByPixKey(pixKey) {
    const transactions = Array.from(this.transactions.values());
    return transactions.filter(t => 
      t.senderKey === pixKey || t.receiverKey === pixKey
    );
  }

  getAllTransactions() {
    return Array.from(this.transactions.values());
  }
}

module.exports = new PixService();