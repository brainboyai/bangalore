const fs = require('fs');
let html = fs.readFileSync('./index.html', 'utf8');

// Remove app-body start
html = html.replace('<div class="app-body" style="display: flex; height: calc(100vh - 60px); width: 100vw; overflow: hidden;">', '');

// Restore left nav
html = html.replace(/<nav class="left-nav" style="[^"]*">/, '<nav class="left-nav">');

// Restore center map container
html = html.replace(/<main class="center-map-container" style="[^"]*">/, '<main class="center-map-container">');

// Remove alerts drawer
html = html.replace(/<!-- Alerts Drawer \(Slides over the map\) -->[\s\S]*?<div class="alerts-list" id="alerts-list"[^>]*><\/div>\s*<\/div>/, '');

// Restore map div
html = html.replace(/<div id="map" style="[^"]*"><\/div>/, '<div id="map"></div>');

// Add sensor toggle back
html = html.replace(
    '<label style="display: block; margin-bottom: 8px;"><input type="checkbox" id="toggle-primary-drains" checked> Primary Drains</label>',
    '<label style="display: block; margin-bottom: 8px;"><input type="checkbox" id="toggle-primary-drains" checked> Primary Drains</label>\n                <label style="display: block;"><input type="checkbox" id="toggle-sensors" checked> Sensor Network</label>'
);

// Restore right panel
html = html.replace(/<aside class="right-panel" id="detail-panel" style="[^"]*">/, '<aside class="right-panel" id="detail-panel">');

// Remove app-body end
html = html.replace(/<\/aside>\s*<\/div>\s*<!-- Bottom Timeline Bar -->/, '</aside>\n\n    <!-- Bottom Timeline Bar -->');

fs.writeFileSync('./index.html', html);
