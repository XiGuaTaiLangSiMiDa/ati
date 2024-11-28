let widget;
let currentSymbol = 'BTCUSDT';

function initTradingView() {
    widget = new TradingView.widget({
        "width": "100%",
        "height": "600",
        "symbol": "BINANCE:" + currentSymbol,
        "interval": "15",
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview-widget",
        "studies": [
            "BB@tv-basicstudies"
        ],
        "drawings_access": { type: 'all' },
        "saved_data": {
            "drawings": [],
            "studies": []
        }
    });

    // Wait for iframe to load
    const container = document.getElementById('tradingview-widget');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                const iframe = container.querySelector('iframe');
                if (iframe) {
                    observer.disconnect();
                    iframe.addEventListener('load', () => {
                        console.log('TradingView chart loaded');
                        // Add initial Bollinger Bands after a short delay
                        setTimeout(() => {
                            try {
                                if (widget.chart && typeof widget.chart === 'function') {
                                    widget.chart().createStudy('Bollinger Bands');
                                }
                            } catch (e) {
                                console.log('Initial BB setup skipped');
                            }
                        }, 2000);
                    });
                }
            }
        });
    });

    observer.observe(container, { childList: true });
}

function searchToken() {
    const searchValue = document.getElementById('searchInput').value.trim().toUpperCase();
    if (searchValue) {
        currentSymbol = searchValue;
        // Reload the widget with new symbol
        document.getElementById('tradingview-widget').innerHTML = '';
        widget = new TradingView.widget({
            "width": "100%",
            "height": "600",
            "symbol": "BINANCE:" + currentSymbol,
            "interval": "15",
            "timezone": "Etc/UTC",
            "theme": "light",
            "style": "1",
            "locale": "en",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "container_id": "tradingview-widget",
            "studies": [
                "BB@tv-basicstudies"
            ]
        });
    }
}

function toggleTimeframe(timeframe) {
    const button = document.querySelector(`button[data-timeframe="${timeframe}"]`);
    const allButtons = document.querySelectorAll('.button-container.timeframes button');

    // Remove active class from all buttons
    allButtons.forEach(btn => btn.classList.remove('active'));

    // Add active class to clicked button
    button.classList.add('active');

    // Map timeframe to TradingView interval
    const intervalMap = {
        '15m': '15',
        '30m': '30',
        '1h': '60',
        '2h': '120',
        '3h': "180",
        '4h': '240',
        '5h': '300',
        '7h': '420',
        '8h': '480',
        '9h': '540',
        '10h': '600',
        '11h': '660',
        '12h': '720',
        '1d': 'D',
        '2d': '2D',
        '3d': '3D',
        '4d': '4D',
        '5d': '5D',
        '6d': '6D',
        '1w': 'W',
        '2w': '2W',
        '3w': '3W',
        '1M': 'M',
        '120d': '120D',
        '144d': '144D',
        '200d': '200D',
    };

    // Reload widget with new interval
    document.getElementById('tradingview-widget').innerHTML = '';
    widget = new TradingView.widget({
        "width": "100%",
        "height": "600",
        "symbol": "BINANCE:" + currentSymbol,
        "interval": intervalMap[timeframe],
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview-widget",
        "studies": [
            "BB@tv-basicstudies"
        ]
    });
}

function toggleIndicator(indicator) {
    const button = document.querySelector(`button[data-indicator="${indicator}"]`);
    button.classList.toggle('active');

    // Add a delay to ensure the widget is ready
    setTimeout(() => {
        try {
            if (widget.chart && typeof widget.chart === 'function') {
                const chart = widget.chart();

                switch (indicator) {
                    case 'fib':
                        if (button.classList.contains('active')) {
                            chart.executeActionById('drawingToolbarAction');
                            setTimeout(() => {
                                chart.executeActionById('fibRetracementTool');
                            }, 100);
                        }
                        break;
                    case 'fixedVol':
                        if (button.classList.contains('active')) {
                            chart.createStudy('Volume Profile Fixed Range');
                        }
                        break;
                    case 'anchoredVol':
                        if (button.classList.contains('active')) {
                            chart.createStudy('Volume Profile Visible Range');
                        }
                        break;
                }
            }
        } catch (e) {
            console.log('Indicator toggle skipped');
        }
    }, 1000);
}

// Initialize when page loads
window.addEventListener('load', initTradingView);

// Handle window resize
window.addEventListener('resize', () => {
    const container = document.getElementById('tradingview-widget');
    if (container) {
        container.style.width = '100%';
        container.style.height = '600px';
    }
});
