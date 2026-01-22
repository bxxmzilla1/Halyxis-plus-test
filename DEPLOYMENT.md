# Deployment Guide

This guide covers deploying Halyxis to Vercel and GitHub.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Node.js 18+ installed locally

## Security: API Key Management

**IMPORTANT**: Your Gemini API key is NOT exposed in the build or source code.

- API keys are stored locally in each user's browser (localStorage)
- Users enter their own API keys through the Creator Settings modal
- Environment variables are excluded from the client bundle
- Never commit `.env` files to Git

## Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Project**:
   - Framework Preset: Vite (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Production Deploy**:
   ```bash
   vercel --prod
   ```

## Deploy to GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**:
   Add to scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. **Update vite.config.ts**:
   Add base path if your repo is not at root:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/', // Only if not deploying from root
     // ... rest of config
   });
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

## Environment Variables

**For Vercel** (Optional - only if you want a default dev key):
- Go to Project Settings → Environment Variables
- Add `GEMINI_API_KEY` (optional, users should enter their own)

**Note**: Environment variables are NOT exposed to the client. Users must enter their own API keys in the app.

## Post-Deployment Checklist

- [ ] Test the app loads correctly
- [ ] Verify PWA install prompt appears (on supported browsers)
- [ ] Test API key entry in Creator Settings
- [ ] Verify service worker is registered (check browser DevTools → Application → Service Workers)
- [ ] Test offline functionality (after first load)
- [ ] Add PWA icons (`pwa-192x192.png` and `pwa-512x512.png` to `public/` directory)

## Troubleshooting

### Build Fails
- Check Node.js version (needs 18+)
- Run `npm install` locally to check for dependency issues
- Check Vercel build logs for specific errors

### PWA Not Working
- Ensure HTTPS is enabled (required for service workers)
- Check browser console for service worker errors
- Verify manifest.webmanifest is accessible

### API Key Issues
- Users must enter their own API keys in Creator Settings
- Environment variables won't work for client-side API calls
- Check browser console for API errors

## Custom Domain (Vercel)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

## Continuous Deployment

Vercel automatically deploys on every push to your main branch:
- Push to `main` → Production deployment
- Push to other branches → Preview deployment

To disable auto-deploy:
- Go to Project Settings → Git
- Configure deployment settings
