---
current: post
cover: /assets/images/why_db_fast.png
navigation: true
title: "Why Databases Are Fast: The Magic of B-Trees and Query Planners"
date: 2026-06-21 11:00:00
tags: ["opinion"]
class: post-template
subclass: "post"
author: antony
---

If you have ever written a simple web app, you have probably run a query like this:

```sql
SELECT * FROM users WHERE email = 'alice@example.com';
```

In a small development environment, this query returns in less than a millisecond. But what happens when your application scales to millions of users? Why doesn't the database grind to a halt when searching through gigabytes of raw data stored on slow disk drives?

The secret lies in a combination of B-Trees, caching layers, and the Query Planner. Let's look at how databases avoid reading raw data, and run an interactive simulation to see how queries execute under the hood.

---

## The Database Query Simulator

Adjust the database state using the controls below, select a target query, and hit **Run Query** to watch how the database locates the record.

<div class="db-sim-container">
<!-- Sidebar Controls -->
<div class="db-sidebar">
<h3 class="db-section-title">Query Planner Settings</h3>
<div class="toggle-group">
<label for="toggle-index">Index on `email` column</label>
<div class="switch-wrapper">
<input type="checkbox" id="toggle-index" checked>
<span class="switch-label">Enabled</span>
</div>
<span class="db-hint">Without an index, the database must scan the entire table.</span>
</div>
<div class="slider-group">
<label for="slider-rows">Table Size: <span id="val-rows">1,000,000</span> rows</label>
<input type="range" id="slider-rows" min="1000" max="10000000" step="999000" value="1000000">
<span class="db-hint">Larger tables exponentially increase table scan times.</span>
</div>
<div class="toggle-group">
<label for="toggle-cache">Buffer Pool Cache</label>
<div class="switch-wrapper">
<input type="checkbox" id="toggle-cache" checked>
<span class="switch-label">Cache Hit (RAM)</span>
</div>
<span class="db-hint">Cache hits avoid hitting the physical disk.</span>
</div>
<h3 class="db-section-title">Execute Query</h3>
<div class="query-select-group">
<label for="query-select">Select SQL Statement:</label>
<select id="query-select" class="db-select">
<option value="alice@example.com">SELECT * FROM users WHERE email = 'alice@example.com' (Row 10,000)</option>
<option value="bob@example.com">SELECT * FROM users WHERE email = 'bob@example.com' (Row 500,000)</option>
<option value="charlie@example.com">SELECT * FROM users WHERE email = 'charlie@example.com' (Row 990,000)</option>
</select>
</div>
<div class="db-control-buttons">
<button id="btn-run" class="db-btn db-btn-primary">Run Query</button>
<button id="btn-reset" class="db-btn db-btn-danger">Reset</button>
</div>
</div>
<!-- Main Simulator View -->
<div class="db-main">
<!-- Left Column: Visual Search Space -->
<div class="db-col-visual">
<h3 class="db-section-title">Execution Visualization</h3>
<div class="visualization-window" id="visualization-window">
<!-- Content populated dynamically based on state -->
<div class="placeholder-text" id="vis-placeholder">Select settings and run a query to visualize execution.</div>
</div>
</div>
<!-- Right Column: Planner & Metrics -->
<div class="db-col-status">
<div class="db-status-card">
<h4 class="db-card-title">Query Planner Output</h4>
<div class="planner-box" id="planner-output">
EXPLAIN ANALYZE SELECT * FROM users WHERE email = '...';
</div>
</div>
<div class="db-status-row">
<div class="db-status-card text-center">
<h4 class="db-card-title">Rows Checked</h4>
<div class="metric-value" id="metric-checked">0</div>
<div class="metric-total">out of <span id="metric-total-rows">1,000,000</span></div>
</div>
<div class="db-status-card text-center">
<h4 class="db-card-title">Query Duration</h4>
<div class="metric-value" id="metric-time">0.00 ms</div>
<div class="metric-label" id="metric-medium">Disk Access</div>
</div>
</div>
<div class="db-status-card">
<h4 class="db-card-title">Storage Media Path</h4>
<div class="media-path-container">
<div class="media-node" id="node-ram">
<div class="media-icon">⚡</div>
<div>RAM Cache</div>
<div class="node-time">0.05ms</div>
</div>
<div class="media-connector" id="connector-disk">➔</div>
<div class="media-node" id="node-disk">
<div class="media-icon">💿</div>
<div>Disk Drive</div>
<div class="node-time">10.0ms</div>
</div>
</div>
</div>
</div>
</div>
</div>

<style>
  /* Database Simulation Dashboard Styles */
  .db-sim-container {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 20px;
    background: #0f172a;
    border-radius: 12px;
    padding: 20px;
    color: #f1f5f9 !important;
    font-family: var(--font-inter, sans-serif);
    margin: 30px auto;
    width: 92vw !important;
    max-width: 1280px !important;
    position: relative !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    border: 1px solid #1e293b;
    box-sizing: border-box;
  }

  /* Force high contrast text to override global theme */
  .db-sim-container h3,
  .db-sim-container h4,
  .db-sim-container .db-section-title,
  .db-sim-container .db-card-title,
  .db-sim-container label,
  .db-sim-container span,
  .db-sim-container select,
  .db-sim-container option {
    color: #f1f5f9 !important;
  }

  .db-sidebar {
    background: #1e293b;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    border: 1px solid #334155;
  }

  .db-section-title {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #cbd5e1 !important;
    margin-bottom: 5px;
    border-bottom: 1px solid #334155;
    padding-bottom: 5px;
  }

  .slider-group, .toggle-group, .query-select-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .slider-group label, .toggle-group label, .query-select-group label {
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc !important;
  }

  .db-select {
    background: #0f172a;
    border: 1px solid #475569;
    padding: 8px;
    border-radius: 6px;
    color: #f1f5f9 !important;
    font-size: 12px;
    cursor: pointer;
  }

  .db-select option {
    background: #0f172a;
    color: #f1f5f9 !important;
  }

  .slider-group input[type="range"] {
    width: 100%;
    accent-color: #fecd35;
    cursor: pointer;
  }

  .db-hint {
    font-size: 11px;
    color: #94a3b8 !important;
  }

  .switch-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .switch-label {
    font-size: 12px;
    color: #cbd5e1 !important;
    font-weight: bold;
  }

  .db-control-buttons {
    display: flex;
    gap: 8px;
    margin-top: 5px;
  }

  .db-btn {
    flex: 1;
    padding: 10px;
    font-size: 12px;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .db-btn-primary {
    background: #fecd35;
    color: #0f172a;
  }

  .db-btn-primary:hover {
    background: #fde047;
  }

  .db-btn-danger {
    background: #f05230;
    color: #ffffff;
  }

  .db-btn-danger:hover {
    background: #ef4444;
  }

  /* Main View Area */
  .db-main {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 20px;
  }

  .db-col-visual {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .visualization-window {
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    flex-grow: 1;
    min-height: 400px;
    height: 480px;
    position: relative;
    padding: 16px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .placeholder-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 13px;
    color: #64748b;
    text-align: center;
    width: 80%;
    line-height: 1.5;
  }

  /* Sequential Scan Visualization */
  .scan-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
    height: 100%;
    align-content: start;
  }

  .grid-block {
    background: rgba(71, 85, 105, 0.2);
    border: 1px solid #334155;
    border-radius: 4px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #475569;
    transition: all 0.05s ease;
  }

  .grid-block.scanned {
    background: rgba(240, 82, 48, 0.15);
    border-color: #f05230;
    color: #fca5a5;
  }

  .grid-block.active {
    background: #f05230 !important;
    border-color: #fca5a5 !important;
    color: #0f172a !important;
    font-weight: bold;
    transform: scale(1.1);
    box-shadow: 0 0 10px #f05230;
    z-index: 10;
  }

  .grid-block.matched {
    background: #a4d037 !important;
    border-color: #d9f99d !important;
    color: #0f172a !important;
    font-weight: bold;
    animation: matchPulse 0.5s infinite alternate;
    z-index: 11;
  }

  @keyframes matchPulse {
    0% {
      transform: scale(1.1);
      box-shadow: 0 0 8px #a4d037;
    }
    100% {
      transform: scale(1.22);
      box-shadow: 0 0 25px #a4d037;
    }
  }

  /* B-Tree Visualization */
  .btree-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    position: relative;
  }

  .btree-level {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    z-index: 5;
  }

  .tree-node {
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 10px;
    font-weight: bold;
    color: #cbd5e1;
    text-align: center;
    transition: all 0.3s ease;
    min-width: 50px;
  }

  .tree-node.active {
    border-color: #fecd35;
    background: rgba(254, 205, 53, 0.2);
    color: #fecd35;
    animation: nodePulse 0.8s infinite alternate;
  }

  @keyframes nodePulse {
    0% {
      transform: scale(1.02);
      box-shadow: 0 0 6px rgba(254, 205, 53, 0.4);
    }
    100% {
      transform: scale(1.1);
      box-shadow: 0 0 20px rgba(254, 205, 53, 0.9);
    }
  }

  .tree-node.discarded {
    opacity: 0.25;
    border-color: #1e293b;
    color: #475569;
  }

  .btree-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  }

  .tree-link {
    stroke: #334155;
    stroke-width: 2px;
    fill: none;
    transition: stroke 0.3s ease, stroke-width 0.3s ease;
  }

  .tree-link.active {
    stroke: #fecd35;
    stroke-width: 4px;
    stroke-dasharray: 6, 6;
    animation: flowLink 1.2s linear infinite;
  }

  @keyframes flowLink {
    to {
      stroke-dashoffset: -24;
    }
  }

  .tree-link.discarded {
    stroke: rgba(51, 65, 85, 0.2);
  }

  /* Right Column Status */
  .db-col-status {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .db-status-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .db-status-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .db-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #cbd5e1 !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .planner-box {
    background: #090d16;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 10px;
    min-height: 80px;
    font-family: monospace;
    font-size: 11px;
    color: #a4d037 !important;
    white-space: pre-wrap;
    line-height: 1.4;
  }

  .metric-value {
    font-size: 22px;
    font-weight: 800;
    color: #fecd35;
  }

  .metric-total, .metric-label {
    font-size: 11px;
    color: #94a3b8 !important;
  }

  /* Storage Media Paths */
  .media-path-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 10px 0;
  }

  .media-node {
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 8px;
    padding: 8px 12px;
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    color: #cbd5e1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;
  }

  .media-node.active-hit {
    border-color: #a4d037;
    color: #a4d037;
    animation: ramPulse 0.8s infinite alternate;
  }

  .media-node.active-miss {
    border-color: #fecd35;
    color: #fecd35;
    animation: diskPulse 0.8s infinite alternate;
  }

  @keyframes ramPulse {
    0% {
      box-shadow: 0 0 4px rgba(164, 208, 55, 0.3);
    }
    100% {
      box-shadow: 0 0 20px rgba(164, 208, 55, 0.9);
    }
  }

  @keyframes diskPulse {
    0% {
      box-shadow: 0 0 4px rgba(254, 205, 53, 0.3);
    }
    100% {
      box-shadow: 0 0 20px rgba(254, 205, 53, 0.9);
    }
  }

  .media-icon {
    font-size: 18px;
  }

  .node-time {
    font-size: 9px;
    color: #64748b;
  }

  .media-connector {
    font-size: 18px;
    color: #334155;
    transition: color 0.3s ease;
  }

  .media-connector.active {
    color: #fecd35;
  }

  /* Responsive Design */
  @media (max-width: 900px) {
    .db-sim-container {
      grid-template-columns: 1fr;
    }
    .db-main {
      grid-template-columns: 1fr;
    }
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Sliders & Checkboxes
    const toggleIndex = document.getElementById('toggle-index');
    const slideRows = document.getElementById('slider-rows');
    const toggleCache = document.getElementById('toggle-cache');
    const querySelect = document.getElementById('query-select');
    
    const valRows = document.getElementById('val-rows');
    const metricTotalRows = document.getElementById('metric-total-rows');
    
    // Buttons
    const btnRun = document.getElementById('btn-run');
    const btnReset = document.getElementById('btn-reset');
    
    // Outputs
    const visWindow = document.getElementById('visualization-window');
    const plannerOutput = document.getElementById('planner-output');
    const metricChecked = document.getElementById('metric-checked');
    const metricTime = document.getElementById('metric-time');
    const metricMedium = document.getElementById('metric-medium');
    
    // Media nodes
    const nodeRam = document.getElementById('node-ram');
    const nodeDisk = document.getElementById('node-disk');
    const connectorDisk = document.getElementById('connector-disk');

    let state = {
      indexEnabled: true,
      rows: 1000000,
      cacheHit: true,
      queryValue: "alice@example.com",
      isRunning: false
    };

    let animationInterval = null;

    function formatNumber(num) {
      return num.toLocaleString();
    }

    function updateConfig() {
      state.indexEnabled = toggleIndex.checked;
      state.rows = parseInt(slideRows.value);
      state.cacheHit = toggleCache.checked;
      state.queryValue = querySelect.value;
      
      valRows.textContent = formatNumber(state.rows);
      metricTotalRows.textContent = formatNumber(state.rows);
      
      // Update label texts for toggle switches
      toggleIndex.nextElementSibling.textContent = state.indexEnabled ? "Enabled" : "Disabled";
      toggleCache.nextElementSibling.textContent = state.cacheHit ? "Cache Hit (RAM)" : "Cache Miss (Disk)";
      
      updatePlannerExplanation();
    }

    function updatePlannerExplanation() {
      if (state.isRunning) return;
      
      if (state.indexEnabled) {
        plannerOutput.textContent = `EXPLAIN ANALYZE
SELECT * FROM users WHERE email = '${state.queryValue}';

Planning Time: 0.12 ms
Execution Plan:
-> Index Scan using users_email_idx on users (cost=0.43..8.45 rows=1 width=36)
   Index Cond: (email = '${state.queryValue}')`;
      } else {
        plannerOutput.textContent = `EXPLAIN ANALYZE
SELECT * FROM users WHERE email = '${state.queryValue}';

Planning Time: 0.08 ms
Execution Plan:
-> Seq Scan on users (cost=0.00..18450.00 rows=1 width=36)
   Filter: (email = '${state.queryValue}')`;
      }
    }

    function resetSimulation() {
      clearInterval(animationInterval);
      state.isRunning = false;
      btnRun.disabled = false;
      querySelect.disabled = false;
      toggleIndex.disabled = false;
      slideRows.disabled = false;
      toggleCache.disabled = false;
      
      visWindow.innerHTML = '<div class="placeholder-text" id="vis-placeholder">Select settings and run a query to visualize execution.</div>';
      metricChecked.textContent = "0";
      metricTime.textContent = "0.00 ms";
      metricMedium.textContent = "Standing by";
      
      nodeRam.className = "media-node";
      nodeDisk.className = "media-node";
      connectorDisk.className = "media-connector";
      
      updatePlannerExplanation();
    }

    function runSimulation() {
      resetSimulation();
      state.isRunning = true;
      btnRun.disabled = true;
      querySelect.disabled = true;
      toggleIndex.disabled = true;
      slideRows.disabled = true;
      toggleCache.disabled = true;
      
      if (state.indexEnabled) {
        runBTreeSimulation();
      } else {
        runSeqScanSimulation();
      }
    }

    // Table Scan / Sequential Scan
    function runSeqScanSimulation() {
      visWindow.innerHTML = '';
      
      const grid = document.createElement('div');
      grid.className = 'scan-grid';
      visWindow.appendChild(grid);
      
      const blockCount = 48; // Total visual page blocks
      const blocks = [];
      
      // Determine where the matching record is based on query dropdown value
      let matchBlockIndex = 47; // Default end of table (Charlie)
      if (state.queryValue === "alice@example.com") {
        matchBlockIndex = Math.floor(blockCount * 0.15); // near start
      } else if (state.queryValue === "bob@example.com") {
        matchBlockIndex = Math.floor(blockCount * 0.50); // middle
      }
      
      for (let i = 0; i < blockCount; i++) {
        const block = document.createElement('div');
        block.className = 'grid-block';
        block.innerHTML = `Page ${i+1}`;
        grid.appendChild(block);
        blocks.push(block);
      }
      
      let currentIndex = 0;
      const speed = 70; // ms per block
      
      // Cache state highlight
      if (state.cacheHit) {
        nodeRam.className = "media-node active-hit";
      } else {
        nodeRam.className = "media-node active-miss";
        nodeDisk.className = "media-node active-miss";
        connectorDisk.className = "media-connector active";
      }
      
      plannerOutput.textContent = `EXPLAIN ANALYZE
-> Running Sequential Scan...
Scanning every row in users table...`;

      animationInterval = setInterval(() => {
        if (currentIndex > 0) {
          blocks[currentIndex - 1].className = 'grid-block scanned';
        }
        
        blocks[currentIndex].className = 'grid-block active';
        
        // Calculate dynamic checking count
        const checkedRows = Math.floor((currentIndex + 1) * (state.rows / blockCount));
        metricChecked.textContent = formatNumber(checkedRows);
        
        // Time estimation (sequential scan is disk heavy, cache hit makes it faster but still O(N))
        const baseSpeed = state.cacheHit ? 0.005 : 0.05; // ms per 1000 rows
        const estimatedTime = (checkedRows * baseSpeed);
        metricTime.textContent = `${estimatedTime.toFixed(2)} ms`;
        metricMedium.textContent = state.cacheHit ? "Sequential Scan (Memory)" : "Sequential Scan (Disk)";
        
        if (currentIndex === matchBlockIndex) {
          clearInterval(animationInterval);
          blocks[currentIndex].className = 'grid-block matched';
          
          // Complete output
          plannerOutput.textContent = `EXPLAIN ANALYZE
SELECT * FROM users WHERE email = '${state.queryValue}';

Planning Time: 0.08 ms
Execution Plan:
-> Seq Scan on users (cost=0.00..18450.00 rows=1 width=36)
   Filter: (email = '${state.queryValue}')
   Rows Removed by Filter: ${formatNumber(checkedRows - 1)}
   
Execution Time: ${estimatedTime.toFixed(2)} ms`;
          
          btnRun.disabled = false;
          state.isRunning = false;
        } else {
          currentIndex++;
        }
      }, speed);
    }

    // B-Tree Index Scan
    function runBTreeSimulation() {
      visWindow.innerHTML = '';
      
      const btree = document.createElement('div');
      btree.className = 'btree-wrapper';
      visWindow.appendChild(btree);
      
      // Create B-Tree structure in visualization window
      btree.innerHTML = `
        <svg class="btree-svg" id="btree-svg">
          <line id="link-root-left" class="tree-link" x1="50%" y1="20%" x2="25%" y2="50%"></line>
          <line id="link-root-right" class="tree-link" x1="50%" y1="20%" x2="75%" y2="50%"></line>
          <line id="link-left-leaf1" class="tree-link" x1="25%" y1="50%" x2="12.5%" y2="80%"></line>
          <line id="link-left-leaf2" class="tree-link" x1="25%" y1="50%" x2="37.5%" y2="80%"></line>
          <line id="link-right-leaf3" class="tree-link" x1="75%" y1="50%" x2="62.5%" y2="80%"></line>
          <line id="link-right-leaf4" class="tree-link" x1="75%" y1="50%" x2="87.5%" y2="80%"></line>
        </svg>
        <div class="btree-level" style="margin-top: 10px;">
          <div id="node-root" class="tree-node" style="position: absolute; left: calc(50% - 35px); top: 10px;">Root: [M]</div>
        </div>
        <div class="btree-level" style="position: absolute; width: 100%; top: 150px; left: 0;">
          <div id="node-left" class="tree-node" style="position: absolute; left: calc(25% - 35px);">Node: [F]</div>
          <div id="node-right" class="tree-node" style="position: absolute; left: calc(75% - 35px);">Node: [T]</div>
        </div>
        <div class="btree-level" style="position: absolute; width: 100%; top: 290px; left: 0;">
          <div id="node-leaf1" class="tree-node" style="position: absolute; left: calc(12.5% - 35px);">Leaf: [A-E]</div>
          <div id="node-leaf2" class="tree-node" style="position: absolute; left: calc(37.5% - 35px);">Leaf: [F-L]</div>
          <div id="node-leaf3" class="tree-node" style="position: absolute; left: calc(62.5% - 35px);">Leaf: [M-S]</div>
          <div id="node-leaf4" class="tree-node" style="position: absolute; left: calc(87.5% - 35px);">Leaf: [T-Z]</div>
        </div>
      `;
      
      const nodeRoot = document.getElementById('node-root');
      const nodeLeft = document.getElementById('node-left');
      const nodeRight = document.getElementById('node-right');
      const nodeLeaf1 = document.getElementById('node-leaf1');
      const nodeLeaf2 = document.getElementById('node-leaf2');
      const nodeLeaf3 = document.getElementById('node-leaf3');
      const nodeLeaf4 = document.getElementById('node-leaf4');
      
      const linkRootLeft = document.getElementById('link-root-left');
      const linkRootRight = document.getElementById('link-root-right');
      const linkLeftLeaf1 = document.getElementById('link-left-leaf1');
      const linkLeftLeaf2 = document.getElementById('link-left-leaf2');
      const linkRightLeaf3 = document.getElementById('link-right-leaf3');
      const linkRightLeaf4 = document.getElementById('link-right-leaf4');

      // Cache state highlight
      if (state.cacheHit) {
        nodeRam.className = "media-node active-hit";
      } else {
        nodeRam.className = "media-node active-miss";
        nodeDisk.className = "media-node active-miss";
        connectorDisk.className = "media-connector active";
      }

      plannerOutput.textContent = `EXPLAIN ANALYZE
-> Index lookup starting at B-tree root...`;
      
      let step = 0;
      const stepDuration = 800; // ms per tree jump
      
      animationInterval = setInterval(() => {
        if (step === 0) {
          // Highlight Root
          nodeRoot.className = "tree-node active";
          metricChecked.textContent = "1";
          metricTime.textContent = (state.cacheHit ? "0.01 ms" : "2.50 ms");
          plannerOutput.textContent = `EXPLAIN ANALYZE
-> Evaluating Root Node...
Comparing search key '${state.queryValue}' with root key 'M'`;
          step++;
        } 
        else if (step === 1) {
          // Decide left or right based on query
          nodeRoot.className = "tree-node";
          
          if (state.queryValue === "alice@example.com" || state.queryValue === "bob@example.com") {
            // Left
            nodeLeft.className = "tree-node active";
            nodeRight.className = "tree-node discarded";
            linkRootLeft.setAttribute('class', 'tree-link active');
            linkRootRight.setAttribute('class', 'tree-link discarded');
            
            // Discarded half the search space
            const discarded = Math.floor(state.rows / 2);
            plannerOutput.textContent = `EXPLAIN ANALYZE
-> Navigating Left Branch.
Discarded ${formatNumber(discarded)} rows from search space!`;
          } else {
            // Right
            nodeRight.className = "tree-node active";
            nodeLeft.className = "tree-node discarded";
            linkRootRight.setAttribute('class', 'tree-link active');
            linkRootLeft.setAttribute('class', 'tree-link discarded');
            
            const discarded = Math.floor(state.rows / 2);
            plannerOutput.textContent = `EXPLAIN ANALYZE
-> Navigating Right Branch.
Discarded ${formatNumber(discarded)} rows from search space!`;
          }
          metricChecked.textContent = "2";
          metricTime.textContent = (state.cacheHit ? "0.02 ms" : "5.00 ms");
          step++;
        }
        else if (step === 2) {
          // Leaf node selection
          nodeLeft.className = "tree-node";
          nodeRight.className = "tree-node";
          
          if (state.queryValue === "alice@example.com") {
            nodeLeaf1.className = "tree-node active";
            nodeLeaf2.className = "tree-node discarded";
            nodeLeaf3.className = "tree-node discarded";
            nodeLeaf4.className = "tree-node discarded";
            linkLeftLeaf1.setAttribute('class', 'tree-link active');
            linkLeftLeaf2.setAttribute('class', 'tree-link discarded');
            
            const discarded = Math.floor((state.rows / 4) * 3);
            plannerOutput.textContent = `EXPLAIN ANALYZE
-> Reading Leaf Node [A-E].
Discarded ${formatNumber(discarded)} total rows!`;
          } 
          else if (state.queryValue === "bob@example.com") {
            nodeLeaf2.className = "tree-node active";
            nodeLeaf1.className = "tree-node discarded";
            nodeLeaf3.className = "tree-node discarded";
            nodeLeaf4.className = "tree-node discarded";
            linkLeftLeaf2.setAttribute('class', 'tree-link active');
            linkLeftLeaf1.setAttribute('class', 'tree-link discarded');
            
            const discarded = Math.floor((state.rows / 4) * 3);
            plannerOutput.textContent = `EXPLAIN ANALYZE
-> Reading Leaf Node [F-L].
Discarded ${formatNumber(discarded)} total rows!`;
          }
          else {
            nodeLeaf4.className = "tree-node active";
            nodeLeaf1.className = "tree-node discarded";
            nodeLeaf2.className = "tree-node discarded";
            nodeLeaf3.className = "tree-node discarded";
            linkRightLeaf4.setAttribute('class', 'tree-link active');
            linkRightLeaf3.setAttribute('class', 'tree-link discarded');
            
            const discarded = Math.floor((state.rows / 4) * 3);
            plannerOutput.textContent = `EXPLAIN ANALYZE
-> Reading Leaf Node [T-Z].
Discarded ${formatNumber(discarded)} total rows!`;
          }
          metricChecked.textContent = "3";
          metricTime.textContent = (state.cacheHit ? "0.03 ms" : "7.50 ms");
          step++;
        }
        else if (step === 3) {
          // Final record location
          clearInterval(animationInterval);
          
          nodeLeaf1.className = "tree-node";
          nodeLeaf2.className = "tree-node";
          nodeLeaf4.className = "tree-node";
          
          const finalTime = state.cacheHit ? 0.05 : 10.05;
          metricTime.textContent = `${finalTime.toFixed(2)} ms`;
          metricMedium.textContent = state.cacheHit ? "Index Scan (Cache Hit)" : "Index Scan (Disk Fetch)";
          
          plannerOutput.textContent = `EXPLAIN ANALYZE
SELECT * FROM users WHERE email = '${state.queryValue}';

Planning Time: 0.12 ms
Execution Plan:
-> Index Scan using users_email_idx on users (cost=0.43..8.45 rows=1 width=36)
   Index Cond: (email = '${state.queryValue}')
   
Execution Time: ${finalTime.toFixed(2)} ms`;
          
          btnRun.disabled = false;
          state.isRunning = false;
        }
      }, stepDuration);
    }

    // Event listeners
    toggleIndex.addEventListener('change', updateConfig);
    slideRows.addEventListener('input', updateConfig);
    toggleCache.addEventListener('change', updateConfig);
    querySelect.addEventListener('change', updateConfig);
    
    btnRun.addEventListener('click', runSimulation);
    btnReset.addEventListener('click', resetSimulation);

    // Initial setup
    updateConfig();
  });
</script>

---

## The Four Core Elements of Database Speed

Let's break down the four essential pillars that enable database systems to maintain speed even with billions of rows.

### 1. Table Scans vs. Index Scans
When a database does not have an index on the column you are filtering by, it has no choice but to perform a **Table Scan** (often called a Sequential Scan). 

During a Table Scan, the database engine starts at the very beginning of the data file on disk and reads every single page sequentially. 
- **Time Complexity:** $O(N)$
- If you have 10,000,000 rows, the database must check 10,000,000 values. If the matching row is at the very end of the file, this operation can take seconds and trigger heavy disk read activity.

With an index, the database switches to an **Index Scan**. Instead of searching through the data file, it queries a secondary lookup table that contains only the indexed keys and pointers to the physical rows.

### 2. The Power of B-Tree Indexes
Almost all relational database systems (like PostgreSQL, MySQL, and SQLite) use a data structure called a **B-Tree** (Balanced Tree) to organize their indexes.

A B-Tree is a self-balancing search tree. It groups keys into nodes:
- **Root Node:** The starting point of the search.
- **Internal Nodes:** Intermediate layers that route the search path.
- **Leaf Nodes:** The bottom layer containing the actual indexed keys and pointers to the physical data rows.

Because nodes are sorted, B-Trees enable **binary-like search routing**:
- **Time Complexity:** $O(\log N)$
- Instead of checking 10,000,000 rows, a B-Tree search requires only **3 to 4 node comparisons**. With each step down the tree, the database instantly discards millions of non-matching values, narrowing down the search space in microseconds.

### 3. RAM Cache and the Buffer Pool
Reading data from a physical disk drive is extremely slow. An average Solid State Drive (SSD) takes around 0.1ms to 1.0ms to fetch a page, while a mechanical hard drive (HDD) can take up to 10ms. RAM, however, reads data in less than 0.0001ms.

Databases exploit this speed difference using a memory region called the **Buffer Pool**:
- **Cache Hit:** When you query data that has been read recently, the database finds it in the Buffer Pool (RAM) and returns it instantly.
- **Cache Miss:** When the page is not in memory, the database must make a slow round-trip to the physical disk, load the page into the Buffer Pool, and then return it.

Optimizing cache hit rates is one of the most critical aspects of database performance tuning.

### 4. The Query Planner
When you send a SQL statement to the database, it isn't executed directly. Instead, it is passed to the **Query Planner** (or Optimizer).

The Query Planner:
1. **Parses the SQL:** Converts the query into a logical execution tree.
2. **Checks Available Indexes:** Looks for indexes on the columns filtered in your `WHERE` clauses.
3. **Analyzes Table Statistics:** Uses internal histograms to estimate how many rows match your query.
4. **Calculates Costs:** Compares alternative search strategies (e.g., "Is it cheaper to do a Sequential Scan or use an Index?").
5. **Generates the Execution Plan:** Chooses the strategy with the lowest estimated CPU and I/O cost.

For small tables (e.g., under 100 rows), the Query Planner will often choose a Table Scan over an Index Scan, because reading the index files has its own overhead. But on larger tables, the Query Planner will dynamically select index routes to keep your applications running at lightning speeds.
