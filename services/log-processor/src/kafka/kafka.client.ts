import { Kafka } from "kafkajs";
import fs from "node:fs";

const brokers = (process.env.KAFKA_BROKERS || "127.0.0.1:9092")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

function loadCa(): string[] | undefined {
    const caPath = process.env.KAFKA_CA_PATH || "/etc/secrets/aiven-ca.pem";
    if (fs.existsSync(caPath)) {
        return [fs.readFileSync(caPath, "utf8")];
    }

    if (process.env.KAFKA_CA_PEM) {
        const pem = process.env.KAFKA_CA_PEM.replace(/\\n/g, "\n").replace(/\r/g, "");
        return [pem];
    }

    return undefined;
}

const ca = loadCa();
const useSsl = process.env.KAFKA_SSL !== "false";

export const kafka = new Kafka({
    clientId: process.env.SERVICE_NAME || "log-processor",
    brokers,
    ssl: useSsl
        ? {
            rejectUnauthorized: true,
            ...(ca ? { ca } : {}),
        }
        : false,
    sasl: process.env.KAFKA_USERNAME
        ? {
            mechanism: (process.env.KAFKA_SASL_MECHANISM || "scram-sha-256") as any,
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD!,
        }
        : undefined,
    connectionTimeout: 15_000,
    authenticationTimeout: 10_000,
    requestTimeout: 30_000,
    retry: {
        retries: 8,
        initialRetryTime: 300,
        maxRetryTime: 30_000,
        factor: 0.2,
    },
});

export const consumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID || "streamlog-log-processor",
    retry: {
        retries: 8,
    },
});
