const { klineCache } = require('./cache/cache.js');

function aggregateKlines(klines, timeframe) {
    const multipliers = {
        '30m': 2,
        '1h': 4,
        '2h': 8,
        '3h': 12,
        '4h': 16,
        '5h': 20,
        '7h': 28,
        '8h': 32,
        '9h': 36,
        '10h': 40,
        '11h': 44,
        '12h': 48,
        '1d': 96,    // 24h = 96 * 15m
        '2d': 192,    // 24h = 96 * 15m
        '3d': 288,   // 72h = 288 * 15m
        '4d': 384,   // 96h = 384 * 15m
        '5d': 480,    // 24h = 96 * 15m
        '6d': 576,    // 24h = 96 * 15m
        '1w': 672,   // 168h = 672 * 15m
        '2w': 1344,  // 336h = 1344 * 15m
        '3w': 2016,   // 168h = 672 * 15m
        '1M': 2880,   // 720h = 2880 * 15m (assuming 30 days)
    };

    const multiplier = multipliers[timeframe];
    if (!multiplier) return klines;

    const aggregated = [];
    for (let i = 0; i < klines.length; i += multiplier) {
        if (i + multiplier > klines.length) break;

        const chunk = klines.slice(i, i + multiplier);
        const aggregatedKline = {
            openTime: chunk[0].openTime,
            open: chunk[0].open,
            high: Math.max(...chunk.map(k => k.high)),
            low: Math.min(...chunk.map(k => k.low)),
            close: chunk[chunk.length - 1].close,
            volume: chunk.reduce((sum, k) => sum + k.volume, 0),
            closeTime: chunk[chunk.length - 1].closeTime,
            quoteVolume: chunk.reduce((sum, k) => sum + k.quoteVolume, 0),
            trades: chunk.reduce((sum, k) => sum + k.trades, 0),
            takerBuyBaseVolume: chunk.reduce((sum, k) => sum + k.takerBuyBaseVolume, 0),
            takerBuyQuoteVolume: chunk.reduce((sum, k) => sum + k.takerBuyQuoteVolume, 0)
        };
        aggregated.push(aggregatedKline);
    }

    return aggregated;
}

function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
            continue;
        }

        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        sma.push(sum / period);
    }
    return sma;
}

function calculateStdDev(data, sma, period) {
    const stdDev = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1 || !sma[i]) {
            stdDev.push(null);
            continue;
        }

        let sumSquaredDiff = 0;
        for (let j = 0; j < period; j++) {
            const diff = data[i - j].close - sma[i];
            sumSquaredDiff += diff * diff;
        }
        stdDev.push(Math.sqrt(sumSquaredDiff / period));
    }
    return stdDev;
}

function calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    const sma = calculateSMA(data, period);
    const stdDev = calculateStdDev(data, sma, period);

    const bands = {
        middle: [],
        upper: [],
        lower: []
    };

    for (let i = 0; i < data.length; i++) {
        if (!sma[i] || !stdDev[i]) {
            bands.middle.push(null);
            bands.upper.push(null);
            bands.lower.push(null);
            continue;
        }

        bands.middle.push(sma[i]);
        bands.upper.push(sma[i] + (stdDev[i] * stdDevMultiplier));
        bands.lower.push(sma[i] - (stdDev[i] * stdDevMultiplier));
    }

    return bands;
}

async function calculateAllTimeframeBollingerBands(symbol) {
    const timeframes = ['15m', '30m', '1h', '2h', '3h', '4h', '5h', '7h', '8h', '9h', '10h', '11h', '12h', '1d', '2d', '3d', '4d', '5d', '6d', '1w', '2w', '3w', '1M'];
    const results = {};

    try {
        // Get 15m data first
        const klines15m = await klineCache.update(symbol, '15m');

        // Calculate for each timeframe
        for (const timeframe of timeframes) {
            // For 15m, use the data directly
            const klines = timeframe === '15m' ? klines15m : aggregateKlines(klines15m, timeframe);

            // Calculate Bollinger Bands
            const bands = calculateBollingerBands(klines);

            // Get the latest values
            const lastIndex = klines.length - 1;
            results[timeframe] = {
                middle: bands.middle[lastIndex],
                upper: bands.upper[lastIndex],
                lower: bands.lower[lastIndex],
                currentPrice: klines[lastIndex].close,
                timestamp: klines[lastIndex].openTime
            };
        }
    } catch (error) {
        console.error('Error calculating Bollinger Bands:', error);
    }

    return results;
}

module.exports = {
    calculateBollingerBands,
    calculateAllTimeframeBollingerBands,
    aggregateKlines
};
