import { Connection, ConnectionOptions, createConnection } from 'mongoose';
import { config } from './config';

interface ExtraConnectionConfig {
  dbName?: string;
  createNewConnection?: boolean;
}

// to not duplicate code
const staticOptions = {
  useNewUrlParser: true,
  useFindAndModify: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  autoIndex: true
} as ConnectionOptions;

/**
 * Make a Connection to MongoDB
 */
export async function connect(extraConfig: ExtraConnectionConfig = {}): Promise<Connection> {
  let connection: Connection;

  const options = Object.assign({}, staticOptions);
  if (config.Memory) {
    if (config?.Auth?.User?.length > 0) {
      Object.assign(options, {
        user: config.Auth.User,
        pass: config.Auth.Passwd,
        authSource: config.Auth.DB
      });
    }
  }

  // to not duplicate code
  const connectionString = `${process.env.MONGO_URI}/${extraConfig.dbName ?? config.DataBase}`;

  if (extraConfig.createNewConnection) {
    connection = createConnection(connectionString, options);
  } else {
    await (await import('mongoose')).connect(connectionString, options);
    connection = (await import('mongoose')).connection;
  }

  return connection;
}

/**
 * Disconnect from MongoDB
 * @returns when it is disconnected
 */
export async function disconnect(): Promise<void> {
  await disconnect();

  return;
}
