#!/bin/bash

# Deployment Script for RollNFTs Frontend
# File: /Users/exe/Downloads/Cursor/RollNFTs-Frontend/deploy.sh

echo "=========================================="
echo "🚀 Deploying RollNFTs Frontend to Vercel"
echo "=========================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Not a git repository"
    echo "   Please initialize git first:"
    echo "   git init"
    echo "   git remote add origin YOUR_REPO_URL"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Found uncommitted changes..."
    echo ""
    
    # Show changed files
    echo "Changed files:"
    git status --short
    echo ""
    
    # Ask for commit message
    echo "Enter commit message (or press Enter for default):"
    read -r commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Fix: Add HTTPS proxy for backend API and fix CreateCollection bug"
    fi
    
    # Stage and commit
    echo "📦 Staging changes..."
    git add .
    
    echo "💾 Committing changes..."
    git commit -m "$commit_msg"
    
    echo "✅ Changes committed!"
    echo ""
else
    echo "✅ No uncommitted changes"
    echo ""
fi

# Push to main branch
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ DEPLOYMENT INITIATED!"
    echo "=========================================="
    echo ""
    echo "Vercel will automatically:"
    echo "  1. Detect the push"
    echo "  2. Build your project"
    echo "  3. Deploy the changes"
    echo ""
    echo "Expected deployment time: ~2-3 minutes"
    echo ""
    echo "🔗 Check deployment status:"
    echo "   https://vercel.com/dashboard"
    echo ""
    echo "🌐 Your site:"
    echo "   https://rollnfts.vercel.app"
    echo ""
    echo "=========================================="
    echo "✨ Fixes Deployed:"
    echo "=========================================="
    echo "  ✅ HTTPS proxy for backend API"
    echo "  ✅ CreateCollection handleSubmit bug fixed"
    echo "  ✅ No more mixed content errors"
    echo ""
else
    echo ""
    echo "❌ Error: Failed to push to GitHub"
    echo "   Please check your git configuration"
    exit 1
fi

