#!/bin/bash
# Profile System Testing Script
# File: test-profile-system.sh

echo "🧪 RollNFTs Profile System - Testing Script"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Directory exists: $1"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Directory missing: $1"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check string in file
check_string_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found '$2' in $1"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Not found '$2' in $1"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1. Checking File Structure..."
echo "-----------------------------"
check_file "supabase-user-profiles.sql"
check_file "src/services/profileService.js"
check_file "src/pages/Profile.jsx"
check_file "src/pages/Profile.scss"
check_file "PROFILE_SYSTEM_COMPLETE.md"
echo ""

echo "2. Checking Database Schema..."
echo "------------------------------"
check_string_in_file "supabase-user-profiles.sql" "CREATE TABLE IF NOT EXISTS user_profiles"
check_string_in_file "supabase-user-profiles.sql" "CREATE TABLE IF NOT EXISTS user_activity"
check_string_in_file "supabase-user-profiles.sql" "CREATE TABLE IF NOT EXISTS user_favorites"
check_string_in_file "supabase-user-profiles.sql" "CREATE TABLE IF NOT EXISTS user_notifications"
check_string_in_file "supabase-user-profiles.sql" "CREATE TABLE IF NOT EXISTS user_following"
check_string_in_file "supabase-user-profiles.sql" "ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY"
echo ""

echo "3. Checking Service Layer..."
echo "----------------------------"
check_string_in_file "src/services/profileService.js" "class ProfileService"
check_string_in_file "src/services/profileService.js" "getProfile"
check_string_in_file "src/services/profileService.js" "updateProfile"
check_string_in_file "src/services/profileService.js" "uploadAvatar"
check_string_in_file "src/services/profileService.js" "getUserActivity"
check_string_in_file "src/services/profileService.js" "getFavorites"
check_string_in_file "src/services/profileService.js" "getNotifications"
echo ""

echo "4. Checking Profile Component..."
echo "--------------------------------"
check_string_in_file "src/pages/Profile.jsx" "const Profile ="
check_string_in_file "src/pages/Profile.jsx" "useWalletStore"
check_string_in_file "src/pages/Profile.jsx" "profileService"
check_string_in_file "src/pages/Profile.jsx" "loadProfile"
check_string_in_file "src/pages/Profile.jsx" "handleAvatarUpload"
check_string_in_file "src/pages/Profile.jsx" "handleSaveProfile"
echo ""

echo "5. Checking Routing..."
echo "----------------------"
check_string_in_file "src/App.jsx" "import Profile from"
check_string_in_file "src/App.jsx" '<Route path="/profile" element={<Profile'
check_string_in_file "src/App.jsx" '<Route path="/profile/:address" element={<Profile'
echo ""

echo "6. Checking Header Integration..."
echo "----------------------------------"
check_string_in_file "src/components/Header.jsx" "useNavigate"
check_string_in_file "src/components/Header.jsx" "My Profile"
check_string_in_file "src/components/Header.jsx" "navigate('/profile')"
echo ""

echo "7. Checking Styling..."
echo "----------------------"
check_string_in_file "src/pages/Profile.scss" ".profile"
check_string_in_file "src/pages/Profile.scss" ".profile__header"
check_string_in_file "src/pages/Profile.scss" ".profile__avatar"
check_string_in_file "src/pages/Profile.scss" ".profile__tabs"
check_string_in_file "src/pages/Profile.scss" "@media (max-width: 768px)"
echo ""

echo "8. Checking Imports and Dependencies..."
echo "---------------------------------------"
check_string_in_file "src/pages/Profile.jsx" "import React"
check_string_in_file "src/pages/Profile.jsx" "import.*useParams"
check_string_in_file "src/pages/Profile.jsx" "import.*useNavigate"
check_string_in_file "src/pages/Profile.jsx" "import.*toast"
check_string_in_file "src/pages/Profile.jsx" "import.*NFTCard"
check_string_in_file "src/pages/Profile.jsx" "import.*CollectionCard"
check_string_in_file "src/services/profileService.js" "import.*supabase"
echo ""

echo "9. Testing Component Structure..."
echo "---------------------------------"
check_string_in_file "src/pages/Profile.jsx" "profile__banner"
check_string_in_file "src/pages/Profile.jsx" "profile__avatar"
check_string_in_file "src/pages/Profile.jsx" "profile__stats"
check_string_in_file "src/pages/Profile.jsx" "profile__tabs"
check_string_in_file "src/pages/Profile.jsx" "activeTab === 'nfts'"
check_string_in_file "src/pages/Profile.jsx" "activeTab === 'collections'"
check_string_in_file "src/pages/Profile.jsx" "activeTab === 'activity'"
check_string_in_file "src/pages/Profile.jsx" "activeTab === 'favorites'"
check_string_in_file "src/pages/Profile.jsx" "activeTab === 'notifications'"
echo ""

echo "10. Checking Error Handling..."
echo "------------------------------"
check_string_in_file "src/services/profileService.js" "try {"
check_string_in_file "src/services/profileService.js" "catch (error)"
check_string_in_file "src/services/profileService.js" "console.error"
check_string_in_file "src/pages/Profile.jsx" "toast.error"
check_string_in_file "src/pages/Profile.jsx" "toast.success"
echo ""

echo ""
echo "==========================================="
echo "📊 Test Results:"
echo "==========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Profile system is ready.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi

