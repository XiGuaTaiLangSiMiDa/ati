import { clearAllShapes, drawCurrentPriceLine, drawCycleLine, drawFibonacciRetracement } from './shapeDrawer.js';
import { fetchAndAnalyzeData } from './dataService.js';

export async function updateChart() {
    try {
        const { cycles, currentPrice } = await fetchAndAnalyzeData();
        
        if (!cycles || cycles.length === 0) return;

        // Clear existing drawings
        clearAllShapes();
        
        // Draw current price line
        drawCurrentPriceLine(currentPrice);

        // Draw cycles and Fibonacci levels
        cycles.forEach((cycle, index) => {
            drawCycleLine(cycle, index);
            drawFibonacciRetracement(cycle, index);
        });

        return { cycles, currentPrice };
    } catch (error) {
        console.error('Error updating chart:', error);
        throw error;
    }
}
