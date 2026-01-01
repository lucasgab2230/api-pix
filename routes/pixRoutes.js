const express = require('express');
const router = express.Router();
const pixService = require('../services/pixService');

router.post('/keys', (req, res) => {
  try {
    const { type, key, name, bank, account, agency, initialBalance } = req.body;

    if (!type || !key || !name || !bank || !account || !agency) {
      return res.status(400).json({ error: 'Missing required fields: type, key, name, bank, account, agency' });
    }

    const validTypes = ['cpf', 'email', 'phone', 'random'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid PIX key type. Must be: cpf, email, phone, or random' });
    }

    if (pixService.getPixKey(key)) {
      return res.status(409).json({ error: 'PIX key already exists' });
    }

    if (initialBalance !== undefined) {
      if (parseFloat(initialBalance) < 0) {
        return res.status(400).json({ error: 'Initial balance cannot be negative' });
      }
    }

    const pixKey = pixService.registerPixKey({
      type,
      key,
      name,
      bank,
      account,
      agency,
      initialBalance
    });

    res.status(201).json(pixKey);
  } catch (error) {
    const statusCode = error.message.includes('format') ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

router.get('/keys/:key', (req, res) => {
  try {
    const { key } = req.params;
    const pixKey = pixService.getPixKey(key);

    if (!pixKey) {
      return res.status(404).json({ error: 'PIX key not found' });
    }

    res.json(pixKey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/keys', (req, res) => {
  try {
    const keys = pixService.getAllPixKeys();
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/keys/:key/balance', (req, res) => {
  try {
    const { key } = req.params;
    const balance = pixService.getBalance(key);
    res.json(balance);
  } catch (error) {
    const statusCode = error.message === 'PIX key not found' ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

router.post('/keys/:key/deposit', (req, res) => {
  try {
    const { key } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const result = pixService.deposit(key, amount);
    res.json(result);
  } catch (error) {
    const statusCode = error.message === 'PIX key not found' || error.message === 'Inactive PIX key' ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

router.post('/keys/:key/withdraw', (req, res) => {
  try {
    const { key } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const result = pixService.withdraw(key, amount);
    res.json(result);
  } catch (error) {
    const statusCode = error.message === 'PIX key not found' || error.message === 'Inactive PIX key' ? 404 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

router.get('/keys/:key/stats', (req, res) => {
  try {
    const { key } = req.params;
    const stats = pixService.getTransactionStats(key);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/keys/:key', (req, res) => {
  try {
    const { key } = req.params;
    const deleted = pixService.deletePixKey(key);

    if (!deleted) {
      return res.status(404).json({ error: 'PIX key not found' });
    }

    res.json({ message: 'PIX key deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;