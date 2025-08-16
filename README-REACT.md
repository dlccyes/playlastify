# Playlastify - React Frontend

A modern React + TypeScript frontend for the Playlastify application that visualizes your Spotify playlist stats combined with last.fm data.

## ⚡ Quick Start (5 minutes)

```bash
# 1. Clone and setup
git clone https://github.com/dlccyes/playlastify.git
cd playlastify
npm install
pip install -r requirements.txt

# 2. Create .env file with your API credentials
echo "CLIENT_ID=your_spotify_client_id" > .env
echo "CLIENT_SECRET=your_spotify_client_secret" >> .env
echo "REDIRECT_URI=http://localhost:3000" >> .env
echo "LASTFM_API_KEY=your_lastfm_api_key" >> .env

# 3. Start both servers
npm run dev        # Terminal 1: Frontend on http://localhost:3000 (Vite)
python manage.py runserver  # Terminal 2: Backend on http://localhost:8000
```

**Need Spotify API credentials?** [Get them here](https://developer.spotify.com/dashboard) and add `http://localhost:3000` to Redirect URIs.

---

## 🚀 Features

### Original Functionality (Modernized)
- **Spotify OAuth Authentication** - Secure login to access your playlists
- **Current Playback Display** - Shows what you're currently listening to with detailed audio features
- **Playlist Analysis** - Comprehensive statistics and visualizations for any playlist
- **Last.fm Integration** - Optional scrobbling data to see your listening history
- **Audio Features Radar Chart** - Visual representation of track characteristics using Google Charts
- **Genre Analysis** - Word clouds showing genre distributions using AnyChart
- **Date Analytics** - Charts showing when tracks were added and released
- **Artist Distribution** - Pie charts of your top artists using Google Charts
- **Search & Sort** - Powerful search with sortable results
- **Playlist Visualization** - Large playlist image with comprehensive stats

### New Modern Features
- **Responsive Design** - Works perfectly on mobile and desktop
- **Modern UI/UX** - Clean, intuitive interface with smooth animations
- **TypeScript** - Full type safety for better developer experience
- **Component Architecture** - Modular, reusable React components
- **Performance Optimized** - Fast loading and smooth interactions
- **Graceful Error Handling** - App continues to function even when some API calls fail

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build System**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for modern, responsive design
- **Charts**: 
  - **Google Charts** (VegaChart for radar, CoreChart for pie charts)
  - **AnyChart** for word clouds and tag clouds
  - **Recharts** for line charts (date analytics)
- **Icons**: Lucide React for consistent iconography
- **HTTP Client**: Axios for API communication
- **Backend**: Django (existing backend, unchanged)
- **Build Tools**: PostCSS, Autoprefixer, Tailwind CSS v3.3.0

## 📦 Installation & Development

### Prerequisites
- **Node.js 18+** and npm (check with `node --version` and `npm --version`)
- **Python 3.8+** with pip
- **Git** for cloning the repository

### 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/dlccyes/playlastify.git
cd playlastify

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Set up environment variables (see Configuration section below)

### Environment Variables

The app uses environment variables to configure the backend API URL and API keys for different environments:

#### Backend Configuration (.env file in root directory)
```bash
# Spotify API credentials
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:3000

# Last.fm API key
LASTFM_API_KEY=your_lastfm_api_key
```

**Get Last.fm API key:** [Register here](https://www.last.fm/api/account/create) and add it to your `.env` file.

#### Frontend Configuration

#### Local Development
```bash
# .env.development (for local development)
VITE_API_BASE_URL=http://localhost:8000
```

#### Production
```bash
# .env.production (for production builds)
VITE_API_BASE_URL=
```

#### Build Commands
```bash
# Build for development (uses .env.development)
npm run build:dev

# Build for production (uses .env.production)
npm run build:prod

# Default build (uses .env.development if available, otherwise .env.production)
npm run build
```

# 5. Start both servers (in separate terminals)
```

### 🔧 Local Development Setup

#### Frontend Development Server
```bash
# Terminal 1: Start React development server
npm run dev

# This will:
# - Start the app on http://localhost:3000
# - Enable hot reloading for instant updates
# - Show compilation errors in browser
# - Auto-open browser to http://localhost:3000
```

#### Backend Development Server
```bash
# Terminal 2: Start Django backend server
python manage.py runserver

# This will:
# - Start Django on http://localhost:8000
# - Enable auto-reload on code changes
# - Show API endpoints and requests in console
```

#### Alternative: Run Both Simultaneously
```bash
# Install concurrently to run both servers with one command
npm install -D concurrently

# Add this script to package.json:
# "dev": "concurrently \"npm start\" \"cd .. && python manage.py runserver\""

# Then run:
npm run dev
```

### 🌐 Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin (if configured)

### 📁 Project Structure
```
playlastify/
├── src/                    # React frontend source
│   ├── components/         # React components
│   │   ├── LineChart.tsx   # Date analytics charts (Recharts)
│   │   ├── LoadingOverlay.tsx # Loading states
│   │   ├── PieChart.tsx    # Artist distribution (Google Charts)
│   │   ├── RadarChart.tsx  # Audio features (Google Charts VegaChart)
│   │   ├── TrackTable.tsx  # Searchable track table
│   │   └── WordCloud.tsx   # Genre word clouds (AnyChart)
│   ├── hooks/              # Custom React hooks
│   │   └── useSpotify.ts   # Spotify authentication & data management
│   ├── utils/              # Utility functions
│   │   ├── dataProcessing.ts # Data transformation & analysis
│   │   ├── lastfm.ts       # Last.fm API integration
│   │   └── spotify.ts      # Spotify API integration
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # All data structure interfaces
│   └── App.tsx             # Main application component
├── public/                 # Static assets
│   ├── index.html          # Main HTML template
│   ├── manifest.json       # PWA configuration
│   └── playlastify.png     # Site icon/favicon
├── main/                   # Django backend
│   ├── views.py            # API endpoints
│   ├── RequestController.py # Spotify/Last.fm integration
│   └── templates/          # Django templates (legacy)
├── package.json            # Frontend dependencies
├── requirements.txt        # Backend dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── manage.py               # Django management
```

### 🔑 Environment Configuration

#### 1. Create Environment File
```bash
# Create .env file in the root directory
touch .env
```

#### 2. Add Spotify API Credentials
```env
# .env file contents
CLIENT_ID=your_spotify_client_id_here
CLIENT_SECRET=your_spotify_client_secret_here
REDIRECT_URI=http://localhost:3000
```

#### 3. Get Spotify API Credentials
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add `http://localhost:3000` to Redirect URIs
4. Copy Client ID and Client Secret to your `.env` file

### 🧪 Testing the Setup

#### 1. Verify Frontend
```bash
# Check if React app starts
npm start
# Should open http://localhost:3000 with Playlastify homepage
```

#### 2. Verify Backend
```bash
# Check if Django server starts
python manage.py runserver
# Should show "Starting development server at http://127.0.0.1:8000/"
```

#### 3. Test API Endpoints
```bash
# Test backend health (should return JSON)
curl http://localhost:8000/get-env

# Test frontend (should show React app)
curl http://localhost:3000
```

### 🐛 Troubleshooting

#### Common Issues

**Port Already in Use**
```bash
# Frontend port 3000 in use
lsof -ti:3000 | xargs kill -9

# Backend port 8000 in use
lsof -ti:8000 | xargs kill -9
```

**Node Modules Issues**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Python Environment Issues**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Build Errors**
```bash
# Clear build cache
rm -rf build/
npm run build
```

**Tailwind CSS Issues**
```bash
# If you encounter PostCSS errors, ensure Tailwind CSS version compatibility
npm install tailwindcss@3.3.0
```

#### Debug Mode
```bash
# Frontend with detailed logging
DEBUG=true npm start

# Backend with debug logging
python manage.py runserver --verbosity=2
```

### 📱 Development Workflow

1. **Start Development Servers**
   ```bash
   # Terminal 1: Frontend
   npm start
   
   # Terminal 2: Backend
   python manage.py runserver
   ```

2. **Make Changes**
   - Edit React components in `src/`
   - Edit Django views in `main/`
   - Both servers auto-reload on changes

3. **Test Changes**
   - Frontend changes appear instantly in browser
   - Backend changes require page refresh for API calls

4. **Build for Production**
   ```bash
   npm run build
   # Creates optimized build/ directory
   ```

### 🔍 Development Tools

#### Frontend Debugging
- **React Developer Tools** browser extension
- **Console logging** in browser DevTools
- **Network tab** for API call debugging
- **Debug UI elements** (temporary yellow boxes) for troubleshooting

#### Backend Debugging
- **Django Debug Toolbar** (if installed)
- **Console output** in terminal
- **Django admin interface** for data inspection

#### Code Quality
```bash
# Lint frontend code
npm run lint

# Format TypeScript
npx prettier --write src/**/*.{ts,tsx}

# Type checking
npx tsc --noEmit
```

## 🚀 Deployment

### GitHub Pages Deployment
The React frontend is configured for automatic deployment to GitHub Pages via GitHub Actions.

1. **Automatic Deployment**: Push to `main` branch triggers the deploy workflow
2. **Manual Build**: Run `npm run build` to create production build
3. **Static Hosting**: The `build/` directory contains all static files

### Environment Configuration
- **Development**: Backend API calls go to `http://localhost:8000`
- **Production**: Backend API calls go to the same domain (configure as needed)

## 🎨 UI/UX Improvements

### Visual Enhancements
- **Modern Color Scheme**: Dark theme with vibrant accents (`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`)
- **Glass Morphism**: Semi-transparent containers with backdrop blur effects
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Mobile-first design approach
- **Custom Backgrounds**: Gradient backgrounds with subtle patterns
- **Loading States**: Elegant loading animations

### Layout Features
- **Unified Dashboard**: Playlist image, stats, and radar chart in single container
- **Grid System**: Responsive grid layouts for optimal content organization
- **Chart Integration**: Full-width charts with proper spacing and visibility
- **Consistent Spacing**: Uniform margins and padding throughout the interface

### User Experience
- **Intuitive Navigation**: Clear flow from login to analysis
- **Progressive Enhancement**: Features load incrementally
- **Error Handling**: Graceful error messages and recovery (API failures don't break the app)
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 Configuration

### Spotify API
Set up your Spotify application credentials in the backend `.env` file:
```env
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=your_redirect_uri
```

### Last.fm API
The Last.fm API key is already configured in the frontend code.

### Chart Libraries
The app uses multiple chart libraries for optimal performance:
- **Google Charts**: Radar charts (VegaChart) and pie charts (CoreChart)
- **AnyChart**: Word clouds and tag clouds
- **Recharts**: Line charts for date analytics

## 📱 Usage

1. **Login**: Click "Login to Spotify" to authenticate
2. **Load Last.fm Data** (Optional): Enter your Last.fm username for scrobbling data
3. **Analyze Playlists**: Enter a playlist name or use "Liked Songs"
4. **Explore Data**: View charts, statistics, and search through tracks
5. **Sort & Filter**: Use the sortable table to find specific tracks

## 🔄 Migration from jQuery

The React frontend maintains 100% feature parity with the original jQuery version while providing:

- **Better Performance**: Virtual DOM and optimized rendering
- **Maintainability**: Component-based architecture
- **Developer Experience**: TypeScript, hot reloading, modern tooling
- **Responsive Design**: Works across all device sizes
- **Accessibility**: Better screen reader and keyboard support
- **Chart Compatibility**: Uses the same chart libraries (Google Charts, AnyChart) for consistency

## ⚡ Vite Migration Benefits

The project has been migrated from Create React App to Vite, providing:

- **Faster Development**: Instant hot module replacement (HMR)
- **Quicker Builds**: Optimized bundling with Rollup
- **Better Performance**: Smaller bundle sizes and faster loading
- **Modern Tooling**: Latest build system with excellent TypeScript support
- **Improved DX**: Faster startup times and better error reporting

### Chart Library Migration
- **Radar Chart**: Migrated from `static/charts.js` to React component using Google Charts VegaChart
- **Pie Chart**: Migrated from `static/charts.js` to React component using Google Charts CoreChart
- **Word Clouds**: Migrated from `static/charts.js` to React component using AnyChart
- **Line Charts**: Implemented using Recharts for date analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project maintains the same license as the original Playlastify application.

## 🙏 Acknowledgments

- Original jQuery version by [dlccyes](https://github.com/dlccyes)
- Spotify Web API for music data
- Last.fm API for scrobbling data
- React and TypeScript communities for excellent tooling
- Google Charts and AnyChart for powerful visualization capabilities 