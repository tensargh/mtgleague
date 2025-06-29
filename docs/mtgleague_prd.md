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

#### TO Dashboard
- ✅ TO-specific dashboard with sidebar navigation
- ✅ Season management interface
- ✅ Leg management interface
- ✅ Results entry interface with live calculations
- ✅ Player management interface
- ✅ Quick add player functionality

#### Admin Dashboard
- ✅ User management interface
- ✅ Store assignment management
- ✅ Invitation system management
- ✅ Role management (promote/demote users)

### 🔄 IN PROGRESS / PARTIALLY COMPLETE

#### Season Completion
- ⚠️ Season status management (marking seasons as completed)
- ⚠️ Past seasons viewing interface
- ⚠️ Historical standings access

### ❌ NOT YET IMPLEMENTED

#### Tournament Features
- ❌ Top 8 tournament system
- ❌ Tournament bracket management
- ❌ Tournament match results
- ❌ Tournament standings

#### Advanced Features
- ❌ Tiebreaker calculations
- ❌ Advanced standings algorithms
- ❌ Season statistics and analytics
- ❌ Player performance tracking over time
- ❌ Export functionality (CSV, PDF)

#### User Experience
- ❌ Email notifications for leg results
- ❌ Mobile app or PWA
- ❌ Real-time updates
- ❌ Advanced search and filtering

#### Integration
- ❌ API endpoints for external integrations
- ❌ Webhook system
- ❌ Third-party tournament software integration

## Store Details Page Layout (Updated)

### Page Structure
The store details page should display information in the following order:

1. **Store Information Section**
   - Store name, address, and logo
   - Store description/details
   - Change store button

2. **Active Seasons Section**
   - Each active season displayed in its own container
   - Season name and status
   - Current standings grid showing:
     - Player names
     - Total points
     - Match records (W/D/L)
     - Leg participation
     - Best leg results (if applicable)
   - Season details (total legs, best legs count, etc.)

3. **Past Seasons Section**
   - "Find a past season" section
   - List of completed seasons
   - Access to historical standings

### Removed Sections
- **Active Seasons Information**: The summary section showing active seasons count, total players, and completed legs is removed
- **Consolidated Stats**: Individual season containers provide all necessary information

### Design Requirements
- Clean, modern UI with proper spacing between sections
- Responsive design for mobile and desktop
- Dark/light mode support
- Clear visual hierarchy with proper headings
- Consistent styling with the rest of the application

## Technical Requirements

### Database Schema
- **Stores**: Store information and metadata
- **Users**: User accounts with role-based permissions
- **Players**: Player profiles linked to stores
- **Seasons**: League seasons with configurable parameters
- **Legs**: Individual tournament legs within seasons
- **Leg Results**: Match results and participation tracking
- **Store TOs**: Many-to-many relationship between stores and TOs

### Security
- Row Level Security (RLS) policies for data access
- Role-based permissions for all operations
- Secure invitation system with token validation
- Protected admin operations

### Performance
- Efficient queries for standings calculations
- Proper indexing for fast data retrieval
- Optimized loading of season data

## User Flows

### Anonymous User Flow
1. Visit homepage
2. Select a store from the list
3. View store information and current standings
4. Browse active seasons and their standings
5. Access past seasons if available

### TO Flow
1. Sign in with invited account
2. Access TO dashboard
3. Manage seasons and legs
4. Enter match results
5. View current standings

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

## Next Priority Items

### HIGH PRIORITY
1. **Past Seasons Viewing** - Implement the "Find a past season" functionality
2. **Tiebreaker Calculations** - Implement proper tiebreaker logic for standings
3. **Data Validation** - Add validation for leg results and player data

### MEDIUM PRIORITY
1. **Email Notifications** - Notify players when leg results are posted
2. **Advanced Standings** - Add more sophisticated standings calculations
3. **Export Functionality** - Allow exporting standings to CSV/PDF
4. **Mobile Optimization** - Improve mobile experience

### LOW PRIORITY
1. **Top 8 Tournament System** - Implement tournament brackets
2. **Analytics Dashboard** - Add statistics and performance tracking
3. **API Development** - Create external integration capabilities
4. **Advanced Features** - Real-time updates, webhooks, etc.