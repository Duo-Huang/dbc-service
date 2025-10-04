import { Test, TestingModule } from '@nestjs/testing';
import { MiniappController } from './miniapp.controller';
import { MiniappService } from './miniapp.service';

describe('MiniappController', () => {
    let miniappController: MiniappController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [MiniappController],
            providers: [MiniappService],
        }).compile();

        miniappController = app.get<MiniappController>(MiniappController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(miniappController.getHello()).toBe('Hello World!');
        });
    });
});
