const express = require('express');
const path = require('path');
const { calculateAllTimeframeBollingerBands } = require('./src/indicators.js');
const { klineCache } = require('./src/cache/cache.js');
const axios = require('axios');

const app = express();
const port = 3000;

// Serve static files with proper MIME types
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            if (filePath.includes('/src/')) {
                res.set('Content-Type', 'application/javascript; charset=UTF-8');
            } else {
                res.set('Content-Type', 'application/javascript');
            }
        }
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

// Helper function to add delay between requests
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to aggregate trades into price levels
function aggregateTrades(trades, currentPrice, priceStep = 0.1) {
    const levels = new Map();
    
    trades.forEach(trade => {
        const price = parseFloat(trade.price); // Use 'price' field
        const quantity = parseFloat(trade.qty); // Use 'qty' field
        const roundedPrice = Math.round(price / priceStep) * priceStep;
        
        const existingLevel = levels.get(roundedPrice) || { volume: 0, trades: 0 };
        existingLevel.volume += quantity;
        existingLevel.trades += 1;
        levels.set(roundedPrice, existingLevel);
    });
    
    return Array.from(levels.entries())
        .map(([price, data]) => ({
            price,
            volume: data.volume,
            trades: data.trades,
            percentFromPrice: ((price - currentPrice) / currentPrice) * 100
        }))
        .sort((a, b) => a.price - b.price);
}

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

// API endpoint for order book data
app.get('/api/order-book', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        const limit = 5000; // Maximum depth per request

        console.log(`Fetching market data for ${symbol}...`);

        // Get current price
        const tickerResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
            params: { symbol }
        });
        const currentPrice = parseFloat(tickerResponse.data.price);
        console.log(`Current price: ${currentPrice}`);

        // Get order book snapshot
        const orderBookResponse = await axios.get('https://api.binance.com/api/v3/depth', {
            params: {
                symbol: symbol,
                limit: limit
            }
        });
        const orderBook = orderBookResponse.data;

        // Get recent trades
        const tradesResponse = await axios.get('https://api.binance.com/api/v3/trades', {
            params: {
                symbol: symbol,
                limit: 1000
            }
        });
        const trades = tradesResponse.data;
        console.log('Sample trade data:', trades[0]); // Log sample trade for field verification

        // Separate buy and sell trades
        const buyTrades = trades.filter(t => !t.isBuyerMaker); // false means buyer is taker (market buy)
        const sellTrades = trades.filter(t => t.isBuyerMaker); // true means seller is taker (market sell)

        // Process order book data
        const bids = orderBook.bids.map(([price, volume]) => ({
            price: parseFloat(price),
            volume: parseFloat(volume)
        }));
        const asks = orderBook.asks.map(([price, volume]) => ({
            price: parseFloat(price),
            volume: parseFloat(volume)
        }));

        // Aggregate trades
        const aggregatedBuyTrades = aggregateTrades(buyTrades, currentPrice);
        const aggregatedSellTrades = aggregateTrades(sellTrades, currentPrice);

        // Calculate cumulative volumes
        let bidTotal = 0;
        let askTotal = 0;
        
        bids.forEach(bid => {
            bidTotal += bid.volume;
            bid.total = bidTotal;
            bid.percentFromPrice = ((currentPrice - bid.price) / currentPrice) * 100;
        });
        
        asks.forEach(ask => {
            askTotal += ask.volume;
            ask.total = askTotal;
            ask.percentFromPrice = ((ask.price - currentPrice) / currentPrice) * 100;
        });

        const result = {
            lastUpdateId: orderBook.lastUpdateId,
            currentPrice: currentPrice,
            bids: bids,
            asks: asks,
            recentTrades: {
                buys: aggregatedBuyTrades,
                sells: aggregatedSellTrades
            },
            summary: {
                orderBook: {
                    bidLevels: bids.length,
                    askLevels: asks.length,
                    totalBidVolume: bidTotal,
                    totalAskVolume: askTotal,
                    bidPriceRange: {
                        min: Math.min(...bids.map(b => b.price)),
                        max: Math.max(...bids.map(b => b.price))
                    },
                    askPriceRange: {
                        min: Math.min(...asks.map(a => a.price)),
                        max: Math.max(...asks.map(a => a.price))
                    }
                },
                recentTrades: {
                    buyTrades: aggregatedBuyTrades.length,
                    sellTrades: aggregatedSellTrades.length,
                    totalBuyVolume: aggregatedBuyTrades.reduce((sum, t) => sum + t.volume, 0),
                    totalSellVolume: aggregatedSellTrades.reduce((sum, t) => sum + t.volume, 0),
                    buyPriceRange: aggregatedBuyTrades.length > 0 ? {
                        min: Math.min(...aggregatedBuyTrades.map(t => t.price)),
                        max: Math.max(...aggregatedBuyTrades.map(t => t.price))
                    } : { min: 0, max: 0 },
                    sellPriceRange: aggregatedSellTrades.length > 0 ? {
                        min: Math.min(...aggregatedSellTrades.map(t => t.price)),
                        max: Math.max(...aggregatedSellTrades.map(t => t.price))
                    } : { min: 0, max: 0 }
                }
            }
        };

        console.log('Market data summary:', result.summary);
        res.json(result);
    } catch (error) {
        console.error('Error fetching market data:', error);
        if (error.response) {
            console.error('Binance API response:', error.response.data);
        }
        res.status(500).json({ 
            error: 'Failed to fetch market data',
            details: error.message
        });
    }
});

// API endpoint for weekly klines data
app.get('/api/weekly-klines', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        const klines = await klineCache.update(symbol, '1w');
        
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
        console.error('Error fetching weekly klines:', error);
        res.status(500).json({ error: 'Failed to fetch weekly klines' });
    }
});

// API endpoint for daily klines data
app.get('/api/daily-klines', async (req, res) => {
    try {
        const symbol = req.query.symbol || 'BTCUSDT';
        const klines = await klineCache.update(symbol, '1d');
        
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
