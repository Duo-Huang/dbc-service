// PM2 进程管理配置文件
// 用于在生产环境中管理 NestJS 应用

module.exports = {
    apps: [
        {
            name: 'dbc-console',
            script: './dist/apps/console/main.js',
            instances: 2, // 实例数量，可以设置为 'max' 使用所有 CPU 核心
            exec_mode: 'cluster', // 集群模式
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            error_file: './logs/console-error.log',
            out_file: './logs/console-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true, // 自动重启
            watch: false, // 生产环境不建议开启文件监视
            max_memory_restart: '500M', // 内存超过 500MB 时重启
            min_uptime: '10s', // 最小运行时间
            max_restarts: 10, // 最大重启次数
            restart_delay: 4000, // 重启延迟
        },
        {
            name: 'dbc-miniapp',
            script: './dist/apps/miniapp/main.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            error_file: './logs/miniapp-error.log',
            out_file: './logs/miniapp-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            min_uptime: '10s',
            max_restarts: 10,
            restart_delay: 4000,
        },
    ],

    // 部署配置（可选）
    deploy: {
        production: {
            user: 'deploy',
            host: ['your-server.com'],
            ref: 'origin/master',
            repo: 'git@github.com:username/dbc.git',
            path: '/var/www/dbc',
            'post-deploy':
                'pnpm install --prod --frozen-lockfile && pm2 reload ecosystem.config.js --env production',
            env: {
                NODE_ENV: 'production',
            },
        },
    },
};

/*
使用说明：

1. 安装 PM2
   npm install -g pm2

2. 启动应用
   pm2 start ecosystem.config.js

3. 查看应用状态
   pm2 list
   pm2 status

4. 查看日志
   pm2 logs
   pm2 logs dbc-console
   pm2 logs dbc-miniapp

5. 重启应用
   pm2 restart all
   pm2 restart dbc-console

6. 停止应用
   pm2 stop all
   pm2 stop dbc-console

7. 删除应用
   pm2 delete all
   pm2 delete dbc-console

8. 保存 PM2 配置（开机自启）
   pm2 save
   pm2 startup

9. 监控
   pm2 monit

10. 查看详细信息
    pm2 show dbc-console

11. 零停机重载
    pm2 reload ecosystem.config.js
*/
