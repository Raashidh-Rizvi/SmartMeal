from pydantic import BaseModel

class MealSchedule(BaseModel):
    user_id: str
    recipe_id: str
    meal_date: str
    meal_type: str
    status: str = "planned"
