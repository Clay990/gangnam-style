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
  User
} from "firebase/auth";
// Import Firestore client functions for the credit listener
import { doc, onSnapshot } from "firebase/firestore";

// Component Imports (Corrected paths to match your folder structure)
import ShinyText from './component/ShinyText';
import Aurora from './component/Aurora';

// --- Types ---
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
type AIModel = 'flash' | 'pro';

// --- SVG Icons ---
const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// --- Typing Loader ---
const TypingLoader = () => {
  const text = "AI is future";
  const steps = text.length;
  const animationDuration = `${steps * 0.1}s`;

  const keyframes = `
    @keyframes typing {
      from { width: 0; }
      to { width: ${steps}ch; }
    }
    @keyframes blink-caret {
      from, to { border-color: transparent; }
      50% { border-color: white; }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
        <div
          className="text-3xl md:text-5xl font-mono overflow-hidden whitespace-nowrap border-r-4 border-r-white"
          style={{
            width: `${steps}ch`,
            animation: `typing ${animationDuration} steps(${steps}, end) 1s 1 normal both,
                        blink-caret .75s step-end infinite`,
          }}
        >
          {text}
        </div>
      </div>
    </>
  );
};

// --- Main Page Component ---
export default function HomePage() {
  // --- State Hooks ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For the initial page load
  const [user, setUser] = useState<User | null>(null); // For Firebase auth user

  // --- New Hybrid AI Hub State ---
  const [input, setInput] = useState(""); // Current message in the input box
  const [isChatLoading, setIsChatLoading] = useState(false); // For Gemini loading
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // Array of chat messages
  const [selectedModel, setSelectedModel] = useState<AIModel>('flash'); // 'flash' or 'pro'
  const [userCredits, setUserCredits] = useState<number | null>(null); // User's credit balance

  const chatEndRef = useRef<HTMLDivElement>(null); // To auto-scroll chat

  // --- Authentication Effects ---
  useEffect(() => {
    // 1. Initial loader
    const timer = setTimeout(() => setIsLoading(false), 2500);

    // 2. Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsMenuOpen(false); // Close menu on auth change
      if (!currentUser) {
        setUserCredits(null); // Clear credits on logout
        setChatHistory([]); // Clear chat history on logout
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // --- New! Real-time Credit Listener ---
  useEffect(() => {
    if (!user) return; // Only run if user is logged in

    // Get the path to the user's document in Firestore
    const userDocRef = doc(db, 'users', user.uid);

    // Attach a real-time listener
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        // If the document exists, update the credit state
        setUserCredits(doc.data().credits);
      } else {
        // This might happen for a split second before the backend creates it
        // Check again after a short delay, backend should create the doc on first API call
        setTimeout(async () => {
          const checkDoc = await doc.ref.get();
          if (checkDoc.exists()) {
            setUserCredits(checkDoc.data()?.credits);
          } else {
             setUserCredits(null); // Still doesn't exist
          }
        }, 1500);
      }
    }, (error) => {
      console.error("Error listening to user credits:", error);
    });

    // Detach the listener when the user logs out or component unmounts
    return () => unsubscribe();
  }, [user]); // Re-run this effect when the user state changes

  // --- Google One Tap Login Effect ---
  useEffect(() => {
    if (isLoading || user) return;

    const initializeGoogleOneTap = () => {
      // --- FIX: Cast window to any to solve TypeScript error ---
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: async (response: any) => {
            const credential = GoogleAuthProvider.credential(response.credential);
            try {
              await signInWithCredential(auth, credential);
            } catch (error) {
              console.error("Firebase sign-in error:", error);
            }
          },
        });
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.warn("One Tap prompt was not displayed.");
            // Optionally: Implement a fallback "Sign in with Google" button here
          }
        });
      }
    };

    // Retry mechanism in case the Google script loads slowly
    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(() => {
      if ((window as any).google) {
        clearInterval(interval);
        initializeGoogleOneTap();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error("Google Sign-In script failed to load after multiple attempts.");
      }
      attempts++;
    }, 500); // Check every 500ms

    return () => clearInterval(interval); // Cleanup interval on unmount/re-render
  }, [isLoading, user]);

  // --- Chat Auto-Scroll Effect ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  // --- Auth Handlers ---
  const handleLogout = async () => {
    await signOut(auth);
    // State updates (user, credits, chatHistory) are handled by onAuthStateChanged
    setIsMenuOpen(false);
  };

  // --- UPGRADED Chat Handler ---
  const handleSend = async () => {
    // Check for user, input, and loading state
    if (!input.trim() || isChatLoading || !user) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = input; // Store input before clearing
    setInput("");
    setIsChatLoading(true);

    let token: string | null = null;
    try {
      // 1. Get the Firebase Auth Token for the user
      token = await user.getIdToken(true); // Force refresh token

      // 2. Send token, prompt, AND selected model to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          model: selectedModel, // Send the selected model
          token: token          // Send the auth token
        }),
      });

      if (!response.ok) {
        // Handle specific errors from the backend
        const errorData = await response.json();
        if (response.status === 402) {
          // 402 Payment Required (Insufficient Credits)
          throw new Error(errorData.error || "Insufficient credits. Buy more or watch an ad.");
        } else if (response.status === 401) {
           // Handle potential token expiry issues - prompt user to maybe re-login
           throw new Error(errorData.error || "Authentication error. Please try logging out and back in.");
        }
        throw new Error(errorData.error || `API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
         throw new Error(data.error || "Backend reported an unsuccessful operation.");
      }

      const modelMessage: ChatMessage = { role: 'model', text: data.text };
      setChatHistory(prev => [...prev, modelMessage]);

      // 3. Update credit balance locally from backend response (Firestore listener will eventually catch up too)
      if (data.newCredits !== undefined) {
        setUserCredits(data.newCredits);
      }

    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: error.message || "Sorry, I couldn't get a response. Please try again."
      };
      // Re-add user message if there was an error sending, so they don't lose it
      // Or maybe put the text back in the input? Depends on desired UX.
      // For now, just show the error.
       setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Show Loader ---
  if (isLoading) {
    return <TypingLoader />;
  }

  // --- Main Page JSX ---
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#074bff", "#ff74ff"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

      {/* --- Credit Balance Display --- */}
      {user && (
        <div className="absolute top-5 right-20 z-20 bg-gray-900 bg-opacity-50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-red-600">
          <span className="text-white font-medium">
            Credits: {userCredits === null ? '...' : userCredits}
          </span>
        </div>
      )}

      {/* --- PFP & Menu --- */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-full overflow-hidden border-2 border-red-600 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <Image
              src={user?.photoURL || "https://placehold.co/40x40/1f2937/FFF?text=PFP"}
              alt="User Profile"
              width={40}
              height={40}
              className="object-cover"
              // Add error handling for the image
              onError={(e) => (e.currentTarget.src = "https://placehold.co/40x40/1f2937/FFF?text=ERR")}
            />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 ring-1 ring-gray-700 ring-opacity-5 focus:outline-none">
              {user ? (
                <>
                  <span className="block px-4 py-2 text-sm text-gray-400 truncate">{user.email}</span>
                  <a
                    href="#"
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Logout
                  </a>
                </>
              ) : (
                <span className="block px-4 py-2 text-sm text-gray-400">
                  Please sign in
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Main Chat Box --- */}
      <div className="relative w-full max-w-3xl h-[90vh] md:h-[600px] rounded-2xl shadow-xl
                      border border-red-600 z-10">
        <div className="relative z-10 flex flex-col h-full bg-gray-900 rounded-2xl p-4 sm:p-6">

          <ShinyText
            text="Hybrid AI Hub"
            disabled={false}
            speed={3}
            className='text-3xl md:text-4xl font-bold text-center mb-4 md:mb-6 drop-shadow-lg'
          />

          {/* --- Chat History Area --- */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-400 rounded-lg px-4 py-2">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* --- Model Selector --- */}
          <div className="mt-4 sm:mt-6 flex justify-center items-center space-x-2">
            <button
              onClick={() => setSelectedModel('flash')}
              disabled={isChatLoading} // Disable during loading
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                selectedModel === 'flash'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Flash (Free)
            </button>
            <button
              onClick={() => setSelectedModel('pro')}
              disabled={isChatLoading} // Disable during loading
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                selectedModel === 'pro'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Pro (1 Credit)
            </button>
          </div>

          {/* --- Chat Input --- */}
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder={user ? "Ask me anything..." : "Please sign in to chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleSend()}
              className="flex-grow p-3 rounded-l-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600 text-white text-sm sm:text-base disabled:opacity-50"
              disabled={!user || isChatLoading} // Also disable input when loading
            />
            <button
              onClick={handleSend}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 sm:px-6 rounded-r-xl transition-colors duration-200 text-sm sm:text-base disabled:opacity-50"
              disabled={!user || isChatLoading}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* --- Bottom Icons --- */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-3">
        <NextIcon />
        <GoogleIcon />
      </div>
    </div>
  );
}

