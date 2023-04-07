import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudFrontKeyPair } from '../../lib/cloudfront-key-pair';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new CloudFrontKeyPair(this, 'CloudFrontKeyPair', {
      name: 'cloudfront-key-pair',
      description: 'CloudFront Key Pair',
    });
  }
}
