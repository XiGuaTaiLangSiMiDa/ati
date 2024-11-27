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
        let analysisDiv = document.getElementById('analysis-container');
        if (!analysisDiv) {
            analysisDiv = document.createElement('div');
            analysisDiv.id = 'analysis-container';
            document.querySelector('.chart-container').appendChild(analysisDiv);
        }

        const strengthBadge = (strength) => {
            const colors = {
                'Strong': '#4CAF50',
                'Medium': '#FFC107',
                'Weak': '#FF5722'
            };
            return `<span style="color: ${colors[strength]}; font-weight: bold;">${strength}</span>`;
        };

        const formatLevel = (level) => `
            <div class="level">
                <div style="display: flex; justify-content: space-between;">
                    <span>${level.price.toFixed(2)}</span>
                    <span>${strengthBadge(level.strength)}</span>
                </div>
                <div style="font-size: 11px; color: #666;">
                    Timeframes: ${level.timeframes.join(', ')}
                </div>
            </div>
        `;

        const actionColors = {
            'LONG': '#4CAF50',
            'SHORT': '#FF5722',
            'HOLD': '#FFC107'
        };

        analysisDiv.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">
                Current Price: ${analysis.currentPrice.toFixed(2)}
            </div>

            <div style="margin-bottom: 15px;">
                <strong>Resistance Levels:</strong>
                ${analysis.levels.resistance.map(formatLevel).join('')}
            </div>

            <div style="margin-bottom: 15px;">
                <strong>Support Levels:</strong>
                ${analysis.levels.support.map(formatLevel).join('')}
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <div style="font-size: 16px; font-weight: bold; color: ${actionColors[analysis.suggestion.action]}; margin-bottom: 10px;">
                    Suggestion: ${analysis.suggestion.action}
                </div>
                <div style="color: #666; font-size: 13px;">
                    ${analysis.suggestion.reason}
                </div>
                ${analysis.suggestion.riskRewardRatio ? `
                    <div style="margin-top: 8px; font-size: 13px;">
                        <strong>Risk/Reward Ratio:</strong> ${analysis.suggestion.riskRewardRatio}
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        Next Resistance: ${analysis.suggestion.nextResistance} (${analysis.suggestion.resistanceStrength})<br>
                        Next Support: ${analysis.suggestion.nextSupport} (${analysis.suggestion.supportStrength})
                    </div>
                ` : ''}
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
