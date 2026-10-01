// src/ui/map.js
import { simulator } from '../simulation/state.js';
import { SensorService } from '../services/sensorService.js';
import { PanelManager } from './panels.js';
import { SearchManager } from './search.js';
import { AlertSystem } from './alerts.js';
import { NotificationService } from '../services/notifications.js';
const map = new maplibregl.Map({
    container: 'map', 
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [77.5946, 12.9716], 
    zoom: 11
});

let currentMode = 'RISK';
let playInterval = null;
let activeFilter = null;
let sensorService = null;
let panelManager = null;
let searchManager = null;

map.on('load', () => {
    setTimeout(() => {
        map.resize();
    }, 100);
    window.bengaluruMap = map;
    // ----------------------------------------------------
    // Layer Ingestion
    // ----------------------------------------------------
    
    map.addSource('subbasins', {
        type: 'geojson',
        data: './src/data/mod-foundation_subvalley.geojson',
        generateId: true
    });

    map.addSource('lakes', {
        type: 'geojson',
        data: './src/data/mod-foundation_lakes_existing.geojson',
        generateId: true
    });

    map.addSource('secondary-drains', {
        type: 'geojson',
        data: './src/data/mod-foundation_secondarydrains.geojson',
        generateId: true
    });

    map.addSource('primary-drains', {
        type: 'geojson',
        data: './src/data/mod-foundation_primarydrains%20(1).geojson',
        generateId: true
    });

    // ----------------------------------------------------
    // Styling
    // ----------------------------------------------------
    
    map.addLayer({
        'id': 'subbasins-layer',
        'type': 'fill',
        'source': 'subbasins',
        'layout': { 'visibility': 'visible' },
        'paint': {
            'fill-color': '#e0f3db',
            'fill-opacity': 0.15
        }
    });
    map.addLayer({
        'id': 'subbasins-border-layer',
        'type': 'line',
        'source': 'subbasins',
        'layout': { 'visibility': 'visible' },
        'paint': {
            'line-color': '#a3c9a6',
            'line-width': 1,
            'line-dasharray': [4, 4]
        }
    });

    map.addLayer({
        'id': 'lakes-layer',
        'type': 'fill',
        'source': 'lakes',
        'layout': { 'visibility': 'visible' },
        'paint': {
            'fill-color': '#167CB5',
            'fill-opacity': [
                'case',
                ['==', ['feature-state', 'dimmed'], true], 0.15,
                0.7
            ]
        }
    });

    map.addLayer({
        'id': 'lakes-state-overlay',
        'type': 'fill',
        'source': 'lakes',
        'layout': { 'visibility': 'visible' },
        'paint': {
            'fill-color': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], 'rgba(255, 95, 95, 0.5)',
                ['==', ['feature-state', 'state'], 'watch'], 'rgba(244, 183, 64, 0.4)',
                'rgba(0,0,0,0)'
            ]
        }
    });

    map.addLayer({
        'id': 'lakes-outline-layer',
        'type': 'line',
        'source': 'lakes',
        'layout': { 'visibility': 'visible' },
        'paint': {
            'line-color': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], '#FF5F5F',
                ['==', ['feature-state', 'state'], 'watch'], '#F4B740',
                '#167CB5'
            ],
            'line-opacity': [
                'case',
                ['==', ['feature-state', 'dimmed'], true], 0.15,
                1.0
            ],
            'line-width': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], 2,
                ['==', ['feature-state', 'state'], 'watch'], 2,
                1
            ]
        }
    });

    map.addLayer({
        'id': 'secondary-drains-layer',
        'type': 'line',
        'source': 'secondary-drains',
        'layout': {
            'visibility': 'visible',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], '#FF5F5F',
                ['==', ['feature-state', 'state'], 'watch'], '#F4B740',
                '#4EB3D3'
            ],
            'line-opacity': [
                'case',
                ['==', ['feature-state', 'dimmed'], true], 0.15,
                1.0
            ],
            'line-width': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], 3,
                ['==', ['feature-state', 'state'], 'watch'], 2.5,
                1.5
            ]
        }
    });

    map.addLayer({
        'id': 'primary-drains-layer',
        'type': 'line',
        'source': 'primary-drains',
        'layout': {
            'visibility': 'visible',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], '#FF5F5F',
                ['==', ['feature-state', 'state'], 'watch'], '#F4B740',
                '#0868AC'
            ],
            'line-opacity': [
                'case',
                ['==', ['feature-state', 'dimmed'], true], 0.15,
                1.0
            ],
            'line-width': [
                'case',
                ['==', ['feature-state', 'state'], 'critical'], 5,
                ['==', ['feature-state', 'state'], 'watch'], 4,
                3.5
            ]
        }
    });

    map.addSource('highlight-source', { 
        type: 'geojson', 
        data: { type: 'FeatureCollection', features: [] } 
    });
    // 1. Dashed Animated Layer for Drains (LineStrings)
    map.addLayer({
        id: 'highlight-layer-line',
        type: 'line',
        source: 'highlight-source',
        filter: ['==', '$type', 'LineString'], // MapLibre automatically includes MultiLineString here
        paint: { 
            'line-color': '#00FFFF', 
            'line-width': 6, 
            'line-dasharray': [2, 2] 
        }
    });

    // 2. Solid Layer for Sub-valleys (Polygons)
    map.addLayer({
        id: 'highlight-layer-polygon',
        type: 'line',
        source: 'highlight-source',
        filter: ['==', '$type', 'Polygon'], // MapLibre automatically includes MultiPolygon here
        paint: { 
            'line-color': '#00FFFF', 
            'line-width': 4 
        }
    });

    // Initialize Services and UI
    sensorService = new SensorService(map);
    sensorService.initialize();

    panelManager = new PanelManager(map);
    searchManager = new SearchManager(map, panelManager);
    
    // Force initialization immediately
    const notifyService = new NotificationService();
    window.alertSystem = new AlertSystem(map, panelManager, notifyService);
    console.log("AlertSystem forcefully initialized");

    bindUIEvents();
    renderSimulationState();
});

// ----------------------------------------------------
// UI Controllers
// ----------------------------------------------------

function bindUIEvents() {
    // App Mode (Top Bar)
    const appModeBtns = document.querySelectorAll('#app-mode-toggle .mode-btn');
    appModeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            appModeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // Map Mode (Right side)
    const modeButtons = document.querySelectorAll('.map-mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Force reset all buttons
            modeButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#8EA2B8';
            });
            // Force highlight clicked button
            const target = e.currentTarget;
            target.classList.add('active');
            target.style.background = '#0F1D31';
            target.style.color = '#E7EEF7';
            
            currentMode = target.getAttribute('data-mode');
            renderSimulationState();
        });
    });

    // Scenario Selector
    document.getElementById('scenario-selector').addEventListener('change', (e) => {
        simulator.setScenario(e.target.value);
        renderSimulationState();
    });

    // Timeline Scrubber
    const slider = document.getElementById('time-slider');
    const labels = document.querySelectorAll('.timeline-labels span');
    slider.addEventListener('input', (e) => {
        simulator.setTimeStep(e.target.value);
        labels.forEach((l, i) => {
            l.classList.toggle('active', i == e.target.value);
        });
        renderSimulationState();
    });

    // Play / Pause
    const playBtn = document.getElementById('play-pause-btn');
    playBtn.addEventListener('click', () => {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
            playBtn.innerHTML = '▶ Play';
        } else {
            playBtn.innerHTML = '⏸ Pause';
            playInterval = setInterval(() => {
                let nextVal = parseInt(slider.value) + 1;
                if (nextVal > 4) nextVal = 0;
                slider.value = nextVal;
                slider.dispatchEvent(new Event('input'));
            }, 1500);
        }
    });

    // KPI Filters
    const kpiCards = document.querySelectorAll('.kpi-card[data-filter]');
    kpiCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const filter = card.getAttribute('data-filter');
            if (activeFilter === filter) {
                activeFilter = null; // toggle off
                card.classList.remove('active-filter');
            } else {
                kpiCards.forEach(c => c.classList.remove('active-filter'));
                activeFilter = filter;
                card.classList.add('active-filter');
            }
            renderSimulationState();
        });
    });

    // Layer Control checkboxes
    const bindLayerToggle = (checkboxId, layerIds) => {
        const checkbox = document.getElementById(checkboxId);
        if (!checkbox) return;
        checkbox.addEventListener('change', (e) => {
            const visibility = e.target.checked ? 'visible' : 'none';
            layerIds.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', visibility);
                }
            });
        });
    };

    bindLayerToggle('toggle-subbasins', ['subbasins-layer', 'subbasins-border-layer']);
    bindLayerToggle('toggle-lakes', ['lakes-layer', 'lakes-state-overlay', 'lakes-outline-layer']);
    bindLayerToggle('toggle-secondary-drains', ['secondary-drains-layer']);
    bindLayerToggle('toggle-primary-drains', ['primary-drains-layer']);

    const sensorToggle = document.getElementById('toggle-sensors');
    if (sensorToggle) {
        sensorToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('hide-sensors');
            } else {
                document.body.classList.add('hide-sensors');
            }
        });
    }

}

// Global cache to clear previous states efficiently
let previousStates = {
    'primary-drains': [],
    'secondary-drains': [],
    'lakes': []
};
let dimmedStates = {
    'primary-drains': [],
    'secondary-drains': [],
    'lakes': []
};

function renderSimulationState() {
    if (!map.isStyleLoaded()) return;

    // Clear previous states
    ['primary-drains', 'secondary-drains', 'lakes'].forEach(source => {
        previousStates[source].forEach(id => {
            map.setFeatureState({ source: source, id: id }, { state: 'normal' });
        });
        dimmedStates[source].forEach(id => {
            map.setFeatureState({ source: source, id: id }, { dimmed: false });
        });
        previousStates[source] = [];
        dimmedStates[source] = [];
    });

    const state = simulator.getCurrentState();
    updateKPIs(state);
    updateWeather(state);

    if (currentMode === 'INFRASTRUCTURE') return;

    const applyState = (source, ids, stateValue) => {
        if (!ids) return;
        ids.forEach(id => {
            if (window.alertSystem && window.alertSystem.dict && window.alertSystem.dict[source]) {
                const feat = window.alertSystem.dict[source][id];
                if (feat) {
                    const p = feat.properties || {};
                    const rId = p['Drain num'] || p['NAME'] || p['BBMP ID'] || p.BBMP_ID || p.Lake_Name || p.ID || p.id || p.bbmp_id || p.fid;
                    if (source !== 'lakes' && (!rId || String(rId).toLowerCase().includes('unknown') || String(rId).toLowerCase() === 'null')) return;
                }
            }
            map.setFeatureState({ source: source, id: id }, { state: stateValue });
            if (previousStates[source]) previousStates[source].push(id);
        });
    };

    applyState('primary-drains', state.drainStates.primary.watch, 'watch');
    applyState('primary-drains', state.drainStates.primary.critical, 'critical');
    applyState('secondary-drains', state.drainStates.secondary.watch, 'watch');
    applyState('secondary-drains', state.drainStates.secondary.critical, 'critical');
    applyState('lakes', state.lakeStates.watch, 'watch');
    applyState('lakes', state.lakeStates.critical, 'critical');

    // Apply Dimming based on KPI filter
    if (activeFilter) {
        applyDimming(state);
    }

    if (sensorService) {
        sensorService.updateSensors();
    }
    
    if (window.alertSystem) {
        window.alertSystem.updateAlerts(state);
        
        const kpi = window.alertSystem.kpi;
        document.querySelectorAll('div, span, p, h3, h4').forEach(el => {
            const text = el.textContent.trim().toUpperCase();
            if (['CRITICAL DRAINS', 'WATCH DRAINS', 'LAKES AT RISK', 'ACTIVE ALERTS'].includes(text)) {
                const parent = el.parentElement;
                if (parent) {
                    const numberEl = Array.from(parent.children).find(child => /^\d+$/.test(child.textContent.trim()) && child !== el);
                    if (numberEl) {
                        if (text === 'CRITICAL DRAINS') numberEl.textContent = kpi.critDrains;
                        if (text === 'WATCH DRAINS') numberEl.textContent = kpi.watchDrains;
                        if (text === 'LAKES AT RISK') numberEl.textContent = kpi.critLakes;
                        if (text === 'ACTIVE ALERTS') numberEl.textContent = kpi.activeAlerts;
                    }
                }
            }
        });
    }

    // Force the right-hand panel to dynamically refresh with new data
    if (panelManager) panelManager.refresh();
}

function applyDimming(state) {
    const maxPrimary = 500;
    const maxSecondary = 5000;
    const maxLakes = 300;

    const dimUnmatched = (source, maxIds, matchedIds) => {
        const matchSet = new Set(matchedIds);
        for(let i=0; i<maxIds; i++) {
            if(!matchSet.has(i)) {
                map.setFeatureState({ source: source, id: i }, { dimmed: true });
                dimmedStates[source].push(i);
            }
        }
    };

    if (activeFilter === 'critical-drains') {
        const pCrit = state.drainStates.primary.critical || [];
        const sCrit = state.drainStates.secondary.critical || [];
        dimUnmatched('primary-drains', maxPrimary, pCrit);
        dimUnmatched('secondary-drains', maxSecondary, sCrit);
    } else if (activeFilter === 'watch-drains') {
        const pWatch = state.drainStates.primary.watch || [];
        const sWatch = state.drainStates.secondary.watch || [];
        dimUnmatched('primary-drains', maxPrimary, pWatch);
        dimUnmatched('secondary-drains', maxSecondary, sWatch);
    } else if (activeFilter === 'lakes-risk') {
        const riskLakes = [...(state.lakeStates.watch || []), ...(state.lakeStates.critical || [])];
        dimUnmatched('lakes', maxLakes, riskLakes);
        dimUnmatched('primary-drains', maxPrimary, []);
        dimUnmatched('secondary-drains', maxSecondary, []);
    }
}

function updateKPIs(state) {
    const pCrit = (state.drainStates.primary.critical || []).length;
    const sCrit = (state.drainStates.secondary.critical || []).length;
    
    const pWatch = (state.drainStates.primary.watch || []).length;
    const sWatch = (state.drainStates.secondary.watch || []).length;
    
    const lWatch = (state.lakeStates.watch || []).length;
    const lCrit = (state.lakeStates.critical || []).length;

    document.getElementById('kpi-critical-drains').innerText = pCrit + sCrit;
    document.getElementById('kpi-watch-drains').innerText = pWatch + sWatch;
    document.getElementById('kpi-lakes-risk').innerText = lWatch + lCrit;
    
    document.getElementById('kpi-hotspots').innerText = Math.floor((pCrit + lCrit) * 1.5);
    document.getElementById('kpi-alerts').innerText = Math.floor((pCrit + sCrit) / 3);
}

function updateWeather(state) {
    const rainNow = state.stormScenario === 'Normal Rain' ? 12 : (state.stormScenario === 'Heavy Monsoon' ? 48 : 85);
    const stepMult = (simulator.timeStep + 1);
    
    document.getElementById('w-rain').innerText = `${rainNow + stepMult * 2} mm/hr`;
    document.getElementById('w-f30').innerText = `${rainNow + stepMult * 5} mm/hr`;
    document.getElementById('w-f60').innerText = `${rainNow + stepMult * 8} mm/hr`;
    
    const trendEl = document.getElementById('w-trend');
    const sevEl = document.getElementById('w-sev');

    if (state.stormScenario === 'Normal Rain') {
        trendEl.innerText = '→ Stable';
        trendEl.style.color = 'var(--color-normal)';
        sevEl.innerText = 'NORMAL';
        sevEl.className = 'badge';
        sevEl.style.backgroundColor = 'var(--color-panel-secondary)';
        sevEl.style.color = 'var(--color-text-muted)';
    } else if (state.stormScenario === 'Heavy Monsoon') {
        trendEl.innerText = '↑ Intensifying';
        trendEl.style.color = 'var(--color-watch)';
        sevEl.innerText = 'HEAVY';
        sevEl.className = 'badge';
        sevEl.style.backgroundColor = 'rgba(244, 183, 64, 0.2)';
        sevEl.style.color = 'var(--color-watch)';
    } else {
        trendEl.innerText = '↑↑ Severe';
        trendEl.style.color = 'var(--color-critical)';
        sevEl.innerText = 'EXTREME';
        sevEl.className = 'badge badge-severe';
        sevEl.style.backgroundColor = 'rgba(255, 95, 95, 0.2)';
        sevEl.style.color = 'var(--color-critical)';
    }
}

const dashArraySequence = [
    [0, 4, 3, 0], [0.5, 4, 2.5, 0], [1, 4, 2, 0], [1.5, 4, 1.5, 0], [2, 4, 1, 0], [2.5, 4, 0.5, 0], [3, 4, 0, 0],
    [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]
];
let step = 0;
function animateHighlight() {
    step = (step + 1) % dashArraySequence.length;
    if (window.bengaluruMap && window.bengaluruMap.getLayer('highlight-layer-line')) {
        window.bengaluruMap.setPaintProperty('highlight-layer-line', 'line-dasharray', dashArraySequence[step]);
    }
    setTimeout(() => { requestAnimationFrame(animateHighlight); }, 50);
}
requestAnimationFrame(animateHighlight);

document.addEventListener('click', (e) => {
    const layerBtn = e.target.closest('.layer-icon-btn');
    const layerContent = document.querySelector('.layer-control-content');
    
    if (!layerContent) return;

    if (layerBtn) {
        // If the user clicked the button or the SVG icon inside it
        e.preventDefault();
        e.stopPropagation();
        const isHidden = window.getComputedStyle(layerContent).display === 'none';
        layerContent.style.display = isHidden ? 'block' : 'none';
    } else if (!e.target.closest('.layer-control-dropdown')) {
        // If the user clicked anywhere else on the page, close the menu
        layerContent.style.display = 'none';
    }
});
