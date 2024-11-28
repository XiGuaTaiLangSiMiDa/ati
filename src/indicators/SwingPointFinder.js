export class SwingPointFinder {
    constructor(minSwingStrength = 0.08, lookbackPeriod = 2) {
        this.minSwingStrength = minSwingStrength;
        this.lookbackPeriod = lookbackPeriod;
    }

    findSwingPoints(klines) {
        if (!klines || klines.length === 0) return [];

        const swings = [];
        const lookback = this.lookbackPeriod;

        for (let i = lookback; i < klines.length - lookback; i++) {
            const currentHigh = parseFloat(klines[i].high);
            const currentLow = parseFloat(klines[i].low);

            // Check for swing high
            let isSwingHigh = true;
            for (let j = 1; j <= lookback; j++) {
                if (parseFloat(klines[i - j].high) >= currentHigh || 
                    parseFloat(klines[i + j].high) >= currentHigh) {
                    isSwingHigh = false;
                    break;
                }
            }

            // Check for swing low
            let isSwingLow = true;
            for (let j = 1; j <= lookback; j++) {
                if (parseFloat(klines[i - j].low) <= currentLow || 
                    parseFloat(klines[i + j].low) <= currentLow) {
                    isSwingLow = false;
                    break;
                }
            }

            // Add swing points that meet minimum strength requirement
            if (isSwingHigh) {
                const strength = this.calculateSwingStrength(
                    currentHigh, 
                    Math.min(...klines.slice(i - lookback, i).map(k => parseFloat(k.low)))
                );
                if (strength >= this.minSwingStrength) {
                    swings.push({
                        type: 'high',
                        price: currentHigh,
                        time: klines[i].openTime,
                        strength: strength
                    });
                }
            }

            if (isSwingLow) {
                const strength = this.calculateSwingStrength(
                    Math.max(...klines.slice(i - lookback, i).map(k => parseFloat(k.high))),
                    currentLow
                );
                if (strength >= this.minSwingStrength) {
                    swings.push({
                        type: 'low',
                        price: currentLow,
                        time: klines[i].openTime,
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

            if (strength >= this.minSwingStrength * 1.5) { // Increased threshold for significant swings
                significantSwings.push(currentSwing);
                lastSwing = currentSwing;
            }
        }

        return significantSwings;
    }
}
