# 1) Baz imaj: Node.js 18 (Alpine)
FROM node:18-alpine AS builder

# 2) Çalışma dizini
WORKDIR /app

# 3) package.json ve package-lock.json kopyala
COPY package*.json ./

# 4) Bağımlılıkları kur
RUN npm install

# 5) Kaynak kodu kopyala
COPY . .

# 6) TypeScript kodunu derle (dist klasörüne)
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine

WORKDIR /app

# 7) Yukarıdaki "builder" aşamasından dist ve node_modules kopyala
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# 8) Default olarak API (index.ts) çalıştır
#    Kubernetes'te worker için override edeceğiz
CMD ["npx", "ts-node", "src/index.ts"]
