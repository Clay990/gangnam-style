import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminAuth } from '../../firebase/adminConfig'; 

// Initialize Stripe with the secret key from .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Authentication token is required.' }, { status: 401 });
    }

    // Verify Firebase token to get user ID
    let decodedToken;
    let uid: string;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
      console.log(`Verified user ${uid} for checkout session.`);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
        console.error("Stripe Price ID (STRIPE_PRICE_ID) is not configured in .env.local");
        return NextResponse.json({ error: 'Server configuration error: Stripe Price ID not found.' }, { status: 500 });
    }

    // Determine the base URL for redirects
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.NEXT_PUBLIC_URL || req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host.replace(/^https?:\/\//, '')}`;

    console.log(`Using base URL for redirects: ${baseUrl}`);

    // Create a Stripe Checkout session
    console.log(`Creating Stripe session for user ${uid} with price ID ${priceId}...`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
    
      success_url: `${baseUrl}/`, 
      cancel_url: `${baseUrl}/`, 
      client_reference_id: uid,
      customer_email: decodedToken.email,
    });

    if (!session.url) {
       throw new Error('Failed to create Stripe session URL.');
    }
    console.log(`Stripe session created successfully: ${session.id} for user ${uid}`);

    // Return the session URL to the frontend
    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session.', details: error.message }, { status: 500 });
  }
}

