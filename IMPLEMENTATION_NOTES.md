# Implementation Notes

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
