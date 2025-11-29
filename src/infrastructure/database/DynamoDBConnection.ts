import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

export class DynamoDBConnection {
  private static instance: DynamoDBConnection;
  private client: DynamoDBClient;
  private docClient: DynamoDBDocumentClient;

  private constructor() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT && {
        endpoint: process.env.DYNAMODB_ENDPOINT, // Para desarrollo local
      }),
      ...(process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY && {
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        }),
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
