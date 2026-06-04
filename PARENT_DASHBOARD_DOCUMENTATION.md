# Parent Dashboard - Complete Documentation

## Overview

The Parent Dashboard is a comprehensive real-time monitoring interface for parents to track their children's safety in the Smart Campus Safety System. It provides real-time location tracking, alert management, device status monitoring, and emergency event tracking.

---

## Components Architecture

### 1. **DashboardStats Component**
**Location:** `src/app/components/parent/DashboardStats.tsx`

#### Features:
- Displays 6 key status cards with real-time data
- Fetches data from Firestore collections in real-time
- Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
- Error handling and loading states

#### Status Cards:
1. **Child Status** - Shows online/offline status
2. **Current Location Status** - Location availability
3. **Total Alerts Received** - Alert count
4. **Last Location Update** - Time of last GPS update
5. **Device Status** - Connected/Disconnected status
6. **Emergency Status** - Normal/Emergency indicator

#### Props:
```typescript
interface DashboardStatsProps {
  child: StudentDocument | null;
  totalAlerts: number;
  childIsOnline: boolean;
  deviceStatus: 'connected' | 'disconnected';
  lastLocationUpdate: string;
  emergencyActive: boolean;
  loading?: boolean;
}
```

#### Data Sources:
- `alerts` collection - For alert counting
- `devices` collection - For device status
- `locations` collection - For GPS updates and online status
- `emergencies` collection - For emergency events

---

### 2. **StatusCard Component**
**Location:** `src/app/components/parent/StatusCard.tsx`

#### Features:
- Individual status card with icon and badge
- Color-coded status indicators
- Responsive sizing and spacing
- Hover effects and animations

#### Supported Status Types:
- `online` / `offline` - Green / Red badges
- `connected` / `disconnected` - Green / Red badges
- `normal` / `emergency` - Green / Red badges
- `available` / `unavailable` - Green / Red badges

#### Props:
```typescript
type Props = {
  title: string;
  value?: string | number | React.ReactNode;
  status?: 'online' | 'offline' | 'connected' | 'disconnected' | 'normal' | 'emergency' | 'available' | 'unavailable';
  icon?: IconType;
  subtitle?: string;
  color?: 'red' | 'green' | 'blue' | 'purple' | 'yellow';
};
```

---

### 3. **RecentActivity Component**
**Location:** `src/app/components/parent/RecentActivity.tsx`

#### Features:
- Timeline-based activity feed
- Real-time updates from multiple Firestore collections
- Activity deduplication and sorting
- Supports 4 activity types:
  1. **Login** - Student login events
  2. **Location** - GPS location updates
  3. **Alert** - Alert notifications
  4. **Emergency** - Emergency events

#### Activity Sources:
- `students` collection - Last login times
- `locations` collection - GPS updates
- `alerts` collection - Alert notifications
- `emergencies` collection - Emergency events

#### Props:
```typescript
interface RecentActivityProps {
  child: StudentDocument | null;
  alerts: AlertDocument[];
  lastLogin?: string;
  loading?: boolean;
}
```

#### Data Structure:
```typescript
type Activity = {
  id: string;
  type: 'login' | 'location' | 'alert' | 'emergency';
  title: string;
  description: string;
  timestamp: string;
  icon: typeof AlertTriangle;
  color: 'emerald' | 'blue' | 'yellow' | 'red' | 'purple';
};
```

---

### 4. **QuickActions Component**
**Location:** `src/app/components/parent/QuickActions.tsx`

#### Features:
- 3 quick action buttons for navigation
- Gradient backgrounds with hover effects
- Icons from lucide-react
- Mobile responsive (stacked on mobile, grid on desktop)

#### Actions:
1. **View Child Profile** → `/parent/child`
2. **Live Tracking** → `/parent/tracking`
3. **Emergency History** → `/parent/alerts`

#### Styling:
- Gradient backgrounds for visual appeal
- Smooth hover animations
- Transform effects for interactivity
- Arrow indicators on hover

---

### 5. **ParentDashboard Page**
**Location:** `src/app/pages/parent/ParentDashboard.tsx`

#### Features:
- Main dashboard layout combining all components
- Real-time data aggregation from Firebase
- Error handling and loading states
- Parent and child data fetching
- Alert aggregation for all children

#### Data Flow:
1. Fetch parent data from `users` collection
2. Fetch children linked to parent from `students` collection
3. Fetch alerts for all children from `alerts` collection
4. Fetch device status from `devices` collection
5. Fetch user status (online/offline) from `userStatus` collection

#### Key Features:
- Responsive layout suitable for all screen sizes
- Dark mode support (via dark: Tailwind classes)
- Real-time Firebase listeners
- Proper cleanup of subscriptions
- Error state handling
- Loading skeleton states

---

## Firebase Integration

### Collections Required:

#### 1. **users** (or parents)
```typescript
{
  id: string;           // Document ID (parent UID)
  uid: string;         // Firebase Auth UID
  name: string;        // Parent name
  email: string;       // Parent email
  role: 'parent';      // User role
  createdAt: Timestamp;
}
```

#### 2. **students**
```typescript
{
  id: string;                  // Document ID
  uid: string;                // Student Firebase UID
  name: string;               // Student name
  parentId: string;           // Parent UID (links to parent)
  deviceId: string;           // Device assignment
  emergencyStatus: string;    // 'active' | 'inactive'
  lastLocation: {
    lat: number;
    lng: number;
    timestamp: Timestamp;
  };
  phone: string;
  registrationNumber: string;
}
```

#### 3. **devices**
```typescript
{
  id: string;                 // Device ID
  studentId: string;         // Student UID
  status: 'connected' | 'disconnected';
  lastPing: Timestamp;
  batteryLevel: number;
}
```

#### 4. **locations**
```typescript
{
  id: string;
  studentId: string;
  lat: number;
  lng: number;
  timestamp: Timestamp;
  accuracy: number;
}
```

#### 5. **alerts**
```typescript
{
  id: string;
  studentId: string;
  parentId: string;
  type: string;              // Alert type
  message: string;           // Alert message
  timestamp: Timestamp;
  status: 'active' | 'resolved';
}
```

#### 6. **emergencies**
```typescript
{
  id: string;
  studentId: string;
  parentId: string;
  details: string;
  timestamp: Timestamp;
}
```

#### 7. **userStatus**
```typescript
{
  id: string;               // User UID
  isOnline: boolean;
  status: 'active' | 'inactive';
  lastActive: Timestamp;
}
```

---

## UI/UX Features

### Design System:
- **Color Scheme**: Tailwind CSS color palette
- **Typography**: Professional sans-serif
- **Spacing**: Consistent padding and margins
- **Shadows**: Subtle shadow effects for depth
- **Borders**: Soft borders for card separation

### Responsive Design:
- **Mobile**: Single column layout
- **Tablet**: 2-3 column grid
- **Desktop**: 3-column grid with full layout
- **Max Width**: 7xl container for readability

### Dark Mode Support:
- All components include dark: prefixes
- Automatic dark mode via system preference
- Smooth color transitions

### Accessibility:
- Semantic HTML structure
- Proper icon labeling
- Color contrast ratios meet WCAG standards
- Keyboard navigation support

---

## Real-Time Updates

### Firebase Listeners:
Each component uses `onSnapshot()` for real-time updates:
- **Automatic updates** when data changes in Firestore
- **Proper cleanup** with subscription functions
- **Error handling** with try-catch blocks
- **Loading states** during data fetch

### Performance Optimizations:
- Query limits to avoid fetching too much data
- Filtered queries by parentId/studentId
- Deduplication in activity feed
- Unsubscribe on component unmount

---

## Error Handling

### Types of Errors Handled:
1. **No parent record found** - User account issue
2. **No children linked** - No students assigned
3. **Firebase listener errors** - Network or permission issues
4. **Missing data** - Graceful fallbacks

### User-Facing Error States:
- Error banners in dashboard header
- Empty state messages
- Loading spinners during fetch
- Helpful error descriptions

---

## Code Quality

### TypeScript Support:
- Full type safety with interfaces
- Component prop types
- Firebase document types
- Activity type definitions

### Component Structure:
- Single Responsibility Principle
- Reusable components
- Clear prop contracts
- Proper state management

### Best Practices:
- No prop drilling (props passed directly)
- Firebase cleanup on unmount
- Cancellation flags for async operations
- Error logging with context

---

## Usage

### Route Configuration:
```typescript
// In src/app/App.tsx
<Route
  path="/parent/*"
  element={
    <ProtectedRoute allowedRoles={['parent']}>
      <DashboardLayout role="parent">
        <Routes>
          <Route index element={<ParentDashboard />} />
          {/* Other parent routes */}
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

### Accessing the Dashboard:
1. Log in as a parent user
2. Navigate to `/parent` route
3. Dashboard loads automatically
4. Real-time data syncs from Firebase

---

## Future Enhancements

### Potential Improvements:
1. **Export/Reports** - Generate PDF reports
2. **Notifications** - Push notifications for alerts
3. **Geofencing** - Zone-based alerts
4. **Analytics** - Historical data analysis
5. **Multi-child Support** - Better UI for multiple children
6. **Custom Alerts** - User-defined alert types
7. **Data Export** - CSV/PDF exports
8. **Widget Customization** - User preference for card order

---

## Troubleshooting

### Issue: Dashboard shows "No parent record found"
**Solution:** Ensure parent document exists in `users` collection with parentId field

### Issue: No children displayed
**Solution:** Verify `students` collection has documents with parentId matching parent UID

### Issue: Real-time updates not working
**Solution:** Check Firebase listener logs and ensure collection permissions are correct

### Issue: Empty activity feed
**Solution:** Ensure documents exist in `alerts`, `emergencies`, and `locations` collections

---

## File Structure

```
src/
├── app/
│   ├── components/
│   │   └── parent/
│   │       ├── DashboardStats.tsx
│   │       ├── StatusCard.tsx
│   │       ├── RecentActivity.tsx
│   │       └── QuickActions.tsx
│   ├── pages/
│   │   └── parent/
│   │       └── ParentDashboard.tsx
│   └── context/
│       └── AuthContext.tsx
├── config/
│   └── firebase.ts
└── main.tsx
```

---

## Dependencies

- **React 18.2.0** - UI framework
- **React Router DOM 6.20.0** - Navigation
- **Firebase 10.0.0** - Backend services
- **Tailwind CSS 3.4.19** - Styling
- **Lucide React 0.292.0** - Icons
- **TypeScript 5.2.2** - Type safety

---

## License

Part of Smart Campus Safety System © 2024

---

## Support

For issues or feature requests, please contact the development team.
