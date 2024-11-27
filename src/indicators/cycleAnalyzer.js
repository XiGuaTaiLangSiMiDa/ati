class CycleAnalyzer {
    constructor(klines) {
        this.klines = klines;
        this.cycles = [];
        this.fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        this.minSwingStrength = 0.02; // 2% minimum price movement for swing points
    }

    analyze() {
        if (!this.klines || this.klines.length === 0) {
            console.error('No klines data provided');
            return [];
        }

        try {
            // Find swing points
            const swings = this.findSwingPoints();
            
            // Identify cycles between significant highs and lows
            this.cycles = this.identifyCycles(swings);
            
            // Calculate Fibonacci levels for each cycle
            return this.calculateFibLevels();
        } catch (error) {
            console.error('Error analyzing cycles:', error);
            return [];
        }
    }

    findSwingPoints() {
        if (!this.klines || this.klines.length === 0) return [];

        const swings = [];
        const lookback = 5; // Number of bars to look back/forward

        for (let i = lookback; i < this.klines.length - lookback; i++) {
            const currentHigh = parseFloat(this.klines[i].high);
            const currentLow = parseFloat(this.klines[i].low);

            // Check for swing high
            let isSwingHigh = true;
            for (let j = 1; j <= lookback; j++) {
                if (parseFloat(this.klines[i - j].high) >= currentHigh || 
                    parseFloat(this.klines[i + j].high) >= currentHigh) {
                    isSwingHigh = false;
                    break;
                }
            }

            // Check for swing low
            let isSwingLow = true;
            for (let j = 1; j <= lookback; j++) {
                if (parseFloat(this.klines[i - j].low) <= currentLow || 
                    parseFloat(this.klines[i + j].low) <= currentLow) {
                    isSwingLow = false;
                    break;
                }
            }

            // Add swing points that meet minimum strength requirement
            if (isSwingHigh) {
                const strength = this.calculateSwingStrength(
                    currentHigh, 
                    Math.min(...this.klines.slice(i - lookback, i).map(k => parseFloat(k.low)))
                );
                if (strength >= this.minSwingStrength) {
                    swings.push({
                        type: 'high',
                        price: currentHigh,
                        time: this.klines[i].openTime,
                        strength: strength
                    });
                }
            }

            if (isSwingLow) {
                const strength = this.calculateSwingStrength(
                    Math.max(...this.klines.slice(i - lookback, i).map(k => parseFloat(k.high))),
                    currentLow
                );
                if (strength >= this.minSwingStrength) {
                    swings.push({
                        type: 'low',
                        price: currentLow,
                        time: this.klines[i].openTime,
                        strength: strength
                    });
                }
            }
        }

        return this.filterSignificantSwings(swings);
    }

    calculateSwingStrength(high, low) {
        return Math.abs(high - low) / high;
    }

    filterSignificantSwings(swings) {
        if (!swings || swings.length === 0) return [];

        // Sort swings by time
        swings.sort((a, b) => a.time - b.time);

        // Filter out minor swings
        const significantSwings = [];
        let lastSwing = swings[0];
        significantSwings.push(lastSwing);

        for (let i = 1; i < swings.length; i++) {
            const currentSwing = swings[i];
            const strength = this.calculateSwingStrength(
                Math.max(lastSwing.price, currentSwing.price),
                Math.min(lastSwing.price, currentSwing.price)
            );

            if (strength >= this.minSwingStrength * 2) {
                significantSwings.push(currentSwing);
                lastSwing = currentSwing;
            }
        }

        return significantSwings;
    }

    identifyCycles(swings) {
        if (!swings || swings.length < 2) return [];

        const cycles = [];
        let currentCycle = [];

        for (let i = 0; i < swings.length - 1; i++) {
            const currentSwing = swings[i];
            const nextSwing = swings[i + 1];

            if (currentCycle.length === 0) {
                currentCycle.push(currentSwing);
            }

            if (currentSwing.type !== nextSwing.type) {
                currentCycle.push(nextSwing);
                
                if (currentCycle.length === 2) {
                    cycles.push({
                        start: currentCycle[0],
                        end: currentCycle[1],
                        type: currentCycle[0].type === 'low' ? 'upward' : 'downward',
                        strength: this.calculateSwingStrength(
                            Math.max(currentCycle[0].price, currentCycle[1].price),
                            Math.min(currentCycle[0].price, currentCycle[1].price)
                        )
                    });
                    currentCycle = [nextSwing];
                }
            }
        }

        return cycles;
    }

    calculateFibLevels() {
        if (!this.cycles || this.cycles.length === 0) return [];

        return this.cycles.map(cycle => {
            const range = Math.abs(cycle.end.price - cycle.start.price);
            const levels = {};

            this.fibLevels.forEach(level => {
                if (cycle.type === 'upward') {
                    levels[level] = cycle.end.price - (range * level);
                } else {
                    levels[level] = cycle.start.price + (range * level);
                }
            });

            return {
                type: cycle.type,
                startTime: cycle.start.time,
                endTime: cycle.end.time,
                startPrice: cycle.start.price,
                endPrice: cycle.end.price,
                strength: cycle.strength,
                fibLevels: levels
            };
        });
    }

    getCurrentContext(currentPrice) {
        if (!this.cycles || this.cycles.length === 0) {
            return [];
        }

        return this.cycles.map(cycle => {
            if (!cycle.fibLevels) return null;

            const levels = Object.entries(cycle.fibLevels)
                .sort((a, b) => cycle.type === 'upward' ? b[1] - a[1] : a[1] - b[1]);
            
            // Find nearest resistance and support
            const resistance = levels.find(([_, price]) => price > currentPrice);
            const support = levels.reverse().find(([_, price]) => price < currentPrice);

            return {
                cycle: {
                    type: cycle.type,
                    startTime: cycle.startTime,
                    endTime: cycle.endTime,
                    startPrice: cycle.startPrice,
                    endPrice: cycle.endPrice,
                    strength: cycle.strength
                },
                nearestResistance: resistance ? {
                    level: resistance[0],
                    price: resistance[1]
                } : null,
                nearestSupport: support ? {
                    level: support[0],
                    price: support[1]
                } : null
            };
        }).filter(context => context !== null);
    }
}

export default CycleAnalyzer;
