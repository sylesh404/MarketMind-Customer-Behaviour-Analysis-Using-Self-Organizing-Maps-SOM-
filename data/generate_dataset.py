import os
import numpy as np
import pandas as pd

def generate_customer_data(n_samples=1000, seed=42):
    np.random.seed(seed)
    
    # We will generate synthetic customers based on 6 behavioral archetypes
    archetypes = [
        # 1. VIP High Spenders (15%)
        {"name": "VIP", "weight": 0.15, 
         "age": (32, 55), "income": (1200000, 2800000), "spend_score": (80, 99),
         "freq": (15, 30), "recency": (1, 15), "visits": (30, 90), "discount": (0.05, 0.25), "orders": (20, 50)},
        
        # 2. Loyal Steady Buyers (25%)
        {"name": "Loyal", "weight": 0.25,
         "age": (28, 62), "income": (600000, 1400000), "spend_score": (60, 85),
         "freq": (10, 22), "recency": (5, 30), "visits": (20, 60), "discount": (0.15, 0.40), "orders": (12, 35)},
        
        # 3. Bargain / Discount Hunters (20%)
        {"name": "Discount", "weight": 0.20,
         "age": (21, 48), "income": (350000, 850000), "spend_score": (40, 75),
         "freq": (8, 18), "recency": (10, 45), "visits": (25, 75), "discount": (0.50, 0.90), "orders": (8, 25)},
        
        # 4. Young High-Engagement Potential (15%)
        {"name": "Potential", "weight": 0.15,
         "age": (18, 30), "income": (300000, 750000), "spend_score": (55, 80),
         "freq": (5, 14), "recency": (8, 35), "visits": (40, 110), "discount": (0.20, 0.50), "orders": (5, 18)},
        
        # 5. At-Risk / Lapsing Customers (15%)
        {"name": "AtRisk", "weight": 0.15,
         "age": (35, 68), "income": (500000, 1600000), "spend_score": (15, 45),
         "freq": (1, 6), "recency": (90, 360), "visits": (2, 15), "discount": (0.10, 0.40), "orders": (1, 8)},
        
        # 6. Occasional Low Spenders (10%)
        {"name": "Occasional", "weight": 0.10,
         "age": (22, 60), "income": (250000, 600000), "spend_score": (10, 35),
         "freq": (1, 5), "recency": (45, 180), "visits": (5, 25), "discount": (0.05, 0.30), "orders": (1, 6)}
    ]
    
    records = []
    customer_id = 1001
    
    for archetype in archetypes:
        count = int(n_samples * archetype["weight"])
        for _ in range(count):
            age = int(np.random.uniform(*archetype["age"]))
            gender = np.random.choice(["Female", "Male"], p=[0.52, 0.48])
            income = float(np.round(np.random.uniform(*archetype["income"]), -3))
            spend_score = int(np.clip(np.random.normal(np.mean(archetype["spend_score"]), 4), 1, 100))
            freq = int(np.clip(np.random.normal(np.mean(archetype["freq"]), 2), 1, 35))
            recency = int(np.clip(np.random.normal(np.mean(archetype["recency"]), 8), 1, 365))
            visits = int(np.clip(np.random.normal(np.mean(archetype["visits"]), 8), 1, 150))
            discount = float(np.clip(np.round(np.random.uniform(*archetype["discount"]), 2), 0.0, 1.0))
            orders = int(np.clip(np.random.normal(np.mean(archetype["orders"]), 3), 1, 60))
            
            # Derived realistic values
            avg_order_val = float(np.round(income * (spend_score / 100.0) * np.random.uniform(0.01, 0.035) / max(orders, 1), -1))
            avg_order_val = float(np.clip(avg_order_val, 400, 35000))
            total_spending = float(np.round(avg_order_val * orders, -1))
            clv = float(np.round(total_spending * np.random.uniform(1.8, 3.5), -1))
            
            records.append({
                "Customer_ID": customer_id,
                "Age": age,
                "Gender": gender,
                "Annual_Income": income,
                "Spending_Score": spend_score,
                "Purchase_Frequency": freq,
                "Total_Spending": total_spending,
                "Average_Order_Value": avg_order_val,
                "Recency": recency,
                "Website_Visits": visits,
                "Discount_Usage": discount,
                "Number_of_Orders": orders,
                "Customer_Lifetime_Value": clv
            })
            customer_id += 1
            
    df = pd.DataFrame(records)
    # Shuffle dataframe
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    # Reassign customer IDs sequentially after shuffle
    df["Customer_ID"] = range(1001, 1001 + len(df))
    return df

if __name__ == "__main__":
    os.makedirs("c:/Users/Sakthi sylesh/Downloads/Market Customer Behaviour Analysis using SOM/data", exist_ok=True)
    df = generate_customer_data(1000)
    out_path = "c:/Users/Sakthi sylesh/Downloads/Market Customer Behaviour Analysis using SOM/data/sample_customers.csv"
    df.to_csv(out_path, index=False)
    print(f"Generated {len(df)} customer records saved to {out_path}")
