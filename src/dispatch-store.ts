import type { CircuitBreakerState, DriverProfile } from './types.js';

export class DispatchEngineStore {
  private drivers = new Map<string, DriverProfile>();
  private totalOffers = 0;
  private totalGhosts = 0;
  private circuitState: CircuitBreakerState = 'CLOSED';

  registerDriver(driverId: string, initialReliability: number = 90): void {
    this.drivers.set(driverId, {
      driverId,
      reliabilityScore: initialReliability,
      recentOffersCount: 0,
      recentGhostsCount: 0,
      isLockedOutFromSurge: false,
    });
  }

  getDriver(driverId: string): DriverProfile | undefined {
    return this.drivers.get(driverId);
  }

  recordOfferOutcome(driverId: string, accepted: boolean): void {
    this.totalOffers++;
    const driver = this.drivers.get(driverId);

    if (driver) {
      driver.recentOffersCount++;
      if (!accepted) {
        driver.recentGhostsCount++;
        this.totalGhosts++;
        driver.reliabilityScore = Math.max(0, driver.reliabilityScore - 20);

        // Surge lockout penalty if ghost rate > 50%
        if (driver.recentOffersCount >= 3 && driver.recentGhostsCount / driver.recentOffersCount > 0.5) {
          driver.isLockedOutFromSurge = true;
        }
      } else {
        driver.reliabilityScore = Math.min(100, driver.reliabilityScore + 5);
      }
    }

    this.updateCircuitBreaker();
  }

  private updateCircuitBreaker(): void {
    if (this.totalOffers < 5) return;
    const ghostRate = this.totalGhosts / this.totalOffers;

    if (ghostRate > 0.4) {
      this.circuitState = 'OPEN';
    } else if (ghostRate > 0.25) {
      this.circuitState = 'HALF_OPEN';
    } else {
      this.circuitState = 'CLOSED';
    }
  }

  getCircuitState(): CircuitBreakerState {
    return this.circuitState;
  }

  getGhostRate(): number {
    return this.totalOffers > 0 ? this.totalGhosts / this.totalOffers : 0;
  }

  clear(): void {
    this.drivers.clear();
    this.totalOffers = 0;
    this.totalGhosts = 0;
    this.circuitState = 'CLOSED';
  }
}
