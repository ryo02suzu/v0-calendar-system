# Implementation Notes

## Feature: Global Search Functionality (2025-11-19)

### Overview
Implemented header search bar functionality that filters the Patients list in real-time based on patient name, patient ID (patient_number), or phone number. The implementation uses a CustomEvent-based approach to enable future extensibility to other pages.

### Implementation Details

#### Header Component (`components/header.tsx`)
1. **State Management**
   - Added `searchQuery` state to track current search input (line 24)
   
2. **Event Handler**
   - Implemented `handleSearchChange` handler (lines 138-144) that:
     - Updates local state with the search query
     - Dispatches a `app:global-search` CustomEvent with the query in the detail
     - Includes window undefined check for SSR compatibility
   
3. **UI Binding**
   - Bound the search Input component to:
     - `value={searchQuery}` for controlled component behavior
     - `onChange={handleSearchChange}` for real-time updates
   - Placeholder text in Japanese: "患者名、ID、電話番号で検索..."

4. **Preserved Features**
   - All existing functionality maintained:
     - Notification dropdown with fetch-on-open
     - User menu dropdown
     - Relative time display ("たった今", "X分前", etc.)
     - Click-outside-to-close behavior
     - Mark as read / mark all as read functionality

#### Patient List Component (`components/patient-list.tsx`)
1. **Event Subscription**
   - Added useEffect (lines 46-53) to:
     - Listen for `app:global-search` events
     - Update `searchTerm` state from event detail
     - Cleanup listener on unmount
   
2. **Filtering Logic**
   - Implemented `filteredPatients` with useMemo (lines 117-129) for performance:
     - Helper `norm()`: lowercase and remove all whitespace for flexible name matching
     - Helper `digits()`: extract only numeric characters for phone comparison
     - Filters patients where:
       - **Name** contains query (case-insensitive, whitespace-insensitive)
       - **Patient ID** (patient_number or id fallback) contains query
       - **Phone** contains numeric digits from query (supports partial matches like last 4 digits)
   - Returns all patients when query is empty
   
3. **Rendering**
   - Changed from `patients.map()` to `filteredPatients.map()` (line 188)
   - Updated empty state message to show "該当する患者が見つかりません" when search has no results vs "患者データがありません" when no patients exist

### Technical Approach
- **Client-side only**: No API changes required for first delivery
- **Event-driven**: CustomEvent pattern allows other components to subscribe to search changes without tight coupling
- **Performance**: useMemo ensures filtering only recalculates when patients or searchTerm change
- **Accessibility**: Maintains existing HTML structure and ARIA compatibility

### Testing Scenarios
1. **Name Search**
   - Type "山田" → filters to patients with names containing "山田"
   - Case-insensitive: "yamada" matches "ヤマダ" (if romaji field present)
   - Whitespace-insensitive: "山 田" matches "山田"

2. **ID Search**
   - Type "P001" → filters to patient with patient_number "P001"
   - Falls back to database id if patient_number not set

3. **Phone Search**
   - Type "1234" → filters to patients with phones containing "1234"
   - Type "5678" → matches last 4 digits of "090-1234-5678"
   - Works with partial phone numbers due to digit extraction

4. **Clear Search**
   - Delete all characters → full patient list restored

5. **No Results**
   - Type "ZZZZZ" → shows "該当する患者が見つかりません" message

### Code Quality
- **Minimal changes**: Only added necessary state, handlers, and filtering logic
- **No layout changes**: Preserved all existing className and markup
- **No new dependencies**: Used only React built-ins (useState, useEffect, useMemo)
- **Type safety**: Maintained TypeScript compatibility throughout
- **No side effects**: Existing features (notifications, user menu) unaffected

### Future Extensibility
The `app:global-search` CustomEvent can be subscribed to by:
- Appointment/reservation lists
- Staff management pages
- Medical records search
- Any other component that needs global search functionality

Simply add the same useEffect pattern:
```typescript
useEffect(() => {
  const onGlobal = (event: Event) => {
    const q = (event as CustomEvent<{ query: string }>).detail?.query ?? ""
    setLocalSearchState(q)
  }
  window.addEventListener("app:global-search", onGlobal)
  return () => window.removeEventListener("app:global-search", onGlobal)
}, [])
```

### Related PRs
- PR #22: Initial implementation (merged)
- PRs #1-21: Closed (work recreated in #22)

---

## Bug Fix: Duplicate Service Creation (2025-11-18)

### Issue
The Settings screen had a bug in the "診療メニュー" (services) section where rapidly clicking the 保存 (Save) button inside the dialog executed `handleSaveService()` multiple times. This could create duplicate service records (multiple `createService` calls) or send overlapping update requests.

### Root Cause
The save handler had no re-entry guard, allowing multiple simultaneous API calls when the user clicked the button multiple times in rapid succession.

### Solution
Implemented a re-entry guard pattern for the service save flow:

1. Added `isSavingService` state flag to track ongoing save operations
2. Modified `handleSaveService()` to:
   - Return early if already saving (`if (isSavingService) return`)
   - Set the flag before starting the save operation
   - Reset the flag in the `finally` block to ensure cleanup even on error
3. Updated the Save button in the service dialog to:
   - Be disabled while saving (`disabled={isSavingService}`)
   - Show "保存中..." (Saving...) text during save operation

### Code Changes
- File: `components/settings.tsx`
- Lines changed: Added 1 state variable, modified 1 handler, updated 1 button
- Total impact: ~10 lines added/modified

### Scope
This fix addresses only the service save flow as specified in the requirements. The same pattern can be applied to other sections (staff, holidays, clinic settings) in future tasks.

### Testing
Due to network restrictions in the build environment (Google Fonts access blocked), the changes were verified through:
- Code review and logic analysis
- Git diff inspection to ensure minimal, surgical changes
- Pattern consistency check with similar handlers

### Future Considerations
Other save handlers in the application (staff, holidays, clinic settings) may benefit from similar re-entry guards in future PRs.
