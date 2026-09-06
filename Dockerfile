# Enterprise LLM Security Red-Team Platform Dockerfile
FROM node:18-alpine

# Install curl and jq for healthchecks and provider scripts
RUN apk add --no-cache curl jq python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/metrics || exit 1

CMD ["npm", "start"]
