import { Module } from '@nestjs/common';
import { KafkaModule } from './kafka/kafka.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [KafkaModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
