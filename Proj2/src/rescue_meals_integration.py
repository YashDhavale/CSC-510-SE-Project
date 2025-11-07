import pandas as pd
import os
import json

# -------------------- Paths --------------------
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "../data")
os.makedirs(DATA_DIR, exist_ok=True)

RESCUE_CSV = os.path.join(DATA_DIR, "rescue_meals.csv")

# -------------------- Sample Rescue Meal Data --------------------
rescue_data = [
    {"restaurant": "Eastside Deli", "meal_name": "Chicken Salad Sandwich", "original_price": 10.99, "rescue_price": 6.99, "quantity": 3, "expires_in": "2 hours"},
    {"restaurant": "Eastside Deli", "meal_name": "Veggie Grain Bowl", "original_price": 12.99, "rescue_price": 7.99, "quantity": 2, "expires_in": "1 hour"},
    {"restaurant": "Oak Street Bistro", "meal_name": "Biscuits & Gravy", "original_price": 9.99, "rescue_price": 5.99, "quantity": 4, "expires_in": "3 hours"},
    {"restaurant": "GreenBite Cafe", "meal_name": "Veggie Thali", "original_price": 13.99, "rescue_price": 8.99, "quantity": 5, "expires_in": "2 hours"},
    {"restaurant": "GreenBite Cafe", "meal_name": "Paneer Tikka Bowl", "original_price": 14.99, "rescue_price": 9.99, "quantity": 2, "expires_in": "1.5 hours"},
    {"restaurant": "Triangle BBQ Co.", "meal_name": "Pulled Pork Sandwich", "original_price": 11.99, "rescue_price": 6.99, "quantity": 3, "expires_in": "2 hours"},
    {"restaurant": "Village Noodle Bar", "meal_name": "Veggie Ramen", "original_price": 12.49, "rescue_price": 7.49, "quantity": 4, "expires_in": "1 hour"}
]

# -------------------- Save CSV --------------------
df_rescue = pd.DataFrame(rescue_data)
df_rescue.to_csv(RESCUE_CSV, index=False)
print(f"✅ Rescue meals CSV created: {RESCUE_CSV}")

# -------------------- Optional: Save as JSON for quick Flask API use --------------------
RESCUE_JSON = os.path.join(DATA_DIR, "rescue_meals.json")
df_rescue.to_json(RESCUE_JSON, orient="records", indent=2)
print(f"✅ Rescue meals JSON created: {RESCUE_JSON}")
