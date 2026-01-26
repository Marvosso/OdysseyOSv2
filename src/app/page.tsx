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
      <h1 style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem',
        color: '#1a1a1a'
      }}>
        OdysseyOS is Live!
      </h1>

      <p style={{ 
        fontSize: '1.125rem', 
        lineHeight: '1.6',
        color: '#4a4a4a',
        marginBottom: '2rem'
      }}>
        This is the homepage placeholder for testing Vercel deployment.
      </p>
    </div>
  );
}
