from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, orders, dashboard

app = FastAPI(
    title="Agribathi & Badam Malt Order API",
    version="1.0.0",
    description="Order management backend for Agribathi and Badam Malt business",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Agribathi Order API is running"}
