import { createChartConfig } from './chartConfig.js';
import { bollingerBandsService } from './dataService.js';
import { bandsAnalyzer } from './analyzer.js';
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

        window.addEventListener('resize', () => {
            if (this.chart) {
                this.chart.resize();
            }
        });

        document.getElementById(this.canvasId).addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        }, { passive: false });
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
                const analysis = bandsAnalyzer.analyzeBands(data);
                this.renderChart(data);
                this.displayAnalysis(analysis);
                
                const lastUpdate = bollingerBandsService.getLastUpdateTime();
                if (lastUpdate) {
                    console.log('Last updated:', lastUpdate.toLocaleTimeString());
                }
            }
        } catch (error) {
            console.error('Error updating chart:', error);
        }
    }

    renderChart(data) {
        const ctx = document.getElementById(this.canvasId).getContext('2d');
        const config = createChartConfig(data);

        if (this.chart) {
            this.chart.data = config.data;
            this.chart.update('none');
        } else {
            this.chart = new Chart(ctx, config);
        }
    }

    displayAnalysis(analysis) {
        let container = document.getElementById('analysis-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'analysis-container';
            container.className = 'analysis-grid';
            document.querySelector('.chart-container').appendChild(container);
        }

        const formatLevel = (level) => `
            <div class="level">
                <div class="level-price">
                    <span>${level.price.toFixed(2)}</span>
                    <span class="strength-badge strength-${level.strength}">${level.strength}</span>
                </div>
                <div class="level-details">
                    Timeframes: ${level.timeframes.join(', ')}
                </div>
            </div>
        `;

        container.innerHTML = `
            <!-- Column 1: Current Price and Resistance Levels -->
            <div class="analysis-column">
                <div class="analysis-title">
                    Current Price: ${analysis.currentPrice.toFixed(2)}
                </div>
                <div>
                    <strong>Resistance Levels</strong>
                    ${analysis.levels.resistance.map(formatLevel).join('')}
                </div>
            </div>

            <!-- Column 2: Support Levels -->
            <div class="analysis-column">
                <div class="analysis-title">Support Levels</div>
                ${analysis.levels.support.map(formatLevel).join('')}
            </div>

            <!-- Column 3: Trading Suggestion -->
            <div class="analysis-column">
                <div class="analysis-title">Trading Analysis</div>
                <div class="suggestion-box">
                    <div class="suggestion-action action-${analysis.suggestion.action}">
                        ${analysis.suggestion.action}
                    </div>
                    <div class="suggestion-reason">
                        ${analysis.suggestion.reason}
                    </div>
                    ${analysis.suggestion.riskRewardRatio ? `
                        <div class="suggestion-metrics">
                            <div>
                                <span class="metric-label">Risk/Reward Ratio:</span>
                                ${analysis.suggestion.riskRewardRatio}
                            </div>
                            <div>
                                <span class="metric-label">Next Resistance:</span>
                                ${analysis.suggestion.nextResistance} (${analysis.suggestion.resistanceStrength})
                            </div>
                            <div>
                                <span class="metric-label">Next Support:</span>
                                ${analysis.suggestion.nextSupport} (${analysis.suggestion.supportStrength})
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
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

    resetZoom() {
        if (this.chart) {
            this.chart.resetZoom();
        }
    }
}

const chartRenderer = new ChartRenderer('bandsChart');

export {
    chartRenderer,
    ChartRenderer
};
