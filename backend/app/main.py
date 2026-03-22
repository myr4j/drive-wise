import fastapi
from app.routes.shift import router as shift_router
from app.database.init_db import init_db

app = fastapi.FastAPI(
    title="DriveWise API",
    description="API de prediction du comportement de conduite",
    version="1.0.0"
)
app.include_router(shift_router)

@app.get("/health")
def health():
    return {"status": "ok", "message": "DriveWise API is running"}

@app.on_event("startup")
def on_startup():
    init_db()