from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator


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
    quantity: float = Field(..., gt=0)


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
    customer_name: str = Field(..., max_length=200)
    customer_phone: str = Field(..., max_length=30)
    notes: str = Field("", max_length=1000)
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
    AGRI_TUBE: float = Field(..., gt=0)
    MASALA_250: float = Field(..., gt=0)
    BADAM_200: float = Field(..., gt=0)
