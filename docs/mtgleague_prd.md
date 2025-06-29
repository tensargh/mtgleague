# Product Requirements Document (PRD)

## Project Overview 

**Example:**
Build a web application to manage Magic: The Gathering league events, including match tracking, and leaderboard management.
We'll be able to have leagues from multiple stores running concurrently.

## Objectives & Goals
- We can set up stores and manage TOs for those stores
- TOs can create a Season. The normal amount of Legs in a League is 10, with the top 7 Leg results counting. A Tournament Organiser can choose a number of Legs greater than 10.
- TOs can create a leg within a Season and list players from existing players at their store or add new players.
- Each Leg will be a Swiss event, with the number of matches appropriate for the number of players. Players will score 3 point for each win and 1 point for each draw or tie.
- At the end of a Leg a TO can enter the results easily.
- Once the results are completed for a Leg the season standings will be available.
- A Tournament Organiser can make their Top 8 at any time after Leg 10. When they make their Top 8 they will be asked to specify the number of best Legs to take. The default and minimum will be 7.
- Once the Top 8 is determined, they will play a single elimination knockout tournament to determine the League champion.

## Current Implementation Status

### ✅ **COMPLETED FEATURES:**

#### Authentication & User Management
- **Invitation System**: Secure invite-based registration with email sending via Resend.com
- **Role-based Access**: Admin and Tournament Organizer (TO) roles with proper permissions
- **User Management**: Admins can invite users, assign roles, and revoke invites
- **Protected Routes**: `/admin/*` and `/to/*` routes require authentication and proper role
- **Login/Logout**: Supabase Auth integration with proper redirects

#### Store Management
- **Store CRUD**: Admins can create, read, update stores
- **TO Assignment**: Assign TOs to specific stores via `store_tos` junction table
- **Store Selection**: Role-based store picker (admins can select any, TOs locked to assigned stores)
- **Public Store Pages**: Anonymous users can view store information and standings

#### Season Management
- **Season Creation**: TOs can create seasons for their assigned stores
- **Season Configuration**: Set total legs and best legs count
- **Season Status**: Active/completed status tracking

#### Player Management
- **Player CRUD**: TOs can add, edit, and delete players for their store
- **Player Association**: Players are associated with specific stores
- **Quick Add**: Add new players directly from leg results entry

#### Leg Management
- **Leg Creation**: TOs can create legs within seasons with automatic round numbering
- **Leg Status Tracking**: Scheduled, in progress, and completed status
- **Leg Deletion**: Delete the most recent leg with confirmation
- **Leg Navigation**: Easy navigation between legs and results

#### Results Entry System
- **Match Results**: Enter wins, draws, and losses for each player
- **Points Calculation**: Automatic calculation of points (3 for win, 1 for draw)
- **Participation Tracking**: Track which players participated in each leg
- **Quick Add Players**: Add new players on-the-fly during results entry
- **Results Validation**: Prevent creating new legs until current leg is completed

#### Standings & Statistics
- **Best N Results Logic**: Calculate standings using only the best N leg results per player
- **Real-time Standings**: Standings update automatically when results are saved
- **Visual Highlighting**: Best results are highlighted in green
- **Points Display**: Clean points-only display for each leg
- **Total Calculations**: Sum of best N results with win/draw/loss record
- **Anonymous View**: Public standings view for store visitors

#### UI/UX
- **Modern Design**: Tailwind CSS with shadcn/ui components
- **Dark/Light Mode**: Theme toggling with next-themes
- **Responsive Layout**: Consistent admin/TO layouts with sidebar navigation
- **Store Picker**: Top bar with user info and store selection
- **Consistent Branding**: Trophy icon and modern styling
- **Loading States**: Proper loading indicators and error handling

#### Database & Security
- **Row Level Security (RLS)**: Proper database security policies
- **Migration System**: Sequential numbered migrations for database changes
- **Secure Functions**: Database functions for invite acceptance, role changes, etc.
- **Participation Tracking**: Boolean flag to track player participation for tiebreakers

### 🚧 **IN PROGRESS / PARTIALLY IMPLEMENTED:**
- **Store Addresses**: Schema ready but UI not implemented
- **Anonymous Player Support**: Database schema ready but UI not implemented
- **Top 8 System**: Database schema planned but not implemented

### ❌ **NOT YET IMPLEMENTED:**

#### Content Management
- **Store/League CMS**: Rules, announcements, and content management
- **Logo Upload**: Store logo management
- **External Resource Links**: Links to external resources

#### Advanced Features
- **Google Maps Integration**: Store location mapping
- **Player Search and Filtering**: Advanced player management
- **Advanced Statistics**: Detailed performance metrics

#### Top 8 Results
- **Top 8 Results Entry**: Enter and display results for the top 8 after the season is complete

## Stakeholders
- Product Owner: the UK Pauper League team
- Developers: Dev Team
- Users: Tournament Organisers

## User Stories

### ✅ **COMPLETED USER STORIES:**

#### Admin Functions (`/admin/*`):
- ✅ As an Admin, I want to invite new users as admins or TOs so they can access the system
- ✅ As an Admin, I want to manage user roles and revoke invites so I can control access
- ✅ As an Admin, I want to add and modify stores so they can host leagues
- ✅ As an Admin, I want to assign TOs to specific stores so they can manage those stores
- ✅ As an Admin, I want to access all admin functions under `/admin` and TO functions under `/to`

#### Tournament Organiser Functions (`/to/*`):
- ✅ As a Tournament Organiser, I want to create a Season for my assigned store
- ✅ As a Tournament Organiser, I want my store picker to be locked to my assigned store only
- ✅ As a Tournament Organiser, I want to access TO functions under `/to` with proper authentication
- ✅ As a Tournament Organiser, I want to create legs within a season with automatic round numbering
- ✅ As a Tournament Organiser, I want to manage players for my store (add, edit, delete)
- ✅ As a Tournament Organiser, I want to enter match results for each leg (wins, draws, losses)
- ✅ As a Tournament Organiser, I want to see real-time standings based on best N leg results
- ✅ As a Tournament Organiser, I want to add new players quickly during results entry
- ✅ As a Tournament Organiser, I want to delete the most recent leg if needed
- ✅ As a Tournament Organiser, I want to see which results count toward final standings (highlighted)

#### Public Functions (`/*`):
- ✅ As a visitor, I want to view store information without logging in
- ✅ As a visitor, I want to select a store and see its details
- ✅ As a visitor, I want to see current season standings for completed legs

### 🚧 **IN PROGRESS USER STORIES:**
- 🚧 As a Tournament Organiser, I should be able to set a player as anonymous so their name will not be visible to the public

### ❌ **NOT YET IMPLEMENTED USER STORIES:**
- ❌ As a Tournament Organiser, I want to be able to enter Top 8 results after the season is complete
- ❌ As a Tournament Organiser, I want to be able to post and update informational content, rules, and announcements for my Store or League
- ❌ As a player, I want to see the results of a top 8 event without logging in

## Functional Requirements

### ✅ **IMPLEMENTED REQUIREMENTS:**

#### Authentication & Security
- ✅ Invitation-based user registration with email verification
- ✅ Supabase Auth integration with email/password authentication
- ✅ Role-based access control (admin, to)
- ✅ Protected routes with proper redirects
- ✅ Secure database with Row Level Security (RLS)

#### Store Management
- ✅ Store creation and management by admins
- ✅ TO assignment to specific stores
- ✅ Store selection with role-based restrictions
- ✅ Public store information display

#### Season Management
- ✅ Season creation by TOs for their assigned stores
- ✅ Season configuration (total legs, best legs count)
- ✅ Season status tracking

#### Player Management
- ✅ Player creation and management by TOs
- ✅ Player association with specific stores
- ✅ Quick player addition during results entry
- ✅ Player deletion with confirmation

#### Leg Management
- ✅ Leg creation within seasons
- ✅ Automatic round numbering
- ✅ Leg status tracking (scheduled, in progress, completed)
- ✅ Leg deletion (most recent only)
- ✅ Navigation between legs and results

#### Results Entry System
- ✅ Match result entry (wins, draws, losses)
- ✅ Automatic points calculation (3 for win, 1 for draw)
- ✅ Participation tracking for tiebreakers
- ✅ Results validation and completion
- ✅ Quick player addition during entry

#### Standings & Statistics
- ✅ Best N results calculation logic
- ✅ Real-time standings updates
- ✅ Visual highlighting of best results
- ✅ Points-only display for leg results
- ✅ Total calculations from best N legs
- ✅ Public standings view

#### UI/UX
- ✅ Modern, responsive design with Tailwind CSS
- ✅ Dark/light mode theme toggling
- ✅ Consistent admin and TO layouts
- ✅ Store picker in top bar
- ✅ Sidebar navigation for admin/TO functions
- ✅ Loading states and error handling
- ✅ Confirmation dialogs for destructive actions

### 🚧 **PARTIALLY IMPLEMENTED:**
- 🚧 Store address fields (database ready, UI pending)
- 🚧 Anonymous player support (database ready, UI pending)

### ❌ **NOT YET IMPLEMENTED:**

#### Content Management
- **Store/League CMS**: Rules, announcements, and content management
- **Logo Upload**: Store logo management
- **External Resource Links**: Links to external resources

#### Advanced Features
- **Google Maps Integration**: Store location mapping
- **Player Search and Filtering**: Advanced player management
- **Advanced Statistics**: Detailed performance metrics

#### Top 8 Results
- **Top 8 Results Entry**: Enter and display results for the top 8 after the season is complete

## Data Model

### ✅ **IMPLEMENTED TABLES:**

```sql
-- Users and Authentication
users (id, email, role, created_at, cannot_be_deleted)
invites (id, email, role, store_id, token, expires_at, created_at)

-- Store Management
stores (id, name, address, phone, email, created_at, updated_at)
store_tos (id, user_id, store_id, created_at)

-- Season Management
seasons (id, store_id, name, total_legs, best_legs_count, status, created_at, completed_at, updated_at)

-- Player Management
players (id, store_id, name, email, created_at)

-- Leg Management
legs (id, season_id, name, round_number, status, created_at, completed_at)

-- Results Management
leg_results (id, leg_id, player_id, wins, draws, losses, points, participated, created_at)
```

### 🚧 **PLANNED TABLES (Not Yet Implemented):**

```sql
-- Player Management
players (id, store_id, name, public_visibility, created_at)

-- Tournament Management
legs (id, season_id, name, round_number, status, created_at, completed_at)
leg_results (id, leg_id, player_id, points, wins, draws, losses, created_at)

-- Top 8 System
top8 (id, season_id, status, created_at, completed_at)
top8_matches (id, top8_id, player1_id, player2_id, round, result, ordinal, created_at)

-- Content Management
store_content (id, store_id, type, title, content, created_at, updated_at)
```

## Technical Implementation

### ✅ **IMPLEMENTED TECHNOLOGIES:**
- **Frontend**: Next.js 14 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Email**: Resend.com integration
- **Theming**: next-themes for dark/light mode
- **UI Components**: Custom components with consistent design system
- **State Management**: React hooks with proper state management
- **Form Handling**: React Hook Form with validation
- **Notifications**: Sonner toast notifications

### 🔧 **DEVELOPMENT RULES & STANDARDS:**

#### Database Operations
- **Transactions Required**: Any operation requiring multiple inserts/updates must use database transactions
- **RPC Functions**: Complex multi-step operations should be implemented as Supabase RPC functions
- **Atomic Operations**: Ensure all related database changes succeed or fail together
- **Constraint Safety**: Always validate data consistency before committing transactions
- **Error Handling**: Provide clear error messages and automatic rollback on failures

#### Code Quality
- **Type Safety**: Use TypeScript interfaces for all data structures
- **Error Boundaries**: Implement proper error handling and user feedback
- **Loading States**: Show appropriate loading indicators for async operations
- **Validation**: Validate data on both client and server side
- **Security**: Use Row Level Security (RLS) for all database operations

### 🚧 **IN PROGRESS:**
- Anonymous player support UI
- Store address fields UI
- Top 8 system implementation

### ❌ **NOT YET IMPLEMENTED:**
- Swiss tournament algorithm
- Top 8 knockout logic
- Content management system
- Google Maps integration

## Non-Functional Requirements

### ✅ **ACHIEVED:**
- ✅ Responsive design for mobile and desktop
- ✅ Secure data storage with RLS
- ✅ Modern authentication with Supabase
- ✅ Low-cost hosting solution (Vercel + Supabase)
- ✅ OAuth support via Supabase Auth
- ✅ Minimal file storage (logo URLs only)

### 🚧 **IN PROGRESS:**
- Performance optimization for larger datasets
- Advanced security features

## Next Steps

### Phase 1: Anonymous Player Support (Priority: High)
1. ✅ ~~Implement player tables and CRUD operations~~ (COMPLETED)
2. ✅ ~~Add player management UI for TOs~~ (COMPLETED)
3. 🚧 Implement anonymous player support UI
4. 🚧 Add store address fields UI

### Phase 2: League Management (Priority: High)
1. ✅ ~~Implement leg creation and management~~ (COMPLETED)
2. ✅ ~~Create match result entry system~~ (COMPLETED)
3. ✅ ~~Implement season standings calculation~~ (COMPLETED)

### Phase 3: Top 8 Results (Priority: Medium)
1. ❌ Implement top 8 results entry and display after season completion

### Phase 4: Content Management (Priority: Low)
1. ❌ Implement store/league CMS
2. ❌ Add logo upload functionality
3. ❌ Create announcement system
4. ❌ Add external resource links

### Phase 5: Advanced Features (Priority: Low)
1. ❌ Google Maps integration
2. ❌ Advanced statistics and reporting
3. ❌ Player search and filtering
4. ❌ Performance analytics

## Appendix
- Wireframes: Not yet created
- API: Supabase REST API with custom functions
- Database: PostgreSQL with Row Level Security