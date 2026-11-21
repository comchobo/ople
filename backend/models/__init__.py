"""Register all application tables when loading model metadata."""

from models import auth, generations, planner_copies, planners, recordings, users

__all__ = ["auth", "generations", "planner_copies", "planners", "recordings", "users"]
