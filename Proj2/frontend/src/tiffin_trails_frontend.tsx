import React, { useEffect, useState } from "react";

type DashboardData = {
  total_restaurants: number;
  total_orders: number;
  tagline: string;
  subtagline: string;
};

type RestaurantItem = {
  entree: string;
  date: string;
  time: string;
  waste_type: string;
  quantity_lb: number;
  est_cost_usd: number;
  disposal_method: string;
  reason: string;
};

type Restaurant = {
  name: string;
  location: string;
  cuisine: string;
  waste_stats?: {
    total_waste_lb: number;
    total_cost_usd: number;
    records: number;
  };
  items: RestaurantItem[];
};

const TiffinTrailsFrontend: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "register" | "menu" | "order" | "badges">("dashboard");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    fetch("http://localhost:5001/api/summary")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {
        setData({
          total_restaurants: 0,
          total_orders: 0,
          tagline: "Dynamic Pricing for Waste Reduction",
          subtagline: "Smart food delivery with sustainable pricing",
        });
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5001/api/doordash_menu")
      .then((res) => res.json())
      .then((json) => {
        const list = json.restaurants as Restaurant[];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurant(list[0]);
      })
      .catch((err) => console.error("menu load failed", err));
  }, []);

  const tabs: Array<{ id: typeof activeTab; label: string; icon: string }> = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "register", label: "Register", icon: "🧾" },
    { id: "menu", label: "Menu", icon: "🧆" },
    { id: "order", label: "Order", icon: "🛒" },
    { id: "badges", label: "Badges", icon: "🌱" },
  ];

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "linear-gradient(180deg, #ffe9e9 0%, #fff5f5 35%, #ffffff 100%)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          background: "linear-gradient(90deg, #F38A30 0%, #EB4C42 50%, #D53E96 100%)",
          padding: "18px 38px 60px 38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 24px rgba(211, 64, 100, 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "40px" }}>🍱</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 700, color: "#fff" }}>
              TiffinTrails
            </h1>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                color: "rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              Smart food delivery with sustainable pricing <span style={{ fontSize: "14px" }}>🌍</span>
            </p>
          </div>
        </div>
        <button
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "9999px",
            padding: "10px 20px",
            color: "#fff",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backdropFilter: "blur(10px)",
          }}
        >
          ✨ Dynamic Pricing for Waste Reduction
        </button>
      </header>

      <div
        style={{
          marginTop: "-34px",
          padding: "0 38px",
          display: "flex",
          gap: "18px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: "none",
                background: isActive ? "#F67038" : "#fff",
                color: isActive ? "#fff" : "#555",
                borderRadius: "16px",
                padding: "11px 22px",
                boxShadow: isActive ? "0 10px 18px rgba(246,112,56,0.4)" : "0 4px 10px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <main style={{ padding: "26px 38px 40px 38px" }}>
        <div
          style={{
            display: "flex",
            gap: "28px",
            flexWrap: "wrap",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "18px 24px",
              flex: "1 1 340px",
              boxShadow: "0 10px 24px rgba(250, 140, 82, 0.12)",
              borderLeft: "6px solid #F67431",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: "108px",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>Total Restaurants</p>
              <p
                style={{
                  margin: "12px 0 0 0",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#F67431",
                  lineHeight: 1,
                }}
              >
                {data ? data.total_restaurants : 0}
              </p>
            </div>
            <div
              style={{
                background: "#FFE8CF",
                borderRadius: "18px",
                width: "66px",
                height: "58px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "30px", color: "#DC6527" }}>🏅</span>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "18px 24px",
              flex: "1 1 340px",
              boxShadow: "0 10px 24px rgba(246, 49, 76,0.08)",
              borderLeft: "6px solid #ED4550",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: "108px",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}>Total Orders</p>
              <p
                style={{
                  margin: "12px 0 0 0",
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#EB4C42",
                  lineHeight: 1,
                }}
              >
                {data ? data.total_orders : 0}
              </p>
            </div>
            <div
              style={{
                background: "#FFE0E2",
                borderRadius: "18px",
                width: "66px",
                height: "58px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "30px", color: "#E94B4A" }}>🚚</span>
            </div>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div
            style={{
              display: "flex",
              gap: "18px",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                width: "245px",
                background: "#fff",
                borderRadius: "18px",
                boxShadow: "0 8px 18px rgba(0,0,0,0.03)",
                padding: "14px 12px 14px 12px",
              }}
            >
              <p style={{ margin: "0 0 10px 4px", fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                Restaurants
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "370px",
                  overflowY: "auto",
                }}
              >
                {restaurants.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => setSelectedRestaurant(r)}
                    style={{
                      textAlign: "left",
                      background:
                        selectedRestaurant && selectedRestaurant.name === r.name
                          ? "linear-gradient(90deg, #FEE9DE 0%, #FFF8F5 100%)"
                          : "#fff",
                      border: "1px solid rgba(246,112,56,0.14)",
                      borderRadius: "12px",
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "12.5px", color: "#1F2937" }}>{r.name}</div>
                    <div style={{ fontSize: "11px", color: "#6B7280" }}>
                      {r.cuisine ? r.cuisine : "Cuisine not set"}
                    </div>
                    {r.waste_stats && (
                      <div style={{ fontSize: "10px", color: "#EF6C36", marginTop: "2px" }}>
                        ~{r.waste_stats.total_waste_lb?.toFixed(1)} lb waste
                      </div>
                    )}
                  </button>
                ))}
                {restaurants.length === 0 && (
                  <p style={{ fontSize: "11.5px", color: "#9CA3AF", padding: "8px 4px" }}>
                    No restaurants loaded.
                  </p>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: "#fff",
                borderRadius: "18px",
                boxShadow: "0 8px 18px rgba(0,0,0,0.03)",
                padding: "16px 16px 20px 16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "#1F2937" }}>
                    {selectedRestaurant ? selectedRestaurant.name : "Pick a restaurant"}
                  </p>
                  <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#6B7280" }}>
                    {selectedRestaurant
                      ? `${selectedRestaurant.location || "Raleigh, NC"} • ${
                          selectedRestaurant.cuisine || "Cuisine not specified"
                        }`
                      : "Select a restaurant from the list to view its items"}
                  </p>
                </div>
                {selectedRestaurant && (
                  <span
                    style={{
                      fontSize: "11px",
                      background: "#FFF2E7",
                      color: "#F57036",
                      padding: "5px 12px",
                      borderRadius: "999px",
                    }}
                  >
                    {selectedRestaurant.items.length} item
                    {selectedRestaurant.items.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))",
                  gap: "14px",
                  marginTop: "16px",
                }}
              >
                {selectedRestaurant ? (
                  selectedRestaurant.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid rgba(242, 137, 83, 0.15)",
                        borderRadius: "14px",
                        padding: "8px 10px 10px 10px",
                        background: "#fff",
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: "12.5px", marginBottom: "3px" }}>{item.entree}</p>
                      <p style={{ fontSize: "10.5px", color: "#6B7280", marginBottom: "3px" }}>
                        {item.waste_type || "Waste item"}
                      </p>
                      <p style={{ fontSize: "10px", color: "#9CA3AF" }}>
                        {item.date} {item.time}
                      </p>
                      <p style={{ fontSize: "10.6px", marginTop: "4px" }}>
                        Qty wasted: <strong>{item.quantity_lb?.toFixed(2)} lb</strong>
                      </p>
                      <p style={{ fontSize: "10.6px" }}>
                        Est. cost:{" "}
                        <strong>
                          ${isNaN(item.est_cost_usd) ? "0.00" : item.est_cost_usd.toFixed(2)}
                        </strong>
                      </p>
                      {item.disposal_method && (
                        <span
                          style={{
                            fontSize: "9.5px",
                            background: "#E0F8DE",
                            color: "#267D32",
                            padding: "2px 6px",
                            borderRadius: "999px",
                            display: "inline-block",
                            marginTop: "4px",
                          }}
                        >
                          {item.disposal_method}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "11.5px", color: "#9CA3AF" }}>
                    Choose a restaurant to view menu items.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "register" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "18px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.03)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Register Restaurant</p>
            <p style={{ fontSize: "12px", color: "#666" }}>Form goes here.</p>
          </div>
        )}

        {activeTab === "menu" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "18px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.03)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Menu management</p>
            <p style={{ fontSize: "12px", color: "#666" }}>You can add or edit items here later.</p>
          </div>
        )}

        {activeTab === "order" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "18px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.03)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Order</p>
            <p style={{ fontSize: "12px", color: "#666" }}>Order creation UI goes here.</p>
          </div>
        )}

        {activeTab === "badges" && (
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "18px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.03)",
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Badges</p>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Show sustainability / low-waste badges for restaurants.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TiffinTrailsFrontend;
