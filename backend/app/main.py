import fastapi

app = fastapi.FastAPI(
    title="DriveWise API",
    description="API de prediction du comportement de conduite",
    version="1.0.0"
)

@app.get("/health")
def health():
    return {"status": "ok", "message": "DriveWise API is running"}
