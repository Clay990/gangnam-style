import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { adminAuth, adminDb } from '../../firebase/adminConfig';


const COST_PER_PRO_QUERY = 1;
const STARTER_CREDITS = 10;

const PRO_MODEL_NAME = "gemini-2.5-flash"; 
const FLASH_MODEL_NAME = "gemma-3n-e2b-it"; 


export async function POST(req: Request) {
  try {
    // --- 1. Get Request Body ---
    const { prompt, model, token } = await req.json();

    
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
      
      return NextResponse.json({ error: "Invalid or expired authentication token. Please log out and back in." }, { status: 401 });
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
      console.log(`Created new user document for ${uid} with ${STARTER_CREDITS} credits.`);
    } else {
      // Existing user, get their credit balance
      userCredits = userDoc.data()?.credits ?? 0; // Use nullish coalescing for safety
      console.log(`User ${uid} has ${userCredits} credits.`);
    }

    // --- 4. Get Gemini API Key ---
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      return NextResponse.json({ error: "Server configuration error: Gemini API key not found." }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // --- 5. Handle Model Selection & Credit Logic ---
    let chosenModel: string;
    let newCreditBalance = userCredits;

    if (model === 'pro') {
      // --- PRO MODEL LOGIC ---
      console.log(`User ${uid} requested Pro model. Credits available: ${userCredits}`);
      if (userCredits < COST_PER_PRO_QUERY) {
        console.log(`User ${uid} denied Pro model due to insufficient credits.`);
        return NextResponse.json({ error: "Insufficient credits. Please buy more or watch an ad." }, { status: 402 }); // 402 Payment Required
      }
      chosenModel = PRO_MODEL_NAME;

    } else {
      // --- FLASH (FREE) MODEL LOGIC ---
      console.log(`User ${uid} requested Flash model.`);
      chosenModel = FLASH_MODEL_NAME;
      // No credit check needed
    }

    // --- 6. Call the Gemini API ---
    console.log(`Calling Gemini model ${chosenModel} for user ${uid}...`);
    const geminiModel = genAI.getGenerativeModel({ model: chosenModel });
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(`Gemini response received for user ${uid}.`);


    // --- 7. Deduct Credits (if necessary) ---
    if (model === 'pro') {
      // Use a transaction for safer credit deduction
      await adminDb.runTransaction(async (transaction) => {
        const freshUserDoc = await transaction.get(userDocRef);
        const currentCredits = freshUserDoc.data()?.credits ?? 0;
        if (currentCredits < COST_PER_PRO_QUERY) {
          // Double-check credits within transaction
          throw new Error("Insufficient credits confirmed during transaction.");
        }
        transaction.update(userDocRef, {
          credits: admin.firestore.FieldValue.increment(-COST_PER_PRO_QUERY)
        });
        newCreditBalance = currentCredits - COST_PER_PRO_QUERY; // Update balance based on transaction read
      });
      console.log(`Deducted ${COST_PER_PRO_QUERY} credit from user ${uid}. New balance: ${newCreditBalance}`);
    }

    // --- 8. Send Response ---
    return NextResponse.json({
      success: true,
      text: text,
      newCredits: newCreditBalance, // Send updated credits back to the client
    });

  } catch (error: any) {
    // Log the detailed error on the server
    console.error("Detailed error in /api/chat:", error);
    // Send a generic error message to the client
    let clientErrorMessage = "Failed to generate content due to a server error.";
    let status = 500;

    // Handle specific error cases we know about
    if (error.message.includes("Insufficient credits")) {
      clientErrorMessage = "Insufficient credits. Please buy more or watch an ad.";
      status = 402; // Payment Required
    } else if (error.message.includes("API key not valid")) {
      clientErrorMessage = "Server configuration error: Invalid Gemini API Key.";
    } else if (error.message.includes("Invalid or expired authentication token")) {
      clientErrorMessage = error.message; // Pass this specific message through
      status = 401; // Unauthorized
    }

    return NextResponse.json(
      { error: clientErrorMessage },
      { status: status }
    );
  }
}

