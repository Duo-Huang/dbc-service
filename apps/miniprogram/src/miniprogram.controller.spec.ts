import { Test, TestingModule } from '@nestjs/testing';
import { MiniprogramController } from './miniprogram.controller';
import { MiniprogramService } from './miniprogram.service';

describe('MiniprogramController', () => {
    let miniprogramController: MiniprogramController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [MiniprogramController],
            providers: [MiniprogramService],
        }).compile();

        miniprogramController = app.get<MiniprogramController>(
            MiniprogramController,
        );
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(miniprogramController.getHello()).toBe('Hello World!');
        });
    });
});
