# Authentication System

<cite>
**Referenced Files in This Document**
- [server.js](file://server.js)
- [routes/auth.js](file://routes/auth.js)
- [database/db.js](file://database/db.js)
- [frontend/src/api.js](file://frontend/src/api.js)
- [frontend/src/components/AuthModal.jsx](file://frontend/src/components/AuthModal.jsx)
- [routes/api.js](file://routes/api.js)
- [database/seed.js](file://database/seed.js)
- [frontend/src/App.jsx](file://frontend/src/App.jsx)
- [frontend/src/components/Navbar.jsx](file://frontend/src/components/Navbar.jsx)
</cite>

## Update Summary
**Changes Made**
- Enhanced AuthModal component with theme-consistent role selection using custom icons
- Added improved accessibility features including Escape key support for modal closing
- Implemented better auth mode management in App.jsx and Navbar components
- Updated authentication flow diagrams to reflect enhanced user experience

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Authentication Modal](#enhanced-authentication-modal)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document explains the Authentication System for the CareerCompass application. It covers how users sign up, log in, and maintain authenticated sessions using a stateless token mechanism. It also documents how the frontend integrates with the backend to manage tokens and protected endpoints, and how user data is persisted securely in a SQLite database.

**Updated** Enhanced with improved user experience through theme-consistent role selection, better accessibility features, and streamlined authentication flow management.

## Project Structure
The authentication system spans both server and client:
- Server-side Express routes handle signup, login, session retrieval, and logout.
- A custom lightweight JWT-like token scheme is used for stateless authentication.
- The database layer persists student records, progress logs, and roadmap data.
- The React frontend provides an interactive modal for login/signup with enhanced UX and manages token storage and API calls.

```mermaid
graph TB
FE["Frontend (React)"] --> API["Express Routes (/api/*)"]
API --> AUTH["Auth Router (/api/auth/*)"]
AUTH --> DB["SQLite Database"]
AUTH --> AGENTS["Career Coach Orchestrator"]
FE --> AM["Enhanced AuthModal"]
AM --> UI["Theme-consistent Role Selection"]
```

**Diagram sources**
- [server.js:14-25](file://server.js#L14-L25)
- [routes/auth.js:1-6](file://routes/auth.js#L1-L6)
- [database/db.js:59-140](file://database/db.js#L59-L140)
- [frontend/src/components/AuthModal.jsx:14-21](file://frontend/src/components/AuthModal.jsx#L14-L21)

**Section sources**
- [server.js:14-25](file://server.js#L14-L25)

## Core Components
- Auth Router: Implements signup, login, session retrieval, and logout; includes password hashing, verification, and token creation/verification.
- Database Layer: Initializes schema, provides query helpers, and persists changes to disk.
- Frontend API Client: Wraps fetch calls, stores/retrieves tokens from localStorage, and attaches Authorization headers.
- **Enhanced Auth Modal**: User-facing form for login/signup with validation, demo accounts, theme-consistent role selection, and improved accessibility.

Key responsibilities:
- Securely store passwords using PBKDF2 with random salt.
- Issue short-lived, HMAC-signed tokens for stateless auth.
- Validate tokens on protected endpoints.
- Persist user profiles and progress data.
- Provide intuitive role selection with custom icons and theme consistency.

**Section sources**
- [routes/auth.js:11-61](file://routes/auth.js#L11-L61)
- [database/db.js:33-53](file://database/db.js#L33-L53)
- [frontend/src/api.js:3-12](file://frontend/src/api.js#L3-L12)
- [frontend/src/components/AuthModal.jsx:85-194](file://frontend/src/components/AuthModal.jsx#L85-L194)

## Architecture Overview
The authentication flow uses a stateless token approach with enhanced user experience:
- On successful signup or login, the server issues a signed token containing minimal user identity.
- The frontend stores the token and sends it via Authorization header for subsequent requests.
- Protected endpoints verify the token before returning sensitive data.
- Enhanced modal provides immediate feedback and smooth transitions between login/signup modes.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Frontend (Enhanced AuthModal)"
participant API as "Express /api/auth"
participant DB as "SQLite"
participant AG as "Orchestrator"
U->>FE : Enter credentials or select demo
FE->>API : POST /api/auth/login {email,password}
API->>DB : SELECT student by email
DB-->>API : Student record
API->>API : Verify password (PBKDF2)
API->>AG : buildOrRefreshStudentRoadmap(studentId)
AG-->>API : Roadmap analysis
API-->>FE : {token, student, analysis}
FE->>FE : Store token in localStorage
U->>FE : Navigate to protected page
FE->>API : GET /api/auth/me (Authorization : Bearer token)
API->>API : verifyToken(token)
API->>DB : getStudentData(studentId)
DB-->>API : Student + progress
API-->>FE : {student, analysis}
```

**Diagram sources**
- [routes/auth.js:258-328](file://routes/auth.js#L258-L328)
- [frontend/src/api.js:44-82](file://frontend/src/api.js#L44-L82)
- [database/db.js:66-114](file://database/db.js#L66-L114)

## Detailed Component Analysis

### Password Hashing and Verification
- Passwords are hashed using PBKDF2 with SHA-512 and a random 16-byte salt.
- Login verifies stored hash against provided password using the same parameters.
- Legacy/demo accounts without hashes allow fallback credentials for convenience.

```mermaid
flowchart TD
Start(["Password Operation"]) --> Mode{"Operation?"}
Mode --> |Hash| GenSalt["Generate random salt"]
GenSalt --> Compute["Compute PBKDF2-SHA512"]
Compute --> ReturnHash["Return {salt, hash}"]
Mode --> |Verify| CheckInputs["Check inputs present"]
CheckInputs --> |Missing| Fail["Return false"]
CheckInputs --> |Present| Recompute["Recompute PBKDF2-SHA512"]
Recompute --> Compare{"Hashes equal?"}
Compare --> |Yes| True["Return true"]
Compare --> |No| False["Return false"]
```

**Diagram sources**
- [routes/auth.js:11-26](file://routes/auth.js#L11-L26)

**Section sources**
- [routes/auth.js:11-26](file://routes/auth.js#L11-L26)

### Token Creation and Verification
- Tokens are HMAC-SHA256 signed, base64url-encoded strings with header, body, and signature.
- Payload includes user identity and timestamps; validity window is set to 7 days.
- Verification checks signature integrity and expiration.

```mermaid
classDiagram
class TokenService {
+createToken(payload) string
+verifyToken(token) object|null
}
```

**Diagram sources**
- [routes/auth.js:28-61](file://routes/auth.js#L28-L61)

**Section sources**
- [routes/auth.js:28-61](file://routes/auth.js#L28-L61)

### Signup Flow
- Validates required fields and formats skills/interests/target role.
- Checks for duplicate emails.
- Inserts student record with hashed password and default metrics.
- Immediately runs multi-agent pipeline to generate roadmap and updates progress logs.
- Returns token, student profile, and initial analysis.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant AUTH as "/api/auth/signup"
participant DB as "Database"
participant AG as "Orchestrator"
FE->>AUTH : POST {name,email,password,...}
AUTH->>DB : Check duplicate email
DB-->>AUTH : Not found
AUTH->>DB : INSERT students (hashed pw)
AUTH->>AG : buildOrRefreshStudentRoadmap(newStudentId)
AG-->>AUTH : Roadmap + tasks
AUTH->>DB : Ensure progress_logs entries exist
AUTH-->>FE : {token, student, analysis}
```

**Diagram sources**
- [routes/auth.js:170-256](file://routes/auth.js#L170-L256)
- [routes/auth.js:116-168](file://routes/auth.js#L116-L168)

**Section sources**
- [routes/auth.js:170-256](file://routes/auth.js#L170-L256)

### Login Flow
- Normalizes email and retrieves student record.
- Verifies password (supports legacy fallback).
- Builds or refreshes roadmap and returns token plus profile and analysis.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant AUTH as "/api/auth/login"
participant DB as "Database"
FE->>AUTH : POST {email,password}
AUTH->>DB : SELECT student by email
DB-->>AUTH : Student row
AUTH->>AUTH : verifyPassword(...)
AUTH->>AUTH : createToken({studentId,email,name})
AUTH-->>FE : {token, student, analysis}
```

**Diagram sources**
- [routes/auth.js:258-300](file://routes/auth.js#L258-L300)

**Section sources**
- [routes/auth.js:258-300](file://routes/auth.js#L258-L300)

### Session Retrieval (/me)
- Requires Authorization: Bearer token.
- Verifies token and extracts studentId.
- Returns sanitized student data and current analysis.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant AUTH as "/api/auth/me"
participant DB as "Database"
FE->>AUTH : GET (Authorization : Bearer token)
AUTH->>AUTH : verifyToken(token)
AUTH->>DB : getStudentData(studentId)
DB-->>AUTH : Student + progress
AUTH-->>FE : {student, analysis}
```

**Diagram sources**
- [routes/auth.js:302-328](file://routes/auth.js#L302-L328)

**Section sources**
- [routes/auth.js:302-328](file://routes/auth.js#L302-L328)

### Logout
- Stateless logout endpoint that acknowledges request.
- Clients should clear local token storage.

**Section sources**
- [routes/auth.js:330-333](file://routes/auth.js#L330-L333)

### Frontend Integration
- Stores token in localStorage and attaches Authorization header for protected requests.
- Provides login/signup UI with validation and demo accounts.
- Handles errors uniformly via a shared response wrapper.
- **Enhanced** with improved mode management and accessibility features.

```mermaid
sequenceDiagram
participant UI as "Enhanced AuthModal"
participant API as "api.js"
participant BE as "Server /api/auth"
UI->>API : login(email,password)
API->>BE : POST /api/auth/login
BE-->>API : {token,...}
API->>API : setToken(token)
API-->>UI : success callback
UI->>API : getMe()
API->>BE : GET /api/auth/me (Bearer token)
BE-->>API : {student,analysis}
API-->>UI : render dashboard
```

**Diagram sources**
- [frontend/src/api.js:44-82](file://frontend/src/api.js#L44-L82)
- [frontend/src/components/AuthModal.jsx:140-194](file://frontend/src/components/AuthModal.jsx#L140-L194)

**Section sources**
- [frontend/src/api.js:3-12](file://frontend/src/api.js#L3-L12)
- [frontend/src/components/AuthModal.jsx:85-194](file://frontend/src/components/AuthModal.jsx#L85-L194)

### Database Schema and Persistence
- Uses SQLite with tables for students, market signals, roadmaps, and progress logs.
- Provides safe wrappers for queries and writes, persisting to disk after mutations.
- Includes migrations to ensure schema compatibility across versions.

```mermaid
erDiagram
STUDENTS {
integer id PK
text name
text email UK
text password_hash
text salt
text education_level
text stream_or_degree
text interests
text skills
text target_role
real skill_match_pct
real remote_demand_pct
integer readiness_score
datetime created_at
}
ROADMAPS {
integer id PK
integer student_id FK
text recommended_path
text portfolio_project
text weekly_tasks
datetime created_at
}
PROGRESS_LOGS {
integer id PK
integer student_id FK
text task_id
text status
datetime completed_at
}
MARKET_SIGNALS {
integer id PK
text role_title
text domain
integer local_demand
integer remote_demand
text required_skills
text growth_trend
}
STUDENTS ||--o{ ROADMAPS : "has"
STUDENTS ||--o{ PROGRESS_LOGS : "tracks"
```

**Diagram sources**
- [database/db.js:71-137](file://database/db.js#L71-L137)

**Section sources**
- [database/db.js:59-140](file://database/db.js#L59-L140)

## Enhanced Authentication Modal

**New Section** The authentication modal has been significantly enhanced with improved user experience and accessibility features.

### Theme-Consistent Role Selection
The signup process now includes a sophisticated role selection interface that maintains visual consistency with the application's gold/brown color palette:

```mermaid
flowchart TD
RoleSelection["Target Role Selection"] --> AI["AI/ML Engineer<br/>Brain Icon"]
RoleSelection --> Web["Full Stack Web Dev<br/>Code Icon"]
RoleSelection --> Data["Data Analyst<br/>Chart Icon"]
RoleSelection --> Cloud["Cloud Engineer<br/>Cloud Icon"]
RoleSelection --> Security["Cybersecurity<br/>Shield Icon"]
RoleSelection --> Mobile["Mobile Developer<br/>Phone Icon"]
```

**Diagram sources**
- [frontend/src/components/AuthModal.jsx:14-21](file://frontend/src/components/AuthModal.jsx#L14-L21)

### Accessibility Improvements
- **Escape Key Support**: Users can close the modal by pressing the Escape key for improved keyboard navigation
- **ARIA Labels**: Proper accessibility attributes for screen readers
- **Focus Management**: Logical tab order and focus indicators
- **Responsive Design**: Works seamlessly across desktop and mobile devices

### Enhanced User Experience Features
- **Smooth Animations**: Framer Motion-powered transitions between login/signup modes
- **Demo Account Access**: One-click access to pre-configured demo accounts
- **Real-time Validation**: Immediate feedback on form input errors
- **Progress Indicators**: Visual step indicators during multi-step signup process
- **Skill Tag System**: Interactive chip-based skill selection with preset options

### Auth Mode Management
The App.jsx component now provides centralized authentication mode management:

```mermaid
stateDiagram-v2
[*] --> LoginMode
LoginMode --> SignupMode : Click Sign Up
SignupMode --> LoginMode : Click Log In
LoginMode --> [*] : Successful Login
SignupMode --> [*] : Successful Signup
```

**Diagram sources**
- [frontend/src/App.jsx:84-128](file://frontend/src/App.jsx#L84-L128)

**Section sources**
- [frontend/src/components/AuthModal.jsx:88-133](file://frontend/src/components/AuthModal.jsx#L88-L133)
- [frontend/src/App.jsx:124-128](file://frontend/src/App.jsx#L124-L128)
- [frontend/src/components/Navbar.jsx:188-210](file://frontend/src/components/Navbar.jsx#L188-L210)

## Dependency Analysis
- Server mounts routers under /api, exposing health, auth, and general APIs.
- Auth router depends on database helpers and orchestrator for roadmap generation.
- Frontend api module centralizes token management and HTTP calls.
- **Enhanced** AuthModal component integrates with improved mode management in App.jsx and Navbar.

```mermaid
graph LR
Server["server.js"] --> AuthRouter["routes/auth.js"]
Server --> ApiRouter["routes/api.js"]
AuthRouter --> DB["database/db.js"]
AuthRouter --> Orchestrator["agents/careerCoachOrchestrator.js"]
FrontendAPI["frontend/src/api.js"] --> Server
AuthModal["frontend/src/components/AuthModal.jsx"] --> FrontendAPI
App["frontend/src/App.jsx"] --> AuthModal
Navbar["frontend/src/components/Navbar.jsx"] --> App
```

**Diagram sources**
- [server.js:14-25](file://server.js#L14-L25)
- [routes/auth.js:1-6](file://routes/auth.js#L1-L6)
- [routes/api.js:1-6](file://routes/api.js#L1-L6)
- [frontend/src/api.js:1-12](file://frontend/src/api.js#L1-L12)
- [frontend/src/components/AuthModal.jsx:1-10](file://frontend/src/components/AuthModal.jsx#L1-L10)
- [frontend/src/App.jsx:1-19](file://frontend/src/App.jsx#L1-L19)
- [frontend/src/components/Navbar.jsx:1-5](file://frontend/src/components/Navbar.jsx#L1-L5)

**Section sources**
- [server.js:14-25](file://server.js#L14-L25)
- [routes/auth.js:1-6](file://routes/auth.js#L1-L6)
- [routes/api.js:1-6](file://routes/api.js#L1-L6)

## Performance Considerations
- Password hashing uses PBKDF2 with moderate iterations; acceptable for prototype scale but consider tuning for production load.
- Token verification is CPU-light HMAC check; suitable for high throughput.
- Database operations use prepared statements and batched writes; ensure indexes on frequently queried columns (e.g., students.email) if scaling beyond prototype.
- Avoid unnecessary re-running of the multi-agent pipeline on every request; cache results per session where appropriate.
- **Enhanced** Modal animations use hardware-accelerated CSS transforms for smooth performance.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid credentials: Ensure email is normalized and password meets requirements; verify legacy fallback behavior for demo accounts.
- Expired or invalid token: Re-authenticate; ensure Authorization header format is correct ("Bearer <token>").
- Duplicate email during signup: Change email or log in with existing account.
- Database not initialized: Confirm initDatabase is called before any queries; check file permissions for persistence path.
- Network errors: Inspect CORS settings and server availability; confirm BASE URL and headers in frontend.
- **Enhanced** Modal accessibility: Verify Escape key functionality and proper ARIA labels for screen reader compatibility.

**Section sources**
- [routes/auth.js:170-256](file://routes/auth.js#L170-L256)
- [routes/auth.js:258-328](file://routes/auth.js#L258-L328)
- [database/db.js:59-140](file://database/db.js#L59-L140)
- [frontend/src/api.js:18-39](file://frontend/src/api.js#L18-L39)
- [frontend/src/components/AuthModal.jsx:127-133](file://frontend/src/components/AuthModal.jsx#L127-L133)

## Conclusion
The Authentication System provides secure signup and login with robust password handling and a stateless token model. It integrates seamlessly with the frontend through a centralized API client and supports persistent storage of user profiles and progress. 

**Enhanced** with improved user experience through theme-consistent role selection, better accessibility features, and streamlined authentication flow management. For production hardening, consider strengthening password parameters, adding rate limiting, and implementing token refresh mechanisms.

[No sources needed since this section summarizes without analyzing specific files]