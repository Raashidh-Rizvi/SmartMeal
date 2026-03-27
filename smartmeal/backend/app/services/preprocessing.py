import json
import pandas as pd
import re
from pathlib import Path

# ---------------------------------------------------
# BASE DIRECTORY SETUP
# ---------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "raw" / "cuisines.csv"

PROCESSED_DIR = BASE_DIR / "data" / "processed"
WORKING_PATH = PROCESSED_DIR / "processed_recipes_working1.csv"
FINAL_OUTPUT_PATH = PROCESSED_DIR / "processed_recipes1.csv"
REMOVED_ROWS_PATH = PROCESSED_DIR / "removed_non_english_rows1.csv"
STATUS_PATH = PROCESSED_DIR / "preprocessing_status1.json"

# ---------------------------------------------------
# CONFIG
# ---------------------------------------------------
NON_ENGLISH_SCRIPT_PATTERN = re.compile(r"[\u0B80-\u0BFF\u0900-\u097F]")

REQUIRED_COLUMNS = [
    "name",
    "ingredients",
    "cuisine",
    "course",
    "diet",
    "instructions",
    "prep_time"
]

TEXT_COLUMNS = [
    "name",
    "ingredients",
    "cuisine",
    "course",
    "diet",
    "instructions"
]


# ---------------------------------------------------
# HELPERS
# ---------------------------------------------------
def ensure_processed_dir():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def contains_non_english(text) -> bool:
    if pd.isna(text) or not str(text).strip():
        return False
    return bool(NON_ENGLISH_SCRIPT_PATTERN.search(str(text)))


def normalize_ingredients(text):
    if pd.isna(text) or not str(text).strip():
        return ""

    text = clean_text(text)
    text = re.sub(r"[^a-zA-Z,\s]", "", text)

    ingredients = text.split(",")

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
        if not item:
            continue

        words = item.split()
        normalized_words = [mapping.get(word, word) for word in words]
        cleaned.append(" ".join(normalized_words))

    return " ".join(cleaned)


def row_has_non_english(row) -> bool:
    for col in TEXT_COLUMNS:
        if contains_non_english(row[col]):
            return True
    return False


def save_status_file(status_data: dict):
    with open(STATUS_PATH, "w", encoding="utf-8") as f:
        json.dump(status_data, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------
# RAW DATA
# ---------------------------------------------------
def load_raw_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"CSV file not found at: {DATA_PATH}")
    return pd.read_csv(DATA_PATH)


def validate_required_columns(df: pd.DataFrame):
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}\n"
            f"Available columns: {df.columns.tolist()}"
        )


# ---------------------------------------------------
# ANALYSIS
# ---------------------------------------------------
def print_non_english_counts(df: pd.DataFrame):
    print("\nNon-English counts by column:")
    counts = {}

    for col in TEXT_COLUMNS:
        count = int(df[col].apply(contains_non_english).sum())
        counts[col] = count
        print(f"{col}: {count}")

    total_rows_with_non_english = int(
        df[TEXT_COLUMNS].apply(
            lambda row: any(contains_non_english(value) for value in row),
            axis=1
        ).sum()
    )

    print(f"\nTotal rows containing Tamil/Hindi text in any text column: {total_rows_with_non_english}")
    return counts, total_rows_with_non_english


# ---------------------------------------------------
# PROCESSING
# ---------------------------------------------------
def process_dataset():
    ensure_processed_dir()

    df = load_raw_data()
    print("Available columns:", df.columns.tolist())

    validate_required_columns(df)
    df = df[REQUIRED_COLUMNS].copy()

    total_rows_before = len(df)

    column_counts, total_non_english_rows = print_non_english_counts(df)

    non_english_mask = df.apply(row_has_non_english, axis=1)

    removed_df = df[non_english_mask].copy()
    cleaned_df = df[~non_english_mask].copy()

    removed_df.to_csv(REMOVED_ROWS_PATH, index=False)

    print(f"\nDropped rows with Tamil/Hindi text: {len(removed_df)}")
    print(f"Remaining rows after drop: {len(cleaned_df)}")

    for col in TEXT_COLUMNS:
        cleaned_df[col] = cleaned_df[col].apply(clean_text)

    cleaned_df = cleaned_df[cleaned_df["ingredients"] != ""]
    cleaned_df = cleaned_df.drop_duplicates()

    cleaned_df["ingredients_clean"] = cleaned_df["ingredients"].apply(normalize_ingredients)

    cleaned_df["combined_features"] = cleaned_df.apply(
        lambda row: " ".join([
            row["ingredients_clean"],
            row["cuisine"],
            row["diet"],
            row["course"]
        ]).strip(),
        axis=1
    )

    cleaned_df.to_csv(WORKING_PATH, index=False)
    cleaned_df.to_csv(FINAL_OUTPUT_PATH, index=False)

    status_data = {
        "status": "completed",
        "input_file": str(DATA_PATH),
        "working_file": str(WORKING_PATH),
        "final_output_file": str(FINAL_OUTPUT_PATH),
        "removed_rows_file": str(REMOVED_ROWS_PATH),
        "total_rows_before": int(total_rows_before),
        "total_rows_with_non_english": int(total_non_english_rows),
        "rows_removed": int(len(removed_df)),
        "rows_remaining_after_drop": int(len(cleaned_df)),
        "non_english_counts_by_column": column_counts
    }
    save_status_file(status_data)

    print(f"\nWorking file saved at: {WORKING_PATH}")
    print(f"Final processed dataset saved at: {FINAL_OUTPUT_PATH}")
    print(f"Removed rows saved at: {REMOVED_ROWS_PATH}")
    print(f"Status file saved at: {STATUS_PATH}")

    cleaned_df = cleaned_df[cleaned_df["ingredients"] != ""]   

    return cleaned_df
    
    cleaned_df = cleaned_df.drop_duplicates()

    cleaned_df["ingredients_clean"] = cleaned_df["ingredients"].apply(normalize_ingredients)

    cleaned_df["combined_features"] = cleaned_df.apply(
        lambda row: " ".join([
            row["ingredients_clean"],
            row["cuisine"],
            row["diet"],
            row["course"]
        ]).strip(),
        axis=1
    )

    cleaned_df.to_csv(WORKING_PATH, index=False)
    cleaned_df.to_csv(FINAL_OUTPUT_PATH, index=False)

    status_data = {
        "status": "completed",
        "input_file": str(DATA_PATH),
        "working_file": str(WORKING_PATH),
        "final_output_file": str(FINAL_OUTPUT_PATH),
        "removed_rows_file": str(REMOVED_ROWS_PATH),
        "total_rows_before": int(total_rows_before),
        "total_rows_with_non_english": int(total_non_english_rows),
        "rows_removed": int(len(removed_df)),
        "rows_remaining_after_drop": int(len(cleaned_df)),
        "non_english_counts_by_column": column_counts
    }
    save_status_file(status_data)

    print(f"\nWorking file saved at: {WORKING_PATH}")
    print(f"Final processed dataset saved at: {FINAL_OUTPUT_PATH}")
    print(f"Removed rows saved at: {REMOVED_ROWS_PATH}")
    print(f"Status file saved at: {STATUS_PATH}")

    return cleaned_df


def save_processed_data():
    return process_dataset()


def load_processed_data():
    if not FINAL_OUTPUT_PATH.exists():
        raise FileNotFoundError(
            f"Processed file not found at: {FINAL_OUTPUT_PATH}\n"
            f"Run save_processed_data() first."
        )
    return pd.read_csv(FINAL_OUTPUT_PATH)


def process_user_input(user_input: dict):
    ingredients = clean_text(user_input.get("ingredients", ""))
    cuisine = clean_text(user_input.get("cuisine", ""))
    diet = clean_text(user_input.get("diet", ""))
    course = clean_text(user_input.get("course", ""))

    ingredients = normalize_ingredients(ingredients)

    combined = " ".join([ingredients, cuisine, diet, course]).strip()
    return combined