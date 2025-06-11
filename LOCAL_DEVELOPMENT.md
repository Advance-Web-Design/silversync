# Local Development Setup Guide

## Running the Application Locally

### Prerequisites
1. Make sure you have Node.js installed (version 22+ recommended)
2. Configure your environment variables (see below)

### Port Configuration
- **Client (Vite)**: http://localhost:5173
- **Server (Next.js)**: http://localhost:3000

### Environment Variables Setup

#### 1. Server Environment Variables
Copy the template and add your actual values:
```bash
cp server/.env.example server/.env.local
```

Edit `server/.env.local` and add your actual:
- TMDB API key and token
- Firebase configuration

#### 2. Client Environment Variables
The client `.env.local` is already configured to point to the local server.

### Running the Development Servers

#### Option 1: Run Both Servers Separately (Recommended)

**Terminal 1 - Start the Server:**
```bash
cd server
npm install
npm run dev
```
Server will start at: http://localhost:3000

**Terminal 2 - Start the Client:**
```bash
cd client
npm install
npm run dev
```
Client will start at: http://localhost:5173

#### Option 2: Quick Start Scripts

You can also use these one-liner commands:

**Start Server:**
```powershell
cd "c:\Users\test\OneDrive - Braude College of Engineering\Software Engineering Stuff\Web\Connect-the-shows\server" ; npm run dev
```

**Start Client:**
```powershell
cd "c:\Users\test\OneDrive - Braude College of Engineering\Software Engineering Stuff\Web\Connect-the-shows\client" ; npm run dev
```

### Testing the Setup

1. Start both servers as described above
2. Open http://localhost:5173 in your browser
3. Try searching for actors/movies to verify API communication
4. Check browser console for any CORS or API errors

### Testing the setup in production environment locally (for real world performance testing)

1. start the server normally
2. run the following comamnds:
    ```bash
    cd client
    npm install
    npm run build
    npm run preview
    ```
3. open the link in the terminal

### Troubleshooting

**If you see "server page" when opening the client:**
- Make sure you're opening http://localhost:5173 (not http://localhost:3000)
- Verify both servers are running on their correct ports

**If you get CORS errors:**
- Check that `ALLOWED_ORIGIN=http://localhost:5173` is set in `server/.env.local`
- Restart the server after changing environment variables

**If API calls fail:**
- Verify `VITE_BACKEND_URL=http://localhost:3000` is set in `client/.env.local`
- Check that your TMDB API credentials are correctly set in `server/.env.local`

### Production vs Development

- **Development**: Client (5173) → Server (3000) → TMDB API
- **Production**: Client (Vercel) → Server (Vercel) → TMDB API


The environment variables automatically handle this switching.