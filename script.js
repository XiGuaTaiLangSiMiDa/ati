let widget;
let currentSymbol = 'BTCUSDT';

function initTradingView() {
    widget = new TradingView.widget({
        "autosize": true,
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

function searchToken() {
    const searchValue = document.getElementById('searchInput').value.trim().toUpperCase();
    if (searchValue) {
        currentSymbol = searchValue;
        // Reload the widget with new symbol
        document.getElementById('tradingview-widget').innerHTML = '';
        initTradingView();
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
        '4h': '240',
        '7h': '420',
        '8h': '480',
        '12h': '720',
        '1d': 'D',
        '3d': '3D',
        '4d': '4D',
        '1w': 'W',
        '2w': '2W',
        '1M': 'M'
    };

    // Reload widget with new interval
    document.getElementById('tradingview-widget').innerHTML = '';
    widget = new TradingView.widget({
        "autosize": true,
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
