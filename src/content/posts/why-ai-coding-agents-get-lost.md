---
current: post
cover: /assets/images/why_agents_lost.png
navigation: true
title: "Why AI Coding Agents Get Lost: The Anatomy of Context Drift"
date: 2026-06-21 10:00:00
tags: ["opinion"]
class: post-template
subclass: "post"
author: antony
---

If you have used modern AI coding agents like Cursor Agent, Claude Engineer, or OpenDevin, you have probably experienced a familiar lifecycle. 

At first, the agent works like magic. It reads a file, edits a line, runs a test, and fixes your bug in seconds. But as the task grows in complexity—requiring changes across multiple files, dealing with compiler errors, or pivoting mid-way—something shifts. The agent starts spinning in circles. It reads the same file five times, fabricates APIs that do not exist, and completely forgets the original bug you asked it to fix.

Why does this happen? The answer lies in **Context Drift**.

Let's look under the hood at how an agent's memory actually fills up, and try out an interactive simulation of an agent's context window in action.

---

## The Interactive Agent Simulator

Adjust the sliders below to configure the agent's parameters, then use the controls to step through a typical multi-file refactoring loop. Watch how the agent's context window behaves as it gathers information.

<div class="agent-sim-container">
<!-- Sidebar Controls -->
<div class="sim-sidebar">
<h3 class="sim-section-title">Configuration</h3>
<div class="slider-group">
<label for="slider-context">Context Size: <span id="val-context">32</span>k tokens</label>
<input type="range" id="slider-context" min="8" max="128" step="8" value="32">
<span class="slider-hint">Max capacity of the agent's memory.</span>
</div>
<div class="slider-group">
<label for="slider-intelligence">Model Intelligence: <span id="val-intelligence">Medium</span></label>
<input type="range" id="slider-intelligence" min="1" max="3" step="1" value="2">
<span class="slider-hint">Lower intelligence leads to more hallucinated assumptions.</span>
</div>
<div class="slider-group">
<label for="slider-tools">Registered Tools: <span id="val-tools">8</span> tools</label>
<input type="range" id="slider-tools" min="3" max="30" step="1" value="8">
<span class="slider-hint">Each tool adds schema declarations to the system prompt.</span>
</div>
<div class="slider-group">
<label for="slider-repo">Repository Size: <span id="val-repo">Medium</span></label>
<input type="range" id="slider-repo" min="1" max="3" step="1" value="2">
<span class="slider-hint">Larger repositories flood the context with longer file reads.</span>
</div>
<h3 class="sim-section-title">Simulation Control</h3>
<div class="control-buttons">
<button id="btn-prev" class="btn btn-secondary" disabled>Back</button>
<button id="btn-next" class="btn btn-primary">Next Step</button>
<button id="btn-reset" class="btn btn-danger">Reset</button>
</div>
<div class="step-indicator">Step: <span id="current-step-num">0</span>/5</div>
<div class="step-description" id="step-desc">Agent initialized with system instructions. Ready to start task.</div>
</div>
<!-- Main Simulator View -->
<div class="sim-main">
<!-- Left Column: Visual Context Stack -->
<div class="sim-col-stack">
<h3 class="sim-section-title">Context Window Memory</h3>
<div class="context-window-wrapper">
<div class="context-limit-line" id="limit-line">
<span>Limit Line</span>
</div>
<div class="context-stack" id="context-stack">
<!-- Dynamically populated blocks -->
</div>
</div>
</div>
<!-- Right Column: Gauges, Console & Assumptions -->
<div class="sim-col-status">
<!-- Token Gauge & Focus -->
<div class="status-row">
<div class="status-card text-center">
<h4 class="card-title">Token Usage</h4>
<div class="token-value"><span id="active-tokens">0</span> / <span id="max-tokens">32,000</span></div>
<div class="progress-bar-container">
<div class="progress-bar-fill" id="token-progress" style="width: 0%"></div>
</div>
</div>
<div class="status-card text-center">
<h4 class="card-title">Objective Focus</h4>
<div class="focus-badge badge-success" id="focus-badge">100% Focused</div>
<div class="objective-text" id="objective-text">Fix Login Authentication Bug</div>
</div>
</div>
<!-- Live Terminal Output -->
<div class="status-card col-span-2">
<h4 class="card-title">Agent Terminal Log</h4>
<div class="terminal-box" id="terminal-log">
<div class="terminal-line system">> Agent Initialized. Standing by...
</div>
</div>
</div>
<!-- Hallucinated Assumptions -->
<div class="status-card col-span-2">
<h4 class="card-title">Assumptions & Hallucinations</h4>
<ul class="assumptions-list" id="assumptions-list">
<li class="empty-state">No assumptions active. Model is currently objective-oriented.</li>
</ul>
</div>
</div>
</div>
</div>

<style>
  /* Simulation Dashboard Styles */
  .agent-sim-container {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    background: #0f172a;
    border-radius: 12px;
    padding: 20px;
    color: #e2e8f0;
    font-family: var(--font-inter, sans-serif);
    margin: 30px auto;
    max-width: 1040px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    border: 1px solid #1e293b;
  }

  .sim-sidebar {
    background: #1e293b;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    border: 1px solid #334155;
  }

  .sim-section-title {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 5px;
    border-bottom: 1px solid #334155;
    padding-bottom: 5px;
  }

  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .slider-group label {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
  }

  .slider-group input[type="range"] {
    width: 100%;
    accent-color: #3eb0ef;
    cursor: pointer;
  }

  .slider-hint {
    font-size: 11px;
    color: #64748b;
  }

  .control-buttons {
    display: flex;
    gap: 8px;
    margin-top: 5px;
  }

  .btn {
    flex: 1;
    padding: 10px;
    font-size: 12px;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #3eb0ef;
    color: #0f172a;
  }

  .btn-primary:hover {
    background: #60a5fa;
  }

  .btn-secondary {
    background: #475569;
    color: #cbd5e1;
  }

  .btn-secondary:hover {
    background: #64748b;
  }

  .btn-danger {
    background: #f05230;
    color: #ffffff;
  }

  .btn-danger:hover {
    background: #ef4444;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .step-indicator {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    font-weight: bold;
  }

  .step-description {
    font-size: 12px;
    line-height: 1.4;
    color: #cbd5e1;
    background: #0f172a;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #334155;
    min-height: 80px;
  }

  /* Main Simulator Area */
  .sim-main {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 20px;
  }

  .sim-col-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .context-window-wrapper {
    position: relative;
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    flex-grow: 1;
    min-height: 400px;
    height: 480px;
    overflow: hidden;
    display: flex;
    flex-direction: column-reverse;
    padding: 10px;
    box-sizing: border-box;
  }

  .context-limit-line {
    position: absolute;
    left: 0;
    width: 100%;
    border-top: 2px dashed #ef4444;
    z-index: 10;
    pointer-events: none;
    transition: bottom 0.3s ease;
  }

  .context-limit-line span {
    position: absolute;
    right: 10px;
    top: -16px;
    font-size: 9px;
    font-weight: 800;
    color: #ef4444;
    background: #090d16;
    padding: 2px 6px;
    border: 1px solid #ef4444;
    border-radius: 3px;
  }

  .context-stack {
    display: flex;
    flex-direction: column-reverse;
    gap: 6px;
    width: 100%;
    z-index: 5;
    transition: transform 0.3s ease;
  }

  .context-block {
    width: 100%;
    border-radius: 4px;
    padding: 6px;
    font-size: 11px;
    font-weight: bold;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Block Types and Colors */
  .block-system {
    background: rgba(62, 176, 239, 0.2);
    border-left: 4px solid #3eb0ef;
    color: #3eb0ef;
  }

  .block-tools {
    background: rgba(164, 208, 55, 0.2);
    border-left: 4px solid #a4d037;
    color: #a4d037;
  }

  .block-task {
    background: rgba(254, 205, 53, 0.2);
    border-left: 4px solid #fecd35;
    color: #fecd35;
  }

  .block-search {
    background: rgba(173, 38, 180, 0.2);
    border-left: 4px solid #ad26b4;
    color: #ad26b4;
  }

  .block-files {
    background: rgba(96, 165, 250, 0.2);
    border-left: 4px solid #60a5fa;
    color: #93c5fd;
  }

  .block-logs {
    background: rgba(240, 82, 48, 0.2);
    border-left: 4px solid #f05230;
    color: #fca5a5;
  }

  .block-pivot {
    background: rgba(250, 58, 87, 0.2);
    border-left: 4px solid #fa3a57;
    color: #fca5a5;
  }

  .block-drift {
    background: rgba(163, 130, 26, 0.2);
    border-left: 4px solid #a3821a;
    color: #fde047;
  }

  .block-forgotten {
    background: rgba(71, 85, 105, 0.2) !important;
    border-left: 4px solid #475569 !important;
    color: #64748b !important;
    text-decoration: line-through;
    opacity: 0.5;
  }

  /* Right Column Status elements */
  .sim-col-status {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .status-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .status-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .col-span-2 {
    grid-column: span 2;
  }

  .card-title {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .token-value {
    font-size: 16px;
    font-weight: 800;
    color: #3eb0ef;
  }

  .progress-bar-container {
    width: 100%;
    height: 8px;
    background: #0f172a;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: #3eb0ef;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .focus-badge {
    font-size: 12px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
    align-self: center;
  }

  .badge-success {
    background: rgba(164, 208, 55, 0.2);
    color: #a4d037;
    border: 1px solid #a4d037;
  }

  .badge-warning {
    background: rgba(254, 205, 53, 0.2);
    color: #fecd35;
    border: 1px solid #fecd35;
  }

  .badge-danger {
    background: rgba(240, 82, 48, 0.2);
    color: #f05230;
    border: 1px solid #f05230;
    animation: flash 1s infinite alternate;
  }

  @keyframes flash {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
  }

  .objective-text {
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    color: #cbd5e1;
  }

  .terminal-box {
    background: #090d16;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 10px;
    height: 120px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .terminal-line {
    line-height: 1.4;
  }

  .terminal-line.system { color: #3eb0ef; }
  .terminal-line.user { color: #ad26b4; }
  .terminal-line.file { color: #60a5fa; }
  .terminal-line.tool { color: #a4d037; }
  .terminal-line.error { color: #f05230; }
  .terminal-line.warn { color: #fecd35; }

  .assumptions-list {
    list-style: none;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 60px;
  }

  .assumptions-list li {
    padding: 6px;
    background: #0f172a;
    border-left: 3px solid #f05230;
    border-radius: 4px;
    color: #fca5a5;
  }

  .assumptions-list li.empty-state {
    border-left: 3px solid #64748b;
    color: #64748b;
    background: transparent;
    text-align: center;
    padding-top: 15px;
  }

  /* Responsive Design */
  @media (max-width: 900px) {
    .agent-sim-container {
      grid-template-columns: 1fr;
    }
    .sim-main {
      grid-template-columns: 1fr;
    }
  }
</style>

<script>
  // Simulation Logic
  document.addEventListener('DOMContentLoaded', () => {
    // Configuration elements
    const slideContext = document.getElementById('slider-context');
    const slideIntelligence = document.getElementById('slider-intelligence');
    const slideTools = document.getElementById('slider-tools');
    const slideRepo = document.getElementById('slider-repo');

    const valContext = document.getElementById('val-context');
    const valIntelligence = document.getElementById('val-intelligence');
    const valTools = document.getElementById('val-tools');
    const valRepo = document.getElementById('val-repo');

    // Controls
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnReset = document.getElementById('btn-reset');
    const currentStepNum = document.getElementById('current-step-num');
    const stepDesc = document.getElementById('step-desc');

    // Visual elements
    const limitLine = document.getElementById('limit-line');
    const contextStack = document.getElementById('context-stack');
    const activeTokensEl = document.getElementById('active-tokens');
    const maxTokensEl = document.getElementById('max-tokens');
    const tokenProgress = document.getElementById('token-progress');
    const focusBadge = document.getElementById('focus-badge');
    const objectiveText = document.getElementById('objective-text');
    const terminalLog = document.getElementById('terminal-log');
    const assumptionsList = document.getElementById('assumptions-list');

    let state = {
      contextSize: 32000,
      intelligence: 2,
      tools: 8,
      repoSize: 2,
      step: 0,
      tokensUsed: 0,
      blocks: []
    };

    // Mapping step numbers to descriptions
    const stepsData = [
      {
        title: "Agent Initialized",
        desc: "The agent is loaded with the base system prompt and the schemas of all available tools. This sets the base memory load."
      },
      {
        title: "Workspace Exploration",
        desc: "The agent performs grep and search queries to locate relevant files matching your request. Search outputs fill up memory."
      },
      {
        title: "Reading Source Files",
        desc: "The agent reads the contents of the matching files to understand code structure. The larger the repo, the more tokens consumed."
      },
      {
        title: "Execution & Compile Checks",
        desc: "The agent modifies the file and runs compilation checks. It receives large terminal output stack traces and compiler logs."
      },
      {
        title: "User pivot / modification",
        desc: "You interrupt the agent and add a secondary request. This new prompt is pushed to the top of its context."
      },
      {
        title: "Context Drift",
        desc: "The agent loops to satisfy the new requirement. Old items are forced out of context. If the original task falls off, the agent gets lost!"
      }
    ];

    // Helper to format values
    function updateConfigValues() {
      if (!slideContext) return;
      state.contextSize = parseInt(slideContext.value) * 1000;
      state.tools = parseInt(slideTools.value);
      state.intelligence = parseInt(slideIntelligence.value);
      state.repoSize = parseInt(slideRepo.value);

      valContext.textContent = slideContext.value;
      valTools.textContent = slideTools.value;
      
      const intelLabels = ["Low", "Medium", "High"];
      valIntelligence.textContent = intelLabels[state.intelligence - 1];

      const repoLabels = ["Small", "Medium", "Large"];
      valRepo.textContent = repoLabels[state.repoSize - 1];

      maxTokensEl.textContent = state.contextSize.toLocaleString();
      updateSimulationVisuals();
    }

    // Dynamic blocks calculation based on configuration and current step
    function calculateBlocks() {
      const blocks = [];
      const intelFactor = 4 - state.intelligence; // Low intelligence = 3, High = 1
      const repoFactor = state.repoSize; // 1, 2, or 3
      
      // Step 0 - Initial State
      if (state.step >= 0) {
        blocks.push({
          id: "system",
          name: "System Prompt",
          tokens: 4000,
          type: "block-system"
        });
        blocks.push({
          id: "tools",
          name: `Tool Schemas (${state.tools} tools)`,
          tokens: state.tools * 400,
          type: "block-tools"
        });
        blocks.push({
          id: "task",
          name: "Original Task: Fix Login Bug",
          tokens: 1500,
          type: "block-task"
        });
      }

      // Step 1 - Search
      if (state.step >= 1) {
        blocks.push({
          id: "search",
          name: "Search Logs & Grep",
          tokens: repoFactor * 1200,
          type: "block-search"
        });
      }

      // Step 2 - File Reads
      if (state.step >= 2) {
        blocks.push({
          id: "files",
          name: "File Contents: auth.ts",
          tokens: repoFactor * 4500,
          type: "block-files"
        });
        blocks.push({
          id: "files-db",
          name: "File Contents: db.ts",
          tokens: repoFactor * 3000,
          type: "block-files"
        });
      }

      // Step 3 - Terminal compile checks
      if (state.step >= 3) {
        blocks.push({
          id: "logs",
          name: "Linting & Compile Logs",
          tokens: 8000 + (intelFactor * 2000),
          type: "block-logs"
        });
      }

      // Step 4 - Pivot
      if (state.step >= 4) {
        blocks.push({
          id: "pivot",
          name: "User Prompt: Log OAuth callbacks",
          tokens: 2500,
          type: "block-pivot"
        });
      }

      // Step 5 - Drift
      if (state.step >= 5) {
        blocks.push({
          id: "drift-files",
          name: "File Contents: oauth.ts",
          tokens: repoFactor * 5000,
          type: "block-files"
        });
        blocks.push({
          id: "drift-logs",
          name: "Terminal Outputs (Step 2 Checks)",
          tokens: 6000 + (intelFactor * 3000),
          type: "block-logs"
        });
      }

      return blocks;
    }

    function updateSimulationVisuals() {
      const blocks = calculateBlocks();
      contextStack.innerHTML = '';
      
      let accumTokens = 0;
      let totalTokens = 0;
      
      // Calculate total tokens
      blocks.forEach(b => {
        totalTokens += b.tokens;
      });

      // Render stack items
      blocks.forEach(b => {
        const heightPercent = Math.max((b.tokens / state.contextSize) * 100, 3);
        const blockEl = document.createElement('div');
        
        const isPruned = accumTokens + b.tokens > state.contextSize;
        
        blockEl.className = `context-block ${b.type}`;
        if (isPruned) {
          blockEl.classList.add('block-forgotten');
        }
        
        blockEl.style.height = `${heightPercent * 4}px`; // scale visual height
        blockEl.innerHTML = `
          <span>${b.name}</span>
          <span>${b.tokens.toLocaleString()} tkn</span>
        `;
        
        contextStack.appendChild(blockEl);
        accumTokens += b.tokens;
      });

      // Update gauges
      activeTokensEl.textContent = totalTokens.toLocaleString();
      const usagePercent = Math.min((totalTokens / state.contextSize) * 100, 100);
      tokenProgress.style.width = `${usagePercent}%`;
      
      if (usagePercent > 90) {
        tokenProgress.style.background = '#f05230'; // Red
      } else if (usagePercent > 65) {
        tokenProgress.style.background = '#fecd35'; // Yellow
      } else {
        tokenProgress.style.background = '#3eb0ef'; // Blue
      }

      // Check if original Task block was pruned
      let isTaskPruned = false;
      let taskIndex = blocks.findIndex(b => b.id === 'task');
      if (taskIndex !== -1) {
        let taskAccum = 0;
        for (let i = 0; i <= taskIndex; i++) {
          taskAccum += blocks[i].tokens;
        }
        if (taskAccum > state.contextSize) {
          isTaskPruned = true;
        }
      }

      // Update Objective Focus
      if (state.step === 0) {
        focusBadge.className = "focus-badge badge-success";
        focusBadge.textContent = "100% Focused";
        objectiveText.textContent = "Fix Login Authentication Bug";
      } else if (isTaskPruned) {
        focusBadge.className = "focus-badge badge-danger";
        focusBadge.textContent = "OBJECTIVE LOST";
        objectiveText.innerHTML = "<span style='text-decoration: line-through; color: #94a3b8;'>Fix Login Bug</span><br><span style='color: #fa3a57;'>Only processing OAuth Requirement</span>";
      } else if (usagePercent > 70) {
        focusBadge.className = "focus-badge badge-warning";
        focusBadge.textContent = "Drifting Attention";
        objectiveText.textContent = "Fix Login Bug & OAuth Callback logs";
      } else {
        focusBadge.className = "focus-badge badge-success";
        focusBadge.textContent = "Focused";
        objectiveText.textContent = "Fix Login Bug & OAuth Callback logs";
      }

      // Update Limit Line visual positioning
      const limitHeight = 100;
      limitLine.style.bottom = `${(state.contextSize / (totalTokens || state.contextSize)) * 90}%`;
      if (totalTokens <= state.contextSize) {
        limitLine.style.bottom = '98%';
      }

      // Update Assumptions
      assumptionsList.innerHTML = '';
      if (isTaskPruned) {
        const assumptions = [
          "Assumption: The authentication flow works fine now (cannot verify).",
          "Assumption: Signup process requires OAuth callbacks directly in router.",
          "Assumption: Node.js standard environment supports OAuth callback parameters without checking package.json."
        ];
        assumptions.forEach(a => {
          const li = document.createElement('li');
          li.textContent = a;
          assumptionsList.appendChild(li);
        });
      } else if (state.step >= 3 && state.intelligence === 1) {
        const li = document.createElement('li');
        li.textContent = "Assumption: The database uses port 5432 (Unchecked).";
        assumptionsList.appendChild(li);
      } else {
        const li = document.createElement('li');
        li.className = 'empty-state';
        li.textContent = "No assumptions active. Model is currently objective-oriented.";
        assumptionsList.appendChild(li);
      }
    }

    // Terminal Logging
    function logToTerminal(message, type = 'system') {
      const line = document.createElement('div');
      line.className = `terminal-line ${type}`;
      line.textContent = `> ${message}`;
      terminalLog.appendChild(line);
      terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    function runStep(stepNum) {
      state.step = stepNum;
      currentStepNum.textContent = stepNum;
      stepDesc.textContent = stepsData[stepNum].desc;

      btnPrev.disabled = stepNum === 0;
      btnNext.disabled = stepNum === 5;

      switch(stepNum) {
        case 0:
          terminalLog.innerHTML = '';
          logToTerminal("System initialized. Standing by...", "system");
          logToTerminal("User input received: 'Fix login authentication flow'", "user");
          break;
        case 1:
          logToTerminal("Searching repository context...", "system");
          logToTerminal(`Grep completed. Found references in auth.ts and db.ts`, "tool");
          break;
        case 2:
          logToTerminal("Reading auth.ts...", "file");
          logToTerminal("Reading db.ts...", "file");
          logToTerminal("Files loaded into context buffer.", "system");
          break;
        case 3:
          logToTerminal("Executing tests: npm run test...", "tool");
          logToTerminal("Compilation Error: SyntaxError at auth.ts:45. Stack trace appended to logs.", "error");
          break;
        case 4:
          logToTerminal("User input received: 'Also log OAuth callback payloads'", "user");
          logToTerminal("Requirement pivot added to stack.", "system");
          break;
        case 5:
          logToTerminal("Reading oauth.ts...", "file");
          logToTerminal("Writing patch changes to server...", "tool");
          
          // Check if lost
          const totalTokens = calculateBlocks().reduce((sum, b) => sum + b.tokens, 0);
          if (totalTokens > state.contextSize) {
            logToTerminal("WARNING: Context limit exceeded. Pruning base task.", "warn");
            logToTerminal("Critical: Lost original instruction file context.", "error");
            logToTerminal("Focusing solely on OAuth Callback requirement.", "system");
          } else {
            logToTerminal("Success: Executing build... compilation passed.", "tool");
          }
          break;
      }

      updateSimulationVisuals();
    }

    // Event listeners
    if (slideContext) {
      slideContext.addEventListener('input', updateConfigValues);
      slideIntelligence.addEventListener('input', updateConfigValues);
      slideTools.addEventListener('input', updateConfigValues);
      slideRepo.addEventListener('input', updateConfigValues);

      btnNext.addEventListener('click', () => {
        if (state.step < 5) runStep(state.step + 1);
      });

      btnPrev.addEventListener('click', () => {
        if (state.step > 0) runStep(state.step - 1);
      });

      btnReset.addEventListener('click', () => {
        runStep(0);
      });

      // Initialize
      updateConfigValues();
      runStep(0);
    }
  });
</script>

---

## Why Agents Fail: The Three Core Drivers

Now that you have seen how context shifts inside the simulator, let's explore the three main reasons why AI agents lose focus on complex projects.

### 1. Context Pollution
When you read a file as a human, you look only at the lines of interest. But an AI agent lacks our organic filtering ability. When an agent opens a file, it must ingest the **entire file** to prevent syntax errors or missing definitions.

Furthermore, every tool call has overhead:
- **System Wrappers:** Rules explaining how to interpret tool results.
- **JSON Schemas:** Heavy definitions detailing what parameters a tool accepts.
- **Log Bloat:** If a build command returns 300 lines of warnings, all 300 lines are fed back into the context.

As a result, your context window fills up with system headers, tool descriptions, and build output instead of the source code.

### 2. Attention Decay (Recency Bias)
Large language models do not treat all elements inside their context window equally. Due to the way attention mechanisms are trained, models exhibit **recency bias** (paying attention to the very end of the prompt) and **priming bias** (paying attention to the system instructions at the very beginning).

The middle of the context window is often ignored—a phenomenon researchers call the **"Lost in the Middle"** problem. 

If your task description is pushed into the middle of a 100,000 token context window, the model starts to overlook details. It will prioritize whatever you said in your last message, completely ignoring constraints defined at the beginning.

### 3. Hallucinated Assumptions
When an agent's memory gets pruned, it loses key facts (e.g., how the database was structured or which dependencies were installed). Because LLMs are designed to predict the next word, they don't stop when they are missing facts. Instead, they **assume** details:
- *“The port must be `8080`.”*
- *“The auth helper function must be imported from `helpers.ts`.”*
- *“This class has a `loginUser()` method.”*

These wrong assumptions lead to code changes that trigger build errors. Fixing these errors requires reading more files, which pushes even *more* original context out of the window, entering a terminal spiral of agent failure.

---

## How to Prevent Agent Drift

To get the most out of coding agents, you need to manage their context proactively:

1. **Keep Subtasks Tiny:** Do not ask an agent to "build the auth flow." Instead, ask it to "create a helper to sign JWTs" and verify it before continuing.
2. **Clean Up Terminal Output:** Clear massive logs and only pass relevant segments of errors to the model.
3. **Use Specialized Context Management Layers:** Tools that use structured semantic memory help keep the prompt clean by pruning unnecessary logs and keeping essential objective files pinned.
