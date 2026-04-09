"""
Member 2 — Recipe Matching (Core AI Engine)
============================================
TF-IDF + Cosine Similarity content-based recommendation engine.

Public API
----------
prepareData()          -> pd.DataFrame
createFeatureVector()  -> (TfidfVectorizer, sparse matrix)
computeSimilarity()    -> np.ndarray
recommendRecipes()     -> list[dict]
"""

import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.preprocessing import (
    load_processed_data,
    save_processed_data,
    clean_text,
    normalize_ingredients,
)

_PROCESSED_PATH = (
    Path(__file__).resolve().parent.parent
    / "data" / "processed" / "processed_recipes1.csv"
)

# ── Boost keywords: terms that lift a recipe's score when present ──────────────
_BOOST_KEYWORDS = {
    "spicy": 1.3,
    "quick": 1.2,
    "easy": 1.15,
    "healthy": 1.1,
    "vegan": 1.1,
    "vegetarian": 1.1,
}


# ─────────────────────────────────────────────────────────────────────────────
# 1. prepareData
# ─────────────────────────────────────────────────────────────────────────────
def prepareData() -> pd.DataFrame:
    """
    Load the processed CSV.  Auto-generates it from raw data if missing.
    Ensures 'combined_features' column exists.
    """
    if not _PROCESSED_PATH.exists():
        save_processed_data()

    df = load_processed_data()

    # Safety: rebuild combined_features if column is absent
    if "combined_features" not in df.columns:
        df["combined_features"] = df.apply(
            lambda r: " ".join([
                str(r.get("ingredients_clean", r.get("ingredients", ""))),
                str(r.get("cuisine", "")),
                str(r.get("diet", "")),
                str(r.get("course", "")),
            ]).strip(),
            axis=1,
        )

    df["combined_features"] = df["combined_features"].fillna("").astype(str)
    return df.drop_duplicates(subset=["name"]).reset_index(drop=True)


# ─────────────────────────────────────────────────────────────────────────────
# 2. createFeatureVector
# ─────────────────────────────────────────────────────────────────────────────
def createFeatureVector(corpus: list[str]):
    """
    Fit a TF-IDF vectorizer on the recipe corpus.

    TF-IDF explanation
    ------------------
    TF  (Term Frequency)     = how often a word appears in ONE document.
    IDF (Inverse Doc Freq)   = log(total docs / docs containing the word).
                               Rare words get a higher IDF weight.
    TF-IDF = TF × IDF  →  words that are frequent in a recipe but rare
             across all recipes get the highest weight, making each recipe's
             vector uniquely descriptive.

    Returns (vectorizer, tfidf_matrix).
    """
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),   # unigrams + bigrams ("chicken rice", not just "chicken")
        min_df=1,
        max_df=0.95,          # ignore terms in >95 % of docs (too generic)
        sublinear_tf=True,    # apply log(1+tf) to dampen very frequent terms
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    return vectorizer, tfidf_matrix


# ─────────────────────────────────────────────────────────────────────────────
# 3. computeSimilarity
# ─────────────────────────────────────────────────────────────────────────────
def computeSimilarity(user_vector, recipe_vectors) -> np.ndarray:
    """
    Cosine Similarity explanation
    ------------------------------
    Two TF-IDF vectors point in high-dimensional space.
    Cosine similarity = cos(θ) = (A · B) / (|A| × |B|).
    • Score = 1.0  → identical direction (perfect match).
    • Score = 0.0  → orthogonal (no shared vocabulary).
    Length-normalisation means a short query "chicken rice" and a long
    recipe description are compared fairly — only the *direction* matters.
    """
    return cosine_similarity(user_vector, recipe_vectors).flatten()


# ─────────────────────────────────────────────────────────────────────────────
# 4. recommendRecipes  (main entry point)
# ─────────────────────────────────────────────────────────────────────────────
def recommendRecipes(
    user_input: str | dict,
    top_n: int = 5,
    diet_filter: str | None = None,
    cooking_time_max: int | None = None,
) -> list[dict]:
    """
    Parameters
    ----------
    user_input      : free-text string  ("chicken rice spicy")
                      OR dict with keys: ingredients, cuisine, diet, course
    top_n           : number of results to return
    diet_filter     : "veg" | "non-veg" | None
    cooking_time_max: max prep time in minutes (uses prep_time column)

    Returns
    -------
    List of dicts, each containing:
        name, ingredients, cuisine, diet, course, similarity_score,
        match_explanation, matched_keywords
    """
    # ── Validate input ────────────────────────────────────────────────────────
    if not user_input:
        return _error("Please enter ingredients or keywords to search.")

    # ── Normalise user input to a single string ───────────────────────────────
    if isinstance(user_input, dict):
        raw_query = " ".join([
            str(user_input.get("ingredients", "")),
            str(user_input.get("cuisine", "")),
            str(user_input.get("diet", "")),
            str(user_input.get("course", "")),
        ])
    else:
        raw_query = str(user_input)

    query_clean = _clean_query(raw_query)
    if not query_clean.strip():
        return _error("Query is empty after cleaning. Please try different keywords.")

    # ── Load & optionally filter dataset ─────────────────────────────────────
    try:
        df = prepareData()
    except Exception as e:
        return _error(f"Failed to load recipe data: {e}")

    if df.empty:
        return _error("Recipe dataset is empty.")

    df = _apply_filters(df, diet_filter, cooking_time_max)
    if df.empty:
        return _error("No recipes match the selected filters.")

    # ── TF-IDF vectorisation ──────────────────────────────────────────────────
    corpus = df["combined_features"].tolist()
    vectorizer, recipe_matrix = createFeatureVector(corpus)

    # Transform user query using the SAME fitted vectorizer
    user_vector = vectorizer.transform([query_clean])

    # ── Cosine similarity ─────────────────────────────────────────────────────
    scores = computeSimilarity(user_vector, recipe_matrix)

    # ── Boost scores for matching power-keywords ──────────────────────────────
    query_words = set(query_clean.split())
    for keyword, multiplier in _BOOST_KEYWORDS.items():
        if keyword in query_words:
            keyword_mask = df["combined_features"].str.contains(keyword, case=False, na=False)
            scores[keyword_mask.values] *= multiplier

    # ── Ingredient match count (secondary ranking signal) ─────────────────────
    query_tokens = set(re.findall(r"\b\w+\b", query_clean))
    df = df.copy()
    df["similarity_score"] = scores
    df["ingredient_match_count"] = df["combined_features"].apply(
        lambda feat: len(query_tokens & set(re.findall(r"\b\w+\b", feat)))
    )

    # ── Rank: primary = similarity_score, secondary = ingredient_match_count ──
    df_sorted = df[df["similarity_score"] > 0].sort_values(
        by=["similarity_score", "ingredient_match_count"],
        ascending=[False, False],
    )

    # Deduplicate by name
    df_sorted = df_sorted.drop_duplicates(subset=["name"])

    top = df_sorted.head(top_n).fillna("")

    if top.empty:
        return _error("No matching recipes found. Try different keywords.")

    # ── Format output ─────────────────────────────────────────────────────────
    results = []
    for _, row in top.iterrows():
        matched_kw = _find_matched_keywords(query_tokens, str(row.get("combined_features", "")))
        results.append({
            "name":              row.get("name", ""),
            "ingredients":       _split_ingredients(row.get("ingredients", "")),
            "cuisine":           row.get("cuisine", ""),
            "diet":              row.get("diet", ""),
            "course":            row.get("course", ""),
            "prep_time":         row.get("prep_time", ""),
            "similarity_score":  round(float(row["similarity_score"]), 4),
            "matched_keywords":  matched_kw,
            "match_explanation": _build_explanation(row.get("name", ""), matched_kw),
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Legacy wrapper — keeps existing /api/recipes/recommendations route working
# ─────────────────────────────────────────────────────────────────────────────
def get_recipe_recommendations(user_input: dict, top_k: int = 5) -> list[dict]:
    """Backward-compatible wrapper used by leftover_ai and old routes."""
    return recommendRecipes(user_input, top_n=top_k)


# ─────────────────────────────────────────────────────────────────────────────
# Private helpers
# ─────────────────────────────────────────────────────────────────────────────
def _clean_query(text: str) -> str:
    text = clean_text(text)
    # Normalise ingredient synonyms in the query too
    text = normalize_ingredients(text)
    return text


def _apply_filters(df: pd.DataFrame, diet_filter, cooking_time_max) -> pd.DataFrame:
    if diet_filter:
        diet_lower = diet_filter.lower()
        if diet_lower == "veg":
            df = df[df["diet"].str.lower().str.contains("vegetarian|vegan", na=False)]
        elif diet_lower == "non-veg":
            df = df[~df["diet"].str.lower().str.contains("vegetarian|vegan", na=False)]

    if cooking_time_max is not None:
        def _parse_time(val):
            if not val or str(val).strip() == "":
                return None
            m = re.search(r"(\d+)", str(val))
            return int(m.group(1)) if m else None

        df = df.copy()
        df["_parsed_time"] = df["prep_time"].apply(_parse_time)
        df = df[(df["_parsed_time"].isna()) | (df["_parsed_time"] <= cooking_time_max)]
        df = df.drop(columns=["_parsed_time"])

    return df


def _find_matched_keywords(query_tokens: set, feature_text: str) -> list[str]:
    feature_tokens = set(re.findall(r"\b\w+\b", feature_text.lower()))
    matched = sorted(query_tokens & feature_tokens)
    # Filter out very short stop-like words
    return [w for w in matched if len(w) > 2]


def _build_explanation(name: str, matched: list[str]) -> str:
    if not matched:
        return f"Recommended based on overall similarity to your query."
    kw = ", ".join(matched[:5])
    return f"Recommended because it matches: {kw}."


def _split_ingredients(raw: str) -> list[str]:
    if not raw:
        return []
    return [i.strip() for i in str(raw).split(",") if i.strip()]


def _error(message: str) -> list[dict]:
    return [{"error": True, "message": message}]
