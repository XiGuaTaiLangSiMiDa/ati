import CycleAnalyzer from '../indicators/cycleAnalyzer.js';

export async function fetchAndAnalyzeData() {
    try {
        // Fetch monthly klines data
        const response = await fetch('/api/monthly-klines');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const klines = await response.json();
        if (!klines || klines.length === 0) {
            throw new Error('No klines data received');
        }

        const analyzer = new CycleAnalyzer(klines);
        const cycles = analyzer.analyze();
        const currentPrice = parseFloat(klines[klines.length - 1].close);
        const context = analyzer.getCurrentContext(currentPrice);
        
        return {
            cycles,
            currentPrice,
            context
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}
