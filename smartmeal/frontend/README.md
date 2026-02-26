# SmartMeal Frontend Server

This is the React frontend for the SmartMeal application. It is constructed using Vite, React Router, and Axios, with a responsive UI built on standard CSS.

## Requirements

- Node.js (Version 18+ recommended)
- NPM or Yarn

## Installation & Setup

1. **Navigate to the Frontend Directory:**
   In your terminal, navigate to the `frontend` folder:

   ```bash
   cd d:\Project\SmartRecipe\smartmeal\frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```
   _(If you've just generated the template or cloned the repo, you must run this step!)_

## Running the Application

To start the Vite development server with hot-module replacement (HMR), run the following command from inside the `frontend` folder:

```bash
npm run dev
```

- The local development server will start on `http://localhost:7001/`.
- **Note:** Ensure your backend API is also running on port `8001`, as the Axios API client is configured to send requests there (`http://localhost:8001`).

## Building for Production

If you need to compile the application for production deployment, run:

```bash
npm run build
```

This generates an optimized static build inside of the `dist` directory.
