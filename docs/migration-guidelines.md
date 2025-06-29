# Database Migration Guidelines

## Core Principle: Always Check Before Adding/Updating

**CRITICAL RULE**: Every migration must check if database objects exist before attempting to create, modify, or reference them. This ensures migrations are idempotent and can be run multiple times safely.

## Migration Structure

### 1. Column Operations

```sql
-- ✅ CORRECT: Check if column exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'your_table' 
        AND column_name = 'your_column'
    ) THEN
        ALTER TABLE your_table ADD COLUMN your_column your_type;
        RAISE NOTICE 'Added your_column to your_table';
    ELSE
        RAISE NOTICE 'your_column already exists in your_table';
    END IF;
END $$;
```

### 2. Index Operations

```sql
-- ✅ CORRECT: Use IF NOT EXISTS for indexes
CREATE INDEX IF NOT EXISTS idx_your_table_your_column ON your_table(your_column);
```

### 3. Enum Type Operations

```sql
-- ✅ CORRECT: Handle existing enum types
DO $$
BEGIN
    CREATE TYPE your_enum AS ENUM ('value1', 'value2');
EXCEPTION
    WHEN duplicate_object THEN
        -- Type already exists, that's fine
        NULL;
END $$;
```

### 4. Table Operations

```sql
-- ✅ CORRECT: Use IF NOT EXISTS for tables
CREATE TABLE IF NOT EXISTS your_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- other columns
);
```

### 5. Function Operations

```sql
-- ✅ CORRECT: Use CREATE OR REPLACE for functions
CREATE OR REPLACE FUNCTION your_function()
RETURNS void AS $$
BEGIN
    -- function body
END;
$$ LANGUAGE plpgsql;
```

### 6. Policy Operations

```sql
-- ✅ CORRECT: Drop and recreate policies
DROP POLICY IF EXISTS "policy_name" ON your_table;
CREATE POLICY "policy_name" ON your_table
    FOR SELECT USING (condition);
```

## Migration Template

```sql
-- Migration XXX: Brief Description
-- This migration does X, Y, and Z

-- Step 1: Check and add columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'table_name' 
        AND column_name = 'column_name'
    ) THEN
        ALTER TABLE table_name ADD COLUMN column_name column_type;
        RAISE NOTICE 'Added column_name to table_name';
    ELSE
        RAISE NOTICE 'column_name already exists in table_name';
    END IF;
END $$;

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- Step 3: Add comments
COMMENT ON COLUMN table_name.column_name IS 'Description of the column';

-- Step 4: Verify changes
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'table_name';
    
    RAISE NOTICE 'table_name now has % columns', col_count;
END $$;
```

## Common Patterns

### Adding a Column with Default Value

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'your_table' 
        AND column_name = 'your_column'
    ) THEN
        ALTER TABLE your_table 
        ADD COLUMN your_column your_type DEFAULT your_default_value;
        
        RAISE NOTICE 'Added your_column to your_table';
    ELSE
        RAISE NOTICE 'your_column already exists in your_table';
    END IF;
END $$;
```

### Modifying Column Type

```sql
DO $$
DECLARE
    current_type TEXT;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns 
    WHERE table_name = 'your_table' 
    AND column_name = 'your_column';
    
    IF current_type != 'desired_type' THEN
        ALTER TABLE your_table 
        ALTER COLUMN your_column TYPE desired_type 
        USING your_column::text::desired_type;
        
        RAISE NOTICE 'Changed your_column type from % to desired_type', current_type;
    ELSE
        RAISE NOTICE 'your_column already has desired type';
    END IF;
END $$;
```

### Adding Foreign Key Constraints

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_constraint_name'
    ) THEN
        ALTER TABLE your_table 
        ADD CONSTRAINT fk_constraint_name 
        FOREIGN KEY (column_name) REFERENCES other_table(id);
        
        RAISE NOTICE 'Added foreign key constraint fk_constraint_name';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_constraint_name already exists';
    END IF;
END $$;
```

## What NOT to Do

### ❌ WRONG: Direct operations without checks

```sql
-- ❌ This will fail if column already exists
ALTER TABLE your_table ADD COLUMN your_column your_type;

-- ❌ This will fail if index already exists
CREATE INDEX idx_your_table_your_column ON your_table(your_column);

-- ❌ This will fail if type already exists
CREATE TYPE your_enum AS ENUM ('value1', 'value2');
```

### ❌ WRONG: Referencing non-existent objects

```sql
-- ❌ This will fail if result column doesn't exist
UPDATE top8_matches SET result = NULL WHERE result IS NOT NULL;
```

## Testing Migrations

1. **Run migration multiple times** - should succeed without errors
2. **Check database state** - verify objects were created correctly
3. **Test rollback scenarios** - ensure data integrity

## Migration Naming Convention

- Use sequential numbers: `001-`, `002-`, `003-`, etc.
- Use descriptive names: `001-initial-schema.sql`, `002-add-user-roles.sql`
- Include brief description in filename

## Example: Good Migration

See `migrations/019-ensure-top8-winner-id-column.sql` for a perfect example of following these guidelines. 