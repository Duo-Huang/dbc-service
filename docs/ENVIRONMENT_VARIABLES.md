# 环境变量配置指南

本文档详细说明项目中所需的环境变量及其配置方法。

---

## 📋 环境变量清单

### GitHub Actions 部署所需

#### 腾讯云凭证

| 变量名                    | 环境 | 说明                | 示例值              |
| ------------------------- | ---- | ------------------- | ------------------- |
| `DEV_TENCENT_SECRET_ID`   | DEV  | 腾讯云 API 密钥 ID  | `AKIDxxxxxxxxxxxxx` |
| `DEV_TENCENT_SECRET_KEY`  | DEV  | 腾讯云 API 密钥 Key | `xxxxxxxxxxxxxxxx`  |
| `PROD_TENCENT_SECRET_ID`  | PROD | 腾讯云 API 密钥 ID  | `AKIDxxxxxxxxxxxxx` |
| `PROD_TENCENT_SECRET_KEY` | PROD | 腾讯云 API 密钥 Key | `xxxxxxxxxxxxxxxx`  |

#### 数据库 Migration 凭证

**DEV 环境：**

| 变量名                    | 说明          |
| ------------------------- | ------------- |
| `DEV_MIGRATION_DB_HOST`   | 数据库主机    |
| `DEV_MIGRATION_DB_PORT`   | 数据库端口    |
| `DEV_MIGRATION_DB_NAME`   | 数据库名称    |
| `DEV_MIGRATION_DB_SCHEMA` | 数据库 Schema |
| `DEV_MIGRATION_USER`      | 数据库用户名  |
| `DEV_MIGRATION_PASSWORD`  | 数据库密码    |

**PROD 环境：**

| 变量名                     | 说明          |
| -------------------------- | ------------- |
| `PROD_MIGRATION_DB_HOST`   | 数据库主机    |
| `PROD_MIGRATION_DB_PORT`   | 数据库端口    |
| `PROD_MIGRATION_DB_NAME`   | 数据库名称    |
| `PROD_MIGRATION_DB_SCHEMA` | 数据库 Schema |
| `PROD_MIGRATION_USER`      | 数据库用户名  |
| `PROD_MIGRATION_PASSWORD`  | 数据库密码    |

#### 应用运行时数据库凭证

**DEV 环境 - Console 应用：**

| 变量名                    | 说明          |
| ------------------------- | ------------- |
| `DEV_CONSOLE_DB_HOST`     | 数据库主机    |
| `DEV_CONSOLE_DB_PORT`     | 数据库端口    |
| `DEV_CONSOLE_DB_NAME`     | 数据库名称    |
| `DEV_CONSOLE_DB_SCHEMA`   | 数据库 Schema |
| `DEV_CONSOLE_DB_USER`     | 数据库用户名  |
| `DEV_CONSOLE_DB_PASSWORD` | 数据库密码    |

**DEV 环境 - Miniapp 应用：**

| 变量名                    | 说明          |
| ------------------------- | ------------- |
| `DEV_MINIAPP_DB_HOST`     | 数据库主机    |
| `DEV_MINIAPP_DB_PORT`     | 数据库端口    |
| `DEV_MINIAPP_DB_NAME`     | 数据库名称    |
| `DEV_MINIAPP_DB_SCHEMA`   | 数据库 Schema |
| `DEV_MINIAPP_DB_USER`     | 数据库用户名  |
| `DEV_MINIAPP_DB_PASSWORD` | 数据库密码    |

**PROD 环境 - Console 应用：**

| 变量名                     | 说明          |
| -------------------------- | ------------- |
| `PROD_CONSOLE_DB_HOST`     | 数据库主机    |
| `PROD_CONSOLE_DB_PORT`     | 数据库端口    |
| `PROD_CONSOLE_DB_NAME`     | 数据库名称    |
| `PROD_CONSOLE_DB_SCHEMA`   | 数据库 Schema |
| `PROD_CONSOLE_DB_USER`     | 数据库用户名  |
| `PROD_CONSOLE_DB_PASSWORD` | 数据库密码    |

**PROD 环境 - Miniapp 应用：**

| 变量名                     | 说明          |
| -------------------------- | ------------- |
| `PROD_MINIAPP_DB_HOST`     | 数据库主机    |
| `PROD_MINIAPP_DB_PORT`     | 数据库端口    |
| `PROD_MINIAPP_DB_NAME`     | 数据库名称    |
| `PROD_MINIAPP_DB_SCHEMA`   | 数据库 Schema |
| `PROD_MINIAPP_DB_USER`     | 数据库用户名  |
| `PROD_MINIAPP_DB_PASSWORD` | 数据库密码    |

### GitHub Actions 自动提供

| 变量名          | 说明               | 用途                                |
| --------------- | ------------------ | ----------------------------------- |
| `CI`            | 自动设置为 `true`  | 用于判断是否在 CI 环境中            |
| `GITHUB_TOKEN`  | 自动提供的临时令牌 | 用于访问 GitHub API（如创建 Issue） |
| `GITHUB_OUTPUT` | 输出变量文件路径   | 用于 job 间传递数据                 |

### 应用运行时环境变量

| 变量名                | 说明             | 默认值        | 配置位置            |
| --------------------- | ---------------- | ------------- | ------------------- |
| `NODE_ENV`            | 运行环境         | `development` | 启动脚本            |
| `CONSOLE_SERVER_PORT` | Console 应用端口 | `5000`        | config/default.yaml |
| `MINIAPP_SERVER_PORT` | Miniapp 应用端口 | `6000`        | config/default.yaml |
| `APP_NAME`            | 应用名称         | -             | 代码中自动设置      |

### 数据库环境变量（可选）

通过 `config/custom-environment-variables.yaml` 映射：

| 变量名              | 说明       | 配置映射            |
| ------------------- | ---------- | ------------------- |
| `DATABASE_HOST`     | 数据库主机 | `database.host`     |
| `DATABASE_PORT`     | 数据库端口 | `database.port`     |
| `DATABASE_USER`     | 数据库用户 | `database.username` |
| `DATABASE_PASSWORD` | 数据库密码 | `database.password` |
| `DATABASE_NAME`     | 数据库名称 | `database.database` |

---

## 🔧 配置方法

### 1. GitHub Web 界面配置（GitHub Actions）

#### 推荐方式：使用 Environment Secrets

1. **创建环境**

    ```
    你的仓库 → Settings → Environments
    ```

2. **创建 DEV 环境**
    - 点击 "New environment"
    - Name: `dev`
    - 点击 "Configure environment"

3. **添加 DEV 环境变量**

    在 "Environment secrets" 部分，添加以下 secrets：

    **腾讯云凭证：**
    - `DEV_TENCENT_SECRET_ID`
    - `DEV_TENCENT_SECRET_KEY`

    **Migration 数据库：**
    - `DEV_MIGRATION_DB_HOST`
    - `DEV_MIGRATION_DB_PORT`
    - `DEV_MIGRATION_DB_NAME`
    - `DEV_MIGRATION_DB_SCHEMA`
    - `DEV_MIGRATION_USER`
    - `DEV_MIGRATION_PASSWORD`

    **Console 应用数据库：**
    - `DEV_CONSOLE_DB_HOST`
    - `DEV_CONSOLE_DB_PORT`
    - `DEV_CONSOLE_DB_NAME`
    - `DEV_CONSOLE_DB_SCHEMA`
    - `DEV_CONSOLE_DB_USER`
    - `DEV_CONSOLE_DB_PASSWORD`

    **Miniapp 应用数据库：**
    - `DEV_MINIAPP_DB_HOST`
    - `DEV_MINIAPP_DB_PORT`
    - `DEV_MINIAPP_DB_NAME`
    - `DEV_MINIAPP_DB_SCHEMA`
    - `DEV_MINIAPP_DB_USER`
    - `DEV_MINIAPP_DB_PASSWORD`

4. **创建 PROD 环境**
    - 返回 Environments，点击 "New environment"
    - Name: `prod`
    - 点击 "Configure environment"
    - （可选）启用 "Required reviewers" 添加部署审批

5. **添加 PROD 环境变量**

    在 "Environment secrets" 部分，添加以下 secrets（将 `DEV_` 替换为 `PROD_`）：

    **腾讯云凭证：**
    - `PROD_TENCENT_SECRET_ID`
    - `PROD_TENCENT_SECRET_KEY`

    **Migration 数据库：**
    - `PROD_MIGRATION_DB_HOST`, `PROD_MIGRATION_DB_PORT`, `PROD_MIGRATION_DB_NAME`, etc.

    **Console 应用数据库：**
    - `PROD_CONSOLE_DB_HOST`, `PROD_CONSOLE_DB_PORT`, `PROD_CONSOLE_DB_NAME`, etc.

    **Miniapp 应用数据库：**
    - `PROD_MINIAPP_DB_HOST`, `PROD_MINIAPP_DB_PORT`, `PROD_MINIAPP_DB_NAME`, etc.

#### 优势

- ✅ **环境隔离** - DEV 和 PROD 凭证分离
- ✅ **安全性** - 可以为 PROD 添加审批流程
- ✅ **可追溯** - 每次部署可以看到使用的环境
- ✅ **易管理** - 环境变量分组管理

#### 获取腾讯云密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 [访问管理 → 访问密钥 → API密钥管理](https://console.cloud.tencent.com/cam/capi)
3. 点击 "新建密钥" 或使用现有密钥
4. 复制 `SecretId` 和 `SecretKey`

⚠️ **安全提示**：

- 密钥一旦创建，`SecretKey` 只显示一次，请妥善保存
- 不要将密钥提交到代码仓库
- 定期轮换密钥
- 使用子账号并设置最小权限原则

---

### 2. VS Code 本地开发配置

#### 方式 A：使用 .env 文件（推荐）

1. **创建 .env 文件**

    在项目根目录创建 `.env` 文件：

    ```bash
    # 项目根目录
    touch .env
    ```

2. **添加环境变量**

    ```env
    # .env
    NODE_ENV=development

    # 应用端口
    CONSOLE_SERVER_PORT=5000
    MINIAPP_SERVER_PORT=6000

    # 数据库配置（可选）
    DATABASE_HOST=localhost
    DATABASE_PORT=5432
    DATABASE_USER=postgres
    DATABASE_PASSWORD=your-password
    DATABASE_NAME=dbc_dev

    # 腾讯云凭证（本地部署时需要）
    TENCENT_SECRET_ID=your-secret-id
    TENCENT_SECRET_KEY=your-secret-key
    ```

3. **确保 .env 在 .gitignore 中**

    `.gitignore` 应该包含：

    ```gitignore
    .env
    .env.local
    .env.*.local
    ```

4. **使用 dotenv 加载（如果需要）**

    项目已经使用 `@nestjs/config`，会自动加载 `.env` 文件。

#### 方式 B：VS Code launch.json 配置

1. **打开 .vscode/launch.json**

2. **在 configurations 中添加 env 字段**

    ```json
    {
        "configurations": [
            {
                "type": "node",
                "request": "launch",
                "name": "Debug Console",
                "runtimeExecutable": "pnpm",
                "runtimeArgs": ["run", "start:debug:console"],
                "env": {
                    "NODE_ENV": "development",
                    "CONSOLE_SERVER_PORT": "5000"
                }
            },
            {
                "type": "node",
                "request": "launch",
                "name": "Debug Miniapp",
                "runtimeExecutable": "pnpm",
                "runtimeArgs": ["run", "start:debug:miniapp"],
                "env": {
                    "NODE_ENV": "development",
                    "MINIAPP_SERVER_PORT": "6000"
                }
            }
        ]
    }
    ```

#### 方式 C：终端中设置

**macOS / Linux:**

```bash
# 临时设置（当前会话）
export CONSOLE_SERVER_PORT=5000
export NODE_ENV=development

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export CONSOLE_SERVER_PORT=5000' >> ~/.zshrc
```

**Windows (PowerShell):**

```powershell
# 临时设置
$env:CONSOLE_SERVER_PORT="5000"
$env:NODE_ENV="development"

# 永久设置（用户级别）
[System.Environment]::SetEnvironmentVariable('CONSOLE_SERVER_PORT', '5000', 'User')
```

---

### 3. Docker Compose 配置

如果使用 Docker Compose，在 `compose.yml` 中配置：

```yaml
services:
    console:
        environment:
            - NODE_ENV=production
            - CONSOLE_SERVER_PORT=5000
            - DATABASE_HOST=postgres
            - DATABASE_PORT=5432
        env_file:
            - .env
```

---

## 📝 配置验证

### 验证 GitHub Secrets

1. **触发 GitHub Actions**

    ```bash
    git push origin main
    ```

2. **查看 Actions 日志**
    - 进入 Actions 标签页
    - 查看最新的 workflow 运行
    - 如果配置正确，部署 job 应该能成功执行

3. **常见错误**
    ```
    Error: Unable to locate credentials
    → 检查 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY 是否设置
    ```

### 验证本地环境变量

```bash
# 检查环境变量是否设置
echo $CONSOLE_SERVER_PORT
echo $NODE_ENV

# 启动应用查看日志
pnpm run start:dev:console
# 应该看到正确的端口号
```

### 验证配置加载

在 NestJS 应用中打印配置：

```typescript
// 临时调试代码
console.log('Config:', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.CONSOLE_SERVER_PORT,
});
```

---

## 🔐 安全最佳实践

### 1. 密钥管理

- ✅ **使用 GitHub Secrets** 存储敏感信息
- ✅ **不要硬编码** 密钥到代码中
- ✅ **不要提交** `.env` 文件到仓库
- ✅ **使用不同密钥** 用于开发和生产环境
- ✅ **定期轮换** 密钥

### 2. .gitignore 配置

确保以下文件被忽略：

```gitignore
# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 敏感配置
config/local.yaml
config/secrets.yaml
*.pem
*.key
```

### 3. 团队协作

1. **创建 .env.example**

    ```env
    # .env.example
    NODE_ENV=development
    CONSOLE_SERVER_PORT=5000
    MINIAPP_SERVER_PORT=6000

    # 数据库配置
    DATABASE_HOST=localhost
    DATABASE_PORT=5432
    DATABASE_USER=
    DATABASE_PASSWORD=
    DATABASE_NAME=

    # 腾讯云凭证（仅本地部署需要）
    TENCENT_SECRET_ID=
    TENCENT_SECRET_KEY=
    ```

2. **文档化**
    - 在 README 中说明必需的环境变量
    - 提供获取凭证的方法
    - 说明默认值和可选配置

3. **使用密钥管理工具**
    - 1Password
    - AWS Secrets Manager
    - HashiCorp Vault

---

## 🐛 故障排查

### 问题 1: GitHub Actions 部署失败

**症状：**

```
Error: Unable to locate credentials
```

**解决方案：**

1. 检查 GitHub Secrets 是否正确设置
2. 确认 secret 名称完全匹配（大小写敏感）
3. 重新生成腾讯云密钥并更新

### 问题 2: 本地环境变量未生效

**症状：**
应用使用了默认值而不是环境变量

**解决方案：**

1. 检查 `.env` 文件是否在项目根目录
2. 确认环境变量名称正确（大写，下划线分隔）
3. 重启开发服务器
4. 检查 `config/custom-environment-variables.yaml` 映射

### 问题 3: 配置优先级问题

**配置加载顺序（优先级从高到低）：**

1. 环境变量
2. 命令行参数
3. `config/local.yaml`
4. `config/{NODE_ENV}.yaml`
5. `config/default.yaml`

---

## 📚 相关文档

- [配置管理指南](./CONFIG.md) - 详细的配置系统说明
- [部署总结](./DEPLOYMENT_SUMMARY.md) - 部署流程和环境变量
- [GitHub Actions 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [腾讯云访问密钥](https://console.cloud.tencent.com/cam/capi)

---

**最后更新**: 2024-10-14
