\set ON_ERROR_STOP 1

-- 0. 变量（可通过命令行 -v 覆盖）
\set db_name        'dbc_local'
\set migration_user 'dbc_migrator'
\set migration_password '''dbc.local.migrator.1234'''
\set app_write_role 'dbc_app_writer'
\set app_read_role  'dbc_app_reader'
\set miniprogram_user   'dbc_miniprogram_writer'
\set miniprogram_password '''dbc.local.123'''
\set console_user   'dbc_console_writer'
\set console_password '''dbc.local.123'''
\set readonly_user  'dbc_readonly'
\set readonly_password '''dbc.local.readonly.123'''
\set schema_name    'dbc'

BEGIN;

-- 1. 创建迁移用户（使用 CREATE ROLE）
CREATE ROLE :migration_user WITH LOGIN PASSWORD :migration_password;

-- 2. 创建应用分组角色（无登录，集中授权）
CREATE ROLE :app_write_role NOLOGIN;
CREATE ROLE :app_read_role NOLOGIN;

-- 3. 创建具体应用用户
CREATE ROLE :miniprogram_user WITH LOGIN PASSWORD :miniprogram_password;
CREATE ROLE :console_user WITH LOGIN PASSWORD :console_password;
CREATE ROLE :readonly_user WITH LOGIN PASSWORD :readonly_password;

-- 4. 将应用用户加入分组角色（幂等）
GRANT :app_write_role TO :miniprogram_user;
GRANT :app_write_role TO :console_user;
GRANT :app_read_role  TO :readonly_user;

-- 5. 创建/接管 schema，并设置 owner 为迁移用户
CREATE SCHEMA IF NOT EXISTS :schema_name AUTHORIZATION :migration_user;
ALTER SCHEMA :schema_name OWNER TO :migration_user;

-- 6. 设定 search_path（便于 SQL 使用短名）
ALTER ROLE :migration_user SET search_path = :schema_name, public;
ALTER ROLE :miniprogram_user   SET search_path = :schema_name, public;
ALTER ROLE :console_user   SET search_path = :schema_name, public;
ALTER ROLE :readonly_user  SET search_path = :schema_name, public;

-- 7. 收紧 PUBLIC 默认权限（可选，视环境策略决定）
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE :db_name FROM PUBLIC;

-- 8. 明确授予数据库连接权限
GRANT CONNECT, TEMPORARY ON DATABASE :db_name TO :migration_user;
GRANT CONNECT ON DATABASE :db_name TO :app_write_role;
GRANT CONNECT ON DATABASE :db_name TO :app_read_role;

-- 9. schema 权限：迁移用户可创建；应用分组可使用
GRANT USAGE ON SCHEMA :schema_name TO :migration_user;
GRANT CREATE ON SCHEMA :schema_name TO :migration_user;
GRANT USAGE ON SCHEMA :schema_name TO :app_write_role;
GRANT USAGE ON SCHEMA :schema_name TO :app_read_role;

-- 10. 未来对象默认权限：显式指明为迁移用户创建的对象
ALTER DEFAULT PRIVILEGES FOR ROLE :migration_user IN SCHEMA :schema_name
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :app_write_role;
ALTER DEFAULT PRIVILEGES FOR ROLE :migration_user IN SCHEMA :schema_name
  GRANT USAGE, SELECT ON SEQUENCES TO :app_write_role;
ALTER DEFAULT PRIVILEGES FOR ROLE :migration_user IN SCHEMA :schema_name
  GRANT SELECT ON TABLES TO :app_read_role;
ALTER DEFAULT PRIVILEGES FOR ROLE :migration_user IN SCHEMA :schema_name
  GRANT USAGE, SELECT ON SEQUENCES TO :app_read_role;

-- 11. 现有对象一次性补授权（幂等）
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA :schema_name TO :app_write_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA :schema_name TO :app_write_role;
GRANT SELECT ON ALL TABLES IN SCHEMA :schema_name TO :app_read_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA :schema_name TO :app_read_role;

COMMIT;

\echo 'setup.sql 执行完成。'
