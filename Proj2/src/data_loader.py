# proj2/src/data_loader.py
"""
Loads, validates, cleans, and integrates the generated datasets:
- Raleigh_Food_Waste__1-week_sample_.csv
- Restaurant_Metadata.csv
- Customer_Feedback.csv
- Menu_Portions.csv
- Delivery_Logs.csv

Outputs:
- cleaned_master_dataset.csv
"""

import os
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "cleaned_master_dataset.csv")

def load_csv(name):
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing {name} in {DATA_DIR}. Please run data_generator.py first.")
    df = pd.read_csv(path)
    print(f"Loaded {name}: {len(df)} rows, {len(df.columns)} cols")
    return df

def basic_clean(df):
    # strip strings and drop exact duplicates
    df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    df.drop_duplicates(inplace=True)
    return df

def coerce_types(df):
    # convert numeric fields where possible
    for col in ["quantity_lb","servings","unit_cost_usd","est_cost_usd","storage_temp_F","distance_km","delivery_time_min"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df

def integrate_all():
    waste = basic_clean(load_csv("Raleigh_Food_Waste__1-week_sample_.csv"))
    meta = basic_clean(load_csv("Restaurant_Metadata.csv"))
    feedback = basic_clean(load_csv("Customer_Feedback.csv"))
    menu = basic_clean(load_csv("Menu_Portions.csv"))
    delivery = basic_clean(load_csv("Delivery_Logs.csv"))

    # type coercion
    waste = coerce_types(waste)
    delivery = coerce_types(delivery)

    # merge waste with restaurant metadata (left join)
    merged = pd.merge(waste, meta, on=["restaurant"], how="left", suffixes=("","_meta"))

    # merge menu portions by entree (if entree exists)
    if "entree" in merged.columns:
        merged = pd.merge(merged, menu, on=["entree"], how="left")

    # join delivery logs by restaurant and date/time neighborhood (approx join)
    # to keep things simple, join on restaurant + date (one-to-many OK)
    merged = pd.merge(merged, delivery, on=["restaurant","date"], how="left", suffixes=("","_delivery"))

    # merge feedback by restaurant + date (if available)
    merged = pd.merge(merged, feedback, on=["restaurant","date"], how="left", suffixes=("","_feedback"))

    # derived columns
    merged["waste_per_serving_lb"] = (merged["quantity_lb"] / merged["servings"]).round(3)
    merged["waste_pct_of_prepared"] = None  # placeholder for when prepared values available
    merged["avg_rating"] = ((merged.get("delivery_rating",0).fillna(0) + merged.get("food_quality_rating",0).fillna(0)) / 2).round(2)

    # Safety: fill NaNs with sensible defaults for downstream code
    merged["waste_per_serving_lb"] = merged["waste_per_serving_lb"].fillna(0)
    merged["avg_rating"] = merged["avg_rating"].fillna(0)

    # save
    merged.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved integrated cleaned dataset to {OUTPUT_FILE}")
    return merged

def main():
    merged = integrate_all()
    print("\nPreview of cleaned_master_dataset.csv:")
    print(merged.head(6))

if __name__ == "__main__":
    main()
