# Playlastify

*playlist+last.fm+spotify*

A modern React + TypeScript webapp that visualizes your Spotify playlist stats combined with last.fm data.

**Site URL**: <https://playlastify.web.app/>  

## 🚀 Features

### Core Functionality
- **Spotify OAuth Authentication** - Secure login to access your playlists
- **Current Playback Display** - Shows what you're currently listening to with detailed audio features
- **Playlist Analysis** - Comprehensive statistics and visualizations for any playlist
- **Last.fm Integration** - Optional scrobbling data to see your listening history

### Data Visualization
- **Audio Features Radar Chart** - Visual representation of track characteristics using Google Charts
- **Genre Analysis** - Word clouds showing genre distributions using AnyChart
- **Date Analytics** - Charts showing when tracks were added and released
- **Artist Distribution** - Pie charts of your top artists using Google Charts
- **Search & Sort** - Powerful search with sortable results and exact match options

## 🎯 What Makes This Special

So there are tons of Spotify or last.fm stats websites out there, but what about combining the 2? This webapp is focused on your **playlists** mainly. Login and enter one of your playlists' name, and you'll see some pretty detailed stats of the playlist, including **audio features radar chart**, **genre word cloud**, **date added/released line chart**, **artists pie chart** and more. And if you enter your last.fm username, you'll also see the **last.fm scrobbling stats** of your playlist and tracks! You'll see your most played songs, and you can also **search and sort anything in your playlist** (like you do in Spotify) and find out how many times you've listened to your songs!

## 📸 Visual Examples

TODO: add screenshots of the redesigned version

### Last.fm Scrobbling Stats
Enter your last.fm username, select the range of date, and your scrobbling data will be loaded.

### Current Playback
Details of the song you're currently playing, including scrobbles if you've entered your last.fm username.

### Playlist Details
Details of the playlist you've entered, including total scrobbles if you've entered your last.fm username.

### Date Added/Released
Line chart of the added date (the date the song is added to this playlist) & released date (the date the song is released) of the songs in your playlist.

### Artist Pie Chart
Your top artists.

### Genre Word Cloud
So Spotify's classification of genres is pretty specific. You may see something like "australian alternative pop" for example, but "australian alternative pop" is still pop, isn't it? So this webapp will generate 2 kinds of genre cloud for you. The first is a word cloud from the genres of the artists in your playlist. The second is a word cloud from **EACH WORD** of your genres. For example, if you have 3 tropical house, 3 progressive house, 3 indie house & 3 house in your playlist, the 2nd word cloud will display "house" for the quantity of 12, which basically translate to **a word cloud of the big genres** of your playlist!

### Search and Sort Anything
Leave it blank to show everything in this playlist. Click any column title to sort (like you do in Spotify desktop). Will also show the total scrobbles of the results if you have entered your last.fm username.

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Charts**: Google Charts (radar/pie) + AnyChart (word clouds) + Recharts (line charts)
- **Backend**: Django + Docker + GCP Cloud Run
- **Hosting**: Firebase Hosting (frontend) + GCP Cloud Run (backend)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- Git

### Quick Start
```bash
# 1. Clone and setup
git clone https://github.com/dlccyes/playlastify.git
cd playlastify
npm install
pip install -r requirements.txt

# 2. Create .env file with your API credentials
echo "CLIENT_ID=your_spotify_client_id" > .env
echo "CLIENT_SECRET=your_spotify_client_secret" >> .env
echo "REDIRECT_URI=http://localhost:5173" >> .env
echo "LASTFM_API_KEY=your_lastfm_api_key" >> .env

# 3. Start both servers
npm run dev        # Terminal 1: Frontend on http://localhost:5173
python manage.py runserver  # Terminal 2: Backend on http://localhost:8000
```

**Need Spotify API credentials?** [Get them here](https://developer.spotify.com/dashboard) and add `http://localhost:5173` to Redirect URIs.

### Environment Variables

#### Backend (.env file)
```bash
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:5173
LASTFM_API_KEY=your_lastfm_api_key
```

#### Frontend
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000

# .env.production
VITE_API_BASE_URL=
```

### Build Commands
```bash
npm run dev      # Development
npm run build    # Production build
npm run preview  # Preview production build
npm run type-check
```

## 🔧 Development

### Project Structure
```
playlastify/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   └── App.tsx             # Main component
├── main/                   # Django backend
├── public/                 # Static assets
└── package.json            # Dependencies
```

### Development Workflow
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
python manage.py runserver
```

## 🚀 Deployment

### Architecture
- **Backend**: Django container deployed to GCP Cloud Run via `Dockerfile`
- **Frontend**: React app built and pushed to `gh-pages` branch, then deployed to Firebase Hosting

### Deployment Flow
1. **Code Push** → `main` branch
2. **Backend**: GCP Cloud Run auto-deploys container
3. **Frontend**: GitHub Action builds and pushes to `gh-pages`, Firebase auto-deploys

### GitHub Actions
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Push to `main` branch
- **Steps**: Install → Build → Push to gh-pages → Firebase auto-deploys

### Firebase Configuration
- **Hosting**: `firebase.json` and `.firebaserc`
- **URL**: `https://playlastify.web.app`

## 🔧 Troubleshooting

### Common Issues

#### Backend (GCP Cloud Run)
- **Container Build Failures**: Check Dockerfile and requirements.txt
- **Environment Variables**: Ensure all required vars are set in Cloud Run

#### Frontend (Firebase Hosting)
- **Build Failures**: Check TypeScript errors with `npm run type-check`
- **CORS Issues**: Verify backend URL configuration
- **GitHub Actions**: Check workflow runs in `.github/workflows/deploy.yml`

#### Development
- **Port Conflicts**: `lsof -ti:5173 | xargs kill -9` (frontend) or `lsof -ti:8000 | xargs kill -9` (backend)
- **Node Issues**: `rm -rf node_modules package-lock.json && npm install`
- **Build Errors**: `rm -rf dist/ && npm run build`

### Debug Commands
```bash
# Backend container
docker build -t playlastify-test .
docker run -p 8000:8000 playlastify-test

# Frontend build
npm run build
ls -la dist/

# Environment check
cat .env.development
cat .env.production
```

## 🙏 Acknowledgments

- Spotify Web API for music data
- Last.fm API for scrobbling data
- Google Charts and AnyChart for visualizations
