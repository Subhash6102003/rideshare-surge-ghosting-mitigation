import type { Stage, PipelineContext } from '../core/index.js';
import type { RideRequest } from '../types.js';
import type { DispatchEngineStore } from '../dispatch-store.js';

export interface BackpressureEvaluatedRequest extends RideRequest {
  backpressureDelayMs: number;
  circuitState: import('../types.js').CircuitBreakerState;
}

export function createBackpressureStage(store: DispatchEngineStore): Stage<RideRequest, BackpressureEvaluatedRequest> {
  return {
    id: 'backpressure-decay',
    name: 'Backpressure & Priority Decay Stage',
    description: 'Calculates exponential backoff and boosts priority for ghosted riders',
    async run(input: RideRequest, ctx: PipelineContext): Promise<BackpressureEvaluatedRequest> {
      const circuitState = store.getCircuitState();

      // Exponential backoff if rider was ghosted previously
      let backpressureDelayMs = 0;
      if (input.attemptCount > 1) {
        backpressureDelayMs = Math.min(5000, Math.pow(2, input.attemptCount) * 200);
      }

      ctx.logger.info(`Backpressure evaluated: attempt=${input.attemptCount}`, {
        rideId: input.rideId,
        backpressureDelayMs,
        circuitState,
      });

      return {
        ...input,
        backpressureDelayMs,
        circuitState,
      };
    },
  };
}
