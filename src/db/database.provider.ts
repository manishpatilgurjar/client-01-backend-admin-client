import { Injectable } from '@nestjs/common';
import { connect, Connection, connection } from 'mongoose';

@Injectable()
export class DatabaseProvider {
  private dbConnection: Connection | null = null;

  async connect(): Promise<Connection> {
    if (this.dbConnection) {
      return this.dbConnection;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await connect(uri);
    this.dbConnection = connection;
    return this.dbConnection;
  }

  getConnection(): Connection {
    if (!this.dbConnection) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.dbConnection;
  }
} 