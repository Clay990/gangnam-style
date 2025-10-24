import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers'; 
import admin from 'firebase-admin';  
import { adminDb } from '../../firebase/adminConfig'; 

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {

  apiVersion: '2024-04-10' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const creditsToAdd = parseInt(process.env.CREDITS_PER_PURCHASE || '100', 10) || 100;

export async function POST(req: Request) {
  let body: string;
  try {
    // Read the raw request body ONCE
    body = await req.text();
  } catch (readError) {
    console.error('Webhook Error: Could not read request body:', readError);
    return NextResponse.json({ error: 'Could not read request body.' }, { status: 400 });
  }

  const headerPayload = headers();
  const signature = (await headerPayload).get('stripe-signature');

  // --- Verification ---
  if (!signature) {
    console.error('Webhook Error: Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  if (!webhookSecret) {
     console.error('Webhook Error: STRIPE_WEBHOOK_SECRET is not configured.');
     return NextResponse.json({ error: 'Webhook configuration error on server.' }, { status: 500 });
  }

  let event: Stripe.Event;

  // Verify the event actually came from Stripe using the signing secret
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Webhook received and verified: ${event.id}, Type: ${event.type}`); // Log successful verification
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    console.error(`Received Signature: ${signature}`);
    console.error(`Received Body (start): ${body.substring(0, 100)}...`);
    return NextResponse.json({ error: `Webhook signature verification error: ${err.message}` }, { status: 400 });
  }

  // --- Handle Successful Payment Event ---
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout.session.completed for session: ${session.id}`);

      const userId = session.client_reference_id;

      if (!userId) {
        console.error('Webhook Error: Missing client_reference_id (Firebase UID) in checkout session', session.id);
        return NextResponse.json({ success: true, message: 'Missing user identifier in session.' }); // Acknowledge, but log error
      }
      console.log(`Identified user for credit update: ${userId}`);

      // --- Update Firestore Credits ---
      const userDocRef = adminDb.collection('users').doc(userId);

      // Use a Firestore transaction for atomicity
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists) {
          console.warn(`Webhook: User document for ${userId} not found. Creating with ${creditsToAdd} credits.`);
          transaction.set(userDocRef, {
            credits: creditsToAdd,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const currentCredits = userDoc.data()?.credits ?? 0;
          console.log(`Webhook: Incrementing credits for user ${userId} by ${creditsToAdd}. Current: ${currentCredits}`);
          transaction.update(userDocRef, {
            credits: admin.firestore.FieldValue.increment(creditsToAdd)
          });
        }
      });
      console.log(`Successfully updated credits for user ${userId}`);

    } else {
      console.log(`Webhook received unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error processing webhook event:', error);
  
    if (error.message?.includes('update credits')) {
  
       return NextResponse.json({ error: 'Database error while updating credits.' }, { status: 500 });
    }
     
    return NextResponse.json({ error: 'Webhook handler failed after verification.', details: error.message }, { status: 200 });
  }
}

