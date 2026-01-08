-- Portfolio Project Position Management Functions
-- This migration adds PostgreSQL functions to manage project positions automatically
-- ensuring sequential numbering (1, 2, 3...) with no gaps or duplicates

-- Function 1: Shift project positions up or down
-- Used when inserting at position N (shifts N+ up by 1)
-- Used when deleting (shifts N+ down by 1)
CREATE OR REPLACE FUNCTION shift_project_positions(
  target_position INTEGER,
  shift_amount INTEGER,
  exclude_project_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE projects
  SET display_order = display_order + shift_amount,
      updated_at = now()
  WHERE display_order >= target_position
    AND (exclude_project_id IS NULL OR id != exclude_project_id);

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Normalize all project positions to sequential numbering
-- Ensures positions are 1, 2, 3... with no gaps
-- Ordered by current position, then creation date for stability
CREATE OR REPLACE FUNCTION normalize_project_positions() RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  WITH numbered AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY display_order ASC, created_at ASC) as new_order
    FROM projects
  )
  UPDATE projects p
  SET display_order = n.new_order,
      updated_at = now()
  FROM numbered n
  WHERE p.id = n.id
    AND p.display_order != n.new_order;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Get next available position for appending new projects
CREATE OR REPLACE FUNCTION get_next_project_position() RETURNS INTEGER AS $$
DECLARE
  max_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(display_order), 0) + 1 INTO max_pos FROM projects;
  RETURN max_pos;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Update project position with automatic shifting
-- This is the main function called when changing a project's position
CREATE OR REPLACE FUNCTION update_project_position(
  project_id UUID,
  new_position INTEGER
) RETURNS TABLE(
  success BOOLEAN,
  old_position INTEGER,
  affected_count INTEGER,
  message TEXT
) AS $$
DECLARE
  current_position INTEGER;
  total_projects INTEGER;
  shifted_count INTEGER := 0;
BEGIN
  -- Get current position
  SELECT display_order INTO current_position
  FROM projects
  WHERE id = project_id;

  IF current_position IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, 0, 'Project not found';
    RETURN;
  END IF;

  -- Get total project count
  SELECT COUNT(*) INTO total_projects FROM projects;

  -- Validate new position
  IF new_position < 1 OR new_position > total_projects THEN
    RETURN QUERY SELECT FALSE, current_position, 0,
      format('Position must be between 1 and %s', total_projects);
    RETURN;
  END IF;

  -- If position unchanged, no work needed
  IF current_position = new_position THEN
    RETURN QUERY SELECT TRUE, current_position, 0, 'Position unchanged';
    RETURN;
  END IF;

  -- Moving down (e.g., 2 → 5): shift 3,4,5 down to 2,3,4
  IF new_position > current_position THEN
    SELECT shift_project_positions(current_position + 1, -1, project_id) INTO shifted_count;

  -- Moving up (e.g., 5 → 2): shift 2,3,4 up to 3,4,5
  ELSIF new_position < current_position THEN
    SELECT shift_project_positions(new_position, 1, project_id) INTO shifted_count;
  END IF;

  -- Update the project to its new position
  UPDATE projects
  SET display_order = new_position,
      updated_at = now()
  WHERE id = project_id;

  RETURN QUERY SELECT TRUE, current_position, shifted_count,
    format('Moved from position %s to %s, shifted %s projects',
           current_position, new_position, shifted_count);
END;
$$ LANGUAGE plpgsql;

-- Add constraint to ensure positive positions
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_display_order_positive;

ALTER TABLE projects
ADD CONSTRAINT projects_display_order_positive
CHECK (display_order > 0);

-- Comment the functions for documentation
COMMENT ON FUNCTION shift_project_positions IS 'Atomically shifts project positions up or down by specified amount';
COMMENT ON FUNCTION normalize_project_positions IS 'Normalizes all project positions to sequential numbering (1, 2, 3...)';
COMMENT ON FUNCTION get_next_project_position IS 'Returns the next available position for appending a new project';
COMMENT ON FUNCTION update_project_position IS 'Updates a project position with automatic shifting of other projects';
