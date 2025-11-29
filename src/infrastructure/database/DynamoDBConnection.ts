import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config as envConfig } from '../../config/environment';

export class DynamoDBConnection {
  private static instance: DynamoDBConnection;
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  private constructor() {
    const config = {
      region: envConfig.dynamodb.region,
      ...(envConfig.dynamodb.endpoint && {
        endpoint: envConfig.dynamodb.endpoint,
      }),
      credentials: {
        accessKeyId: envConfig.dynamodb.accessKeyId,
        secretAccessKey: envConfig.dynamodb.secretAccessKey,
      },
    };

    this.client = new DynamoDBClient(config);
    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
    });
  }

  public static getInstance(): DynamoDBConnection {
    if (!DynamoDBConnection.instance) {
      DynamoDBConnection.instance = new DynamoDBConnection();
    }
    return DynamoDBConnection.instance;
  }

  public getDocClient(): DynamoDBDocumentClient {
    return this.docClient;
  }

  public getClient(): DynamoDBClient {
    return this.client;
  }

  public async testConnection(): Promise<void> {
    try {
      console.log('🔶 Testing DynamoDB connection...');
      // Simple test - intentar acceder al cliente
      const client = this.getDocClient();
      if (client) {
        console.log('✅ DynamoDB client initialized');
      }
    } catch (error) {
      console.error('❌ DynamoDB connection failed:', error);
      throw error;
    }
  }
}
