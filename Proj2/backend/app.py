import os
import csv
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

# import our synthetic-data helpers
from data_tools import data_generator, data_loader

app = Flask(__name__)
CORS(app)

# =========================
# MODELS
# =========================

@dataclass
class Restaurant:
    restaurant_id: str
    name: str
    opening_time: str
    closing_time: str
    base_delivery_fee: float
    dynamic_pricing_enabled: bool = False
    waste_management_badge: bool = False
    last_waste_submission: Optional[datetime] = None

@dataclass
class MenuItem:
    item_id: str
    restaurant_id: str
    name: str
    base_price: float
    quantity_available: int
    prepares_in_minutes: int = 15

@dataclass
class OrderItem:
    item_id: str
    quantity: int
    price_charged: float

@dataclass
class Order:
    order_id: str
    restaurant_id: str
    customer_name: str
    customer_address: str
    items: List[OrderItem]
    delivery_fee: float
    discount_applied: float = 0.0
    created_at: datetime = datetime.utcnow()
    estimated_delivery_time: Optional[datetime] = None

# =========================
# IN-MEMORY DB
# =========================

restaurants_db: Dict[str, Restaurant] = {}
orders_db: Dict[str, Order] = {}
menu_items_db: Dict[str, MenuItem] = {}

# =========================
# HELPERS
# =========================

def compute_dynamic_delivery_fee(restaurant: Restaurant) -> float:
    """very simple: cheaper as we get close to closing"""
    try:
        now = datetime.now()
        closing = datetime.combine(
            now.date(),
            datetime.strptime(restaurant.closing_time, "%H:%M").time()
        )
        minutes_left = max(0, int((closing - now).total_seconds() // 60))
    except Exception:
        minutes_left = 120

    # 0 min -> 0.5x, 120min -> 1.0x
    max_mins = 120
    mult = 0.5 + 0.5 * min(1.0, minutes_left / max_mins)
    return round(restaurant.base_delivery_fee * mult, 2)

# =========================
# BOOTSTRAP FROM CSV / SYNTHETIC
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

def hydrate_from_cleaned_df(df):
    """turn integrated pandas df into our in-memory structures"""
    # optional: clear first
    restaurants_db.clear()
    menu_items_db.clear()

    for idx, row in df.iterrows():
        rname = row.get("restaurant") or "Sample Restaurant"
        rid = rname.lower().replace(" ", "_")
        if rid not in restaurants_db:
            restaurants_db[rid] = Restaurant(
                restaurant_id=rid,
                name=rname,
                opening_time="09:00",
                closing_time="21:00",
                base_delivery_fee=50.0,
                dynamic_pricing_enabled=False,
                waste_management_badge=False,
            )
        # item name
        entree = (
            row.get("entree")
            or row.get("menu_item")
            or row.get("item")
            or f"Item {idx+1}"
        )
        # price
        raw_price = (
            row.get("est_cost_usd")
            or row.get("unit_cost_usd")
            or 10.0
        )
        try:
            price = float(raw_price)
        except Exception:
            price = 10.0

        # quantity
        raw_qty = row.get("quantity_lb") or row.get("servings") or 1
        try:
            qty = int(float(raw_qty))
        except Exception:
            qty = 1

        item_id = f"{rid}_item_{idx+1}"
        menu_items_db[item_id] = MenuItem(
            item_id=item_id,
            restaurant_id=rid,
            name=entree,
            base_price=price,
            quantity_available=qty,
            prepares_in_minutes=15,
        )

def bootstrap_data():
    """1) generate synthetic if missing 2) load+integrate 3) hydrate to memory"""
    # 1) run generator if core csv missing
    core_csv = os.path.join(DATA_DIR, "Raleigh_Food_Waste__1-week_sample_.csv")
    if not os.path.exists(core_csv):
        # generator should write to backend/data by its own logic
        data_generator.main()
    # 2) integrate
    df = data_loader.integrate_all()
    # 3) hydrate in-memory
    hydrate_from_cleaned_df(df)

# run on startup
bootstrap_data()

# =========================
# ROUTES
# =========================

@app.route("/api/restaurant/register", methods=["POST"])
def register_restaurant():
    data = request.json
    rid = data["restaurant_id"]
    restaurants_db[rid] = Restaurant(
        restaurant_id=rid,
        name=data["name"],
        opening_time=data.get("opening_time", "09:00"),
        closing_time=data.get("closing_time", "21:00"),
        base_delivery_fee=float(data.get("base_delivery_fee", 50.0)),
        dynamic_pricing_enabled=bool(data.get("dynamic_pricing_enabled", False)),
        waste_management_badge=bool(data.get("waste_management_badge", False)),
    )
    return jsonify({"status": "success", "restaurant": asdict(restaurants_db[rid])})

@app.route("/api/menu/<restaurant_id>", methods=["GET"])
def get_menu(restaurant_id):
    if restaurant_id not in restaurants_db:
        return jsonify({"error": "restaurant not found"}), 404
    items = [
        asdict(mi) for mi in menu_items_db.values()
        if mi.restaurant_id == restaurant_id
    ]
    return jsonify({"restaurant_id": restaurant_id, "items": items})

@app.route("/api/menu/<restaurant_id>/add-item", methods=["POST"])
def add_menu_item(restaurant_id):
    if restaurant_id not in restaurants_db:
        return jsonify({"error": "restaurant not found"}), 404
    data = request.json
    item_id = data["item_id"]
    menu_items_db[item_id] = MenuItem(
        item_id=item_id,
        restaurant_id=restaurant_id,
        name=data["name"],
        base_price=float(data["base_price"]),
        quantity_available=int(data.get("quantity_available", 10)),
        prepares_in_minutes=int(data.get("prepares_in_minutes", 15)),
    )
    return jsonify({"status": "success", "item": asdict(menu_items_db[item_id])})

@app.route("/api/order/create", methods=["POST"])
def create_order():
    data = request.json
    restaurant_id = data["restaurant_id"]
    if restaurant_id not in restaurants_db:
        return jsonify({"error": "restaurant not found"}), 404
    rest = restaurants_db[restaurant_id]

    items_payload = data.get("items", [])
    order_items: List[OrderItem] = []
    subtotal = 0.0
    for it in items_payload:
        iid = it["item_id"]
        qty = int(it.get("quantity", 1))
        if iid not in menu_items_db:
            return jsonify({"error": f"menu item {iid} not found"}), 400
        m = menu_items_db[iid]
        order_items.append(OrderItem(item_id=iid, quantity=qty, price_charged=m.base_price))
        subtotal += m.base_price * qty

    delivery_fee = compute_dynamic_delivery_fee(rest)
    order_id = f"ORD-{len(orders_db)+1}"
    order = Order(
        order_id=order_id,
        restaurant_id=restaurant_id,
        customer_name=data.get("customer_name", "Guest"),
        customer_address=data.get("customer_address", ""),
        items=order_items,
        delivery_fee=delivery_fee,
        created_at=datetime.utcnow(),
        estimated_delivery_time=datetime.utcnow() + timedelta(minutes=40),
    )
    orders_db[order_id] = order
    return jsonify({"status": "success", "order": {
        "order_id": order.order_id,
        "restaurant_id": order.restaurant_id,
        "delivery_fee": order.delivery_fee,
        "items": [asdict(i) for i in order.items],
        "created_at": order.created_at.isoformat(),
        "estimated_delivery_time": order.estimated_delivery_time.isoformat(),
    }}), 201

# --------- React helper endpoints ---------

@app.route("/api/summary", methods=["GET"])
def api_summary():
    return jsonify({
        "total_restaurants": len(restaurants_db),
        "total_orders": len(orders_db),
        "tagline": "Dynamic Pricing for Waste Reduction",
        "subtagline": "Smart food delivery with sustainable pricing",
    })

@app.route("/api/doordash_menu", methods=["GET"])
def api_doordash_menu():
    restaurants_list = []
    for rid, r in restaurants_db.items():
        restaurants_list.append({
            "name": r.name,
            "location": "",
            "cuisine": "",
            "waste_stats": {
                "total_waste_lb": 0.0,
                "total_cost_usd": 0.0,
                "records": 0,
            },
            "items": []
        })
    name_index = {r["name"]: r for r in restaurants_list}
    for item in menu_items_db.values():
        rest = restaurants_db.get(item.restaurant_id)
        if not rest:
            continue
        bucket = name_index.get(rest.name)
        if not bucket:
            bucket = {
                "name": rest.name,
                "location": "",
                "cuisine": "",
                "waste_stats": {
                    "total_waste_lb": 0.0,
                    "total_cost_usd": 0.0,
                    "records": 0,
                },
                "items": []
            }
            name_index[rest.name] = bucket
            restaurants_list.append(bucket)
        bucket["items"].append({
            "entree": item.name,
            "date": "",
            "time": "",
            "waste_type": "",
            "quantity_lb": float(item.quantity_available),
            "est_cost_usd": float(item.base_price),
            "disposal_method": "",
            "reason": "",
        })
    restaurants_list.sort(key=lambda x: x["name"].lower())
    return jsonify({"restaurants": restaurants_list})

# optional admin reseed
@app.route("/api/admin/reseed", methods=["POST"])
def reseed():
    bootstrap_data()
    return jsonify({"status": "ok", "message": "synthetic data regenerated & loaded"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
