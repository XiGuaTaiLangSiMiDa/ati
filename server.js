const express = require('express');
const path = require('path');
const { calculateAllTimeframeBollingerBands } = require('./src/indicators.js');

const app = express();
const port = 3000;

// Serve static files with proper MIME types
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        // Set proper MIME types for JavaScript modules
        if (filePath.endsWith('.js')) {
            if (filePath.includes('/src/bands/')) {
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

// Serve the main TradingView page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the Bollinger Bands display page
app.get('/bands', (req, res) => {
    res.sendFile(path.join(__dirname, 'bands.html'));
});

// Handle module imports
app.get('*.js', (req, res, next) => {
    if (req.url.includes('/src/bands/')) {
        res.type('application/javascript');
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
