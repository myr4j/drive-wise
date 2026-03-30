# DriveWise Frontend

React Native + Expo mobile application for DriveWise - AI-powered fatigue tracking for VTC drivers.

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation 7 (Stack + Bottom Tabs)
- **UI Components**: React Native Paper (Material Design)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Charts**: react-native-svg
- **Location**: expo-location
- **Storage**: AsyncStorage

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── fatigue/        # FatigueGauge, FatigueHistoryChart
│   │   ├── shift/          # ShiftCard, StatCard
│   │   ├── ui/             # Button, Input, Card, LoadingOverlay, ErrorBoundary, EmptyState
│   │   ├── layout/         # Header, Screen
│   │   └── index.ts
│   ├── screens/            # Screen components
│   │   ├── auth/           # Login, Register
│   │   ├── dashboard/      # Home screen
│   │   ├── active-shift/   # Live fatigue tracking
│   │   ├── history/        # History list, Shift detail
│   │   ├── stats/          # Statistics with charts
│   │   └── settings/       # Profile & settings
│   ├── services/           # API calls
│   │   ├── api.ts          # Axios instance
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── shifts.ts       # Shift endpoints
│   │   └── snapshots.ts    # Snapshot endpoint
│   ├── store/              # Zustand stores
│   │   ├── authStore.ts    # User session
│   │   ├── shiftStore.ts   # Active shift
│   │   └── fatigueStore.ts # Fatigue data
│   ├── hooks/              # Custom React hooks
│   │   ├── useLocation.ts  # GPS tracking
│   │   └── useShift.ts     # Shift auto-snapshots
│   ├── utils/              # Helpers, theme, formatters
│   │   ├── theme.ts        # Colors, spacing, typography
│   │   ├── formatters.ts   # Date, time, fatigue formatters
│   │   ├── validators.ts   # Zod schemas
│   │   └── storage.ts      # AsyncStorage helpers
│   ├── types/              # TypeScript types
│   │   ├── api.ts          # API types
│   │   └── navigation.ts   # Navigation types
│   ├── config/             # App configuration
│   └── navigation/         # Navigation setup
├── App.tsx                 # Main app entry
└── app.json                # Expo configuration
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
cd frontend
npm install
```

### Running the App

```bash
# Start Expo dev server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web
```

## Configuration

### API URL

Edit `app.json` to change the backend API URL:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:8000"
    }
  }
}
```

For Android emulator, use `http://10.0.2.2:8000` to access localhost.

## Features

### Authentication ✅
- Login with email/password
- Register new account
- Session persistence with AsyncStorage

### Dashboard ✅
- Welcome greeting
- Start new shift button
- Quick stats overview
- Recent shifts list

### Active Shift ✅
- Real-time fatigue gauge
- Fatigue level indicator (color-coded)
- Suggestion display
- Break timer
- Shift duration counter
- End shift with confirmation
- Auto GPS snapshots every 5 minutes

### History ✅
- Paginated list of past shifts
- Filter by status (all, completed, active)
- Pull to refresh
- Tap to view shift details

### Shift Detail ✅
- Full shift statistics
- Fatigue evolution chart
- Status indicator

### Statistics ✅
- Overview stats (shifts, driving hours)
- Fatigue distribution pie chart
- 7-day fatigue trend line chart
- Feature importance bar chart

### Settings ✅
- Profile info
- Logout

### Navigation ✅
- Bottom tab navigation (5 tabs)
- Stack navigation for modals
- Deep linking ready

### Hooks ✅
- `useLocation`: GPS tracking with permissions
- `useShift`: Auto-snapshot management

### Error Handling ✅
- ErrorBoundary component
- LoadingOverlay component
- EmptyState component

## API Integration

The app connects to the FastAPI backend with these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Register driver |
| `/auth/login` | POST | Login driver |
| `/shift/start` | POST | Start shift |
| `/shift/{id}/end` | POST | End shift |
| `/shift/{id}/status` | GET | Get shift status |
| `/shift/s` | GET | List shifts |
| `/shift/driver/stats` | GET | Driver statistics |

## State Management

### Stores

- **authStore**: Driver session state
- **shiftStore**: Active shift state
- **fatigueStore**: Fatigue data and history

## Next Steps

### Priority 1 - Backend Integration
1. **Test with real backend** - Run backend server and test all API calls
2. **Add missing endpoints** if needed:
   - `GET /shift/{shift_id}` - Full shift details
   - `GET /shift/{shift_id}/snapshots` - All snapshots for timeline

### Priority 2 - Polish
1. **Animations** - Add transitions, loading animations
2. **Haptic feedback** - On fatigue level change
3. **Dark mode** - Support system theme
4. **French translations** - Ensure all text is in French

### Priority 3 - Advanced Features
1. **Push Notifications** - Fatigue alerts via expo-notifications
2. **Background location** - Ensure snapshots work in background
3. **Offline mode improvements** - Better queue management
4. **Data export** - Export shift history to CSV/PDF

## Troubleshooting

### TypeScript Errors

```bash
npx tsc --noEmit
```

### Clear Cache

```bash
npx expo start -c
```

### Reset Project

```bash
rm -rf node_modules
npm install
```
