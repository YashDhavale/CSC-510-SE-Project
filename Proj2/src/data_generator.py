# proj2/src/data_generator.py
"""
Generates synthetic datasets for TiffinTrails Issue #2:
 - Raleigh_Food_Waste__1-week_sample_.csv
 - Restaurant_Metadata.csv
 - Customer_Feedback.csv
 - Delivery_Logs.csv
 - Menu_Portions.csv
"""

import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

random.seed(42)
np.random.seed(42)

RESTAURANTS = [
    "Eastside Deli", "Oak Street Bistro", "Southside Pizza Lab",
    "Hillside Kitchen", "Triangle BBQ Co.", "Village Noodle Bar",
    "Roosevelt Oyster House", "Capital City Tacos", "GreenBite Cafe", "UrbanEats"
]

CUISINES = ["Deli", "Southern", "Italian", "New American", "BBQ", "Asian", "Seafood", "Mexican", "Indian", "Fusion"]
WASTE_TYPES = ["Overproduction", "Spoilage", "Prep Trim", "Plate Waste", "Expired", "Damaged"]
DISPOSAL = ["Compost", "Trash", "Donation"]
REASONS = ["Low demand", "Inventory error", "Improper storage", "End of service", "Customer returned", "Batch cooked too much", "Shift change discard"]
MENU_ITEMS = ["Chicken Salad Sandwich", "Biscuits & Gravy", "Margherita Pizza", "Eggplant Parmesan",
              "Veggie Grain Bowl", "Smoked Turkey", "Pad Thai", "Fish & Chips", "Veggie Burrito", "Seared Salmon"]

def generate_waste_data(n=250, start_date=datetime(2025,10,6)):
    rows = []
    for i in range(n):
        dt = start_date + timedelta(minutes=random.randint(0, 7*24*60))  # within a week
        restaurant = random.choice(RESTAURANTS)
        entree = random.choice(MENU_ITEMS)
        cuisine = random.choice(CUISINES)
        location = f"Raleigh, Zone-{random.randint(1,10)}"
        waste_type = random.choice(WASTE_TYPES)
        quantity_lb = round(abs(np.random.normal(4, 5)), 2)  # many small, some large
        servings = max(1, int(quantity_lb / max(0.1, np.random.normal(0.5,0.2))))
        unit_cost_usd = round(random.uniform(2.0, 12.0), 2)
        est_cost_usd = round(quantity_lb * unit_cost_usd, 2)
        disposal_method = random.choice(DISPOSAL)
        reason = random.choice(REASONS)
        storage_temp_F = round(random.uniform(30, 160), 1)
        safe_temp_range_ok = (40 < storage_temp_F < 140)
        rows.append({
            "date": dt.strftime("%Y-%m-%d"),
            "day_of_week": dt.strftime("%A"),
            "time": dt.strftime("%H:%M"),
            "restaurant": restaurant,
            "entree": entree,
            "cuisine": cuisine,
            "location": location,
            "waste_type": waste_type,
            "quantity_lb": quantity_lb,
            "servings": servings,
            "unit_cost_usd": unit_cost_usd,
            "est_cost_usd": est_cost_usd,
            "disposal_method": disposal_method,
            "reason": reason,
            "storage_temp_F": storage_temp_F,
            "safe_temp_range_ok": safe_temp_range_ok
        })
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(DATA_DIR, "Raleigh_Food_Waste__1-week_sample_.csv"), index=False)
    print("Generated Raleigh_Food_Waste__1-week_sample_.csv (rows={})".format(len(df)))

def generate_restaurant_metadata():
    rows = []
    for r in RESTAURANTS:
        rows.append({
            "restaurant": r,
            "cuisine": random.choice(CUISINES),
            "capacity": random.randint(30, 200),
            "seating_type": random.choice(["Indoor","Outdoor","Counter"]),
            "avg_daily_orders": random.randint(50, 400),
            "has_sustainability_program": random.choice([True, False]),
            "zip_code": random.choice([27601,27603,27604,27605,27606,27607,27608,27609,27610])
        })
    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, "Restaurant_Metadata.csv"), index=False)
    print("Generated Restaurant_Metadata.csv")

def generate_customer_feedback(n=200):
    rows = []
    start_date = datetime(2025,10,6)
    for i in range(n):
        dt = start_date + timedelta(days=random.randint(0,6))
        restaurant = random.choice(RESTAURANTS)
        rows.append({
            "restaurant": restaurant,
            "date": dt.strftime("%Y-%m-%d"),
            "delivery_rating": random.randint(1,5),
            "food_quality_rating": random.randint(1,5),
            "feedback_text": random.choice([
                "Excellent packaging and timely delivery.",
                "Food arrived cold and was late.",
                "Portion size was perfect.",
                "Too much salt but tasted good.",
                "Packaging sustainable and neat.",
                "Received wrong item."
            ])
        })
    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, "Customer_Feedback.csv"), index=False)
    print("Generated Customer_Feedback.csv (rows={})".format(n))

def generate_menu_portions():
    rows = []
    for item in MENU_ITEMS:
        rows.append({
            "entree": item,
            "standard_portion_oz": random.choice([8,10,12,14,16]),
            "expected_servings": random.randint(1,6),
            "avg_unit_cost_usd": round(random.uniform(2.5, 10.0), 2)
        })
    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, "Menu_Portions.csv"), index=False)
    print("Generated Menu_Portions.csv")

def generate_delivery_logs(n=250):
    rows = []
    start_dt = datetime(2025,10,6)
    for i in range(n):
        dt = start_dt + timedelta(minutes=random.randint(0, 7*24*60))
        order_id = f"ORD-{1000+i}"
        restaurant = random.choice(RESTAURANTS)
        courier_id = f"CR-{random.randint(1,30)}"
        distance_km = round(abs(np.random.normal(5, 3)), 2)  # mostly short trips
        delivery_time_min = max(3, int(abs(np.random.normal(20,8))))
        portion_size = random.choice(["small","medium","large"])
        delivered = random.choice([True]*92 + [False]*8)  # most delivered
        delayed = delivery_time_min > 30
        rows.append({
            "order_id": order_id,
            "date": dt.strftime("%Y-%m-%d"),
            "time": dt.strftime("%H:%M"),
            "restaurant": restaurant,
            "courier_id": courier_id,
            "distance_km": distance_km,
            "delivery_time_min": delivery_time_min,
            "portion_size": portion_size,
            "delivered": delivered,
            "delayed": delayed
        })
    pd.DataFrame(rows).to_csv(os.path.join(DATA_DIR, "Delivery_Logs.csv"), index=False)
    print("Generated Delivery_Logs.csv (rows={})".format(n))

def main():
    generate_waste_data(n=300)
    generate_restaurant_metadata()
    generate_customer_feedback(n=250)
    generate_menu_portions()
    generate_delivery_logs(n=350)
    print("\nAll synthetic datasets generated in proj2/data/")

if __name__ == "__main__":
    main()
