import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { TrustedGroupKeyPairProps } from './trusted-group-key-pair-props';
import { KeyPair } from './key-pair';

export class TrustedGroupKeyPair extends Construct {
  readonly publicKey: cloudfront.PublicKey;
  readonly keyGroup: cloudfront.KeyGroup;
  readonly keyPair: KeyPair;

  constructor(scope: Construct, id: string, props: TrustedGroupKeyPairProps) {
    super(scope, id);

    const { publicKey: encodedKey } = new KeyPair(this, 'KeyPair', {
      ...props,
    });

    this.publicKey = new cloudfront.PublicKey(this, 'PublicKey', {
      publicKeyName: props.name,
      comment: props.description,
      encodedKey,
    });

    this.keyGroup = new cloudfront.KeyGroup(this, 'KeyGroup', {
      keyGroupName: props.name,
      comment: props.description,
      items: [this.publicKey],
    });
  }
}
