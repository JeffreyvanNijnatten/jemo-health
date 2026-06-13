"""
TANITA GRAPHV1 CSV parser.

Accepts either:
  - A zipfile (uploaded directly)
  - A directory path containing GRAPHV1/SYSTEM/ and GRAPHV1/DATA/

Returns:
  {
    "profiles": [{slot_id, date_of_birth, gender, height_cm, body_type, activity_level}],
    "measurements": [{profile_id, measured_at_iso, weight_kg, ...}],
  }
"""

import io
import re
import zipfile
from datetime import datetime
from typing import Optional


def _parse_kv_line(line: str) -> dict:
    """Parse a TANITA CSV line like: {0,16,...,DT,"21/01/2026",Ti,"18:02:26",...}"""
    # Strip leading { and trailing }
    content = line.strip().lstrip("{").rstrip("}")
    result = {}
    tokens = []
    # Tokenize respecting quoted strings
    for match in re.finditer(r'"([^"]*)"|(~\d+|\d+(?:\.\d+)?|[A-Za-z]+)', content):
        if match.group(1) is not None:
            tokens.append(match.group(1))
        else:
            tokens.append(match.group(2))

    i = 0
    while i < len(tokens) - 1:
        key = tokens[i]
        val = tokens[i + 1]
        # Only treat as key-value if key is alphabetic (not a number/index)
        if re.match(r'^[A-Za-z][A-Za-z0-9]*$', key):
            try:
                result[key] = float(val) if '.' in val else (int(val) if val.lstrip('-').isdigit() else val)
            except (ValueError, AttributeError):
                result[key] = val
            i += 2
        else:
            i += 1
    return result


def _parse_date(s: str) -> Optional[str]:
    """DD/MM/YYYY → YYYY-MM-DD"""
    try:
        return datetime.strptime(s, "%d/%m/%Y").strftime("%Y-%m-%d")
    except Exception:
        return None


def _parse_datetime(date_str: str, time_str: str) -> Optional[str]:
    """DD/MM/YYYY + HH:MM:SS → ISO 8601 UTC string (treated as local, stored naive)"""
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M:%S")
        return dt.isoformat()
    except Exception:
        return None


def _parse_profile_csv(content: str, slot_id: int) -> Optional[dict]:
    for line in content.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        kv = _parse_kv_line(line)
        if not kv:
            continue
        return {
            "slot_id": slot_id,
            "date_of_birth": _parse_date(str(kv.get("DB", ""))),
            "gender": int(kv["GE"]) if "GE" in kv else None,
            "height_cm": float(kv["Hm"]) if "Hm" in kv else None,
            "body_type": int(kv["Bt"]) if "Bt" in kv else None,
            "activity_level": int(kv["AL"]) if "AL" in kv else None,
        }
    return None


def _parse_data_csv(content: str, profile_id: int) -> list[dict]:
    measurements = []
    for line in content.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        kv = _parse_kv_line(line)
        if "DT" not in kv or "Ti" not in kv:
            continue
        measured_at = _parse_datetime(str(kv["DT"]), str(kv["Ti"]))
        if not measured_at:
            continue
        measurements.append({
            "profile_id": profile_id,
            "measured_at": measured_at,
            "height_cm": float(kv["Hm"]) if "Hm" in kv else None,
            "body_type": int(kv["Bt"]) if "Bt" in kv else None,
            "activity_level": int(kv["AL"]) if "AL" in kv else None,
            "age": int(kv["AG"]) if "AG" in kv else None,
            "weight_kg": float(kv["Wk"]) if "Wk" in kv else None,
            "bmi": float(kv["MI"]) if "MI" in kv else None,
            "fat_total_pct": float(kv["FW"]) if "FW" in kv else None,   # FW = whole body fat %
            "fat_trunk_pct": float(kv["FT"]) if "FT" in kv else None,   # FT = trunk fat %
            "fat_right_arm_pct": float(kv["Fr"]) if "Fr" in kv else None,
            "fat_left_arm_pct": float(kv["Fl"]) if "Fl" in kv else None,
            "fat_right_leg_pct": float(kv["FR"]) if "FR" in kv else None,
            "fat_left_leg_pct": float(kv["FL"]) if "FL" in kv else None,
            "muscle_total_kg": float(kv["mW"]) if "mW" in kv else None,
            "muscle_trunk_kg": float(kv["mT"]) if "mT" in kv else None,
            "muscle_right_arm_kg": float(kv["mr"]) if "mr" in kv else None,
            "muscle_left_arm_kg": float(kv["ml"]) if "ml" in kv else None,
            "muscle_right_leg_kg": float(kv["mR"]) if "mR" in kv else None,
            "muscle_left_leg_kg": float(kv["mL"]) if "mL" in kv else None,
            "bone_kg": float(kv["bW"]) if "bW" in kv else None,
            "visceral_fat": int(kv["IF"]) if "IF" in kv else None,
            "resting_calories": int(kv["rD"]) if "rD" in kv else None,
            "metabolic_age": int(kv["rA"]) if "rA" in kv else None,
            "water_pct": float(kv["ww"]) if "ww" in kv else None,       # ww = body water %
        })
    return measurements


def _slot_from_filename(name: str) -> Optional[int]:
    """PROF1.CSV → 1, DATA4.CSV → 4"""
    m = re.search(r'(\d+)', name)
    return int(m.group(1)) if m else None


def parse_zip(file_bytes: bytes) -> dict:
    profiles = []
    measurements = []
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        names = zf.namelist()
        for name in names:
            basename = name.split("/")[-1].upper()
            if basename.startswith("PROF") and basename.endswith(".CSV"):
                slot = _slot_from_filename(basename)
                if slot is None:
                    continue
                content = zf.read(name).decode("utf-8", errors="replace")
                p = _parse_profile_csv(content, slot)
                if p:
                    profiles.append(p)
            elif basename.startswith("DATA") and basename.endswith(".CSV"):
                slot = _slot_from_filename(basename)
                if slot is None:
                    continue
                content = zf.read(name).decode("utf-8", errors="replace")
                measurements.extend(_parse_data_csv(content, slot))
    return {"profiles": profiles, "measurements": measurements}


def parse_directory(base_path: str) -> dict:
    import os
    profiles = []
    measurements = []
    for root, dirs, files in os.walk(base_path):
        for fname in files:
            upper = fname.upper()
            if upper.startswith("PROF") and upper.endswith(".CSV"):
                slot = _slot_from_filename(upper)
                if slot is None:
                    continue
                with open(os.path.join(root, fname), encoding="utf-8", errors="replace") as f:
                    p = _parse_profile_csv(f.read(), slot)
                    if p:
                        profiles.append(p)
            elif upper.startswith("DATA") and upper.endswith(".CSV"):
                slot = _slot_from_filename(upper)
                if slot is None:
                    continue
                with open(os.path.join(root, fname), encoding="utf-8", errors="replace") as f:
                    measurements.extend(_parse_data_csv(f.read(), slot))
    return {"profiles": profiles, "measurements": measurements}
