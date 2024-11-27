const express = require('express');
const path = require('path');
const { calculateAllTimeframeBollingerBands } = require('./src/indicators.js');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static('.'));

// API endpoint for Bollinger Bands data
app.get('/api/bollinger-bands', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        const data = await calculateAllTimeframeBollingerBands(symbol);
        res.json(data);
    } catch (error) {
        console.error('Error calculating Bollinger Bands:', error);
        res.status(500).json({ error: 'Failed to calculate Bollinger Bands' });
    }
});

// Serve the main TradingView page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the Bollinger Bands display page
app.get('/bands', (req, res) => {
    res.sendFile(path.join(__dirname, 'bands.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
