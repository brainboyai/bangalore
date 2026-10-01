const fs = require('fs');
let code = fs.readFileSync('./src/ui/map.js', 'utf8');

const oldLogic = `    const sensorToggle = document.getElementById('toggle-sensors');
    if (sensorToggle) {
        sensorToggle.addEventListener('change', (e) => {
            if (sensorService) {
                sensorService.toggleVisibility(e.target.checked);
            }
        });
    }`;

const newLogic = `    const sensorToggle = document.getElementById('toggle-sensors'); // Use the exact ID of your sensor checkbox
    if (sensorToggle) {
        sensorToggle.addEventListener('change', (e) => {
            const displayState = e.target.checked ? '' : 'none';
            document.querySelectorAll('.sensor-marker-element').forEach(marker => {
                marker.style.display = displayState;
            });
        });
    }`;

if (code.includes(oldLogic)) {
    code = code.replace(oldLogic, newLogic);
} else {
    console.log("Could not find old logic in map.js to replace!");
}

fs.writeFileSync('./src/ui/map.js', code);
