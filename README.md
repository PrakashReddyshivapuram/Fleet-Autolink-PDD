# Fleet AutoLink

Vehicle Management System — Web + Mobile

## Tech Stack

| Part | Tech |
|---|---|
| Web | React + Vite + TypeScript + Tailwind CSS |
| Mobile | Expo SDK 51 + React Native |
| Auth | Firebase Authentication |
| Database | Firestore (structured data) + Realtime Database (live GPS) |

## Roles

| Role | Access |
|---|---|
| Admin | Full access — manage vehicles, users, jobs, live map |
| Driver | Start/end trips, share live GPS, view trip history |
| Mechanic | View assigned jobs, update status, add notes |
| Owner | View own vehicles and maintenance history |

---

## Setup — Web

```bash
cd web
npm install
npm run dev
```

Opens at http://localhost:5173

---

## Setup — Mobile

```bash
cd mobile
npm install
npx expo start
```

- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### For Android build (APK)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## Firebase Setup

1. Go to Firebase Console → Project Settings
2. Copy `google-services.json` (Android) → paste into `mobile/google-services.json`
3. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Deploy Realtime DB rules:
   ```bash
   firebase deploy --only database
   ```

---

## First Time Use

1. Register an account and select **Admin** role
2. Add vehicles from the Admin → Vehicles tab
3. Register other users (drivers, mechanics, owners) via the Register page
4. Assign vehicles to owners and drivers from the Vehicles tab
5. Create maintenance jobs and assign to mechanics

---

## Live GPS Flow

1. Admin assigns a vehicle to a driver
2. Driver opens mobile app → taps "Start trip"
3. Phone GPS sends location to Firebase Realtime DB every 5 seconds
4. Admin opens web dashboard → Live Map tab to see vehicle in real time
5. Driver taps "End trip" → location cleared from map

---

## Project Structure

```
fleet-autolink/
├── web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/       (AdminDashboard, AdminVehicles, AdminJobs, AdminUsers, AdminMap)
│   │   │   ├── driver/      (DriverDashboard, DriverHome, DriverTrips)
│   │   │   ├── mechanic/    (MechanicDashboard, MechanicJobs)
│   │   │   └── owner/       (OwnerDashboard, OwnerVehicles)
│   │   ├── context/         (AuthContext)
│   │   ├── hooks/           (useFirestore)
│   │   └── components/      (SidebarLayout)
├── mobile/
│   ├── app/
│   │   ├── index.tsx        (role router)
│   │   ├── login.tsx
│   │   ├── admin.tsx
│   │   ├── driver.tsx
│   │   ├── mechanic.tsx
│   │   └── owner.tsx
│   └── src/
│       ├── context/         (AuthContext)
│       ├── lib/             (firebase, theme)
│       └── types/
├── shared/
│   ├── firebase/config.ts
│   └── types/index.ts
├── firestore.rules
└── database.rules.json
```
