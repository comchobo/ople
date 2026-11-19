from fastapi import APIRouter

from routers import auth, generations, interviews, planners

router = APIRouter(prefix="/api")
router.include_router(auth.router)
router.include_router(planners.router)
router.include_router(interviews.router)
router.include_router(generations.router)
