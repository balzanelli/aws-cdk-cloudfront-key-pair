export interface KeyPairProps {
  /** @readonly Key Pair name */
  readonly name: string;

  /** @readonly Key Pair description */
  readonly description: string;

  /** @readonly Regions to replicate AWS secrets to */
  readonly secretRegions?: string[];
}
