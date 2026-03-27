import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.preprocessing import load_processed_data, process_user_input, save_processed_data

# Processed CSV path — same path as defined in preprocessing.py
_PROCESSED_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "processed_recipes.csv"

def _ensure_data_ready():
    """
    Safety check by Member 2:
    If the processed dataset does not exist yet (Member 1 hasn't run preprocessing),
    automatically generate it from the raw CSV so the AI engine does not crash.
    """
    if not _PROCESSED_PATH.exists():
        print("[Member 2 - Safety] processed_recipes.csv not found. Running preprocessing now...")
        save_processed_data()
        print("[Member 2 - Safety] Preprocessing complete. Dataset is ready.")

def get_recipe_recommendations(user_input: dict, top_k: int = 5):
    """
    Takes user dietary preferences and ingredients,
    converts to vectors via TF-IDF, calculates Cosine Similarity,
    and returns the top_k matching recipes.
    """
    # Run safety check — auto-generate processed CSV if Member 1 hasn't done it yet
    _ensure_data_ready()

    try:
        df = load_processed_data()
    except Exception as e:
        print(f"Error loading processed data: {e}")
        return []

    # Ensure required columns exist
    if "combined_features" not in df.columns:
        return []

    # Preprocess user input into the strict string format
    user_feature_string = process_user_input(user_input)

    # Handle the empty input case by just returning random or top elements
    if not user_feature_string.strip():
        return df.head(top_k).to_dict(orient="records")

    # ----- MEMBER 2 -----
    
    # 1. Initialize TF-IDF Vectorizer
    vectorizer = TfidfVectorizer()
    
    # 2. We fit_transform on all recipes' features PLUS the user's input string
    all_features = df["combined_features"].tolist()
    all_features.append(user_feature_string)
    
    tfidf_matrix = vectorizer.fit_transform(all_features)
    
    # 3. Extract Vectors
    # The user's query is the newly appended LAST row in the matrix
    user_vector = tfidf_matrix[-1]
    recipe_vectors = tfidf_matrix[:-1] # Exclude the user's own vector from recipes
    
    # 4. Cosine Similarity Calculation
    similarity_scores = cosine_similarity(user_vector, recipe_vectors).flatten()
    
    # 5. Rank Recipes
    df["similarity_score"] = similarity_scores
    
    # Sort by the score in descending order (highest similarity first)
    top_matches = df.sort_values(by="similarity_score", ascending=False).head(top_k)
    
    # Optionally remove recipes that have literally 0% similarity
    top_matches = top_matches[top_matches["similarity_score"] > 0]
    
    # Fill NaN values to prevent JSON serialization errors
    top_matches = top_matches.fillna("")
    
    # Return as list of dictionaries
    return top_matches.to_dict(orient="records")
