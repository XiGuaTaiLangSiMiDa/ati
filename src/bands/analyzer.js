class BandsAnalyzer {
    constructor() {
        this.strengthThresholds = {
            strong: 3,     // 3 or more bands in cluster
            medium: 2,     // 2 bands in cluster
            weak: 1        // 1 band in cluster
        };
    }

    analyzeBands(data) {
        const currentPrice = data['15m'].currentPrice;
        const levels = this.identifyLevels(data);
        const { resistance, support } = this.categorizeLevels(levels, currentPrice);
        const suggestion = this.generateTradingSuggestion(resistance, support, currentPrice);

        return {
            currentPrice,
            levels: {
                resistance,
                support
            },
            suggestion
        };
    }

    identifyLevels(data) {
        const levels = [];
        Object.entries(data).forEach(([timeframe, bands]) => {
            levels.push({
                timeframe,
                price: bands.upper,
                type: 'upper'
            });
            levels.push({
                timeframe,
                price: bands.middle,
                type: 'middle'
            });
            levels.push({
                timeframe,
                price: bands.lower,
                type: 'lower'
            });
        });
        return levels.sort((a, b) => a.price - b.price);
    }

    categorizeLevels(levels, currentPrice) {
        const resistance = [];
        const support = [];
        const priceThreshold = currentPrice * 0.001; // 0.1% threshold for clustering

        let currentCluster = {
            basePrice: levels[0].price,
            levels: [levels[0]],
            count: 1
        };

        // Group levels into clusters
        for (let i = 1; i < levels.length; i++) {
            const level = levels[i];
            if (Math.abs(level.price - currentCluster.basePrice) <= priceThreshold) {
                currentCluster.levels.push(level);
                currentCluster.count++;
            } else {
                // Process the completed cluster
                const avgPrice = currentCluster.levels.reduce((sum, l) => sum + l.price, 0) / currentCluster.count;
                const strength = this.calculateStrength(currentCluster.count);
                const clusterInfo = {
                    price: Number(avgPrice.toFixed(2)),
                    strength,
                    count: currentCluster.count,
                    timeframes: [...new Set(currentCluster.levels.map(l => l.timeframe))],
                    types: [...new Set(currentCluster.levels.map(l => l.type))]
                };

                if (avgPrice > currentPrice) {
                    resistance.push(clusterInfo);
                } else {
                    support.push(clusterInfo);
                }

                // Start new cluster
                currentCluster = {
                    basePrice: level.price,
                    levels: [level],
                    count: 1
                };
            }
        }

        // Process the last cluster
        if (currentCluster.count > 0) {
            const avgPrice = currentCluster.levels.reduce((sum, l) => sum + l.price, 0) / currentCluster.count;
            const strength = this.calculateStrength(currentCluster.count);
            const clusterInfo = {
                price: Number(avgPrice.toFixed(2)),
                strength,
                count: currentCluster.count,
                timeframes: [...new Set(currentCluster.levels.map(l => l.timeframe))],
                types: [...new Set(currentCluster.levels.map(l => l.type))]
            };

            if (avgPrice > currentPrice) {
                resistance.push(clusterInfo);
            } else {
                support.push(clusterInfo);
            }
        }

        return {
            resistance: resistance.sort((a, b) => a.price - b.price),
            support: support.sort((a, b) => b.price - a.price)
        };
    }

    calculateStrength(count) {
        if (count >= this.strengthThresholds.strong) return 'Strong';
        if (count >= this.strengthThresholds.medium) return 'Medium';
        return 'Weak';
    }

    generateTradingSuggestion(resistance, support, currentPrice) {
        if (resistance.length === 0 || support.length === 0) {
            return {
                action: 'HOLD',
                reason: 'Insufficient data for analysis',
                riskRewardRatio: null
            };
        }

        const nearestResistance = resistance[0];
        const nearestSupport = support[0];

        const distanceToResistance = nearestResistance.price - currentPrice;
        const distanceToSupport = currentPrice - nearestSupport.price;
        const riskRewardRatio = (distanceToResistance / distanceToSupport).toFixed(2);

        let action = 'HOLD';
        let reason = '';

        if (riskRewardRatio >= 2 && nearestSupport.strength !== 'Weak') {
            action = 'LONG';
            reason = `Favorable risk/reward ratio (${riskRewardRatio}) with ${nearestSupport.strength.toLowerCase()} support`;
        } else if (riskRewardRatio <= 0.5 && nearestResistance.strength !== 'Weak') {
            action = 'SHORT';
            reason = `Unfavorable risk/reward ratio (${riskRewardRatio}) with ${nearestResistance.strength.toLowerCase()} resistance`;
        } else {
            reason = 'Risk/reward ratio not favorable for trading';
        }

        return {
            action,
            reason,
            riskRewardRatio,
            nextResistance: nearestResistance.price,
            nextSupport: nearestSupport.price,
            resistanceStrength: nearestResistance.strength,
            supportStrength: nearestSupport.strength
        };
    }
}

const bandsAnalyzer = new BandsAnalyzer();

export {
    bandsAnalyzer,
    BandsAnalyzer
};
