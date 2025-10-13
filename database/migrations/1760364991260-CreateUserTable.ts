import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1760364991260 implements MigrationInterface {
    name = 'CreateUserTable1760364991260';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "dbc"."user_status_enum" AS ENUM('active', 'frozen', 'deactivated')`,
        );
        await queryRunner.query(
            `CREATE TABLE "user" ("user_id" BIGSERIAL NOT NULL, "phone" character varying(32) NOT NULL, "email" character varying(128), "union_id" character varying(64) NOT NULL, "open_id_official_account" character varying(64), "open_id_service_account" character varying(64), "open_id_miniapp" character varying(64) NOT NULL, "password" character varying(256), "status" "dbc"."user_status_enum" NOT NULL DEFAULT 'active', "last_login_time" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8e1f623798118e629b46a9e6299" UNIQUE ("phone"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_59a4ea9cf5bdbc713d0619c420b" UNIQUE ("union_id"), CONSTRAINT "UQ_73f9a83cf7d8794e60462c48cf5" UNIQUE ("open_id_official_account"), CONSTRAINT "UQ_6530e6f193c02630149020955a8" UNIQUE ("open_id_service_account"), CONSTRAINT "UQ_2dcef6c4b9ed434cd5bbe654297" UNIQUE ("open_id_miniapp"), CONSTRAINT "PK_758b8ce7c18b9d347461b30228d" PRIMARY KEY ("user_id")); COMMENT ON COLUMN "user"."phone" IS '手机号，唯一且不能为空'; COMMENT ON COLUMN "user"."email" IS '邮箱，唯一，可为空'; COMMENT ON COLUMN "user"."union_id" IS '微信UnionID（唯一）'; COMMENT ON COLUMN "user"."open_id_official_account" IS '公众号OpenID'; COMMENT ON COLUMN "user"."open_id_service_account" IS '服务号OpenID'; COMMENT ON COLUMN "user"."open_id_miniapp" IS '小程序OpenID'; COMMENT ON COLUMN "user"."password" IS '加密密码'; COMMENT ON COLUMN "user"."status" IS '状态: active-正常, frozen-冻结, deactivated-注销'; COMMENT ON COLUMN "user"."last_login_time" IS '最后登录时间'; COMMENT ON COLUMN "user"."created_at" IS '注册时间'; COMMENT ON COLUMN "user"."updated_at" IS '更新时间'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "dbc"."user_status_enum"`);
    }
}
