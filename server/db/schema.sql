-- ============================================================================
-- PostgreSQL / Lovable Cloud Complete Data Model & Security DDL Migration
-- Tables: profiles, tasks, task_logs, user_roles, rate_limits
-- Security: Row Level Security (RLS) on ALL tables + has_role() Stored Procedure
-- ============================================================================

-- 1. Create User Profiles Table (Foreign Key to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    input_text TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('uppercase', 'lowercase', 'reverse', 'word_count', 'summarization', 'code_audit')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'queued', 'processing', 'completed', 'cancelled', 'retrying')),
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create Task Logs Table
CREATE TABLE IF NOT EXISTS task_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 5. Create Rate Limits Counter Table (Per-User Rate Limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
    user_id TEXT PRIMARY KEY,
    task_count INT NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create has_role() Helper Stored Procedure (Per Platform Convention)
CREATE OR REPLACE FUNCTION has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = user_id_param AND role = role_name_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable Row Level Security (RLS) Policies on ALL Tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users read/write ONLY their own profile
CREATE POLICY profiles_user_policy ON profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- RLS Policy: Users read/write ONLY their own tasks
CREATE POLICY tasks_user_policy ON tasks
    FOR ALL
    USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
    WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS Policy: Users read/write ONLY logs for their own tasks
CREATE POLICY task_logs_user_policy ON task_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_logs.task_id
            AND (tasks.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_logs.task_id
            AND (tasks.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
        )
    );

-- RLS Policy: User Roles read by owner or admin
CREATE POLICY user_roles_policy ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS Policy: Rate Limits read/write by owner
CREATE POLICY rate_limits_policy ON rate_limits
    FOR ALL
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);
