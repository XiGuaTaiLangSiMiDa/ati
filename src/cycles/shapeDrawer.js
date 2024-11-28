import { getWidget } from './chartSetup.js';

export function drawCurrentPriceLine(currentPrice) {
    const widget = getWidget();
    if (!widget || !widget.chart) return;

    try {
        const chart = widget.chart();
        chart.createShape({ 
            time: Math.floor(Date.now() / 1000),
            price: currentPrice,
            overrides: {
                linecolor: "#000000",
                linestyle: 2, // Dashed
                linewidth: 1,
                showLabel: true,
                text: "Current Price"
            }
        }, {
            shape: "horizontal_line"
        });
    } catch (error) {
        console.error('Error drawing current price line:', error);
    }
}

export function drawCycleLine(cycle, index) {
    const widget = getWidget();
    if (!widget || !widget.chart) return;

    try {
        const chart = widget.chart();
        const color = `hsl(${(index * 30) % 360}, 70%, 50%)`;
        
        chart.createShape({
            time1: cycle.startTime / 1000,
            price1: cycle.startPrice,
            time2: cycle.endTime / 1000,
            price2: cycle.endPrice,
            overrides: {
                linecolor: color,
                linewidth: 2,
                showLabel: true,
                text: `Cycle ${index + 1} (${cycle.type})`
            }
        }, {
            shape: "trend_line"
        });
    } catch (error) {
        console.error('Error drawing cycle line:', error);
    }
}

export function drawFibonacciRetracement(cycle, index) {
    const widget = getWidget();
    if (!widget || !widget.chart) return;

    try {
        const chart = widget.chart();
        const color = `hsl(${(index * 30) % 360}, 70%, 50%)`;

        chart.createMultipointShape([
            { time: cycle.startTime / 1000, price: cycle.startPrice },
            { time: cycle.endTime / 1000, price: cycle.endPrice }
        ], {
            shape: "fib_retracement",
            overrides: {
                linecolor: color,
                linewidth: 1,
                linestyle: 2,
                showCoeffs: true,
                showPrices: true,
                transparency: 80
            }
        });
    } catch (error) {
        console.error('Error drawing Fibonacci retracement:', error);
    }
}

export function clearAllShapes() {
    const widget = getWidget();
    if (!widget || !widget.chart) return;

    try {
        const chart = widget.chart();
        chart.removeAllShapes();
    } catch (error) {
        console.error('Error clearing shapes:', error);
    }
}
