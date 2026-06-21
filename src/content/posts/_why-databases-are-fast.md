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

To understand how databases stay fast, we need to break down the query lifecycle into four distinct concepts: **Table Scans**, **B-Tree Indexes**, **Buffer Pool Caching**, and the **Query Planner**. 

Let's explore each concept step-by-step with interactive visualizations.

---

## 1. The Naive Approach: Table Scans

When a database has no lookup index on a column, it must execute a **Table Scan** (or Sequential Scan). The database engine starts at the first page of data on disk and reads every single row sequentially until it finds a match.

This results in a linear time complexity of **$O(N)$**. If you have 10,000,000 rows, the database must perform up to 10,000,000 comparisons.

### Interactive Table Scan Simulator
Adjust the table size slider below, select a target query, and click **Run Table Scan** to watch the database sequentially scan through data pages.

<div class="db-widget" id="widget-scan">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">Sequential Disk Scan</h4>
<div class="scan-grid-wrapper">
<div class="scan-grid" id="scan-grid">
<!-- Page blocks populated by JS -->
</div>
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Scan Configuration</h4>
<div class="slider-group">
<label for="scan-slider-rows">Table Size: <span id="scan-val-rows">1,000,000</span> rows</label>
<input type="range" id="scan-slider-rows" min="1000" max="10000000" step="999000" value="1000000">
<span class="db-hint">Larger tables require reading more pages from disk.</span>
</div>
<div class="query-select-group">
<label for="scan-query-select">Target Email:</label>
<select id="scan-query-select" class="db-select">
<option value="alice@example.com">alice@example.com (Row 150,000)</option>
<option value="bob@example.com">bob@example.com (Row 500,000)</option>
<option value="charlie@example.com">charlie@example.com (Row 950,000)</option>
</select>
</div>
<div class="db-control-buttons">
<button id="scan-btn-run" class="db-btn db-btn-primary">Run Table Scan</button>
<button id="scan-btn-reset" class="db-btn db-btn-danger">Reset</button>
</div>
<div class="metrics-panel">
<div class="metric-box">
<span class="metric-lbl">Rows Checked</span>
<span class="metric-val" id="scan-metric-checked">0</span>
</div>
<div class="metric-box">
<span class="metric-lbl">Estimated Duration</span>
<span class="metric-val" id="scan-metric-time">0.00 ms</span>
</div>
</div>
</div>
</div>
</div>

---

## 2. Searching in Logarithmic Time: B-Tree Indexes

Instead of reading raw data, databases use a **B-Tree** (Balanced Tree) index to find keys in **$O(\log N)$** logarithmic time. 

A B-Tree organizes keys in sorted order inside nodes:
1. **Root Node:** Directs the search path left or right.
2. **Internal Nodes:** Intermediate layers that route queries based on alphabetical or numerical ranges.
3. **Leaf Nodes:** The bottom layer pointing to the exact physical data blocks.

Each B-Tree traversal discards massive blocks of the database instantly. For a table of 10,000,000 rows, a B-Tree search locates the record in just **3 to 4 comparisons**.

### Interactive B-Tree Simulator
Select a target email and click **Run Index Search** to watch the search pathway route through the tree. Toggling the table size slider illustrates how the B-Tree depth remains flat (3 node checks) even when scaling from 1,000 to 10,000,000 rows.

<div class="db-widget" id="widget-btree">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">B-Tree Index Traversal</h4>
<div class="btree-wrapper-box">
<div class="btree-wrapper" id="btree-container">
<!-- Tree structures populated dynamically -->
</div>
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Index Configuration</h4>
<div class="slider-group">
<label for="tree-slider-rows">Table Size: <span id="tree-val-rows">1,000,000</span> rows</label>
<input type="range" id="tree-slider-rows" min="1000" max="10000000" step="999000" value="1000000">
<span class="db-hint">Increasing table size from 1K to 10M rows barely affects B-tree depth.</span>
</div>
<div class="query-select-group">
<label for="tree-query-select">Target Email:</label>
<select id="tree-query-select" class="db-select">
<option value="alice@example.com">alice@example.com (A-E Branch)</option>
<option value="bob@example.com">bob@example.com (F-L Branch)</option>
<option value="charlie@example.com">charlie@example.com (T-Z Branch)</option>
</select>
</div>
<div class="db-control-buttons">
<button id="tree-btn-run" class="db-btn db-btn-primary">Run Index Search</button>
<button id="tree-btn-reset" class="db-btn db-btn-danger">Reset</button>
</div>
<div class="metrics-panel">
<div class="metric-box">
<span class="metric-lbl">Node Checks</span>
<span class="metric-val" id="tree-metric-checked">0 / 3</span>
</div>
<div class="metric-box">
<span class="metric-lbl">Rows Discarded</span>
<span class="metric-val" id="tree-metric-discarded">0</span>
</div>
</div>
</div>
</div>
</div>

---

## 3. Minimizing Hardware Latency: Caching

Even with a B-Tree index, fetching data from physical disk drives is slow. An average Solid State Drive (SSD) takes around 0.1ms to 1.0ms to fetch a page, while mechanical hard drives (HDDs) take up to 10ms. RAM, however, reads data in less than 0.0001ms.

To minimize disk I/O, databases maintain a RAM cache called the **Buffer Pool**.
- **Cache Hit:** The requested page is found in RAM and returned instantly (0.05ms).
- **Cache Miss:** The page must be fetched from physical disk, loaded into RAM, and then returned (10ms).

### Interactive Cache Latency Simulator
Toggle the cache status to simulate memory latency. Watch the storage media path light up to see how cache hits bypass disk reads.

<div class="db-widget" id="widget-cache">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">Storage Path Fetch</h4>
<div class="media-path-container">
<div class="media-node" id="cache-node-ram">
<div class="media-icon">⚡</div>
<div>RAM Cache</div>
<div class="node-time">0.05ms</div>
</div>
<div class="media-connector" id="cache-connector-disk">➔</div>
<div class="media-node" id="cache-node-disk">
<div class="media-icon">💿</div>
<div>Disk Drive</div>
<div class="node-time">10.0ms</div>
</div>
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Cache Configuration</h4>
<div class="toggle-group">
<label for="cache-toggle-hit">Buffer Pool State</label>
<div class="switch-wrapper">
<input type="checkbox" id="cache-toggle-hit" checked>
<span class="switch-label" id="cache-hit-status">Cache Hit (RAM)</span>
</div>
<span class="db-hint">Cache misses force the database to wait for disk access.</span>
</div>
<div class="db-control-buttons" style="margin-top: 15px;">
<button id="cache-btn-run" class="db-btn db-btn-primary">Fetch Data</button>
<button id="cache-btn-reset" class="db-btn db-btn-danger">Reset</button>
</div>
<div class="metrics-panel">
<div class="metric-box">
<span class="metric-lbl">Access Duration</span>
<span class="metric-val" id="cache-metric-time">0.00 ms</span>
</div>
<div class="metric-box">
<span class="metric-lbl">Storage Path</span>
<span class="metric-val" id="cache-metric-path">Standing by</span>
</div>
</div>
</div>
</div>
</div>

---

## 4. The Intelligence: The Query Planner

When you send a SQL query to a database, the engine does not execute it immediately. It passes the SQL to the **Query Planner**. 

The Query Planner analyzes table statistics, checks which columns have B-Tree indexes, and calculates estimated CPU and I/O costs to construct an optimal execution plan.

### Interactive Query Planner Console
Choose a query and toggle the B-Tree index checkbox to watch the Query Planner output the `EXPLAIN ANALYZE` execution plan dynamically. Note how the planner shifts between `Seq Scan` and `Index Scan`.

<div class="db-widget" id="widget-planner">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">Planner Console Output</h4>
<div class="planner-box" id="planner-console">
EXPLAIN ANALYZE SELECT * FROM users WHERE email = '...';
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Planner Inputs</h4>
<div class="toggle-group">
<label for="planner-toggle-index">Index on `email` column</label>
<div class="switch-wrapper">
<input type="checkbox" id="planner-toggle-index" checked>
<span class="switch-label" id="planner-idx-status">Enabled</span>
</div>
<span class="db-hint">Disabling the index forces the planner to choose a Seq Scan.</span>
</div>
<div class="query-select-group">
<label for="planner-query-select">Select SQL query:</label>
<select id="planner-query-select" class="db-select">
<option value="alice@example.com">SELECT * FROM users WHERE email = 'alice@example.com'</option>
<option value="bob@example.com">SELECT * FROM users WHERE email = 'bob@example.com'</option>
<option value="charlie@example.com">SELECT * FROM users WHERE email = 'charlie@example.com'</option>
</select>
</div>
<div class="metrics-panel" style="margin-top: 15px;">
<div class="metric-box">
<span class="metric-lbl">Planner Strategy</span>
<span class="metric-val" id="planner-metric-strategy" style="font-size: 13px; color: #a4d037 !important;">Index Scan</span>
</div>
<div class="metric-box">
<span class="metric-lbl">Estimated Cost</span>
<span class="metric-val" id="planner-metric-cost" style="font-size: 13px; color: #fecd35 !important;">4.20..8.40</span>
</div>
</div>
</div>
</div>
</div>

---

## Conclusion: Designing for Scale

Databases are fast because they combine physical hardware acceleration with smart data structures. By using B-Trees, we avoid checking every record. By using Buffer Pools, we avoid hitting the physical disk. And by using the Query Planner, the database automatically selects the fastest execution pathway so your applications can scale seamlessly.

<style>
  /* Base Widgets Layout */
  .db-widget {
    background: #0f172a;
    border-radius: 12px;
    padding: 20px;
    color: #f1f5f9 !important;
    font-family: var(--font-inter, sans-serif);
    margin: 30px auto;
    width: 92vw !important;
    max-width: 1100px !important;
    position: relative !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    border: 1px solid #1e293b;
    box-sizing: border-box;
  }

  /* Force high contrast text */
  .db-widget h3,
  .db-widget h4,
  .db-widget .widget-visual-title,
  .db-widget .db-card-title,
  .db-widget label,
  .db-widget span,
  .db-widget select,
  .db-widget option {
    color: #f1f5f9 !important;
  }

  .widget-main {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 20px;
  }

  .widget-visual-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .widget-control-col {
    background: #1e293b;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    border: 1px solid #334155;
  }

  .widget-visual-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #cbd5e1 !important;
    margin-bottom: 5px;
  }

  .db-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #cbd5e1 !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #334155;
    padding-bottom: 5px;
    margin-bottom: 5px;
  }

  .slider-group, .toggle-group, .query-select-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .slider-group label, .toggle-group label, .query-select-group label {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1 !important;
  }

  .db-select {
    background: #0f172a;
    border: 1px solid #475569;
    padding: 8px;
    border-radius: 6px;
    color: #f1f5f9 !important;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
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
    color: #f1f5f9 !important;
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

  .db-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .metrics-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
    border-top: 1px solid #334155;
    padding-top: 10px;
  }

  .metric-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #0f172a;
    border-radius: 6px;
    padding: 8px;
    border: 1px solid #334155;
  }

  .metric-lbl {
    font-size: 9px;
    text-transform: uppercase;
    color: #94a3b8 !important;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .metric-val {
    font-size: 14px;
    font-weight: 800;
    color: #fecd35;
    margin-top: 2px;
  }

  /* Scan Grid Specific Styles */
  .scan-grid-wrapper {
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    height: 300px;
    padding: 12px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .scan-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
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
    color: #cbd5e1;
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
    transform: scale(1.08);
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
      transform: scale(1.08);
      box-shadow: 0 0 8px #a4d037;
    }
    100% {
      transform: scale(1.18);
      box-shadow: 0 0 20px #a4d037;
    }
  }

  /* BTree Simulator Specific Styles */
  .btree-wrapper-box {
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    height: 300px;
    padding: 12px;
    box-sizing: border-box;
    position: relative;
  }

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
    padding: 6px 10px;
    font-size: 9px;
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
    stroke: rgba(51, 65, 85, 0.15);
  }

  /* Cache Simulator Specific Styles */
  .media-path-container {
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    height: 200px;
    padding: 12px;
    box-sizing: border-box;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .media-node {
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 8px;
    padding: 12px 18px;
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    color: #cbd5e1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
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
    font-size: 24px;
  }

  .node-time {
    font-size: 9px;
    color: #cbd5e1;
  }

  .media-connector {
    font-size: 22px;
    color: #334155;
    transition: color 0.3s ease;
  }

  .media-connector.active {
    color: #fecd35;
    animation: connectorFlash 0.5s infinite alternate;
  }

  @keyframes connectorFlash {
    0% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  /* Planner Simulator Specific Styles */
  .planner-box {
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    padding: 14px;
    height: 180px;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 11px;
    color: #a4d037 !important;
    white-space: pre-wrap;
    line-height: 1.4;
    overflow-y: auto;
  }

  /* Responsive Design Adjustments */
  @media (max-width: 800px) {
    .widget-main {
      grid-template-columns: 1fr;
    }
    .media-path-container {
      height: 150px;
    }
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Helper to format large numbers
    function formatNum(num) {
      return num.toLocaleString();
    }

    // ==========================================
    // 1. TABLE SCAN WIDGET
    // ==========================================
    const scanSlider = document.getElementById('scan-slider-rows');
    const scanValRows = document.getElementById('scan-val-rows');
    const scanQuerySelect = document.getElementById('scan-query-select');
    const scanBtnRun = document.getElementById('scan-btn-run');
    const scanBtnReset = document.getElementById('scan-btn-reset');
    const scanGrid = document.getElementById('scan-grid');
    const scanMetricChecked = document.getElementById('scan-metric-checked');
    const scanMetricTime = document.getElementById('scan-metric-time');

    let scanInterval = null;
    let scanState = { rows: 1000000, query: "alice@example.com", isRunning: false };

    function updateScanSlider() {
      scanState.rows = parseInt(scanSlider.value);
      scanValRows.textContent = formatNum(scanState.rows);
    }

    function initScanGrid() {
      scanGrid.innerHTML = '';
      const totalBlocks = 36;
      for (let i = 0; i < totalBlocks; i++) {
        const block = document.createElement('div');
        block.className = 'grid-block';
        block.textContent = `Page ${i+1}`;
        scanGrid.appendChild(block);
      }
    }

    function resetScan() {
      clearInterval(scanInterval);
      scanState.isRunning = false;
      scanBtnRun.disabled = false;
      scanSlider.disabled = false;
      scanQuerySelect.disabled = false;
      
      initScanGrid();
      scanMetricChecked.textContent = "0";
      scanMetricTime.textContent = "0.00 ms";
    }

    function runScan() {
      resetScan();
      scanState.isRunning = true;
      scanBtnRun.disabled = true;
      scanSlider.disabled = true;
      scanQuerySelect.disabled = true;

      const blocks = scanGrid.children;
      const totalBlocks = blocks.length;
      let currentIndex = 0;

      // Determine match index
      let matchIndex = totalBlocks - 1; // Default: Charlie
      if (scanQuerySelect.value === "alice@example.com") {
        matchIndex = Math.floor(totalBlocks * 0.15);
      } else if (scanQuerySelect.value === "bob@example.com") {
        matchIndex = Math.floor(totalBlocks * 0.50);
      }

      scanInterval = setInterval(() => {
        if (currentIndex > 0) {
          blocks[currentIndex - 1].className = 'grid-block scanned';
        }
        blocks[currentIndex].className = 'grid-block active';

        // Update metrics
        const checkedRows = Math.floor((currentIndex + 1) * (scanState.rows / totalBlocks));
        scanMetricChecked.textContent = formatNum(checkedRows);
        
        // table scan speed estimate: 0.04 ms per 1000 rows
        const timeEstimate = checkedRows * 0.00004;
        scanMetricTime.textContent = `${timeEstimate.toFixed(2)} ms`;

        if (currentIndex === matchIndex) {
          clearInterval(scanInterval);
          blocks[currentIndex].className = 'grid-block matched';
          scanBtnRun.disabled = false;
          scanState.isRunning = false;
        } else {
          currentIndex++;
        }
      }, 80);
    }

    scanSlider.addEventListener('input', updateScanSlider);
    scanBtnRun.addEventListener('click', runScan);
    scanBtnReset.addEventListener('click', resetScan);
    
    // Initialize Widget 1
    updateScanSlider();
    initScanGrid();


    // ==========================================
    // 2. B-TREE WIDGET
    // ==========================================
    const treeSlider = document.getElementById('tree-slider-rows');
    const treeValRows = document.getElementById('tree-val-rows');
    const treeQuerySelect = document.getElementById('tree-query-select');
    const treeBtnRun = document.getElementById('tree-btn-run');
    const treeBtnReset = document.getElementById('tree-btn-reset');
    const btreeContainer = document.getElementById('btree-container');
    const treeMetricChecked = document.getElementById('tree-metric-checked');
    const treeMetricDiscarded = document.getElementById('tree-metric-discarded');

    let treeInterval = null;
    let treeState = { rows: 1000000, query: "alice@example.com", isRunning: false };

    function updateTreeSlider() {
      treeState.rows = parseInt(treeSlider.value);
      treeValRows.textContent = formatNum(treeState.rows);
    }

    function initBTree() {
      btreeContainer.innerHTML = `
        <svg class="btree-svg" id="tree-svg">
          <line id="link-root-left" class="tree-link" x1="50%" y1="18%" x2="25%" y2="50%"></line>
          <line id="link-root-right" class="tree-link" x1="50%" y1="18%" x2="75%" y2="50%"></line>
          <line id="link-left-leaf1" class="tree-link" x1="25%" y1="50%" x2="12.5%" y2="82%"></line>
          <line id="link-left-leaf2" class="tree-link" x1="25%" y1="50%" x2="37.5%" y2="82%"></line>
          <line id="link-right-leaf3" class="tree-link" x1="75%" y1="50%" x2="62.5%" y2="82%"></line>
          <line id="link-right-leaf4" class="tree-link" x1="75%" y1="50%" x2="87.5%" y2="82%"></line>
        </svg>
        <div class="btree-level" style="margin-top: 10px;">
          <div id="tree-node-root" class="tree-node" style="position: absolute; left: calc(50% - 30px); top: 5px;">Root: [M]</div>
        </div>
        <div class="btree-level" style="position: absolute; width: 100%; top: 120px; left: 0;">
          <div id="tree-node-left" class="tree-node" style="position: absolute; left: calc(25% - 30px);">Node: [F]</div>
          <div id="tree-node-right" class="tree-node" style="position: absolute; left: calc(75% - 30px);">Node: [T]</div>
        </div>
        <div class="btree-level" style="position: absolute; width: 100%; top: 240px; left: 0;">
          <div id="tree-node-leaf1" class="tree-node" style="position: absolute; left: calc(12.5% - 30px);">Leaf: [A-E]</div>
          <div id="tree-node-leaf2" class="tree-node" style="position: absolute; left: calc(37.5% - 30px);">Leaf: [F-L]</div>
          <div id="tree-node-leaf3" class="tree-node" style="position: absolute; left: calc(62.5% - 30px);">Leaf: [M-S]</div>
          <div id="tree-node-leaf4" class="tree-node" style="position: absolute; left: calc(87.5% - 30px);">Leaf: [T-Z]</div>
        </div>
      `;
    }

    function resetTree() {
      clearInterval(treeInterval);
      treeState.isRunning = false;
      treeBtnRun.disabled = false;
      treeSlider.disabled = false;
      treeQuerySelect.disabled = false;
      
      initBTree();
      treeMetricChecked.textContent = "0 / 3";
      treeMetricDiscarded.textContent = "0";
    }

    function runTree() {
      resetTree();
      treeState.isRunning = true;
      treeBtnRun.disabled = true;
      treeSlider.disabled = true;
      treeQuerySelect.disabled = true;

      const nodeRoot = document.getElementById('tree-node-root');
      const nodeLeft = document.getElementById('tree-node-left');
      const nodeRight = document.getElementById('tree-node-right');
      const nodeLeaf1 = document.getElementById('tree-node-leaf1');
      const nodeLeaf2 = document.getElementById('tree-node-leaf2');
      const nodeLeaf3 = document.getElementById('tree-node-leaf3');
      const nodeLeaf4 = document.getElementById('tree-node-leaf4');
      
      const linkRootLeft = document.getElementById('link-root-left');
      const linkRootRight = document.getElementById('link-root-right');
      const linkLeftLeaf1 = document.getElementById('link-left-leaf1');
      const linkLeftLeaf2 = document.getElementById('link-left-leaf2');
      const linkRightLeaf3 = document.getElementById('link-right-leaf3');
      const linkRightLeaf4 = document.getElementById('link-right-leaf4');

      let step = 0;
      
      treeInterval = setInterval(() => {
        if (step === 0) {
          nodeRoot.className = "tree-node active";
          treeMetricChecked.textContent = "1 / 3";
          treeMetricDiscarded.textContent = "0";
          step++;
        }
        else if (step === 1) {
          nodeRoot.className = "tree-node";
          if (treeQuerySelect.value === "alice@example.com" || treeQuerySelect.value === "bob@example.com") {
            nodeLeft.className = "tree-node active";
            nodeRight.className = "tree-node discarded";
            linkRootLeft.setAttribute('class', 'tree-link active');
            linkRootRight.setAttribute('class', 'tree-link discarded');
          } else {
            nodeRight.className = "tree-node active";
            nodeLeft.className = "tree-node discarded";
            linkRootRight.setAttribute('class', 'tree-link active');
            linkRootLeft.setAttribute('class', 'tree-link discarded');
          }
          treeMetricChecked.textContent = "2 / 3";
          treeMetricDiscarded.textContent = formatNum(Math.floor(treeState.rows / 2));
          step++;
        }
        else if (step === 2) {
          nodeLeft.className = "tree-node";
          nodeRight.className = "tree-node";
          
          if (treeQuerySelect.value === "alice@example.com") {
            nodeLeaf1.className = "tree-node active";
            nodeLeaf2.className = "tree-node discarded";
            nodeLeaf3.className = "tree-node discarded";
            nodeLeaf4.className = "tree-node discarded";
            linkLeftLeaf1.setAttribute('class', 'tree-link active');
            linkLeftLeaf2.setAttribute('class', 'tree-link discarded');
          } 
          else if (treeQuerySelect.value === "bob@example.com") {
            nodeLeaf2.className = "tree-node active";
            nodeLeaf1.className = "tree-node discarded";
            nodeLeaf3.className = "tree-node discarded";
            nodeLeaf4.className = "tree-node discarded";
            linkLeftLeaf2.setAttribute('class', 'tree-link active');
            linkLeftLeaf1.setAttribute('class', 'tree-link discarded');
          } 
          else {
            nodeLeaf4.className = "tree-node active";
            nodeLeaf1.className = "tree-node discarded";
            nodeLeaf2.className = "tree-node discarded";
            nodeLeaf3.className = "tree-node discarded";
            linkRightLeaf4.setAttribute('class', 'tree-link active');
            linkRightLeaf3.setAttribute('class', 'tree-link discarded');
          }
          treeMetricChecked.textContent = "3 / 3";
          treeMetricDiscarded.textContent = formatNum(treeState.rows - 1);
          step++;
        }
        else if (step === 3) {
          clearInterval(treeInterval);
          nodeLeaf1.className = "tree-node";
          nodeLeaf2.className = "tree-node";
          nodeLeaf4.className = "tree-node";
          treeBtnRun.disabled = false;
          treeState.isRunning = false;
        }
      }, 700);
    }

    treeSlider.addEventListener('input', updateTreeSlider);
    treeBtnRun.addEventListener('click', runTree);
    treeBtnReset.addEventListener('click', resetTree);

    // Initialize Widget 2
    updateTreeSlider();
    initBTree();


    // ==========================================
    // 3. CACHE LATENCY WIDGET
    // ==========================================
    const cacheToggleHit = document.getElementById('cache-toggle-hit');
    const cacheHitStatus = document.getElementById('cache-hit-status');
    const cacheBtnRun = document.getElementById('cache-btn-run');
    const cacheBtnReset = document.getElementById('cache-btn-reset');
    const cacheNodeRam = document.getElementById('cache-node-ram');
    const cacheNodeDisk = document.getElementById('cache-node-disk');
    const cacheConnectorDisk = document.getElementById('cache-connector-disk');
    const cacheMetricTime = document.getElementById('cache-metric-time');
    const cacheMetricPath = document.getElementById('cache-metric-path');

    let cacheTimeout1 = null;
    let cacheTimeout2 = null;

    function resetCache() {
      clearTimeout(cacheTimeout1);
      clearTimeout(cacheTimeout2);
      cacheBtnRun.disabled = false;
      cacheToggleHit.disabled = false;
      
      cacheNodeRam.className = "media-node";
      cacheNodeDisk.className = "media-node";
      cacheConnectorDisk.className = "media-connector";
      cacheMetricTime.textContent = "0.00 ms";
      cacheMetricPath.textContent = "Standing by";
    }

    function runCache() {
      resetCache();
      cacheBtnRun.disabled = true;
      cacheToggleHit.disabled = true;

      const isHit = cacheToggleHit.checked;
      
      // Step 1: Hit RAM
      cacheNodeRam.className = "media-node active-hit";
      cacheMetricPath.textContent = "Checking RAM Cache...";
      
      if (isHit) {
        cacheTimeout1 = setTimeout(() => {
          cacheMetricTime.textContent = "0.05 ms";
          cacheMetricPath.textContent = "RAM Cache Hit!";
          cacheBtnRun.disabled = false;
        }, 600);
      } else {
        // Step 2: Connector and Disk Miss
        cacheTimeout1 = setTimeout(() => {
          cacheNodeRam.className = "media-node active-miss";
          cacheNodeDisk.className = "media-node active-miss";
          cacheConnectorDisk.className = "media-connector active";
          cacheMetricPath.textContent = "Cache Miss. Fetching from Disk...";
          
          cacheTimeout2 = setTimeout(() => {
            cacheMetricTime.textContent = "10.05 ms";
            cacheMetricPath.textContent = "Loaded from Disk to RAM";
            cacheBtnRun.disabled = false;
          }, 800);
        }, 600);
      }
    }

    cacheToggleHit.addEventListener('change', () => {
      cacheHitStatus.textContent = cacheToggleHit.checked ? "Cache Hit (RAM)" : "Cache Miss (Disk)";
    });
    cacheBtnRun.addEventListener('click', runCache);
    cacheBtnReset.addEventListener('click', resetCache);


    // ==========================================
    // 4. QUERY PLANNER WIDGET
    // ==========================================
    const plannerToggleIndex = document.getElementById('planner-toggle-index');
    const plannerIdxStatus = document.getElementById('planner-idx-status');
    const plannerQuerySelect = document.getElementById('planner-query-select');
    const plannerConsole = document.getElementById('planner-console');
    const plannerMetricStrategy = document.getElementById('planner-metric-strategy');
    const plannerMetricCost = document.getElementById('planner-metric-cost');

    function updatePlanner() {
      const isIdx = plannerToggleIndex.checked;
      const queryVal = plannerQuerySelect.value;
      
      plannerIdxStatus.textContent = isIdx ? "Enabled" : "Disabled";
      
      if (isIdx) {
        plannerMetricStrategy.textContent = "Index Scan";
        plannerMetricStrategy.style.color = "#a4d037";
        plannerMetricCost.textContent = "0.43..8.45";
        
        plannerConsole.textContent = `EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE email = '${queryVal}';

Execution Plan:
-> Index Scan using users_email_idx on users  (cost=0.43..8.45 rows=1 width=36) (actual time=0.045..0.046 rows=1 loops=1)
   Index Cond: (email = '${queryVal}')
   Buffers: shared hit=3
   
Planning Time: 0.12 ms
Execution Time: 0.05 ms`;
      } else {
        plannerMetricStrategy.textContent = "Seq Scan";
        plannerMetricStrategy.style.color = "#f05230";
        plannerMetricCost.textContent = "0.00..18450.00";
        
        plannerConsole.textContent = `EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE email = '${queryVal}';

Execution Plan:
-> Seq Scan on users  (cost=0.00..18450.00 rows=1 width=36) (actual time=4.120..22.450 rows=1 loops=1)
   Filter: (email = '${queryVal}')
   Rows Removed by Filter: 999,999
   Buffers: shared hit=18400
   
Planning Time: 0.08 ms
Execution Time: 22.50 ms`;
      }
    }

    plannerToggleIndex.addEventListener('change', updatePlanner);
    plannerQuerySelect.addEventListener('change', updatePlanner);
    
    // Initialize Widget 4
    updatePlanner();
  });
</script>
