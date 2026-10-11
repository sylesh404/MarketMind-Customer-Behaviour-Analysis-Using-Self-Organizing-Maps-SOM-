from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import init_db
from app.api import dataset, preprocess, som, segments, customers, insights, recommendations, report

app = FastAPI(
    title="MarketMind - Customer Behaviour Analysis API",
    description="Backend API powering SOM-based customer segmentation, U-Matrix visualization, and AI recommendations.",
    version="1.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database schema on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Include API Routers
app.include_router(dataset.router)
app.include_router(preprocess.router)
app.include_router(som.router)
app.include_router(segments.router)
app.include_router(customers.router)
app.include_router(insights.router)
app.include_router(recommendations.router)
app.include_router(report.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "MarketMind Customer Behaviour Analysis",
        "algorithm": "Self-Organizing Map (SOM)",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
