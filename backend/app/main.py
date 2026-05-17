import fastapi
from fastapi.middleware.cors import CORSMiddleware
from app.routes.shift import router as shift_router
from app.routes.auth import router as auth_router
from app.routes.driver import router as driver_router
from app.database.init_db import init_db

app = fastapi.FastAPI(
    title="DriveWise API",
    description="API de prediction du comportement de conduite",
    version="1.0.0"
)

# Allow the React Native web client (Expo Metro dev server runs on various
# localhost ports — 8081, 8088, 8101, etc.) to call the API from a browser.
# For dev only; tighten in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(shift_router)
app.include_router(driver_router)

@app.get("/health")
def health():
    return {"status": "ok", "message": "DriveWise API is running"}

@app.on_event("startup")
def on_startup():
    init_db()
