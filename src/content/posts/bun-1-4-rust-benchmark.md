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

Bun 1.4 delivered its largest improvement exactly where StreamDrop benefits: streaming throughput, memory use, and CPU time. Startup became dramatically faster too.

But a benchmark that only measured successful 128 MiB transfers would have missed the breaking change. Performance testing should include the edges of the real workload, because an infinitely fast failed request is still a failed request.

If your Bun server accepts large uploads, add an over-limit integration test and configure `maxRequestBodySize` before upgrading.

Want to see the result for yourself? [Send a file with StreamDrop](https://streamdrop.app/); there is no account to create or [read, run, and contribute to the code on GitHub](https://github.com/AntonyLeons/streamdrop).

## Bonus: Ward, from Java to Rust

StreamDrop is not my only project where a runtime change made a noticeable difference. [Ward](https://ward.leons.dev/) is an open-source server dashboard that gives you a quick view of CPU, memory, storage, and uptime. If you want something simple to leave running on a small server, [have a look at the live demo](https://status.leons.dev/).

Ward started as a Java application using Spring Boot and OSHI. The [Rust version, ward-rs](https://github.com/AntonyLeons/ward-rs), uses Axum and sysinfo. I built both local checkouts from source and measured them in Docker, using the same one-CPU and 512 MiB limits.

These measurements were taken on 13 October 2026: Java Ward 2.6.1 at commit `955e326`, and ward-rs 1.0.6 at `77aed22`. The Java image used Temurin 25.0.4.1; the Rust release build used rustc 1.99.0. Both were Linux ARM64 builds on the same Apple M1 Max.

### A smaller background process

<div class="bun-chart" data-bun-chart>
  <h3>Ward idle memory <span>lower is better</span></h3>
  <div class="bun-chart-row"><span class="bun-chart-name">Java</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:100%"></span></span><strong>193.6 MiB</strong></div>
  <div class="bun-chart-row"><span class="bun-chart-name">Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:2.01%"></span></span><strong>3.9 MiB</strong></div>
  <p class="bun-chart-note">98.0% less resident process memory across five fresh starts.</p>
</div>

The Rust process used **3.9 MiB of idle resident memory**, compared with **193.6 MiB** for Java, a reduction of about **98%**. After the API requests, those figures were still only 4.0 MiB and 195.5 MiB respectively.

For a monitoring dashboard, that is a practical benefit: Ward should leave most of the server's memory available for the applications it monitors.

### Startup, storage, and API latency

| Measurement | Java Ward | ward-rs |
| --- | ---: | ---: |
| Process launch to first valid API response | 4,139.5 ms | 3.5 ms |
| Idle resident process memory | 193.6 MiB | 3.9 MiB |
| Resident memory after API requests | 195.5 MiB | 4.0 MiB |
| Application artifact | 26.2 MiB JAR | 7.6 MiB executable |
| Production Docker image, uncompressed | 373.6 MiB | 103.6 MiB |
| Warm uptime API response | 1.12 ms | 0.12 ms |
| Usage API response | 1,024.7 ms | 0.11 ms |

<div class="bun-chart" data-bun-chart>
  <h3>Ward deployment size <span>lower is better</span></h3>
  <div class="bun-chart-group"><h4>Application artifact</h4><div class="bun-chart-row"><span class="bun-chart-name">Java JAR</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:100%"></span></span><strong>26.2 MiB</strong></div><div class="bun-chart-row"><span class="bun-chart-name">Rust binary</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:28.84%"></span></span><strong>7.6 MiB</strong></div></div>
  <div class="bun-chart-group"><h4>Production Docker image</h4><div class="bun-chart-row"><span class="bun-chart-name">Java</span><span class="bun-chart-track"><span class="bun-chart-bar zig" style="--bar:100%"></span></span><strong>373.6 MiB</strong></div><div class="bun-chart-row"><span class="bun-chart-name">Rust</span><span class="bun-chart-track"><span class="bun-chart-bar rust" style="--bar:27.72%"></span></span><strong>103.6 MiB</strong></div></div>
  <p class="bun-chart-note">The executable is 71.2% smaller; the complete runtime image is 72.3% smaller. Each pair uses its own scale.</p>
</div>

Fresh Rust processes reached the first valid uptime response in **3.1–8.3 ms**, while Java took **3.8–4.3 seconds**. This includes application initialisation and the first API request, but excludes Docker startup and compilation. Filesystem caches were warm, and the readiness probe ran every two milliseconds, so the smallest timings should be read as a few milliseconds rather than a precise sub-millisecond claim.

The production Rust image is **103.6 MiB**, substantially smaller than Java's **373.6 MiB**. A JAR still needs its Java runtime, which is why I measured both the application file and the complete deployment image.

Idle CPU was about **0.10%** for Java. Rust accumulated no measurable process CPU time during the ten-second idle windows. That means below this test's measurement resolution, rather than a promise of zero CPU use in production. An idle dashboard and one being polled by a browser are different workloads.

### Why the usage response is so different

Java's usage endpoint deliberately waits one second between CPU samples. Rust returns cached system metrics and refreshes them when at least a second has elapsed. The **1,024.7 ms versus 0.11 ms** result therefore reflects different sampling strategies as well as the implementation change. It does not mean Rust can measure the hardware thousands of times faster.

For a simpler comparison, the uptime endpoint responded in **1.12 ms versus 0.12 ms**. Those are local, sequential requests inside the container, with a Python client opening a connection for each request; they measure observed latency rather than maximum throughput. Neither implementation is likely to make a human wait for an uptime update.

I used the median of five fresh-process runs. Each run checked the uptime response fields, waited three seconds before measuring process RSS, sampled idle CPU for ten seconds, then made 100 uptime requests and three usage requests. No host filesystem was mounted into either application, so this tests the container dashboard, not the accuracy of host monitoring or browser rendering. Artifact and image sizes are single measurements of the built outputs.

The result compares the complete applications: JVM and Spring Boot against a native Rust executable, with different libraries and caching decisions. For Ward, the clearest win is the much smaller memory footprint, followed by startup and deployment size.

If that sounds useful, [get started with Ward](https://ward.leons.dev/), [try the dashboard](https://status.leons.dev/), or [browse ward-rs on GitHub](https://github.com/AntonyLeons/ward-rs). The [Java implementation](https://github.com/AntonyLeons/Ward) is available too if you want to compare the code.

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
