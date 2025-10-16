#!/bin/bash

# Migration 变更检测脚本
# 检测两个 git ref 之间的 migration 文件差异
#
# 用法:
#   ./detect-migration-changes.sh <base-ref> <target-ref>
#
# 示例:
#   ./detect-migration-changes.sh prod-prev prod-latest
#
# 输出变量（GitHub Actions 格式）:
#   needs_revert=true|false   - 是否需要回退 migration
#   revert_count=N            - 需要回退的 migration 数量
#   new_migrations=...        - 新增的 migration 文件列表（多行）

set -e

BASE_REF=${1:-prod-prev}
TARGET_REF=${2:-prod-latest}

echo "======================================"
echo "检测 Migration 变更"
echo "======================================"
echo "  Base:   $BASE_REF"
echo "  Target: $TARGET_REF"
echo ""

# 检查 refs 是否存在
if ! git rev-parse "$BASE_REF" >/dev/null 2>&1; then
    echo "❌ 错误: $BASE_REF 不存在"
    exit 1
fi

if ! git rev-parse "$TARGET_REF" >/dev/null 2>&1; then
    echo "❌ 错误: $TARGET_REF 不存在"
    exit 1
fi

BASE_COMMIT=$(git rev-parse "$BASE_REF")
TARGET_COMMIT=$(git rev-parse "$TARGET_REF")

echo "  Base commit:   $BASE_COMMIT"
echo "  Target commit: $TARGET_COMMIT"
echo ""

# 列出两个版本的 migration 文件
echo "📋 列出 migration 文件..."
git ls-tree -r --name-only "$TARGET_COMMIT" database/migrations/ 2>/dev/null | sort > /tmp/target_migrations.txt || touch /tmp/target_migrations.txt
git ls-tree -r --name-only "$BASE_COMMIT" database/migrations/ 2>/dev/null | sort > /tmp/base_migrations.txt || touch /tmp/base_migrations.txt

echo "  Target 版本: $(wc -l < /tmp/target_migrations.txt | tr -d ' ') 个 migration"
echo "  Base 版本:   $(wc -l < /tmp/base_migrations.txt | tr -d ' ') 个 migration"
echo ""

# 找出 TARGET 新增的 migrations（需要回退的）
NEW_MIGRATIONS=$(comm -13 /tmp/base_migrations.txt /tmp/target_migrations.txt || true)

if [ -z "$NEW_MIGRATIONS" ]; then
    echo "✅ 无新增 migration，跳过回退"
    echo "   Target 版本未引入新的数据库变更"
    echo ""

    # 输出到 GitHub Actions
    if [ -n "$GITHUB_OUTPUT" ]; then
        echo "needs_revert=false" >> "$GITHUB_OUTPUT"
        echo "revert_count=0" >> "$GITHUB_OUTPUT"
    fi

    # 输出到环境变量
    export NEEDS_REVERT=false
    export REVERT_COUNT=0
else
    REVERT_COUNT=$(echo "$NEW_MIGRATIONS" | wc -l | tr -d ' ')
    echo "⚠️  发现 $REVERT_COUNT 个新增 migration，需要回退:"
    echo "$NEW_MIGRATIONS" | sed 's/^/     - /'
    echo ""

    # 输出到 GitHub Actions
    if [ -n "$GITHUB_OUTPUT" ]; then
        echo "needs_revert=true" >> "$GITHUB_OUTPUT"
        echo "revert_count=$REVERT_COUNT" >> "$GITHUB_OUTPUT"
        echo "new_migrations<<EOF" >> "$GITHUB_OUTPUT"
        echo "$NEW_MIGRATIONS" >> "$GITHUB_OUTPUT"
        echo "EOF" >> "$GITHUB_OUTPUT"
    fi

    # 输出到环境变量
    export NEEDS_REVERT=true
    export REVERT_COUNT=$REVERT_COUNT
    export NEW_MIGRATIONS
fi

echo "======================================"
echo "📊 检测结果:"
echo "======================================"
echo "  Needs Revert: ${NEEDS_REVERT:-false}"
echo "  Revert Count: ${REVERT_COUNT:-0}"
echo "======================================"
echo ""

