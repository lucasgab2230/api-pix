const express = require('express');
const router = express.Router();
const pixService = require('../services/pixService');

router.post('/', (req, res) => {
  try {
    const { senderKey, receiverKey, amount, description } = req.body;

    if (!senderKey || !receiverKey || !amount) {
      return res.status(400).json({ error: 'Missing required fields: senderKey, receiverKey, amount' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const transaction = pixService.createTransaction(
      senderKey,
      receiverKey,
      amount,
      description || ''
    );

    res.status(201).json(transaction);
  } catch (error) {
    if (error.message === 'Invalid PIX key' || 
        error.message === 'Inactive PIX key' ||
        error.message === 'Cannot send to same key') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = pixService.getTransaction(id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pix/:key', (req, res) => {
  try {
    const { key } = req.params;
    const transactions = pixService.getTransactionsByPixKey(key);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const transactions = pixService.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;