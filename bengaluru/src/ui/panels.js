// src/ui/panels.js
import { simulator } from '../simulation/state.js';

export class PanelManager {
    constructor(map) {
        this.map = map;
        this.panelEl = document.getElementById('detail-panel');
        this.bindEvents();
        this.renderDefault();
    }

    highlightFeature(feature) {
        if (window.bengaluruMap && window.bengaluruMap.getSource('highlight-source')) {
            window.bengaluruMap.getSource('highlight-source').setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: feature.properties
                }]
            });
        }
    }

    bindEvents() {
        this.map.on('click', (e) => {
            const bbox = [[e.point.x - 6, e.point.y - 6], [e.point.x + 6, e.point.y + 6]];
            const features = this.map.queryRenderedFeatures(bbox, {
                layers: ['primary-drains-layer', 'secondary-drains-layer', 'lakes-layer', 'subbasins-layer']
            });
            if (!features.length) {
                if (this.map.getSource("highlight-source")) {
                    this.map.getSource("highlight-source").setData({type: "FeatureCollection", features: []});
                }
                this.renderDefault();
                return;
            }
            
            const topFeature = features[0];
            if (topFeature.layer.id === 'primary-drains-layer') {
                this.handleDrainClick({ features: [topFeature] }, 'PRIMARY');
            } else if (topFeature.layer.id === 'secondary-drains-layer') {
                this.handleDrainClick({ features: [topFeature] }, 'SECONDARY');
            } else if (topFeature.layer.id === 'lakes-layer') {
                this.handleLakeClick({ features: [topFeature] });
            } else if (topFeature.layer.id === 'subbasins-layer') {
                this.handleSubvalleyClick({ features: [topFeature] });
            }
        });

        // Cursor styles
        const layers = ['primary-drains-layer', 'secondary-drains-layer', 'lakes-layer', 'subbasins-layer'];
        layers.forEach(layer => {
            this.map.on('mouseenter', layer, () => this.map.getCanvas().style.cursor = 'pointer');
            this.map.on('mouseleave', layer, () => this.map.getCanvas().style.cursor = '');
        });
    }

    renderDefault() {
        this.panelEl.innerHTML = `
            <div class="panel-header">CITY OVERVIEW</div>
            <div class="panel-content" style="font-size: 13px; color: var(--color-text-muted); line-height: 1.6;">
                <p>Welcome to the Bengaluru Storm-Water Flood Intelligence Console.</p>
                <br/>
                <p>Select any infrastructure asset on the map (Primary Drain, Secondary Drain, Lake, or Sub-valley) to view its explicit telemetry and simulated prediction.</p>
            </div>
        `;
    }

    generateSparkline(points, isCritical) {
        const h = 40;
        const w = 280;
        const max = 100;
        const step = w / (points.length - 1);
        const color = isCritical ? 'var(--color-critical)' : 'var(--color-info)';
        
        let path = `M 0 ${h - (points[0]/max)*h}`;
        for(let i=0; i<points.length-1; i++) {
            const x1 = i * step;
            const y1 = h - (points[i]/max)*h;
            const x2 = (i+1) * step;
            const y2 = h - (points[i+1]/max)*h;
            
            const ctrlX1 = x1 + (x2 - x1) * 0.5;
            const ctrlX2 = x2 - (x2 - x1) * 0.5;
            
            path += ` C ${ctrlX1} ${y1}, ${ctrlX2} ${y2}, ${x2} ${y2}`;
        }
        
        return `
            <svg width="100%" height="${h}px" viewBox="0 0 ${w} ${h}" style="background: var(--color-panel-secondary); border-radius: 4px; border: 1px solid var(--color-border); margin: 10px 0;">
                <line x1="0" y1="${h - 0.75*h}" x2="${w}" y2="${h - 0.75*h}" stroke="var(--color-watch)" stroke-width="1" stroke-dasharray="4" />
                <line x1="0" y1="${h - 0.90*h}" x2="${w}" y2="${h - 0.90*h}" stroke="var(--color-critical)" stroke-width="1" stroke-dasharray="4" />
                <path d="${path}" fill="none" stroke="${color}" stroke-width="2" />
                <circle cx="${w}" cy="${h - (points[points.length-1]/max)*h}" r="4" fill="${color}" />
            </svg>
        `;
    }

    handleDrainClick(e, type) {
        if (!e.features.length) return;
        this.activeSelection = { type: 'drain', source: type, feature: e.features[0] };
        const feature = e.features[0];
        this.highlightFeature(feature);
        const props = feature.properties;
        const wardName = props.Ward_Name || props.WARD_NAME || props.ward_name || props.Ward || 'Unnamed';
        const wardNo = props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo || 'Unnamed';

        // Conditionally drop the number if it is Unnamed
        let formattedWard = wardName;
        if (wardNo !== 'Unnamed') {
            formattedWard += ` (No. ${wardNo})`;
        }

        // If the string is longer than 38 characters, it likely spans multiple lines
        const needsExpand = formattedWard.length > 38; 

        const wardHtml = `
            <div class="ward-wrapper" style="display: flex; align-items: flex-start;">
                <span class="ward-label" style="margin-right: 4px; white-space: nowrap;">Ward:</span> 
                <span class="ward-expandable" ${needsExpand ? `style="cursor: pointer;" onclick="this.classList.toggle('expanded'); const btn = this.nextElementSibling; if(btn) btn.innerText = this.classList.contains('expanded') ? '[-]' : '[+]';"` : ''}>${formattedWard}</span>
                ${needsExpand ? `<span style="color: #00FFFF; cursor: pointer; font-size: 11px; margin-left: 4px; flex-shrink: 0; padding-top: 1px;" onclick="const target = this.previousElementSibling; target.classList.toggle('expanded'); this.innerText = target.classList.contains('expanded') ? '[-]' : '[+]';">[+]</span>` : ''}
            </div>
        `;
        const stateData = simulator.getCurrentState();
        
        const id = props['Drain num'] || props['NAME'] || `Drain-${feature.id}`;
        
        const states = type === 'PRIMARY' ? stateData.drainStates.primary : stateData.drainStates.secondary;
        const isCritical = (states.critical || []).includes(feature.id);
        const isWatch = (states.watch || []).includes(feature.id);
        
        let conditionStr = 'NORMAL';
        let conditionColor = 'var(--color-normal)';
        let waterLevel = 45;
        let rateOfRise = '+0.1';
        let breachMin = 'N/A';
        let forecastLevel = 45;
        
        if (isCritical) {
            conditionStr = 'CRITICAL'; conditionColor = 'var(--color-critical)';
            waterLevel = 72; rateOfRise = '+4.2'; breachMin = '18 min';
            forecastLevel = 98;
        } else if (isWatch) {
            conditionStr = 'WATCH'; conditionColor = 'var(--color-watch)';
            waterLevel = 58; rateOfRise = '+1.5'; breachMin = '45 min';
            forecastLevel = 82;
        }

        const rainNow = stateData.stormScenario === 'Normal Rain' ? 12 : (stateData.stormScenario === 'Heavy Monsoon' ? 48 : 85);
        const stepMult = (simulator.timeStep + 1);
        const currentRain = rainNow + stepMult * 2;
        const forecast60 = rainNow + stepMult * 8;
        
        const sparklinePoints = [
            waterLevel,
            waterLevel + (forecastLevel - waterLevel) * 0.4,
            waterLevel + (forecastLevel - waterLevel) * 0.7,
            waterLevel + (forecastLevel - waterLevel) * 0.9,
            forecastLevel
        ];

        this.panelEl.innerHTML = `
            <div class="panel-header" style="background-color: ${conditionColor}; color: #000;">${type} DRAIN: ${id}</div>
            <div class="panel-content" style="font-size: 12px; overflow-y: auto; height: calc(100vh - 150px);">
                
                <!-- 1. Identity -->
                <div style="margin-bottom: 15px;">
                    <strong>Identity</strong><br/>
                    ID: ${id}<br/>
                    Type: ${type} Drain<br/>
                    Valley: ${props.valley || 'Unknown'}<br/>
                    Length: ${props.length_m ? parseFloat(props.length_m).toFixed(1) : 'Unknown'} m<br/>
                    ${wardHtml}
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">
                
                <!-- 2. Current Condition -->
                <div style="margin-bottom: 15px;">
                    <strong>Current Condition</strong><br/>
                    Water Level: <span style="color:${conditionColor}; font-weight:bold;">${waterLevel}%</span><br/>
                    Rate of Rise: ${rateOfRise} cm/min<br/>
                    Sensor: HEALTHY
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">

                <!-- 3. Weather -->
                <div style="margin-bottom: 15px;">
                    <strong>Weather</strong><br/>
                    Rain now: ${currentRain} mm/hr<br/>
                    Next 60 min: ${forecast60} mm/hr
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">

                <!-- 4. Simulated Prediction -->
                <div style="margin-bottom: 15px;">
                    <strong><span class="badge" style="background:var(--color-panel-secondary); color:var(--color-watch);">SIMULATED PREDICTION</span></strong><br/>
                    Risk: <span style="color:${conditionColor}; font-weight:bold;">${conditionStr}</span><br/>
                    Threshold Breach: ${breachMin}<br/>
                    Model Confidence: 94%
                </div>

                <!-- 5. Trend Chart -->
                <strong>Trend Chart</strong>
                ${this.generateSparkline(sparklinePoints, isCritical)}

                <!-- 6. Risk Drivers -->
                <div style="margin-bottom: 15px;">
                    <strong>Risk Drivers</strong><br/>
                    <div style="display:flex; gap:5px; margin-top:5px; flex-wrap: wrap;">
                        <span class="badge" style="background: ${waterLevel > 80 ? 'var(--color-critical)' : 'var(--color-panel-secondary)'}; color: ${waterLevel > 80 ? '#fff' : 'var(--color-text)'}">High Water</span>
                        <span class="badge" style="background: ${parseFloat(rateOfRise) > 2 ? 'var(--color-watch)' : 'var(--color-panel-secondary)'}; color: ${parseFloat(rateOfRise) > 2 ? '#000' : 'var(--color-text)'}">Rapid Rise</span>
                        <span class="badge" style="background: ${currentRain > 40 ? 'var(--color-watch)' : 'var(--color-panel-secondary)'}; color: ${currentRain > 40 ? '#000' : 'var(--color-text)'}">Heavy Forecast</span>
                        <span class="badge" style="background: ${isCritical ? 'var(--color-critical)' : 'var(--color-panel-secondary)'}; color: ${isCritical ? '#fff' : 'var(--color-text)'}">Upstream Stress</span>
                    </div>
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">
                
                <!-- 7. Recommended Actions -->
                <div style="margin-bottom: 15px;">
                    <strong>Recommended Actions</strong><br/>
                    • Notify SWD control<br/>
                    • Inspect downstream<br/>
                    • Prepare field team
                </div>
            </div>
        `;
    }

    handleLakeClick(e) {
        if (!e.features.length) return;
        this.activeSelection = { type: 'lake', feature: e.features[0] };
        const feature = e.features[0];
        this.highlightFeature(feature);
        const props = feature.properties;
        const wardName = props.Ward_Name || props.WARD_NAME || props.ward_name || props.Ward || 'Unnamed';
        const wardNo = props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo || 'Unnamed';

        // Conditionally drop the number if it is Unnamed
        let formattedWard = wardName;
        if (wardNo !== 'Unnamed') {
            formattedWard += ` (No. ${wardNo})`;
        }

        // If the string is longer than 38 characters, it likely spans multiple lines
        const needsExpand = formattedWard.length > 38; 

        const wardHtml = `
            <div class="ward-wrapper" style="display: flex; align-items: flex-start;">
                <span class="ward-label" style="margin-right: 4px; white-space: nowrap;">Ward:</span> 
                <span class="ward-expandable" ${needsExpand ? `style="cursor: pointer;" onclick="this.classList.toggle('expanded'); const btn = this.nextElementSibling; if(btn) btn.innerText = this.classList.contains('expanded') ? '[-]' : '[+]';"` : ''}>${formattedWard}</span>
                ${needsExpand ? `<span style="color: #00FFFF; cursor: pointer; font-size: 11px; margin-left: 4px; flex-shrink: 0; padding-top: 1px;" onclick="const target = this.previousElementSibling; target.classList.toggle('expanded'); this.innerText = target.classList.contains('expanded') ? '[-]' : '[+]';">[+]</span>` : ''}
            </div>
        `;
        const stateData = simulator.getCurrentState();

        const name = props.name || props.NAME || 'Unknown Lake';
        const id = props.bbmp_id || 'N/A';

        const isCritical = (stateData.lakeStates.critical || []).includes(feature.id);
        const isWatch = (stateData.lakeStates.watch || []).includes(feature.id);
        
        let conditionStr = 'NORMAL';
        let conditionColor = 'var(--color-lake)';
        let stress = 42;
        let inflow = 'Stable';
        let eta = 'N/A';

        if (isCritical) {
            conditionStr = 'CRITICAL'; conditionColor = 'var(--color-critical)';
            stress = 95; inflow = 'Extreme'; eta = '3 hrs';
        } else if (isWatch) {
            conditionStr = 'WATCH'; conditionColor = 'var(--color-watch)';
            stress = 78; inflow = 'Rising'; eta = '8 hrs';
        }

        this.panelEl.innerHTML = `
            <div class="panel-header" style="background-color: ${conditionColor}; color: #000;">LAKE: ${name}</div>
            <div class="panel-content" style="font-size: 12px; overflow-y: auto; height: calc(100vh - 150px);">
                
                <div style="margin-bottom: 15px;">
                    <strong>Identity</strong><br/>
                    BBMP ID: ${id}<br/>
                    ${wardHtml}
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">

                <div style="margin-bottom: 15px;">
                    <strong><span class="badge" style="background:var(--color-panel-secondary); color:var(--color-watch);">SIMULATED PREDICTION</span></strong><br/>
                    Status: <span style="color:${conditionColor}; font-weight:bold;">${conditionStr}</span><br/>
                    Storage Stress: ${stress}%<br/>
                    Inflow Trend: ${inflow}<br/>
                    Overflow Risk ETA: ${eta}<br/>
                    Nearby Network Drains: 8
                </div>
            </div>
        `;
    }

    handleSubvalleyClick(e) {
        if (!e.features.length) return;
        const feature = e.features[0];
        this.highlightFeature(feature);
        const props = feature.properties;


        const name = props.subvalley || props.valley || props.HYBAS_ID || 'Unknown Sub-valley';

        // Calculate spatial context
        let drainCount = 0;
        let lakeCount = 0;
        if (window.turf) {
            // feature is already a valid GeoJSON feature from MapLibre
            const polygon = feature;
            
            const pDrains = this.map.querySourceFeatures('primary-drains');
            pDrains.forEach(d => { if (turf.booleanIntersects(d, polygon)) drainCount++; });
            
            const sDrains = this.map.querySourceFeatures('secondary-drains');
            sDrains.forEach(d => { if (turf.booleanIntersects(d, polygon)) drainCount++; });

            const lakes = this.map.querySourceFeatures('lakes');
            lakes.forEach(l => { 
                try {
                    const centroid = turf.centroid(l);
                    if (turf.booleanPointInPolygon(centroid, polygon)) lakeCount++; 
                } catch(e) {}
            });
        } else {
            // Fallback mock counts if turf is missing
            drainCount = 45;
            lakeCount = 12;
        }

        this.panelEl.innerHTML = `
            <div class="panel-header" style="background-color: var(--color-panel-secondary);">SUB-VALLEY: ${name}</div>
            <div class="panel-content" style="font-size: 12px; overflow-y: auto; height: calc(100vh - 150px);">
                
                <div style="margin-bottom: 15px;">
                    <strong>Identity</strong><br/>
                    ID: ${props.HYBAS_ID || 'Unknown'}
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">

                <div style="margin-bottom: 15px;">
                    <strong>Infrastructure Stats</strong><br/>
                    Contained Drains: ${drainCount}<br/>
                    Contained Lakes: ${lakeCount}
                </div>
                <hr style="border-color: var(--color-border); margin: 15px 0;">

                <div style="margin-bottom: 15px;">
                    <strong><span class="badge" style="background:var(--color-panel-secondary); color:var(--color-watch);">SIMULATED PREDICTION</span></strong><br/>
                    Active Critical Risks: <span style="color:var(--color-critical); font-weight:bold;">3</span><br/>
                    Active Watch Risks: <span style="color:var(--color-watch); font-weight:bold;">8</span><br/>
                </div>
            </div>
        `;
    }

    refresh() {
        if (!this.activeSelection) return;
        // Re-trigger the panel render with the saved feature to pull fresh simulation data
        const fakeEvent = { features: [this.activeSelection.feature] };
        if (this.activeSelection.type === 'drain') {
            this.handleDrainClick(fakeEvent, this.activeSelection.source);
        } else if (this.activeSelection.type === 'lake') {
            this.handleLakeClick(fakeEvent);
        }
    }
}

