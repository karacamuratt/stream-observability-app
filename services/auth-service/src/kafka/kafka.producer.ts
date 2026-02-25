import { Kafka } from "kafkajs";
import fs from "node:fs";

const brokers = (process.env.KAFKA_BROKERS || "127.0.0.1:9092")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

function loadCa(): string[] | undefined {
    const caPath = process.env.KAFKA_CA_PATH || "/etc/secrets/aiven-ca.pem";
    if (fs.existsSync(caPath)) {
        return [fs.readFileSync(caPath, "utf8")];
    }

    if (process.env.KAFKA_CA_PEM) {
        return [process.env.KAFKA_CA_PEM.replace(/\\n/g, "\n").replace(/\r/g, "")];
    }

    return undefined;
}

const ca = loadCa();
const useSsl = process.env.KAFKA_SSL !== "false";

export const kafka = new Kafka({
    clientId: process.env.SERVICE_NAME || "auth-service",
    brokers,
    ssl: useSsl
        ? {
            rejectUnauthorized: true,
            ...(ca ? { ca } : {}),
        }
        : false,
    sasl: process.env.KAFKA_USERNAME
        ? {
            mechanism: (process.env.KAFKA_SASL_MECHANISM ||
                "scram-sha-256") as any,
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD!,
        }
        : undefined,
});

export const producer = kafka.producer({
    allowAutoTopicCreation: false,
    retry: {
        retries: 8,
    },
});

export async function connectProducer() {
    let delayMs = 2_000;

    for (;;) {
        try {
            await producer.connect();
            console.log("Kafka producer connected");
            return;
        } catch (err) {
            console.error(`Kafka producer connection failed, retrying in ${delayMs}ms`, err);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs = Math.min(delayMs * 2, 30_000);
        }
    }
}
