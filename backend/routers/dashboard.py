from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Order, OrderItem, Product
from schemas import DashboardStats, TodayStats, AllTimeStats, ProductStat, PricesOut, PricesUpdate
from config_loader import load_prices, save_prices

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    today = date.today()

    # Today's orders
    today_order_count = (
        db.query(func.count(Order.id))
        .filter(Order.order_date == today)
        .scalar()
    ) or 0

    today_revenue = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.order_date == today)
        .scalar()
    ) or 0.0

    # Today's qty by product
    today_product_rows = (
        db.query(
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("total_qty"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.order_date == today)
        .group_by(Product.id, Product.name, Product.sku)
        .all()
    )

    items_by_product = [
        ProductStat(product_name=r.name, sku=r.sku, total_qty=float(r.total_qty))
        for r in today_product_rows
    ]

    # All-time
    all_time_count = db.query(func.count(Order.id)).scalar() or 0
    all_time_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0

    return DashboardStats(
        today=TodayStats(
            date=today,
            order_count=today_order_count,
            revenue=float(today_revenue),
            items_by_product=items_by_product,
        ),
        all_time=AllTimeStats(
            order_count=all_time_count,
            revenue=float(all_time_revenue),
        ),
    )


@router.get("/prices", response_model=PricesOut)
def get_prices():
    p = load_prices()
    return PricesOut(
        AGRI_TUBE=p.get("AGRI_TUBE", 0.0),
        MASALA_250=p.get("MASALA_250", 0.0),
        BADAM_200=p.get("BADAM_200", 0.0),
    )


@router.put("/prices", response_model=PricesOut)
def update_prices(payload: PricesUpdate):
    prices = {
        "AGRI_TUBE": payload.AGRI_TUBE,
        "MASALA_250": payload.MASALA_250,
        "BADAM_200": payload.BADAM_200,
    }
    save_prices(prices)
    return PricesOut(**prices)
