This directory is for business logic services called by the API routes.

Each service module should handle a specific domain (e.g. recipe_service.py,
inventory_service.py) and expose async functions that the route handlers call.

Keep database queries out of route files — put them here.
