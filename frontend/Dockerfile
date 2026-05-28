# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

RUN npm config set registry https://package-mirror.liara.ir/repository/npm/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --registry https://package-mirror.liara.ir/repository/npm/

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

CMD ["pnpm", "start"]