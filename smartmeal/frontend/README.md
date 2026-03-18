# SmartMeal — Frontend

React frontend for SmartMeal, built with Vite and React Router. Communicates with the FastAPI backend over REST (Axios) and uses Firebase for Google Sign-In.

## Stack

- **React 19** — UI library
- **React Router v7** — client-side routing
- **Axios** — HTTP client (configured for `http://localhost:8001`)
- **Firebase** — Google Auth (popup-based sign-in)
- **Vite 7** — build tool & dev server
- **ESLint 9** — linting

## Setup

### 1. Install dependencies

```powershell
cd d:\Project\SmartRecipe\smartmeal\frontend
npm install
```

### 2. Configure environment (optional)

To override the backend URL, create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8001
```

If this variable is not set, the Axios client defaults to `http://localhost:8001`.

### 3. Start the development server

```powershell
npm run dev
```

App runs at → `http://localhost:7001`

> Make sure the backend is running at `http://localhost:8001` before using the app.

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server with HMR       |
| `npm run build`   | Production build → `dist/`           |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Lint with ESLint 9                   |

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js                  # Axios instance (baseURL, auth header injection)
│   ├── components/
│   │   ├── AdminRoute.jsx            # Guard: redirects non-admins
│   │   ├── Footer.jsx                # Site-wide footer
│   │   ├── Navbar.jsx                # Top navigation bar
│   │   └── ProtectedRoute.jsx        # Guard: redirects unauthenticated users
│   ├── context/
│   │   ├── AuthContext.jsx           # Auth state (JWT + Firebase Google login)
│   │   ├── ThemeContext.jsx          # Dark/light mode state
│   │   └── firebase.js               # Firebase app initialisation
│   ├── pages/
│   │   ├── authentication/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── users/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   └── DeleteAccount.jsx
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminUserEdit.jsx
│   │   │   ├── AdminInventory.jsx
│   │   │   └── AdminNotifications.jsx
│   │   ├── Inventory.jsx
│   │   ├── MealPlan.jsx
│   │   ├── Recommendations.jsx
│   │   └── ShoppingList.jsx
│   ├── App.jsx                       # Route definitions
│   ├── App.css
│   ├── index.css
│   └── main.jsx                      # App entry point
├── index.html
├── vite.config.js
└── package.json
```

## Backend Connection

The Axios client in `src/api/axios.js` sends every request to `http://localhost:8001/api` and automatically attaches the JWT token from `localStorage` as a `Bearer` header.

To change the backend URL, set `VITE_API_BASE_URL` in a `.env` file (see Setup above).

## Building for Production

```powershell
npm run build
```

Output is written to `frontend/dist/`. Serve it with any static host or run `npm run preview` to test the build locally.
