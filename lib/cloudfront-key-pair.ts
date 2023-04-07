import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { CloudFrontKeyPairProps } from './cloudfront-key-pair-props';
import { KeyPair } from './key-pair';

export class CloudFrontKeyPair extends Construct {
  /** @readonly Generated CloudFront public key */
  readonly publicKey: cloudfront.PublicKey;

  /** @readonly Generated key pair */
  readonly keyPair: KeyPair;

  constructor(scope: Construct, id: string, props: CloudFrontKeyPairProps) {
    super(scope, id);

    this.keyPair = new KeyPair(this, 'KeyPair', {
      ...props,
    });

    this.publicKey = new cloudfront.PublicKey(this, 'PublicKey', {
      publicKeyName: props.name,
      comment: props.description,
      encodedKey: this.keyPair.publicKey,
    });
  }
}
