from typing import Literal

GradeScale = Literal["0-5", "0-10", "0-100"]


def max_score_for_scale(scale: str) -> float:
    return {"0-5": 5.0, "0-10": 10.0, "0-100": 100.0}[scale]
