const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pixRoutes = require('./routes/pixRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = 3000;

app.disable('x-powered-by');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000'
}));
app.use(bodyParser.json());

app.use('/api/pix', pixRoutes);
app.use('/api/transactions', transactionRoutes);

app.listen(PORT, () => {
  console.log(`PIX API server running on port ${PORT}`);
});