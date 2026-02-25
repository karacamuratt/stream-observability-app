import { Injectable, OnModuleInit } from '@nestjs/common';
import { producer, connectProducer } from '../kafka/kafka.producer';

@Injectable()
export class LoggerService implements OnModuleInit {
    async onModuleInit() {
        void connectProducer();
    }

    async log(level: string, message: string) {
        const log = {
            service: 'auth-service',
            level,
            message,
            timestamp: new Date().toISOString(),
        };

        try {
            await producer.send({
                topic: process.env.KAFKA_TOPIC || 'logs.auth',
                messages: [
                    {
                        value: JSON.stringify(log),
                    },
                ],
            });
        } catch (err) {
            console.error('Kafka publish failed', err);
        }
    }
}
