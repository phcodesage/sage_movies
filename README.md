# Sage Movies

A Netflix-style movie streaming application built with Node.js and Express.

## Features

- Netflix-inspired UI with responsive design
- Movie, TV show, and anime browsing
- Multiple video sources for better playback reliability
- Search functionality
- Genre filtering
- Secure API key handling through server-side proxying

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express
- **API**: The Movie Database (TMDB) API

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher)
2. Clone this repository
3. Install dependencies:

```bash
npm install
```

## Configuration

The application uses environment variables for configuration. These are already set up in the `.env` file:

- `TMDB_API_KEY`: Your TMDB API key
- `TMDB_BASE_URL`: The base URL for TMDB API
- `TMDB_IMG_URL`: The base URL for TMDB images

## Running the Application

Start the development server:

```bash
npm run dev
```

Or start the production server:

```bash
npm start
```

Then open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

## How It Works

1. The Node.js server handles API requests and proxies them to TMDB to keep your API key secure
2. The frontend fetches data from the backend API endpoints
3. Video playback is handled through embedded iframes from various streaming sources
4. The UI is designed to be responsive and provide a Netflix-like experience

## License

This project is for educational purposes only. All movie data is sourced from TMDB.
