import pandas as pd
import re
from pathlib import Path

# ---------------------------------------------------
# BASE DIRECTORY SETUP
# ---------------------------------------------------
# This points to the "app" folder safely
BASE_DIR = Path(__file__).resolve().parent.parent

# Path to your CSV file
DATA_PATH = BASE_DIR / "data" / "raw" / "cuisines.csv"


# ---------------------------------------------------
# LOAD RAW DATASET
# ---------------------------------------------------
def load_raw_data():
    
    df = pd.read_csv(DATA_PATH)
    return df


# ---------------------------------------------------
# CLEAN TEXT
# ---------------------------------------------------
def clean_text(text):
  
    if pd.isna(text):
        return ""
    return str(text).lower().strip()


# ---------------------------------------------------
# NORMALIZE INGREDIENTS
# ---------------------------------------------------
def normalize_ingredients(text):
   
    if not text:
        return ""

    # Keep only letters, commas and spaces
    text = re.sub(r"[^a-zA-Z,\s]", "", text)

    # Split by comma because ingredients are usually comma-separated
    ingredients = text.split(",")

    # Word mapping for standardization
    mapping = {
        "tomatoes": "tomato",
        "onions": "onion",
        "chilies": "chili",
        "chillies": "chili",
        "potatoes": "potato",
        "capsicum": "bell pepper",
        "curd": "yogurt"
    }

    cleaned = []

    for item in ingredients:
        item = item.strip()
        words = item.split()

        normalized_words = [mapping.get(word, word) for word in words]
        cleaned.append(" ".join(normalized_words))

    return " ".join(cleaned)


# ---------------------------------------------------
# PROCESS DATASET
# ---------------------------------------------------
def process_dataset():
   
    df = load_raw_data()

    required_columns = [
        "name",
        "ingredients",
        "cuisine",
        "course",
        "diet",
        "instructions",
        "prep_time"
    ]

    print("Available columns:", df.columns.tolist())

    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}\n"
            f"Available columns: {df.columns.tolist()}"
        )

    # Keep only useful columns
    df = df[required_columns]

    # Clean text columns
    for col in ["name", "ingredients", "cuisine", "course", "diet", "instructions"]:
        df[col] = df[col].apply(clean_text)

    # Remove rows where ingredients are empty
    df = df[df["ingredients"] != ""]

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Normalize ingredients
    df["ingredients_clean"] = df["ingredients"].apply(normalize_ingredients)

    # Combine important fields into one searchable field
    df["combined_features"] = df.apply(
        lambda row: " ".join([
            row["ingredients_clean"],
            row["cuisine"],
            row["diet"],
            row["course"]
        ]),
        axis=1
    )

    return df


# ---------------------------------------------------
# SAVE PROCESSED DATA
# ---------------------------------------------------
def save_processed_data():
   
    df = process_dataset()

    output_path = BASE_DIR / "data" / "processed" / "processed_recipes.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(output_path, index=False)

    print("Processed dataset saved at:", output_path)


# ---------------------------------------------------
# LOAD PROCESSED DATA
# ---------------------------------------------------
def load_processed_data():

    path = BASE_DIR / "data" / "processed" / "processed_recipes.csv"
    return pd.read_csv(path)


# ---------------------------------------------------
# PROCESS USER INPUT
# ---------------------------------------------------
def process_user_input(user_input: dict):
  
    ingredients = normalize_ingredients(user_input.get("ingredients", ""))
    cuisine = clean_text(user_input.get("cuisine", ""))
    diet = clean_text(user_input.get("diet", ""))
    course = clean_text(user_input.get("course", ""))

    combined = " ".join([ingredients, cuisine, diet, course])

    return combined