Yes. I would now **stop expanding the data model** and give the coding agent a very controlled build brief.

The key architectural decision is:

> **Keep the four real GIS layers as the permanent foundation. Build a separate simulation/state layer on top of them. Never modify the source GeoJSONs.**

That gives you a sophisticated prototype now without locking you into synthetic data later.

Here is the instruction set I would give Antigravity.

# Bengaluru Storm-Water Flood Intelligence

## Antigravity Build Specification — Government Demonstration Prototype

### 1. Product objective

Transform the current MapLibre-based Bengaluru drainage map into a **high-end administrative storm-water command console**.

The application must look and behave like a serious Government/ICCC operational system, not like a GIS viewer.

The four current real GIS layers are:

1. Primary Drains
2. Secondary Drains
3. Existing Lakes
4. Sub-valleys

These are the only mandatory GIS layers for this version.

Do NOT add DEM, basins, stream order, typology, weather APIs, CCTV, sewerage, or new hardware yet.

The application must be architected so those can be added later without redesigning the core UI.

---

# 2. Core product story

The application should visually communicate this chain:

**Rainfall / storm scenario → drainage network stress → lake/storage stress → predicted risk → alert → administrative response**

The prototype is NOT claiming that the prediction is trained on real Government data.

All simulated values must be visibly labelled:

> **SIMULATED / DEMONSTRATION DATA**

The real GIS geometry remains genuine source data.

The goal of the demo is to show authorities:

> “This is how the Government's existing drainage GIS and future sensor/forecast feeds would work together inside an operational flood-management console.”

---

# 3. Most important architectural rule

Separate the application into three layers.

## Layer A — Real GIS foundation

Read-only:

```text
Primary Drains GeoJSON
Secondary Drains GeoJSON
Existing Lakes GeoJSON
Sub-valleys GeoJSON
```

Never modify these files.

Do not write simulated values back into the GeoJSON.

---

## Layer B — Simulation / state layer

Create a separate in-memory or JSON-backed state model.

Example:

```text
AssetState
{
  assetId,
  assetType,
  riskState,
  currentWaterLevel,
  waterLevelPercent,
  rateOfRise,
  rainfallNow,
  forecastRainfall,
  predictedBreachMinutes,
  confidence,
  sensorStatus,
  simulatedAt
}
```

This layer is temporary.

Later it will be replaced by:

```text
KSNDMC API
Government sensor API
Forecast API
```

without changing the frontend.

---

## Layer C — Presentation / Admin UI

The UI only consumes:

```text
GIS assets
+
current state
+
prediction state
+
alert state
```

The UI must not contain the prediction logic itself.

---

# 4. Overall visual direction

The visual style should be:

**Modern ICCC / command-centre / infrastructure-control-room**

Not:

* consumer weather app
* generic dashboard
* gaming UI
* flashy “AI” website
* excessive glassmorphism

Use a dark navy operational theme with restrained use of colour.

Suggested palette:

```text
Background       #07111F
Panel            #0B1728
Panel secondary  #0F1D31
Borders          #1B2D44
Text             #E7EEF7
Muted text       #8EA2B8

Normal           #35C48A
Watch            #F4B740
Critical         #FF5F5F
Information      #2EA3FF
Lake normal      #167CB5
```

Use colour primarily for **state**, not decoration.

---

# 5. Application shell

Build a full-screen application.

### Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ TOP COMMAND BAR                                              │
├────────────┬───────────────────────────────────────┬─────────┤
│            │                                       │         │
│ LEFT       │                                       │ RIGHT   │
│ NAV        │              CITY MAP                 │ DETAIL  │
│            │                                       │ PANEL   │
│            │                                       │         │
│            │                                       │         │
├────────────┴───────────────────────────────────────┴─────────┤
│ BOTTOM FORECAST / ALERT / TIMELINE BAR                       │
└──────────────────────────────────────────────────────────────┘
```

The map must remain the dominant visual element.

---

# 6. Top command bar

Left:

### Bengaluru Storm-Water Flood Intelligence

Subheading:

> ADMIN COMMAND CENTRE

Centre/right:

```text
MONSOON MODE
● SYSTEM ONLINE
Last data sync: 22:15
```

Controls:

### MODE

```text
LIVE
SIMULATION
```

Default to:

**SIMULATION**

Clearly display:

> SIMULATION MODE — DATA IS DEMONSTRATIVE

Also show:

```text
Forecast refresh: 5 min
Sensor refresh: 1 min
```

These are UI placeholders, not actual live feeds.

---

# 7. Left navigation

Keep navigation minimal.

### Overview

Main city map.

### Risk Map

Focus all visualisation on current/predicted risk.

### Alerts

Active alerts and escalation.

### Network

Drain/lake asset exploration.

### Replay

Historical/simulated storm timeline.

### Administration

Thresholds, display settings and notification routing.

Do not build complex screens behind every nav item yet.

For the prototype, each must have a meaningful visual state, even if some are lightweight.

---

# 8. Main map

Use the current MapLibre GL JS architecture.

Do not migrate to Google Maps.

Keep CartoDB Positron unless the current basemap needs refinement.

The map must contain these layers in this order:

```text
BASEMAP

SUB-VALLEYS
    ↓
LAKES
    ↓
SECONDARY DRAINS
    ↓
PRIMARY DRAINS
    ↓
SENSOR MARKERS
    ↓
ALERT MARKERS
```

---

# 9. Sub-valleys

Current design:

light green polygon.

Keep this, but make it more sophisticated.

Normal state:

```text
Fill: low-opacity green
Border: subtle dashed line
```

When selected:

* brighten border
* slightly increase opacity
* show sub-valley name
* show number of active risks inside it

Example:

> VV_2
> 3 Critical
> 7 Watch

Do not change sub-valley colour based on simulated risk.

Risk should be represented primarily by the drains/lakes.

---

# 10. Primary drains

Primary drains are the most visually important network objects.

Normal:

```text
Dark blue
3–4 px
```

Watch:

```text
Amber
4 px
```

Critical:

```text
Red
5 px
```

Selected:

```text
White highlight
6–7 px
```

Do not make all drain lines glow or pulse.

Only Critical segments should receive a subtle animated/pulsing effect.

---

# 11. Secondary drains

Secondary drains should always visually sit below primary drains.

Normal:

```text
Light blue
1.5–2 px
```

Watch:

```text
Muted amber
2.5 px
```

Critical:

```text
Red
3 px
```

However:

### Do not visually overwhelm the primary network.

The user should be able to immediately understand:

> Primary = major drainage corridor
> Secondary = feeder network

---

# 12. Lakes must have three operational states

Yes — I agree with your idea.

Lakes should not always remain blue during simulation mode.

Use three states:

## NORMAL

Blue:

```text
#167CB5
```

Subtle blue outline.

Display:

> Storage condition: NORMAL

---

## WATCH

Amber treatment.

Do not completely remove the identity of the lake.

Use:

```text
Amber outline
Very light amber transparency
Blue still visible underneath
```

Display:

> WATCH
> Inflow increasing

---

## CRITICAL

Red treatment.

Use:

```text
Red outline
Soft red translucent overlay
Very subtle outer glow
```

Display:

> CRITICAL
> Overflow risk

The lake should never look like a red road polygon.

Preserve the visual identity of water.

---

# 13. Very important lake logic

For the current mock, lake state should be driven by the simulation layer.

Do not claim this is actual lake storage unless the real lake-level data exists.

Use concepts such as:

```text
Storage condition
Inflow stress
Overflow risk
```

rather than pretending to know exact Government lake levels.

Example:

```text
LAKE X

NORMAL
Storage stress: 42%
Inflow trend: Stable
```

or:

```text
LAKE X

WATCH
Storage stress: 76%
Inflow trend: Rising
```

or:

```text
LAKE X

CRITICAL
Storage stress: 93%
Overflow risk: High
```

---

# 14. City KPI strip

Floating over the map in the upper-left.

Show 5–6 key metrics:

```text
CRITICAL DRAINS
12

WATCH DRAINS
27

LAKES AT RISK
4

PREDICTED HOTSPOTS
9

ACTIVE ALERTS
8

SENSORS ONLINE
94%
```

The values are simulated.

The cards must update when the simulation scenario changes.

Clicking a KPI should filter/focus the map.

Example:

Click:

> Critical Drains 12

→ map zooms/highlights all critical primary/secondary drains.

---

# 15. Map legend

Small and always visible.

```text
DRAIN STATUS

● NORMAL
● WATCH
● CRITICAL

LAKE STATUS

● NORMAL
● WATCH
● CRITICAL
```

Also:

```text
● SENSOR
▲ ALERT
```

Do not use excessively many colours.

---

# 16. Weather / storm scenario widget

The user needs to immediately understand why the network is changing.

Place a compact floating card on the map.

Example:

```text
CURRENT STORM

Rainfall
48 mm/hr

Forecast +30 min
62 mm/hr

Forecast +60 min
74 mm/hr

Trend
↑ Intensifying

Storm severity
HEAVY
```

This is simulated.

Make the information visual rather than a paragraph.

---

# 17. Simulation control

Create a compact bottom-left simulation toolbar.

Controls:

```text
Scenario:
[ Normal Rain ▼ ]

[▶ Play] [⏸ Pause] [↺ Reset]

Timeline:
00:00 ───────●──────── 02:00
```

Scenarios:

### Normal Rain

Low network stress.

### Heavy Monsoon

Some drains become Watch.

### Extreme Storm

A chain of drains becomes Critical and some lakes transition to Watch/Critical.

### Custom

Later, allow rainfall intensity adjustment.

For now, Custom can be disabled.

---

# 18. Simulation must be deterministic

Do NOT use uncontrolled random numbers.

The same scenario must produce the same result every time.

For example:

```text
Storm = HEAVY_MONSOON

T+00
normal

T+15
selected secondary drains → watch

T+30
primary drain group → watch

T+45
primary drain group → critical

T+60
nearby lake → watch
```

This ensures the Government demonstration is repeatable.

---

# 19. Do NOT make every drain change colour

This is very important.

Only a subset of drains should become stressed.

The city map must retain enough normal infrastructure to make the risk areas visually obvious.

Ideal appearance:

```text
mostly blue network

with a few

amber corridors

and a few

red critical corridors
```

This creates hierarchy.

---

# 20. Selected drain interaction

When an administrator clicks a primary or secondary drain:

Open the right-hand detail panel.

Example:

```text
PRIMARY DRAIN

RN181

Vrishabhavathi Valley
Ward: XX
Length: 614 m

─────────────────────

CURRENT CONDITION

Water level
82%

Rate of rise
+3.8 cm/min

Sensor
HEALTHY

─────────────────────

WEATHER

Rain now
48 mm/hr

Next 60 min
72 mm

─────────────────────

PREDICTION

Risk
CRITICAL

Threshold breach
24 min

Model confidence
94%

─────────────────────

WHY?

• Water level already elevated
• Rate of rise increasing
• Forecast rainfall increasing
• Network stress detected

─────────────────────

ACTION

Notify SWD control
Inspect downstream
Prepare field team
```

Every simulated prediction must be explicitly labelled:

> SIMULATED PREDICTION

until real model data exists.

---

# 21. Right-hand panel hierarchy

The right panel is the most important UI element after the map.

Use this sequence:

### Identity

What asset did I click?

### Current state

What is happening now?

### Forecast

What is expected?

### Prediction

What happens next?

### Explanation

Why does the system think this?

### Action

What should I do?

That is the core Government workflow.

---

# 22. Drain trend chart

Include a small, sophisticated chart.

Not a giant chart.

Example:

```text
WATER LEVEL

100% ┤                 ╭──── CRITICAL
 80% ┤          ╭──────╯
 60% ┤     ╭────╯
 40% ┤─────╯
 20% ┤
     └─────────────────────
      -60 -45 -30 -15 NOW +15 +30
```

Show:

* observed/simulated history
* current value
* projected future trend
* warning threshold
* critical threshold

The chart should visually show:

> “The line is heading toward the threshold.”

This will probably communicate the product better than a numerical probability alone.

---

# 23. Prediction explanation

Do NOT show:

> AI Score = 93

That's meaningless to an officer.

Show:

```text
RISK DRIVERS

████████████  High water level
██████████    Rapid rise
████████      Heavy forecast
██████        Upstream stress
████          Historical tendency
```

For the mock, these are explanatory UI placeholders.

Later they can be generated from actual model feature importance / SHAP / rule logic.

---

# 24. Alert centre

The bottom-right area or dedicated Alerts view should show:

```text
ACTIVE ALERTS

🔴 CRITICAL
RN181
Threshold breach in 24 min
West SWD Control
2 min ago

🟠 WATCH
BP114
Rising rapidly
North SWD Control
6 min ago

🔴 CRITICAL
Lake X
Overflow risk
ICCC Duty Officer
9 min ago
```

Clicking an alert must focus the map on the relevant asset.

---

# 25. Alert workflow

Every alert should have a status:

```text
NEW
ACKNOWLEDGED
ESCALATED
DISPATCHED
RESOLVED
```

Simulate the lifecycle.

Example:

```text
17:02 Alert created
17:03 Officer notified
17:05 Acknowledged
17:08 Escalated
17:12 Field team assigned
17:38 Resolved
```

Do not actually send WhatsApp messages yet.

Create a simulated notification adapter.

---

# 26. Notification architecture

Create a service abstraction:

```text
NotificationService
```

with:

```text
sendWhatsApp()
sendSMS()
sendEmail()
sendICCCWebhook()
```

For this prototype each function should only simulate sending and log:

```text
Notification queued
Recipient: West SWD Control
Channel: WhatsApp
Time: 17:03
Status: SIMULATED
```

This lets us later connect real providers without changing alert logic.

---

# 27. Personnel administration

Create a small personnel dataset in code/config, not a database yet.

Example:

```text
West SWD Control
North SWD Control
South SWD Control
East SWD Control
ICCC Duty Officer
Disaster Management Officer
```

Each alert is mapped to a responsible role based on:

```text
corporation / ward / configured zone
```

Do not attempt precise Government responsibility mapping unless it has been provided.

Call it:

> DEMO RESPONSE ROUTING

---

# 28. Network interaction

When clicking a primary drain, provide:

```text
Nearby secondary drains
Nearby lakes
Sub-valley
Ward
```

Do not claim:

> “This secondary drain definitely flows into this lake”

unless the relationship is actually established in the source data.

For now use language:

> NEARBY NETWORK

or

> SPATIAL CONTEXT

This protects the prototype from making an unsupported hydraulic claim.

---

# 29. Lake detail panel

When clicking a lake:

```text
LAKE / TANK

Lake Name
BBMP ID
Area

CURRENT STATUS
WATCH

Storage stress
76%

Inflow condition
RISING

Overflow risk
18 min

Nearby primary drains
4

Nearby secondary drains
11

Sub-valley
VV_2
```

Again:

> SIMULATED CONDITION

unless a real value exists.

---

# 30. Sub-valley drill-down

Clicking a sub-valley should produce an overview:

```text
SUB-VALLEY VV_2

Primary drains
17

Secondary drains
93

Critical
3

Watch
8

Lakes at risk
1

Active alerts
4
```

The map should visually isolate that sub-valley.

This gives officers a hierarchy:

**City → Sub-valley → Asset → Sensor/Alert**

---

# 31. Search

Add a top search bar:

```text
Search drain / lake / ward
```

Search:

* Drain num
* Lake name
* BBMP ID
* Ward name
* Corporation

Click result → zoom to asset → open detail.

This is important for an admin application.

---

# 32. Layer control

Retain your existing layer toggle mechanism, but improve it.

Group layers:

### HYDROLOGY

☑ Lakes
☑ Primary Drains
☑ Secondary Drains
☑ Sub-valleys

### OPERATIONS

☑ Sensors
☑ Alerts
☑ Risk highlighting

The operations layers should be separate from the source GIS.

---

# 33. Add a “Risk View” toggle

This is a very strong UI feature.

```text
MAP MODE

[ INFRASTRUCTURE ]
[ RISK ]
[ FORECAST ]
```

### Infrastructure

Shows the clean GIS.

### Risk

Colours assets according to simulated/current risk.

### Forecast

Shows how risk is expected to evolve.

This lets you demonstrate that the same GIS can serve multiple operational purposes.

---

# 34. Add time-based prediction

Use a small timeline:

```text
NOW
+
15 MIN
+
30 MIN
+
60 MIN
+
120 MIN
```

The administrator can click:

> +60 MIN

and the map changes to show the **predicted future state**.

This is perhaps the most important visual feature in the entire prototype.

The officer should be able to see:

### NOW

mostly normal.

### +30

some amber.

### +60

specific red corridors and lakes.

That communicates the predictive concept immediately.

---

# 35. City-level summary panel

Make the top of the right side optionally switch to:

```text
BENGALURU OVERVIEW

Storm intensity
HEAVY

Critical drains
12

Watch drains
27

Lakes at risk
4

Predicted hotspots
9

Earliest threshold breach
18 min

Highest-risk valley
[Valley Name]
```

Do not call the valley “highest risk” based on a real claim. For the simulator it can simply be:

> Highest simulated risk

or:

> Current demo highest risk

---

# 36. Historical Replay

Build a lightweight replay interface.

Example:

```text
STORM REPLAY

Scenario:
Extreme Monsoon Event

Start
14:00

Peak
16:30

End
19:00

[◀] [PLAY] [▶]

Timeline
14:00 ─────●──────── 19:00
```

As the timeline moves:

* drains change state
* lakes change state
* alerts appear
* sensor cards update

This will be extremely useful later when real historical KSNDMC data arrives.

---

# 37. Data-source badge

Every major simulated panel should have a tiny data-source indicator.

Example:

```text
SOURCE
SIMULATED SENSOR FEED
```

or later:

```text
SOURCE
KSNDMC TELEMETRY
```

Likewise:

```text
FORECAST SOURCE
DEMO FORECAST
```

This design makes the transition from synthetic → Government data transparent.

---

# 38. Do not make the app look “finished with fake AI”

Avoid claims such as:

> 94% accurate

> AI confirms flood

> Government sensor online

> Real-time Bengaluru status

unless the data actually exists.

For now use:

> Simulated prediction

> Demonstration sensor

> Demo forecast

> Prototype alert

The credibility of the Government demo is more important than making the prototype appear falsely real.

---

# 39. Code architecture

Refactor the current single-file implementation gradually.

Recommended structure:

```text
/src
  /data
    primary-drains.geojson
    secondary-drains.geojson
    lakes.geojson
    subvalleys.geojson

  /simulation
    scenarios.js
    simulator.js
    state.js
    transitions.js

  /services
    gisService.js
    sensorService.js
    forecastService.js
    predictionService.js
    alertService.js
    notificationService.js

  /ui
    map.js
    sidebar.js
    topbar.js
    drainPanel.js
    lakePanel.js
    alertPanel.js
    timeline.js
    charts.js

  /styles
    app.css

  index.html
```

If the current project is intentionally single-file for speed, do not rewrite everything at once.

First get the visual/functional prototype working, then modularise.

---

# 40. Simulation interface

Create a clean interface between the simulator and application.

For example:

```javascript
simulator.getCurrentState()
```

returns:

```javascript
{
  timestamp,
  stormScenario,
  rainfall,
  forecast,
  drainStates,
  lakeStates,
  alerts
}
```

Then the UI doesn't care where the state came from.

Later:

```javascript
governmentDataService.getCurrentState()
```

can return the same structure.

This is the most important architectural abstraction in the project.

---

# 41. Synthetic prediction logic for the prototype

Do not build ML yet.

Use a deterministic rule/state engine.

Conceptually:

```text
Scenario intensity
       +
simulated sensor level
       +
rate of rise
       +
forecast severity
       ↓
SIMULATED RISK STATE
```

For example:

```text
Normal
→ Watch
→ Critical
```

This is only to animate the UI.

Do not call it a trained model.

Later:

```text
MLPredictionService
```

can replace the simulation engine.

The UI should remain unchanged.

---

# 42. Sensor representation

Do not display hundreds of fake sensor dots.

Use a selective set.

For example:

```text
20–40 virtual sensors
```

distributed across representative primary/secondary drains.

Markers should be subtle.

Normal:

green dot

Warning:

amber dot

Critical:

red dot

Offline:

grey dot

Clicking one opens:

```text
Sensor WLS-018
Drain RN181
Water level 82%
Rate +3.8 cm/min
Last seen 22:15
Status HEALTHY
```

Clearly marked:

> SIMULATED SENSOR

---

# 43. Important visual behaviour

When a drain becomes Critical:

Do NOT simply change the line to red.

Also:

1. show small alert marker near it
2. increment Critical KPI
3. create an alert
4. show the drain in Alerts
5. update its right-side panel if selected
6. highlight the relevant sub-valley
7. if the scenario causes lake stress, update nearby lake state
8. show the event in the timeline

This creates the feeling that the system is an integrated operating platform.

---

# 44. Cross-layer interaction

The four GIS layers should feel connected.

For example:

### Select Sub-valley

→ highlight all drains + lakes in it.

### Select Lake

→ highlight nearby primary/secondary drainage network spatially.

### Select Primary Drain

→ show nearby secondary drains.

### Select Secondary Drain

→ show its associated primary drain if the source data contains that relationship.

This is especially important because your secondary-drain dataset has source relationship information that can support a meaningful primary/secondary relationship.

Do not invent relationships that are not in the source.

---

# 45. Performance requirements

The city map must remain smooth.

Use:

* GeoJSON sources loaded once
* vector rendering through MapLibre
* no DOM markers for every drain
* map layers for line/polygon rendering
* DOM overlays only for selected details / KPIs
* debounced search
* minimal re-rendering
* no expensive recomputation every animation frame

Simulation updates should happen perhaps every:

```text 1–2 seconds
```

during the visual demo.

There is no need for sub-second updates.

---

# 46. Responsive behaviour

Primary target:

### 1920 × 1080 desktop monitor

because this is the likely Government/ICCC demonstration format.

Also support:

1366 × 768.

Mobile responsiveness is not a priority in this version.

---

# 47. Government-demo polish

Add subtle details that make the application feel operational:

```text
DATA HEALTH: GOOD
FORECAST SYNC: 22:15
TELEMETRY SYNC: 22:15
ACTIVE INCIDENTS: 8
```

Use tiny timestamps throughout.

Every alert should show:

> 2 min ago

rather than only an absolute timestamp.

Use tooltips and hover states sparingly.

---

# 48. What the initial screen should communicate in 5 seconds

When the app opens, the officer should immediately understand:

### 1.

This is Bengaluru.

### 2.

These are the drainage networks.

### 3.

These are the lakes.

### 4.

Some locations are under risk.

### 5.

The system can show where risk is emerging.

### 6.

The system can tell me when.

### 7.

The system can tell me what action to take.

If those seven things are visually obvious, the prototype succeeds.

---

# 49. The demonstration story

Build one deterministic demonstration scenario around this story:

```text
START
Normal conditions

        ↓

Heavy rainfall forecast appears

        ↓

Secondary drains begin showing increased stress

        ↓

Primary drains transition to WATCH

        ↓

Water level rises

        ↓

Primary drain becomes CRITICAL

        ↓

Prediction:
threshold in 24 minutes

        ↓

Alert generated

        ↓

Assigned officer notified

        ↓

Nearby lake transitions to WATCH

        ↓

Lake becomes CRITICAL

        ↓

City overview shows cascading risk
```

This gives the Government officer an intuitive visual narrative.

---

# 50. Do not simulate physical water everywhere

This is a hard scope boundary.

Do NOT attempt:

* fluid animation along every drain
* physically accurate water propagation
* hydraulic solver
* rainfall-runoff equations
* lake hydrodynamics
* DEM flow routing
* exact flood-depth modelling

The prototype is demonstrating:

> **operational intelligence over the existing drainage network**

not engineering-grade flood hydraulics.

---

# 51. What we are preparing for later

The application architecture must leave clean interfaces for:

```text
REAL WEATHER
      ↓
REAL FORECAST
      ↓
REAL SENSOR TELEMETRY
      ↓
REAL PREDICTION MODEL
      ↓
REAL ALERTS
      ↓
REAL GOVERNMENT INTEGRATIONS
```

Later we can add:

```text
DEM
Basins
Valleys
Stream Order
Typology
Lakes metadata
CCTV
```

without redesigning the central command console.

---

# 52. Final acceptance test

The prototype is ready for Government demonstration when the following sequence works flawlessly:

### Test 1

Open application.

→ Bengaluru drainage network appears.

### Test 2

Toggle layers.

→ Primary / Secondary / Lakes / Sub-valleys behave independently.

### Test 3

Start Heavy Monsoon simulation.

→ Rainfall/forecast card changes.

### Test 4

Play timeline.

→ selected drains progressively change Normal → Watch → Critical.

### Test 5

Critical drain appears.

→ KPI updates
→ alert appears
→ map highlights drain
→ right-side panel updates.

### Test 6

Lake becomes stressed.

→ lake changes Blue → Amber → Red according to its simulated state.

### Test 7

Click drain.

→ sensor
→ current condition
→ forecast
→ predicted breach
→ reasons
→ recommended action.

### Test 8

Click alert.

→ map focuses exact asset
→ incident panel opens.

### Test 9

Replay/reset.

→ simulation returns to identical starting state.

### Test 10

Switch Simulation OFF.

→ all simulated colouring disappears and the original clean GIS view returns.

This last point is extremely important.

---

# 53. Most important implementation rule

The developer must always preserve this distinction:

```text
REAL GIS
=
SOURCE INFRASTRUCTURE

SIMULATION
=
DEMONSTRATION STATE

PREDICTION
=
CURRENTLY DEMONSTRATIVE

GOVERNMENT FEEDS
=
FUTURE DATA SOURCE
```

Do not mix these together.

---

# 54. Design goal

The final result should feel like:

> **“Bengaluru Storm-Water Command Centre”**

rather than:

> “Map of Bengaluru drains.”

The map is the foundation.

The **prediction + timeline + asset state + explanation + alert workflow** is the product.

Build the visual experience first. Keep the simulation engine deliberately simple and deterministic. Do not start ML, hydraulic modelling, DEM processing, CCTV or hardware integration until this command-centre experience is working end-to-end.

### One design decision I would add

**Do not use a Government logo or make the interface look officially commissioned.** Use a neutral product identity such as **“Bengaluru Storm-Water Flood Intelligence — Demonstration Prototype.”** It will look professional without implying Government ownership or endorsement.

I also **would not add the lakes/valleys/DEM complexity any further right now**. Your current four-layer foundation is enough to build the full command-centre experience. When the remaining files become available, we can add them as additional analytical context rather than allowing them to derail the prototype.
