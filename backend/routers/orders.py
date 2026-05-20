from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from database import get_db
from models import Product, Order, OrderItem
from schemas import OrderCreate, OrderOut, OrderItemOut, OrderListItem, OrderListResponse
from config_loader import load_prices

router = APIRouter(prefix="/orders", tags=["orders"])


def _build_order_out(order: Order) -> OrderOut:
    items_out = [
        OrderItemOut(
            id=oi.id,
            product_id=oi.product_id,
            product_name=oi.product.name,
            quantity=float(oi.quantity),
            unit_price=float(oi.unit_price),
            line_total=float(oi.line_total),
        )
        for oi in order.items
    ]
    return OrderOut(
        id=order.id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        order_date=order.order_date,
        created_at=order.created_at,
        total_amount=float(order.total_amount),
        notes=order.notes or "",
        items=items_out,
    )


@router.post("", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    prices = load_prices()

    # Validate and collect products
    product_map: dict[int, Product] = {}
    for item in payload.items:
        if item.product_id in product_map:
            continue
        p = db.query(Product).filter(
            Product.id == item.product_id, Product.is_active == 1
        ).first()
        if not p:
            raise HTTPException(status_code=422, detail=f"Product id {item.product_id} not found")
        product_map[item.product_id] = p

    # Build order items with price snapshot
    order_items = []
    total = 0.0
    for item in payload.items:
        p = product_map[item.product_id]
        unit_price = prices.get(p.sku, 0.0)
        line_total = round(item.quantity * unit_price, 2)
        total += line_total
        order_items.append(
            OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    order = Order(
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        order_date=date.today(),
        total_amount=round(total, 2),
        notes=payload.notes or None,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    # Eager-load items + products for response
    for oi in order.items:
        _ = oi.product
    return _build_order_out(order)


@router.get("", response_model=OrderListResponse)
def list_orders(
    db: Session = Depends(get_db),
    order_date: date | None = Query(None, alias="date"),
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    q = db.query(Order)

    if order_date:
        q = q.filter(Order.order_date == order_date)
    else:
        if from_date:
            q = q.filter(Order.order_date >= from_date)
        if to_date:
            q = q.filter(Order.order_date <= to_date)

    if search:
        pattern = f"%{search}%"
        q = q.filter(
            or_(
                Order.customer_name.ilike(pattern),
                Order.customer_phone.ilike(pattern),
            )
        )

    total = q.count()
    orders = (
        q.order_by(Order.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for o in orders:
        items_count = db.query(func.count(OrderItem.id)).filter(OrderItem.order_id == o.id).scalar()
        items.append(
            OrderListItem(
                id=o.id,
                customer_name=o.customer_name,
                customer_phone=o.customer_phone,
                order_date=o.order_date,
                created_at=o.created_at,
                total_amount=float(o.total_amount),
                items_count=items_count or 0,
            )
        )
    return OrderListResponse(total=total, page=page, limit=limit, orders=items)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for oi in order.items:
        _ = oi.product
    return _build_order_out(order)


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
