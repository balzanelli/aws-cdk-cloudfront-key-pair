import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
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

    new secretsmanager.CfnSecret(this, 'PublicKeyIdSecret', {
      name: `${props.name}/public-key-id`,
      description: `${props.description} (Public Key ID)`,
      secretString: this.publicKey.publicKeyId,
      replicaRegions: props.secretRegions?.map((region) => {
        return {
          region,
        };
      }),
    })
  }
}
