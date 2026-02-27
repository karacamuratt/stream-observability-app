# Streamlog Observability

An event-driven observability sample project:

- `auth-service`: emits application logs and publishes them to Kafka
- `log-processor`: consumes Kafka logs, computes metrics, and sends them to Datadog

The project is designed to run both locally (Docker Compose) and on Render (two separate services).

## Architecture

```text
Client
  -> auth-service (NestJS)
     -> Kafka topic: logs.auth
        -> log-processor (NestJS consumer)
           -> Datadog custom metrics
```

## Monorepo Structure

```text
.
|-- services/
|   |-- auth-service/
|   |-- log-processor/
|-- docker-compose.yml
|-- render.yaml
|-- RENDER_DEPLOY.md
```

## Services

### auth-service

HTTP endpoints:

- `GET /login`: emits an `info` log
- `GET /error`: emits an `error` log

Sample log payload:

```json
{
  "service": "auth-service",
  "level": "info",
  "message": "User login attempt",
  "timestamp": "2026-02-26T15:30:20.000Z"
}
```

### log-processor

Responsibilities:

- Consumes Kafka topic `logs.auth`
- Increments `streamlog.logs.total`
- Increments `streamlog.errors` for error-level logs
- Exposes a health endpoint: `GET /health`

## Tech Stack

- Node.js + NestJS
- KafkaJS
- Apache Kafka (Aiven or local Kafka)
- Datadog Metrics API (`@datadog/datadog-api-client`)
- Render Blueprint deployment (`render.yaml`)

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (for local Kafka)
- Optional: Aiven Kafka
- Optional: Datadog account + API/App keys

## Environment Variables

### auth-service

File: `services/auth-service/.env.example`

Required for Kafka:

- `KAFKA_BROKERS` (example: `host:port`)
- `KAFKA_USERNAME`
- `KAFKA_PASSWORD`
- `KAFKA_CA_PEM` or `KAFKA_CA_PATH`

Important:

- `KAFKA_SASL_MECHANISM` (for Aiven SASL, usually `plain` or `scram-sha-256`)
- `KAFKA_SSL` (`true`/`false`, behavior defaults to SSL enabled)
- `KAFKA_TOPIC` (default: `logs.auth`)

### log-processor

File: `services/log-processor/.env.example`

Kafka:

- `KAFKA_BROKERS`
- `KAFKA_USERNAME`
- `KAFKA_PASSWORD`
- `KAFKA_CA_PEM` or `KAFKA_CA_PATH`
- `KAFKA_GROUP_ID` (default: `streamlog-log-processor`)
- `KAFKA_TOPIC` (default: `logs.auth`)

Datadog:

- `DD_SITE` (`app.datadoghq.eu` is supported and normalized in code)
- `DD_API_KEY`
- `DD_APP_KEY`

## Local Development

### 1) Start Kafka infrastructure

```bash
docker compose up -d zookeeper kafka kafka-ui
```

Kafka UI:

- `http://localhost:8080`

### 2) Run auth-service

```bash
cd services/auth-service
npm ci
npm run build
npm run start:prod
```

### 3) Run log-processor

```bash
cd services/log-processor
npm ci
npm run build
npm run start:prod
```

## End-to-End Smoke Test

1. Call auth-service endpoints:
- `GET /login`
- `GET /error`

2. Expected behavior:
- No Kafka publish errors in `auth-service` logs
- `log-processor` shows active consumer (`Kafka consumer running on topic: logs.auth`)

3. Verify in Aiven:
- Topic `logs.auth` receives messages
- Consumer group `streamlog-log-processor` is active
- Consumer lag remains low/near zero

4. Verify in Datadog:
- `sum:streamlog.logs.total{*}`
- `sum:streamlog.errors{*}`

## Render Deployment

The root `render.yaml` deploys two separate web services:

- `streamlog-auth-service`
- `streamlog-log-processor`

Commands:

- Build: `npm ci --include=dev && npm run build`
- Start: `npm run start:prod`

Detailed checklist: `RENDER_DEPLOY.md`

## Troubleshooting

### 1) `TS2688: Cannot find type definition file for 'node'`

Cause:
- Dev dependencies were not installed during build.

Fix:
- Use `npm ci --include=dev && npm run build`.

### 2) Kafka `connection timeout`

Cause:
- Using `127.0.0.1:9092` in Render.

Fix:
- Set `KAFKA_BROKERS` to an external broker (`host:port`).

### 3) `SSL alert bad certificate`

Cause:
- Wrong port, auth mode mismatch, or missing CA cert.

Fix:
- Use the correct Aiven SASL endpoint and port.
- Verify `KAFKA_USERNAME`, `KAFKA_PASSWORD`, and `KAFKA_CA_PEM`.

### 4) Datadog `403 No api key specified`

Cause:
- `DD_API_KEY` is missing or empty.

Fix:
- Set `DD_API_KEY` and `DD_APP_KEY` in Render, then redeploy.

Note:
- If Datadog keys are missing, the service no longer crashes; metric submission is skipped.

### 5) Render deploy timeout for log-processor

Fix:
- Ensure `GET /health` is reachable.
- Ensure the service binds to the expected `PORT` on `0.0.0.0`.

## Security Notes

- Never commit secrets (`.env`, API keys, cert content).
- Rotate leaked credentials immediately.
- Keep Render and Aiven credentials scoped with least privilege.

## Future Improvements

- Run `log-processor` as a Render Background Worker
- Add OpenTelemetry tracing
- Add dead-letter topic and retry strategy hardening
- Add integration tests with Kafka test containers
