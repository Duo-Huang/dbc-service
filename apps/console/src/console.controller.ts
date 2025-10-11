import { Controller, Get, Version } from '@nestjs/common';
import { ConsoleService } from './console.service';

@Controller()
export class ConsoleController {
    constructor(private readonly consoleService: ConsoleService) { }

    @Get()
    getHello(): string {
        return this.consoleService.getHello();
    }

    @Get()
    @Version('2')
    getHelloV2(): string {
        return 'fdsafdsf';
    }
}
