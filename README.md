# Real-time news Analysis Dashboard

A secure, production-ready web application for visualizing crime data and delivering insights to police and government administrators.

## Features

- 🔐 Google Sign-In Authentication
- 📊 Interactive Dashboard with Crime Statistics
- 🗺️ Map View with Crime Hotspots
- 🤖 LLM-powered Insights
- 📈 User Analytics Tracking
- 📱 Responsive Design

## Project Structure

```
├── app/
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard views
│   ├── map/           # Map view
│   └── components/    # Shared components
├── lib/
│   ├── auth/          # Auth utilities
│   ├── db/            # Database utilities
│   ├── analytics/     # Analytics tracking
│   └── types/         # TypeScript types
├── public/            # Static assets
└── styles/           # Global styles
```

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your credentials
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for required environment variables.

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: Firebase/Firestore
- **Authentication**: NextAuth.js with Google OAuth
- **Maps**: Google Maps API
- **Analytics**: Custom tracking + Google Analytics
- **Deployment**: Vercel (recommended)

## Development

- Run tests: `npm test`
- Lint: `npm run lint`
- Build: `npm run build`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 