# MtgLeague Product Requirements Document

## Project Status Summary

### ✅ COMPLETED FEATURES

#### User Management & Authentication
- ✅ Admin user creation and role management
- ✅ Tournament Organizer (TO) role assignment
- ✅ Secure invitation system with email integration (Resend.com)
- ✅ Role-based access control (admin vs TO permissions)
- ✅ User profile management
- ✅ Password reset functionality

#### Store Management
- ✅ Store profiles with name, address, logo, and CMS details
- ✅ TO assignment to specific stores
- ✅ Store selection for anonymous users
- ✅ Store browsing and selection interface

#### League Management
- ✅ Season creation with configurable parameters (total legs, best legs count)
- ✅ Leg management within seasons
- ✅ Automatic round number calculation
- ✅ Leg status tracking (scheduled, in_progress, completed)
- ✅ **Season completion management** - Mark seasons as completed
- ✅ **Season status tracking** - Active vs completed season states

#### Player Management
- ✅ Player profiles with name and store association
- ✅ Player visibility settings (public/private) - database only
- ✅ Quick add players during leg results entry
- ✅ Player deletion functionality (hard delete)
- ✅ **Soft delete functionality** - replace name with "Deleted Player" instead of hard delete
- ✅ **Player visibility UI controls** - checkbox to toggle public/private visibility
- ✅ **Anonymous display logic** - show "Anonymous" for private players on public pages
- ✅ **Enhanced soft delete** - player name physically changed to "Deleted Player" in database
- ✅ **No private data retention** - deleted players have generic names and public visibility
- ✅ **Results preservation** - deleted players' results remain visible in all standings
- ✅ **Restore with new name** - restored players get a new name since original is not stored

#### Results Tracking
- ✅ Match results entry for each leg
- ✅ Participation tracking (participated boolean for tiebreakers)
- ✅ Automatic points calculation
- ✅ Best N results calculation for standings
- ✅ Leg results with wins, draws, losses, points
- ✅ **Best N results highlighting** - Visual indication of which legs count toward total score

#### Database & Security
- ✅ Complete database schema with all tables
- ✅ Row Level Security (RLS) policies for data access
- ✅ Secure database functions for complex operations
- ✅ Transaction-based operations for data integrity
- ✅ Proper indexing for performance

#### Public Store Pages
- ✅ Store information display
- ✅ Active seasons display in individual containers
- ✅ Current standings with player names, points, and match records
- ✅ Leg-by-leg breakdown showing individual scores
- ✅ Best leg results highlighting
- ✅ Responsive design with dark/light mode support
- ✅ **Past seasons viewing** - "Find a past season" collapsible section
- ✅ **Historical standings access** - Links to public season standings pages
- ✅ **Public season standings page** - Dedicated page for viewing completed season results
- ✅ **Anonymous user support** - Full functionality without authentication

#### Tournament Features
- ✅ **Top 8 tournament system** - Complete tournament bracket management
- ✅ **Tournament creation** - Automatic Top 8 creation from season standings
- ✅ **Manual Top 8 bracket management** - TOs have full manual control over player selection and result entry for all rounds
- ✅ **Top 8 reset feature** - TOs can reset the Top 8, clearing all players/results and re-activating the season
- ✅ **Top 8 delete feature** - TOs can delete the Top 8 if needed
- ✅ **Bracket display for all** - Top 8 bracket is shown on both TO and public/anonymous season views
- ✅ **Tournament bracket management** - Manual player advancement between rounds
- ✅ **Tournament match results** - Match result entry and winner tracking
- ✅ **Tournament standings** - Complete bracket display with results
- ✅ **Tournament completion** - Mark tournaments as completed
- ✅ **Public tournament viewing** - Anonymous access to tournament brackets
- ✅ **Professional bracket layout** - Clean, organized tournament bracket display

#### TO Dashboard
- ✅ TO-specific dashboard with sidebar navigation
- ✅ Season management interface
- ✅ Leg management interface
- ✅ Results entry interface with live calculations
- ✅ Player management interface
- ✅ Quick add player functionality
- ✅ **Top 8 tournament management** - Create and manage tournament brackets
- ✅ **Tournament result entry** - Enter match results and advance players
- ✅ **Tournament completion** - Mark tournaments as completed

#### Admin Dashboard
- ✅ User management interface
- ✅ Store assignment management
- ✅ Invitation system management
- ✅ Role management (promote/demote users)

### 🔄 IN PROGRESS / PARTIALLY COMPLETE

#### Required Features
- ⚠️ Tiebreaker calculations (need to determine method)
- ⚠️ Data validation (win + draw + loss consistency per leg)
- ⚠️ Mobile optimization
- ⚠️ Store CMS and announcements

#### Note: Most "Advanced Features" are actually complete
- ✅ **Advanced standings algorithms** - Best N results calculation is fully implemented
- ✅ **Season statistics** - Basic standings and participation tracking is complete
- ✅ **Player performance tracking** - Results tracking and standings are fully functional

### ❌ NOT YET IMPLEMENTED

#### Required Features
- ❌ Tiebreaker calculations (need to determine method)
- ❌ Data validation (win + draw + loss consistency per leg)
- ❌ Mobile optimization
- ❌ Store CMS and announcements

#### Optional Features (Not Required)
- ❌ Export functionality (CSV, PDF)
- ❌ Advanced search and filtering
- ❌ Email notifications
- ❌ Real-time updates
- ❌ API endpoints for external integrations
- ❌ Webhook system
- ❌ Third-party tournament software integration

## Store Details Page Layout (Updated)

### Page Structure
The store details page displays information in the following order:

1. **Store Information Section**
   - Store name, address, and logo
   - Store description/details
   - Change store button

2. **Active Seasons Section**
   - Each active season displayed in its own container
   - Season name and status
   - Current standings grid showing:
     - Player names
     - Total points (calculated from best N results)
     - Match records (W/D/L from best N results)
     - Leg participation
     - Best leg results highlighting (green background)
   - Season details (total legs, best legs count, etc.)

3. **Past Seasons Section**
   - "Find a past season" collapsible section
   - List of completed seasons with completion dates
   - "View Standings" buttons linking to public season pages

### Public Season Standings Page
- **Dedicated URL**: `/public/season/[seasonId]/standings`
- **Anonymous access**: No authentication required
- **Complete standings**: Final season standings with best N results
- **Top 8 bracket**: Tournament bracket display for completed tournaments
- **Navigation**: "Back to Store" button for easy navigation
- **Responsive design**: Works on all devices

### Design Requirements
- Clean, modern UI with proper spacing between sections
- Responsive design for mobile and desktop
- Dark/light mode support
- Clear visual hierarchy with proper headings
- Consistent styling with the rest of the application
- Best N results highlighting with green background
- Professional tournament bracket layout

## Technical Requirements

### Database Schema
- **Stores**: Store information and metadata
- **Users**: User accounts with role-based permissions
- **Players**: Player profiles linked to stores
- **Seasons**: League seasons with configurable parameters
- **Legs**: Individual tournament legs within seasons
- **Leg Results**: Match results and participation tracking
- **Store TOs**: Many-to-many relationship between stores and TOs
- **Top8s**: Tournament instances linked to seasons
- **Top8 Matches**: Individual tournament matches with results

### Security
- Row Level Security (RLS) policies for data access
- Role-based permissions for all operations
- Secure invitation system with token validation
- Protected admin operations
- Anonymous access to public pages

### Performance
- Efficient queries for standings calculations
- Proper indexing for fast data retrieval
- Optimized loading of season data
- Transaction-based tournament operations

## User Flows

### Anonymous User Flow
1. Visit homepage
2. Select a store from the list
3. View store information and current standings
4. Browse active seasons and their standings
5. Access past seasons via "Find a past season" section
6. View complete season results on public standings pages
7. View tournament brackets for completed seasons

### TO Flow
1. Sign in with invited account
2. Access TO dashboard
3. Manage seasons and legs
4. Enter match results
5. View current standings
6. Create Top 8 tournaments from completed seasons
7. Manage tournament brackets and results
8. Complete tournaments

### Admin Flow
1. Sign in with admin account
2. Manage users and roles
3. Assign TOs to stores
4. Oversee all system operations

## Success Metrics
- User engagement with store pages
- TO adoption and usage
- Data accuracy in standings
- System performance and reliability
- Tournament participation and completion rates

## Next Priority Items

### REQUIRED FEATURES
1. **Tiebreaker Calculations** - Implement tiebreaker logic for standings (method TBD)
2. **Data Validation** - Validate win + draw + loss consistency per leg
3. **Mobile Optimization** - Improve mobile experience and responsiveness
4. **Store CMS and Announcements** - Allow stores to post announcements and manage content

### COMPLETED FEATURES
- ✅ **Google OAuth Login for TOs** - Fully implemented and working
- ✅ **Store Finder** - Implemented (requires Google Maps API key configuration)
- ✅ **Leg Result Entry and Management** - Fully implemented
- ✅ **Top 8 Tournament Management** - Fully implemented
- ✅ **Season Standings and Leaderboards** - Fully implemented
- ✅ **All Core League Management Features** - Complete

### NOT REQUIRED (Removed from scope)
- Export functionality (CSV, PDF)
- Email notifications
- Real-time updates
- API endpoints for external integrations
- Webhook system
- Third-party tournament software integration
- Advanced search and filtering
- Season statistics and analytics
- Bulk operations and templates