# Goals Module - Daily vs Weekly Cadence Usage Guide

## Quick Start

### Creating a Daily Goal
A daily goal tracks your progress on a per-day basis. Each day is independent, and you can see which days you met your target.

**Example: "Study 30 minutes per day"**
1. Click "+ Make a new goal"
2. Enter goal name: "Daily study"
3. Select metric: "Study time (min)"
4. Select frequency: **"Daily"** ← Key selection
5. Set target: "30"
6. Click "Create"

**Result:** You'll see 7 circular progress indicators (M T W T F S S), each showing that day's progress toward your 30-minute target. If you study 30+ minutes on Monday, that day's circle turns green.

### Creating a Weekly Goal
A weekly goal tracks cumulative progress across the entire week (Monday-Sunday). Perfect for habits you want to spread across multiple days without daily requirements.

**Example: "Play 2 chess games per week"**
1. Click "+ Make a new goal"
2. Enter goal name: "Weekly games"
3. Select metric: "Games"
4. Select frequency: **"Weekly"** ← Key selection
5. Set target: "2"
6. Click "Create"

**Result:** You'll see a large circular progress ring showing your total progress for the week. If you play 1 game on Monday and 1 game on Wednesday, the ring shows 100% (2/2 games). This is more flexible than requiring games every single day.

## Use Case Examples

### Daily Cadence (7-Day Breakdown)
Best for habits you want to maintain **every day**:
- ✅ "Study 30 minutes per day" (consistency)
- ✅ "Solve 5 puzzles per day" (daily habit)
- ✅ "Analyze one game per day" (routine)

**Why Daily?** You want to see your daily consistency at a glance. Missing a day shows up as incomplete on that day's ring.

### Weekly Cadence (Cumulative)
Best for habits you want to hit **across the week**:
- ✅ "Play 4 games per week" (spread across days)
- ✅ "Analyze 10 games per week" (batch activity)
- ✅ "Study 150 minutes per week" (weekly time commitment)

**Why Weekly?** You don't need to hit the target daily. Flexibility to study 75 minutes one day and 75 minutes another day. The view shows total progress for Monday-Sunday.

## Understanding the UI

### Daily Goal View
```
┌─────────────────────────────┐
│ Daily study                 │
│ 30 minutes per day          │
│                             │
│  ◯  ◯  ◯  ◯  ◯  ◯  ◯◯      │  Each circle = one day
│  M  T  W  T  F  S  S        │  (Highlighted = today)
│ 100% 90% 50% 0% 20% 0% 0%  │
└─────────────────────────────┘
```
Today is Sunday (◯◯) - highlighted with background

### Weekly Goal View
```
┌─────────────────────────────┐
│ Weekly games                │
│ 2 games per week            │
│                             │
│        ◯◯◯◯◯                │  Single unified ring
│      ◯       ◯              │  Shows cumulative
│    ◯    70%   ◯             │  progress for week
│  ◯              ◯           │
│  ◯            ◯             │
│    ◯       ◯               │
│      ◯◯◯◯◯                  │
│                             │
│ Weekly Progress: ▰▰▰▱▱▱▱    │ Progress bar
└─────────────────────────────┘
```

## Progress Calculation

### Daily Goal
```
Progress % = (Today's total) / (Daily target) × 100
Example: 20 minutes studied / 30 minute target = 67%
```

Each day is calculated independently. Monday's progress doesn't affect Tuesday.

### Weekly Goal
```
Progress % = (Monday + Tuesday + ... + Sunday total) / (Weekly target) × 100
Example: (1 + 0 + 2 + 0 + 1 + 0 + 0 games) / 2 games = 200% (capped at 100% display)
```

All 7 days' progress is combined into one total.

## Color Coding

Both daily and weekly goals use the same color scheme:
- **Blue** (◯): Goal in progress (0-99%)
- **Green** (◯): Goal achieved (100%+)

## Logging Sessions

When you log a study session, it automatically:
1. **For daily goals:** Updates that day's progress ring
2. **For weekly goals:** Updates the cumulative weekly progress

**Example:**
- Time: 30 minutes
- Puzzles: 5 solved
- Games: 1 played
- Date: Monday

If you have:
- Daily goal: "30 min/day" → Monday ring shows 100%
- Daily goal: "5 puzzles/day" → Monday ring shows 100%
- Daily goal: "1 game/day" → Monday ring shows 100%
- Weekly goal: "150 min/week" → Weekly ring shows 20% (30/150)
- Weekly goal: "30 puzzles/week" → Weekly ring shows 17% (5/30)
- Weekly goal: "3 games/week" → Weekly ring shows 33% (1/3)

All goals update automatically from that one session!

## Tips & Tricks

1. **Mix Cadences:** You can have both daily and weekly goals for the same metric
   - Daily: "30 min study per day" (high frequency)
   - Weekly: "300 min study per week" (fallback, less restrictive)

2. **Metric Types Work with Both:**
   - Time: "60 min/day" or "300 min/week"
   - Puzzles: "10 puzzles/day" or "50 puzzles/week"
   - Games: "2 games/day" or "10 games/week"

3. **Weekly Goals for Flexibility:**
   - Don't punish yourself for missing one day
   - Allows "weekend warrior" studying (lots on weekends)
   - Perfect for busy professionals

4. **Daily Goals for Accountability:**
   - Clear visual of which days you were consistent
   - Identify patterns (e.g., always miss Wednesdays?)
   - Great for building streaks

## Frequently Asked Questions

**Q: Can I change a goal from daily to weekly?**
A: Current implementation doesn't support editing cadence. You can delete the goal and recreate it with the new cadence.

**Q: What happens if I don't log anything on a day?**
A: 
- Daily goal: That day's ring shows 0%
- Weekly goal: That day contributes 0 to the weekly total

**Q: Does the week reset automatically?**
A: Yes, each Monday the weekly goals reset. Weekly progress is always calculated for the current week (Monday-Sunday).

**Q: Can I see past weeks?**
A: Currently, only the current week is displayed. Historical tracking is a future enhancement.

**Q: What if I log a session on Sunday evening for the next week?**
A: Sessions are tracked by the date/time they're created. If you log on Sunday for "this week", it counts toward this week. Backdating requires future feature enhancement.

## Next Steps

Try creating one of each:
1. A **daily goal** for something you want to do every day
2. A **weekly goal** for something you want to spread across the week

Observe how the progress rings update differently as you log your study sessions throughout the week!
