#!/bin/bash

# Deployment Script for Collection Creation Fixes
# This script builds, tests, and deploys the fixed code

echo "🚀 Starting Deployment Process..."
echo ""

# Step 1: Check for uncommitted changes
echo "📋 Step 1: Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
  echo "⚠️  You have uncommitted changes. Please review them:"
  git status -s
  echo ""
  read -p "Do you want to commit these changes? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📝 Committing changes..."
    git add src/services/api.js
    git add api/proxy.js
    git add src/components/CollectionPreviewModal.jsx
    git add src/pages/CreateCollection.jsx
    git add vercel.json
    git add COLLECTION_CREATION_FIXES.md
    git commit -m "Fix: Collection creation HTTPS proxy & modal workflow

- Fixed Mixed Content error by ensuring proper proxy usage
- Enhanced api/proxy.js with better error handling and CORS
- Fixed CollectionPreviewModal to prevent premature closing
- Improved error handling and logging in CreateCollection
- Updated vercel.json with CORS headers for API routes
- Added comprehensive documentation"
    echo "✅ Changes committed!"
  else
    echo "❌ Deployment cancelled. Please commit your changes manually."
    exit 1
  fi
fi

# Step 2: Run linter
echo ""
echo "🔍 Step 2: Running linter..."
npm run lint
if [ $? -ne 0 ]; then
  echo "⚠️  Linting failed. Please fix the errors before deploying."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 3: Build the project
echo ""
echo "🔨 Step 3: Building project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Please fix the errors before deploying."
  exit 1
fi
echo "✅ Build successful!"

# Step 4: Test build locally
echo ""
echo "🧪 Step 4: Testing build locally..."
echo "Starting preview server..."
echo "Press Ctrl+C after you've verified the build works"
npm run preview &
PREVIEW_PID=$!
sleep 3
echo ""
echo "Preview server running at http://localhost:4173"
echo "Please test the following:"
echo "  1. Visit /collections page"
echo "  2. Try creating a collection"
echo "  3. Verify no console errors"
echo ""
read -p "Press Enter after testing (or Ctrl+C to cancel)..."
kill $PREVIEW_PID 2>/dev/null

# Step 5: Push to repository
echo ""
echo "📤 Step 5: Pushing to repository..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ Push failed! Please check your git configuration."
  exit 1
fi
echo "✅ Pushed to repository!"

# Step 6: Wait for Vercel deployment
echo ""
echo "⏳ Step 6: Waiting for Vercel deployment..."
echo "Check deployment status at: https://vercel.com/your-username/rollnfts-frontend"
echo ""
echo "Once deployed, test the following:"
echo "  ✓ Open browser DevTools → Network tab"
echo "  ✓ Visit https://rollnfts.vercel.app/collections"
echo "  ✓ Check for Mixed Content errors (should be NONE)"
echo "  ✓ Try creating a collection"
echo "  ✓ Verify modal stays open during creation"
echo "  ✓ Check console logs for progress"
echo ""
echo "📋 Vercel Logs Command:"
echo "  vercel logs --follow"
echo ""
echo "🎉 Deployment process complete!"
echo "📖 Read COLLECTION_CREATION_FIXES.md for detailed testing instructions"

