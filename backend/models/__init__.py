"""Register all application tables when loading model metadata."""

from models import auth, generations, planners, recordings, users

__all__ = ["auth", "generations", "planners", "recordings", "users"]
