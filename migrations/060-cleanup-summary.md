# League Player Cleanup - Summary

## Problem Identified

When creating a new league/season, all players from previous leagues were automatically added to the new league, causing the standings to show many players with "0 legs" and dashes who weren't actually participating.

This was caused by **two separate issues**:

### Issue 1: First Leg Auto-Population
When creating the first leg of a new season, the system automatically added ALL players from the store to that leg.

### Issue 2: Standings Display Logic
The standings pages loaded ALL players from the store and displayed them, even if they had no results in the current season.

## Solutions Implemented

### Fix 1: Empty First Leg (Code Change)
**File**: `mtgleague/src/app/to/legs/[legId]/results/page.tsx`

Changed the logic so that the first leg of a new season starts with an **empty player list**. Tournament Organizers must manually add only the players who actually participated.

**Behavior now**:
- First leg of new season: Empty list, manually add participants
- Subsequent legs: Automatically shows players from previous legs in that season

### Fix 2: Standings Only Show Active Players (Code Changes)
**Files Updated**:
- `mtgleague/src/app/to/legs/page.tsx`
- `mtgleague/src/app/store/[id]/page.tsx`
- `mtgleague/src/app/public/season/[seasonId]/standings/page.tsx`
- `mtgleague/src/app/to/seasons/[seasonId]/top8/page.tsx`

Changed the standings calculation logic to only initialize and display players who actually have leg results in the current season.

**Before**: Loaded all store players → initialized all with 0 points → displayed all
**After**: Only initialize players who have results → only display active participants

## Database Cleanup Scripts

### Script 1: Diagnostic (`058-diagnose-winter-spring-league.sql`)
Run this to see:
- Season information
- All legs in the season
- Round 1 participants
- All players currently in the season
- Which players should be removed

### Script 2: Simple Cleanup (`059-cleanup-winter-spring-2026-simple.sql`)
Three-step process:
1. Preview which records will be deleted
2. Uncomment and run the DELETE statement
3. Uncomment and run the verification query

**What it does**: Removes all leg_results for players who didn't participate in round 1 of the "EH Pauper League Winter - Spring 2026" season.

## Important Notes

1. **Players with "0 legs" in the UI** were never actually in the database for that season - they were just being displayed because the UI showed all store players.

2. **The cleanup script** only removes players who have some results but didn't play in round 1. It won't affect the UI display of players with "0 legs" - that's fixed by the code changes.

3. **Going forward**, new seasons will start clean and only show players who actually participate.

## Testing

After deploying these changes:
1. Create a new test season
2. Create the first leg
3. Verify it starts with an empty player list
4. Add only the players who participated
5. Save results
6. Check standings - should only show those players
7. Create leg 2 - should auto-populate with leg 1 players
