"""
Member 2 - Recommendation engine

This module powers the Recommendations page and the recipe-matching helpers used
elsewhere in the backend. The public function names are kept stable so the
existing routes and leftover-AI integration continue to work.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import re
from pathlib import Path
from typing import Any, Optional

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.image_mapper import get_cuisine_image
from app.services.preprocessing import (
    FINAL_OUTPUT_PATH,
    clean_text,
    load_processed_data,
    normalize_ingredients,
    save_processed_data,
)

_WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z\-']*")

_IGNORED_TOKENS = {
    "a",
    "an",
    "and",
    "bowl",
    "bunch",
    "chopped",
    "clove",
    "cloves",
    "cup",
    "cups",
    "diced",
    "few",
    "for",
    "fresh",
    "g",
    "garnish",
    "gram",
    "grams",
    "in",
    "inch",
    "into",
    "kg",
    "large",
    "medium",
    "minced",
    "ml",
    "of",
    "or",
    "oz",
    "packet",
    "piece",
    "pieces",
    "pinch",
    "sliced",
    "small",
    "some",
    "tbsp",
    "teaspoon",
    "teaspoons",
    "tablespoon",
    "tablespoons",
    "taste",
    "the",
    "to",
    "toasted",
    "warm",
    "with",
}

_TOKEN_SYNONYMS = {
    "aubergine": "eggplant",
    "capsicum": "bellpepper",
    "chilies": "chili",
    "chillies": "chili",
    "coriander": "cilantro",
    "curd": "yogurt",
    "garbanzo": "chickpea",
    "garbanzos": "chickpea",
    "ladies": "okra",
    "paneer": "paneer",
    "potatoes": "potato",
    "scallions": "springonion",
    "shallots": "onion",
    "spring": "spring",
    "springonions": "springonion",
    "tomatoes": "tomato",
    "veggies": "vegetable",
}

_DIET_ALIASES = {
    "veg": "veg",
    "vegetarian": "veg",
    "vegan": "veg",
    "jain": "veg",
    "satvik": "veg",
    "nonveg": "non-veg",
    "non-veg": "non-veg",
    "nonvegetarian": "non-veg",
    "non vegetarian": "non-veg",
    "egg": "non-veg",
    "eggetarian": "non-veg",
}

_QUICK_HINTS = {"easy", "fast", "quick", "simple"}

_NON_VEG_TOKENS = {
    "anchovy",
    "bacon",
    "beef",
    "calamari",
    "chicken",
    "clam",
    "crab",
    "duck",
    "egg",
    "fish",
    "goat",
    "ham",
    "lamb",
    "lobster",
    "meat",
    "mutton",
    "octopus",
    "oyster",
    "pork",
    "prawn",
    "salami",
    "salmon",
    "sausage",
    "seafood",
    "shrimp",
    "squid",
    "steak",
    "tilapia",
    "tuna",
    "turkey",
}


@dataclass
class RecommendationArtifacts:
    df: pd.DataFrame
    vectorizer: TfidfVectorizer
    recipe_matrix: Any
    ingredient_token_sets: list[set[str]]
    title_token_sets: list[set[str]]
    cuisine_token_sets: list[set[str]]
    course_token_sets: list[set[str]]
    diet_token_sets: list[set[str]]
    prep_minutes: list[Optional[int]]
    ingredient_idf: dict[str, float]


_ARTIFACTS_CACHE: Optional[RecommendationArtifacts] = None
_ARTIFACTS_CACHE_KEY: Optional[tuple[str, int, int]] = None


def _processed_path() -> Path:
    return Path(FINAL_OUTPUT_PATH)


def _error_result(message: str) -> list[dict[str, Any]]:
    return [{"error": True, "message": message}]


def _normalize_plural(token: str) -> str:
    token = _TOKEN_SYNONYMS.get(token, token)

    if token.endswith("ies") and len(token) > 4:
        token = token[:-3] + "y"
    elif token.endswith("oes") and len(token) > 4:
        token = token[:-2]
    elif token.endswith("s") and len(token) > 4 and not token.endswith("ss"):
        token = token[:-1]

    return _TOKEN_SYNONYMS.get(token, token)


def _canonicalize_tokens(text: Any) -> list[str]:
    if text is None:
        return []

    normalized = clean_text(str(text))
    normalized = normalized.replace("&", " and ")
    tokens: list[str] = []

    for token in _WORD_RE.findall(normalized):
        token = _normalize_plural(token)
        if len(token) <= 1 or token in _IGNORED_TOKENS:
            continue
        tokens.append(token)

    return tokens


def _split_ingredients(raw_value: Any) -> list[str]:
    if raw_value is None:
        return []

    raw_text = str(raw_value).strip()
    if not raw_text:
        return []

    parts = re.split(r"[,;\n|]+", raw_text)
    cleaned = [part.strip() for part in parts if part and part.strip()]
    return cleaned


def _canonical_recipe_key(name: Any) -> str:
    text = clean_text(str(name or ""))
    if not text:
        return ""

    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"\brecipe\b", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_ingredient_tokens(row: pd.Series) -> set[str]:
    tokens: set[str] = set()
    candidates = []

    raw_ingredients = row.get("ingredients", "")
    normalized_ingredients = row.get("ingredients_clean", "")

    candidates.extend(_split_ingredients(raw_ingredients))
    candidates.extend(_split_ingredients(normalized_ingredients))

    if normalized_ingredients:
        candidates.append(str(normalized_ingredients))

    for candidate in candidates:
        tokens.update(_canonicalize_tokens(candidate))

    return tokens


def _build_search_text(row: pd.Series, ingredient_tokens: set[str]) -> str:
    name = clean_text(row.get("name", ""))
    cuisine = clean_text(row.get("cuisine", ""))
    diet = clean_text(row.get("diet", ""))
    course = clean_text(row.get("course", ""))
    ingredient_text = " ".join(sorted(ingredient_tokens))

    parts = [
        name,
        name,
        ingredient_text,
        ingredient_text,
        cuisine,
        diet,
        course,
    ]
    return " ".join(part for part in parts if part).strip()


def _parse_prep_minutes(value: Any) -> Optional[int]:
    if value is None:
        return None

    text = clean_text(str(value))
    if not text:
        return None

    total = 0
    hour_match = re.search(r"(\d+)\s*(hour|hr)", text)
    minute_match = re.search(r"(\d+)\s*(minute|min)", text)

    if hour_match:
        total += int(hour_match.group(1)) * 60
    if minute_match:
        total += int(minute_match.group(1))

    if total:
        return total

    generic_match = re.search(r"(\d+)", text)
    return int(generic_match.group(1)) if generic_match else None


def _diet_bucket(value: Any) -> str:
    text = clean_text(str(value or ""))
    if not text:
        return ""

    compressed = text.replace(" ", "")
    if compressed in _DIET_ALIASES:
        return _DIET_ALIASES[compressed]
    if text in _DIET_ALIASES:
        return _DIET_ALIASES[text]

    if "non vegetarian" in text or "non-veg" in text or "non veg" in text:
        return "non-veg"
    if "egg" in text:
        return "non-veg"
    if "veg" in text or "vegetarian" in text or "vegan" in text or "jain" in text:
        return "veg"

    return ""


def _matches_diet(recipe_value: Any, requested_value: Any) -> bool:
    requested = _diet_bucket(requested_value)
    if not requested:
        return True

    recipe_bucket = _diet_bucket(recipe_value)
    return bool(recipe_bucket) and recipe_bucket == requested


def _metadata_tokens(value: Any) -> set[str]:
    return set(_canonicalize_tokens(value))


def _explicit_non_veg_tokens(tokens: set[str]) -> list[str]:
    return sorted(token for token in tokens if token in _NON_VEG_TOKENS)


def _build_cache_key(path: Path) -> tuple[str, int, int]:
    stat = path.stat()
    return (str(path), int(stat.st_mtime), int(stat.st_size))


def _load_dataset() -> pd.DataFrame:
    path = _processed_path()
    if not path.exists():
        save_processed_data()

    df = load_processed_data().copy()
    required = {"name", "ingredients", "cuisine", "course", "diet", "instructions", "prep_time"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Processed dataset is missing required columns: {sorted(missing)}")

    for column in required:
        df[column] = df[column].fillna("")

    if "ingredients_clean" not in df.columns:
        df["ingredients_clean"] = df["ingredients"].apply(normalize_ingredients)

    return df.reset_index(drop=True)


def _build_artifacts() -> RecommendationArtifacts:
    df = _load_dataset()

    ingredient_token_sets: list[set[str]] = []
    title_token_sets: list[set[str]] = []
    cuisine_token_sets: list[set[str]] = []
    course_token_sets: list[set[str]] = []
    diet_token_sets: list[set[str]] = []
    prep_minutes: list[Optional[int]] = []
    search_documents: list[str] = []
    ingredient_document_frequency: dict[str, int] = {}

    for _, row in df.iterrows():
        ingredient_tokens = _extract_ingredient_tokens(row)
        title_tokens = set(_canonicalize_tokens(row.get("name", "")))
        cuisine_tokens = _metadata_tokens(row.get("cuisine", ""))
        course_tokens = _metadata_tokens(row.get("course", ""))
        diet_tokens = _metadata_tokens(row.get("diet", ""))

        ingredient_token_sets.append(ingredient_tokens)
        title_token_sets.append(title_tokens)
        cuisine_token_sets.append(cuisine_tokens)
        course_token_sets.append(course_tokens)
        diet_token_sets.append(diet_tokens)
        prep_minutes.append(_parse_prep_minutes(row.get("prep_time", "")))
        search_documents.append(_build_search_text(row, ingredient_tokens))

        for token in ingredient_tokens:
            ingredient_document_frequency[token] = ingredient_document_frequency.get(token, 0) + 1

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True,
        strip_accents="unicode",
    )
    recipe_matrix = vectorizer.fit_transform(search_documents)

    total_docs = max(len(df), 1)
    ingredient_idf = {
        token: math.log((1 + total_docs) / (1 + count)) + 1.0
        for token, count in ingredient_document_frequency.items()
    }

    return RecommendationArtifacts(
        df=df,
        vectorizer=vectorizer,
        recipe_matrix=recipe_matrix,
        ingredient_token_sets=ingredient_token_sets,
        title_token_sets=title_token_sets,
        cuisine_token_sets=cuisine_token_sets,
        course_token_sets=course_token_sets,
        diet_token_sets=diet_token_sets,
        prep_minutes=prep_minutes,
        ingredient_idf=ingredient_idf,
    )


def _get_artifacts() -> RecommendationArtifacts:
    global _ARTIFACTS_CACHE, _ARTIFACTS_CACHE_KEY

    path = _processed_path()
    if not path.exists():
        save_processed_data()

    cache_key = _build_cache_key(path)
    if _ARTIFACTS_CACHE is None or _ARTIFACTS_CACHE_KEY != cache_key:
        _ARTIFACTS_CACHE = _build_artifacts()
        _ARTIFACTS_CACHE_KEY = cache_key

    return _ARTIFACTS_CACHE


def prepareData() -> pd.DataFrame:
    return _get_artifacts().df.copy()


def createFeatureVector(df: Optional[pd.DataFrame] = None):
    if df is None:
        artifacts = _get_artifacts()
        return artifacts.vectorizer, artifacts.recipe_matrix

    working = df.copy()
    if "search_text" not in working.columns:
        working["search_text"] = working.apply(
            lambda row: _build_search_text(
                row,
                set(_canonicalize_tokens(row.get("ingredients_clean", row.get("ingredients", "")))),
            ),
            axis=1,
        )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words="english",
        sublinear_tf=True,
        strip_accents="unicode",
    )
    matrix = vectorizer.fit_transform(working["search_text"].fillna(""))
    return vectorizer, matrix


def computeSimilarity(query_vector, recipe_matrix):
    return cosine_similarity(query_vector, recipe_matrix).ravel()


def _normalize_request(
    user_input: Any,
    *,
    diet_filter: Optional[str] = None,
    cooking_time_max: Optional[int] = None,
) -> dict[str, Any]:
    if isinstance(user_input, dict):
        ingredients_text = clean_text(user_input.get("ingredients", ""))
        cuisine_text = clean_text(user_input.get("cuisine", ""))
        diet_text = clean_text(diet_filter or user_input.get("diet", ""))
        course_text = clean_text(user_input.get("course", ""))
        raw_query = " ".join(
            part for part in [ingredients_text, cuisine_text, diet_text, course_text] if part
        ).strip()
    else:
        raw_query = clean_text(str(user_input or ""))
        ingredients_text = raw_query
        cuisine_text = ""
        diet_text = clean_text(diet_filter or "")
        course_text = ""

    ingredient_tokens = set(_canonicalize_tokens(normalize_ingredients(ingredients_text or raw_query)))
    all_query_tokens = set(_canonicalize_tokens(raw_query))
    cuisine_tokens = _metadata_tokens(cuisine_text)
    course_tokens = _metadata_tokens(course_text)

    return {
        "raw_query": raw_query,
        "ingredient_tokens": ingredient_tokens,
        "all_query_tokens": all_query_tokens,
        "cuisine": cuisine_text,
        "cuisine_tokens": cuisine_tokens,
        "diet": diet_text,
        "course": course_text,
        "course_tokens": course_tokens,
        "cooking_time_max": cooking_time_max,
        "wants_quick": bool(_QUICK_HINTS & all_query_tokens),
    }


def _filter_candidate_indexes(
    artifacts: RecommendationArtifacts,
    request: dict[str, Any],
) -> list[int]:
    candidates = list(range(len(artifacts.df)))

    if request["diet"]:
        candidates = [
            idx
            for idx in candidates
            if _matches_diet(artifacts.df.at[idx, "diet"], request["diet"])
        ]
        if not candidates:
            return []

    if request["cooking_time_max"]:
        max_minutes = int(request["cooking_time_max"])
        candidates = [
            idx
            for idx in candidates
            if artifacts.prep_minutes[idx] is not None and artifacts.prep_minutes[idx] <= max_minutes
        ]
        if not candidates:
            return []

    if request["course_tokens"]:
        matched = [
            idx
            for idx in candidates
            if request["course_tokens"] & artifacts.course_token_sets[idx]
        ]
        if matched:
            candidates = matched

    if request["cuisine_tokens"]:
        matched = [
            idx
            for idx in candidates
            if request["cuisine_tokens"] & artifacts.cuisine_token_sets[idx]
        ]
        if matched:
            candidates = matched

    return candidates


def _weighted_overlap_score(
    query_tokens: set[str],
    recipe_tokens: set[str],
    ingredient_idf: dict[str, float],
) -> tuple[float, float, list[str]]:
    if not query_tokens:
        return 0.0, 0.0, []

    matched = query_tokens & recipe_tokens
    if not matched:
        return 0.0, 0.0, []

    weight_total = sum(ingredient_idf.get(token, 1.0) for token in query_tokens) or 1.0
    weight_matched = sum(ingredient_idf.get(token, 1.0) for token in matched)
    weighted_recall = weight_matched / weight_total
    raw_ratio = len(matched) / len(query_tokens)

    ordered = sorted(matched, key=lambda token: (-ingredient_idf.get(token, 1.0), token))
    return weighted_recall, raw_ratio, ordered


def _metadata_bonus(
    idx: int,
    artifacts: RecommendationArtifacts,
    request: dict[str, Any],
) -> float:
    bonus = 0.0

    if request["cuisine_tokens"] and request["cuisine_tokens"] & artifacts.cuisine_token_sets[idx]:
        bonus += 0.05
    if request["course_tokens"] and request["course_tokens"] & artifacts.course_token_sets[idx]:
        bonus += 0.05
    if request["diet"] and _matches_diet(artifacts.df.at[idx, "diet"], request["diet"]):
        bonus += 0.03

    prep_minutes = artifacts.prep_minutes[idx]
    max_minutes = request["cooking_time_max"]
    if max_minutes and prep_minutes is not None:
        headroom = max(max_minutes - prep_minutes, 0)
        bonus += min(0.04, (headroom / max(max_minutes, 1)) * 0.04)
    elif request["wants_quick"] and prep_minutes is not None and prep_minutes <= 30:
        bonus += 0.03

    return bonus


def _build_query_document(request: dict[str, Any]) -> str:
    ingredient_text = " ".join(sorted(request["ingredient_tokens"]))
    query_parts = [
        request["raw_query"],
        ingredient_text,
        ingredient_text,
        request["cuisine"],
        request["diet"],
        request["course"],
    ]
    return " ".join(part for part in query_parts if part).strip()


def _build_explanation(
    matched_keywords: list[str],
    request: dict[str, Any],
    prep_minutes: Optional[int],
) -> str:
    parts: list[str] = []

    if matched_keywords:
        shown = ", ".join(matched_keywords[:4])
        parts.append(
            f"Matched {len(matched_keywords)} ingredient"
            f"{'' if len(matched_keywords) == 1 else 's'} including {shown}"
        )
    else:
        parts.append("Matched the overall recipe content to your search terms")

    if request["diet"]:
        parts.append(f"fits the {request['diet']} preference")
    if request["course"]:
        parts.append(f"suits {request['course']} recipes")
    if request["cuisine"]:
        parts.append(f"leans toward {request['cuisine']} cuisine")
    if request["cooking_time_max"] and prep_minutes is not None:
        parts.append(f"stays within {request['cooking_time_max']} minutes")

    return ". ".join(parts) + "."


def _conflict_message(request: dict[str, Any]) -> Optional[str]:
    diet_bucket = _diet_bucket(request["diet"])
    explicit_non_veg = _explicit_non_veg_tokens(request["ingredient_tokens"])

    if diet_bucket == "veg" and explicit_non_veg:
        ingredient_text = ", ".join(explicit_non_veg[:4])
        return (
            "Your search mixes a vegetarian filter with non-vegetarian ingredients "
            f"({ingredient_text}). Remove the vegetarian filter or replace those ingredients."
        )

    return None


def _empty_results_message(request: dict[str, Any]) -> str:
    diet_bucket = _diet_bucket(request["diet"])

    if diet_bucket == "non-veg":
        return (
            "No strong non-vegetarian matches were found for the ingredients you entered. "
            "Try removing the non-veg filter or add a protein ingredient such as chicken, egg, fish, or prawns."
        )

    if diet_bucket == "veg":
        return (
            "No vegetarian matches were found for the ingredients and filters you selected. "
            "Try adjusting the ingredients or removing one of the filters."
        )

    return "No matching recipes found for the selected ingredients and filters."


def _is_low_confidence_non_veg_search(
    request: dict[str, Any],
    results: list[dict[str, Any]],
) -> bool:
    if _diet_bucket(request["diet"]) != "non-veg":
        return False

    if _explicit_non_veg_tokens(request["ingredient_tokens"]):
        return False

    if not request["ingredient_tokens"] or not results:
        return False

    top_result = results[0]
    return (
        float(top_result.get("ingredient_match_ratio", 0) or 0) < 0.5
        and float(top_result.get("similarity_score", 0) or 0) < 0.55
    )


def _format_recipe_result(
    row: pd.Series,
    *,
    similarity_score: float,
    matched_keywords: list[str],
    match_explanation: str,
    ingredient_match_count: int,
    ingredient_match_ratio: float,
    text_similarity: float,
    ingredients_as_list: bool,
) -> dict[str, Any]:
    ingredient_items = _split_ingredients(row.get("ingredients", ""))
    ingredients_value: Any = ingredient_items if ingredients_as_list else ", ".join(ingredient_items)

    return {
        "name": row.get("name", ""),
        "ingredients": ingredients_value,
        "ingredients_clean": row.get("ingredients_clean", ""),
        "cuisine": row.get("cuisine", ""),
        "diet": row.get("diet", ""),
        "course": row.get("course", ""),
        "prep_time": row.get("prep_time", ""),
        "instructions": row.get("instructions", ""),
        "similarity_score": round(float(similarity_score), 4),
        "text_similarity": round(float(text_similarity), 4),
        "ingredient_match_count": ingredient_match_count,
        "ingredient_match_ratio": round(float(ingredient_match_ratio), 4),
        "matched_keywords": matched_keywords,
        "match_explanation": match_explanation,
        "image_url": get_cuisine_image(row.get("name", "")),
    }


def _rank_candidates(
    request: dict[str, Any],
    *,
    top_n: int,
    ingredients_as_list: bool,
) -> list[dict[str, Any]]:
    artifacts = _get_artifacts()
    candidate_indexes = _filter_candidate_indexes(artifacts, request)
    if not candidate_indexes:
        return []

    query_document = _build_query_document(request)
    if not query_document:
        return []

    query_vector = artifacts.vectorizer.transform([query_document])
    text_similarities = computeSimilarity(query_vector, artifacts.recipe_matrix)

    ranked_rows: list[tuple[float, float, float, int, float, int, list[str], float]] = []
    ingredient_query_tokens = request["ingredient_tokens"]
    fallback_query_tokens = request["all_query_tokens"]

    for idx in candidate_indexes:
        row = artifacts.df.iloc[idx]
        recipe_ingredient_tokens = artifacts.ingredient_token_sets[idx]
        title_tokens = artifacts.title_token_sets[idx]

        weighted_recall, raw_ratio, matched_keywords = _weighted_overlap_score(
            ingredient_query_tokens,
            recipe_ingredient_tokens,
            artifacts.ingredient_idf,
        )

        title_overlap = 0.0
        if fallback_query_tokens:
            title_overlap = len(fallback_query_tokens & title_tokens) / len(fallback_query_tokens)

        text_similarity = float(text_similarities[idx])
        bonus = _metadata_bonus(idx, artifacts, request)
        prep_minutes = artifacts.prep_minutes[idx]

        if ingredient_query_tokens:
            if not matched_keywords and text_similarity < 0.08 and title_overlap == 0:
                continue

            score = (
                (0.58 * weighted_recall)
                + (0.14 * raw_ratio)
                + (0.18 * text_similarity)
                + (0.06 * title_overlap)
                + bonus
            )
        else:
            score = (0.74 * text_similarity) + (0.12 * title_overlap) + bonus

        score = max(0.0, min(1.0, score))

        ranked_rows.append(
            (
                score,
                weighted_recall,
                text_similarity,
                len(matched_keywords),
                -float(prep_minutes if prep_minutes is not None else 9999),
                idx,
                matched_keywords,
                raw_ratio,
            )
        )

    ranked_rows.sort(
        key=lambda item: (item[0], item[1], item[2], item[3], item[4]),
        reverse=True,
    )

    results: list[dict[str, Any]] = []
    seen_recipe_keys: set[str] = set()
    for score, _weighted_recall, text_similarity, matched_count, _prep_sort, idx, matched_keywords, raw_ratio in ranked_rows:
        row = artifacts.df.iloc[idx]
        recipe_key = _canonical_recipe_key(row.get("name", ""))
        if recipe_key and recipe_key in seen_recipe_keys:
            continue

        result = _format_recipe_result(
            row,
            similarity_score=score,
            matched_keywords=matched_keywords,
            match_explanation=_build_explanation(
                matched_keywords,
                request,
                artifacts.prep_minutes[idx],
            ),
            ingredient_match_count=matched_count,
            ingredient_match_ratio=raw_ratio,
            text_similarity=text_similarity,
            ingredients_as_list=ingredients_as_list,
        )
        results.append(result)
        if recipe_key:
            seen_recipe_keys.add(recipe_key)
        if len(results) >= top_n:
            break

    return results


def _run_recommendation_query(
    user_input: Any,
    *,
    top_n: int,
    diet_filter: Optional[str] = None,
    cooking_time_max: Optional[int] = None,
    ingredients_as_list: bool,
) -> list[dict[str, Any]]:
    request = _normalize_request(
        user_input,
        diet_filter=diet_filter,
        cooking_time_max=cooking_time_max,
    )

    if not any(
        [
            request["raw_query"],
            request["cuisine"],
            request["diet"],
            request["course"],
        ]
    ):
        return []

    return _rank_candidates(
        request,
        top_n=max(1, min(int(top_n or 5), 20)),
        ingredients_as_list=ingredients_as_list,
    )


def recommendRecipes(
    user_input: str,
    top_n: int = 5,
    diet_filter: Optional[str] = None,
    cooking_time_max: Optional[int] = None,
) -> list[dict[str, Any]]:
    if not clean_text(str(user_input or "")):
        return _error_result("Please enter at least one ingredient or keyword to search.")

    request = _normalize_request(
        user_input,
        diet_filter=diet_filter,
        cooking_time_max=cooking_time_max,
    )
    conflict_message = _conflict_message(request)
    if conflict_message:
        return _error_result(conflict_message)

    results = _run_recommendation_query(
        user_input,
        top_n=top_n,
        diet_filter=diet_filter,
        cooking_time_max=cooking_time_max,
        ingredients_as_list=True,
    )
    if not results:
        return _error_result(_empty_results_message(request))
    if _is_low_confidence_non_veg_search(request, results):
        return _error_result(_empty_results_message(request))
    return results


def get_recipe_recommendations(user_input: dict[str, Any], top_k: int = 5) -> list[dict[str, Any]]:
    try:
        return _run_recommendation_query(
            user_input,
            top_n=top_k,
            diet_filter=user_input.get("diet") if isinstance(user_input, dict) else None,
            cooking_time_max=user_input.get("cooking_time_max") if isinstance(user_input, dict) else None,
            ingredients_as_list=False,
        )
    except Exception:
        return []
