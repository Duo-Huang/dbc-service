import { Controller, Get } from '@nestjs/common';
import { MiniappService } from './miniapp.service';

@Controller()
export class MiniappController {
    constructor(private readonly miniappService: MiniappService) {}

    @Get()
    getHello(): string {
        return this.miniappService.getHello();
    }
}
