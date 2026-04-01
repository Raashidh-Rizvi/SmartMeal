<<<<<<< HEAD

=======
>>>>>>> decba509276db80539022ab5fd0b1e2cb4855e52
# Unit conversion to base units
# Weight -> grams, Volume -> mL, Count -> pcs, Kitchen -> mL

WEIGHT  = {"kg": 1000.0, "g": 1.0, "mg": 0.001}
VOLUME  = {"l": 1000.0, "ml": 1.0}
COUNT   = {"pcs": 1.0, "piece": 1.0, "pack": 1.0, "dozen": 12.0, "slice": 1.0, "bottle": 1.0, "jar": 1.0}
KITCHEN = {"cup": 240.0, "tbsp": 15.0, "tsp": 5.0, "pinch": 0.3}

GROUPS: dict = {}
for u in WEIGHT:  GROUPS[u] = "weight"
for u in VOLUME:  GROUPS[u] = "volume"
for u in COUNT:   GROUPS[u] = "count"
for u in KITCHEN: GROUPS[u] = "kitchen"

ALL_FACTORS: dict = {**WEIGHT, **VOLUME, **COUNT, **KITCHEN}


def _norm(unit: str) -> str:
    return (unit or "").strip().lower()


def same_group(unit_a: str, unit_b: str) -> bool:
    a, b = _norm(unit_a), _norm(unit_b)
    return GROUPS.get(a) is not None and GROUPS.get(a) == GROUPS.get(b)


def calc_missing(
    recipe_qty: float, recipe_unit: str,
    inv_qty: float,    inv_unit: str,
    servings: int = 1,
) -> tuple:
    """
    Returns (missing_amount, display_unit).
    Converts both to base unit, subtracts, converts result back to recipe_unit.
    Falls back to raw subtraction if units are incompatible.
    """
    required = recipe_qty * servings
    r_unit = _norm(recipe_unit)
    i_unit = _norm(inv_unit)

    if same_group(r_unit, i_unit):
        r_base = required * ALL_FACTORS.get(r_unit, 1.0)
        i_base = inv_qty  * ALL_FACTORS.get(i_unit, 1.0)
        diff_base = max(r_base - i_base, 0.0)
        factor = ALL_FACTORS.get(r_unit, 1.0)
        return round(diff_base / factor, 4), recipe_unit
    else:
        # incompatible units — raw compare
        return round(max(required - inv_qty, 0.0), 4), recipe_unit
