# BusMitra User App

A modern React application for bus tracking and route discovery, built with TypeScript, Tailwind CSS, and Vite.

## Features

- **Landing Page**: Welcome screen with app introduction and features
- **Bus Discovery**: Find buses with real-time location and ETA
- **Live Tracking**: Track selected buses with detailed route information
- **Real-time Updates**: Live ETA and speed monitoring
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for state management
- **Lucide React** for icons
- **Radix UI** for accessible components

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:8081`

## Project Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components
├── pages/            # Main application pages
│   ├── LandingPage.tsx
│   ├── BusDiscovery.tsx
│   └── BusDetails.tsx
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
└── main.tsx          # Application entry point
```

## Pages

### Landing Page
- Welcome screen with app features
- Call-to-action to start journey
- Feature highlights

### Bus Discovery
- Search for buses by location
- Interactive map view
- List of available buses with ETA
- Real-time bus status

### Bus Details
- Detailed bus information
- Complete route with stops
- Live tracking map
- ETA and speed monitoring
- Passenger count and status

## Development

- **Port**: 8081
- **Hot Reload**: Enabled
- **TypeScript**: Strict mode
- **ESLint**: Configured for React and TypeScript

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.
