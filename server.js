const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pixRoutes = require('./routes/pixRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/pix', pixRoutes);
app.use('/api/transactions', transactionRoutes);

app.listen(PORT, () => {
  console.log(`PIX API server running on port ${PORT}`);
});