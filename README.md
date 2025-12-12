# MindLists - Web Application

A comprehensive list management web application built with Vue 3, TypeScript, and Firebase. MindLists provides specialized list types for different use cases including shopping, subscriptions, passcodes, travel, meetings, reminders, and games.

## Features

- **7 Specialized List Types**: Supermarket, Subscriptions, Passcodes, Travel, Meetings, Reminders, and Games
- **Real-time Synchronization**: All changes sync instantly across devices using Firebase Firestore
- **Item Management**: Create, edit, delete items with type-specific properties
- **Search & Filter**: Real-time search by title, description, tags with filter options
- **Expiry Tracking**: Color-coded indicators for expiring items
- **Notifications**: Web Notifications API with preset reminders and expiry alerts
- **Secure Passcode Storage**: WebAuthn authentication and Web Crypto API encryption
- **Saved Shopping Lists**: Create and manage shopping list templates (Supermarket only)
- **Price Tracking**: Track price history with trends and percentage changes (Supermarket only)
- **Photo Management**: Upload and manage photos for items (Supermarket only)
- **Multiple Authentication Methods**: Email/password, Google Sign-In, and anonymous authentication

## Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Firebase** - Backend services (Auth, Firestore, Storage)
- **Web Notifications API** - Browser notifications
- **WebAuthn API** - Biometric authentication
- **Web Crypto API** - Encryption for passcodes

## Prerequisites

- Node.js 18+ and npm
- Firebase project with:
  - Authentication enabled (Email/Password and Google)
  - Firestore database
  - Storage bucket

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Mindlists-2.0
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

4. Get your Firebase configuration:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" and select the web app
   - Copy the configuration values to your `.env` file

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard

### 2. Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable "Email/Password"
3. Enable "Google" and configure OAuth consent screen

### 3. Create Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Start in test mode (security rules will be configured separately)
4. Deploy the security rules from `firestore.rules`:
```bash
firebase deploy --only firestore:rules
```

### 4. Configure Storage

1. Go to Storage
2. Click "Get started"
3. Deploy the security rules from `storage.rules`:
```bash
firebase deploy --only storage:rules
```

### 5. Security Rules

The project includes security rules files:
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules

Deploy them using Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

Build the application:
```bash
npm run build
```

The production build will be in the `dist` directory.

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Vue components
│   ├── items/          # Item-related components
│   ├── layout/         # Layout components
│   ├── lists/          # List-related components
│   ├── passcodes/      # Passcode components
│   ├── shared/         # Shared utility components
│   └── supermarket/   # Supermarket-specific components
├── composables/        # Vue composables
├── config/            # Configuration files
├── router/            # Vue Router configuration
├── stores/            # Pinia stores
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── views/             # Page components
├── App.vue            # Root component
├── main.ts            # Application entry point
└── style.css          # Global styles
```

## Key Features Implementation

### List Types

Each list type has its own color scheme and icon:
- **Supermarket** 🛒 (Green #4caf50)
- **Subscriptions** 💳 (Blue #2196f3)
- **Passcodes** 🔒 (Purple #9c27b0)
- **Travel** 🧳 (Orange #ff9800)
- **Meetings** 📅 (Cyan #00bcd4)
- **Reminders** 🔔 (Red #f44336)
- **Games** 🎮 (Pink #e91e63)

### Item Properties

All items support:
- Title (required)
- Description (optional)
- Tags (non-supermarket lists)
- Checkbox (completion status)
- Expiry date
- Notification presets
- Photo (Supermarket only)
- Price history (Supermarket only)

### Notifications

The app uses the Web Notifications API to:
- Send reminders at specific times
- Alert before expiry (1 day and 7 days)
- Support preset reminders (1h, 3h, 6h, 1d, 3d before expiry)

### Passcode Security

Passcodes are:
- Encrypted using Web Crypto API
- Stored locally (never in Firebase)
- Protected with WebAuthn authentication
- Only passcode metadata stored in Firestore

## Environment Variables

All Firebase configuration is done through environment variables. See `.env.example` for the required variables.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Note**: Some features require modern browser APIs:
- Web Notifications API (for notifications)
- WebAuthn API (for passcode authentication)
- Web Crypto API (for passcode encryption)

## Troubleshooting

### Firebase Connection Issues

- Verify your `.env` file has correct Firebase configuration
- Check Firebase project settings
- Ensure Firestore and Storage are enabled

### Notification Permission Denied

- Users must grant notification permission
- Check browser settings for notification permissions
- Some browsers require HTTPS for notifications

### WebAuthn Not Working

- WebAuthn requires HTTPS (except localhost)
- Ensure browser supports WebAuthn API
- Check browser console for errors

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.



