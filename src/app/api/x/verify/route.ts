import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, redirectUri } = await request.json();

    if (!code || !codeVerifier || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'X API credentials not configured' },
        { status: 500 }
      );
    }

    // Step 1: Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        error,
        redirectUri,
        clientId,
      });
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: error },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Get user data from X API
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('Failed to get user data:', error);
      return NextResponse.json(
        { error: 'Failed to get user data from X' },
        { status: 400 }
      );
    }

    const userData = await userResponse.json();

    // Return REAL verified data from X
    return NextResponse.json({
      username: userData.data.username,
      userId: userData.data.id,
      verified: true,
    });

  } catch (error) {
    console.error('X verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
