# Roll NFT Marketplace - Deployment Instructions

**Status:** Ready for Deployment  
**Date:** October 22, 2025

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **1. Supabase Setup**
- [ ] Run `supabase-schema-update.sql` in Supabase SQL Editor
- [ ] Create `nft-images` storage bucket (Settings → Storage)
- [ ] Set bucket to public access
- [ ] Verify all tables created successfully

### **2. Pinata Setup**
- [ ] Sign up at https://pinata.cloud
- [ ] Create API keys (API Keys → New Key)
- [ ] Copy API Key, Secret, and JWT
- [ ] Test upload with a sample image

### **3. Environment Variables**
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all Pinata credentials
- [ ] Verify Supabase URL and key
- [ ] Test locally with `npm run dev`

### **4. VPS Backup Setup**
- [ ] SSH to VPS: `ssh root@147.79.78.251`
- [ ] Run: `bash scripts/vps/setup-vps.sh`
- [ ] Edit backup script with Supabase password
- [ ] Test backup: `/opt/roll-nft-backup/scripts/backup-database.sh`
- [ ] Verify cron jobs: `crontab -l`

---

## 🚀 **DEPLOYMENT TO VERCEL**

### **Step 1: Push to GitHub**

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - Roll NFT Marketplace"

# Push to GitHub
git remote add origin https://github.com/ExegesisVentures/rollNFTs_frontend.git
git branch -M main
git push -u origin main
```

### **Step 2: Connect to Vercel**

1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub
4. Select `ExegesisVentures/rollNFTs_frontend`
5. Framework Preset: **Vite**
6. Root Directory: `./`
7. Build Command: `npm run build`
8. Output Directory: `dist`
9. Install Command: `npm install`

### **Step 3: Add Environment Variables in Vercel**

Go to Project Settings → Environment Variables and add:

```
VITE_API_URL = http://147.79.78.251:5058/api
VITE_SUPABASE_URL = https://wemaymehbtnxkwxslhsu.supabase.co
VITE_SUPABASE_ANON_KEY = [your_supabase_anon_key]
VITE_PINATA_API_KEY = [your_pinata_api_key]
VITE_PINATA_SECRET = [your_pinata_secret]
VITE_PINATA_JWT = [your_pinata_jwt]
VITE_ROLL_TOKEN = xrpl11f82115a5-core1zhs909jp9yktml6qqx9f0ptcq2xnhhj99cja03j3lfcsp2pgm86studdrz
VITE_TREASURY_ADDRESS = core1wxgp4edry80allxrm20s5yq67wt7jcejj3w29l
VITE_COREUM_CHAIN_ID = coreum-mainnet-1
VITE_COREUM_RPC = https://full-node.mainnet-1.coreum.dev:26657
VITE_COREUM_REST = https://full-node.mainnet-1.coreum.dev:1317
```

### **Step 4: Deploy**

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployment URL
4. Test wallet connection
5. Test NFT minting

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **Test Checklist**
- [ ] Homepage loads correctly
- [ ] Wallet connects (Keplr/Leap/Cosmostation)
- [ ] Balance displays correctly
- [ ] Create NFT page works
- [ ] Image uploads to IPFS
- [ ] NFT mints successfully
- [ ] Collections display
- [ ] My NFTs page shows owned NFTs
- [ ] Marketplace listings work
- [ ] Mobile responsive

### **Test Minting Flow**

1. Connect wallet
2. Go to "Create NFT"
3. Upload image (< 10MB)
4. Fill name and description
5. Click "Create NFT"
6. Approve transaction in wallet
7. Wait for confirmation
8. Verify NFT appears in "My NFTs"

---

## 📊 **MONITORING**

### **Vercel Dashboard**
- Monitor deployments
- Check build logs
- View analytics
- Track performance

### **Supabase Dashboard**
- Check database tables
- Monitor storage usage
- View API logs
- Check for errors

### **VPS Monitoring**

```bash
# Check backup logs
tail -f /opt/roll-nft-backup/logs/backup.log

# Check cron jobs
crontab -l

# Check disk space
df -h /opt/roll-nft-backup

# Check backup files
ls -lh /opt/roll-nft-backup/db-backups/daily/
```

---

## 🔧 **TROUBLESHOOTING**

### **Build Fails on Vercel**

```bash
# Check build logs in Vercel dashboard
# Common issues:
- Missing environment variables
- Syntax errors
- Missing dependencies

# Fix locally first:
npm run build
```

### **Wallet Won't Connect**

- Check browser console for errors
- Ensure wallet extension is installed
- Try different wallet (Keplr, Leap, Cosmostation)
- Clear browser cache

### **Image Upload Fails**

- Check Pinata API keys are correct
- Verify file size < 10MB
- Check file format (PNG, JPG, GIF, WEBP)
- Check Pinata dashboard for quota

### **NFT Minting Fails**

- Check wallet has sufficient CORE balance
- Verify Coreum RPC is accessible
- Check transaction in wallet
- Look for error in browser console

---

## 📞 **SUPPORT RESOURCES**

### **Vercel**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

### **Supabase**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

### **Pinata**
- Docs: https://docs.pinata.cloud
- Support: support@pinata.cloud

### **Coreum**
- Docs: https://docs.coreum.dev
- Discord: https://discord.gg/coreum

---

## 🎯 **NEXT STEPS AFTER DEPLOYMENT**

1. **Test Thoroughly**
   - Create multiple NFTs
   - Test marketplace features
   - Try all wallet types
   - Test on mobile devices

2. **Monitor Performance**
   - Check Vercel analytics
   - Monitor Supabase usage
   - Review VPS backup logs
   - Track error rates

3. **Marketing**
   - Announce launch on social media
   - Share with Coreum community
   - Create launch video/demo
   - Gather user feedback

4. **Iterate**
   - Fix any bugs reported
   - Add requested features
   - Optimize performance
   - Improve UX based on feedback

---

**Deployment is a continuous process. Monitor, iterate, improve! 🚀**

