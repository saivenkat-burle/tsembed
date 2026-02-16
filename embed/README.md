# ThoughtSpot Embed SDK - React Demo App

A comprehensive React demo application showcasing the [ThoughtSpot Visual Embed SDK](https://developers.thoughtspot.com/docs/). It includes working examples of Liveboard embeds, Search embeds, Spotter (AI) embeds, Full App embeds, Host Events, Custom Actions, Runtime Filters, TML management, and more.

---

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

| Tool        | Version                           | Install                                  |
| ----------- | --------------------------------- | ---------------------------------------- |
| **Node.js** | v18 or higher                     | [https://nodejs.org](https://nodejs.org) |
| **npm**     | v9 or higher (comes with Node.js) | Included with Node.js                    |

Verify your installation:

```bash
node -v
npm -v
```

You will also need:

- A **ThoughtSpot** instance (cloud or software) with embed enabled
- A **backend server** running on port `3001` that handles authentication and ThoughtSpot REST API calls (see [Backend Server](#backend-server) section below)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install Dependencies

```bash
npm install
```

This installs the following key dependencies:

| Package                         | Purpose                                |
| ------------------------------- | -------------------------------------- |
| `@thoughtspot/visual-embed-sdk` | ThoughtSpot Visual Embed SDK for React |
| `react` / `react-dom`           | React framework                        |
| `axios`                         | HTTP client for backend API calls      |
| `vite`                          | Development server and build tool      |

### 3. Configure ThoughtSpot Connection

Open `src/main.jsx` and update the following values:

```js
const authStatus = init({
  thoughtSpotHost: "https://YOUR_INSTANCE.thoughtspot.cloud/", // <-- Your ThoughtSpot URL
  authType: AuthType.TrustedAuthTokenCookieless,
  autoLogin: false,
  getAuthToken: async () => {
    const response = await axios.get("/api/get-token"); // <-- Your backend token endpoint
    return response.data;
  },
});
```

**`thoughtSpotHost`** — Replace with your ThoughtSpot instance URL (e.g., `https://mycompany.thoughtspot.cloud/`).

**`authType`** — The demo uses `TrustedAuthTokenCookieless`. Other supported types:

- `AuthType.SAMLRedirect` — For SAML SSO
- `AuthType.OIDCRedirect` — For OpenID Connect
- `AuthType.Basic` — For dev/testing only (username + password)
- `AuthType.None` — If the user is already authenticated

See the [Authentication Guide](https://developers.thoughtspot.com/docs/embed-auth) for details.

### 4. Replace ThoughtSpot Object GUIDs

The demo has hardcoded GUIDs that point to sample content. You **must** replace these with IDs from your own ThoughtSpot instance.

| File                           | What to Replace                                          | How to Find It                                             |
| ------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------- |
| `src/App.jsx`                  | `liveboardId`, `vizId`, `answerId`, `worksheetId`        | Open the object in ThoughtSpot, copy the GUID from the URL |
| `src/LiveboardHostPage.jsx`    | `DEFAULT_LIVEBOARD_ID`                                   | Liveboard URL → GUID after `/pinboard/`                    |
| `src/DrillDown.jsx`            | `LIVEBOARD_ID`, column `id` values in `MY_DRILL_COLUMNS` | Liveboard URL and column metadata API                      |
| `src/SpotterEmbed.jsx`         | `worksheetId`                                            | Worksheet URL → GUID                                       |
| `src/Link.jsx`                 | `LIVEBOARD_ID`, `TARGET_COLUMN`                          | Liveboard URL and column name                              |
| `src/Tiles.jsx`                | `liveboardId`, `vizId`                                   | Liveboard URL and viz URL                                  |
| `src/Iframe.jsx`               | `tsHost`, `liveboardId`                                  | Your ThoughtSpot host and Liveboard GUID                   |
| `src/ContextDrivenSpotter.jsx` | `MODEL_NAMES` array                                      | Names of your worksheets in ThoughtSpot                    |
| `src/CustomSpotter.jsx`        | `worksheetName` in `panels` array                        | Names of your worksheets in ThoughtSpot                    |

Note :To find any object's GUID, open it in ThoughtSpot and look at the browser URL. The GUID is the long alphanumeric string (e.g., `3e6785e1-89d6-4549-8b66-7588cd7d599e`).

### 5. Start the Backend Server

This frontend app expects a backend server running on **`http://localhost:3001`**. The Vite dev server proxies all `/api` requests to it (configured in `vite.config.js`).

Your backend API endpoints:

| Method | Endpoint                       | Purpose                                                                |
| ------ | ------------------------------ | ---------------------------------------------------------------------- |
| `GET`  | `/api/get-token`               | Returns a Trusted Auth token for the current user                      |
| `GET`  | `/api/liveboards`              | Returns a list of Liveboards (with `id`, `name`, `isFavorite`, `tags`) |
| `POST` | `/api/create-liveboard`        | Creates a new Liveboard (`{ name, description }`)                      |
| `POST` | `/api/liveboard/favorite`      | Marks/unmarks a Liveboard as favorite (`{ liveboardId, action }`)      |
| `POST` | `/api/liveboard/copy`          | Copies a Liveboard (`{ liveboardId, newName }`)                        |
| `GET`  | `/api/find-worksheet?name=...` | Returns the GUID of a worksheet by name                                |
| `POST` | `/api/columns`                 | Returns column metadata for a worksheet (`{ worksheetId }`)            |
| `POST` | `/api/tml/export-by-name`      | Exports TML for an object (`{ name, type }`)                           |
| `POST` | `/api/tml/import`              | Imports/updates TML (`{ tmlString }`)                                  |

These backend endpoints should use the [ThoughtSpot REST API v2](https://developers.thoughtspot.com/docs/restV2-playground) with a service account or trusted auth secret to generate tokens and fetch data.

### 6. Run the Dev Server

```bash
npm run dev
```

The app will be available at **`http://localhost:5173`** (Vite's default port).

Make sure your backend server is also running on port `3001` before opening the app.

---

## Demo Pages

The app renders a top navigation bar with the following demo pages:

### Components

Showcases the four core embed types side by side with a sidebar navigation:

- **LiveboardEmbed** — Embed a single Liveboard or viz with runtime filters
- **SearchEmbed** — Embed a saved answer with disabled/hidden actions
- **SpotterEmbed** — AI-powered natural language interface with runtime filters, parameters, custom actions, and sidebar config
- **AppEmbed** — Full ThoughtSpot application with modular homepage and sliding navbar

### Liveboard Host

A fully-featured Liveboard management page demonstrating:

- Liveboard picker dropdown with search
- Create new Liveboard via REST API
- Favorite/unfavorite Liveboards
- Copy Liveboards
- **Host Events**: `Reload`, `Edit`, `AIHighlights`
- **Custom Actions**: Programmatic "Edit" button on the Liveboard
- **Embed Events**: Error handling, AI Highlights listener

### DrillDown

Demonstrates custom drill-down behavior:

- Hides the native DrillDown action
- Adds a custom "Custom Drill Down" context-menu action
- Opens a curated column picker modal
- Triggers `HostEvent.DrillDown` with selected column GUID

### Spotter Embed

A standalone Spotter page with:

- **Runtime Filters** — Filter by Region dynamically from a dropdown
- **Runtime Parameters** — Pass a discount rate parameter
- Disabled actions and source selection

### Context Spotter

A context-driven Spotter builder that:

- Fetches worksheet metadata (measures + attributes) via REST API
- Lets users select metrics and attributes as chips
- Builds dynamic filter rows
- Constructs a natural language query and passes it to SpotterEmbed

### Custom Spotter

Demonstrates launching Spotter in a **modal overlay**:

- Sidebar with data source panels
- Dynamically resolves worksheet ID by name
- Opens Spotter in a full-screen modal

### TML Manager

A YAML editor for ThoughtSpot Modeling Language (TML):

- Export TML by object name and type (Liveboard, Answer, Worksheet, Connection)
- Edit TML in a code editor with dark theme
- Find & Replace functionality
- Import/publish changes back to ThoughtSpot

---

## Project Structure

```
embed/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite config with API proxy
├── eslint.config.js        # ESLint configuration
├── public/
│   └── vite.svg
├── src/
│   ├── main.jsx            # App entry — SDK init, auth, routing
│   ├── App.jsx             # Core embed components (Liveboard, Search, Spotter, AppEmbed)
│   ├── LiveboardHostPage.jsx  # Liveboard management + Host Events
│   ├── LiveboardPicker.jsx    # Liveboard explorer with tag/favorites filtering
│   ├── DrillDown.jsx          # Custom drill-down demo
│   ├── SpotterEmbed.jsx       # Spotter with runtime filters/parameters
│   ├── ContextDrivenSpotter.jsx # Context-driven Spotter builder
│   ├── CustomSpotter.jsx      # Spotter in a modal overlay
│   ├── TmlManager.jsx         # TML export/import editor
│   ├── Tiles.jsx              # KPI tile card
│   ├── Link.jsx               # Click-to-navigate from data points
│   ├── Full.jsx               # Full App embed (vanilla JS API)
│   ├── Iframe.jsx             # Raw iframe embed
│   ├── CreateDashboardModal.jsx # Modal for creating new Liveboards
│   ├── App.css                # Main stylesheet
│   ├── spotter.css            # Spotter-specific styles
│   ├── index.css              # Global CSS reset
│   └── assets/
│       ├── custom-spotter.svg
│       ├── samples-svgrepo-com.svg
│       └── react.svg
```

---

## Available Scripts

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the Vite development server with hot reload |
| `npm run build`   | Build the app for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally              |
| `npm run lint`    | Run ESLint to check for code issues               |

---

## Customization

### Changing the Auth Method

In `src/main.jsx`, swap the `authType` and update accordingly:

```js
// For SAML SSO:
authType: AuthType.SAMLRedirect,

// For Basic Auth (dev only):
authType: AuthType.Basic,
username: "your-username",
password: "your-password",

// For no auth (user already logged in):
authType: AuthType.None,
```

### Custom CSS / Theming

The SDK supports custom CSS variables and rules. In `src/main.jsx`, update the `customizations` block:

```js
customizations: {
  style: {
    customCSS: {
      variables: {
        "--ts-var-root-background": "#f5f5f5",
        "--ts-var-nav-background": "#1a1a2e",
      },
      rules_UNSTABLE: {
        ".bk-header": { "display": "none" },
      },
    },
  },
},
```

See the [Custom CSS Guide](https://developers.thoughtspot.com/docs/custom-css) for all available variables.

### Custom Spotter Icon

The demo includes a custom Spotter icon SVG. To change it, update the `iconSpriteUrl` in `src/main.jsx`:

```js
iconSpriteUrl: "https://your-cdn.com/your-custom-icon.svg",
```

---

## Troubleshooting

| Issue                         | Solution                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Blank embed / loading forever | Check browser console for auth errors. Verify your `thoughtSpotHost` URL and token endpoint.                |
| CORS errors                   | Make sure your ThoughtSpot instance has your app's origin in the CSP allowlist (Admin > Security Settings). |
| "Could not fetch liveboards"  | Ensure your backend server is running on port 3001.                                                         |
| Token fetch fails             | Verify your backend's `/api/get-token` returns a valid trusted auth token string.                           |
| GUIDs not found               | Replace all hardcoded GUIDs with IDs from your own ThoughtSpot instance.                                    |
