// frontend/src/services/reviews.js

export async function fetchReviews(restaurantId) {
  try {
    const res = await fetch(`/api/reviews/${restaurantId}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    return { success: false, reviews: [] };
  }
}

export async function submitReview(restaurantId, { rating, comment, user }) {
  try {
    const res = await fetch(`/api/reviews/${restaurantId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, user }),
    });

    return await res.json();
  } catch (err) {
    console.error("Failed to submit review:", err);
    return { success: false };
  }
}
