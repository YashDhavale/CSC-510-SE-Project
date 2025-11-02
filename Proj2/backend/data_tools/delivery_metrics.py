import pandas as pd
from pathlib import Path

def compute_delivery_metrics(input_file: str, output_file: str):
    """
    Process Delivery_Logs.csv to compute vendor-level KPIs:
    - Average delivery time
    - On-time delivery rate
    - Average distance per delivery
    - Delivery volume per day
    """

    # --- Load CSV ---
    df = pd.read_csv(input_file)

    required_cols = [
        "order_id", "date", "restaurant", "distance_km",
        "delivery_time_min", "delayed"
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # --- Clean up and normalize ---
    df = df.dropna(subset=required_cols)
    df["date"] = pd.to_datetime(df["date"], errors="coerce")

    # Ensure delayed is boolean
    df["delayed"] = df["delayed"].astype(str).str.lower().isin(["true", "1", "yes"])
    df["on_time"] = ~df["delayed"]

    # --- Compute metrics per restaurant ---
    vendor_metrics = df.groupby("restaurant").agg(
        avg_delivery_time=("delivery_time_min", "mean"),
        on_time_rate=("on_time", "mean"),
        avg_distance=("distance_km", "mean"),
        deliveries_per_day=("date", lambda x: len(x) / x.nunique())
    ).reset_index()

    # --- Format and round results ---
    vendor_metrics["avg_delivery_time"] = vendor_metrics["avg_delivery_time"].round(2)
    vendor_metrics["on_time_rate"] = (vendor_metrics["on_time_rate"] * 100).round(2)
    vendor_metrics["avg_distance"] = vendor_metrics["avg_distance"].round(2)
    vendor_metrics["deliveries_per_day"] = vendor_metrics["deliveries_per_day"].round(2)

    # --- Save output ---
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    vendor_metrics.to_csv(output_path, index=False)
    print(f"vendor_delivery_metrics.csv created at: {output_path}")

if __name__ == "__main__":
    base_path = Path(__file__).resolve().parents[1] / "data"
    input_csv = base_path / "Delivery_Logs.csv"
    output_csv = base_path / "vendor_delivery_metrics.csv"
    compute_delivery_metrics(str(input_csv), str(output_csv))
