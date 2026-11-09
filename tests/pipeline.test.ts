import { describe, it, expect, beforeEach } from 'vitest';
import { createRideDispatchPipeline } from '../src/pipeline.js';
import { DispatchEngineStore } from '../src/dispatch-store.js';
import type { RideRequest } from '../src/types.js';

describe('S3 — Driver Surge Ghosting & Circuit Breaker Pipeline', () => {
  let store: DispatchEngineStore;
  let pipeline: ReturnType<typeof createRideDispatchPipeline>;

  beforeEach(() => {
    store = new DispatchEngineStore();
    pipeline = createRideDispatchPipeline(store);

    store.registerDriver('DRV-1', 90);
    store.registerDriver('DRV-2', 85);
  });

  const makeRide = (id: string, attemptCount: number = 1): RideRequest => ({
    rideId: `ride-${id}`,
    riderId: `rider-${id}`,
    pickupZone: 'ZONE_STADIUM_EAST',
    surgeMultiplier: 2.8,
    attemptCount,
    requestedAt: Date.now(),
  });

  it('successfully matches request when circuit breaker is CLOSED', async () => {
    const res = await pipeline.dispatch(makeRide('1'));
    expect(res.status).toBe('success');
    expect(res.output?.status).toBe('MATCHED');
    expect(res.output?.circuitBreakerState).toBe('CLOSED');
  });

  it('locks out driver from surge incentives if they repeatedly ghost offers', () => {
    store.recordOfferOutcome('DRV-1', false); // ghost 1
    store.recordOfferOutcome('DRV-1', false); // ghost 2
    store.recordOfferOutcome('DRV-1', false); // ghost 3

    const driver = store.getDriver('DRV-1');
    expect(driver?.isLockedOutFromSurge).toBe(true);
    expect(driver?.reliabilityScore).toBeLessThan(40);
  });

  it('opens circuit breaker and dispatches fallback fleet when ghost rate crosses 40%', async () => {
    // Simulate severe ghosting spike across fleet
    store.recordOfferOutcome('DRV-1', false);
    store.recordOfferOutcome('DRV-1', false);
    store.recordOfferOutcome('DRV-2', false);
    store.recordOfferOutcome('DRV-2', false);
    store.recordOfferOutcome('DRV-2', true); // 4 ghosts out of 5 offers = 80% ghost rate

    expect(store.getCircuitState()).toBe('OPEN');

    // New ride request arrives during surge collapse
    const res = await pipeline.dispatch(makeRide('crisis-1', 2));
    expect(res.status).toBe('success');
    expect(res.output?.status).toBe('FALLBACK_FLEET_ASSIGNED');
    expect(res.output?.assignedDriverId).toBe('FLEET_BACKUP_GUARANTEED');
  });
});
