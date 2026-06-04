# Parent Dashboard - Component API Reference

## Table of Contents
1. [ParentDashboard](#parent-dashboard)
2. [DashboardStats](#dashboard-stats)
3. [StatusCard](#status-card)
4. [RecentActivity](#recent-activity)
5. [QuickActions](#quick-actions)

---

## ParentDashboard

**File:** `src/app/pages/parent/ParentDashboard.tsx`

**Purpose:** Main dashboard page component that orchestrates all child components and manages data fetching from Firebase.

### Props
None (uses useAuth hook and Router)

### State Management
```typescript
// Auth
const { user, loading } = useAuth();

// Data States
const [parent, setParent] = useState<ParentDocument | null>(null);
const [children, setChildren] = useState<StudentDocument[]>([]);
const [alerts, setAlerts] = useState<AlertDocument[]>([]);
const [userStatuses, setUserStatuses] = useState<Record<string, any>>({});
const [devices, setDevices] = useState<Record<string, any>>({});

// UI States
const [dashboardLoading, setDashboardLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Effects
1. **Fetch Parent Data**
   - Triggers: `user?.id`, `loading`
   - Sources: `users` collection
   - Updates: `parent`, `error`, `dashboardLoading`

2. **Fetch Children Data**
   - Triggers: `parent?.id`
   - Sources: `students` collection (filtered by parentId)
   - Updates: `children`

3. **Fetch Alerts**
   - Triggers: `children` (child IDs)
   - Sources: `alerts` collection
   - Updates: `alerts`

4. **Fetch User Status**
   - Triggers: Automatic
   - Sources: `userStatus` collection
   - Updates: `userStatuses`

5. **Fetch Device Status**
   - Triggers: Automatic
   - Sources: `devices` collection
   - Updates: `devices`

### Child Components
- `DashboardStats` - Displays status cards
- `RecentActivity` - Shows activity feed
- `QuickActions` - Navigation buttons

### Renders
```typescript
if (loading || dashboardLoading) → Loading spinner
if (!parent) → "No parent record found" message
if (children.length === 0) → "No linked student" message
else → Full dashboard with all components
```

---

## DashboardStats

**File:** `src/app/components/parent/DashboardStats.tsx`

**Purpose:** Component that displays 6 status cards with real-time data about a child.

### Props
```typescript
interface DashboardStatsProps {
  // Child information
  child: StudentDocument | null;
  
  // Alert information
  totalAlerts: number;
  
  // Status flags
  childIsOnline: boolean;
  deviceStatus: 'connected' | 'disconnected';
  emergencyActive: boolean;
  
  // Location/timing
  lastLocationUpdate: string;
  
  // UI state
  loading?: boolean;
}
```

### Status Cards
| Card | Value | Status Badge | Icon |
|------|-------|--------------|------|
| Child Status | "Online" / "Offline" | online / offline | User |
| Current Location | "Available" / "Unavailable" | available / unavailable | MapPin |
| Total Alerts | Number | - | AlertCircle |
| Last Location Update | Timestamp | - | Clock |
| Device Status | "Connected" / "Disconnected" | connected / disconnected | Smartphone |
| Emergency Status | "Emergency" / "Normal" | emergency / normal | AlertTriangle |

### Conditional Rendering
- If `loading === true`: Shows skeleton loading state
- If `child === null`: Shows empty skeletons

### Color Scheme
```
Online/Connected/Normal/Available → Green badge
Offline/Disconnected/Emergency/Unavailable → Red badge
```

---

## StatusCard

**File:** `src/app/components/parent/StatusCard.tsx`

**Purpose:** Individual status card component showing a single metric.

### Props
```typescript
type Props = {
  // Content
  title: string;                    // Card title
  value?: string | number | React.ReactNode;  // Main value
  subtitle?: string;                // Secondary text
  
  // Styling
  status?: 'online' | 'offline' | 'connected' | 'disconnected' 
           | 'normal' | 'emergency' | 'available' | 'unavailable';
  icon?: IconType;                 // Lucide icon
  color?: 'red' | 'green' | 'blue' | 'purple' | 'yellow';
};
```

### Status Badge Mapping
```typescript
'online' / 'connected' / 'normal' / 'available'
  → Green: "bg-green-100 text-green-800"
  
'offline' / 'disconnected' / 'unavailable'
  → Red: "bg-red-100 text-red-800"
  
'emergency'
  → Red: "bg-red-100 text-red-800"
```

### Styling
- **Card**: `bg-slate-900 rounded-2xl p-6 border-slate-800 shadow-lg`
- **Hover**: Subtle shadow increase and opacity change
- **Badge**: Rounded pill shape with color variants
- **Icon**: Lucide React icons, 24px size

### Example Usage
```typescript
<StatusCard
  title="Child Status"
  value="Online"
  subtitle="Emma Johnson"
  status="online"
  icon={User}
/>
```

---

## RecentActivity

**File:** `src/app/components/parent/RecentActivity.tsx`

**Purpose:** Timeline feed component displaying recent activities from multiple sources.

### Props
```typescript
interface RecentActivityProps {
  // Child information
  child: StudentDocument | null;
  
  // Alert data
  alerts: AlertDocument[];
  
  // Optional
  lastLogin?: string;
  loading?: boolean;
}
```

### Activity Types
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

### Activity Sources
1. **Login** - From `students.lastLogin`
   - Color: Blue
   - Icon: LogIn
   - Title: "Last Login"

2. **Location** - From `locations` collection
   - Color: Purple
   - Icon: MapPin
   - Title: "Location Update"

3. **Alert** - From `alerts` collection
   - Color: Yellow
   - Icon: AlertTriangle
   - Title: Alert type

4. **Emergency** - From `emergencies` collection
   - Color: Red
   - Icon: AlertTriangle
   - Title: "Emergency Event"

### Rendering Logic
```typescript
if (loading) {
  // Show activity skeleton loaders (5 items)
}

const activities = [
  ...converted login events,
  ...converted location events,
  ...converted alert events,
  ...converted emergency events
];

// Sort by timestamp (newest first)
// Limit to 50 items
// Display in timeline format

if (activities.length === 0) {
  // Show "No recent activity" message
}
```

### Timeline Structure
```
┌─────────────────────────────────┐
│ Icon | Title                    │
│      | Description              │
│      | Timestamp (relative)     │
├─────────────────────────────────┤
│ Icon | Title                    │
│      | Description              │
│      | Timestamp (relative)     │
└─────────────────────────────────┘
```

---

## QuickActions

**File:** `src/app/components/parent/QuickActions.tsx`

**Purpose:** Button grid component for quick navigation to related pages.

### Props
None (uses useNavigate hook)

### Actions
```typescript
[
  {
    id: 'view-child',
    label: 'View Child Profile',
    description: 'View detailed information',
    icon: User,
    path: '/parent/child',
    color: 'from-blue-600 to-blue-500',
    hoverColor: 'hover:from-blue-700 hover:to-blue-600'
  },
  {
    id: 'live-tracking',
    label: 'Live Tracking',
    description: 'Real-time GPS location',
    icon: MapPin,
    path: '/parent/tracking',
    color: 'from-emerald-600 to-emerald-500',
    hoverColor: 'hover:from-emerald-700 hover:to-emerald-600'
  },
  {
    id: 'emergency-history',
    label: 'Emergency History',
    description: 'View past emergencies',
    icon: AlertTriangle,
    path: '/parent/alerts',
    color: 'from-rose-600 to-rose-500',
    hoverColor: 'hover:from-rose-700 hover:to-rose-600'
  }
]
```

### Button Styling
- **Layout**: Grid (1 column mobile, 3 columns desktop)
- **Background**: Gradient backgrounds per action
- **Hover**: Transform up (`-translate-y-1`), brighter gradient
- **Icon**: 24px, white color
- **Text**: Bold label + light description
- **Arrow**: Appears on hover

### Click Handler
```typescript
onClick={() => navigate(action.path)}
```

---

## Data Structure Examples

### StudentDocument
```typescript
{
  id: string;
  uid: string;
  name: string;
  parentId: string;
  deviceId: string;
  phone: string;
  registrationNumber: string;
  emergencyStatus: 'active' | 'inactive';
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: Timestamp;
  };
}
```

### AlertDocument
```typescript
{
  id: string;
  studentId: string;
  parentId: string;
  type: string;
  message: string;
  timestamp: Timestamp;
  status: 'active' | 'resolved';
}
```

### ParentDocument
```typescript
{
  id: string;
  uid: string;
  name: string;
  email: string;
  role: 'parent';
  createdAt: Timestamp;
}
```

---

## Firebase Queries Used

### DashboardStats
```typescript
// Not used - data passed via props
```

### RecentActivity
```typescript
// Alerts
query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(20))

// Emergencies
query(collection(db, 'emergencies'), orderBy('timestamp', 'desc'), limit(10))

// Locations
query(collection(db, 'locations'), orderBy('timestamp', 'desc'), limit(30))

// Students
query(collection(db, 'students'))
```

### ParentDashboard
```typescript
// Parent
doc(db, 'users', user.id)

// Children
query(collection(db, 'students'), where('parentId', '==', parent.id))

// Alerts
query(collection(db, 'alerts'), where('studentId', 'in', childIds))

// Devices
collection(db, 'devices')

// User Status
collection(db, 'userStatus')
```

---

## Event Handlers

### ParentDashboard
```typescript
// onSnapshot for parent data
// onSnapshot for children data
// onSnapshot for alerts data
// onSnapshot for user status
// onSnapshot for device status

// Cleanup: Unsubscribe all listeners on unmount
```

### RecentActivity
```typescript
// onSnapshot for alerts
// onSnapshot for emergencies
// onSnapshot for locations
// onSnapshot for students

// Data combination and deduplication
// Sort by timestamp (newest first)
```

### QuickActions
```typescript
// onClick handlers for navigation
navigate(action.path)
```

---

## Error Handling

### ParentDashboard
```typescript
// Parent fetch error
catch (err) {
  setError('Failed to load parent data');
  setDashboardLoading(false);
}

// Children fetch error
catch (err) {
  setError('Failed to load child data');
}

// Display error banner with AlertCircle icon
```

### RecentActivity
```typescript
// Errors logged to console
console.error('[RecentActivity]', 'Error fetching alerts:', err);

// Component still renders with available data
```

---

## Performance Considerations

### Optimization Strategies
1. **Query Filtering**: All queries filtered by parentId/studentId
2. **Listener Limits**: `limit()` on queries to prevent fetching too much
3. **Deduplication**: Activity IDs used as keys to prevent duplicates
4. **Cleanup**: All listeners unsubscribed on unmount
5. **Loading States**: Skeleton UI while data loads

### Memory Management
```typescript
// Cleanup functions
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  return () => unsubscribe(); // Important!
}, [deps]);
```

### Data Structure Optimization
```typescript
// Activity deduplication
const uniq = Array.from(
  new Map(combined.map((i) => [i.id, i])).values()
);
```

---

## Testing

### Component Unit Tests
```typescript
// DashboardStats
- Props validation
- Status badge rendering
- Loading state
- Child data display

// StatusCard
- Icon rendering
- Status badge colors
- Value display
- Subtitle rendering

// RecentActivity
- Activity feed rendering
- Sorting by timestamp
- Activity icon display
- Empty state

// QuickActions
- Button rendering
- Click navigation
- Icon display
- Hover effects
```

### Integration Tests
```typescript
// ParentDashboard
- Data fetching from Firebase
- Child component rendering
- Error handling
- Loading state flow
- Real-time updates
```

---

## Troubleshooting

### Component Won't Render
```typescript
// Check:
1. Props are correct
2. Parent has linked children
3. Firebase data exists
4. No console errors
```

### Real-Time Updates Not Working
```typescript
// Check:
1. onSnapshot listener active
2. Firebase permissions allow read
3. Network connection active
4. Document structure matches expected format
```

### Status Badge Wrong Color
```typescript
// Check status prop value matches:
'online' | 'offline' | 'connected' | 'disconnected' 
| 'normal' | 'emergency' | 'available' | 'unavailable'
```

### Activity Not Showing
```typescript
// Check:
1. Document exists in source collection
2. studentId field present
3. Timestamp field present
4. Activity type is one of: login, location, alert, emergency
```

---

## API Changes Log

### Version 1.0.0 (Current)
- ✅ Initial release
- ✅ All 5 components
- ✅ Real-time Firebase integration
- ✅ Loading and error states
- ✅ Responsive design
- ✅ Dark mode support

---

**Last Updated:** June 4, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
