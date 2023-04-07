import { CustomResource, Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';
import { KeyPairProps } from './key-pair-props';

export class KeyPair extends Construct {
  /** @readonly Content of the generated public key */
  readonly publicKey: string;

  /** @readonly ARN of the public key secret */
  readonly publicKeyArn: string;

  /** @readonly ARN of the private key secret */
  readonly privateKeyArn: string;

  constructor(scope: Construct, id: string, props: KeyPairProps) {
    super(scope, id);

    const lambdaFunction = this.createKeyPairFunction();

    const keyPair = new CustomResource(this, 'KeyPair', {
      serviceToken: lambdaFunction.functionArn,
      resourceType: 'Custom::KeyPair',
      properties: {
        Name: props.name,
        Description: props.description,
      },
    });

    this.publicKey = keyPair.getAttString('PublicKey');
    this.publicKeyArn = keyPair.getAttString('PublicKeyArn');
    this.privateKeyArn = keyPair.getAttString('PrivateKeyArn');
  }

  private createKeyPairFunction(): lambda.IFunction {
    const projectRoot = path.join(__dirname, '../src/create-key-pair');

    const createKeyPairFunction = new NodejsFunction(
      this,
      'CreateKeyPairFunction',
      {
        description: 'Custom CFN resource: Create Key Pair',
        timeout: Duration.seconds(10),
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(projectRoot, 'index.ts'),
        depsLockFilePath: path.join(projectRoot, 'package-lock.json'),
        projectRoot,
        bundling: {
          externalModules: ['aws-sdk'],
        },
      },
    );
    createKeyPairFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:ListSecrets'],
        resources: ['*'],
      }),
    );
    createKeyPairFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:CreateSecret'],
        resources: ['*'],
      }),
    );
    createKeyPairFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:DeleteSecret'],
        resources: ['*'],
      }),
    );

    return createKeyPairFunction;
  }
}
