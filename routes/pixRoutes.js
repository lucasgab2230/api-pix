const express = require('express');
const router = express.Router();
const pixService = require('../services/pixService');

router.post('/keys', (req, res) => {
  try {
    const { type, key, name, bank, account, agency } = req.body;

    if (!type || !key || !name || !bank || !account || !agency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validTypes = ['cpf', 'email', 'phone', 'random'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid PIX key type' });
    }

    if (pixService.getPixKey(key)) {
      return res.status(409).json({ error: 'PIX key already exists' });
    }

    const pixKey = pixService.registerPixKey({
      type,
      key,
      name,
      bank,
      account,
      agency
    });

    res.status(201).json(pixKey);
  } catch (error) {
    res.status(500).json({ error: error.message });
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