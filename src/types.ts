export type CircuitBreakerState = 'CLOSED' | 'HALF_OPEN' | 'OPEN';

export interface RideRequest {
  rideId: string;
  riderId: string;
  pickupZone: string;
  surgeMultiplier: number; // e.g. 2.5x
  attemptCount: number;
  requestedAt: number;
}

export interface DriverProfile {
  driverId: string;
  reliabilityScore: number; // 0 - 100
  recentOffersCount: number;
  recentGhostsCount: number;
  isLockedOutFromSurge: boolean;
}

export interface DispatchMatchResult {
  rideId: string;
  assignedDriverId?: string;
  status: 'MATCHED' | 'REQUEUED_WITH_PRIORITY' | 'FALLBACK_FLEET_ASSIGNED' | 'REJECTED_OVERLOAD';
  circuitBreakerState: CircuitBreakerState;
  backpressureDelayMs: number;
}
