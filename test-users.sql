-- Test Users SQL Commands
-- Run these in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Insert Admin User
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    password_hash,
    created_at
) VALUES (
    gen_random_uuid(),
    'admin@hotel.com',
    'Admin',
    'User',
    '+1234567890',
    'admin',
    'managed_by_supabase_auth',
    NOW()
);

-- Insert Guest User
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    password_hash,
    created_at
) VALUES (
    gen_random_uuid(),
    'guest@hotel.com',
    'John',
    'Doe',
    '+1987654321',
    'guest',
    'managed_by_supabase_auth',
    NOW()
);

-- Insert Another Guest User
INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    password_hash,
    created_at
) VALUES (
    gen_random_uuid(),
    'jane@hotel.com',
    'Jane',
    'Smith',
    '+1555123456',
    'guest',
    'managed_by_supabase_auth',
    NOW()
);

-- View all users to confirm
SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC;
