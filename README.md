<div align="center">
  <img src="public/LOGO.png" alt="Royal Boutique Logo" width="300" />
  
  # 👑 Royal Boutique
  
  **Wear the art of royal elegance.**
  <br />
  A premium, high-performance E-Commerce Web Application built with React, Vite, and Tailwind CSS. Designed with an incredibly sleek dark-mode glassmorphic interface, it brings aesthetic minimalism, raw performance, and secure Firebase architecture to fashion enthusiasts seeking authentic Punjabi craft and modern apparel.

  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## ✨ Features

- **Modern Glassmorphic UI**: High-end transparent blur backdrops, soft gradient borders, and luxury dark aesthetics tailored exactly for premium branding.
- **Dynamic Shopping Cart & Wishlist**: Fluid, contextually-managed state allowing users to locally favorite items or queue them directly for checkout in seamless sidebars.
- **Categorized Product Catalogs**: Robust multi-category support mapped perfectly for items ranging from _Punjabi Suits, Bridal Wear, Western, Accessories to Juttis_.
- **User Authentication (Firebase)**: Complete secure login/signup flows using Firebase Auth with Email Link Verification to ensure absolute data security.
- **My Profile & Order Management**: Comprehensive user dashboard displaying saved addresses, an immersive "My Orders" interface with dynamic status colors, empty-state screens, and a 2-step Order Cancellation workflow with bank transfer support.
- **Premium Appointment Booking**: Custom-tailored appointment booking pipeline utilizing a heavily stylized modal with custom calendar overrides and subtle focus animations.
- **Intuitive Mobile Experience**: Smooth slide-over navigation menus, touch-optimized product modals with natural scrolling, and a floating global "Back to Top" button for long collection pages.
- **Responsive Architecture**: Fluid scaling typography and UI blocks fitting flawlessly on mobile boundaries up to ultra-wide desktop screens.

---

## 🚀 Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore DB & Authentication)
- **State Management**: React Context (`CartContext`, `AuthContext`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: Firebase Hosting

---

## 💻 Getting Started

Follow these steps to run the strictly localized development environment on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/raisahibb/royal_boutique.git
   cd royal_boutique
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Ensure you have a `.env.local` file at the root of the project with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   Head to exactly `http://localhost:5173` (or the port specified in your console) to view the live preview!

---

## 🛠️ Project Structure

```text
royal_boutique/
├── public/                # Static assets (including LOGO.png)
├── src/
│   ├── assets/            # Local UI imagery / Videos
│   ├── components/        # Reusable pieces (CartSidebar, ProductCard, Modals, etc.)
│   ├── context/           # React Context providers (CartContext, AuthContext)
│   ├── firebase/          # Firebase initialization & config
│   ├── types/             # TypeScript Declarations (index.ts)
│   ├── App.tsx            # Main Application Root & Hero Entry
│   ├── index.css          # Global Tailwind Entry
│   └── main.jsx           # ReactDOM Rendering Root
├── .env.local             # Local Environment Variables
├── firebase.json          # Firebase Deployment Configuration
├── vite.config.ts         # Vite Bundler Settings
├── tailwind.config.js     # PostCSS / Tailwind configurations
└── package.json           # Scripts & Dependencies
```

---

## 🎨 Design Philosophy
The aesthetic was handcrafted to mirror the "Royal" in Royal Boutique. Generic colors were stripped in favor of:
- **`#0a0a0a`** to **`#1a1a1a`** gradient backgrounds.
- Pure whites with dynamic opacity layering (e.g. `bg-white/5` to `bg-white/10`) for the perfect frosted glass look.
- Amber and Soft Pink accents (e.g., `text-accent`) that provide a premium glow and warmth.
- Clean **Barlow** and **Instrument Serif** typography bindings for high editorial contrast.

---

<div align="center">
  <p>Crafted digitally for Royal Boutique.</p>
</div>
