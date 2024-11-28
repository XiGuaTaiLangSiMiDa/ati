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

    // Create connected bands datasets
    // Upper Band
    datasets.push({
        label: 'Upper Band',
        data: timeframes.map(timeframe => data[timeframe].upper),
        borderColor: '#FF4444',
        backgroundColor: '#FF4444',
        borderWidth: 2,
        pointRadius: 6,
        pointStyle: 'circle',
        fill: false,
        yAxisID: 'y'
    });

    // Middle Band
    datasets.push({
        label: 'Middle Band',
        data: timeframes.map(timeframe => data[timeframe].middle),
        borderColor: '#4444FF',
        backgroundColor: '#4444FF',
        borderWidth: 2,
        pointRadius: 6,
        pointStyle: 'triangle',
        fill: false,
        yAxisID: 'y'
    });

    // Lower Band
    datasets.push({
        label: 'Lower Band',
        data: timeframes.map(timeframe => data[timeframe].lower),
        borderColor: '#44FF44',
        backgroundColor: '#44FF44',
        borderWidth: 2,
        pointRadius: 6,
        pointStyle: 'square',
        fill: false,
        yAxisID: 'y'
    });

    // Add timeframe indicators
    timeframes.forEach((timeframe) => {
        const color = timeframeColors[timeframe];
        datasets.push({
            label: `${timeframe}`,
            data: [null],  // Empty data, just for legend
            borderColor: color,
            backgroundColor: color,
            borderWidth: 0,
            pointRadius: 0,
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
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'y',
                        modifierKey: null  // Allow dragging without modifier key
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'y',
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            borderColor: 'rgba(0,0,0,0.3)',
                            borderWidth: 1
                        }
                    },
                    limits: {
                        y: {min: 'original', max: 'original'}
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
