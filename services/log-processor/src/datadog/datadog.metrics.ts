import { client, v1 } from "@datadog/datadog-api-client";

const site = process.env.DD_SITE || "datadoghq.eu";
const configuration = client.createConfiguration({
    authMethods: {
        apiKeyAuth: process.env.DD_API_KEY!,
        appKeyAuth: process.env.DD_APP_KEY!,
    },
});

configuration.setServerVariables({
    site,
});

const metricsApi = new v1.MetricsApi(configuration);

export async function ddCount(
    metric: string,
    value: number,
    tags: string[] = []
) {
    const ts = Math.floor(Date.now() / 1000);

    await metricsApi.submitMetrics({
        body: {
            series: [
                {
                    metric,
                    points: [[ts, value]],
                    type: "count",
                    tags,
                },
            ],
        },
    });
}
