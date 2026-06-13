import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "health.db")

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _migrate() -> None:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)"))
        conn.commit()

        def done(name: str) -> bool:
            return bool(conn.execute(text("SELECT 1 FROM _migrations WHERE name = :n"), {"n": name}).fetchone())

        def mark(name: str) -> None:
            conn.execute(text("INSERT OR IGNORE INTO _migrations (name) VALUES (:n)"), {"n": name})
            conn.commit()

        # add ethnicity column to profiles
        if not done("add_ethnicity"):
            try:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN ethnicity TEXT"))
                conn.commit()
            except Exception as e:
                if "duplicate column" not in str(e).lower() and "already exists" not in str(e).lower():
                    raise
            mark("add_ethnicity")

        # fix fat field swap: FW=total, FT=trunk (were reversed in original parser)
        if not done("swap_fat_fw_ft"):
            cols = [r[1] for r in conn.execute(text("PRAGMA table_info(measurements)")).fetchall()]
            if "_fat_temp" not in cols:
                conn.execute(text("ALTER TABLE measurements ADD COLUMN _fat_temp REAL"))
            conn.execute(text("UPDATE measurements SET _fat_temp = fat_total_pct"))
            conn.execute(text("UPDATE measurements SET fat_total_pct = fat_trunk_pct"))
            conn.execute(text("UPDATE measurements SET fat_trunk_pct = _fat_temp"))
            conn.commit()
            try:
                conn.execute(text("ALTER TABLE measurements DROP COLUMN _fat_temp"))
                conn.commit()
            except Exception:
                pass
            mark("swap_fat_fw_ft")

        # rename water_kg → water_pct (ww field is body water %, not kg)
        if not done("rename_water_kg_to_pct"):
            try:
                conn.execute(text("ALTER TABLE measurements RENAME COLUMN water_kg TO water_pct"))
                conn.commit()
            except Exception:
                pass  # already renamed
            mark("rename_water_kg_to_pct")

        # update goal metric key water_kg → water_pct
        if not done("rename_water_goal_key"):
            conn.execute(text("UPDATE goals SET metric = 'water_pct' WHERE metric = 'water_kg'"))
            conn.commit()
            mark("rename_water_goal_key")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
