-- Supabase Row Level Security (RLS) Policies for FamilyFlow
-- 
-- This file contains SQL policies to enable Row Level Security at the database level.
-- These policies ensure that family data is isolated - users can only access data
-- from families they belong to.
--
-- IMPORTANT: Run these policies in Supabase SQL Editor after creating the tables.
-- RLS must be enabled on each table before these policies will work.
--
-- Enable RLS on tables:
--   ALTER TABLE family ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE family_member ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE backlog_item ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE sprint ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE task ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE standup_entry ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE retrospective ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE achievement ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Family Table Policies
-- ============================================
-- Users can view families they are members of
CREATE POLICY "Users can view their families"
    ON family
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = family.id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- Users can create new families (they become the first member)
CREATE POLICY "Users can create families"
    ON family
    FOR INSERT
    WITH CHECK (true); -- Initial creator check done in application logic

-- Users can update families they belong to (parents only, enforced in app)
CREATE POLICY "Parents can update their families"
    ON family
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = family.id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- ============================================
-- Family Member Table Policies
-- ============================================
-- Users can view family members in their families
CREATE POLICY "Users can view family members in their families"
    ON family_member
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_member fm
            WHERE fm.family_id = family_member.family_id
            AND fm.user_id = auth.uid()::text
            AND fm.is_active = true
        )
    );

-- Users can add members to families they belong to (parents only, enforced in app)
CREATE POLICY "Parents can add family members"
    ON family_member
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_member fm
            WHERE fm.family_id = family_member.family_id
            AND fm.user_id = auth.uid()::text
            AND fm.role = 'parent'
            AND fm.is_active = true
        )
    );

-- ============================================
-- Backlog Item Table Policies
-- ============================================
-- Users can view backlog items from their families
CREATE POLICY "Users can view backlog items in their families"
    ON backlog_item
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = backlog_item.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- Parents can create backlog items in their families
CREATE POLICY "Parents can create backlog items"
    ON backlog_item
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = backlog_item.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- Parents can update backlog items in their families
CREATE POLICY "Parents can update backlog items"
    ON backlog_item
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = backlog_item.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- Parents can delete backlog items in their families
CREATE POLICY "Parents can delete backlog items"
    ON backlog_item
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = backlog_item.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- ============================================
-- Sprint Table Policies
-- ============================================
-- Users can view sprints from their families
CREATE POLICY "Users can view sprints in their families"
    ON sprint
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = sprint.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- Parents can create sprints in their families
CREATE POLICY "Parents can create sprints"
    ON sprint
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = sprint.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- Parents can update sprints in their families
CREATE POLICY "Parents can update sprints"
    ON sprint
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.family_id = sprint.family_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- ============================================
-- Task Table Policies
-- ============================================
-- Users can view tasks from sprints in their families
CREATE POLICY "Users can view tasks in their families"
    ON task
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sprint
            JOIN family_member ON family_member.family_id = sprint.family_id
            WHERE sprint.id = task.sprint_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- Parents can create tasks in sprints they have access to
CREATE POLICY "Parents can create tasks"
    ON task
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sprint
            JOIN family_member ON family_member.family_id = sprint.family_id
            WHERE sprint.id = task.sprint_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- Users can update tasks assigned to them, or parents can update any task
CREATE POLICY "Users can update their assigned tasks or parents can update any task"
    ON task
    FOR UPDATE
    USING (
        task.assigned_to_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM sprint
            JOIN family_member ON family_member.family_id = sprint.family_id
            WHERE sprint.id = task.sprint_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- ============================================
-- Standup Entry Table Policies
-- ============================================
-- Users can view standup entries from their families
CREATE POLICY "Users can view standup entries in their families"
    ON standup_entry
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_member fm1
            JOIN family_member fm2 ON fm2.family_id = fm1.family_id
            JOIN sprint ON sprint.family_id = fm1.family_id
            WHERE standup_entry.sprint_id = sprint.id
            AND standup_entry.family_member_id = fm2.id
            AND fm1.user_id = auth.uid()::text
            AND fm1.is_active = true
        )
    );

-- Users can create standup entries for themselves
CREATE POLICY "Users can create their own standup entries"
    ON standup_entry
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.id = standup_entry.family_member_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- Users can update their own standup entries
CREATE POLICY "Users can update their own standup entries"
    ON standup_entry
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM family_member
            WHERE family_member.id = standup_entry.family_member_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- ============================================
-- Retrospective Table Policies
-- ============================================
-- Users can view retrospectives from their families
CREATE POLICY "Users can view retrospectives in their families"
    ON retrospective
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sprint
            JOIN family_member ON family_member.family_id = sprint.family_id
            WHERE sprint.id = retrospective.sprint_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.is_active = true
        )
    );

-- Parents can create retrospectives for sprints in their families
CREATE POLICY "Parents can create retrospectives"
    ON retrospective
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sprint
            JOIN family_member ON family_member.family_id = sprint.family_id
            WHERE sprint.id = retrospective.sprint_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- Parents can update retrospectives in their families
CREATE POLICY "Parents can update retrospectives"
    ON retrospective
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sprint
            JOIN family_member ON family_member.family_id = sprint.family_id
            WHERE sprint.id = retrospective.sprint_id
            AND family_member.user_id = auth.uid()::text
            AND family_member.role = 'parent'
            AND family_member.is_active = true
        )
    );

-- ============================================
-- Achievement Table Policies
-- ============================================
-- Users can view achievements from their families
CREATE POLICY "Users can view achievements in their families"
    ON achievement
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM family_member fm1
            JOIN family_member fm2 ON fm2.family_id = fm1.family_id
            WHERE achievement.family_member_id = fm2.id
            AND fm1.user_id = auth.uid()::text
            AND fm1.is_active = true
        )
    );

-- System can create achievements (handled by application logic)
-- Achievements are created automatically, not by users
-- No INSERT policy needed - handled by service role key in application

