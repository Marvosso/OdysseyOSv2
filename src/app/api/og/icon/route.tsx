import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = parseInt(searchParams.get('size') || '192', 10);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: size * 0.3,
          background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size * 0.7,
            height: size * 0.7,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: size * 0.15,
            border: `${size * 0.02}px solid rgba(255, 255, 255, 0.3)`,
          }}
        >
          <div
            style={{
              fontSize: size * 0.4,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
            }}
          >
            O
          </div>
        </div>
        {size >= 192 && (
          <div
            style={{
              marginTop: size * 0.1,
              fontSize: size * 0.15,
              color: 'white',
              fontWeight: '600',
              letterSpacing: size * 0.01,
            }}
          >
            OdysseyOS
          </div>
        )}
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
