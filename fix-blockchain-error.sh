#!/bin/bash
# Quick fix script for blockchain library errors
# File: fix-blockchain-error.sh

echo "🔧 Fixing blockchain library initialization error..."
echo ""

# Option 1: Clear Vite cache
echo "1️⃣ Clearing Vite cache..."
rm -rf node_modules/.vite
echo "   ✅ Cache cleared"

# Option 2: Clear browser cache instructions
echo ""
echo "2️⃣ Clear your browser cache:"
echo "   Chrome: Ctrl+Shift+Delete → Select 'Cached images and files' → Clear"
echo "   Or: Hard refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac)"

# Option 3: Rebuild
echo ""
echo "3️⃣ Rebuilding..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ⚠️ Build issues - check npm run build"
fi

echo ""
echo "🚀 Restart dev server and try again:"
echo "   npm run dev"
echo ""
echo "If error persists, the blockchain libraries need to be in a single bundle."

