import { Pool } from 'pg';
import { ENV } from './env';

// Main pool for PlayerRepository
export const dbPool = new Pool({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  user: ENV.DB_USER,
  password: ENV.DB_PASS,
  database: 'postgres'  // Başlangıçta postgres veritabanına bağlanıyoruz
});

// Application pool that will be used after initialization
let appPool: Pool | null = null;

// Function to create tables
async function createTables(client: any) {
  try {
    // Create schema first
    console.log('Successfullye');
    await client.query(`CREATE SCHEMA IF NOT EXISTS public`);
    console.log('Successfullye11');
    // Create players table
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        "playerId" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "country" VARCHAR(255) NOT NULL,
        "joinDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "money" DECIMAL DEFAULT 0
      )
    `);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Function to initialize database and create role if it doesn't exist
export async function initializeDatabase() {
  const client = await dbPool.connect();

  try {
    // First, check if database exists
    const dbCheck = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [ENV.DB_NAME]);

    if (dbCheck.rowCount === 0) {
      // Release the current connection before creating database
      client.release();

      // Get a new connection for creating database
      const tempClient = await dbPool.connect();
      try {
        // Disconnect all other clients before creating DB
        await tempClient.query(`
          SELECT pg_terminate_backend(pid) 
          FROM pg_stat_activity 
          WHERE datname = $1
        `, [ENV.DB_NAME]);

        // Create the database if it doesn't exist
        await tempClient.query(`CREATE DATABASE ${ENV.DB_NAME}`);
        console.log(`Database "${ENV.DB_NAME}" created successfully`);
      } finally {
        tempClient.release();
      }
    } else {
      client.release();
    }

    // Create a new pool for the target database
    const targetPool = new Pool({
      host: ENV.DB_HOST,
      port: ENV.DB_PORT,
      user: ENV.DB_USER,
      password: ENV.DB_PASS,
      database: ENV.DB_NAME  // Yeni oluşturulan veritabanına bağlan
    });

    // Get connection to new database
    const targetClient = await targetPool.connect();

    try {
      // Check if role exists
      const roleCheck = await targetClient.query(`
        SELECT 1 FROM pg_roles WHERE rolname = $1
      `, [ENV.DB_ROLE]);

      if (roleCheck.rowCount === 0) {
        // Create the role if it doesn't exist
        await targetClient.query(`
          CREATE ROLE ${ENV.DB_ROLE} WITH 
          LOGIN 
          PASSWORD '${ENV.DB_PASS}'
          CREATEDB
        `);
        console.log(`Role "${ENV.DB_ROLE}" created successfully`);
      }

      console.log('Successfullye7');
      // Grant necessary permissions
      await targetClient.query(`
        GRANT ALL PRIVILEGES ON DATABASE ${ENV.DB_NAME} TO ${ENV.DB_ROLE}
      `);

      // Create tables in the new database
      await createTables(targetClient);

      // Update dbPool to use the new database
      await dbPool.end();
      Object.assign(dbPool, targetPool);

      // Initialize application pool
      appPool = new Pool({
        user: ENV.DB_ROLE,
        host: ENV.DB_HOST,
        database: ENV.DB_NAME,
        password: ENV.DB_PASS,
        port: ENV.DB_PORT,
      });

      console.log('Database initialization completed successfully');
    } finally {
      targetClient.release();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function testDBConnection(): Promise<void> {
  try {
    const client = await dbPool.connect();
    await client.query('SELECT NOW()');
    console.log('Successfully connected to the database');
    client.release();
  } catch (err: any) {
    console.error('Failed to connect PostgreSQL:', err);
    throw err;
  }
}

// Function to get the pool for database operations
export function getPool(): Pool {
  if (!appPool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return appPool;
}

// Clean up connections on application shutdown
process.on('SIGINT', async () => {
  if (appPool) {
    await appPool.end();
  }
  await dbPool.end();
  process.exit(0);
});
