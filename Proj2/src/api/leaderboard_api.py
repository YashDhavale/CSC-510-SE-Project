from flask import Blueprint, jsonify
from pathlib import Path
import json

leaderboard_bp = Blueprint("leaderboard_bp", __name__)

DATA_FILE = Path(__file__).resolve().parents[1] / "backend" / "data" / "restaurant_points.json"

@leaderboard_bp.get("/api/restaurant-points")
def get_restaurant_points():
    try:
        raw = DATA_FILE.read_text(encoding="utf-8")
        data = json.loads(raw)

        arr = []
        # 1) Wrapper shape: { "success": 1, "points": { "Name": count, ... } }
        if isinstance(data, dict) and "points" in data:
            pts = data["points"]
            if isinstance(pts, dict):
                arr = [{"name": k, "points": int(pts[k] or 0)} for k in pts.keys()]
            elif isinstance(pts, list):
                arr = [
                    {"name": (d.get("name") or d.get("restaurant") or str(d.get("id") or "")),
                     "points": int(d.get("points") or d.get("count") or 0)}
                    for d in pts
                ]
        # 2) Plain map: { "Name": count, ... }
        elif isinstance(data, dict):
            arr = [{"name": k, "points": int(v or 0)} for k, v in data.items()]
        # 3) Plain list: [ {name, points}, ... ] or variants
        elif isinstance(data, list):
            arr = [
                {"name": (d.get("name") or d.get("restaurant") or str(d.get("id") or "")),
                 "points": int(d.get("points") or d.get("count") or 0)}
                for d in data
            ]

        # Sort: points desc, then name
        arr.sort(key=lambda x: (-x.get("points", 0), x.get("name", "")))
        return jsonify(arr), 200
    except FileNotFoundError:
        return jsonify([]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
