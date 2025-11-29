import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { SessionRepository, SessionData } from '@domain/repositories/SessionRepository';
import { DynamoDBConnection } from '../database/DynamoDBConnection';

export class DynamoDBSessionRepository implements SessionRepository {
  private docClient = DynamoDBConnection.getInstance().getDocClient();
  private client = DynamoDBConnection.getInstance().getClient();
  private readonly tableName = process.env.DYNAMODB_SESSIONS_TABLE || 'auth-sessions';

  constructor() {
    this.ensureTableExists();
  }

  /**
   * Verifica y crea la tabla si no existe (útil para desarrollo local)
   */
  private async ensureTableExists(): Promise<void> {
    try {
      await this.client.send(new DescribeTableCommand({ TableName: this.tableName }));
      console.log(`✅ DynamoDB table '${this.tableName}' exists`);
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`📦 Creating DynamoDB table '${this.tableName}'...`);
        await this.createTable();
      } else {
        console.error('Error checking table:', error);
      }
    }
  }

  /**
   * Crea la tabla de sesiones con TTL habilitado
   */
  private async createTable(): Promise<void> {
    try {
      const command = new CreateTableCommand({
        TableName: this.tableName,
        KeySchema: [{ AttributeName: 'token', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'token', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
      });

      await this.client.send(command);
      console.log(`✅ Table '${this.tableName}' created successfully`);

      // Nota: Para habilitar TTL en producción, usar AWS Console o CLI:
      // aws dynamodb update-time-to-live --table-name auth-sessions --time-to-live-specification "Enabled=true, AttributeName=TTL"
    } catch (error) {
      console.error('Error creating table:', error);
      throw error;
    }
  }

  async save(token: string, data: SessionData, expiresIn: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + expiresIn;

    const item = {
      token,
      userId: data.userId,
      email: data.email,
      createdAt: data.createdAt.toISOString(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      TTL: ttl, // DynamoDB eliminará automáticamente cuando expire
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: item,
    });

    await this.docClient.send(command);
  }

  async get(token: string): Promise<SessionData | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { token },
    });

    const result = await this.docClient.send(command);

    if (!result.Item) {
      return null;
    }

    return {
      userId: result.Item.userId,
      email: result.Item.email,
      createdAt: new Date(result.Item.createdAt),
      ipAddress: result.Item.ipAddress,
      userAgent: result.Item.userAgent,
    };
  }

  async delete(token: string): Promise<boolean> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { token },
      ReturnValues: 'ALL_OLD',
    });

    const result = await this.docClient.send(command);
    return !!result.Attributes;
  }

  async exists(token: string): Promise<boolean> {
    const session = await this.get(token);
    return session !== null;
  }
}
