const fs = require('fs');
let code = fs.readFileSync('./src/services/sensorService.js', 'utf8');

// Update class name
code = code.replace("el.className = 'virtual-sensor-marker';", "el.className = 'virtual-sensor-marker sensor-marker-element';");

// Remove CSS display enforcement from updateSensors
code = code.replace("            // Enforce visibility via CSS to prevent MapLibre conflicts\n            el.style.display = isVisible ? 'block' : 'none';\n", "");

// Remove CSS display enforcement from renderMarkers
code = code.replace("            el.style.display = isVisible ? 'block' : 'none';\n", "");

fs.writeFileSync('./src/services/sensorService.js', code);
