# Supabase Authentication Guide

## Setup

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Create a `profiles` table in Supabase:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Optional: Create a trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Usage

### Basic Authentication

```typescript
import { supabase } from '@/lib/supabaseClient';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### Profile Management

```typescript
// Create profile after signup
const { error } = await supabase
  .from('profiles')
  .insert({
    id: user.id,
    email: user.email,
  });

// Get profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ full_name: 'John Doe' })
  .eq('id', user.id);
```

## Error Handling

Common Supabase Auth errors:

- `Invalid login credentials` - Wrong email/password
- `Email not confirmed` - User needs to confirm email
- `User already registered` - Email already exists
- `Password should be at least 6 characters` - Password too short
- `Too many requests` - Rate limited

## Best Practices

1. **Always validate input** - Check email format, password length
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Use Row Level Security** - Protect data at database level
4. **Store sensitive data server-side** - Never expose service role key
5. **Use environment variables** - Never hardcode credentials

## Security Notes

- The `anon` key is safe to use client-side (protected by RLS)
- Never expose the `service_role` key
- Always use RLS policies to protect data
- Validate user input on both client and server
