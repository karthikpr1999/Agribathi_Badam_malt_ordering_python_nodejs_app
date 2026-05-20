from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, field_validator


# ─── Products ──────────────────────────────────────────────────────────────

class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    unit_label: str
    price: float

    model_config = {"from_attributes": True}


# ─── Order items ───────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: float

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return v


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: float
    unit_price: float
    line_total: float

    model_config = {"from_attributes": True}


# ─── Orders ────────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    notes: str = ""
    items: list[OrderItemCreate]

    @field_validator("customer_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("customer_name cannot be empty")
        return v.strip()

    @field_validator("customer_phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("customer_phone cannot be empty")
        return v.strip()

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("order must have at least one item")
        return v


class OrderOut(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    order_date: date
    created_at: datetime
    total_amount: float
    notes: str | None
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    order_date: date
    created_at: datetime
    total_amount: float
    items_count: int

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    total: int
    page: int
    limit: int
    orders: list[OrderListItem]


# ─── Dashboard ─────────────────────────────────────────────────────────────

class ProductStat(BaseModel):
    product_name: str
    sku: str
    total_qty: float


class TodayStats(BaseModel):
    date: date
    order_count: int
    revenue: float
    items_by_product: list[ProductStat]


class AllTimeStats(BaseModel):
    order_count: int
    revenue: float


class DashboardStats(BaseModel):
    today: TodayStats
    all_time: AllTimeStats


# ─── Prices ────────────────────────────────────────────────────────────────

class PricesOut(BaseModel):
    AGRI_TUBE: float
    MASALA_250: float
    BADAM_200: float


class PricesUpdate(BaseModel):
    AGRI_TUBE: float
    MASALA_250: float
    BADAM_200: float

    @field_validator("AGRI_TUBE", "MASALA_250", "BADAM_200")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("price must be greater than 0")
        return v
