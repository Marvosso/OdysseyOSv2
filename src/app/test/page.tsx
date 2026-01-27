/**
 * Temporary Test Route
 * 
 * Debug route to verify Next.js App Router is working
 * This file can be deleted after confirming routing works
 */

export default function TestPage() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold',
        color: '#1a1a1a'
      }}>
        UI routing works
      </h1>
      <p style={{ 
        marginTop: '1rem',
        color: '#4a4a4a'
      }}>
        If you can see this page, Next.js App Router routing is functioning correctly.
      </p>
    </div>
  );
}
