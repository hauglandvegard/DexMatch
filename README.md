# DexMatch
A dating app for Pokémon to find their true mate.

## Overview

1. [Building](#building)
    1. [Prerequisites](#prerequisites)
    2. [How to Run the App](#how-to-run-the-app)

2. [Architecture](#architecture)
    1. [The stack](#the-stack)
    2. [System Context Diagram](#system-context-diagram)
    3. [Entity-Relationship Diagram](#entity-relationship-diagram)
    4. [Sequence Diagram](#sequence-diagram)

## Building

### Prerequisites
* Node.js (v18 or higher)
* NPM (Node Package Manager)

### How to Run the App (Local Development)
1. Clone this repository to your local machine.
2. Open your terminal and navigate to the project folder: `cd dexmatch`
3. Install the dependencies: `npm install`

**To run in Development Mode (Recommended for testing):**
This mode uses `ts-node` and `nodemon` to automatically restart the server when files change.
1. Run: `npm run dev`
2. Open your web browser and go to: `http://localhost:3000`

**To run in Production Mode:**
This mode compiles the TypeScript code into optimized JavaScript before running.
1. Compile the code: `npm run build`
2. Start the server: `npm start`
3. Open your web browser and go to: `http://localhost:3000`

*Note: The database uses SQLite. You do not need to install or configure any external database servers. A local database file will be created automatically upon launch.*

## Architecture

### The stack
This application is built using a Server-Side Rendered (SSR) architecture following the Model-View-Controller (MVC) design pattern.

**Core Backend**
* **[Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/):** The core web framework used to handle routing, HTTP requests, and server logic.
* **[Axios](https://axios-http.com/):** A promise-based HTTP client used in the service layer to fetch and parse external API data cleanly.
* **[Faker.js](https://fakerjs.dev/):** Used to generate random, localized human names for the Pokémon to enhance the "Tinder" theme.

**Frontend / Views**
* **[EJS (Embedded JavaScript)](https://ejs.co/):** The templating engine used to inject dynamic server data (Pokémon stats, jokes, user preferences) directly into HTML layouts before sending them to the client.
* **[Tailwind CSS](https://tailwindcss.com/) & [DaisyUI](https://daisyui.com/):** Used via CDN to provide a modern, highly polished, and responsive user interface without requiring a complex frontend build pipeline.

**Database & Security**
* **[SQLite3 (better-sqlite3)](https://github.com/WiseLibs/better-sqlite3):** A fast, local, serverless SQL database. Chosen specifically so reviewers can run the application immediately without external database configuration.
* **[Bcrypt.js](https://www.npmjs.com/package/bcryptjs):** Used to securely salt and hash user passwords before storing them in the database.
* **[Express-Session](https://www.npmjs.com/package/express-session):** Handles user session management and authentication state.

**External APIs**
* **[PokeAPI](https://pokeapi.co/):** Provides *all the Pokémon data you'll ever need in one place*.
* **[Chuck Norris API](https://api.chucknorris.io/):** Provides the thematic jokes based on Pokémon typing.

### Use Case Diagram
A high-level overview of the buisiness requirements.

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
How the database tables relate to each other.

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
        int weight
        int height
        int level
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
