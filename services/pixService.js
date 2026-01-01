const { v4: uuidv4 } = require('uuid');

class PixService {
  constructor() {
    this.pixKeys = new Map();
    this.transactions = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    this.registerPixKey({
      type: 'cpf',
      key: '12345678900',
      name: 'João Silva',
      bank: 'Banco do Brasil',
      account: '12345-6',
      agency: '0001'
    });

    this.registerPixKey({
      type: 'email',
      key: 'joao.silva@email.com',
      name: 'João Silva',
      bank: 'Banco do Brasil',
      account: '12345-6',
      agency: '0001'
    });

    this.registerPixKey({
      type: 'phone',
      key: '+5511999999999',
      name: 'Maria Santos',
      bank: 'Nubank',
      account: '98765-4',
      agency: '0001'
    });
  }

  registerPixKey(pixData) {
    const id = uuidv4();
    const pixKey = {
      id,
      ...pixData,
      createdAt: new Date().toISOString(),
      active: true
    };
    this.pixKeys.set(pixData.key, pixKey);
    return pixKey;
  }

  getPixKey(key) {
    return this.pixKeys.get(key);
  }

  getAllPixKeys() {
    return Array.from(this.pixKeys.values());
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

  createTransaction(senderPixKey, receiverPixKey, amount, description = '') {
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

    const transaction = {
      id: uuidv4(),
      senderKey: senderPixKey,
      senderName: sender.name,
      receiverKey: receiverPixKey,
      receiverName: receiver.name,
      amount: parseFloat(amount),
      description,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    this.transactions.set(transaction.id, transaction);
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