# Ride-Share Surge Ghosting Mitigation & Circuit Breaker Pipeline

> Driver surge gaming lockout, adaptive queue backpressure decay, and automated circuit breaker fallback fleet dispatch.

**Domain:** Mobility & Ride-Sharing Systems  
**Architecture Pattern:** Typed Stage-based Pipeline DAG with Sagas & State Machine  

---

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


---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 22.0.0
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/systemflow-s3-ride-ghosting.git
cd systemflow-s3-ride-ghosting

# Install dependencies
npm install
```

### Running Tests & Typechecks

```bash
# Run the complete test suite (includes race condition & concurrency tests)
npm test

# Build production TypeScript output
npm run build

# Run typechecker
npm run typecheck
```

---

## 🏛️ Pipeline DAG Architecture

All pipeline stages are type-safe and execute in ordered succession. If any stage throws a transient error, compensating saga rollbacks run in reverse order to ensure 100% data consistency.

```
src/
├── core/                  # Embedded zero-dependency Pipeline Engine & Saga Rollback
│   ├── pipeline.ts
│   ├── types.ts
│   ├── logger.ts
│   └── errors.ts
├── stages/                # Modular pipeline stages
├── pipeline.ts            # Stage assembly & DAG orchestrator
├── types.ts               # Domain interfaces & state contracts
└── index.ts               # Public library API export
```

---

## 🚀 GitHub Actions CI

Every commit and pull request runs automated build, typecheck, and vitest race condition tests via `.github/workflows/ci.yml`.

## 📄 License
MIT
