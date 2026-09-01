# Goals Module - Daily & Weekly Cadence Implementation

## Overview
This document details the comprehensive update to the Goals module to support both 'daily' and 'weekly' goal cadences, allowing users to track habits across different timeframes.

## Changes Made

### 1. Database Schema Update (`supabase_migrations.sql`)
**New Migration:**
```sql
ALTER TABLE goals ADD COLUMN cadence TEXT NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily', 'weekly'));
```

**Details:**
- Added `cadence` field to the `goals` table with two valid values: 'daily' or 'weekly'
- Default value is 'daily' for backward compatibility with existing goals
- CHECK constraint ensures only valid cadence values are stored

### 2. Type Definitions (`src/components/Goals.tsx`)

**New Type Export:**
```typescript
export type GoalCadence = 'daily' | 'weekly';
```

**Updated Goal Interface:**
```typescript
export interface Goal {
  id: string;
  userId: string;
  title: string;
  metricType: GoalMetricType;
  cadence: GoalCadence;  // NEW: frequency type
  targetNumber: number;
  createdAt: string;
  archivedAt: string | null;
}
```

### 3. Enhanced Metric Label Formatting

**Updated Function Signature:**
```typescript
function formatMetricLabel(type: GoalMetricType, cadence: GoalCadence): string
```

**Behavior:**
- Dynamically generates labels based on both metric type AND cadence
- Examples:
  - Daily time goal: "30 minutes per day"
  - Weekly time goal: "120 minutes per week"
  - Daily puzzles: "5 puzzles per day"
  - Weekly puzzles: "30 puzzles per week"

### 4. New Component: `WeeklyProgressCard`

**Purpose:** Unified progress visualization for weekly goals

**Features:**
- Large circular progress ring showing cumulative weekly progress
- Complementary horizontal progress bar for easy percentage reading
- Dynamic color change (blue to green) when goal is achieved (≥100%)
- "This week" label for context
- Responsive design that works on all screen sizes

**Props:**
```typescript
interface {
  weeklyProgress: number;  // Percentage (0-100+)
}
```

**Visual Elements:**
- 160x160 SVG circular progress ring with stroked path
- Accompanying progress bar showing same percentage
- Center text displaying percentage and "This week" label

### 5. Updated `NewGoalForm` Component

**New Features:**
- Added "Frequency" selector alongside metric selection
- Toggle between "Daily" and "Weekly" options
- Dynamic label that updates to reflect chosen frequency
- Compact two-column layout for metric and frequency selection

**Form Fields:**
1. Goal name (text input)
2. Metric (select: Study time, Puzzles, Games)
3. **Frequency (NEW)** (select: Daily, Weekly)
4. Target (number input with dynamic label)

**Example:**
- User selects "Weekly" frequency
- Label changes from "Daily target" to "Target (per week)"
- User can set weekly targets like "120 minutes per week" or "30 puzzles per week"

### 6. Enhanced `GoalCard` Component

**Updated Rendering Logic:**
- Conditionally displays different UI based on goal cadence
- **Daily Goals:** Shows 7-day individual progress rings (Monday-Sunday)
  - Each day has its own circular progress indicator
  - Today's ring is highlighted with background
  - Progress shows daily target achievement
  
- **Weekly Goals:** Shows unified weekly progress card
  - Large circular ring with cumulative weekly progress
  - Progress bar representation
  - Single view of Monday-Sunday combined achievement

**Conditional UI:**
```tsx
{goal.cadence === 'daily' && (
  <div className="flex justify-between gap-1 sm:gap-4">
    {/* 7 individual ProgressRing components */}
  </div>
)}

{goal.cadence === 'weekly' && (
  <WeeklyProgressCard weeklyProgress={weeklyProgress[0]} />
)}
```

### 7. Smart Progress Calculation Logic

**Updated `calculateWeeklyProgress()` Function:**

**For Daily Goals:**
- Returns array of 7 numbers (one per day of week)
- Each value represents daily progress percentage (0-100)
- Aggregates all sessions from that specific day
- Used to render individual day circles

**For Weekly Goals:**
- Returns array with single number
- Represents cumulative progress for entire week (Monday-Sunday)
- Aggregates all sessions across all 7 days
- Compared against weekly target

**Calculation Process:**
```
Daily: dayTotal / goal.targetNumber * 100
Weekly: weekTotal / goal.targetNumber * 100
```

**Session Aggregation:**
- Filters sessions by date range
- Sums appropriate metric based on goal type:
  - **time:** `durationMinutes`
  - **puzzles:** `puzzlesSolved`
  - **games:** `gamesPlayed`

### 8. Updated Data Fetching

**Modified `fetchGoals()` Function:**
- Now selects the `cadence` field from database
- Maps cadence to Goal interface with type safety
- Falls back to 'daily' for backward compatibility if cadence is null

**Query:**
```typescript
.select('id, user_id, title, metric_type, cadence, target_number, created_at, archived_at')
```

## User Experience

### Creating a Goal
1. User clicks "Make a new goal"
2. Form displays:
   - Goal name field
   - Metric selector (time, puzzles, games)
   - **Frequency selector (NEW)** (daily or weekly)
   - Target input with dynamic label
3. User selects frequency type
4. Target label updates to reflect "per day" or "per week"
5. User sets appropriate target (e.g., 30 min/day vs 120 min/week)
6. Goal is created with cadence stored in database

### Viewing Daily Goals
- User sees 7 small circular progress indicators (M T W T F S S)
- Each circle shows that day's progress against daily target
- Today's circle is highlighted
- Easy to spot which days were productive

### Viewing Weekly Goals
- User sees large circular progress indicator
- Shows cumulative progress for the entire week
- Accompanied by progress bar for clarity
- Single unified view of weekly achievement
- Visual feedback when weekly goal is met (green fill)

## Backward Compatibility

- **Default Value:** New goals created before cadence field existed default to 'daily'
- **Existing Goals:** All existing goals maintain current behavior (daily tracking)
- **Database:** Migration adds NOT NULL constraint with DEFAULT 'daily'
- **UI:** Forms default to 'daily' when creating new goals

## Technical Implementation Details

### Progress Calculation Window
- **Week Definition:** Monday (start) through Sunday (end)
- **Current Week:** Automatically calculated from today's date
- Day of week conversion: `getDay() === 0 ? 6 : getDay() - 1` (converts Sunday=0 to 6)

### Metric Type Support
All three metric types work seamlessly with both cadences:
- **Time (minutes):** Daily goal (e.g., 30 min/day) or Weekly goal (e.g., 150 min/week)
- **Puzzles:** Daily target (e.g., 5/day) or Weekly target (e.g., 35/week)
- **Games:** Daily target (e.g., 2/day) or Weekly target (e.g., 14/week)

### Progress Display Rules
- Progress capped at 100% for visual consistency
- Colors:
  - **Active (< 100%):** Blue (#60a5fa)
  - **Complete (≥ 100%):** Green (#10b981)
- Smooth CSS transitions for progress changes

## Files Modified

1. **`supabase_migrations.sql`**
   - Added cadence field migration

2. **`src/components/Goals.tsx`**
   - Added `GoalCadence` type export
   - Updated `Goal` interface
   - Updated `formatMetricLabel()` function
   - Added `WeeklyProgressCard` component
   - Updated `NewGoalForm` component
   - Updated `GoalCard` component rendering logic
   - Enhanced `calculateWeeklyProgress()` function
   - Updated `fetchGoals()` function

## Testing Recommendations

1. **Create Daily Goal:**
   - Verify 7-day ring display
   - Log sessions on different days
   - Confirm individual day progress updates

2. **Create Weekly Goal:**
   - Verify single progress ring display
   - Log sessions across multiple days
   - Confirm cumulative progress updates correctly

3. **Progress Calculation:**
   - Log sessions with different metric types
   - Verify daily goals: each day calculated independently
   - Verify weekly goals: aggregates entire week

4. **UI Responsiveness:**
   - Test on mobile (small screens)
   - Test on desktop (large screens)
   - Verify all elements scale appropriately

5. **Edge Cases:**
   - Goal created mid-week
   - Week spanning month boundaries
   - No sessions in a week/day
   - Sessions logged with 0 metrics

## Future Enhancements

Potential future improvements:
- Weekly recurrence starting on custom days (not Monday)
- Monthly goal cadences
- Multiple goals per metric type
- Goal history/archive with statistics
- Streak tracking for daily goals
- Visual progress over multiple weeks
- Goal completion notifications

## API Integration Points

- **Supabase `goals` table:** Now includes `cadence` column
- **Study session creation:** Continues to work as before
- **Progress calculation:** Automatically handles both cadence types based on stored value
- **Goal queries:** Filter and retrieve cadence information alongside other goal data

## Notes

- The implementation maintains full backward compatibility
- All existing goals default to 'daily' behavior
- Weekly goals aggregate sessions more flexibly (no daily requirements)
- Progress calculations are performed client-side based on local session data
- Future optimization could cache calculated progress server-side
