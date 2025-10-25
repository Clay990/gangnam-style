"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
// Import BOTH client auth and client db
import { auth, db } from './firebase/config'; 
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential, 
  signOut,
  User,
  signInWithPopup,
  getRedirectResult
} from "firebase/auth";

import { doc, onSnapshot, getDoc } from "firebase/firestore";

import ReactMarkdown from 'react-markdown';

import ShinyText from './component/ShinyText';
import Aurora from './component/Aurora';
import ChatHistory from './component/ChatHistory';
import ChatInput from './component/ChatInput';
import ModelSelector from './component/ModelSelector';
import UserProfile from './component/UserProfile';
import TypingLoader from './component/TypingLoader';


// --- Types ---
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
type AIModel = 'flash' | 'pro';

// --- SVG Icons ---
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.96C17.72 15.63 17.06 16.8 16.09 17.46V20.01H19.78C21.56 18.33 22.56 15.49 22.56 12.25Z" fill="#4285F4"/>
        <path d="M12 23C15.14 23 17.84 21.94 19.78 20.01L16.09 17.46C15.05 18.1 13.62 18.52 12 18.52C9.08 18.52 6.57 16.63 5.61 14.01H1.84V16.63C3.7 20.48 7.54 23 12 23Z" fill="#34A853"/>
        <path d="M5.61 14.01C5.38 13.34 5.25 12.68 5.25 12C5.25 11.32 5.38 10.66 5.61 9.99V7.37H1.84C1.04 8.94 0.5 10.42 0.5 12C0.5 13.58 1.04 15.06 1.84 16.63L5.61 14.01Z" fill="#FBBC05"/>
        <path d="M12 5.48C13.73 5.48 15.22 6.08 16.41 7.21L20.07 3.55C17.84 1.48 15.14 0 12 0C7.54 0 3.7 2.52 1.84 6.37L5.61 8.99C6.57 6.37 9.08 5.48 12 5.48Z" fill="#EA4335"/>
    </svg>
);


const NextIcon = () => (
  <svg className="w-6 h-6" fill="white" viewBox="0 0 180 180">
    <path d="M90 0C40.294 0 0 40.294 0 90C0 139.706 40.294 180 90 180C139.706 180 180 139.706 180 90C180 40.294 139.706 0 90 0ZM144.346 148.971C141.464 153.284 137.601 156.401 131.604 156.401C126.83 156.401 123.111 154.529 120.435 150.701L89.654 108.665V156.021H71.503V32.536H89.654V99.51L118.067 59.83H134.87L101.488 95.835L144.346 148.971Z"/>
  </svg>
);


// --- Main Page Component ---
export default function HomePage() {
  // --- State Hooks ---
  const [isLoading, setIsLoading] = useState(true); 
  const [user, setUser] = useState<User | null>(null); 

  // --- Hybrid AI Hub State ---
  const [input, setInput] = useState(""); 
  const [isChatLoading, setIsChatLoading] = useState(false); 
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); 
  const [selectedModel, setSelectedModel] = useState<AIModel>('flash'); 
  const [userCredits, setUserCredits] = useState<number | null>(null); 

  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // --- Authentication Effects ---
  useEffect(() => {
    console.log("HomePage mounted.");
    const timer = setTimeout(() => setIsLoading(false), 2500);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed, user:", currentUser?.email || 'null');
      setUser(currentUser); 
      if (!currentUser) {
        setUserCredits(null);
        setChatHistory([]);
      }
    });

  
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect result processed for user:", result.user.email);
        }
      }).catch((error: any) => {
        console.error("Error processing getRedirectResult (may be harmless if using popup):", error);
      });

    return () => {
      console.log("HomePage unmounting.");
      clearTimeout(timer);
      unsubscribeAuth();
    };
  }, []); 

  // --- Real-time Credit Listener ---
  useEffect(() => {
    if (!user) return;
    console.log("Setting up Firestore listener for user:", user.uid);

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeCredits = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const credits = docSnapshot.data().credits;
        console.log("Firestore listener: Credits updated to", credits);
        setUserCredits(credits);
      } else {
        console.log("Firestore listener: User document does not exist yet.");
        
        setTimeout(async () => {
          try {
            const checkDoc = await getDoc(userDocRef);
            if (checkDoc.exists()) {
               console.log("Firestore listener (refetch): Credits found:", checkDoc.data()?.credits);
              setUserCredits(checkDoc.data()?.credits);
            } else {
               console.log("Firestore listener (refetch): User document still not found.");
               setUserCredits(0); 
            }
          } catch (fetchError) {
             console.error("Error refetching user document:", fetchError);
             setUserCredits(null); 
          }
        }, 3000);
      }
    }, (error) => {
      console.error("Error listening to user credits:", error);
      setUserCredits(null); 
    });

    return () => {
      console.log("Cleaning up Firestore listener for user:", user?.uid);
      unsubscribeCredits();
    };
  }, [user]);

// --- Google One Tap Login Effect ---
  useEffect(() => {
    if (isLoading || user) return;

    const initializeGoogleOneTap = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: any) => {
            const credential = GoogleAuthProvider.credential(response.credential);
            try {
              await signInWithCredential(auth, credential);
            } catch (error) {
              console.error("Firebase sign-in error from One Tap:", error);
            }
          },
          error_callback: (error: any) => {
             console.error("Google One Tap Initialization Error:", error);
          }
        });
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.warn("One Tap prompt was not displayed. Reason:", notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.warn("One Tap prompt was skipped. Reason:", notification.getSkippedReason());
          } else if (notification.isDismissedMoment()) {
             console.warn("One Tap prompt was dismissed. Reason:", notification.getDismissedReason());
          }
        });
      } else {
         console.error("Google Sign-In script or accounts.id not loaded yet.");
      }
    };

    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(interval);
        initializeGoogleOneTap();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error("Google Sign-In script failed to load after multiple attempts.");
      }
      attempts++;
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, user]);

  // --- Auth Handlers ---
  const handleLogout = async () => {
     console.log("Handle logout clicked.");
    await signOut(auth);
     console.log("Logout successful via handler.");
  };

  // --- Using signInWithPopup ---
  const handleGoogleSignIn = async () => {
    console.log("Handle manual sign-in clicked. Initiating POPUP...");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // onAuthStateChanged handles the state update
      console.log("signInWithPopup successful in handler. User:", result.user.email);
      // Menu will close automatically because UserProfile receives new 'user' prop
    } catch (error: any) {
      console.error("Error during manual Google Sign-in with POPUP:", error);
      // Display user-friendly error messages based on common codes
      let message = `Sign-in failed: ${error.message}`;
      if (error.code === 'auth/popup-closed-by-user') message = "Sign-in cancelled.";
      if (error.code === 'auth/cancelled-popup-request') message = "Multiple sign-in attempts detected.";
      if (error.code === 'auth/popup-blocked') message = "Pop-up blocked by browser. Please allow pop-ups.";

      setPurchaseError(message);
      setTimeout(() => setPurchaseError(null), 5000); 
    }
  };


  // --- Chat Handler ---
  const handleSend = async () => { 
    if (!input.trim() || isChatLoading || !user) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsChatLoading(true);

    let token: string | null = null;
    try {
      token = await user.getIdToken(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          model: selectedModel,
          token: token
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorData = { error: `API error (${response.status}): ${response.statusText}` };
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try { errorData = await response.json(); } catch {}
        } else {
          const rawError = await response.text(); console.error("Non-JSON API error response:", rawError);
        }
        if (response.status === 402) { throw new Error(errorData.error || "Insufficient credits. Buy more or watch an ad."); }
        else if (response.status === 401) { throw new Error(errorData.error || "Authentication error. Please try logging out and back in."); }
        throw new Error(errorData.error || "An unknown error occurred");
      }

      if (!contentType || contentType.indexOf("application/json") === -1) { throw new Error("Received non-JSON response from server"); }

      const data = await response.json();
      if (!data.success) { throw new Error(data.error || "Backend reported an unsuccessful operation."); }

      const modelMessage: ChatMessage = { role: 'model', text: data.text };
      setChatHistory(prev => [...prev, modelMessage]);

      if (data.newCredits !== undefined) { setUserCredits(data.newCredits); }

    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = { role: 'model', text: error.message || "Sorry, I couldn't get a response. Please try again." };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };


  // --- Stripe Checkout Handler ---
  const handleBuyCredits = async () => { 
    if (!user) {
      setPurchaseError("Please sign in first to buy credits.");
       setTimeout(() => setPurchaseError(null), 3000);
      return;
    }
    setIsBuyingCredits(true);
    setPurchaseError(null);

    try {
      const token = await user.getIdToken(true);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ token: token }),
      });

      if (!response.ok) {
        let errorData = { error: 'Failed to initiate purchase.'};
        try { errorData = await response.json(); }
        catch (parseError) { console.error("Could not parse error response from create-checkout-session"); }
        throw new Error(errorData.error || 'Failed to initiate purchase.');
      }

      const { url } = await response.json();
      if (!url) { throw new Error('Did not receive a checkout URL from the server.'); }

      window.location.href = url;

    } catch (error: any) {
      console.error('Error handling buy credits:', error);
      setPurchaseError(error.message || 'An unexpected error occurred during purchase.');
       setTimeout(() => setPurchaseError(null), 5000);
       setIsBuyingCredits(false);
    }
  };


  if (isLoading) {
    return <TypingLoader />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 z-0"> <Aurora colorStops={["#074bff", "#ff74ff"]} blend={0.5} amplitude={1.0} speed={0.5} /> </div>
       {user && ( <div className="absolute top-5 right-20 z-20 flex items-center space-x-3"> <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-red-600" title="AI Boost Credits"> <span className="text-white font-medium text-sm"> Credits: {userCredits === null ? '...' : userCredits} </span> </div> <button onClick={handleBuyCredits} disabled={isBuyingCredits || !user} className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center space-x-1.5"> <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> </svg> <span>{isBuyingCredits ? 'Processing...' : 'Buy Credits'}</span> </button> </div> )}
       {purchaseError && ( <div className="absolute top-16 right-20 z-30 mt-1 bg-red-800 text-white p-2 rounded-md text-xs shadow-lg max-w-xs animate-pulse"> {purchaseError} <button onClick={() => setPurchaseError(null)} className="ml-2 text-red-300 hover:text-white font-bold">(X)</button> </div> )}
      
      <UserProfile
          user={user}
          handleLogout={handleLogout}
          handleGoogleSignIn={handleGoogleSignIn} 
      />
      <div className="relative w-full max-w-5xl h-[90vh] md:h-[650px] rounded-2xl shadow-xl border border-red-600 z-10">
        <div className="relative z-10 flex flex-col h-full bg-gray-900 rounded-2xl p-4 sm:p-6">
          <ShinyText text="Gangnam Style 😎" disabled={false} speed={3} className='text-3xl md:text-4xl font-bold text-center mb-4 md:mb-6 drop-shadow-lg' />
          <ChatHistory chatHistory={chatHistory} isChatLoading={isChatLoading} />
          <ModelSelector
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel} 
              isChatLoading={isChatLoading}
          />
          <ChatInput
              input={input}
              setInput={setInput} 
              handleSend={handleSend}
              isChatLoading={isChatLoading}
              user={user}
          />
        </div>
      </div>
       <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-3"> <NextIcon /> <GoogleIcon /> </div>
    </div>
  );
}

