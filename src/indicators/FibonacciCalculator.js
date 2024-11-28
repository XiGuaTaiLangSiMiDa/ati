export class FibonacciCalculator {
    constructor() {
        this.fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    }

    calculateFibLevels(cycles) {
        if (!cycles || cycles.length === 0) return [];

        return cycles.map(cycle => {
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

    getCurrentContext(cycles, currentPrice) {
        if (!cycles || cycles.length === 0) {
            return [];
        }

        return cycles.map(cycle => {
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
