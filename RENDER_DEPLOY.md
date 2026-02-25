# Render Deploy Checklist

## 1) Create services from blueprint

Use the `render.yaml` file in the repository root and create both services:

- `streamlog-auth-service`
- `streamlog-log-processor`

## 2) Set required Kafka environment variables on both services

- `KAFKA_BROKERS` -> external broker host:port (never `127.0.0.1:9092` on Render)
- `KAFKA_USERNAME`
- `KAFKA_PASSWORD`
- `KAFKA_CA_PEM` (or mount cert and use `KAFKA_CA_PATH`)

Optional:

- `KAFKA_SASL_MECHANISM` (default: `scram-sha-256`)
- `KAFKA_SSL` (default: `true`)
- `KAFKA_TOPIC` (default: `logs.auth`)
- `KAFKA_GROUP_ID` (for log-processor)

## 3) Validate after deploy

- Auth service: call `/login` and verify no 5xx response.
- Log processor: check logs for `Kafka consumer running on topic`.

## 4) Common timeout causes

- Using localhost broker address inside Render.
- Missing CA / wrong SASL mechanism.
- Kafka source does not allow Render outbound IP range.
