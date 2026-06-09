from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, orders, dashboard
import os

app = FastAPI(
    title="Agribathi & Badam Malt Order API",
    version="1.0.0",
    description="Order management backend for Agribathi and Badam Malt business",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# FRONTEND_ORIGIN can be set to e.g. "http://54.123.45.67:3000" on EC2.
# Falls back to localhost for local development.
frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,  # NOTE: never widen allow_origins to "*" while this is True
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Agribathi Order API is running"}
