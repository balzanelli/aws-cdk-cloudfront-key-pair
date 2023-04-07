import { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { SecretsManager } from 'aws-sdk';
import { generateKeyPair } from 'crypto';
import * as https from 'https';
import { promisify } from 'util';

export interface CreateKeyPairResourceProperties {
  readonly Name: string;
  readonly Description: string;
}

const secretsManager = new SecretsManager();

export const handler = async (
  event: CloudFormationCustomResourceEvent,
): Promise<void> => {
  const props =
    event.ResourceProperties as unknown as CreateKeyPairResourceProperties;

  switch (event.RequestType) {
    case 'Create': {
      await createKeyPair(event, props);
      break;
    }

    case 'Delete': {
      await deleteKeyPair(event, props);
      break;
    }
  }
};

async function sendResponse(
  event: CloudFormationCustomResourceEvent,
  status: string,
  data?: {
    [key: string]: any;
  },
  reason?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const response: unknown | any = {
      Status: status,
      PhysicalResourceId: event.ResourceProperties.Name,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: data,
    };
    if (reason) {
      response.Reason = reason;
    }

    const url = new URL(event.ResponseURL);
    const body = JSON.stringify(response);

    https
      .request({
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: 'PUT',
        headers: {
          'content-type': '',
          'content-length': body.length,
        },
      })
      .on('error', reject)
      .on('response', (response) => {
        response.resume();

        if (response.statusCode && response.statusCode >= 400) {
          reject(
            new Error(
              `Server returned error ${response.statusCode}: ${response.statusMessage}`,
            ),
          );
        } else {
          resolve();
        }
      })
      .end(body, 'utf-8');
  });
}

async function createKeyPair(
  event: CloudFormationCustomResourceEvent,
  props: CreateKeyPairResourceProperties,
): Promise<void> {
  try {
    const { publicKey, privateKey } = await createRsaKeyPair();

    console.log(publicKey);
    console.log(privateKey);

    const publicKeyArn = await createPublicKeySecret(publicKey, props);
    const privateKeyArn = await createPrivateKeySecret(privateKey, props);

    console.log(publicKeyArn);
    console.log(privateKeyArn);

    await sendResponse(event, 'SUCCESS', {
      PublicKey: publicKey.toString(),
      PublicKeyArn: publicKeyArn,
      PrivateKeyArn: privateKeyArn,
    });
  } catch (err: unknown | any) {
    console.error(err);

    await sendResponse(
      event,
      'FAILED',
      undefined,
      `${event.RequestType} failed`,
    );
  }
}

async function createRsaKeyPair(): Promise<{
  publicKey: string | Buffer;
  privateKey: string | Buffer;
}> {
  const { publicKey, privateKey } = await promisify(generateKeyPair)('rsa', {
    modulusLength: 2048,
  });

  return {
    publicKey: publicKey.export({
      type: 'spki',
      format: 'pem',
    }),
    privateKey: privateKey.export({
      type: 'pkcs1',
      format: 'pem',
    }),
  };
}

async function createPublicKeySecret(
  publicKey: string | Buffer,
  props: CreateKeyPairResourceProperties,
): Promise<string> {
  const name = `${props.Name}/public`;

  const { ARN } = await secretsManager
    .createSecret({
      Name: name,
      Description: `${props.Description} (Public Key)`,
      SecretString: publicKey.toString(),
    })
    .promise();

  if (!ARN) {
    throw new Error(`ARN for Secrets Manager secret ${name} not found.`);
  }

  return ARN;
}

async function createPrivateKeySecret(
  privateKey: string | Buffer,
  props: CreateKeyPairResourceProperties,
): Promise<string> {
  const name = `${props.Name}/private`;

  const { ARN } = await secretsManager
    .createSecret({
      Name: name,
      Description: `${props.Description} (Private Key)`,
      SecretString: privateKey.toString(),
    })
    .promise();

  if (!ARN) {
    throw new Error(`ARN for Secrets Manager secret ${name} not found.`);
  }

  return ARN;
}

async function deleteKeyPair(
  event: CloudFormationCustomResourceEvent,
  props: CreateKeyPairResourceProperties,
): Promise<void> {
  try {
    const publicKeyArn = await deletePublicKeySecret(props);
    const privateKeyArn = await deletePrivateKeySecret(props);

    await sendResponse(event, 'SUCCESS', {
      PublicKeyArn: publicKeyArn,
      PrivateKeyArn: privateKeyArn,
    });
  } catch (err: unknown | any) {
    console.error(err);

    await sendResponse(
      event,
      'FAILED',
      undefined,
      `${event.RequestType} failed`,
    );
  }
}

async function deletePublicKeySecret(
  props: CreateKeyPairResourceProperties,
): Promise<string | undefined> {
  const secretId = `${props.Name}/public`;

  if (await secretExists(secretId)) {
    const { ARN } = await secretsManager
      .deleteSecret({
        SecretId: secretId,
        ForceDeleteWithoutRecovery: true,
      })
      .promise();

    return ARN;
  }
}

async function deletePrivateKeySecret(
  props: CreateKeyPairResourceProperties,
): Promise<string | undefined> {
  const secretId = `${props.Name}/private`;

  if (await secretExists(secretId)) {
    const { ARN } = await secretsManager
      .deleteSecret({
        SecretId: secretId,
        ForceDeleteWithoutRecovery: true,
      })
      .promise();

    return ARN;
  }
}

async function secretExists(secretId: string): Promise<boolean> {
  const params: SecretsManager.ListSecretsRequest = {
    Filters: [
      {
        Key: 'name',
        Values: [secretId],
      },
    ],
  };

  const { SecretList: secretList } = await secretsManager
    .listSecrets(params)
    .promise();

  return !!secretList && secretList?.length > 0;
}
