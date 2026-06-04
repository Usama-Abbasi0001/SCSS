# Parent Dashboard - Quick Reference Guide

## 🚀 Quick Start

### Components Overview

#### 1. **ParentDashboard.tsx** (Main Page)
- **Location:** `src/app/pages/parent/ParentDashboard.tsx`
- **Purpose:** Main dashboard page that orchestrates all components
- **Key Features:**
  - Fetches parent data from Firebase
  - Links children to parent
  - Aggregates all child data
  - Handles real-time updates

#### 2. **DashboardStats.tsx**
- **Location:** `src/app/components/parent/DashboardStats.tsx`
- **Purpose:** Displays 6 status cards with real-time data
- **Props:**
  ```typescript
  child: StudentDocument | null
  totalAlerts: number
  childIsOnline: boolean
  deviceStatus: 'connected' | 'disconnected'
  lastLocationUpdate: string
  emergencyActive: boolean
  loading?: boolean
  ```

#### 3. **StatusCard.tsx**
- **Location:** `src/app/components/parent/StatusCard.tsx`
- **Purpose:** Individual status card component
- **Status Types:**
  - `online` / `offline` → Green / Red
  - `connected` / `disconnected` → Green / Red
  - `normal` / `emergency` → Green / Red
  - `available` / `unavailable` → Green / Red

#### 4. **RecentActivity.tsx**
- **Location:** `src/app/components/parent/RecentActivity.tsx`
- **Purpose:** Activity timeline feed
- **Activity Types:**
  - Login - Student login events
  - Location - GPS updates
  - Alert - Alert notifications
  - Emergency - Emergency events

#### 5. **QuickActions.tsx**
- **Location:** `src/app/components/parent/QuickActions.tsx`
- **Purpose:** Navigation quick action buttons
- **Actions:**
  1. View Child Profile → `/parent/child`
  2. Live Tracking → `/parent/tracking`
  3. Emergency History → `/parent/alerts`

---

## 📊 Firebase Collections Required

```javascript
// 1. users collection
{
  id: "parent-uid",
  uid: "parent-uid",
  name: "Parent Name",
  email: "parent@email.com",
  role: "parent",
  createdAt: timestamp
}

// 2. students collection
{
  id: "student-id",
  uid: "student-uid",
  name: "Student Name",
  parentId: "parent-uid", // IMPORTANT: Link to parent
  deviceId: "device-id",
  phone: "123456789",
  registrationNumber: "REG001",
  emergencyStatus: "inactive",
  lastLocation: {
    lat: 40.7128,
    lng: -74.0060,
    timestamp: timestamp
  }
}

// 3. devices collection
{
  id: "device-id",
  studentId: "student-uid",
  status: "connected", // or "disconnected"
  lastPing: timestamp,
  batteryLevel: 85
}

// 4. locations collection
{
  id: "location-id",
  studentId: "student-uid",
  lat: 40.7128,
  lng: -74.0060,
  timestamp: timestamp,
  accuracy: 10
}

// 5. alerts collection
{
  id: "alert-id",
  studentId: "student-uid",
  parentId: "parent-uid",
  type: "intrusion", // or other types
  message: "Unauthorized zone entry detected",
  timestamp: timestamp,
  status: "active" // or "resolved"
}

// 6. emergencies collection
{
  id: "emergency-id",
  studentId: "student-uid",
  parentId: "parent-uid",
  details: "Emergency button activated",
  timestamp: timestamp
}

// 7. userStatus collection
{
  id: "user-uid",
  isOnline: true,
  status: "active",
  lastActive: timestamp
}
```

---

## 🔄 Data Flow Diagram

```
ParentDashboard
    │
    ├─ Fetch Parent from users collection
    │  └─ Set parent state
    │
    ├─ Fetch Students linked to parent
    │  └─ Query: students where parentId == parent.id
    │
    ├─ Fetch Alerts for all children
    │  └─ Query: alerts where studentId in [childIds]
    │
    ├─ Fetch Device Status
    │  └─ Listen to devices collection
    │
    ├─ Fetch User Status (online/offline)
    │  └─ Listen to userStatus collection
    │
    └─ Pass aggregated data to components
       ├─ DashboardStats (status cards)
       ├─ RecentActivity (activity timeline)
       └─ QuickActions (navigation buttons)
```

---

## 🎯 Key Implementation Details

### Real-Time Updates
```typescript
// Using Firebase onSnapshot for real-time listeners
const unsubscribe = onSnapshot(
  query(collection(db, 'alerts')),
  (snapshot) => {
    // Handle data updates
  },
  (error) => {
    // Handle errors
  }
);

// Clean up on unmount
return () => unsubscribe();
```

### Parent-Child Link
```typescript
// ParentDashboard queries students by parentId
const childrenQuery = query(
  collection(db, 'students'),
  where('parentId', '==', parent.id)
);
```

### Activity Aggregation
```typescript
// RecentActivity combines data from multiple sources
- alerts collection → Alert activities
- emergencies collection → Emergency activities
- locations collection → Location activities
- students collection → Login activities

// Deduplication and sorting
const uniq = Array.from(
  new Map(combined.map((i) => [i.id, i])).values()
);
const sorted = uniq.sort(
  (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
);
```

---

## ✅ Status Card Variants

### Child Status Card
```typescript
{
  title: "Child Status",
  value: "1 Online / 0 Offline",
  status: "online", // Green badge
  icon: User
}
```

### Location Card
```typescript
{
  title: "Current Location Status",
  value: "Location Available",
  status: "available", // Green badge
  icon: MapPin
}
```

### Alerts Card
```typescript
{
  title: "Total Alerts Received",
  value: 5,
  icon: AlertCircle
}
```

### Last Update Card
```typescript
{
  title: "Last Location Update",
  value: "2024-06-04 14:30:00",
  icon: Clock
}
```

### Device Card
```typescript
{
  title: "Device Status",
  value: "1 Connected / 0 Disconnected",
  status: "connected", // Green badge
  icon: Smartphone
}
```

### Emergency Card
```typescript
{
  title: "Emergency Status",
  value: "Normal",
  status: "normal", // Green badge
  icon: AlertTriangle
}
```

---

## 🎨 Styling & Tailwind Classes

### Cards
```tailwind
bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg
```

### Status Badges
```tailwind
inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300
```

### Buttons
```tailwind
group relative rounded-2xl bg-gradient-to-br p-6 shadow-lg
transform hover:-translate-y-1 transition-all duration-300
```

### Icons
```tailwind
w-6 h-6 text-slate-400 group-hover:text-white transition-colors
```

---

## 🔧 Customization Guide

### Add New Status Card
```typescript
<StatusCard
  title="Custom Status"
  value="Status Value"
  status="online" // or other status types
  icon={CustomIcon}
/>
```

### Change Card Colors
Update the `getStatusStyles()` function in `StatusCard.tsx`:
```typescript
case 'online':
  return {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    label: 'Online'
  };
```

### Add New Activity Type
In `RecentActivity.tsx`:
```typescript
const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'custom':
      return <CustomIcon className="w-4 h-4" />;
    // ...
  }
};
```

### Add New Quick Action
In `QuickActions.tsx`:
```typescript
{
  id: 'new-action',
  label: 'New Action',
  icon: NewIcon,
  description: 'Action description',
  path: '/parent/new-route',
  color: 'from-color-600 to-color-500',
  hoverColor: 'hover:from-color-700 hover:to-color-600'
}
```

---

## 🐛 Debugging Tips

### Check Console Logs
```typescript
console.log('[ParentDashboard]', { parent, children, alerts });
```

### Verify Firebase Data
1. Go to Firebase Console
2. Check collections: `users`, `students`, `alerts`, `devices`, etc.
3. Verify document IDs and fields match

### Test Real-Time Updates
1. Open dashboard in browser
2. Add new document in Firebase Console
3. Watch activity feed update in real-time

### Check Network
1. Open DevTools → Network tab
2. Look for Firestore requests
3. Check for errors in console

---

## 📈 Performance Optimizations

### Query Optimization
```typescript
// ✅ Good: Filtered query
query(collection(db, 'alerts'), where('studentId', 'in', childIds))

// ❌ Bad: Unfiltered query
query(collection(db, 'alerts')) // Fetches all alerts
```

### Subscription Cleanup
```typescript
// ✅ Good: Unsubscribe on unmount
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  return () => unsubscribe();
}, [deps]);

// ❌ Bad: No cleanup
useEffect(() => {
  onSnapshot(...); // Memory leak!
}, [deps]);
```

### Component Memoization
```typescript
// Consider using React.memo for StatusCard
export default React.memo(function StatusCard({ ... }) {
  // Component
});
```

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Dashboard loads without errors
- [ ] Real-time updates work
- [ ] Status cards show correct data
- [ ] Activity feed displays all items
- [ ] Quick action buttons navigate correctly

### UI/UX Testing
- [ ] Mobile layout responsive
- [ ] Tablet layout works
- [ ] Desktop layout centered
- [ ] Dark mode toggles correctly
- [ ] Hover effects work smoothly

### Data Testing
- [ ] Parent data loads correctly
- [ ] Children data filters by parentId
- [ ] Alerts count is accurate
- [ ] Timestamps display correctly
- [ ] Status badges show right colors

### Error Testing
- [ ] No parent record message appears
- [ ] No children message appears
- [ ] Network error handled gracefully
- [ ] Firebase permission errors shown
- [ ] Loading states appear/disappear

---

## 🚨 Common Errors & Fixes

### "No parent record found"
```typescript
// Cause: Parent document missing in users collection
// Fix: Create parent document with parentId field
db.collection('users').doc(uid).set({
  uid: uid,
  name: "Parent Name",
  role: "parent",
  ...
});
```

### "No linked student record"
```typescript
// Cause: No students with matching parentId
// Fix: Create student document with parentId field
db.collection('students').add({
  parentId: parentUid, // Must match parent UID
  name: "Child Name",
  ...
});
```

### Real-time updates not working
```typescript
// Cause: Firebase listener error or permissions
// Check:
1. Is onSnapshot listener active?
2. Are Firestore rules allowing read?
3. Is network connection active?
4. Are you unsubscribing on unmount?
```

---

## 📚 File Locations

```
src/app/
├── pages/
│   └── parent/
│       └── ParentDashboard.tsx (Main page)
├── components/
│   └── parent/
│       ├── DashboardStats.tsx
│       ├── StatusCard.tsx
│       ├── RecentActivity.tsx
│       └── QuickActions.tsx
├── context/
│   └── AuthContext.tsx (Auth management)
├── types/
│   └── firestore.ts (TypeScript interfaces)
└── utils/
    └── adminAuth.ts (Auth utilities)
```

---

## 🎓 Learning Resources

### Firebase Documentation
- [Firestore Realtime Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firestore Collections](https://firebase.google.com/docs/firestore/data-model)

### React Documentation
- [useEffect Hook](https://react.dev/reference/react/useEffect)
- [useState Hook](https://react.dev/reference/react/useState)
- [Component Composition](https://react.dev/learn/thinking-in-react)

### Tailwind CSS
- [Color Reference](https://tailwindcss.com/docs/customizing-colors)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

## 💡 Best Practices

### Code Organization
✅ Keep components small and focused  
✅ Separate data fetching from UI  
✅ Use proper TypeScript types  
✅ Comment complex logic  

### Firebase Usage
✅ Always unsubscribe on unmount  
✅ Filter queries by user/parent ID  
✅ Handle errors gracefully  
✅ Limit query results  

### Performance
✅ Use React.memo for expensive components  
✅ Avoid prop drilling  
✅ Optimize re-renders  
✅ Clean up listeners  

### Security
✅ Check user role before rendering  
✅ Never expose sensitive data in logs  
✅ Validate all user input  
✅ Use Firebase security rules  

---

## 📞 Need Help?

### Check Documentation
- Read `PARENT_DASHBOARD_DOCUMENTATION.md` for detailed info
- Review `PARENT_DASHBOARD_SUMMARY.md` for overview

### Debug Steps
1. Check browser console for errors
2. Verify Firebase data in console
3. Check network tab for failures
4. Review component props
5. Check real-time listener logs

### Common Solutions
- Ensure parent has linked children
- Verify Firestore collection structure
- Check Firebase security rules
- Test network connectivity

---

**Version:** 1.0.0  
**Last Updated:** June 4, 2026  
**Status:** Production Ready ✅
