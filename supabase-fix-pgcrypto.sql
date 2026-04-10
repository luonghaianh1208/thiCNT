-- ============================================================
-- FIX: pgcrypto crypt() not found
-- Trên Supabase, pgcrypto nằm trong schema "extensions"
-- ============================================================

-- 1. Đảm bảo pgcrypto đã bật (trong schema extensions)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Hash lại password admin (dùng extensions.crypt)
UPDATE admin_users
SET password_hash = extensions.crypt('Admin@1234', extensions.gen_salt('bf'))
WHERE username = 'admin';

-- 3. Sửa hàm verify_admin_login — thêm extensions vào search_path
CREATE OR REPLACE FUNCTION verify_admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM admin_users
  WHERE username = p_username;

  IF v_password_hash IS NULL THEN
    RETURN false;
  END IF;

  -- Dùng extensions.crypt vì pgcrypto nằm trong schema extensions
  RETURN v_password_hash = extensions.crypt(p_password, v_password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
