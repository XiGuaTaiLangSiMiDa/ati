class BollingerBandsService {
    constructor() {
        this.cache = new Map();
        this.lastUpdateTime = null;
    }

    async fetchBollingerBands() {
        try {
            const response = await fetch('/api/bollinger-bands');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Process and format the data
            const formattedData = this.formatData(data);
            
            this.cache.set('bands', formattedData);
            this.lastUpdateTime = new Date();
            return formattedData;
        } catch (error) {
            console.error('Error fetching Bollinger Bands:', error);
            // Return cached data if available
            return this.cache.get('bands') || null;
        }
    }

    formatData(data) {
        const formattedData = {};
        const timeframes = Object.keys(data);

        timeframes.forEach(timeframe => {
            if (data[timeframe]) {
                formattedData[timeframe] = {
                    upper: parseFloat(data[timeframe].upper.toFixed(2)),
                    middle: parseFloat(data[timeframe].middle.toFixed(2)),
                    lower: parseFloat(data[timeframe].lower.toFixed(2)),
                    currentPrice: parseFloat(data[timeframe].currentPrice.toFixed(2)),
                    timestamp: data[timeframe].timestamp,
                    // Calculate price position relative to bands
                    position: this.calculatePricePosition(data[timeframe])
                };
            }
        });

        return formattedData;
    }

    calculatePricePosition(bands) {
        const { currentPrice, upper, middle, lower } = bands;
        if (currentPrice > upper) return 'Above Upper';
        if (currentPrice < lower) return 'Below Lower';
        if (currentPrice > middle) return 'Above Middle';
        if (currentPrice < middle) return 'Below Middle';
        return 'At Middle';
    }

    getCachedData() {
        return this.cache.get('bands');
    }

    getLastUpdateTime() {
        return this.lastUpdateTime;
    }

    sortBandsByPrice(data) {
        const timeframes = Object.keys(data);
        return {
            upperBands: timeframes.map(tf => ({
                timeframe: tf,
                price: data[tf].upper
            })).sort((a, b) => b.price - a.price),
            middleBands: timeframes.map(tf => ({
                timeframe: tf,
                price: data[tf].middle
            })).sort((a, b) => b.price - a.price),
            lowerBands: timeframes.map(tf => ({
                timeframe: tf,
                price: data[tf].lower
            })).sort((a, b) => b.price - a.price)
        };
    }

    findNearestResistanceAndSupport(data) {
        const currentPrice = data['15m'].currentPrice;
        const sortedBands = this.sortBandsByPrice(data);
        
        // Find nearest resistance (next band above current price)
        const resistance = [...sortedBands.upperBands, ...sortedBands.middleBands]
            .find(band => band.price > currentPrice);

        // Find nearest support (next band below current price)
        const support = [...sortedBands.middleBands, ...sortedBands.lowerBands]
            .reverse()
            .find(band => band.price < currentPrice);

        return {
            resistance: resistance || null,
            support: support || null
        };
    }
}

// Export singleton instance
const bollingerBandsService = new BollingerBandsService();

export {
    bollingerBandsService,
    BollingerBandsService
};
