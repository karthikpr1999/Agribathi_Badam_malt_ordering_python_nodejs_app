from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Product
from schemas import ProductOut
from config_loader import load_prices

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    prices = load_prices()
    products = db.query(Product).filter(Product.is_active == 1).all()
    result = []
    for p in products:
        result.append(
            ProductOut(
                id=p.id,
                name=p.name,
                sku=p.sku,
                unit_label=p.unit_label,
                price=prices.get(p.sku, 0.0),
            )
        )
    return result
