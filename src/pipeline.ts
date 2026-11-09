import { Pipeline } from './core/index.js';
import type { RideRequest, DispatchMatchResult } from './types.js';
import { DispatchEngineStore } from './dispatch-store.js';
import { createBackpressureStage } from './stages/backpressure.js';
import { createMatcherStage } from './stages/matcher.js';
import type { Stage, PipelineResult } from './core/index.js';

export function createRideDispatchPipeline(store: DispatchEngineStore = new DispatchEngineStore()) {
  const pipeline = new Pipeline<RideRequest, DispatchMatchResult>('ride-dispatch');

  const stages: Stage<unknown, unknown>[] = [
    createBackpressureStage(store) as Stage<unknown, unknown>,
    createMatcherStage(store) as Stage<unknown, unknown>,
  ];

  return {
    async dispatch(request: RideRequest): Promise<PipelineResult<DispatchMatchResult>> {
      return pipeline.run(stages, request);
    },
    store,
  };
}
