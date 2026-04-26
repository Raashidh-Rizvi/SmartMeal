from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.db.database import connect_to_mongo, close_mongo_connection
from app.db.init_db import create_indexes
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.admin_routes import router as admin_router
from app.routes.admin_ingredient_routes import router as admin_ingredient_router
from app.routes.inventory_routes import router as inventory_router
from app.routes.shopping_routes import router as shopping_router
from app.routes.recipes import router as recipes_router
from app.routes.upload import router as upload_router
from app.routes.meal_schedule_routes import router as meal_schedule_router
from app.routes.leftovers import router as leftovers_router
from app.routes.budget import router as budget_router
from app.routes.leftover_ai_routes import router as leftover_ai_router
from app.routes.notification_routes import router as notification_router
from app.routes.recommendation_routes import router as recommendation_router
from app.routes.images import router as images_router
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _format_validation_error(error: dict) -> str:
    """Format a single validation error into a user-friendly message."""
    loc = error.get("loc")
    msg = error.get("msg", "Validation failed")
    
    # Build field path (e.g., "ingredients[0].unit")
    if loc:
        field_path = ".".join(str(x) for x in loc)
    else:
        field_path = "Unknown field"
    
    # Extract the actual error message (may be wrapped in "Value error, ")
    if "Value error, " in msg:
        actual_msg = msg.replace("Value error, ", "")
    else:
        actual_msg = msg
        
    if actual_msg.startswith("Field required") or actual_msg.startswith("Input should be") or actual_msg.startswith("String should have") or actual_msg.startswith("List should have"):
        if loc:
            path_parts = [str(x) for x in loc if x != 'body']
            field_path = " ".join(path_parts)
            return f"{field_path}: {actual_msg}"
    
    return actual_msg

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await create_indexes()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title="SmartMeal API", lifespan=lifespan)

# Custom exception handler for request validation errors - formats them nicely
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic validation errors into user-friendly messages."""
    errors = exc.errors()
    formatted_msg = _format_validation_error(errors[0]) if errors else "Validation failed"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": formatted_msg}
    )

# Serve uploaded images as static files
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(STATIC_DIR, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# CORS must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:7001",
        "http://127.0.0.1:7001",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:7002",
        "http://127.0.0.1:7002",
        "http://localhost:7003",
        "http://127.0.0.1:7003",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["user-inventory"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_ingredient_router, prefix="/api/admin", tags=["admin-ingredients"])
app.include_router(shopping_router, prefix="/api", tags=["shopping"])
app.include_router(recipes_router, prefix="/api/recipes", tags=["recipes"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(meal_schedule_router, prefix="/api/meal-schedules", tags=["meal-schedules"])
app.include_router(leftovers_router)
app.include_router(budget_router)
app.include_router(leftover_ai_router)
app.include_router(notification_router, prefix="/api/notifications", tags=["notifications"])
app.include_router(recommendation_router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(images_router, prefix="/api/images", tags=["images"])

@app.get("/")
async def root():
    return {"message": "Welcome to SmartMeal API"}
