# 4. Results and Evaluation

## 4.1 System Outcomes

SmartMeal is a full-stack meal planning and kitchen management web application implemented with a FastAPI backend and a React (Vite) frontend, using MongoDB as the primary data store. The completed system delivers the following outcomes:

- Secure user access via JWT-based authentication (login/register), Google Sign-In support, and account recovery flows (OTP-based password reset).
- A user dashboard that supports pantry/inventory tracking, recipe browsing/management, meal scheduling, shopping list management, leftovers tracking, and budgeting.
- Inventory-aware meal scheduling that checks recipe ingredients against current inventory, performs unit-aware missing-quantity calculations, and stores per-meal snapshots (warnings and ingredient requirements) for consistent display.
- Leftover management with tracking, an expiring-soon view, and a "mark used" workflow to support food waste reduction.
- Budget tracking via user-scoped budgets and expenses, including a computed summary (total spent, remaining, percentage used, and threshold warnings).
- Recipe recommendation/search using a TF-IDF + cosine similarity approach, backed by a preprocessed recipe dataset.
- Administrative endpoints for user/inventory views, metrics, and basic analytics, enabling system monitoring and reporting.

Overall, the solution provides an integrated workflow: users can maintain an up-to-date inventory, plan meals, identify missing ingredients, and manage spending and leftovers within the same application.

## 4.2 System Functionality and Performance Evaluation

Evaluation was carried out using a combination of implementation-level verification (route logic, validation behavior, and data flow) and development-run evidence from backend and frontend logs produced during local execution on April 26, 2026. Recommendation query timings were measured on April 28, 2026 using the backend recommendation service in a local run. The evaluation focuses on functional correctness, the recommendation engine behavior, and performance-oriented design choices.

### 4.2.1 Functional Verification (Representative Scenarios)

The table below summarizes representative system-level scenarios supported by the implemented backend routes and frontend pages.

| ID | Area | Scenario | Expected System Behavior (Implementation) |
|---|---|---|---|
| SM-01 | Authentication | Login with valid credentials | Returns JWT access token and user profile; protected endpoints require `Authorization: Bearer <token>`. |
| SM-02 | Authentication | Access `/api/auth/me` without token | Returns `401 Not authenticated`. |
| SM-03 | Account recovery | Forgot password + OTP verification | Stores OTP with expiry and verifies OTP before password reset/update. |
| SM-04 | Inventory | Add/update/delete inventory items | CRUD operations are user-scoped; list supports pagination (`page`, `limit`). |
| SM-05 | Recipes | Create/update/delete recipe as authenticated user | Recipe creation/update requires authentication; update/delete enforces creator ownership rules in the service layer. |
| SM-06 | Meal scheduling | Create meal for a past date | Returns `400` and blocks scheduling for past dates. |
| SM-07 | Meal scheduling | Create duplicate meal (same date + type) | Returns `400` and blocks duplicates for the same user/date/type combination. |
| SM-08 | Meal scheduling + inventory | Create meal with insufficient inventory | Generates warnings based on missing quantities and stores warning/ingredient snapshots for consistent display. |
| SM-09 | Shopping list | View shopping stats | Returns counts for shopping list items and supports user scoping/filtering. |
| SM-10 | Leftovers | Expiring-soon view | Returns leftovers with expiry dates before a configurable cutoff window. |
| SM-11 | Budget | Summary endpoint | Computes totals (spent/remaining/percentage used) and returns boolean flags for over-budget and threshold warnings. |
| SM-12 | Notifications | Fetch unread notifications | Supports filtering for unread items and returns recent notifications. |

### 4.2.2 Recommendation Engine Evaluation (TF-IDF Recipe Search)

SmartMeal includes an AI-assisted recipe search/recommendation capability based on TF-IDF vectorization and cosine similarity. The recommendation artifacts are built from a preprocessed recipe dataset:

- Raw dataset rows: 4,236
- Rows translated during preprocessing: 1,022
- Final processed dataset rows used for recommendations: 4,225 (9 columns)

For efficiency, the recommendation service caches vectorization artifacts in memory after the first call. This reduces repeated-query latency in a running backend process.

Observed local performance (development environment):

- Cold start (first recommendation call in a new process): ~2.33 s
- Warm calls (subsequent calls in the same process): median ~0.33 s across 5 runs

These measurements reflect dataset loading and artifact reuse behavior and demonstrate that caching improves responsiveness for repeated searches.

### 4.2.3 System Performance (Response Time and Efficiency Design)

Key implementation choices that support responsiveness and scalability include:

- Asynchronous I/O: The backend uses async route handlers and asynchronous MongoDB access to keep request handling non-blocking.
- Reduced database round trips: Meal scheduling aggregates recipe/inventory lookups using single-query patterns (e.g., fetching inventory items for all required ingredient names in one query).
- Concurrent updates: Inventory quantity updates triggered by meal creation (and restoration on deletion) are executed concurrently using batched async tasks (`asyncio.gather`) rather than sequential writes.
- Cached recommendation artifacts: TF-IDF vectorizers and similarity matrices are retained in memory after initialization to reduce per-query compute overhead.

### 4.2.4 User Experience and Usability

The frontend provides a modular UI that supports key user journeys:

- Authentication pages (login/register), password reset flows, and profile/settings features.
- User-facing pages for inventory, meal scheduling, leftovers, budgets, shopping list management, notifications, and recommendations.
- Administrative pages for user management, ingredient/inventory views, notifications, and analytics.

Usability is supported through consistent navigation, form-driven workflows, and structured API error messages (including user-friendly formatting of validation errors).

### 4.2.5 Limitations and Recommended Enhancements

The current implementation provides type-level request validation via Pydantic models and business-rule checks in selected modules (e.g., meal scheduling date/duplicate constraints). For stronger data integrity and safer user input handling, the following enhancements are recommended:

- Add explicit domain validations for leftover dates (e.g., cooked date not in the future, expiry after cooked) and for budget/expense amounts (e.g., positive amounts and rounding rules).
- Expand automated tests to cover authenticated end-to-end flows (JWT acquisition, protected CRUD flows) against an isolated test database to avoid impacting production data.

# 5. Conclusion

SmartMeal delivers an integrated web application for meal planning, kitchen inventory management, budgeting, leftover tracking, and recipe discovery. The backend and frontend modules work together to support end-to-end workflows such as scheduling meals based on available inventory and identifying missing ingredients.

The recommendation feature uses a TF-IDF + cosine similarity approach over a curated dataset of 4,225 recipes and benefits from cached artifacts to improve repeated-query responsiveness. Overall, the system demonstrates how a modern web stack (FastAPI, React, MongoDB) can be combined with lightweight NLP-based recommendation techniques to provide practical, user-centered functionality for day-to-day meal planning.

# References

[1] FastAPI Documentation. https://fastapi.tiangolo.com/

[2] MongoDB Documentation. https://www.mongodb.com/docs/

[3] React Documentation. https://react.dev/

[4] Vite Documentation. https://vitejs.dev/

[5] Firebase Authentication Documentation. https://firebase.google.com/docs/auth

[6] scikit-learn Documentation (TF-IDF and cosine similarity). https://scikit-learn.org/stable/
