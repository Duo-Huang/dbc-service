import { Test, TestingModule } from '@nestjs/testing';
import { VersioningType } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { APP_NAMES } from '@dbc/core';
import { MiniprogramModule } from './../src/miniprogram.module';

// 设置应用名称环境变量，供配置模块使用
process.env.APP_NAME = APP_NAMES.MINIPROGRAM;

describe('MiniprogramController (e2e)', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MiniprogramModule],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        // 设置全局路由前缀（与 main.ts 保持一致）
        app.setGlobalPrefix('/api/wx');

        // 启用 API 版本控制（与 main.ts 保持一致）
        app.enableVersioning({
            type: VersioningType.URI,
            defaultVersion: '1',
        });

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/wx/v1 (GET)', () => {
        return request(app.getHttpAdapter().getInstance().server)
            .get('/api/wx/v1')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual({
                    code: 0,
                    message: null,
                    data: 'Hello World!',
                });
            });
    });
});
