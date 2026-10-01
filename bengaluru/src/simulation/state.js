// src/simulation/state.js
import { scenarios } from './scenarios.js';

class Simulator {
    constructor() {
        this.scenarioId = 'HEAVY';
        this.timeStep = 0; // 0 to 4 (mapping to NOW, 15, 30, 60, 120)
    }

    setScenario(scenarioId) {
        if (scenarios[scenarioId]) {
            this.scenarioId = scenarioId;
        }
    }

    setTimeStep(step) {
        this.timeStep = Math.max(0, Math.min(4, parseInt(step, 10)));
    }

    getCurrentState() {
        const scenario = scenarios[this.scenarioId];
        const stepData = scenario.steps.find(s => s.time === this.timeStep) || scenario.steps[0];

        return {
            timestamp: new Date().toISOString(),
            stormScenario: scenario.name,
            timeLabel: stepData.label,
            drainStates: {
                primary: {
                    watch: stepData.priWatch,
                    critical: stepData.priCrit
                },
                secondary: {
                    watch: stepData.secWatch,
                    critical: [] // Keeping secondary simpler (only watch/amber) as per spec hints, but can be expanded
                }
            },
            lakeStates: {
                watch: stepData.lakeWatch,
                critical: stepData.lakeCrit
            },
            alerts: []
        };
    }
}

export const simulator = new Simulator();
