const express = require('express');
const path = require('path');
const { calculateAllTimeframeBollingerBands } = require('./src/indicators.js');
const { klineCache } = require('./src/cache/cache.js');

const app = express();
const port = 3000;

// Serve static files with proper MIME types
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        // Set proper MIME types for JavaScript modules
        if (filePath.endsWith('.js')) {
            if (filePath.includes('/src/')) {
                res.set('Content-Type', 'application/javascript; charset=UTF-8');
            } else {
                res.set('Content-Type', 'application/javascript');
            }
        }
        // Enable CORS for local development
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

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

// API endpoint for daily klines data
app.get('/api/daily-klines', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        const klines = await klineCache.update(symbol, '1d');
        
        // Transform klines data to include OHLCV
        const formattedKlines = klines.map(k => ({
            openTime: k.openTime,
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close),
            volume: parseFloat(k.volume)
        }));
        
        res.json(formattedKlines);
    } catch (error) {
        console.error('Error fetching daily klines:', error);
        res.status(500).json({ error: 'Failed to fetch daily klines' });
    }
});

// Handle module imports
app.get('*.js', (req, res, next) => {
    if (req.url.includes('/src/')) {
        res.type('application/javascript');
        res.set('Content-Type', 'application/javascript; charset=UTF-8');
    }
    next();
});

// Serve the main TradingView page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the Bollinger Bands display page
app.get('/bands', (req, res) => {
    res.sendFile(path.join(__dirname, 'bands.html'));
});

// Serve the Cycle Analysis page
app.get('/cycles', (req, res) => {
    res.sendFile(path.join(__dirname, 'cycles.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
