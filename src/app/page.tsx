/**
 * Root Page - OdysseyOS Homepage
 * 
 * This is the main landing page for the OdysseyOS application.
 * Located at the root route: /
 * 
 * Future components to integrate:
 * - StoryCanvas: Main story editing interface
 * - AuthComponent: User authentication (signup/login)
 * - CharacterHub: Character management
 * - Navigation: App navigation and routing
 * - Dashboard: User dashboard with story list
 */

export default function HomePage() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main heading */}
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem',
        color: '#1a1a1a'
      }}>
        OdysseyOS is Live!
      </h1>

      {/* Homepage description */}
      <p style={{ 
        fontSize: '1.125rem', 
        lineHeight: '1.6',
        color: '#4a4a4a',
        marginBottom: '2rem'
      }}>
        This is the homepage placeholder for testing Vercel deployment.
      </p>

      {/* Environment variables note */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          margin: 0
        }}>
          <strong>Note:</strong> Make sure to configure your Supabase environment variables 
          (<code style={{ backgroundColor: '#e5e7eb', padding: '0.125rem 0.25rem', borderRadius: '4px' }}>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code style={{ backgroundColor: '#e5e7eb', padding: '0.125rem 0.25rem', borderRadius: '4px' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) 
          in your Vercel project settings for authentication to work.
        </p>
      </div>
    </div>
  );
}
