// src/config/database.ts
import { Pool } from 'pg';
import { ENV } from './env';

// Main pool for PlayerRepository
export const dbPool = new Pool({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  user: ENV.DB_USER,
  password: ENV.DB_PASS,
  database: 'postgres'
});

// Application pool that will be used after initialization
let appPool: Pool | null = null;

// Function to initialize database and create role if it doesn't exist
export async function initializeDatabase() {
  const client = await dbPool.connect();

  try {
    // First, check if database exists
    const dbCheck = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [ENV.DB_NAME]);

    if (dbCheck.rowCount === 0) {
      // Create the database if it doesn't exist
      await client.query(`CREATE DATABASE ${ENV.DB_NAME}`);
      console.log(`Database "${ENV.DB_NAME}" created successfully`);
    }

    // Check if role exists
    const roleCheck = await client.query(`
      SELECT 1 FROM pg_roles WHERE rolname = $1
    `, [ENV.DB_ROLE]);

    if (roleCheck.rowCount === 0) {
      // Create the role if it doesn't exist
      await client.query(`
        CREATE ROLE ${ENV.DB_ROLE} WITH 
        LOGIN 
        PASSWORD '${ENV.DB_PASS}'
        CREATEDB
      `);
      console.log(`Role "${ENV.DB_ROLE}" created successfully`);
    } else {
      console.log(`Role "${ENV.DB_ROLE}" already exists`);
    }

    // Grant necessary permissions
    await client.query(`
      GRANT ALL PRIVILEGES ON DATABASE ${ENV.DB_NAME} TO ${ENV.DB_ROLE}
    `);

    // Initialize application pool with the role
    appPool = new Pool({
      user: ENV.DB_ROLE,
      host: ENV.DB_HOST,
      database: ENV.DB_NAME,
      password: ENV.DB_PASS,
      port: ENV.DB_PORT,
    });

    // Update dbPool to use the new database
    await dbPool.end();
    Object.assign(dbPool, new Pool({
      host: ENV.DB_HOST,
      port: ENV.DB_PORT,
      user: ENV.DB_USER,
      password: ENV.DB_PASS,
      database: ENV.DB_NAME
    }));

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
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
