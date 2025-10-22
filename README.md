# ROLL NFTs Marketplace - Frontend

**Multi-chain NFT Marketplace on XRP and Coreum**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx
│   ├── NFTCard.jsx
│   └── CollectionCard.jsx
├── pages/              # Page components
│   ├── Home.jsx
│   ├── Collections.jsx
│   └── ...
├── services/           # API services
│   └── api.js
├── store/              # State management (Zustand)
│   └── walletStore.js
├── utils/              # Utility functions
│   └── ipfs.js
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## 🔧 Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://147.79.78.251:5058/api
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_COREUM_CHAIN_ID=coreum-mainnet-1
VITE_COREUM_RPC=https://full-node.mainnet-1.coreum.dev:26657
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_APP_NAME=ROLL NFTs Marketplace
```

## 📦 Tech Stack

- **React** 18+ - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **@supabase/supabase-js** - Supabase client
- **xumm-sdk** - XUMM wallet integration
- **react-hot-toast** - Notifications

## 🎨 Features

### Completed
- ✅ Project setup with Vite + React
- ✅ Tailwind CSS styling
- ✅ API service layer
- ✅ Wallet state management
- ✅ IPFS utilities
- ✅ NFT Card component
- ✅ Collection Card component
- ✅ Header with wallet connect
- ✅ Home page (marketplace)
- ✅ Collections page
- ✅ React Router setup

### To Do
- ⏳ NFT Detail page
- ⏳ Collection Detail page
- ⏳ Create NFT page
- ⏳ My NFTs page
- ⏳ XUMM wallet integration
- ⏳ Coreum wallet integration
- ⏳ Buy/Sell functionality
- ⏳ User profiles
- ⏳ Search & filters
- ⏳ Activity feed

## 🌐 Available Scripts

```bash
# Development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📡 API Integration

The frontend connects to the backend API at `http://147.79.78.251:5058/api`

### API Endpoints Used:
- `GET /collections` - Get all collections
- `GET /collections/:id` - Get collection by ID
- `GET /collections/:id/nfts` - Get NFTs in collection
- `GET /nfts/listed` - Get all listed NFTs
- `GET /nfts/:id` - Get NFT by ID
- `POST /nfts/:id/list` - List NFT for sale
- `POST /nfts/:id/buy` - Buy NFT

## 🎯 Next Steps

1. Test the frontend:
   ```bash
   npm run dev
   ```

2. Verify API connection to backend

3. Implement wallet connections:
   - XUMM for XRP
   - Coreum wallet for Coreum

4. Add remaining pages:
   - NFT detail
   - Collection detail
   - Create NFT
   - User profile

5. Test buy/sell flow

6. Deploy to production

## 🚀 Deployment

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Option 3: VPS (Same as backend)
```bash
npm run build
# Copy dist/ folder to VPS
# Configure Nginx to serve static files
```

## 📞 Support

- Backend API: http://147.79.78.251:5058
- Supabase Dashboard: https://supabase.com/dashboard
- Documentation: See `/RollNfts_data_scrape/` folder

---

**Created:** October 22, 2025  
**Status:** ✅ Initial setup complete, ready for development  
**Next:** Test and implement wallet connections
