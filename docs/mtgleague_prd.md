# Product Requirements Document (PRD)

## Project Overview 

**Example:**
Build a web application to manage Magic: The Gathering league events, includin match tracking, and leaderboard management.
We'll be able to have leagies from multiple stores running concurrently.

## Objectives & Goals
- We can set up stores and manage TOs for those stores
- TOs can create a Season. The normal amount of Legs in a League is 10, with the top 7 Leg results counting. A Tournament Organiser can choose a number of Legs greater than 10.
- TOs can create a leg within a Season and list players from existing players at their store or add new players.
- Each Leg will be a Swiss event, with the number of matches appropriate for the number of players. Players will score 3 point for each win and 1 point for each draw or tie.
- At the end of a Leg a TO can enter the results easily.
- Once the results are completed for a Leg the season standings will be available.
- A Tournament Organiser can make their Top 8 at any time after Leg 10. When they make their Top 8 they will be asked to specify the number of best Legs to take. The default and minimum will be 7.
- Once the Top 8 is determined, they will play a single elimination knockout tournament to determine the League champion.

## Stakeholders
- Product Owner: the UK Pauper League team
- Developers: Dev Team
- Users: Tournament Organisers

## User Stories
- As an Admin, I want to be able to add a new Store so it can create Seasons.
- As an Admin I want to be able to modify a Store.
- As an admin I want to be able to add or remove Tournament Organisers from Stores.
- As a Tournament Organiser I want to be able to create a Season.
- As a Tournament Organiser I want to be able to log the results of a Leg within a Season.
  - The Tournament Organiser will add the players - there is no player registration.
  - Players should be remembered as being associated with the Store.
- As a Tournament Organiser I should be able to set a player as anonymous so their name will not be visible to the public.
- As a Tournament Organiser or Admin I should be able to remove all records of a Player. 
- As a player I want to be able to see the standings in the Season at a Store.
- As a Tournament Organiser I want to be able to run a top 8 event and enter the results.
- As a tournament Organiser I want to have flexibility in running the top 8 to decide how I will deal with no-shows. 
  - The initial top 8 will be automatically calculated
  - The Tournament Organiser can alter this top 8 manually as they require.
- As a player i want to see the results of a top 8 event.
- As a Tournament Organiser or Admin, I want to be able to post and update informational content, rules, and announcements for my Store or League so that participants can stay informed.

## Functional Requirements
- Admins and Tournament Organisers need to be able to log in to the application. 
- Players can see details for a store. 
- Each Store and each League should have a lightweight CMS (Content Management System) allowing Tournament Organisers or Admins to:
  - Add a logo URL for their store/league
  - Post text-based informational content (e.g., league rules, event schedules, updates)
  - Share links to external resources (e.g., spreadsheets, official rules, Discord invites)
  - Manage text-based announcements and news for their community

## Data Model

```mermaid
erDiagram
    STORE {
        uuid id PK
        string name
        string logo_url
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    USER {
        uuid id PK
        string email
        string name
        enum role "admin|tournament_organiser"
        timestamp created_at
    }

    PLAYER {
        uuid id PK
        uuid store_id FK
        string name
        enum "public|private"
        timestamp created_at
    }
    
    STORE_TO {
        uuid store_id FK
        uuid user_id FK
        timestamp assigned_at
    }
    
    SEASON {
        uuid id PK
        uuid store_id FK
        string name
        int total_legs
        int best_legs_count
        enum status "active|completed"
        timestamp created_at
        timestamp completed_at
    }
    
    LEG {
        uuid id PK
        uuid season_id FK
        string name
        int round_number
        enum status "scheduled|in_progress|completed"
        timestamp created_at
        timestamp completed_at
    }
    
    LEG_RESULT {
        uuid id PK
        uuid leg_id FK
        uuid player_id FK
        int points
        int wins
        int draws
        int losses
        timestamp created_at
    }
    
    TOP8 {
        uuid id PK
        uuid season_id FK
        enum status "pending|in_progress|completed"
        timestamp created_at
        timestamp completed_at
    }
    
    TOP8_MATCH {
        uuid id PK
        uuid top8_id FK
        uuid player1_id FK
        uuid player2_id FK
        enum round "qf|sf|final"
        enum result "player1_win|player2_win"
        int ordinal
        timestamp created_at
    }
    
    STORE ||--o{ STORE_TO : "has"
    USER ||--o{ STORE_TO : "assigned_to"
    STORE ||--o{ SEASON : "hosts"
    STORE ||--o{ PLAYER : "has"
    SEASON ||--o{ LEG : "contains"
    SEASON ||--o{ PLAYER : "participates"
    LEG ||--o{ LEG_RESULT : "has"
    PLAYER ||--o{ LEG_RESULT : "has"
    SEASON ||--o| TOP8 : "has"
    TOP8 ||--o{ TOP8_MATCH : "has"
    PLAYER ||--o{ TOP8_MATCH : "plays_in"
```

## Non-Functional Requirements
- Responsive design for mobile and desktop
- Data should be stored securely
- Application should handle at least 100 concurrent users
- Free or very low-cost hosting solution
- Simple authentication with OAuth support (Google, Discord, etc.)
- Minimal file storage requirements (logo URLs only)

## Appendix
- Wireframes
- No API is required.