# aws-cdk-cloudfront-key-pair

AWS CDK L3 construct for managing [CloudFront](https://aws.amazon.com/cloudfront) trusted key
group [key pairs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-trusted-signers.html)
.

This construct library extends the features of CloudFormation by enabling you to easily provision and manage CloudFront
trusted group key pairs for restricting access to your CloudFront distribution's origins using the AWS CDK and signed
URLs.

1. Generates 2048 bit RSA key pair.
2. Stores the RSA key pair in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager).
3. Provisions CloudFront public key to be used with a trusted key group.

The advantage of storing the RSA key pair in AWS Secrets Manager is that AWS Secrets Manager also serves as a place for
your applications to retrieve the private key when signing URLs, allowing you to leverage IAM for access control to the
secrets.

## Installation

To install and use this package, install the following packages using your package manager (e.g. npm):

- aws-cdk-cloudfront-key-pair
- aws-cdk-lib (^2.0.0)
- constructs (^10.0.0)

```sh
npm install aws-cdk-cloudfront-key-pair --save
```

## Usage

```ts
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import {CloudFrontKeyPair} from 'aws-cdk-cloudfront-key-pair';

// Generate an RSA key pair and create a CloudFront public key with the contents.
const {publicKey} = new CloudFrontKeyPair(this, 'CloudFrontKeyPair', {
  name: 'cloudfront-key-pair',
  description: 'CloudFront Key Pair',
});

// Create a CloudFront key group and assign the created CloudFront public key.
const keyGroup = new cloudfront.KeyGroup(this, 'KeyGroup', {
  items: [publicKey],
});
```

The public and private keys are stored in AWS Secrets Manager. The secrets are prefixed with the `name` used for the
CloudFront key pair, with a suffix to distinguish between each key type, these being `/public` and `/private`. For the
above example, the secrets are named:

| Key Type | Secret Name                 |
| -------- | --------------------------- |
| Public   | cloudfront-key-pair/public  |
| Private  | cloudfront-key-pair/private |

You can retrieve the above keys from AWS Secrets Manager by using the AWS CLI or alternatively from your application
using the AWS SDK for signing URLs:

```sh
aws secretsmanager get-secret-value \
  --secret-id cloudfront-key-pair/private \
  --query SecretString \
  --output text
```
