# Fast NFT Viewer - Performance Testing Script
# File: test-performance.sh
# Tests all performance optimizations

#!/bin/bash

echo "🚀 Fast NFT Viewer - Performance Testing"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if React Query is installed
echo "📦 Test 1: Checking dependencies..."
if npm list @tanstack/react-query > /dev/null 2>&1; then
    echo -e "${GREEN}✅ React Query installed${NC}"
else
    echo -e "${RED}❌ React Query not found${NC}"
fi

if npm list react-virtuoso > /dev/null 2>&1; then
    echo -e "${GREEN}✅ React Virtuoso installed${NC}"
else
    echo -e "${RED}❌ React Virtuoso not found${NC}"
fi

if npm list react-intersection-observer > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Intersection Observer installed${NC}"
else
    echo -e "${RED}❌ Intersection Observer not found${NC}"
fi

echo ""

# Test 2: Check if optimized components exist
echo "🔍 Test 2: Checking optimized components..."
if [ -f "src/components/OptimizedNFTCard.jsx" ]; then
    echo -e "${GREEN}✅ OptimizedNFTCard.jsx exists${NC}"
else
    echo -e "${RED}❌ OptimizedNFTCard.jsx not found${NC}"
fi

if [ -f "src/components/VirtualNFTGrid.jsx" ]; then
    echo -e "${GREEN}✅ VirtualNFTGrid.jsx exists${NC}"
else
    echo -e "${RED}❌ VirtualNFTGrid.jsx not found${NC}"
fi

if [ -f "src/hooks/useNFTsQuery.js" ]; then
    echo -e "${GREEN}✅ useNFTsQuery.js exists${NC}"
else
    echo -e "${RED}❌ useNFTsQuery.js not found${NC}"
fi

echo ""

# Test 3: Check if API supports pagination
echo "🔌 Test 3: Checking API pagination support..."
if grep -q "page = 1, limit = 50" api/nfts/collection/\[collectionId\].js; then
    echo -e "${GREEN}✅ API supports pagination${NC}"
else
    echo -e "${YELLOW}⚠️  API pagination may not be configured${NC}"
fi

echo ""

# Test 4: Check if database indexes exist
echo "💾 Test 4: Checking database optimization files..."
if [ -f "supabase/performance-indexes.sql" ]; then
    echo -e "${GREEN}✅ Database indexes file exists${NC}"
    echo -e "${YELLOW}⚠️  Don't forget to run: psql -f supabase/performance-indexes.sql${NC}"
else
    echo -e "${RED}❌ Database indexes file not found${NC}"
fi

echo ""

# Test 5: Check Vite build configuration
echo "⚡ Test 5: Checking Vite optimization..."
if grep -q "manualChunks" vite.config.js; then
    echo -e "${GREEN}✅ Code splitting configured${NC}"
else
    echo -e "${RED}❌ Code splitting not configured${NC}"
fi

echo ""

# Test 6: Check if .gitignore excludes .md files
echo "📝 Test 6: Checking .gitignore for .md files..."
if grep -q "^.*\.md$" .gitignore 2>/dev/null || grep -q "^*.md$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ .md files excluded from git${NC}"
else
    echo -e "${YELLOW}⚠️  .md files not explicitly excluded from git${NC}"
fi

echo ""

# Test 7: Build test
echo "🏗️  Test 7: Running build test..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
    
    # Check build output size
    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        echo -e "   Build size: ${DIST_SIZE}"
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
fi

echo ""
echo "========================================"
echo "📊 Performance Test Summary"
echo "========================================"
echo ""
echo "✅ = Passed"
echo "⚠️  = Warning/Manual action required"
echo "❌ = Failed"
echo ""
echo "📚 Next Steps:"
echo "1. Run database indexes: psql -f supabase/performance-indexes.sql"
echo "2. Test the optimized CollectionDetail page"
echo "3. Monitor real-world performance with React Query DevTools"
echo "4. Verify image caching is working"
echo ""
echo "🚀 Happy optimizing!"

