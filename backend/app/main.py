from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import meal_schedule_routes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend Running"}

app.include_router(
    meal_schedule_routes.router,
    prefix="/meal-schedules",
)