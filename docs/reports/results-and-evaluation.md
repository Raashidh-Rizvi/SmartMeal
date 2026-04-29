# Results and Evaluation

## System Outcomes

SmartMeal delivers a unified workflow for pantry management, meal planning, leftovers, budgeting, shopping lists, and recipe discovery through a FastAPI backend, React frontend, and MongoDB data layer.

Key implemented outcomes include:

- JWT authentication, Google Sign-In, and password recovery
- Inventory-aware meal scheduling with missing-ingredient detection
- Leftover tracking and food-waste reduction flows
- Budget and expense tracking with computed summaries
- Recipe recommendation based on TF-IDF and cosine similarity
- Admin analytics and management endpoints

## Functional Evaluation

Representative implemented scenarios include:

- Valid login returns a JWT and user profile
- Protected endpoints reject unauthenticated requests
- Inventory CRUD is user scoped
- Meal scheduling blocks past dates and duplicate meals
- Shopping list APIs return scoped item counts and details
- Budget summary returns spent, remaining, and usage metrics

## Recommendation Engine Evaluation

The recommendation workflow uses a preprocessed recipe dataset and cached vectorization artifacts.

- Raw dataset rows: `4236`
- Rows translated during preprocessing: `1022`
- Final processed dataset rows: `4225`
- Cold recommendation call: about `2.33s`
- Warm recommendation calls: median about `0.33s`

These results show clear latency improvement once artifacts are cached in memory.

## Performance Design Notes

- Async route handlers and async MongoDB access reduce blocking
- Batched inventory lookups reduce repeated database round trips
- Concurrent update patterns improve meal-scheduling performance
- Cached recommendation artifacts improve repeated-query responsiveness

## Conclusion

SmartMeal combines practical kitchen-management workflows with lightweight AI-assisted recipe functionality in a modern web stack. The implemented system supports realistic day-to-day use while remaining maintainable and extensible.
