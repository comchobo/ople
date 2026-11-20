from datetime import timedelta
from urllib.parse import urlsplit

from sqlmodel import Session, select

from config import origin
from db import engine
from models.generations import Generation
from models.planners import Planner
from models.users import User
from schemas.planners import KINDS, Plans
from services.auth.passwords import check_password, hasher
from utils.clock import now

DEV_EMAIL = "dev@dev.com"
DEV_PASSWORD = DEV_EMAIL
DEV_NAME = "dev"

PLANNER_IDS = (
    "00000000-0000-4000-8000-000000000101",
    "00000000-0000-4000-8000-000000000102",
    "00000000-0000-4000-8000-000000000103",
)
GENERATION_IDS = (
    "00000000-0000-4000-8000-000000000201",
    "00000000-0000-4000-8000-000000000202",
    "00000000-0000-4000-8000-000000000203",
)

PLANNER_SPECS = (
    (
        "5년 후의 나",
        (
            (
                "지금의 일을 더 깊게",
                "현재의 전문성을 확장하면서도 창작과 휴식을 함께 챙기는 계획입니다.",
                (
                    ("전문성 심화", "work", 0, 12),
                    ("동료와의 배움", "relation", 12, 12),
                    ("개인 창작", "creative", 24, 12),
                    ("회복 루틴", "rest", 36, 24),
                ),
                {"resources": 8, "appeal": 7, "confidence": 8, "coherence": 9},
            ),
            (
                "옆길을 걸어보기",
                "지금의 길을 잠시 내려놓고 다른 분야를 작게 실험하는 계획입니다.",
                (
                    ("새 분야 탐색", "creative", 0, 9),
                    ("작은 의뢰", "work", 9, 12),
                    ("새로운 관계", "relation", 21, 15),
                    ("비우는 시간", "rest", 36, 12),
                ),
                {"resources": 6, "appeal": 9, "confidence": 5, "coherence": 7},
            ),
            (
                "원하는 하루에서 출발하기",
                "바라는 일상의 리듬을 먼저 만들고 그 위에 일과 관계를 쌓는 계획입니다.",
                (
                    ("아침 루틴", "rest", 0, 12),
                    ("좋아하는 일", "creative", 12, 18),
                    ("관계의 재정리", "relation", 18, 18),
                    ("일의 형태 바꾸기", "work", 30, 24),
                ),
                {"resources": 7, "appeal": 10, "confidence": 7, "coherence": 9},
            ),
        ),
    ),
    (
        "다른 가능성 탐색",
        (
            (
                "익숙한 길을 확장하기",
                "지금까지 쌓은 경험을 다른 방식으로 연결해보는 계획입니다.",
                (
                    ("경험 정리", "creative", 0, 12),
                    ("협업 실험", "relation", 6, 18),
                    ("새로운 수입원", "work", 18, 24),
                    ("충전의 시간", "rest", 42, 12),
                ),
                {"resources": 8, "appeal": 7, "confidence": 8, "coherence": 8},
            ),
            (
                "새로운 분야 실험하기",
                "관심 있던 분야를 작은 프로젝트로 시작하고 반응을 살피는 계획입니다.",
                (
                    ("기초 배우기", "creative", 0, 12),
                    ("첫 프로젝트", "work", 12, 15),
                    ("커뮤니티 참여", "relation", 18, 15),
                    ("속도 조절", "rest", 30, 12),
                ),
                {"resources": 5, "appeal": 9, "confidence": 5, "coherence": 7},
            ),
            (
                "삶의 균형 다시 맞추기",
                "일의 비중을 줄이고 관계와 휴식을 중심으로 생활을 재구성하는 계획입니다.",
                (
                    ("일의 범위 줄이기", "work", 0, 12),
                    ("가까운 사람과 시간", "relation", 0, 24),
                    ("몸을 돌보는 습관", "rest", 12, 24),
                    ("취미 깊이 만들기", "creative", 24, 18),
                ),
                {"resources": 6, "appeal": 10, "confidence": 7, "coherence": 10},
            ),
        ),
    ),
    (
        "지금 다시 그리는 삶",
        (
            (
                "작게 시작하는 변화",
                "큰 결심보다 매일 지킬 수 있는 작은 변화부터 만드는 계획입니다.",
                (
                    ("하루 기록", "creative", 0, 9),
                    ("건강 루틴", "rest", 0, 18),
                    ("주변 사람 돕기", "relation", 9, 15),
                    ("업무 방식 개선", "work", 18, 18),
                ),
                {"resources": 8, "appeal": 8, "confidence": 9, "coherence": 8},
            ),
            (
                "다른 도시에서 살아보기",
                "생활 반경을 바꾸며 새로운 환경에서 일과 관계를 시험하는 계획입니다.",
                (
                    ("도시 탐색", "creative", 0, 6),
                    ("원격 근무 적응", "work", 6, 12),
                    ("현지 관계 만들기", "relation", 12, 18),
                    ("정착과 회복", "rest", 24, 18),
                ),
                {"resources": 4, "appeal": 10, "confidence": 4, "coherence": 6},
            ),
            (
                "관계와 휴식을 중심에 두기",
                "성과보다 관계와 회복을 우선하는 생활을 5년 동안 쌓아가는 계획입니다.",
                (
                    ("가족과의 시간", "relation", 0, 24),
                    ("느린 아침", "rest", 0, 24),
                    ("감정 기록", "creative", 12, 24),
                    ("지속 가능한 일", "work", 24, 36),
                ),
                {"resources": 7, "appeal": 9, "confidence": 8, "coherence": 10},
            ),
        ),
    ),
)

GENERATION_SPECS = (
    ("completed", "지금의 일을 더 깊게 만드는 방향을 정리했습니다.", None, PLANNER_IDS[0]),
    (
        "failed",
        "새로운 분야를 실험하고 싶다는 마음을 정리했습니다.",
        "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.",
        None,
    ),
    ("pending", "관계와 휴식을 중심에 두는 삶을 그리고 싶습니다.", None, None),
)


def build_plans(prefix: str, specs) -> list[dict]:
    plans = []
    for plan_index, (kind, (title, description, pieces, scores)) in enumerate(
        zip(KINDS, specs, strict=True)
    ):
        plans.append(
            {
                "kind": kind,
                "title": title,
                "description": description,
                "scores": scores,
                "pieces": [
                    {
                        "id": f"{prefix}-{plan_index}-{piece_index}",
                        "title": piece_title,
                        "description": "",
                        "category": category,
                        "start": start,
                        "duration": duration,
                    }
                    for piece_index, (piece_title, category, start, duration) in enumerate(pieces)
                ],
            }
        )
    return Plans.model_validate({"plans": plans}).model_dump()["plans"]


def ensure_dev_data(db: Session) -> tuple[int, int]:
    user = db.exec(select(User).where(User.email == DEV_EMAIL)).first()
    if user is None:
        user = User(email=DEV_EMAIL, name=DEV_NAME, password_hash=hasher.hash(DEV_PASSWORD))
        db.add(user)
        db.flush()
    else:
        if user.name != DEV_NAME:
            user.name = DEV_NAME
            db.add(user)
        if not check_password(user.password_hash, DEV_PASSWORD):
            user.password_hash = hasher.hash(DEV_PASSWORD)
            db.add(user)

    base = now()
    created_planners = 0
    for index, (name, specs) in enumerate(PLANNER_SPECS):
        planner_id = PLANNER_IDS[index]
        if db.get(Planner, planner_id) is None:
            created_at = base - timedelta(days=len(PLANNER_SPECS) - index)
            db.add(
                Planner(
                    id=planner_id,
                    user_id=user.id,
                    name=name,
                    plans=build_plans(str(index), specs),
                    created_at=created_at,
                    updated_at=created_at,
                )
            )
            created_planners += 1

    created_generations = 0
    for index, (generation_id, spec) in enumerate(
        zip(GENERATION_IDS, GENERATION_SPECS, strict=True)
    ):
        status, summary, error, planner_id = spec
        if db.get(Generation, generation_id) is None:
            created_at = base - timedelta(hours=index * 6)
            db.add(
                Generation(
                    id=generation_id,
                    user_id=user.id,
                    status=status,
                    payload={
                        "interview_id": f"dev-interview-{index + 1}",
                        "summary": summary,
                    },
                    planner_id=planner_id,
                    error=error,
                    attempt="dev-attempt" if status == "completed" else None,
                    created_at=created_at,
                    updated_at=created_at,
                )
            )
            created_generations += 1
    db.commit()
    return created_planners, created_generations


def main() -> None:
    if urlsplit(origin()).scheme == "https":
        print("https APP_ORIGIN detected; skipping development data seed.")
        return
    with Session(engine, expire_on_commit=False) as db:
        planners, generations = ensure_dev_data(db)
    print(f"Development data ready: {planners} planners and {generations} generations created.")


if __name__ == "__main__":
    main()
