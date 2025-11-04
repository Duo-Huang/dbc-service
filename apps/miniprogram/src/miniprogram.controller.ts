import { Controller, Get } from '@nestjs/common';
import { MiniprogramService } from './miniprogram.service';

@Controller()
export class MiniprogramController {
    constructor(private readonly miniprogramService: MiniprogramService) {}

    @Get()
    getHello(): string {
        return this.miniprogramService.getHello();
    }
}
