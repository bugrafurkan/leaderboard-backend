"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const redis_1 = require("../src/config/redis");
const database_1 = require("../src/config/database"); // veya testDBConnection fonksiyonu varsa onu da ekleyin
describe('Leaderboard Tests', () => {
    beforeAll(async () => {
        // Redis bağlan
        await (0, redis_1.connectRedis)();
        // DB bağlan - eğer testDBConnection varsa:
        // await testDBConnection();
        // ya da en azından bir query: await dbPool.query('SELECT 1');
    });
    afterAll(async () => {
        // dbPool end
        await database_1.dbPool.end();
        // redisClient quit
        // ...
    });
    it('should return top100 array on GET /api/v1/leaderboard', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/v1/leaderboard');
        console.log('GET /leaderboard => body:', res.body); // debug
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('top100');
        expect(Array.isArray(res.body.top100)).toBe(true);
    });
    it('should update score on POST /api/v1/leaderboard/earn', async () => {
        const payload = { playerId: 1234, amount: 100 };
        const res = await (0, supertest_1.default)(app_1.default).post('/api/v1/leaderboard/earn').send(payload);
        console.log('POST /leaderboard/earn => body:', res.body); // debug
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Score updated successfully');
    });
});
//# sourceMappingURL=leaderboard.test.js.map