#!/bin/bash
# 数据库初始化脚本 - 基于 setup.sql
# 用法: ./run-setup.sh [环境变量文件路径]
# 示例: ./run-setup.sh ~/db-passwords.env

set -euo pipefail

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_SQL="$SCRIPT_DIR/setup.sql"

# 默认环境变量文件路径
ENV_FILE="${1:-$SCRIPT_DIR/db-passwords.env}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v psql &> /dev/null; then
        log_error "psql 未安装，请先安装 PostgreSQL 客户端"
        exit 1
    fi

    if [ ! -f "$SETUP_SQL" ]; then
        log_error "setup.sql 文件不存在: $SETUP_SQL"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "环境变量文件不存在: $ENV_FILE"
        log_info "请创建环境变量文件，参考以下格式："
        cat << 'EOF'
# 管理员密码（用于引导）
ADMIN_PASS=your_secure_admin_password

# 各用户密码
MIGRATOR_PASS=your_secure_migrator_password
MINIAPP_PASS=your_secure_miniapp_password
CONSOLE_PASS=your_secure_console_password
READONLY_PASS=your_secure_readonly_password

# 数据库信息
DB_NAME=dbc_local
DB_HOST=your-internal-host
DB_PORT=5432
EOF
        exit 1
    fi

    log_info "依赖检查通过"
}

# 加载环境变量
load_env() {
    log_info "加载环境变量: $ENV_FILE"

    # 检查文件权限
    if [ "$(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %A "$ENV_FILE" 2>/dev/null)" != "600" ]; then
        log_warn "环境变量文件权限不是 600，建议执行: chmod 600 $ENV_FILE"
    fi

    # 加载环境变量
    set -a  # 自动导出变量
    source "$ENV_FILE"
    set +a

    # 检查必需变量
    local required_vars=("ADMIN_PASS" "MIGRATOR_PASS" "MINIAPP_PASS" "CONSOLE_PASS" "READONLY_PASS" "DB_NAME" "DB_HOST" "DB_PORT")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            log_error "缺少必需的环境变量: $var"
            exit 1
        fi
    done

    log_info "环境变量加载完成"
}

# 测试数据库连接
test_connection() {
    log_info "测试数据库连接..."

    if PGPASSWORD="$ADMIN_PASS" psql \
        "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=admin sslmode=require" \
        -c "SELECT 1;" > /dev/null 2>&1; then
        log_info "数据库连接成功"
    else
        log_error "数据库连接失败，请检查连接信息"
        exit 1
    fi
}

# 执行数据库初始化
run_setup() {
    log_info "开始执行数据库初始化..."

    PGPASSWORD="$ADMIN_PASS" psql \
        "host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=admin sslmode=require" \
        -v db_name="$DB_NAME" \
        -v migration_user=dbc_migrator -v migration_password="'$MIGRATOR_PASS'" \
        -v app_write_role=dbc_app_writer -v app_read_role=dbc_app_reader \
        -v miniapp_user=dbc_miniapp_writer -v miniapp_password="'$MINIAPP_PASS'" \
        -v console_user=dbc_console_writer -v console_password="'$CONSOLE_PASS'" \
        -v readonly_user=dbc_readonly -v readonly_password="'$READONLY_PASS'" \
        -v schema_name=dbc \
        -f "$SETUP_SQL"

    log_info "数据库初始化完成！"
}

# 显示使用信息
show_usage() {
    echo "用法: $0 [环境变量文件路径]"
    echo ""
    echo "参数:"
    echo "  环境变量文件路径    可选，默认为 scripts/db-passwords.env"
    echo ""
    echo "示例:"
    echo "  $0                                    # 使用默认环境变量文件"
    echo "  $0 ~/my-passwords.env                # 使用指定环境变量文件"
    echo "  $0 /path/to/db-passwords.env         # 使用绝对路径"
    echo ""
    echo "环境变量文件格式:"
    echo "  ADMIN_PASS=your_admin_password"
    echo "  MIGRATOR_PASS=your_migrator_password"
    echo "  MINIAPP_PASS=your_miniapp_password"
    echo "  CONSOLE_PASS=your_console_password"
    echo "  READONLY_PASS=your_readonly_password"
    echo "  DB_NAME=dbc_local"
    echo "  DB_HOST=your-internal-host"
    echo "  DB_PORT=5432"
}

# 主函数
main() {
    # 检查帮助参数
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        show_usage
        exit 0
    fi

    log_info "开始数据库初始化流程..."

    check_dependencies
    load_env
    test_connection
    run_setup

    log_info "所有操作完成！"
    log_warn "建议执行完成后删除密码文件: rm $ENV_FILE"
}

# 执行主函数
main "$@"
