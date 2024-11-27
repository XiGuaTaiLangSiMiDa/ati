class OrderBookAnalyzer {
    constructor(marketData, bollingerBands) {
        this.marketData = marketData;
        this.bands = bollingerBands;
        this.volumeThreshold = 0.05; // 5% of total volume for significant levels
        this.priceSteps = 50; // Price level divisions for analysis
        this.significantLevelsLimit = 5; // Maximum number of significant levels to show per type
    }

    analyze() {
        if (!this.marketData || !this.bands) {
            return this.getDefaultAnalysis();
        }

        try {
            const upperBand = this.bands.upper;
            const lowerBand = this.bands.lower;
            const currentPrice = this.marketData.currentPrice;

            // Combine and aggregate order book and recent trades data
            const levels = this.combineLevels(
                this.marketData.bids,
                this.marketData.asks,
                this.marketData.recentTrades.buys,
                this.marketData.recentTrades.sells,
                lowerBand,
                upperBand
            );

            // Calculate strength of each level and filter significant ones
            const strengthLevels = this.calculateLevelStrength(levels, currentPrice);

            // Generate trading recommendation
            const recommendation = this.generateRecommendation(strengthLevels, currentPrice);

            return {
                levels: strengthLevels,
                recommendation,
                orderBookMetrics: {
                    buyVolume: this.marketData.summary.orderBook.totalBidVolume,
                    sellVolume: this.marketData.summary.orderBook.totalAskVolume,
                    buyOrderCount: this.marketData.summary.orderBook.bidLevels,
                    sellOrderCount: this.marketData.summary.orderBook.askLevels,
                    recentBuyVolume: this.marketData.summary.recentTrades.totalBuyVolume,
                    recentSellVolume: this.marketData.summary.recentTrades.totalSellVolume,
                    buyPressure: this.calculateBuyPressure()
                }
            };
        } catch (error) {
            console.error('Error analyzing market data:', error);
            return this.getDefaultAnalysis();
        }
    }

    calculateBuyPressure() {
        const recentBuyVolume = this.marketData.summary.recentTrades.totalBuyVolume;
        const recentSellVolume = this.marketData.summary.recentTrades.totalSellVolume;
        const totalVolume = recentBuyVolume + recentSellVolume;
        return totalVolume > 0 ? recentBuyVolume / totalVolume : 0.5;
    }

    getDefaultAnalysis() {
        return {
            levels: [],
            recommendation: {
                action: 'HOLD',
                confidence: 0,
                reason: 'Insufficient data for analysis',
                metrics: {
                    riskRewardRatio: 0,
                    relativePosition: 0.5,
                    nearestSupport: 0,
                    nearestResistance: 0,
                    supportStrength: 0,
                    resistanceStrength: 0,
                    buyPressure: 0.5
                }
            },
            orderBookMetrics: {
                buyVolume: 0,
                sellVolume: 0,
                buyOrderCount: 0,
                sellOrderCount: 0,
                recentBuyVolume: 0,
                recentSellVolume: 0,
                buyPressure: 0.5
            }
        };
    }

    combineLevels(bids, asks, buyTrades, sellTrades, lowerBand, upperBand) {
        const priceRange = upperBand - lowerBand;
        const bucketSize = priceRange / this.priceSteps;
        const buckets = new Map();

        // Helper function to get bucket key
        const getBucketKey = (price) => {
            const bucket = Math.floor((price - lowerBand) / bucketSize);
            return lowerBand + (bucket * bucketSize);
        };

        // Process bids (support levels)
        bids.forEach(bid => {
            if (bid.price >= lowerBand && bid.price <= upperBand) {
                const bucketKey = getBucketKey(bid.price);
                const bucket = buckets.get(bucketKey) || {
                    price: bucketKey,
                    type: 'support',
                    orderVolume: 0,
                    tradeVolume: 0,
                    orderCount: 0,
                    tradeCount: 0
                };
                bucket.orderVolume += bid.volume;
                bucket.orderCount++;
                buckets.set(bucketKey, bucket);
            }
        });

        // Process asks (resistance levels)
        asks.forEach(ask => {
            if (ask.price >= lowerBand && ask.price <= upperBand) {
                const bucketKey = getBucketKey(ask.price);
                const bucket = buckets.get(bucketKey) || {
                    price: bucketKey,
                    type: 'resistance',
                    orderVolume: 0,
                    tradeVolume: 0,
                    orderCount: 0,
                    tradeCount: 0
                };
                bucket.orderVolume += ask.volume;
                bucket.orderCount++;
                buckets.set(bucketKey, bucket);
            }
        });

        // Process trades
        const processTrades = (trades, isSupport) => {
            trades.forEach(trade => {
                if (trade.price >= lowerBand && trade.price <= upperBand) {
                    const bucketKey = getBucketKey(trade.price);
                    const bucket = buckets.get(bucketKey) || {
                        price: bucketKey,
                        type: isSupport ? 'support' : 'resistance',
                        orderVolume: 0,
                        tradeVolume: 0,
                        orderCount: 0,
                        tradeCount: 0
                    };
                    bucket.tradeVolume += trade.volume;
                    bucket.tradeCount += trade.trades;
                    buckets.set(bucketKey, bucket);
                }
            });
        };

        processTrades(buyTrades, true);
        processTrades(sellTrades, false);

        // Convert buckets to array and filter significant levels
        return Array.from(buckets.values())
            .filter(bucket => bucket.orderVolume > 0 || bucket.tradeVolume > 0);
    }

    calculateLevelStrength(levels, currentPrice) {
        const totalOrderVolume = levels.reduce((sum, level) => sum + level.orderVolume, 0);
        const totalTradeVolume = levels.reduce((sum, level) => sum + level.tradeVolume, 0);
        const maxOrderCount = Math.max(...levels.map(level => level.orderCount));
        const maxTradeCount = Math.max(...levels.map(level => level.tradeCount));

        // Calculate strength for all levels
        const strengthLevels = levels.map(level => {
            const distanceFromPrice = Math.abs(currentPrice - level.price) / currentPrice;
            const orderVolumeStrength = level.orderVolume / totalOrderVolume;
            const tradeVolumeStrength = level.tradeVolume / totalTradeVolume;
            const orderCountStrength = level.orderCount / maxOrderCount;
            const tradeCountStrength = level.tradeCount / maxTradeCount;

            const strength = (
                (orderVolumeStrength * 0.4) +
                (tradeVolumeStrength * 0.3) +
                (orderCountStrength * 0.2) +
                (tradeCountStrength * 0.1)
            ) * (1 - distanceFromPrice * 0.5);

            return {
                price: level.price,
                type: level.type,
                strength: strength,
                volume: level.orderVolume + level.tradeVolume,
                orderCount: level.orderCount,
                tradeCount: level.tradeCount,
                confidence: this.calculateConfidence(strength, level.orderCount + level.tradeCount)
            };
        });

        // Filter and sort significant levels by type
        const supports = strengthLevels
            .filter(level => level.type === 'support')
            .sort((a, b) => b.strength - a.strength)
            .slice(0, this.significantLevelsLimit);

        const resistances = strengthLevels
            .filter(level => level.type === 'resistance')
            .sort((a, b) => b.strength - a.strength)
            .slice(0, this.significantLevelsLimit);

        // Combine and sort by distance from current price
        return [...supports, ...resistances]
            .sort((a, b) => Math.abs(currentPrice - a.price) - Math.abs(currentPrice - b.price));
    }

    calculateConfidence(strength, activityCount) {
        const strengthWeight = 0.7;
        const activityWeight = 0.3;
        const normalizedActivity = Math.min(activityCount / 1000, 1);

        return (strength * strengthWeight) + (normalizedActivity * activityWeight);
    }

    generateRecommendation(levels, currentPrice) {
        const nearestSupport = levels.find(l => l.type === 'support' && l.price < currentPrice);
        const nearestResistance = levels.find(l => l.type === 'resistance' && l.price > currentPrice);

        if (!nearestSupport || !nearestResistance) {
            return {
                action: 'HOLD',
                confidence: 0,
                reason: 'Insufficient data to make a recommendation',
                metrics: {
                    riskRewardRatio: 0,
                    relativePosition: 0.5,
                    nearestSupport: nearestSupport?.price || 0,
                    nearestResistance: nearestResistance?.price || 0,
                    supportStrength: nearestSupport?.strength || 0,
                    resistanceStrength: nearestResistance?.strength || 0,
                    buyPressure: this.calculateBuyPressure()
                }
            };
        }

        const distanceToSupport = currentPrice - nearestSupport.price;
        const distanceToResistance = nearestResistance.price - currentPrice;
        const priceRange = nearestResistance.price - nearestSupport.price;
        const relativePosition = (currentPrice - nearestSupport.price) / priceRange;
        const buyPressure = this.calculateBuyPressure();

        // Calculate risk/reward ratio
        const riskRewardRatio = distanceToResistance / distanceToSupport;

        let action, confidence, reason;

        if (relativePosition < 0.3 && nearestSupport.confidence > 0.6 && buyPressure > 0.6) {
            action = 'BUY';
            confidence = nearestSupport.confidence * buyPressure * (1 - relativePosition);
            reason = `Strong support at ${nearestSupport.price.toFixed(2)} with high buy pressure (${(buyPressure * 100).toFixed(1)}%)`;
        } else if (relativePosition > 0.7 && nearestResistance.confidence > 0.6 && buyPressure < 0.4) {
            action = 'SELL';
            confidence = nearestResistance.confidence * (1 - buyPressure) * relativePosition;
            reason = `Strong resistance at ${nearestResistance.price.toFixed(2)} with high sell pressure (${((1 - buyPressure) * 100).toFixed(1)}%)`;
        } else {
            action = 'HOLD';
            confidence = Math.max(nearestSupport.confidence, nearestResistance.confidence) * 0.5;
            reason = `Price in neutral zone between support (${nearestSupport.price.toFixed(2)}) and resistance (${nearestResistance.price.toFixed(2)})`;
        }

        return {
            action,
            confidence,
            reason,
            metrics: {
                riskRewardRatio,
                relativePosition,
                nearestSupport: nearestSupport.price,
                nearestResistance: nearestResistance.price,
                supportStrength: nearestSupport.strength,
                resistanceStrength: nearestResistance.strength,
                buyPressure
            }
        };
    }
}

export default OrderBookAnalyzer;
