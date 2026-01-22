<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Halyxis - AI-Powered Image Generation

A Progressive Web App (PWA) for AI-powered image generation and editing using Google Gemini API.

View your app in AI Studio: https://ai.studio/apps/drive/1VhzoqsGY6t4DfOQ_7o9GsllVOi_Zm0VP

## Features

- 🎨 AI-powered image generation and editing
- 📱 Progressive Web App (PWA) - installable on mobile and desktop
- 🔒 Secure API key management (users enter their own keys)
- 💾 Offline support with service workers
- 🚀 Optimized for Vercel deployment

## Run Locally

**Prerequisites:** Node.js 18+ and npm

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd halyxis---andre-test----nsfw
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## API Key Setup

**Important:** For security, API keys are NOT stored in environment variables or exposed to the client.

1. Users must enter their own Google Gemini API key in the app settings
2. Go to Creator Settings (gear icon) after logging in
3. Enter your Gemini API key in the "Google Gemini API Key" field
4. Click "Apply Key" to save

Get your API key from: https://aistudio.google.com/app/apikey

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Deploy to Vercel

1. Push your code to GitHub

2. Import your repository in [Vercel](https://vercel.com):
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the Vite configuration

3. Deploy:
   - Vercel will automatically build and deploy your app
   - No environment variables needed (users enter their own keys)

4. Your app will be available at `https://your-project.vercel.app`

## Deploy to GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Configure GitHub Pages to serve from the `dist` directory

3. Update `vite.config.ts` base path if needed for your repository name

## PWA Features

- **Installable**: Users can install the app on their devices
- **Offline Support**: Service worker caches assets for offline use
- **App-like Experience**: Runs standalone without browser UI

To install:
- **Desktop**: Look for the install prompt in your browser
- **Mobile**: Use "Add to Home Screen" option

## Security Notes

- ✅ API keys are stored locally in the user's browser (localStorage)
- ✅ API keys are never exposed in the build or source code
- ✅ Environment variables are excluded from the client bundle
- ✅ Users manage their own API keys through the settings modal

## Project Structure

```
├── components/          # React components
├── services/           # API services (Gemini integration)
├── utils/              # Utility functions
├── public/             # Static assets and PWA files
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── vite.config.ts      # Vite configuration with PWA plugin
└── vercel.json         # Vercel deployment configuration
```

## Development

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **PWA**: vite-plugin-pwa

## License

Private project - All rights reserved
