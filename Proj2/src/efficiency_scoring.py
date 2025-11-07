import pandas as pd
import os

def compute_efficiency_scores(delivery_metrics_path, metadata_path, output_path):
    """
    Combines delivery metrics with restaurant metadata to compute a normalized
    delivery efficiency score for each restaurant.

    Efficiency Score Formula (weighted):
        0.4 * on_time_rate
      + 0.3 * (1 - norm_avg_delivery_time)
      + 0.2 * (1 - norm_avg_distance)
      + 0.1 * norm_deliveries_per_day
    """

    # Load datasets
    delivery_df = pd.read_csv(delivery_metrics_path)
    meta_df = pd.read_csv(metadata_path)

    # Ensure key columns exist
    for col in ['restaurant', 'on_time_rate', 'avg_delivery_time', 'avg_distance', 'deliveries_per_day']:
        if col not in delivery_df.columns and col != 'restaurant':
            raise KeyError(f"Expected '{col}' column in delivery metrics file.")

    if 'restaurant' not in meta_df.columns:
        raise KeyError("Expected 'restaurant' column in metadata file.")

    # Merge datasets
    merged_df = pd.merge(delivery_df, meta_df, on='restaurant', how='left')

    # Normalize numeric columns
    for col in ['avg_delivery_time', 'avg_distance', 'deliveries_per_day']:
        min_val, max_val = merged_df[col].min(), merged_df[col].max()
        merged_df[f'norm_{col}'] = (
            (merged_df[col] - min_val) / (max_val - min_val) if max_val != min_val else 0.5
        )

    # Compute weighted efficiency score
    merged_df['efficiency_score'] = (
        0.4 * (merged_df['on_time_rate'] / 100) +       # convert to 0-1 scale
        0.3 * (1 - merged_df['norm_avg_delivery_time']) +
        0.2 * (1 - merged_df['norm_avg_distance']) +
        0.1 * merged_df['norm_deliveries_per_day']
    )

    # Scale efficiency score 0-100
    min_score, max_score = merged_df['efficiency_score'].min(), merged_df['efficiency_score'].max()
    merged_df['efficiency_score'] = 100 * ((merged_df['efficiency_score'] - min_score) / (max_score - min_score))

    # Save output
    merged_df.to_csv(output_path, index=False)
    print(f"Efficiency scores computed successfully and saved to {output_path}")


if __name__ == "__main__":
    base_path = os.path.join(os.path.dirname(__file__), "../data")
    delivery_metrics_path = os.path.join(base_path, "vendor_delivery_metrics.csv")
    metadata_path = os.path.join(base_path, "Restaurant_Metadata.csv")
    output_path = os.path.join(base_path, "vendor_efficiency_scores.csv")

    compute_efficiency_scores(delivery_metrics_path, metadata_path, output_path)
