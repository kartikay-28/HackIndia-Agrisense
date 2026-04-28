import csv
import io
import logging
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.market_data import MarketData

logger = logging.getLogger(__name__)


def get_latest_price(db: Session, commodity: str, state: str) -> dict | None:
    """Get the most recent price record for a commodity in a state."""
    record = (
        db.query(MarketData)
        .filter(
            func.lower(MarketData.commodity) == commodity.lower(),
            func.lower(MarketData.state) == state.lower()
        )
        .order_by(MarketData.arrival_date.desc())
        .first()
    )
    if not record:
        return None
    return {
        "commodity": record.commodity,
        "state": record.state,
        "market": record.market,
        "min_price": record.min_price,
        "max_price": record.max_price,
        "modal_price": record.modal_price,
        "arrival_date": str(record.arrival_date),
        "source": record.source
    }


def get_price_history(db: Session, commodity: str, state: str, days: int = 30) -> list[dict]:
    """Get historical price records for a commodity in a state."""
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)

    records = (
        db.query(MarketData)
        .filter(
            func.lower(MarketData.commodity) == commodity.lower(),
            func.lower(MarketData.state) == state.lower(),
            MarketData.arrival_date >= cutoff
        )
        .order_by(MarketData.arrival_date.asc())
        .all()
    )

    return [
        {
            "date": str(r.arrival_date),
            "min_price": r.min_price,
            "max_price": r.max_price,
            "modal_price": r.modal_price,
            "market": r.market
        }
        for r in records
    ]


def get_volatility(db: Session, commodity: str, state: str, days: int = 30) -> str:
    """Calculate price volatility from historical data."""
    history = get_price_history(db, commodity, state, days)
    if len(history) < 2:
        return "Medium"

    prices = [r["modal_price"] for r in history]
    mean_price = sum(prices) / len(prices)
    if mean_price == 0:
        return "Medium"

    variance = sum((p - mean_price) ** 2 for p in prices) / len(prices)
    std_dev = variance ** 0.5
    cv = (std_dev / mean_price) * 100

    if cv > 20:
        return "High"
    elif cv > 10:
        return "Medium"
    else:
        return "Low"


def import_agmarknet_csv(db: Session, csv_content: str) -> dict:
    """
    Import AGMARKNET CSV data.

    Expected CSV columns (case-insensitive):
        State, District, Market, Commodity, Variety, Grade,
        Arrival_Date, Min_Price, Max_Price, Modal_Price

    Returns: { imported, skipped, errors }
    """
    imported = 0
    skipped = 0
    errors = []

    reader = csv.DictReader(io.StringIO(csv_content))

    # Normalise header names
    def norm(s: str) -> str:
        return s.strip().lower().replace(" ", "_")

    for i, row in enumerate(reader, start=2):
        row = {norm(k): v.strip() for k, v in row.items()}
        try:
            # Parse arrival date
            raw_date = row.get("arrival_date", "")
            try:
                arrival_date = datetime.strptime(raw_date, "%d/%m/%Y").date()
            except ValueError:
                arrival_date = datetime.strptime(raw_date, "%Y-%m-%d").date()

            min_price = float(row.get("min_price", 0))
            max_price = float(row.get("max_price", 0))
            modal_price = float(row.get("modal_price", 0))

            if min_price <= 0 or max_price < min_price:
                skipped += 1
                continue

            record = MarketData(
                state=row.get("state", ""),
                district=row.get("district", ""),
                market=row.get("market", ""),
                commodity=row.get("commodity", ""),
                variety=row.get("variety", ""),
                grade=row.get("grade", ""),
                min_price=min_price,
                max_price=max_price,
                modal_price=modal_price,
                arrival_date=arrival_date,
                source="AGMARKNET"
            )
            db.add(record)
            imported += 1

            # Batch commit every 500 rows
            if imported % 500 == 0:
                db.commit()
                logger.info(f"Imported {imported} records so far...")

        except Exception as e:
            errors.append(f"Row {i}: {e}")
            skipped += 1

    db.commit()
    logger.info(f"CSV import complete — imported: {imported}, skipped: {skipped}, errors: {len(errors)}")
    return {"imported": imported, "skipped": skipped, "errors": errors[:20]}
