# VS Code 调试指南

## 快速开始

按 `F5` 或点击左侧调试图标，选择对应的调试配置即可开始调试。

## 可用的调试配置

### 1. 调试 Console 应用

- **用途**: 调试 Console 应用（开发环境配置）
- **端口**: 从 `config/default.yaml` 读取 (默认 4000)
- **环境**: `NODE_ENV=development`
- **快捷键**: `F5` (默认)

### 2. 调试 Miniprogram 应用

- **用途**: 调试 Miniprogram 应用（开发环境配置）
- **端口**: 从 `config/default.yaml` 读取 (默认 3000)
- **环境**: `NODE_ENV=development`

### 3. 调试 Console (生产配置)

- **用途**: 使用生产环境配置调试 Console 应用
- **端口**: 从 `config/production.yaml` 读取 (默认 9000)
- **环境**: `NODE_ENV=production`
- **场景**: 测试生产环境配置是否正确

### 4. 调试 Console (自定义端口)

- **用途**: 使用自定义端口调试
- **端口**: Console=5000, Miniprogram=6000 (通过环境变量覆盖)
- **环境**: `NODE_ENV=development`
- **场景**: 测试环境变量覆盖功能
- **说明**: 配置已应用独立化，通过 `CONSOLE_SERVER_PORT` 和 `MINIPROGRAM_SERVER_PORT` 环境变量覆盖

### 5. 附加到进程

- **用途**: 附加到已运行的 Node.js 进程
- **端口**: 9229 (默认调试端口)
- **使用场景**:
    - 应用已经在运行，想要附加调试器
    - 手动启动应用：`node --inspect dist/apps/console/main.js`

### 6. 运行当前测试文件

- **用途**: 调试当前打开的测试文件
- **使用方法**: 打开 `*.spec.ts` 文件，按 `F5`
- **场景**: 单元测试调试

### 7. 调试所有应用 (组合配置)

- **用途**: 同时调试 Console 和 Miniprogram 应用
- **场景**: 需要同时运行多个服务进行联调

## 调试技巧

### 设置断点

1. 在代码行号左侧点击，设置普通断点（红点）
2. 右键点击断点，可以设置条件断点或日志点
3. 快捷键：`F9`

### 调试快捷键

- `F5`: 继续执行
- `F10`: 单步跳过
- `F11`: 单步进入
- `Shift+F11`: 单步跳出
- `Shift+F5`: 停止调试
- `Ctrl+Shift+F5`: 重启调试

### 查看变量

- **局部变量**: 在左侧调试面板的"变量"区域自动显示
- **监视变量**: 在"监视"面板添加表达式
- **调用堆栈**: 查看函数调用链

### 调试控制台

在调试时，可以在"调试控制台"中执行任意 JavaScript 表达式：

```javascript
// 查看变量（配置已扁平化）
console.log(this.configService.get('server.port'));

// 执行函数
this.someMethod();

// 修改变量（仅在调试会话中生效）
port = 8888;
```

## 调试配置项

### 环境变量配置

在 `launch.json` 的 `env` 字段中设置：

```json
"env": {
    "NODE_ENV": "production",
    "CONSOLE_SERVER_PORT": "8080"
}
```

### 跳过不需要调试的文件

`skipFiles` 配置跳过 Node.js 内部模块：

```json
"skipFiles": ["<node_internals>/**"]
```

如需跳过其他文件（如 node_modules）：

```json
"skipFiles": [
    "<node_internals>/**",
    "${workspaceFolder}/node_modules/**"
]
```

### 自动重启

启用 `restart: true` 后，当代码改变时自动重启调试会话（需要配合 watch 模式）。

## 常见问题

### Q: 断点不生效（灰色）？

**A**:

1. 确保启用了 `sourceMaps: true`
2. 检查 TypeScript 编译配置 `tsconfig.json` 中的 `sourceMap: true`
3. 重启调试会话

### Q: 如何调试已经运行的应用？

**A**:

1. 启动应用时加上 `--inspect` 参数：
    ```bash
    node --inspect dist/apps/console/main.js
    ```
2. 使用"附加到进程"配置
3. 连接到 `localhost:9229`

### Q: 如何调试不同的环境配置？

**A**:

- 修改 `launch.json` 中的 `env.NODE_ENV`
- 或者创建新的调试配置

### Q: 调试时端口冲突？

**A**:

1. 检查是否有其他进程占用端口：`lsof -i :端口号`
2. 使用"自定义端口"配置
3. 在配置中设置不同的 `SERVER_*_PORT` 环境变量

### Q: 如何同时调试前后端？

**A**:

1. 使用"调试所有应用"组合配置
2. 或者分别启动多个调试会话（可以在调试面板中看到多个会话）

## 最佳实践

1. **使用条件断点**: 只在特定条件下暂停，避免频繁中断

    ```
    例如：userId === '123'
    ```

2. **使用日志点**: 不中断执行，只输出日志

    ```
    例如：Request received: {method}
    ```

3. **监视表达式**: 实时查看复杂表达式的值

    ```
    例如：this.configService.get('server.port')
    ```

4. **分层调试**:
    - 先在高层（Controller/Service）设置断点定位问题区域
    - 再在底层（具体函数）深入调试

5. **配置管理**:
    - 开发环境使用 `development` 配置
    - 测试生产配置问题时使用 `production` 配置
    - 测试环境变量覆盖时使用自定义配置

## 扩展推荐

安装以下 VS Code 扩展可以提升调试体验：

- **Error Lens**: 实时显示错误和警告
- **GitLens**: Git 历史和代码作者信息
- **Prettier**: 代码格式化
- **ESLint**: 代码规范检查
- **Jest Runner**: 快速运行和调试单个测试
- **Thunder Client**: API 测试（调试 HTTP 接口时使用）

## 相关文件

- `launch.json`: 调试配置文件
- `settings.json`: VS Code 工作区设置
- `CONFIG_USAGE.md`: 配置系统使用说明
- `tsconfig.json`: TypeScript 配置（影响 source maps）
