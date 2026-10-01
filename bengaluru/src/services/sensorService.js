// src/services/sensorService.js
import { simulator } from '../simulation/state.js';

export class SensorService {
    constructor(map) {
        this.map = map;
        this.sensors = [];
        this.markers = [];
        this.popups = [];
    }

    async initialize() {
        try {
            const primaryRes = await fetch('./src/data/mod-foundation_primarydrains (1).geojson');
            const primaryData = await primaryRes.json();
            
            const secondaryRes = await fetch('./src/data/mod-foundation_secondarydrains.geojson');
            const secondaryData = await secondaryRes.json();

            this.extractSensors(primaryData.features, 20, 'PRIMARY');
            this.extractSensors(secondaryData.features, 10, 'SECONDARY');

            this.renderMarkers();
        } catch (err) {
            console.error("Failed to initialize virtual sensors:", err);
        }
    }

    extractSensors(features, count, type) {
        if (!features || features.length === 0) return;
        
        // Use a multiplier that perfectly overlaps with scenarios.js modulo math
        // Primary: mod 4, 6, 8 -> 24 is a common multiple.
        // Secondary: mod 5, 7, 12 -> 420 is common, but let's just use 35 (mod 5, 7).
        const multiplier = type === 'PRIMARY' ? 24 : 35;
        
        for (let i = 1; i <= count; i++) {
            const sourceId = i * multiplier;
            const feature = features[sourceId];
            if (!feature || !feature.geometry) continue;

            let coords = feature.geometry.coordinates;
            while (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                coords = coords[0];
            }
            if (coords.length === 0 || !Array.isArray(coords[0])) continue;

            this.sensors.push({
                id: `WLS-${type === 'PRIMARY' ? 'P' : 'S'}-${Math.floor(100 + i * 7)}`,
                lngLat: coords[0],
                type: type,
                sourceId: sourceId,
                monitoredAsset: feature.properties['Drain num'] || feature.properties['NAME'] || 'Unknown Segment',
                baseOffline: i % 11 === 0
            });
        }
    }

    renderMarkers() {
        const toggleEl = document.getElementById('toggle-sensors');
        const isVisible = toggleEl ? toggleEl.checked : true;

        this.sensors.forEach((sensor, index) => {
            const el = document.createElement('div');
            el.className = 'sensor-marker-element';
            el.style.width = '7px';
            el.style.height = '7px';
            el.style.borderRadius = '50%';
            el.style.border = '1px solid #000';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
            el.style.transition = 'background-color 0.3s, box-shadow 0.3s';

            const popup = new maplibregl.Popup({ offset: 10, closeButton: false });

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat(sensor.lngLat)
                .setPopup(popup)
                .addTo(this.map);

            
            this.markers.push({ el, popup, marker, sensor });
        });
        
        this.updateSensors(); // Initial state
    }

    updateSensors() {
        if (this.markers.length === 0) return;
        
        const state = simulator.getCurrentState();
        
        const colorMap = {
            'healthy': '#35C48A',
            'warning': '#F4B740',
            'critical': '#FF5F5F',
            'offline': '#8EA2B8'
        };

        const toggleEl = document.getElementById('toggle-sensors');
        const isVisible = toggleEl ? toggleEl.checked : true;

        this.markers.forEach(item => {
            const { el, popup, sensor, marker } = item;
            

            // Determine state dynamically
            let currentStatus = 'healthy';
            if (sensor.baseOffline) {
                currentStatus = 'offline';
            } else {
                const drainStates = sensor.type === 'PRIMARY' ? state.drainStates.primary : state.drainStates.secondary;
                if ((drainStates.critical || []).includes(sensor.sourceId)) {
                    currentStatus = 'critical';
                } else if ((drainStates.watch || []).includes(sensor.sourceId)) {
                    currentStatus = 'warning';
                }
            }

            // Update DOM marker
            el.style.backgroundColor = colorMap[currentStatus];
            if (currentStatus === 'critical') {
                el.style.boxShadow = '0 0 8px #FF5F5F';
            } else if (currentStatus === 'warning') {
                el.style.boxShadow = '0 0 6px #F4B740';
            } else {
                el.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
            }

            // Generate dynamic data
            let wl = 45; let ror = '+0.1';
            if (currentStatus === 'critical') { wl = 88 + Math.floor(Math.random()*10); ror = '+4.2'; }
            else if (currentStatus === 'warning') { wl = 70 + Math.floor(Math.random()*15); ror = '+1.8'; }
            
            const popupHTML = `
                <div class="sensor-tooltip">
                    <h4>Sensor: ${sensor.id}</h4>
                    <strong>Monitored Asset:</strong> ${sensor.monitoredAsset}<br/>
                    <strong>Water Level:</strong> ${currentStatus === 'offline' ? 'N/A' : wl + '%'}<br/>
                    <strong>Rate of Rise:</strong> ${currentStatus === 'offline' ? 'N/A' : ror + ' cm/min'}<br/>
                    <strong>Status:</strong> <span style="color:${colorMap[currentStatus]}; font-weight:bold;">${currentStatus.toUpperCase()}</span><br/>
                    <div class="badge" style="margin-top:10px; background-color:#0B1728; border:1px solid #1B2D44;">SOURCE: SIMULATED SENSOR FEED</div>
                </div>
            `;
            popup.setHTML(popupHTML);
        });
    }
}
