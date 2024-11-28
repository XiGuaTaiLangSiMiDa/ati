import { SwingPointFinder } from './SwingPointFinder.js';
import { CycleIdentifier } from './CycleIdentifier.js';
import { FibonacciCalculator } from './FibonacciCalculator.js';

class CycleAnalyzer {
    constructor(klines) {
        this.klines = klines;
        this.swingFinder = new SwingPointFinder();
        this.cycleIdentifier = new CycleIdentifier();
        this.fibCalculator = new FibonacciCalculator();
        this.cycles = [];
    }

    analyze() {
        if (!this.klines || this.klines.length === 0) {
            console.error('No klines data provided');
            return [];
        }

        try {
            // Find swing points
            const swings = this.swingFinder.findSwingPoints(this.klines);
            
            // Identify cycles between significant highs and lows
            const baseCycles = this.cycleIdentifier.identifyCycles(swings);
            
            // Calculate Fibonacci levels for each cycle
            this.cycles = this.fibCalculator.calculateFibLevels(baseCycles);
            
            return this.cycles;
        } catch (error) {
            console.error('Error analyzing cycles:', error);
            return [];
        }
    }

    getCurrentContext(currentPrice) {
        return this.fibCalculator.getCurrentContext(this.cycles, currentPrice);
    }
}

export default CycleAnalyzer;
