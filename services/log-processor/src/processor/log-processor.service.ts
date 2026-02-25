import { Injectable, Logger } from '@nestjs/common';
import { dogstatsd } from '../datadog/datadog.client';
import { trackCount } from "../datadog";
interface AppLog {
    service: string;
    level: string;
    message: string;
    timestamp: string;
}

@Injectable()
export class LogProcessorService {
    private static readonly logger = new Logger(LogProcessorService.name);
    private static errorCount = 0;
    private static windowStart = Date.now();

    static handle(log: AppLog) {

        if (log.level === 'error') {
            this.errorCount++;

            dogstatsd.increment('errors', 1, {
                service: log.service,
            });

            trackCount("streamlog.errors", 1, [`service:${log.service}`]);
        }

        const now = Date.now();

        if (now - this.windowStart > 10_000) {
            this.logger.log('-- Metrics --');
            this.logger.log('Errors last minute:', this.errorCount);

            if (this.errorCount >= 5) {
                this.logger.warn('ALERT: High error rate detected!');
            }

            this.errorCount = 0;
            this.windowStart = now;
        }

        dogstatsd.increment('logs.total', 1, {
            service: log.service,
            level: log.level,
        });

        trackCount("streamlog.logs.total", 1, [`service:${log.service}`, `level:${log.level}`]);
    }
}
