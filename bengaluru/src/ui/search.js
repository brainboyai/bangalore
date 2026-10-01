// src/ui/search.js

export class SearchManager {
    constructor(map, panelManager) {
        this.map = map;
        this.panelManager = panelManager;
        this.inputEl = document.getElementById('global-search');
        this.bindEvents();
    }

    bindEvents() {
        if (!this.inputEl) return;

        this.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = this.inputEl.value.trim().toLowerCase();
                if (query) {
                    this.performSearch(query);
                }
            }
        });
    }

    performSearch(query) {
        // Query all sources
        const sources = ['primary-drains', 'secondary-drains', 'lakes', 'subbasins'];
        let matchedFeature = null;
        let matchedSource = null;

        for (const source of sources) {
            const features = this.map.querySourceFeatures(source);
            
            for (const f of features) {
                const props = f.properties;
                const searchString = [
                    props['Drain num'], 
                    props['NAME'], 
                    props['name'], 
                    props['bbmp_id'], 
                    props['ward_name'],
                    props['valley']
                ].join(' ').toLowerCase();

                if (searchString.includes(query)) {
                    matchedFeature = f;
                    matchedSource = source;
                    break;
                }
            }
            if (matchedFeature) break;
        }

        if (matchedFeature) {
            // Find centroid for flyTo
            const coords = this.getCentroid(matchedFeature.geometry);
            if (coords) {
                this.map.flyTo({ center: coords, zoom: 14, essential: true });
            }

            // Open Detail Panel
            const mockEvent = { features: [matchedFeature] };
            if (matchedSource === 'primary-drains') {
                this.panelManager.handleDrainClick(mockEvent, 'PRIMARY');
            } else if (matchedSource === 'secondary-drains') {
                this.panelManager.handleDrainClick(mockEvent, 'SECONDARY');
            } else if (matchedSource === 'lakes') {
                this.panelManager.handleLakeClick(mockEvent);
            } else if (matchedSource === 'subbasins') {
                this.panelManager.handleSubvalleyClick(mockEvent);
            }

            this.inputEl.value = ''; // clear
        } else {
            alert('No matching asset found.');
        }
    }

    getCentroid(geometry) {
        if (!geometry || !geometry.coordinates) return null;
        let coords = geometry.coordinates;
        
        while (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            coords = coords[0];
        }

        if (coords.length > 0 && Array.isArray(coords[0])) {
            // Middle point of line/polygon
            const midIndex = Math.floor(coords.length / 2);
            return coords[midIndex];
        } else if (coords.length === 2) {
            return coords; // Point
        }

        return null;
    }
}
