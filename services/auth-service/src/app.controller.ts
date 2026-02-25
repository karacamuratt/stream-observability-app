import { Controller, Get } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

@Controller()
export class AppController {
    constructor(private readonly logger: LoggerService) { }

    @Get('login')
    async login() {
        await this.logger.log('info', 'User login attempt');

        return {
            success: true,
            message: 'Login simulated',
        };
    }

    @Get('error')
    async error() {
        await this.logger.log('error', 'Invalid credentials');

        return {
            success: false,
        };
    }
}
