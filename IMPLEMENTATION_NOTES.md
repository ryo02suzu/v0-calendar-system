# Implementation Notes

## Bug Fix: Duplicate Service Creation (2025-11-18)

### Issue
The Settings screen had a bug in the "診療メニュー" (services) section where rapidly clicking the 保存 (Save) button inside the dialog executed `handleSaveService()` multiple times. This could create duplicate service records (multiple `createService` calls) or send overlapping update requests.

### Root Cause
The save handler had no re-entry guard, allowing multiple simultaneous API calls when the user clicked the button multiple times in rapid succession.

### Solution
Implemented a re-entry guard pattern:

1. Added `isSavingService` state flag to track ongoing save operations
2. Modified `handleSaveService()` to:
   - Return early if already saving (`if (isSavingService) return`)
   - Set the flag before starting the save operation
   - Reset the flag in the `finally` block to ensure cleanup even on error
3. Updated the Save button to:
   - Be disabled while saving (`disabled={isSavingService}`)
   - Show "保存中..." (Saving...) text during save operation

The same pattern was applied to `handleSaveStaff()` for consistency.

### Code Changes
- File: `components/settings.tsx`
- Lines changed: Added 2 state variables, modified 2 handlers, updated 2 buttons
- Total impact: ~16 lines added/modified

### Testing
Due to network restrictions in the build environment (Google Fonts access blocked), the changes were verified through:
- Code review and logic analysis
- Git diff inspection to ensure minimal, surgical changes
- Pattern consistency check with similar handlers

### Future Considerations
Other save handlers in the application may benefit from similar re-entry guards if they don't already have them.
