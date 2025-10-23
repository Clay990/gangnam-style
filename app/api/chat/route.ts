import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin'; // Needed for FieldValue
import { adminAuth, adminDb } from '@/app/firebase/adminConfig'; // Use our new admin config

// --- Constants ---
const COST_PER_PRO_QUERY = 1; // Set the cost for one "Pro" query
const STARTER_CREDITS = 100; // New users get 100 free credits
const PRO_MODEL_NAME = "gemini-2.5-pro";
const FLASH_MODEL_NAME = "gemini-2.5-flash";

// This function handles POST requests to /api/chat
export async function POST(req: Request) {
  try {
    // --- 1. Get Request Body ---
    const { prompt, model, token } = await req.json();

    // Validate essential data
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ error: "Model selection is required." }, { status: 400 });
    }
    if (!token) {
      return NextResponse.json({ error: "Authentication token is required." }, { status: 401 });
    }

    // --- 2. Verify User Authentication ---
    let decodedToken;
    let uid: string;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid authentication token." }, { status: 401 });
    }

    // --- 3. Get/Create User Document in Firestore ---
    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    let userCredits = 0;

    if (!userDoc.exists) {
      // User is new, create their document with starter credits
      await userDocRef.set({
        credits: STARTER_CREDITS,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      userCredits = STARTER_CREDITS;
    } else {
      // Existing user, get their credit balance
      userCredits = userDoc.data()?.credits || 0;
    }

    // --- 4. Get Gemini API Key ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not found." }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // --- 5. Handle Model Selection & Credit Logic ---
    let chosenModel: string;
    let newCreditBalance = userCredits;

    if (model === 'pro') {
      // --- PRO MODEL LOGIC ---
      if (userCredits < COST_PER_PRO_QUERY) {
        return NextResponse.json({ error: "Insufficient credits. Please buy more or watch an ad." }, { status: 402 }); // 402 Payment Required
      }
      chosenModel = PRO_MODEL_NAME;

    } else {
      // --- FLASH (FREE) MODEL LOGIC ---
      chosenModel = FLASH_MODEL_NAME;
      // No credit check needed
    }

    // --- 6. Call the Gemini API ---
    const geminiModel = genAI.getGenerativeModel({ model: chosenModel });
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // --- 7. Deduct Credits (if necessary) ---
    if (model === 'pro') {
      newCreditBalance = userCredits - COST_PER_PRO_QUERY;
      await userDocRef.update({
        credits: admin.firestore.FieldValue.increment(-COST_PER_PRO_QUERY)
      });
    }

    // --- 8. Send Response ---
    return NextResponse.json({
      success: true,
      text: text,
      newCredits: newCreditBalance, // Send updated credits back to the client
    });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "Failed to generate content. " + error.message },
      { status: 500 }
    );
  }
}

