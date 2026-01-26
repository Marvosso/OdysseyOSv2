# Supabase Authentication - Quick Reference

## Installation

```bash
npm install @supabase/supabase-js
```

## Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Core Functions

### Sign Up with Profile Creation

```typescript
import { supabase } from '@/lib/supabaseClient';

async function signUp(email: string, password: string) {
  // Step 1: Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password: password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Sign up failed: No user data returned');
  }

  // Step 2: Create profile row linked to auth.users.id
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id, // Link to auth.users.id
      email: authData.user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError && profileError.code !== '23505') {
    // Ignore duplicate key (might be created by trigger)
    throw new Error(`Profile setup failed: ${profileError.message}`);
  }

  return { user: authData.user, session: authData.session };
}
```

### Sign In

```typescript
import { supabase } from '@/lib/supabaseClient';

async function signIn(email: string, password: string) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (authError) {
    // Map common errors to user-friendly messages
    let message = authError.message;
    if (message.includes('Invalid login credentials')) {
      message = 'Invalid email or password. Please try again.';
    } else if (message.includes('Email not confirmed')) {
      message = 'Please confirm your email address before signing in.';
    }
    throw new Error(message);
  }

  if (!authData.user || !authData.session) {
    throw new Error('Sign in failed: No user or session returned');
  }

  return { user: authData.user, session: authData.session };
}
```

### Sign Out

```typescript
import { supabase } from '@/lib/supabaseClient';

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
```

### Get Current User

```typescript
import { supabase } from '@/lib/supabaseClient';

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  return user;
}
```

## Using the Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, signUp, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Welcome, {user.email}!</div>;

  return (
    <div>
      {/* Your auth form */}
    </div>
  );
}
```

## Error Handling Patterns

### Network Errors

```typescript
try {
  await supabase.auth.signUp({ email, password });
} catch (err) {
  if (err instanceof Error) {
    if (err.message.includes('network')) {
      // Handle network error
    }
  }
}
```

### Auth Errors

```typescript
const { error } = await supabase.auth.signUp({ email, password });

if (error) {
  switch (error.message) {
    case 'User already registered':
      // Handle duplicate email
      break;
    case 'Password should be at least 6 characters':
      // Handle password too short
      break;
    default:
      // Handle other errors
  }
}
```

## Database Schema

Required `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Complete Example

See `src/app/auth/page.tsx` for a complete working example.
