import request from 'supertest';
import app from '../src/app';
import { connectRedis } from '../src/config/redis';
import { dbPool } from '../src/config/database'; // veya testDBConnection fonksiyonu varsa onu da ekleyin

describe('Leaderboard Tests', () => {
  beforeAll(async () => {
    // Redis bağlan
    await connectRedis();
    // DB bağlan - eğer testDBConnection varsa:
    // await testDBConnection();
    // ya da en azından bir query: await dbPool.query('SELECT 1');
  });

  afterAll(async () => {
    // dbPool end
    await dbPool.end();
    // redisClient quit
    // ...
  });

  it('should return top100 array on GET /api/v1/leaderboard', async () => {
    const res = await request(app).get('/api/v1/leaderboard');
    console.log('GET /leaderboard => body:', res.body); // debug
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('top100');
    expect(Array.isArray(res.body.top100)).toBe(true);
  });

  it('should update score on POST /api/v1/leaderboard/earn', async () => {
    const payload = { playerId: 1234, amount: 100 };
    const res = await request(app).post('/api/v1/leaderboard/earn').send(payload);
    console.log('POST /leaderboard/earn => body:', res.body); // debug
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Score updated successfully');
  });
});
