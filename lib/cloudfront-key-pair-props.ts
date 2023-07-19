export interface CloudFrontKeyPairProps {
  /** @readonly Key Pair name */
  readonly name: string;

  /** @readonly Key Pair description */
  readonly description: string;

  /** @readonly Regions to replicate secrets to */
  readonly secretRegions?: string[];
}
