# DexMatch
A dating app for Pokémon to find their true mate.

## Overview

1.  [Building](#building)
    1.  [Prerequisites](#prerequisites)
    2.  [How to Run the App](#how-to-run-the-app)

2.  [Architechture](#architecture)
    1.  [Use Case Diagram](#use-case-diagram)
    2.  [Entity-Relationship Diagram](#entity-relationship-diagram)
    3.  [Sequence Diagram](#sequence-diagram)

## Building

### Prerequisites
- Node.js (v18 or higher)
- NPM (Node Package Manager)

### How to Run the App
1. Clone this repository to your local machine.
2. Open your terminal and navigate to the project folder: `cd dexmatch`
3. Install the dependencies: `npm install`
4. Start the server: `npm start`
5. Open your web browser and go to: `http://localhost:3000`

## Architecture

### Use Case Diagram

  ```mermaid
flowchart LR
    User((User))
    Auth[[Auth]]
    Database[[Database]]
    PokéAPI[[PokéAPI]]
    CNAPI[[CNAPI]]
    
    subgraph "User actions"
        UC1([Create Account / Login])
        UC2([Set Preferences])
        UC3([View Pokémon Card & description])
        UC4([Swipe Right / Left])
        UC5([View Liked Roster])
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    
    UC1 --> Database
    UC1 --> Auth
    UC2 --> Database
    UC3 --> Database
    UC4 --> Database
    UC4 --> PokéAPI 
    UC4 --> CNAPI 
    UC5 --> Database 
    
  ```
  
  ### Entity-Relationship Diagram

  ```mermaid
  erDiagram
      USERS {
          int id PK
          string username UK
          string display_name
          string password_hash
          int region_id_pref
          int theme
      }
      
      USER_TYPE_PREFS {
          int id PK
          int user_id FK
          string type
          boolean is_wanted
      }
      
      POKEMONS {
          int id PK          
          int pokemon_id
          string name
          string image_url
          string area_id
      }
      
      SWIPES {
          int id PK
          int user_id FK
          int pokemon_id FK
          boolean is_liked
      }
      
      USERS ||--o{ USER_TYPE_PREFS: has
      USERS ||--o{ SWIPES: makes
      POKEMONS ||--o{ SWIPES: exists
  ```

### Sequence Diagram

  ```mermaid
  sequenceDiagram
      participant U as User Browser
      participant S as Express Server
      participant DB as SQLite
      participant PAPI as PokéAPI
      participant CNAPI as CNAPI
  
      U->>S: GET /swipe
      S->>DB: Get preferences & past swipes
      DB-->>S: Returns user data
      S->>PAPI: Fetch psudo random valid Pokemon ID
      PAPI-->>S: Returns Pokemon Data (i.e. Type: Fire)
      S->>CNAPI: Fetch joke for "Fire"
      CNAPI-->>S: Returns Joke
      S->>S: Generate Human Name (Faker)
      S->>S: Render swipe.ejs with all data
      S-->>U: Return HTML View
  ```

---
