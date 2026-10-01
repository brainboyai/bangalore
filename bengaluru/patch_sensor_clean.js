const fs = require('fs');
let code = fs.readFileSync('./src/services/sensorService.js', 'utf8');

const regex = /toggleVisibility\(isVisible\)\s*\{[\s\S]*?\}/;
if (regex.test(code)) {
    code = code.replace(regex, "");
    fs.writeFileSync('./src/services/sensorService.js', code);
}
