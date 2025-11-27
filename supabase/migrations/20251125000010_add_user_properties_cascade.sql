-- Set up CASCADE delete for user properties and auto-deactivate on ban

-- 1. Add foreign key constraint with CASCADE delete for properties
-- First, drop the old constraint if it exists (it might not have CASCADE)
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Add new constraint with CASCADE delete
ALTER TABLE properties
ADD CONSTRAINT properties_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- 2. Create a function to deactivate/reactivate user properties when banned status changes
CREATE OR REPLACE FUNCTION handle_user_ban_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is being banned (was not banned, now is banned)
  IF OLD.is_banned = false AND NEW.is_banned = true THEN
    -- Deactivate all their properties
    UPDATE properties
    SET status = 'inactive'
    WHERE owner_id = NEW.id;

    RAISE NOTICE 'Deactivated all properties for banned user: %', NEW.email;
  END IF;

  -- If user is being unbanned (was banned, now is not banned)
  IF OLD.is_banned = true AND NEW.is_banned = false THEN
    -- Reactivate all their properties
    UPDATE properties
    SET status = 'active'
    WHERE owner_id = NEW.id;

    RAISE NOTICE 'Reactivated all properties for unbanned user: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to automatically handle property status when user ban status changes
DROP TRIGGER IF EXISTS user_ban_status_trigger ON users;

CREATE TRIGGER user_ban_status_trigger
AFTER UPDATE OF is_banned ON users
FOR EACH ROW
WHEN (OLD.is_banned IS DISTINCT FROM NEW.is_banned)
EXECUTE FUNCTION handle_user_ban_status();

-- Add comment
COMMENT ON FUNCTION handle_user_ban_status() IS 'Automatically deactivates user properties when banned and reactivates them when unbanned';
