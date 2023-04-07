import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TrustedGroupKeyPair } from '../../lib/trusted-group-key-pair';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new TrustedGroupKeyPair(this, 'TrustedGroupKeyPair', {
      name: 'aws-cdk-cloudfront-key-pair',
      description: 'AWS CDK CloudFront Key Pair',
    });
  }
}
