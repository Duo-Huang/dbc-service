import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { ClientType } from '@dbc/auth/enums';

@Entity({
    name: 'user_refresh_token',
    comment: '用户刷新令牌表（仅存储当前有效令牌，支持新登录挤掉旧令牌）',
})
export class UserRefreshToken {
    @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
    id: string;

    // 核心约束：一个用户仅存1条有效refresh-token（新登录覆盖旧记录）
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
    @Index('uk_urt_user_id', { unique: true })
    user: User;

    @Column({
        type: 'enum',
        enum: ClientType,
        name: 'client_type',
        nullable: false,
        comment: '客户端类型：miniapp-小程序，web-Web',
    })
    clientType: ClientType;

    @Column({
        type: 'varchar',
        length: 256,
        name: 'refresh_token_hash',
        comment: 'refresh-token 的 SHA256 哈希值（防明文泄露）',
    })
    refreshTokenHash: string;

    @Column({
        type: 'timestamptz',
        name: 'expires_at',
        comment: '过期时间（90天）',
    })
    @Index('idx_urt_expires_at')
    expiresAt: Date;

    @CreateDateColumn({
        type: 'timestamptz',
        name: 'created_at',
        comment: '创建时间',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        name: 'updated_at',
        comment: '更新时间',
    })
    updatedAt: Date;
}
