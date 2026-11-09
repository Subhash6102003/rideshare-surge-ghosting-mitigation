# S3 — Ride-Share Surge Ghosting & Circuit Breaker: Architecture

## Problem

During peak surge events (stadium exits, New Year's Eve), drivers often "ghost" (decline or let timeout) ride requests to game surge multipliers higher.
The dispatch engine attempts re-matching, but as ghosts compound:
- Request queues explode with stale rides.
- Customers wait 10+ minutes and cancel.
- Thousands of computing cycles are spent matching rides that never happen.

## Solution Architecture: Reliability Penalties + Adaptive Queue Backpressure + Circuit Breaker

```
Rider Request
      ↓
[1. Priority & Backpressure Decay]  → Imposes exponential backoff delays on retries
      ↓
[2. Driver Reliability Filter]      → Strips surge pricing incentives from serial ghosters
      ↓
[3. Circuit Breaker Evaluation]
    ├── CLOSED (< 25% ghost rate) → Standard driver assignment
    ├── HALF_OPEN (25% - 40%)     → Tightens offer timeout from 15s to 5s
    └── OPEN (> 40% ghost rate)   → Activates guaranteed flat-rate fallback fleet
```
