# MtgLeague

A web application for managing Magic: The Gathering league events, including player registration, match tracking, and leaderboard management across multiple stores.

## Overview

MtgLeague enables Tournament Organisers to create and manage Pauper league seasons with Swiss-style legs and knockout Top 8 tournaments. The application supports multiple stores running concurrent leagues with flexible season structures.

## Key Features

- **Multi-store support**: Each store can run independent leagues
- **Flexible seasons**: Configurable number of legs (minimum 10) with customizable best results counting
- **Swiss tournament management**: Automated pairings and result tracking
- **Top 8 tournaments**: Single elimination knockout tournaments
- **Real-time standings**: Live leaderboard updates
- **Lightweight CMS**: Store and league-specific content management
- **OAuth authentication**: Google, Discord, and other social logins

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Deployment**: Vercel (free tier)

## Documentation

- **[Product Requirements Document](docs/mtgleague_prd.md)** - Detailed feature specifications and data model
- **[Tech Stack Guide](docs/tech_stack.md)** - Technology choices and getting started instructions

## Getting Started

1. Review the [Product Requirements Document](docs/mtgleague_prd.md) for feature specifications
2. Follow the [Tech Stack Guide](docs/tech_stack.md) for setup instructions
3. Set up Supabase and Vercel accounts
4. Clone the repository and install dependencies
5. Configure environment variables
6. Deploy and test

## Development Status

🚧 **In Development** - MVP phase

## License

[Add your license here]

## Contributing

[Add contribution guidelines here] 