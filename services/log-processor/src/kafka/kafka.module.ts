import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { consumer } from './kafka.client';
import { LogProcessorService } from '../processor/log-processor.service';

@Module({
    providers: [LogProcessorService],
})
export class KafkaModule implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        void this.startConsumerWithRetry();
    }

    private async startConsumerWithRetry() {
        const topic = process.env.KAFKA_TOPIC || 'logs.auth';
        let delayMs = 2_000;

        for (;;) {
            try {
                console.log('Starting Kafka consumer...');

                await consumer.connect();
                await consumer.subscribe({
                    topic,
                    fromBeginning: false,
                });

                await consumer.run({
                    eachMessage: async ({ message }) => {
                        const value = message.value?.toString();

                        if (!value) return;

                        try {
                            const log = JSON.parse(value);
                            LogProcessorService.handle(log);
                        } catch (err) {
                            console.error('Invalid message payload', err);
                        }
                    },
                });

                console.log(`Kafka consumer running on topic: ${topic}`);
                return;
            } catch (err) {
                console.error(`Kafka consumer failed, retrying in ${delayMs}ms`, err);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                delayMs = Math.min(delayMs * 2, 30_000);
            }
        }
    }

    async onModuleDestroy() {
        await consumer.disconnect();
    }
}
