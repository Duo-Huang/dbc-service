import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from '@dbc/auth/enums';

@Entity({ name: 'user' })
export class User {
    @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_id' })
    userId: string;

    @Column({
        type: 'varchar',
        length: 32,
        unique: true,
        comment: '手机号，唯一且不能为空',
    })
    phone: string;

    @Column({
        type: 'varchar',
        length: 128,
        nullable: true,
        unique: true,
        comment: '邮箱，唯一，可为空',
    })
    email: string | null;

    @Column({
        type: 'varchar',
        length: 64,
        name: 'union_id',
        unique: true,
        comment: '微信UnionID（唯一）',
    })
    unionId: string;

    @Column({
        type: 'varchar',
        length: 64,
        name: 'open_id_official_account',
        nullable: true,
        unique: true,
        comment: '公众号OpenID',
    })
    openIdOfficialAccount: string | null;

    @Column({
        type: 'varchar',
        length: 64,
        name: 'open_id_service_account',
        nullable: true,
        unique: true,
        comment: '服务号OpenID',
    })
    openIdServiceAccount: string | null;

    @Column({
        type: 'varchar',
        length: 64,
        name: 'open_id_miniapp',
        unique: true,
        comment: '小程序OpenID',
    })
    openIdMiniapp: string;

    @Column({
        type: 'varchar',
        length: 256,
        nullable: true,
        comment: '加密密码',
    })
    password: string | null;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
        comment: '状态: active-正常, frozen-冻结, deactivated-注销',
    })
    status: UserStatus;

    @Column({
        type: 'timestamptz',
        name: 'last_login_time',
        nullable: true,
        comment: '最后登录时间',
    })
    lastLoginTime: Date | null;

    @CreateDateColumn({
        type: 'timestamptz',
        name: 'created_at',
        comment: '注册时间',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        name: 'updated_at',
        comment: '更新时间',
    })
    updatedAt: Date;
}
