// src/simulation/scenarios.js

// Deterministic ID generator based on modulo math.
// Ensures 15-20% are stressed when mod is around 5 to 7.
// We use large MAX values to safely cover the number of features in each GeoJSON.
function getIds(maxFeatures, modArray) {
    const ids = [];
    for (let i = 0; i < maxFeatures; i++) {
        for (const mod of modArray) {
            if (i % mod === 0) {
                ids.push(i);
                break;
            }
        }
    }
    return ids;
}

const MAX_DRAINS = 5000;
const MAX_LAKES = 500;

export const scenarios = {
    NORMAL: {
        name: "Normal Rain",
        steps: [
            // Step 0: NOW
            { time: 0, label: "NOW", secWatch: [], priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 1: +15 MIN
            { time: 1, label: "+15 MIN", secWatch: [], priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 2: +30 MIN
            { time: 2, label: "+30 MIN", secWatch: [], priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 3: +60 MIN
            { time: 3, label: "+60 MIN", secWatch: [], priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 4: +120 MIN
            { time: 4, label: "+120 MIN", secWatch: [], priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] }
        ]
    },
    HEAVY: {
        name: "Heavy Monsoon",
        steps: [
            // Step 0: NOW - Mostly normal
            { time: 0, label: "NOW", secWatch: [], priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 1: +15 MIN - Select secondary drains turn Amber (mod 7 ~ 14%)
            { time: 1, label: "+15 MIN", secWatch: getIds(MAX_DRAINS, [7]), priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 2: +30 MIN - Connected primary drains turn Amber (mod 6 ~ 16%)
            { time: 2, label: "+30 MIN", secWatch: getIds(MAX_DRAINS, [7]), priWatch: getIds(MAX_DRAINS, [6]), priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 3: +60 MIN - Primary drains turn Critical (mod 6), downstream lake Watch (mod 5 ~ 20%)
            { time: 3, label: "+60 MIN", secWatch: getIds(MAX_DRAINS, [7]), priWatch: [], priCrit: getIds(MAX_DRAINS, [6]), lakeWatch: getIds(MAX_LAKES, [5]), lakeCrit: [] },
            // Step 4: +120 MIN - Downstream lake turns Critical
            { time: 4, label: "+120 MIN", secWatch: getIds(MAX_DRAINS, [7]), priWatch: [], priCrit: getIds(MAX_DRAINS, [6]), lakeWatch: [], lakeCrit: getIds(MAX_LAKES, [5]) }
        ]
    },
    EXTREME: {
        name: "Extreme Storm",
        steps: [
            // Step 0: NOW - Early stress
            { time: 0, label: "NOW", secWatch: getIds(MAX_DRAINS, [12]), priWatch: [], priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 1: +15 MIN - More secondary drains
            { time: 1, label: "+15 MIN", secWatch: getIds(MAX_DRAINS, [5, 7]), priWatch: getIds(MAX_DRAINS, [8]), priCrit: [], lakeWatch: [], lakeCrit: [] },
            // Step 2: +30 MIN - Widespread primary watch
            { time: 2, label: "+30 MIN", secWatch: getIds(MAX_DRAINS, [5, 7]), priWatch: getIds(MAX_DRAINS, [4]), priCrit: getIds(MAX_DRAINS, [8]), lakeWatch: getIds(MAX_LAKES, [6]), lakeCrit: [] },
            // Step 3: +60 MIN - Critical primaries, watch lakes
            { time: 3, label: "+60 MIN", secWatch: getIds(MAX_DRAINS, [5, 7]), priWatch: [], priCrit: getIds(MAX_DRAINS, [4]), lakeWatch: getIds(MAX_LAKES, [3]), lakeCrit: getIds(MAX_LAKES, [6]) },
            // Step 4: +120 MIN - Severe lake criticals
            { time: 4, label: "+120 MIN", secWatch: getIds(MAX_DRAINS, [5, 7]), priWatch: [], priCrit: getIds(MAX_DRAINS, [4]), lakeWatch: [], lakeCrit: getIds(MAX_LAKES, [3]) }
        ]
    }
};
