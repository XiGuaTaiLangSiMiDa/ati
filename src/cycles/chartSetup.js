let widget;
let currentSymbol = 'BTCUSDT';

export function initTradingView(onChartReady) {
    widget = new TradingView.widget({
        "width": "100%",
        "height": "600",
        "symbol": "BINANCE:" + currentSymbol,
        "interval": "1M", // Monthly timeframe
        "timezone": "Etc/UTC",
        "theme": "light",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview-widget",
        "studies": [],
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
                        // Initialize cycle analysis after chart loads
                        setTimeout(onChartReady, 2000);
                    });
                }
            }
        });
    });

    observer.observe(container, { childList: true });
}

export function getWidget() {
    return widget;
}

// Handle window resize
export function handleResize() {
    const container = document.getElementById('tradingview-widget');
    if (container) {
        container.style.width = '100%';
        container.style.height = '600px';
    }
}
