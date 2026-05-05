-- Add phone number to instructor roster
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS phone text;
