from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.database import engine, Base
from app import models, routes, auth_routes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Clear any existing table definitions in metadata to avoid conflicts
# Then create all tables
try:
    Base.metadata.drop_all(bind=engine)
except Exception:
    pass  # Ignore errors if tables don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(routes.router, prefix="/api", tags=["tasks"])


@app.get("/")
def root():
    return {"message": "AI Task Manager API"}
