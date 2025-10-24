Gangnam Style - Hybrid AI Hub 🕺💨

 <!-- Example Badge -->





<!-- Add a cool screenshot or GIF of your app here! -->

<!--  -->

Welcome to Gangnam Style, a modern, responsive web application demonstrating a hybrid monetization model for accessing powerful AI chat capabilities. Users can interact with different AI models based on a flexible credit system.

Overview

Gangnam Style provides a sleek chat interface allowing users to leverage AI for various tasks. It integrates Google's Gemini models (Flash and Pro) and employs a unique credit-based system to manage access to premium features, funded through Stripe payments.

✨ Key Features (Implemented)

Responsive Chat UI: Modern, dark-themed interface optimized for desktop and mobile, featuring an Aurora background effect.

Hybrid AI Model Access:

Flash Tier (Free): Access to Google's efficient Gemini Flash model.

Pro Tier (Credit-Based): Access to the more powerful Gemini Pro model, consuming "AI Boost Credits".

AI Boost Credits System:

Users receive 100 starter credits upon signing up.

Real-time credit balance displayed in the UI.

Pro model usage automatically deducts credits.

Secure Authentication:

Seamless sign-in/sign-up using Google One Tap.

Manual "Sign in with Google" (Redirect) fallback.

Managed securely via Firebase Authentication.

Credit Purchases via Stripe:

Integrated Stripe Checkout to allow users to purchase credit packs (currently configured for 100 credits).

Secure webhook endpoint verifies payments and updates user credits in Firestore.

Real-time Database: User credits are managed in Firestore and updated in the UI in real-time.

Markdown Rendering: AI responses are properly formatted using Markdown.

Loading States: Includes an initial "AI is future" typing animation and loading indicators during chat responses and credit purchases.

🛠️ Tech Stack

Framework: Next.js 14+ (App Router)

Language: TypeScript

Styling: Tailwind CSS (with custom scrollbar)

Authentication: Firebase Authentication (Google Provider)

Database: Firestore (for user credits)

Backend: Next.js API Routes, Firebase Admin SDK

AI: Google Gemini API (gemini-1.5-flash-latest, gemini-1.5-pro-latest)

Payments: Stripe (Checkout & Webhooks)

UI Components: react-markdown, Custom components (ShinyText, Aurora)

💰 Monetization Model

Gangnam Style operates on a freemium hybrid model:

Free Access: Users can chat using the capable Gemini Flash model without spending credits. (Future: This tier could be supported by display ads).

Premium Access: Accessing the advanced Gemini Pro model requires "AI Boost Credits".

Earning/Buying Credits:

New users get a free starter pack (100 credits).

Users can purchase additional credits via Stripe.

(Future) Users might be able to earn credits by engaging with rewarded ads.

This model aims to cover API costs for premium models while offering a valuable free experience.

🚀 Getting Started

(Basic setup - you can expand this later)

Clone the repository:

git clone https://your-repo-url/gangnam-style.git
cd gangnam-style


Install dependencies:

npm install
# or
yarn install


Set up Environment Variables:

Create a .env.local file in the root directory.

Copy the contents of .env.example (you should create this!) into .env.local.

Fill in your specific API keys and configuration values for:

Firebase (Client SDK config)

Google Client ID (for Authentication)

Gemini API Key

Firebase Admin SDK (Service Account JSON - see note below)

Stripe (Publishable Key, Secret Key, Price ID, Webhook Secret)

CREDITS_PER_PURCHASE (e.g., 100)

Firebase Admin Config Note: The recommended way is using FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY variables, ensuring the private key has correct newline formatting.

Run the development server:

npm run dev
# or
yarn dev


Configure Stripe Webhook: For credit purchases to work locally, set up a Stripe webhook endpoint forwarding to http://localhost:3000/api/webhook (using ngrok or Stripe CLI) and listen for the checkout.session.completed event. Add the webhook signing secret to your .env.local.

📈 Current Status

The core application is functional, demonstrating the hybrid model, user authentication, credit system, and Stripe integration in test mode.

🔮 Future Plans (Phase 2 & Beyond)

Integrate Alternative Free Model: Replace Gemini Flash in the free tier with a model like Llama 3 (potentially via GroqCloud or another provider) to optimize costs, possibly supported by display ads (e.g., AdSense).

Rewarded Ads for Credits: Implement a secure way for users to earn credits by watching ads (requires exploring suitable web-based rewarded ad platforms/APIs).

Display Ads: Integrate basic display ads (e.g., AdSense banners) into the free tier UI.

Enhanced Chat Features: Implement chat history saving/loading, better context management, streaming responses.

Deployment: Add instructions and configuration for deploying to platforms like Vercel or Netlify.

UI/UX Improvements: Refine the user interface, add more informative error messages, potentially a dedicated "Account/Credits" page.

<!--

🤝 Contributing

(Optional: Add guidelines if you want contributions)

📜 License

(Optional: Add your license, e.g., MIT)
-->
