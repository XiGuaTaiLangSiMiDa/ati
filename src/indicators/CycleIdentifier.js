export class CycleIdentifier {
    constructor() {}

    identifyCycles(swings) {
        if (!swings || swings.length < 2) return [];

        const cycles = [];
        let currentCycle = [];

        for (let i = 0; i < swings.length - 1; i++) {
            const currentSwing = swings[i];
            const nextSwing = swings[i + 1];

            if (currentCycle.length === 0) {
                currentCycle.push(currentSwing);
            }

            if (currentSwing.type !== nextSwing.type) {
                currentCycle.push(nextSwing);
                
                if (currentCycle.length === 2) {
                    cycles.push({
                        start: currentCycle[0],
                        end: currentCycle[1],
                        type: currentCycle[0].type === 'low' ? 'upward' : 'downward',
                        strength: this.calculateCycleStrength(
                            Math.max(currentCycle[0].price, currentCycle[1].price),
                            Math.min(currentCycle[0].price, currentCycle[1].price)
                        )
                    });
                    currentCycle = [nextSwing];
                }
            }
        }

        return cycles;
    }

    calculateCycleStrength(high, low) {
        return Math.abs(high - low) / high;
    }
}
