import type { Stage, PipelineContext } from '../core/index.js';
import type { BackpressureEvaluatedRequest } from './backpressure.js';
import type { DispatchMatchResult } from '../types.js';
import type { DispatchEngineStore } from '../dispatch-store.js';

export function createMatcherStage(store: DispatchEngineStore): Stage<BackpressureEvaluatedRequest, DispatchMatchResult> {
  return {
    id: 'dispatch-matcher',
    name: 'Circuit-Breaker Aware Dispatch Matcher',
    description: 'Matches eligible driver or switches to fallback fleet if circuit is OPEN',
    async run(input: BackpressureEvaluatedRequest, ctx: PipelineContext): Promise<DispatchMatchResult> {
      // If Circuit is OPEN due to severe ghost cascade, bypass normal drivers and dispatch fallback fleet
      if (input.circuitState === 'OPEN') {
        ctx.logger.warn(`Circuit Breaker OPEN: routing to fallback fleet guarantee`, {
          rideId: input.rideId,
        });

        return {
          rideId: input.rideId,
          assignedDriverId: 'FLEET_BACKUP_GUARANTEED',
          status: 'FALLBACK_FLEET_ASSIGNED',
          circuitBreakerState: input.circuitState,
          backpressureDelayMs: input.backpressureDelayMs,
        };
      }

      // Default normal match
      ctx.logger.info(`Dispatch match allocated`, { rideId: input.rideId });

      return {
        rideId: input.rideId,
        assignedDriverId: 'DRIVER_PRIMARY_1',
        status: 'MATCHED',
        circuitBreakerState: input.circuitState,
        backpressureDelayMs: input.backpressureDelayMs,
      };
    },
  };
}
