# URL-Shortener

## Overview

The URL Shortener is a web application that allows users to shorten long URLs, manage them, and perform various operations on their saved URLs. Users can log in, save their shortened URLs to their profile, and export them as a text file. The application features advanced capabilities such as offline functionality, caching, and background synchronization.

## Features

- **User Authentication**: Log in to access and manage your URLs.
- **URL Shortening**: Input a long URL and get a shortened version.
- **Profile Management**: Save shortened URLs to your profile.
- **Export URLs**: Export all saved URLs to a .txt file.
- **Manage URLs**: Update or delete saved URLs.
- **File Upload**: Upload .txt files to read and save URLs from the file.
- **Offline Support**: Create and manage URLs even when offline.
- **Background Sync**: Automatically synchronize offline changes when connection is restored.
- **Caching**: Improved performance with client and server-side caching.
- **Progressive Web App (PWA)**: Install and use the application like a native app.

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: Vue.js, Vite, Pinia (state management)
- **Database**: PostgreSQL with Neon
- **Caching**: Node-Cache for server-side caching
- **Offline Storage**: IndexedDB for client-side persistence
- **Service Workers**: For offline functionality and background sync
- **Deployment**: Vercel (client), Render (server)
- **CI/CD**: GitHub Actions

## Advanced Features

### Offline Functionality

The application uses Service Workers and IndexedDB to provide a seamless offline experience:

- Create short URLs while offline
- View and manage previously loaded URLs
- Changes are queued and synchronized when online

### Caching Strategy

- **Server-side**: Node-Cache implementation with configurable TTL (Time-To-Live)
- **Client-side**: Service Worker cache for static assets and API responses
- **Cache Invalidation**: Automatic and manual cache clearing mechanisms

### Background Synchronization

- Uses the Background Sync API to synchronize offline changes
- Automatically attempts synchronization when network connection is restored
- Fallback to manual synchronization for browsers without Background Sync support

### Progressive Web App

- Installable on desktop and mobile devices
- Works offline with cached resources
- Push notifications for important events

## Getting Started

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Set up the database with PostgreSQL and Neon.
4. Run the development server with `npm run dev`.
5. Access the app through your browser.

## Development

### Client

```bash
cd client
npm install
npm run dev
```

### Server

```bash
cd server
npm install
npm run dev
```

## Deployment

The application is deployed on Vercel and Render, ensuring seamless CI/CD integration through GitHub Actions.

## Browser Compatibility

The application is designed to work on modern browsers with fallbacks for features not supported by all browsers:

- Service Workers and Background Sync: Chrome, Edge, Firefox, Opera
- IndexedDB: All modern browsers
- For browsers without advanced features, the application degrades gracefully to provide core functionality
