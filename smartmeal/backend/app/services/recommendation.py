import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.preprocessing import (
    FINAL_OUTPUT_PATH,
    clean_text,
    load_processed_data,
    process_user_input,
    save_processed_data,
)

# Processed CSV path (single source of truth from preprocessing.py)
_PROCESSED_PATH = FINAL_OUTPUT_PATH

def _ensure_data_ready():
    """
    Safety check:
    If the processed dataset does not exist yet.
    Automatically generate it from the raw CSV so the AI engine does not crash.
    """
    if not _PROCESSED_PATH.exists():
        print(f"{_PROCESSED_PATH.name} not found. Running preprocessing now...")
        save_processed_data()
        print("Preprocessing complete. Dataset is ready.")

def _build_weighted_features(df: pd.DataFrame) -> pd.Series:
    """
    Build weighted recommendation text so ingredient overlap has
    the highest impact, then cuisine, then course, then diet.
    """
    ingredients = df.get("ingredients_clean", pd.Series("", index=df.index)).fillna("").astype(str)
    cuisine = df.get("cuisine", pd.Series("", index=df.index)).fillna("").astype(str)
    course = df.get("course", pd.Series("", index=df.index)).fillna("").astype(str)
    diet = df.get("diet", pd.Series("", index=df.index)).fillna("").astype(str)

    weighted = (
        (ingredients + " ") * 3
        + (cuisine + " ") * 2
        + (course + " ")
        + (diet + " ")
    )
    return weighted.str.strip()


def get_recipe_recommendations(
    user_input: dict,
    top_k: int = 5,
    use_ngrams: bool = True,
    weak_match_threshold: float = 0.08,
):
    """
    Takes user dietary preferences and ingredients,
    converts to vectors via TF-IDF, calculates Cosine Similarity,
    and returns the top_k matching recipes.
    """
    # Run safety check — auto-generate processed CSV if required
    _ensure_data_ready()

    try:
        df = load_processed_data()
    except Exception as e:
        print(f"Error loading processed data: {e}")
        return []

    # Preprocess user input into the strict string format
    user_feature_string = process_user_input(user_input)

    # Handle the empty input case by just returning random or top elements
    if not user_feature_string.strip():
        return df.head(top_k).to_dict(orient="records")

    # ----- MEMBER 2 -----
    # Weighted text representation for better retrieval quality:
    # ingredients > cuisine > course > diet
    weighted_recipe_features = _build_weighted_features(df)
    weighted_user_feature = user_feature_string

    ngram_range = (1, 2) if use_ngrams else (1, 1)
    vectorizer = TfidfVectorizer(ngram_range=ngram_range)

    # Fit on all recipes + user input in the same feature space
    all_features = weighted_recipe_features.tolist() + [weighted_user_feature]
    tfidf_matrix = vectorizer.fit_transform(all_features)

    # Extract vectors
    user_vector = tfidf_matrix[-1]
    recipe_vectors = tfidf_matrix[:-1]

    # Base similarity score
    similarity_scores = cosine_similarity(user_vector, recipe_vectors).flatten()

    # Hybrid rule-based boosts for exact diet/cuisine alignment
    user_diet = clean_text(user_input.get("diet", ""))
    user_cuisine = clean_text(user_input.get("cuisine", ""))

    diet_series = df.get("diet", pd.Series("", index=df.index)).fillna("").astype(str).map(clean_text)
    cuisine_series = df.get("cuisine", pd.Series("", index=df.index)).fillna("").astype(str).map(clean_text)

    diet_match_boost = ((diet_series == user_diet) & (user_diet != "")).astype(float) * 0.08
    cuisine_match_boost = ((cuisine_series == user_cuisine) & (user_cuisine != "")).astype(float) * 0.05
    hybrid_scores = similarity_scores + diet_match_boost + cuisine_match_boost

    # Keep both raw and boosted scores for explainability/debugging
    df["similarity_score"] = similarity_scores
    df["hybrid_score"] = hybrid_scores

    ranked = df.sort_values(by="hybrid_score", ascending=False)
    strong_matches = ranked[ranked["hybrid_score"] >= weak_match_threshold].head(top_k)

    # If everything scores below threshold, still return best candidates (UX / viva demo)
    if strong_matches.empty and user_feature_string.strip():
        top_matches = ranked.head(top_k).fillna("")
    else:
        top_matches = strong_matches.fillna("")

    return top_matches.to_dict(orient="records")


# Viva-friendly alias (Member 2 — recipe matching API)
recommend_recipes = get_recipe_recommendations
