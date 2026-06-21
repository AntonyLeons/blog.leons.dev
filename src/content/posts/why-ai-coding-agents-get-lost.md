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

At first, the agent works like magic. It reads a file, edits a line, runs a test, and fixes your bug in seconds. But as the task grows in complexity (requiring changes across multiple files, dealing with compiler errors, or pivoting mid-way) something shifts. The agent starts spinning in circles. It reads the same file five times, fabricates APIs that do not exist, and completely forgets the original bug you asked it to fix.

Why does this happen? The answer lies in **Context Drift**.

Let's look under the hood at how an agent's memory behaves, and try out interactive widgets illustrating each failure mode.

---

## Why Agents Fail: The Three Core Drivers

Now let's explore the three main reasons why AI agents lose focus on complex projects.

### 1. Context Pollution

When you read a file as a human, you look only at the lines of interest. But an AI agent lacks our organic filtering ability. When an agent opens a file, it must ingest the **entire file** to prevent syntax errors or missing definitions.

Furthermore, every tool call has overhead:
- **System Wrappers:** Rules explaining how to interpret tool results.
- **JSON Schemas:** Heavy definitions detailing what parameters a tool accepts.
- **Log Bloat:** If a build command returns 300 lines of warnings, all 300 lines are fed back into the context.

As a result, your context window fills up with system headers, tool descriptions, and build output instead of the source code.

#### Interactive Context Pollution Visualizer
Adjust the sliders below to see how adding tools, codebase files, or build logs \"pollutes\" the context window, leaving very little room for actual reasoning.

<div class="agent-widget" id="widget-pollution">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">Context Window Allocation</h4>
<div class="pollution-bar-container">
<div class="pollution-bar">
<div class="bar-segment seg-system" style="width: 12.5%">System</div>
<div class="bar-segment seg-tools" style="width: 10%">Tools</div>
<div class="bar-segment seg-files" style="width: 25%">Files</div>
<div class="bar-segment seg-logs" style="width: 9.3%">Logs</div>
<div class="bar-segment seg-free" style="width: 43.2%">Free</div>
</div>
</div>
<div class="pollution-legend">
<div class="legend-item"><span class="legend-dot dot-system"></span> System Prompt: <span id="lbl-poll-system">4,000</span> tkn</div>
<div class="legend-item"><span class="legend-dot dot-tools"></span> Tool Schemas: <span id="lbl-poll-tools">3,200</span> tkn</div>
<div class="legend-item"><span class="legend-dot dot-files"></span> Code Files: <span id="lbl-poll-files">8,000</span> tkn</div>
<div class="legend-item"><span class="legend-dot dot-logs"></span> Terminal Logs: <span id="lbl-poll-logs">3,000</span> tkn</div>
<div class="legend-item"><span class="legend-dot dot-free"></span> Remaining: <span id="lbl-poll-free">13,800</span> tkn</div>
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Pollution Config</h4>
<div class="slider-group">
<label for="poll-slider-tools">Registered Tools: <span id="poll-val-tools">8</span> tools</label>
<input type="range" id="poll-slider-tools" min="3" max="30" value="8">
<span class="db-hint">Each tool adds JSON schema descriptions to prompt.</span>
</div>
<div class="slider-group">
<label for="poll-slider-files">Codebase File Size: <span id="poll-val-files">Medium</span></label>
<input type="range" id="poll-slider-files" min="1" max="3" value="2">
<span class="db-hint">Large files force massive context consumption.</span>
</div>
<div class="slider-group">
<label for="poll-slider-logs">Terminal Logs: <span id="poll-val-logs">Normal</span></label>
<input type="range" id="poll-slider-logs" min="0" max="2" value="1">
<span class="db-hint">Warnings and errors add stack traces to context.</span>
</div>
<div class="pollution-metrics">
<div class="poll-metric-row">
<span>Total Overhead:</span>
<span id="poll-metric-overhead" class="text-warn">56.8%</span>
</div>
<div class="poll-metric-row">
<span>Remaining Capacity:</span>
<span id="poll-metric-free-pct" class="text-success">43.2%</span>
</div>
</div>
<div id="poll-warning" class="poll-badge badge-warning" style="display: none;">WARNING: High Context Pollution!</div>
</div>
</div>
</div>

---

### 2. Attention Decay (Recency Bias)

Large language models do not treat all elements inside their context window equally. Due to the way attention mechanisms are trained, models exhibit **recency bias** (paying attention to the very end of the prompt) and **priming bias** (paying attention to the system instructions at the very beginning).

The middle of the context window is often ignored - a phenomenon researchers call the **"Lost in the Middle"** problem. 

If your task description is pushed into the middle of a 100,000 token context window, the model starts to overlook details. It will prioritize whatever you said in your last message, completely ignoring constraints defined at the beginning.

#### Interactive Attention Decay Chart
Move the original instructions block to see how task placement affects the attention retention of the model. Note the U-shaped attention distribution.

<div class="agent-widget" id="widget-attention">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">Model Attention Distribution</h4>
<div class="chart-container">
<svg viewBox="0 0 400 180" class="attention-svg">
<line x1="0" y1="20" x2="400" y2="20" stroke="#334155" stroke-dasharray="4 4" />
<line x1="0" y1="160" x2="400" y2="160" stroke="#334155" stroke-dasharray="4 4" />
<line x1="200" y1="0" x2="200" y2="180" stroke="#334155" stroke-dasharray="2 2" />
<path d="M 10 20 Q 200 240 390 40" fill="none" stroke="#64748b" stroke-width="3" />
<path id="active-curve" d="M 10 20 Q 200 240 390 40" fill="none" stroke="#3eb0ef" stroke-width="4" />
<circle id="attention-dot" cx="200" cy="130" r="8" fill="#fecd35" class="pulsing-dot" />
<text x="15" y="15" fill="#94a3b8" font-size="10" font-family="monospace">System (Start)</text>
<text x="175" y="175" fill="#94a3b8" font-size="10" font-family="monospace">Middle</text>
<text x="315" y="15" fill="#94a3b8" font-size="10" font-family="monospace">Recent (End)</text>
</svg>
</div>
<div class="prompt-stack-visualizer">
<div class="prompt-part part-system" id="part-sys">System Prompt / Setup</div>
<div class="prompt-part part-middle" id="part-mid">Files & Logs Context</div>
<div class="prompt-part part-recent" id="part-rec">Recent User Message</div>
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Attention Control</h4>
<p class="db-hint" style="margin-bottom: 15px;">
Choose where your **Original Task Instructions** are currently positioned inside the context window:
</p>
<div class="btn-group-vertical">
<button class="db-btn btn-attention-pos" data-pos="0">Beginning of Prompt</button>
<button class="db-btn btn-attention-pos active" data-pos="1">Middle of Prompt</button>
<button class="db-btn btn-attention-pos" data-pos="2">End of Prompt</button>
</div>
<div class="attention-metrics" style="margin-top: 15px;">
<div class="poll-metric-row">
<span>Task Attention:</span>
<span id="attention-val-percent" class="text-danger">15%</span>
</div>
<div class="poll-metric-row">
<span>Model Response:</span>
<span id="attention-val-status" class="text-danger">Hallucinating / Ignoring rules</span>
</div>
</div>
<div class="attention-desc-box" id="attention-desc">
The instructions are buried under codebase files and build errors. The model falls victim to the \"Lost in the Middle\" effect, ignoring constraints and guessing API shapes.
</div>
</div>
</div>
</div>

---

### 3. Hallucinated Assumptions

When an agent's memory gets pruned, it loses key facts (for example, how the database was structured or which dependencies were installed). Because LLMs are designed to predict the next word, they do not stop when they are missing facts. Instead, they **assume** details:
- *“The port must be `8080`.”*
- *“The auth helper function must be imported from `helpers.ts`.”*
- *“This class has a `loginUser()` method.”*

These wrong assumptions lead to code changes that trigger build errors. Fixing these errors requires reading more files, which pushes even more original context out of the window, entering a terminal spiral of agent failure.

#### Interactive Context Drift Simulator
Configure the context size limit, then click through the steps to see how a typical multi-file coding loop fills up memory. Watch how older blocks (the original task) get pushed above the limit line and are forgotten, triggering hallucinated assumptions.

<div class="agent-widget" id="widget-drift">
<div class="widget-main">
<div class="widget-visual-col">
<h4 class="widget-visual-title">Active Context Stack</h4>
<div class="drift-stack-wrapper">
<div class="drift-limit-line" id="drift-limit-line">
<span>Context Limit</span>
</div>
<div class="drift-stack" id="drift-stack">
<!-- Populated dynamically -->
</div>
</div>
</div>
<div class="widget-control-col">
<h4 class="db-card-title">Drift Simulation</h4>
<div class="slider-group" style="margin-bottom: 10px;">
<label for="drift-slider-limit">Context Limit: <span id="drift-val-limit">32</span>k tokens</label>
<input type="range" id="drift-slider-limit" min="16" max="64" step="16" value="32">
<span class="db-hint">Smaller context sizes cause task context to drop off earlier.</span>
</div>
<div class="step-controls">
<button id="drift-btn-prev" class="db-btn db-btn-secondary" disabled>Back</button>
<button id="drift-btn-next" class="db-btn db-btn-primary">Next Step</button>
<button id="drift-btn-reset" class="db-btn db-btn-danger">Reset</button>
</div>
<div class="step-indicator" style="margin: 8px 0;">Step: <span id="drift-step-num">0</span>/5</div>
<div class="step-description" id="drift-step-desc" style="min-height: 70px; background: #090d16; border: 1px solid #334155; padding: 10px; border-radius: 6px; font-size: 12px; line-height: 1.4;">
Agent initialized with system prompt. Ready to start task.
</div>
<div class="attention-metrics" style="margin-top: 15px;">
<div class="poll-metric-row">
<span>Objective Focus:</span>
<span id="drift-metric-focus" class="badge-success" style="padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">100% Focused</span>
</div>
<div class="poll-metric-row">
<span>Tokens:</span>
<span><span id="drift-metric-tokens">9,200</span> / <span id="drift-metric-max">32,000</span></span>
</div>
</div>
<div class="assumptions-card" style="margin-top: 15px; background: #090d16; border: 1px solid #334155; border-radius: 6px; padding: 10px;">
<h5 style="font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-top: 0; margin-bottom: 6px;">Assumptions & Hallucinations</h5>
<ul id="drift-assumptions-list" style="margin: 0; padding-left: 15px; font-size: 11px; line-height: 1.4; color: #64748b; list-style-type: square;">
<li>No assumptions. Model is currently objective-oriented.</li>
</ul>
</div>
</div>
</div>
</div>

---

## How to Prevent Agent Drift

To get the most out of coding agents, you need to manage their context proactively:

1. **Keep Subtasks Tiny:** Do not ask an agent to "build the auth flow." Instead, ask it to "create a helper to sign JWTs" and verify it before continuing.
2. **Clean Up Terminal Output:** Clear massive logs and only pass relevant segments of errors to the model.
3. **Use Specialized Context Management Layers:** Tools that use structured semantic memory help keep the prompt clean by pruning unnecessary logs and keeping essential objective files pinned.

<style>
  .agent-widget {
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

  .agent-widget h3,
  .agent-widget h4,
  .agent-widget h5,
  .agent-widget .widget-visual-title,
  .agent-widget .db-card-title,
  .agent-widget label,
  .agent-widget span,
  .agent-widget select,
  .agent-widget option {
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
    font-size: 12px;
    font-weight: 600;
  }

  .slider-group input[type="range"] {
    width: 100%;
    accent-color: #3eb0ef;
    cursor: pointer;
  }

  .db-hint {
    font-size: 11px;
    color: #94a3b8 !important;
  }

  .db-btn {
    padding: 10px;
    font-size: 12px;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .db-btn-primary {
    background: #3eb0ef;
    color: #0f172a !important;
  }

  .db-btn-primary:hover {
    background: #60a5fa;
  }

  .db-btn-secondary {
    background: #475569;
    color: #cbd5e1 !important;
  }

  .db-btn-secondary:hover {
    background: #64748b;
  }

  .db-btn-danger {
    background: #f05230;
    color: #ffffff !important;
  }

  .db-btn-danger:hover {
    background: #ef4444;
  }

  .db-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Widget 1 Pollution Styles */
  .pollution-bar-container {
    width: 100%;
    margin-top: 10px;
  }

  .pollution-bar {
    display: flex;
    height: 35px;
    border-radius: 6px;
    overflow: hidden;
    background: #090d16;
    border: 1px solid #334155;
  }

  .bar-segment {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  .seg-system { background: rgba(62, 176, 239, 0.85); color: #000 !important; }
  .seg-tools { background: rgba(164, 208, 55, 0.85); color: #000 !important; }
  .seg-files { background: rgba(96, 165, 250, 0.85); color: #000 !important; }
  .seg-logs { background: rgba(240, 82, 48, 0.85); color: #fff !important; }
  .seg-free { background: #1e293b; color: #cbd5e1 !important; }

  .pollution-legend {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    margin-top: 15px;
    background: #090d16;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #334155;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #cbd5e1 !important;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .dot-system { background: #3eb0ef; }
  .dot-tools { background: #a4d037; }
  .dot-files { background: #60a5fa; }
  .dot-logs { background: #f05230; }
  .dot-free { background: #10b981; }

  .pollution-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid #334155;
    padding-top: 12px;
    margin-top: 5px;
  }

  .poll-metric-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: bold;
  }

  .text-success { color: #10b981 !important; }
  .text-warn { color: #fecd35 !important; }
  .text-danger { color: #f05230 !important; }

  .poll-badge {
    font-size: 11px;
    font-weight: bold;
    padding: 6px 8px;
    border-radius: 4px;
    text-align: center;
  }

  .badge-warning {
    background: rgba(254, 205, 53, 0.2);
    color: #fecd35 !important;
    border: 1px solid #fecd35;
  }

  /* Widget 2 Attention Decay Styles */
  .chart-container {
    background: #090d16;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 180px;
  }

  .attention-svg {
    width: 100%;
    height: auto;
    max-width: 400px;
    overflow: visible;
  }

  .pulsing-dot {
    transition: cx 0.4s cubic-bezier(0.16, 1, 0.3, 1), cy 0.4s cubic-bezier(0.16, 1, 0.3, 1), fill 0.3s;
    animation: dotPulse 1s infinite alternate;
  }

  @keyframes dotPulse {
    from { r: 6; }
    to { r: 9; }
  }

  .prompt-stack-visualizer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    margin-top: 15px;
  }

  .prompt-part {
    padding: 8px;
    font-size: 11px;
    font-weight: bold;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    transition: all 0.3s ease;
  }

  .part-system { background: rgba(62, 176, 239, 0.15); border-left: 4px solid #3eb0ef; color: #bae6fd !important; }
  .part-middle { background: rgba(255, 255, 255, 0.05); border-left: 4px solid #475569; color: #94a3b8 !important; }
  .part-recent { background: rgba(164, 208, 55, 0.15); border-left: 4px solid #a4d037; color: #d9f99d !important; }

  .prompt-part.active-task-container {
    outline: 2px solid #fecd35;
    box-shadow: 0 0 12px rgba(254, 205, 53, 0.6);
    transform: scale(1.02);
  }

  .btn-group-vertical {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn-attention-pos {
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid #475569;
    background: #1e293b;
    color: #cbd5e1 !important;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-attention-pos:hover {
    background: #334155;
    border-color: #64748b;
  }

  .btn-attention-pos.active {
    background: #3eb0ef;
    border-color: #3eb0ef;
    color: #0f172a !important;
  }

  .attention-desc-box {
    font-size: 11px;
    line-height: 1.4;
    color: #f1f5f9 !important;
    background: #090d16;
    border: 1px solid #334155;
    padding: 12px;
    border-radius: 6px;
    min-height: 70px;
  }

  /* Widget 3 Drift Styles */
  .drift-stack-wrapper {
    position: relative;
    background: #090d16;
    border: 2px solid #334155;
    border-radius: 8px;
    flex-grow: 1;
    min-height: 300px;
    height: 340px;
    overflow: hidden;
    display: flex;
    flex-direction: column-reverse;
    padding: 10px;
    box-sizing: border-box;
  }

  .drift-limit-line {
    position: absolute;
    left: 0;
    width: 100%;
    border-top: 2px dashed #f05230;
    z-index: 10;
    pointer-events: none;
    transition: bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .drift-limit-line span {
    position: absolute;
    right: 10px;
    top: -16px;
    font-size: 9px;
    font-weight: 800;
    color: #f05230;
    background: #090d16;
    padding: 2px 6px;
    border: 1px solid #f05230;
    border-radius: 3px;
  }

  .drift-stack {
    display: flex;
    flex-direction: column-reverse;
    gap: 6px;
    width: 100%;
    z-index: 5;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .context-block {
    width: 100%;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 10px;
    font-weight: bold;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0 !important;
    min-height: 26px !important;
    animation: slideInUp 0.3s ease forwards;
    transition: background 0.3s, border-color 0.3s, opacity 0.3s, transform 0.3s;
  }

  .block-system { background: rgba(62, 176, 239, 0.22); border-left: 3px solid #3eb0ef; color: #bae6fd !important; }
  .block-tools { background: rgba(164, 208, 55, 0.22); border-left: 3px solid #a4d037; color: #d9f99d !important; }
  .block-task { background: rgba(254, 205, 53, 0.22); border-left: 3px solid #fecd35; color: #fef08a !important; }
  .block-search { background: rgba(173, 38, 180, 0.22); border-left: 3px solid #ad26b4; color: #f5d0fe !important; }
  .block-files { background: rgba(96, 165, 250, 0.22); border-left: 3px solid #60a5fa; color: #bfdbfe !important; }
  .block-logs { background: rgba(240, 82, 48, 0.22); border-left: 3px solid #f05230; color: #fee2e2 !important; }
  .block-pivot { background: rgba(236, 72, 153, 0.22); border-left: 3px solid #ec4899; color: #fbcfe8 !important; }

  .block-forgotten {
    background: rgba(71, 85, 105, 0.15) !important;
    border-left: 3px solid #475569 !important;
    color: #64748b !important;
    text-decoration: line-through;
    opacity: 0.5;
  }

  .step-controls {
    display: flex;
    gap: 8px;
  }

  .step-controls button {
    flex: 1;
  }

  .focus-badge {
    font-size: 11px;
    font-weight: 800;
    padding: 3px 6px;
    border-radius: 4px;
    display: inline-block;
  }

  .badge-success {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981 !important;
    border: 1px solid #10b981;
  }

  .badge-danger {
    background: rgba(240, 82, 48, 0.2);
    color: #f05230 !important;
    border: 1px solid #f05230;
    animation: dangerGlow 0.8s infinite alternate;
  }

  @keyframes dangerGlow {
    from { box-shadow: 0 0 2px rgba(240, 82, 48, 0.4); }
    to { box-shadow: 0 0 10px rgba(240, 82, 48, 0.8); }
  }

  .step-indicator {
    font-size: 12px;
    font-weight: bold;
    color: #cbd5e1 !important;
  }

  /* Responsive styling */
  @media (max-width: 820px) {
    .widget-main {
      grid-template-columns: 1fr;
    }
    .agent-widget {
      padding: 15px;
    }
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Widget 1: Context Pollution
    // ==========================================
    const toolsSlider = document.getElementById('poll-slider-tools');
    const filesSlider = document.getElementById('poll-slider-files');
    const logsSlider = document.getElementById('poll-slider-logs');

    if (toolsSlider) {
      const valTools = document.getElementById('poll-val-tools');
      const valFiles = document.getElementById('poll-val-files');
      const valLogs = document.getElementById('poll-val-logs');

      const lblSystem = document.getElementById('lbl-poll-system');
      const lblTools = document.getElementById('lbl-poll-tools');
      const lblFiles = document.getElementById('lbl-poll-files');
      const lblLogs = document.getElementById('lbl-poll-logs');
      const lblFree = document.getElementById('lbl-poll-free');

      const segSystem = document.querySelector('.seg-system');
      const segTools = document.querySelector('.seg-tools');
      const segFiles = document.querySelector('.seg-files');
      const segLogs = document.querySelector('.seg-logs');
      const segFree = document.querySelector('.seg-free');

      const metricOverhead = document.getElementById('poll-metric-overhead');
      const metricFreePct = document.getElementById('poll-metric-free-pct');
      const pollWarning = document.getElementById('poll-warning');

      function updatePollution() {
        const systemTokens = 4000;
        const tools = parseInt(toolsSlider.value);
        const filesSizeVal = parseInt(filesSlider.value);
        const logsVal = parseInt(logsSlider.value);
        
        valTools.textContent = tools;
        
        let filesTokens = 8000;
        let filesLabel = \"Medium\";
        if (filesSizeVal === 1) {
          filesTokens = 2000;
          filesLabel = \"Small\";
        } else if (filesSizeVal === 3) {
          filesTokens = 18000;
          filesLabel = \"Large\";
        }
        valFiles.textContent = filesLabel;
        
        let logsTokens = 3000;
        let logsLabel = \"Normal\";
        if (logsVal === 0) {
          logsTokens = 0;
          logsLabel = \"None\";
        } else if (logsVal === 2) {
          logsTokens = 10000;
          logsLabel = \"Verbose\";
        }
        valLogs.textContent = logsLabel;
        
        const toolsTokens = tools * 400;
        const totalLimit = 32000;
        const overhead = systemTokens + toolsTokens + filesTokens + logsTokens;
        const free = Math.max(0, totalLimit - overhead);
        
        lblSystem.textContent = systemTokens.toLocaleString();
        lblTools.textContent = toolsTokens.toLocaleString();
        lblFiles.textContent = filesTokens.toLocaleString();
        lblLogs.textContent = logsTokens.toLocaleString();
        lblFree.textContent = free.toLocaleString();
        
        const sysPct = (systemTokens / totalLimit) * 100;
        const toolsPct = (toolsTokens / totalLimit) * 100;
        const filesPct = (filesTokens / totalLimit) * 100;
        const logsPct = (logsTokens / totalLimit) * 100;
        const freePct = (free / totalLimit) * 100;
        
        segSystem.style.width = `${sysPct}%`;
        segTools.style.width = `${toolsPct}%`;
        segFiles.style.width = `${filesPct}%`;
        segLogs.style.width = `${logsPct}%`;
        segFree.style.width = `${freePct}%`;
        
        segSystem.textContent = sysPct > 10 ? 'System' : '';
        segTools.textContent = toolsPct > 10 ? 'Tools' : '';
        segFiles.textContent = filesPct > 10 ? 'Files' : '';
        segLogs.textContent = logsPct > 10 ? 'Logs' : '';
        segFree.textContent = freePct > 10 ? 'Free' : '';
        
        const overheadPct = ((overhead / totalLimit) * 100).toFixed(1);
        const freePctStr = ((free / totalLimit) * 100).toFixed(1);
        
        metricOverhead.textContent = `${overheadPct}%`;
        metricFreePct.textContent = `${freePctStr}%`;
        
        if (freePct < 15) {
          pollWarning.style.display = 'block';
          metricFreePct.className = 'text-danger';
          metricOverhead.className = 'text-danger';
          segFree.style.background = '#f05230';
        } else {
          pollWarning.style.display = 'none';
          metricFreePct.className = 'text-success';
          metricOverhead.className = 'text-warn';
          segFree.style.background = '#10b981';
        }
      }

      toolsSlider.addEventListener('input', updatePollution);
      filesSlider.addEventListener('input', updatePollution);
      logsSlider.addEventListener('input', updatePollution);
      updatePollution();
    }

    // ==========================================
    // Widget 2: Attention Decay
    // ==========================================
    const btnAttentionPos = document.querySelectorAll('.btn-attention-pos');
    if (btnAttentionPos.length > 0) {
      const attentionDot = document.getElementById('attention-dot');
      const attentionValPercent = document.getElementById('attention-val-percent');
      const attentionValStatus = document.getElementById('attention-val-status');
      const attentionDesc = document.getElementById('attention-desc');

      const partSys = document.getElementById('part-sys');
      const partMid = document.getElementById('part-mid');
      const partRec = document.getElementById('part-rec');

      const attentionPositions = [
        {
          cx: 40,
          cy: 22,
          percent: \"95%\",
          status: \"Strong focus (ignoring workspace details)\",
          desc: \"The task instructions are at the beginning of the context (priming). The model remembers them clearly but might struggle to reconcile them with files placed in the middle of the context.\",
          color: \"#10b981\"
        },
        {
          cx: 200,
          cy: 130,
          percent: \"15%\",
          status: \"Lost in the middle! (Will ignore instructions)\",
          desc: \"The task instructions are buried under codebase files and build errors. The model falls victim to the 'Lost in the Middle' effect, ignoring constraints and guessing API shapes.\",
          color: \"#f05230\"
        },
        {
          cx: 360,
          cy: 35,
          percent: \"85%\",
          status: \"Strong focus (recency bias priority)\",
          desc: \"The task instructions are at the very end of the prompt (recent input). The model focuses heavily on this, but will likely forget initial system constraints and configurations.\",
          color: \"#fecd35\"
        }
      ];

      function updateAttention(posIndex) {
        btnAttentionPos.forEach((btn, idx) => {
          if (idx === posIndex) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
        
        const data = attentionPositions[posIndex];
        
        attentionDot.setAttribute('cx', data.cx);
        attentionDot.setAttribute('cy', data.cy);
        attentionDot.style.setProperty('--dot-color', data.color);
        attentionDot.setAttribute('fill', data.color);
        
        attentionValPercent.textContent = data.percent;
        attentionValPercent.className = posIndex === 1 ? 'text-danger' : (posIndex === 0 ? 'text-success' : 'text-warn');
        attentionValStatus.textContent = data.status;
        attentionValStatus.className = posIndex === 1 ? 'text-danger' : (posIndex === 0 ? 'text-success' : 'text-warn');
        attentionDesc.textContent = data.desc;
        
        partSys.classList.remove('active-task-container');
        partMid.classList.remove('active-task-container');
        partRec.classList.remove('active-task-container');
        
        if (posIndex === 0) {
          partSys.classList.add('active-task-container');
        } else if (posIndex === 1) {
          partMid.classList.add('active-task-container');
        } else if (posIndex === 2) {
          partRec.classList.add('active-task-container');
        }
      }

      btnAttentionPos.forEach((btn, idx) => {
        btn.addEventListener('click', () => updateAttention(idx));
      });

      updateAttention(1);
    }

    // ==========================================
    // Widget 3: Context Drift Simulator
    // ==========================================
    const driftSliderLimit = document.getElementById('drift-slider-limit');
    if (driftSliderLimit) {
      const driftValLimit = document.getElementById('drift-val-limit');
      const driftBtnPrev = document.getElementById('drift-btn-prev');
      const driftBtnNext = document.getElementById('drift-btn-next');
      const driftBtnReset = document.getElementById('drift-btn-reset');
      const driftStepNum = document.getElementById('drift-step-num');
      const driftStepDesc = document.getElementById('drift-step-desc');
      const driftMetricFocus = document.getElementById('drift-metric-focus');
      const driftMetricTokens = document.getElementById('drift-metric-tokens');
      const driftMetricMax = document.getElementById('drift-metric-max');
      const driftAssumptionsList = document.getElementById('drift-assumptions-list');
      const driftStack = document.getElementById('drift-stack');
      const driftLimitLine = document.getElementById('drift-limit-line');

      let driftState = {
        limit: 32000,
        step: 0
      };

      const driftStepsData = [
        {
          title: \"Agent Initialized\",
          desc: \"The agent is loaded with the base system prompt, registered tool schemas, and your task request: 'Fix login authentication flow'.\",
          blocks: [
            { id: \"system\", name: \"System Prompt\", tokens: 4000, type: \"block-system\" },
            { id: \"tools\", name: \"Tool Schemas (8 tools)\", tokens: 3200, type: \"block-tools\" },
            { id: \"task\", name: \"Original Task: Fix Login Bug\", tokens: 2000, type: \"block-task\" }
          ]
        },
        {
          title: \"Workspace Search\",
          desc: \"The agent searches the workspace for auth references. Grep outputs and file lists are added to the context.\",
          blocks: [
            { id: \"system\", name: \"System Prompt\", tokens: 4000, type: \"block-system\" },
            { id: \"tools\", name: \"Tool Schemas (8 tools)\", tokens: 3200, type: \"block-tools\" },
            { id: \"task\", name: \"Original Task: Fix Login Bug\", tokens: 2000, type: \"block-task\" },
            { id: \"search\", name: \"Search Logs & Grep\", tokens: 3000, type: \"block-search\" }
          ]
        },
        {
          title: \"Read Code Files\",
          desc: \"The agent reads the contents of 'auth.ts' and 'db.ts' files to understand the auth flow. The source code is appended to memory.\",
          blocks: [
            { id: \"system\", name: \"System Prompt\", tokens: 4000, type: \"block-system\" },
            { id: \"tools\", name: \"Tool Schemas (8 tools)\", tokens: 3200, type: \"block-tools\" },
            { id: \"task\", name: \"Original Task: Fix Login Bug\", tokens: 2000, type: \"block-task\" },
            { id: \"search\", name: \"Search Logs & Grep\", tokens: 3000, type: \"block-search\" },
            { id: \"files\", name: \"File Contents: auth.ts & db.ts\", tokens: 9000, type: \"block-files\" }
          ]
        },
        {
          title: \"Test Execution & Compile\",
          desc: \"The agent runs tests. A massive 8,000-token trace log of compilation errors and warnings is loaded back into context.\",
          blocks: [
            { id: \"system\", name: \"System Prompt\", tokens: 4000, type: \"block-system\" },
            { id: \"tools\", name: \"Tool Schemas (8 tools)\", tokens: 3200, type: \"block-tools\" },
            { id: \"task\", name: \"Original Task: Fix Login Bug\", tokens: 2000, type: \"block-task\" },
            { id: \"search\", name: \"Search Logs & Grep\", tokens: 3000, type: \"block-search\" },
            { id: \"files\", name: \"File Contents: auth.ts & db.ts\", tokens: 9000, type: \"block-files\" },
            { id: \"logs\", name: \"Linting & Compile Logs\", tokens: 8000, type: \"block-logs\" }
          ]
        },
        {
          title: \"Mid-Task Pivot\",
          desc: \"You interrupt the agent and add a new instruction: 'Also log OAuth callback payloads'. This requirement is pushed onto the stack.\",
          blocks: [
            { id: \"system\", name: \"System Prompt\", tokens: 4000, type: \"block-system\" },
            { id: \"tools\", name: \"Tool Schemas (8 tools)\", tokens: 3200, type: \"block-tools\" },
            { id: \"task\", name: \"Original Task: Fix Login Bug\", tokens: 2000, type: \"block-task\" },
            { id: \"search\", name: \"Search Logs & Grep\", tokens: 3000, type: \"block-search\" },
            { id: \"files\", name: \"File Contents: auth.ts & db.ts\", tokens: 9000, type: \"block-files\" },
            { id: \"logs\", name: \"Linting & Compile Logs\", tokens: 8000, type: \"block-logs\" },
            { id: \"pivot\", name: \"User Pivot: Log OAuth callback\", tokens: 2500, type: \"block-pivot\" }
          ]
        },
        {
          title: \"Context Drift\",
          desc: \"The agent loads new files ('oauth.ts') and logs. Total memory exceeds the limit line, pruning the oldest blocks at the top (including your original task instructions)!\",
          blocks: [
            { id: \"system\", name: \"System Prompt\", tokens: 4000, type: \"block-system\" },
            { id: \"tools\", name: \"Tool Schemas (8 tools)\", tokens: 3200, type: \"block-tools\" },
            { id: \"task\", name: \"Original Task: Fix Login Bug\", tokens: 2000, type: \"block-task\" },
            { id: \"search\", name: \"Search Logs & Grep\", tokens: 3000, type: \"block-search\" },
            { id: \"files\", name: \"File Contents: auth.ts & db.ts\", tokens: 9000, type: \"block-files\" },
            { id: \"logs\", name: \"Linting & Compile Logs\", tokens: 8000, type: \"block-logs\" },
            { id: \"pivot\", name: \"User Pivot: Log OAuth callback\", tokens: 2500, type: \"block-pivot\" },
            { id: \"drift-files\", name: \"File Contents: oauth.ts\", tokens: 6000, type: \"block-files\" },
            { id: \"drift-logs\", name: \"OAuth Compile & Run Logs\", tokens: 8000, type: \"block-logs\" }
          ]
        }
      ];

      function updateDriftVisuals() {
        const limitValue = parseInt(driftSliderLimit.value) * 1000;
        driftState.limit = limitValue;
        driftValLimit.textContent = driftSliderLimit.value;
        driftMetricMax.textContent = limitValue.toLocaleString();
        
        const stepData = driftStepsData[driftState.step];
        
        driftStack.innerHTML = '';
        
        let totalTokens = 0;
        stepData.blocks.forEach(b => totalTokens += b.tokens);
        
        driftMetricTokens.textContent = totalTokens.toLocaleString();
        
        let accumTokens = 0;
        let isTaskPruned = false;
        
        stepData.blocks.forEach(b => {
          const heightPercent = Math.max((b.tokens / driftState.limit) * 100, 3);
          const blockEl = document.createElement('div');
          
          let sumFromRecent = 0;
          let blockIndex = stepData.blocks.indexOf(b);
          for (let i = stepData.blocks.length - 1; i >= blockIndex; i--) {
            sumFromRecent += stepData.blocks[i].tokens;
          }
          
          const isPruned = sumFromRecent > driftState.limit;
          
          blockEl.className = `context-block ${b.type}`;
          if (isPruned) {
            blockEl.classList.add('block-forgotten');
            if (b.id === 'task') {
              isTaskPruned = true;
            }
          }
          
          blockEl.style.height = `${heightPercent * 2.8}px`;
          blockEl.innerHTML = `
            <span>${b.name}</span>
            <span>${b.tokens.toLocaleString()} tkn</span>
          `;
          
          driftStack.appendChild(blockEl);
        });
        
        const totalH = Math.max(totalTokens, driftState.limit);
        const limitPosPercent = (driftState.limit / totalH) * 100;
        driftLimitLine.style.bottom = `${limitPosPercent}%`;
        
        driftAssumptionsList.innerHTML = '';
        if (isTaskPruned) {
          driftMetricFocus.className = \"focus-badge badge-danger\";
          driftMetricFocus.textContent = \"OBJECTIVE LOST\";
          
          const assumptions = [
            \"Assumption: The authentication flow works fine now (cannot verify).\",
            \"Assumption: Signup process requires OAuth callbacks directly in router.\",
            \"Assumption: Node.js standard environment supports OAuth callback parameters.\"
          ];
          assumptions.forEach(a => {
            const li = document.createElement('li');
            li.textContent = a;
            driftAssumptionsList.appendChild(li);
          });
        } else if (driftState.step >= 4 && totalTokens > driftState.limit * 0.75) {
          driftMetricFocus.className = \"focus-badge badge-warning\";
          driftMetricFocus.textContent = \"Drifting Focus\";
          const li = document.createElement('li');
          li.textContent = \"Warning: Memory pressure is high. Avoid making large edits.\";
          driftAssumptionsList.appendChild(li);
        } else {
          driftMetricFocus.className = \"focus-badge badge-success\";
          driftMetricFocus.textContent = \"100% Focused\";
          const li = document.createElement('li');
          li.textContent = \"No assumptions. Model is currently objective-oriented.\";
          driftAssumptionsList.appendChild(li);
        }
        
        driftBtnPrev.disabled = driftState.step === 0;
        driftBtnNext.disabled = driftState.step === driftStepsData.length - 1;
      }

      driftSliderLimit.addEventListener('input', updateDriftVisuals);
      driftBtnNext.addEventListener('click', () => {
        if (driftState.step < driftStepsData.length - 1) {
          driftState.step++;
          driftStepNum.textContent = driftState.step;
          updateDriftVisuals();
        }
      });
      driftBtnPrev.addEventListener('click', () => {
        if (driftState.step > 0) {
          driftState.step--;
          driftStepNum.textContent = driftState.step;
          updateDriftVisuals();
        }
      });
      driftBtnReset.addEventListener('click', () => {
        driftState.step = 0;
        driftStepNum.textContent = \"0\";
        updateDriftVisuals();
      });

      updateDriftVisuals();
    }
  });
</script>
