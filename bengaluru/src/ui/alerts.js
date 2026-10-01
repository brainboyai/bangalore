export class AlertSystem {
    constructor(map, panels, notificationService) {
        this.map = map;
        this.panels = panels;
        this.notificationService = notificationService;
        this.alertsList = document.getElementById('alerts-list');
        this.trackingList = document.getElementById('tracking-list');
        this.generatedAlerts = new Map();
        
        this.lifecycle = [
            { status: 'NEW', action: 'Acknowledge' },
            { status: 'ACKNOWLEDGED', action: 'Escalate' },
            { status: 'ESCALATED', action: 'Dispatch' },
            { status: 'DISPATCHED', action: 'Resolve' }
        ];
        this.activeTab = 'CRITICAL';
        this.kpi = { critDrains: 0, watchDrains: 0, critLakes: 0, activeAlerts: 0 };
        this.dict = {};
        this.loadDictionary();
        this.setupModal();
    }

    setupModal() {
        this.modal = document.getElementById('alert-modal');
        this.modalTitle = document.getElementById('alert-modal-title');
        this.modalDesc = document.getElementById('alert-modal-desc');
        this.modalOk = document.getElementById('alert-modal-ok');
        
        this.modalOk.addEventListener('click', () => {
            this.modal.style.display = 'none';
            if (this.pendingUpdateCallback) this.pendingUpdateCallback();
        });
        document.getElementById('alert-modal-cancel').addEventListener('click', () => {
            this.modal.style.display = 'none';
            this.pendingUpdateCallback = null;
        });
    }

    async loadDictionary() {
        const sources = ['primary-drains', 'secondary-drains', 'lakes'];
        for (const s of sources) {
            try {
                const sourceDef = this.map.getSource(s);
                if (!sourceDef) continue;
                let data = sourceDef._data || (sourceDef._options && sourceDef._options.data);
                if (typeof data === 'string') data = await (await fetch(data)).json();
                if (data && data.features) this.dict[s] = data.features;
            } catch(e) {}
        }
    }

    getFeature(rawId, sourceName) {
        return this.dict[sourceName] ? this.dict[sourceName][rawId] : null;
    }

    setTab(tabName) {
        this.activeTab = tabName;
        document.getElementById('tab-critical').style.background = tabName === 'CRITICAL' ? '#1B2D44' : 'transparent';
        document.getElementById('tab-watch').style.background = tabName === 'WATCH' ? '#1B2D44' : 'transparent';
        this.renderLists();
    }

    updateAlerts(state) {
        if (!state || !state.drainStates || !state.lakeStates || !this.dict['primary-drains']) return;

        const cDrains = new Set(), wDrains = new Set(), cLakes = new Set(), wLakes = new Set();
        const currentActiveIds = new Set();

        const process = (ids, type, risk, source, trackingSet) => {
            if (!ids || !Array.isArray(ids)) return;
            ids.forEach(rawId => {
                const feature = this.getFeature(rawId, source);
                if (!feature) return;
                const props = feature.properties || {};
                
                const realId = props['Drain num'] || props['NAME'] || props['BBMP ID'] || props.BBMP_ID || props.Lake_Name || props.ID || props.id || props.bbmp_id || props.fid;
                if (!realId || String(realId).toLowerCase().includes('unknown') || String(realId).toLowerCase() === 'null') return;
                
                trackingSet.add(realId);
                currentActiveIds.add(realId);

                if (!this.generatedAlerts.has(realId)) {
                    this.generatedAlerts.set(realId, {
                        id: realId,
                        name: props.Name || props.NAME || props.Lake_Name || props.name || '',
                        rawId: rawId, // Raw integer MapLibre ID
                        geom: feature.geometry,
                        type: type,
                        source: source,
                        statusIndex: 0,
                        risk: risk,
                        timeStr: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    });
                } else {
                    const existing = this.generatedAlerts.get(realId);
                    if (existing.risk !== risk && existing.statusIndex === 0) {
                        existing.risk = risk;
                    }
                }
            });
        };

        process(state.drainStates.primary.critical, 'Primary Drain', 'CRITICAL', 'primary-drains', cDrains);
        process(state.drainStates.secondary.critical, 'Secondary Drain', 'CRITICAL', 'secondary-drains', cDrains);
        process(state.lakeStates.critical, 'Lake', 'CRITICAL', 'lakes', cLakes);
        process(state.drainStates.primary.watch, 'Primary Drain', 'WATCH', 'primary-drains', wDrains);
        process(state.drainStates.secondary.watch, 'Secondary Drain', 'WATCH', 'secondary-drains', wDrains);
        process(state.lakeStates.watch, 'Lake', 'WATCH', 'lakes', wLakes);

        for (const id of this.generatedAlerts.keys()) {
            if (!currentActiveIds.has(id) && this.generatedAlerts.get(id).statusIndex === 0) {
                this.generatedAlerts.delete(id);
            }
        }

        cDrains.forEach(id => wDrains.delete(id));
        cLakes.forEach(id => wLakes.delete(id));

        this.kpi.critDrains = cDrains.size;
        this.kpi.watchDrains = wDrains.size;
        this.kpi.critLakes = cLakes.size;
        this.renderLists();
    }

    renderLists() {
        if (!this.alertsList || !this.trackingList) return;
        
        const allAlerts = Array.from(this.generatedAlerts.values());
        const newAlerts = allAlerts.filter(a => a.statusIndex === 0);
        const trackedAlerts = allAlerts.filter(a => a.statusIndex > 0 && a.statusIndex < 4);
        
        this.kpi.activeAlerts = newAlerts.length;
        
        const cCount = newAlerts.filter(a => a.risk === 'CRITICAL').length;
        const wCount = newAlerts.filter(a => a.risk === 'WATCH').length;
        const critTab = document.getElementById('tab-critical');
        const watchTab = document.getElementById('tab-watch');
        if(critTab) critTab.textContent = `CRITICAL (${cCount})`;
        if(watchTab) watchTab.textContent = `WATCH (${wCount})`;

        const renderCard = (alert, container) => {
            const stateObj = this.lifecycle[alert.statusIndex];
            const isCritical = alert.risk === 'CRITICAL';
            const color = isCritical ? '#FF4444' : '#FFAA00';
            const card = document.createElement('div');
            card.style.cssText = `background: #07111F; border: 1px solid ${alert.statusIndex === 0 ? color : '#1B2D44'}; border-left: 3px solid ${color}; border-radius: 4px; padding: 12px; cursor: pointer; margin-bottom: 12px;`;
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6px;">
                    <div style="font-size: 13px; font-weight: bold; color: ${color};">${isCritical ? '🔴' : '🟠'} ${alert.type} ${alert.risk}</div>
                    <div style="font-size: 10px; color: #8EA2B8;">${alert.timeStr}</div>
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #E7EEF7; margin-bottom: 2px;">ID: ${alert.id}</div>
                <div style="font-size: 11px; color: #8EA2B8; margin-bottom: 10px;">Routing: ${isCritical ? 'ICCC Duty Officer' : 'West SWD Control'}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px dashed #1B2D44; padding-top: 8px;">
                    <span class="status-badge" style="font-size: 10px; padding: 4px 8px; border-radius: 12px; background: ${alert.statusIndex === 0 ? '#1B2D44' : '#003366'}; color: ${alert.statusIndex === 0 ? '#8EA2B8' : '#00FFFF'}; font-weight: bold;">STATUS: ${stateObj.status}</span>
                    <span class="update-btn" style="font-size: 10px; color: #00BFFF; padding: 4px 8px; background: #1B2D44; border-radius: 4px; border: 1px solid #00BFFF;">${stateObj.action} &rarr;</span>
                </div>
            `;
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.update-btn')) return;
                
                if (alert.geom && alert.geom.coordinates) {
                    let coords = alert.geom.coordinates;
                    while(Array.isArray(coords[0])) coords = coords[0];
                    this.map.flyTo({ center: coords, zoom: 15 });
                    
                    // CRITICAL FIX: Cast alert.rawId as a strict Number so the panel includes() check works flawlessly
                    const fakeFeature = { properties: this.getFeature(alert.rawId, alert.source).properties, id: Number(alert.rawId) };
                    if (alert.source.includes('drain')) this.panels.handleDrainClick({features: [fakeFeature]}, alert.source);
                    else if (alert.source === 'lakes') this.panels.handleLakeClick({features: [fakeFeature]});
                }
            });

            card.querySelector('.update-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const routing = isCritical ? 'ICCC Duty Officer' : 'West SWD Control';
                let title = '', msg = '', btn = '';
                
                if (stateObj.status === 'NEW') {
                    title = 'Simulated Acknowledgement';
                    msg = `Queued WhatsApp to ${routing}: Alert ${alert.id} Acknowledged. Incident moved to Tracking.`;
                    btn = 'Acknowledge';
                } else if (stateObj.status === 'ACKNOWLEDGED') {
                    title = 'Simulated Escalation';
                    msg = `Queued ICCC Webhook: Incident ${alert.id} Escalated.`;
                    btn = 'Escalate';
                } else if (stateObj.status === 'ESCALATED') {
                    title = 'Simulated Dispatch';
                    msg = `Queued SMS to Field Team Alpha: Deploying to ${alert.id}.`;
                    btn = 'Dispatch';
                } else if (stateObj.status === 'DISPATCHED') {
                    title = 'Simulated Resolution';
                    msg = `Incident ${alert.id} Resolved and closed.`;
                    btn = 'Confirm Resolution & Close';
                }

                this.modalTitle.textContent = title;
                this.modalDesc.textContent = msg;
                this.modalOk.textContent = btn;
                this.modal.style.display = 'flex';
                console.log(msg);
                
                this.pendingUpdateCallback = () => {
                    alert.statusIndex++;
                    if (alert.statusIndex >= 4) this.generatedAlerts.delete(alert.id);
                    this.renderLists();
                };
            });
            container.appendChild(card);
        };

        this.alertsList.innerHTML = '';
        const viewAlerts = newAlerts.filter(a => a.risk === this.activeTab).reverse();
        if (viewAlerts.length === 0) this.alertsList.innerHTML = `<div style="color:#8EA2B8; font-size:12px; text-align:center; margin-top:20px;">No new alerts.</div>`;
        else viewAlerts.forEach(a => renderCard(a, this.alertsList));

        this.trackingList.innerHTML = '';
        if (trackedAlerts.length === 0) this.trackingList.innerHTML = `<div style="color:#8EA2B8; font-size:12px; text-align:center; margin-top:20px;">No active tracking.</div>`;
        else trackedAlerts.reverse().forEach(a => renderCard(a, this.trackingList));
        
        this.updateBadges();
    }

    updateBadges() {
        const setBadge = (navId, count) => {
            const navEl = document.getElementById(navId);
            if (!navEl) return;
            let badge = navEl.querySelector('.alert-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'alert-badge';
                navEl.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.cssText = `position: absolute; top: 8px; right: 8px; background: #FF4444; color: white; border-radius: 50%; padding: 2px 6px; font-size: 10px; font-weight: bold; pointer-events: none; display: ${count > 0 ? 'inline-block' : 'none'};`;
            if (count > 0) badge.classList.add('badge-breathe');
            else badge.classList.remove('badge-breathe');
        };
        
        setBadge('nav-alerts', this.kpi.activeAlerts);
        setBadge('nav-tracking', Array.from(this.generatedAlerts.values()).filter(a => a.statusIndex > 0 && a.statusIndex < 4).length);
    }
}
