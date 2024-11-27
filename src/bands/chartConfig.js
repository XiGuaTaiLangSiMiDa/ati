import { timeframeColors } from './config.js';

function createChartConfig(data) {
    const timeframes = Object.keys(data);
    const datasets = [];

    // Add current price dataset
    const currentPrice = data[timeframes[0]].currentPrice;
    datasets.push({
        label: 'Current Price',
        data: timeframes.map(() => currentPrice),
        borderColor: '#000000',
        backgroundColor: '#000000',
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
        yAxisID: 'y'
    });

    // Add Bollinger Bands for each timeframe
    timeframes.forEach((timeframe) => {
        const bands = data[timeframe];
        const color = timeframeColors[timeframe];

        // Create data arrays with null values except for the timeframe's position
        const upperData = timeframes.map(tf => tf === timeframe ? bands.upper : null);
        const middleData = timeframes.map(tf => tf === timeframe ? bands.middle : null);
        const lowerData = timeframes.map(tf => tf === timeframe ? bands.lower : null);

        // Upper Band
        datasets.push({
            label: `${timeframe} Upper`,
            data: upperData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 6,
            pointStyle: 'circle',
            fill: false,
            yAxisID: 'y'
        });

        // Middle Band
        datasets.push({
            label: `${timeframe} Middle`,
            data: middleData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 6,
            pointStyle: 'triangle',
            fill: false,
            yAxisID: 'y'
        });

        // Lower Band
        datasets.push({
            label: `${timeframe} Lower`,
            data: lowerData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 6,
            pointStyle: 'square',
            fill: false,
            yAxisID: 'y'
        });
    });

    return {
        type: 'line',
        data: {
            labels: timeframes,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Bollinger Bands Comparison',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y !== null) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                            }
                            return null;
                        }
                    }
                },
                legend: {
                    position: 'right',
                    align: 'start',
                    labels: {
                        usePointStyle: true,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: true,
                        color: '#E0E0E0'
                    }
                },
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Timeframe',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: false
        }
    };
}

export {
    createChartConfig
};
