import { Controller, Get } from '@nestjs/common';
import { ConsoleService } from './console.service';

@Controller()
export class ConsoleController {
    constructor(private readonly consoleService: ConsoleService) {}

    @Get('hello')
    getHello(): string {
        return this.consoleService.getHello();
    }
}
