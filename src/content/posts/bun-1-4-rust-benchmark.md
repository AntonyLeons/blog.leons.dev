---
current: post
cover: /assets/images/streamdrop-logo.png
navigation: true
title: "Bun Rewrote Itself in Rust. I Benchmarked the Difference"
description: "Bun 1.4 replaces Zig with Rust. I tested startup, HTTP throughput, memory use, and real file transfers—and found one breaking change."
date: 2026-09-09 15:00:00
tags: ["project"]
class: post-template
subclass: "post"
author: antony
---

Bun 1.4 is not a routine update. The project rewrote Bun from Zig to Rust using claude while keeping JavaScriptCore as its JavaScript engine.

That immediately raises two questions: is it actually faster, and will existing Bun applications continue to work?

I tested both questions against [StreamDrop](https://streamdrop.app/), my open-source, peer-to-peer file-transfer service. It sends files directly between devices without uploading them to permanent cloud storage. You can [try StreamDrop](https://streamdrop.app/) or [browse the source on GitHub](https://github.com/AntonyLeons/streamdrop). The benchmark results are encouraging and we found a breaking change along the way.

## How I tested it

I compared Bun **1.3.14**, the final Zig release, with Bun **1.4.2**, the current Rust release. Both ran from official Linux ARM64 Docker images on an Apple M1 Max, limited to one CPU and 512 MiB of memory.

Each result below is a median rather than the fastest run:

- five runs for startup, memory, and HTTP tests;
- seven runs for the JavaScript and file-transfer tests;
- two HTTP load-generator threads with 64 concurrent connections;
- exact byte-count verification after every file transfer.

This compares two complete releases. It does **not** prove that Rust is inherently faster than Zig. Bun 1.4 also includes a newer JavaScriptCore, allocator changes, native streams, and many other optimisations.

<div class="bun-chart bun-chart-startup" data-bun-chart>
  <h3>Startup time <span>lower is better</span></h3>
  <div class="bun-chart-row"><span class="bun-chart-name">1.3.14 Zig</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:100%"></span></span><strong>9.264 ms</strong></div>
  <div class="bun-chart-row"><span class="bun-chart-name">1.4.2 Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:25.1%"></span></span><strong>2.326 ms</strong></div>
  <p class="bun-chart-note">Bun 1.4 started 3.98× faster.</p>
</div>

## Startup is the clearest win

An empty script started in **2.326 ms** on Bun 1.4.2, down from **9.264 ms** on Bun 1.3.14. That is almost four times faster.

The result is even better than Bun's published claim of a two-times improvement on Linux, although different machines and container overhead make those figures unsuitable for direct comparison.

For a long-running service, a few milliseconds at launch will not transform response times. It matters much more for command-line tools, scripts, tests, and short-lived workers where startup is a meaningful part of the total runtime.

## HTTP throughput improved without changing the application

<div class="bun-chart" data-bun-chart>
  <h3>HTTP throughput <span>higher is better</span></h3>
  <div class="bun-chart-group"><h4>Plain-text response</h4><div class="bun-chart-row"><span class="bun-chart-name">1.3.14 Zig</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:92.5%"></span></span><strong>143,869 req/s</strong></div><div class="bun-chart-row"><span class="bun-chart-name">1.4.2 Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:100%"></span></span><strong>155,497 req/s</strong></div></div>
  <div class="bun-chart-group"><h4>JSON response</h4><div class="bun-chart-row"><span class="bun-chart-name">1.3.14 Zig</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:85.3%"></span></span><strong>121,292 req/s</strong></div><div class="bun-chart-row"><span class="bun-chart-name">1.4.2 Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:100%"></span></span><strong>142,272 req/s</strong></div></div>
  <p class="bun-chart-note">Throughput increased by 8.1% for text and 17.3% for JSON.</p>
</div>

The plain-text server improved from **143,869 to 155,497 requests per second**, an 8.1% gain. Returning a small JSON response improved from **121,292 to 142,272 requests per second**, a 17.3% gain.

A repeated JSON parse-and-stringify workload also completed 19.5% faster. That result deserves extra caution: ordinary JavaScript still runs on JavaScriptCore, so the improvement cannot simply be labelled “Rust is faster”.

At idle, the small server used **51.5 MiB** instead of **90.8 MiB**, a 43.3% reduction. Its sampled idle CPU use fell from 0.16% to 0.04%. CPU percentages that close to zero are noisy, but the direction matches Bun's own findings.

## The StreamDrop transfer test

Synthetic endpoints are useful, but StreamDrop is built to move bytes. I added a benchmark that creates a real session, opens a receiver, claims the transfer channel, uploads a generated file through the raw relay endpoint, consumes the download stream, and verifies the final byte count.

<div class="bun-chart" data-bun-chart>
  <h3>128 MiB StreamDrop relay</h3>
  <div class="bun-chart-group"><h4>Throughput — higher is better</h4><div class="bun-chart-row"><span class="bun-chart-name">1.3.14 Zig</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:65.9%"></span></span><strong>621 MiB/s</strong></div><div class="bun-chart-row"><span class="bun-chart-name">1.4.2 Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:100%"></span></span><strong>943 MiB/s</strong></div></div>
  <div class="bun-chart-group"><h4>Peak memory — lower is better</h4><div class="bun-chart-row"><span class="bun-chart-name">1.3.14 Zig</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:100%"></span></span><strong>117.8 MiB</strong></div><div class="bun-chart-row"><span class="bun-chart-name">1.4.2 Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:57.9%"></span></span><strong>68.2 MiB</strong></div></div>
  <p class="bun-chart-note">51.9% more throughput with 42.1% less peak memory.</p>
</div>

Bun 1.4.2 moved the 128 MiB payload at **943 MiB/s**, up from **621 MiB/s**—a 51.9% improvement. Transfer time fell from 206.1 ms to 135.7 ms, while peak memory dropped from 117.8 MiB to 68.2 MiB. CPU time fell by 37.3%.

Those are the numbers I hoped to find. Then I increased the file size.

## The 256 MiB transfer failed every time

All five 256 MiB transfers completed on Bun 1.3.14. All five failed on Bun 1.4.2.

```text
Request body exceeded maxRequestBodySize
409 receivers_lost
```

Bun 1.4 enforces a 128 MiB default maximum request body. StreamDrop consumes uploads as streams rather than buffering them, but the server rejected the request before the stream could finish.

The fix is small but essential: explicitly set `maxRequestBodySize` when starting `Bun.serve`. I configured StreamDrop with `Number.MAX_SAFE_INTEGER`, then added a regression test that streams 129 MiB and checks every received byte.

After the fix, the full 256 MiB transfer completed on Bun 1.4.2 at **851 MiB/s**, all 268,435,456 bytes arrived intact, and the complete test suite passed: 29 tests, zero failures.

## Should you upgrade?

Yes, but have fun regression testing.

Bun 1.4 delivered its largest improvement exactly where StreamDrop benefits: streaming throughput, memory use, and CPU time. Startup became dramatically faster too. The Rust rewrite did not merely preserve performance; this release moved several practical workloads forward.

But a benchmark that only measured successful 128 MiB transfers would have missed the breaking change. Performance testing should include the edges of the real workload, because an infinitely fast failed request is still a failed request.

If your Bun server accepts large uploads, add an over-limit integration test and configure `maxRequestBodySize` before upgrading. Once that was done, Bun 1.4 was a meaningful improvement for StreamDrop.

Want to see the result for yourself? [Send a file with StreamDrop](https://streamdrop.app/); there is no account to create or [read, run, and contribute to the code on GitHub](https://github.com/AntonyLeons/streamdrop).

<style>
  .bun-chart {
    margin: 2.5em 0;
    padding: 1.4em;
    border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, currentColor 3%, transparent);
  }
  .bun-chart h3 { margin: 0 0 1.1em; font-size: 1.25em; }
  .bun-chart h3 span, .bun-chart h4 { color: #738096; font-size: .72em; font-weight: 500; }
  .bun-chart h4 { margin: 1.4em 0 .6em; text-transform: uppercase; letter-spacing: .06em; }
  .bun-chart-row { display: grid; grid-template-columns: 7.5em minmax(8em, 1fr) 8.5em; gap: .8em; align-items: center; margin: .65em 0; }
  .bun-chart-name, .bun-chart-row strong { font-size: .78em; }
  .bun-chart-row strong { white-space: nowrap; }
  .bun-chart-track { height: 1.25em; overflow: hidden; border-radius: 4px; background: color-mix(in srgb, currentColor 8%, transparent); }
  .bun-chart-bar { display: block; width: var(--bar); height: 100%; border-radius: inherit; transform: scaleX(0); transform-origin: left; transition: transform 800ms cubic-bezier(.22, 1, .36, 1); }
  .bun-chart.is-visible .bun-chart-bar { transform: scaleX(1); }
  .bun-chart .zig { background: #919bad; }
  .bun-chart .rust { background: #ec6637; transition-delay: 110ms; }
  .bun-chart-note { margin: 1.2em 0 0; font-size: .78em; color: #738096; }
  @media (max-width: 600px) {
    .bun-chart-row { grid-template-columns: 5.8em 1fr; }
    .bun-chart-row strong { grid-column: 2; margin-top: -.45em; }
  }
  @media (prefers-reduced-motion: reduce) {
    .bun-chart-bar { transform: none; transition: none; }
  }
</style>

<script>
  const revealBunCharts = () => {
    const charts = document.querySelectorAll('[data-bun-chart]:not([data-observed])');
    if (!('IntersectionObserver' in window)) {
      charts.forEach((chart) => chart.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    charts.forEach((chart) => {
      chart.setAttribute('data-observed', 'true');
      observer.observe(chart);
    });
  };
  document.addEventListener('DOMContentLoaded', revealBunCharts);
  document.addEventListener('astro:page-load', revealBunCharts);
</script>
