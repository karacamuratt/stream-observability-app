import { StatsD } from "hot-shots";
import { ddCount as apiCount } from "./datadog.metrics";

const isProd = process.env.NODE_ENV === "production";

let statsd: StatsD | null = null;

// Local UDP
if (!isProd) {
    statsd = new StatsD({
        host: "127.0.0.1",
        port: 8125,
        prefix: "streamlog.",
    });
}

export async function trackCount(
    metric: string,
    value = 1,
    tags: string[] = []
) {
    if (isProd) {
        try {
            await apiCount(metric, value, tags);
        } catch (err) {
            console.error("Datadog metric submit failed", err);
        }
    } else {
        statsd?.increment(metric, value, tags);
    }
}
