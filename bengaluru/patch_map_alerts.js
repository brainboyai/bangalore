const fs = require('fs');
let code = fs.readFileSync('./src/ui/map.js', 'utf8');

// Add import
code = code.replace(
    "import { SearchManager } from './search.js';",
    "import { SearchManager } from './search.js';\nimport { AlertSystem } from './alerts.js';"
);

// Declare variable
code = code.replace(
    "let searchManager = null;",
    "let searchManager = null;\nlet alertSystem = null;"
);

// Initialize
code = code.replace(
    "searchManager = new SearchManager(map, panels);",
    "searchManager = new SearchManager(map, panels);\n    alertSystem = new AlertSystem(map, panels);"
);

// Update on tick
code = code.replace(
    "if (sensorService) sensorService.updateSensors();",
    "if (sensorService) sensorService.updateSensors();\n        if (alertSystem) alertSystem.updateAlerts();"
);

fs.writeFileSync('./src/ui/map.js', code);
