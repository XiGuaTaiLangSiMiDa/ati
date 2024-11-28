export function updateAnalysis(context, currentPrice) {
    document.getElementById('currentPrice').textContent = currentPrice.toFixed(2);
    
    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = '';

    if (!context || context.length === 0) {
        grid.innerHTML = '<div class="no-data">No cycle analysis available</div>';
        return;
    }

    context.forEach((cycleContext, index) => {
        if (!cycleContext) return;

        const cycleDiv = document.createElement('div');
        cycleDiv.className = 'cycle-analysis';
        cycleDiv.innerHTML = `
            <h4>Cycle ${index + 1} (${cycleContext.cycle.type})</h4>
            <div class="cycle-strength">Strength: ${(cycleContext.cycle.strength * 100).toFixed(1)}%</div>
            ${cycleContext.nearestResistance ? `
                <div class="level resistance">
                    <span class="label">Resistance (${cycleContext.nearestResistance.level})</span>
                    <span class="price">${cycleContext.nearestResistance.price.toFixed(2)}</span>
                </div>
            ` : ''}
            ${cycleContext.nearestSupport ? `
                <div class="level support">
                    <span class="label">Support (${cycleContext.nearestSupport.level})</span>
                    <span class="price">${cycleContext.nearestSupport.price.toFixed(2)}</span>
                </div>
            ` : ''}
        `;
        grid.appendChild(cycleDiv);
    });
}

export function displayNoDataMessage() {
    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = '<div class="no-data">No cycle data available</div>';
    document.getElementById('currentPrice').textContent = '--';
}

export function displayErrorMessage(message) {
    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = `<div class="error">Error: ${message}</div>`;
    document.getElementById('currentPrice').textContent = '--';
}
