# Customization Guide

<cite>
**Referenced Files in This Document**
- [index.html](file://index.html)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This guide explains how to customize the CareerCompass prototype, a single-file HTML application that includes Tailwind CSS and inline JavaScript. You will learn how to:
- Modify chat responses by editing the chatResponses array
- Add new agents to the multi-agent pipeline by duplicating agent card structures and updating animation logic
- Extend market data sections by adding tabs or modifying existing market information arrays
- Customize the 4-week action plan by editing checklist items and week descriptions
- Adjust styling via Tailwind config and custom CSS for color schemes, responsive behavior, and animations
- Maintain code organization and readability within the single-file structure

The goal is to make it easy to adapt the prototype for different student profiles, career paths, and integration scenarios without breaking functionality.

## Project Structure
CareerCompass is implemented as a single HTML file with:
- Inline Tailwind configuration and theme customization
- Inline CSS for glass effects, animations, and component styles
- A structured UI with sections for Profile, Coach (chat), Multi-Agent Pipeline, Skills, Market Insights, Action Plan, and Portfolio Recommendations
- Inline JavaScript handling chat interactions, pipeline animation, tab switching, modal toggles, and score animation

```mermaid
graph TB
A["index.html"] --> B["Tailwind Config & Theme"]
A --> C["Inline CSS Styles"]
A --> D["UI Sections<br/>Profile / Coach / Pipeline / Skills / Market / Plan"]
A --> E["JavaScript Logic<br/>Chat / Pipeline / Tabs / Modal / Score"]
```

**Diagram sources**
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)
- [index.html:47-527](file://index.html#L47-L527)
- [index.html:565-681](file://index.html#L565-L681)

**Section sources**
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)
- [index.html:47-527](file://index.html#L47-L527)
- [index.html:565-681](file://index.html#L565-L681)

## Core Components
Key customizable areas:
- Chat responses: Editable array driving coach replies
- Multi-agent pipeline: Agent cards and animation sequence
- Market insights: Local/Remote tabs and content blocks
- 4-week action plan: Weekly checklists and descriptions
- Styling: Tailwind theme colors and custom CSS animations

Practical tips:
- Keep each section clearly separated with comments
- Use descriptive variable names and consistent indentation
- Avoid hardcoding values where possible; prefer arrays or constants for repeated patterns

**Section sources**
- [index.html:565-681](file://index.html#L565-L681)
- [index.html:172-226](file://index.html#L172-L226)
- [index.html:228-281](file://index.html#L228-L281)
- [index.html:315-390](file://index.html#L315-L390)
- [index.html:392-458](file://index.html#L392-L458)
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)

## Architecture Overview
The application follows a simple client-side architecture:
- UI sections render static content and interactive elements
- JavaScript handles user interactions and updates DOM state
- Tailwind provides utility classes; custom CSS adds specialized effects
- No external APIs are connected; all data is embedded in the HTML/JS

```mermaid
sequenceDiagram
participant U as "User"
participant C as "Chat UI"
participant JS as "JavaScript"
participant P as "Pipeline UI"
participant M as "Market Tabs"
U->>C : Type message and press Enter
C->>JS : sendMessage()
JS->>JS : showTyping()
JS-->>C : Append user message
JS->>JS : setTimeout(...)
JS-->>C : appendMessage(chatResponse)
U->>P : Click Run Analysis
P->>JS : runPipeline()
JS->>P : Animate agent cards sequentially
U->>M : Switch Local/Remote tab
M->>JS : switchTab(btn, tab)
JS-->>M : Toggle visibility of market sections
```

**Diagram sources**
- [index.html:565-681](file://index.html#L565-L681)
- [index.html:172-226](file://index.html#L172-L226)
- [index.html:228-281](file://index.html#L228-L281)
- [index.html:315-390](file://index.html#L315-L390)

## Detailed Component Analysis

### Chat Responses Customization
- Location: The chatResponses array defines pre-written coach replies used when sending messages or suggested questions.
- How to modify:
  - Add new strings to the array to expand response options
  - Update existing entries to tailor tone, advice, or references
  - Ensure HTML-safe formatting if using tags like strong
- Behavior:
  - Each send cycles through responses using an index modulo length
  - Typing indicator appears briefly before appending the next response

```mermaid
flowchart TD
Start(["Send Message"]) --> Validate["Validate input"]
Validate --> |Empty| End(["Exit"])
Validate --> |Valid| AppendUser["Append user message"]
AppendUser --> ShowTyping["Show typing indicator"]
ShowTyping --> Delay["Wait random delay"]
Delay --> RemoveTyping["Remove typing indicator"]
RemoveTyping --> AppendCoach["Append coach response from chatResponses"]
AppendCoach --> IncrementIndex["Increment response index"]
IncrementIndex --> End
```

**Diagram sources**
- [index.html:565-681](file://index.html#L565-L681)

**Section sources**
- [index.html:565-681](file://index.html#L565-L681)

### Multi-Agent Pipeline Customization
- Location: Agent cards grid and runPipeline function control the visual flow of sub-agents.
- How to add a new agent:
  - Duplicate an existing agent card block and update its label, role, and icon
  - Ensure the card has a unique data-agent attribute
  - Optionally adjust gradient colors to match the new agent’s theme
- Animation logic:
  - runPipeline iterates over agent cards, highlighting each in sequence
  - Status dots change color to indicate active/completed states
  - Button state reflects analysis progress and completion

```mermaid
sequenceDiagram
participant U as "User"
participant Btn as "Run Analysis Button"
participant JS as "runPipeline()"
participant Cards as "Agent Cards"
U->>Btn : Click
Btn->>JS : runPipeline()
JS->>Cards : Reset active states
loop For each agent
JS->>Cards : Mark previous as completed
JS->>Cards : Mark current as active (pulse)
JS->>JS : Wait interval
end
JS->>Btn : Set text to "Analysis Complete"
JS->>Btn : Reset after delay
```

**Diagram sources**
- [index.html:228-281](file://index.html#L228-L281)
- [index.html:630-657](file://index.html#L630-L657)

**Section sources**
- [index.html:228-281](file://index.html#L228-L281)
- [index.html:630-657](file://index.html#L630-L657)

### Market Data Sections Customization
- Location: Market insights section contains Local and Remote tabs with content blocks.
- How to extend:
  - Add a new tab button and corresponding content container
  - Update switchTab to handle the new tab ID and toggle visibility
  - Populate content blocks with new roles, salary ranges, platforms, or hubs
- Current structure:
  - Two tabs: Local and Remote
  - Each tab shows three columns: demand, salary, and platforms/hubs

```mermaid
flowchart TD
Start(["Switch Tab"]) --> ClearActive["Remove active class from all tabs"]
ClearActive --> SetActive["Set active class on clicked tab"]
SetActive --> CheckTab{"Target tab?"}
CheckTab --> |Local| HideRemote["Hide remote section"]
CheckTab --> |Remote| HideLocal["Hide local section"]
HideRemote --> End(["Done"])
HideLocal --> End
```

**Diagram sources**
- [index.html:315-390](file://index.html#L315-L390)
- [index.html:659-665](file://index.html#L659-L665)

**Section sources**
- [index.html:315-390](file://index.html#L315-L390)
- [index.html:659-665](file://index.html#L659-L665)

### 4-Week Action Plan Customization
- Location: Four weekly cards with checklist items and week labels/descriptions.
- How to customize:
  - Edit checklist item text to reflect new tasks or milestones
  - Change week titles and subtitles to align with your curriculum or goals
  - Adjust initial checked states to represent starting points
- Tips:
  - Keep tasks actionable and time-bound
  - Group related tasks under each week for clarity

```mermaid
flowchart TD
Start(["Open Plan Section"]) --> Week1["Week 1: Foundation"]
Week1 --> Week2["Week 2: Build"]
Week2 --> Week3["Week 3: ML Intro"]
Week3 --> Week4["Week 4: Launch"]
Week4 --> End(["Track Progress"])
```

**Diagram sources**
- [index.html:392-458](file://index.html#L392-L458)

**Section sources**
- [index.html:392-458](file://index.html#L392-L458)

### Styling and Theme Customization
- Tailwind config:
  - Colors: Define brand palette and extend theme colors
  - Fonts: Configure sans-serif font stack
- Custom CSS:
  - Glass effect, glow, score ring, and animations
  - Scrollbar styling and component transitions
- Responsive design:
  - Grid layouts adapt across breakpoints (sm, md, lg)
  - Navigation hides/shows based on screen size

```mermaid
graph TB
T["Tailwind Config"] --> C["Custom CSS"]
C --> UI["UI Components"]
UI --> R["Responsive Layouts"]
```

**Diagram sources**
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)
- [index.html:47-527](file://index.html#L47-L527)

**Section sources**
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)
- [index.html:47-527](file://index.html#L47-L527)

## Dependency Analysis
Within this single-file prototype:
- JavaScript depends on DOM elements identified by IDs and classes
- UI sections rely on Tailwind utility classes and custom CSS
- Pipeline animation depends on agent card structure and status dot elements
- Market tabs depend on tab buttons and content containers with specific IDs

Potential coupling points:
- Changing agent card structure may require updates to runPipeline iteration logic
- Adding new tabs requires updating switchTab to handle additional IDs
- Modifying chat responses does not affect other components but should maintain consistent formatting

```mermaid
graph LR
JS["JavaScript"] --> CHAT["Chat UI"]
JS --> PIPE["Pipeline UI"]
JS --> TABS["Market Tabs"]
CSS["Custom CSS"] --> UI["UI Sections"]
TW["Tailwind Config"] --> UI
```

**Diagram sources**
- [index.html:565-681](file://index.html#L565-L681)
- [index.html:172-226](file://index.html#L172-L226)
- [index.html:228-281](file://index.html#L228-L281)
- [index.html:315-390](file://index.html#L315-L390)
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)

**Section sources**
- [index.html:565-681](file://index.html#L565-L681)
- [index.html:172-226](file://index.html#L172-L226)
- [index.html:228-281](file://index.html#L228-L281)
- [index.html:315-390](file://index.html#L315-L390)
- [index.html:10-21](file://index.html#L10-L21)
- [index.html:22-43](file://index.html#L22-L43)

## Performance Considerations
- Keep chat responses concise to avoid long DOM updates
- Limit the number of agent cards to maintain smooth animation performance
- Prefer minimal reflows by toggling visibility rather than recreating elements
- Use Tailwind utilities to reduce custom CSS complexity
- Debounce frequent interactions if adding more dynamic features later

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and fixes:
- Chat not responding:
  - Ensure chatInput element exists and event handlers are attached
  - Verify chatResponses array is defined and non-empty
- Pipeline animation not working:
  - Confirm agent cards have correct classes and status dot elements
  - Check that runPipeline targets .agent-card nodes correctly
- Market tabs not switching:
  - Ensure tab buttons call switchTab with correct arguments
  - Verify content containers have matching IDs and hidden class toggling
- Modal not opening/closing:
  - Confirm openEditProfile/closeEditProfile functions reference correct IDs
  - Check that modal container has proper hidden class management

**Section sources**
- [index.html:565-681](file://index.html#L565-L681)
- [index.html:529-562](file://index.html#L529-L562)

## Conclusion
You can confidently customize CareerCompass by editing the chat responses, extending the multi-agent pipeline, expanding market data sections, and tailoring the 4-week action plan. Use Tailwind config and custom CSS to adjust themes and animations. Maintain clear structure and comments to keep the single-file prototype readable and maintainable.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Practical Examples

- Adapting for different student profiles:
  - Update profile fields and interests in the UI
  - Adjust skill match percentages and gaps to reflect new backgrounds
  - Modify chat responses to address new goals and constraints

- Adding new career paths beyond AI/ML and Full Stack:
  - Insert new tabs or sections under Market Insights
  - Add relevant skills and project recommendations
  - Update action plan weeks to include path-specific tasks

- Integrating with external APIs for real-time data:
  - Replace static arrays with fetch calls to retrieve live data
  - Handle loading states and errors gracefully
  - Cache results locally to improve responsiveness

[No sources needed since this section provides conceptual guidance]