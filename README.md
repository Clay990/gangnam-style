# 🕺 Gangnam Style

Welcome to **Gangnam Style**, a modern, responsive web application demonstrating a **hybrid monetization model** for accessing powerful AI chat capabilities. Users can interact with different AI models based on a **flexible credit system**.

---

## 🌐 Overview

**Gangnam Style** provides a sleek chat interface allowing users to leverage AI for various tasks.  
It integrates **Google's Gemini models (Flash and Pro)** and employs a **credit-based system** to manage access to premium features, funded through Stripe payments.

---

## ✨ Key Features (Implemented)

### 💬 Responsive Chat UI
- Modern, dark-themed interface optimized for desktop and mobile.  
- Includes an **Aurora background effect**.

### 🧠 Hybrid AI Model Access
- **Flash Tier (Free):** Access to Google's efficient *Gemini Flash* model.  
- **Pro Tier (Credit-Based):** Access to the more powerful *Gemini Pro* model, consuming **AI Boost Credits**.

### ⚡ AI Boost Credits System
- Users receive **100 starter credits** upon signing up.  
- Real-time credit balance displayed in the UI.  
- Pro model usage automatically deducts credits.

### 🔐 Secure Authentication
- Seamless sign-in/sign-up using **Google One Tap**.  
- Fallback **“Sign in with Google”** button for manual login.  
- Managed securely via **Firebase Authentication**.

### 💳 Credit Purchases via Stripe
- Integrated **Stripe Checkout** for purchasing credit packs (currently 100 credits).  
- Secure **webhook endpoint** verifies payments and updates user credits in **Firestore**.  
- Real-time credit updates reflected in the UI.

### 🗃️ Real-time Database
- User credits managed in **Firestore** and updated live.

### 🧾 Markdown Rendering
- AI responses formatted using **react-markdown**.

### ⏳ Loading States
- Includes an initial “**AI is future**” typing animation.  
- Loading indicators for chat responses and credit transactions.

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (custom scrollbar) |
| **Authentication** | Firebase Authentication (Google Provider) |
| **Database** | Firestore |
| **Backend** | Next.js API Routes, Firebase Admin SDK |
| **AI** | Google Gemini API (1.5 Flash, 1.5 Pro) |
| **Payments** | Stripe (Checkout & Webhooks) |
| **UI Components** | react-markdown, Custom ShinyText, Aurora |

---

## 💰 Monetization Model

Gangnam Style operates on a **freemium hybrid model**:

- **Free Access:**  
  Users chat with *Gemini Flash* (low-cost model).  
  *(Future: supported by display ads)*

- **Premium Access:**  
  Uses *Gemini Pro*, requiring **AI Boost Credits**.

### 🪙 Earning / Buying Credits
- New users get **100 free credits**.  
- Additional credits purchasable via **Stripe**.  
- *(Future)*: Users can **earn credits by watching ads**.

This model aims to **cover API costs** for premium AI while maintaining a valuable free tier.

---

---

### 💬 Review & Suggestions

**Strengths:**
- Professional tone — perfect for GitHub or investors.  
- Monetization model (credit-based + Stripe + ads) is realistic and scalable.  
- Well-structured sections with modern stack choices.  
- Clear Phase 2 roadmap = strong vision.

**Suggestions:**
1. Add a **GIF or image** at the top showing the UI — it instantly attracts attention.  
2. Include a short **why the name “Gangnam Style”** paragraph (fun + branding).  
3. Eventually add a **License (MIT)** and **Contributing** guide.  
4. Add a small **Architecture Diagram** (maybe later with mermaid or a PNG).

Would you like me to make a **GitHub-ready README.md file (downloadable)** version with a professional layout (badges, image placeholders, code block formatting, etc.)?

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://your-repo-url/gangnam-style.git
cd gangnam-style

