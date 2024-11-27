import { createChartConfig } from './chartConfig.js';
import { bollingerBandsService } from './dataService.js';
import { updateInterval } from './config.js';

class ChartRenderer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.chart = null;
        this.updateInterval = null;
    }

    initialize() {
        this.startAutoUpdate();
        this.update();

        // Add resize handler
        window.addEventListener('resize', () => {
            if (this.chart) {
                this.chart.resize();
            }
        });
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    async update() {
        try {
            const data = await bollingerBandsService.fetchBollingerBands();
            if (data) {
                // Find nearest resistance and support
                const levels = bollingerBandsService.findNearestResistanceAndSupport(data);
                
                // Sort bands by price for better visualization
                const sortedBands = bollingerBandsService.sortBandsByPrice(data);
                
                // Update chart with the processed data
                this.renderChart(data, levels, sortedBands);
                
                // Update last update time
                const lastUpdate = bollingerBandsService.getLastUpdateTime();
                if (lastUpdate) {
                    console.log('Last updated:', lastUpdate.toLocaleTimeString());
                }
            }
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    renderChart(data, levels, sortedBands) {
        const ctx = document.getElementById(this.canvasId).getContext('2d');
        const config = createChartConfig(data, levels, sortedBands);

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, config);

        // Add click handler for tooltips
        ctx.canvas.onclick = (evt) => {
            const points = this.chart.getElementsAtEventForMode(
                evt,
                'nearest',
                { intersect: true },
                true
            );
            
            if (points.length) {
                const firstPoint = points[0];
                const label = this.chart.data.labels[firstPoint.index];
                const value = this.chart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
                console.log(label, value);
            }
        };
    }

    startAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.update(), updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Create singleton instance
const chartRenderer = new ChartRenderer('bandsChart');

export {
    chartRenderer,
    ChartRenderer
};
