const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server config missing SUPABASE_SERVICE_ROLE_KEY' }) };
  }

  // Use service role client — bypasses RLS and can create auth users
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let users;
  try {
    ({ users } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const results = [];

  for (const u of users) {
    const { full_name, email, password, grade } = u;
    if (!email || !password || !full_name) {
      results.push({ email, success: false, error: 'Thiếu thông tin bắt buộc' });
      continue;
    }

    try {
      // Create auth user
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: { full_name, role: 'student', grade: grade || '' },
      });

      if (authErr) {
        // If user already exists, try to update their password
        if (authErr.message.includes('already registered') || authErr.message.includes('already been registered')) {
          results.push({ email, success: false, error: 'Email đã tồn tại' });
        } else {
          results.push({ email, success: false, error: authErr.message });
        }
        continue;
      }

      // Update public.users with grade info (trigger already inserted basic record)
      if (authData.user) {
        await adminClient
          .from('users')
          .update({ full_name, status: 'active' })
          .eq('auth_id', authData.user.id);
      }

      results.push({ email, success: true });
    } catch (err) {
      results.push({ email, success: false, error: String(err) });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount    = results.filter(r => !r.success).length;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ successCount, failCount, results }),
  };
};
