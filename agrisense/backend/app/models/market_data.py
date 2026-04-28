from sqlalchemy import Column, Integer, String, Float, Date, DateTime, CheckConstraint
from sqlalchemy.sql import func
from app.database import Base


class MarketData(Base):
    """Market data model for AGMARKNET mandi prices."""
    
    __tablename__ = "market_data"
    
    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    market = Column(String(100), nullable=False)  # Mandi name
    commodity = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), nullable=True)
    grade = Column(String(50), nullable=True)
    min_price = Column(Float, nullable=False)  # ₹/quintal
    max_price = Column(Float, nullable=False)  # ₹/quintal
    modal_price = Column(Float, nullable=False)  # ₹/quintal (most common)
    arrival_date = Column(Date, nullable=False, index=True)
    source = Column(String(100), default='AGMARKNET')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint('min_price > 0', name='positive_min_price'),
        CheckConstraint('max_price >= min_price', name='valid_price_range'),
        CheckConstraint('modal_price >= min_price AND modal_price <= max_price', name='valid_modal_price'),
    )
    
    def __repr__(self):
        return f"<MarketData(commodity='{self.commodity}', market='{self.market}', date='{self.arrival_date}')>"
