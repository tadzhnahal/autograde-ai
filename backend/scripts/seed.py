"""Сид-данные для демо.

Создаёт:
- 1 учителя prof.ktitanov@email.com (пароль demo1234)
- 8 студентов (тот же пароль)
- 3 группы (Calculus / Discrete Mathematics / Python for Data Analysis)
- 4 задания в каждой группе с эталоном и rubric
- 3 готовых сабмишена в разных статусах

Запуск: `python -m scripts.seed` из каталога backend (с активным venv).
"""

from __future__ import annotations

import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Чтобы скрипт мог запускаться как `python -m scripts.seed` из каталога backend
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402, F401
    Assignment,
    Enrollment,
    GradingDataset,
    Group,
    Message,
    Notification,
    Submission,
    User,
)
from app.schemas.common import max_score_for_scale  # noqa: E402
from app.services.auth_service import hash_password  # noqa: E402

DEMO_PASSWORD = "demo1234"

TEACHER_EMAIL = "prof.ktitanov@email.com"
TEACHER_NAME = "Prof. K. Titanov"

STUDENTS = [
    ("elena.morozova@email.com", "Elena Morozova"),
    ("mikhail.kuznetsov@email.com", "Mikhail Kuznetsov"),
    ("ivan.petrov@email.com", "Ivan Petrov"),
    ("maria.ivanova@email.com", "Maria Ivanova"),
    ("artem.volkov@email.com", "Artem Volkov"),
    ("alina.smirnova@email.com", "Alina Smirnova"),
    ("kirill.egorov@email.com", "Kirill Egorov"),
    ("sofia.belova@email.com", "Sofia Belova"),
]

GROUPS = [
    {"name": "Calculus", "description": "Дифференциальное и интегральное исчисление", "scale": "0-10"},
    {"name": "Discrete Mathematics", "description": "Логика, множества, графы", "scale": "0-10"},
    {"name": "Python for Data Analysis", "description": "NumPy, Pandas, базовый ML", "scale": "0-100"},
]

ASSIGNMENTS = {
    "Calculus": [
        {
            "title": "Производные элементарных функций",
            "description": "Найдите производные многочленов и тригонометрических функций.",
            "reference": "Использовать степенное правило и правило произведения. Производная константы = 0.",
            "rubric": [
                {"criterion": "Правильный итоговый ответ", "max_points": 5, "description": "f'(x) совпадает с эталоном"},
                {"criterion": "Показаны промежуточные шаги", "max_points": 3, "description": "Видно применение правил"},
                {"criterion": "Аккуратность оформления", "max_points": 2, "description": "Решение читаемо"},
            ],
            "due_in_days": 7,
        },
        {
            "title": "Производные сложных функций",
            "description": "Применить правило цепочки.",
            "reference": "Производная f(g(x)) = f'(g(x)) * g'(x).",
            "rubric": [
                {"criterion": "Правило цепочки применено корректно", "max_points": 6, "description": ""},
                {"criterion": "Финальный ответ упрощён", "max_points": 4, "description": ""},
            ],
            "due_in_days": 14,
        },
        {
            "title": "Применение производных",
            "description": "Исследовать функцию на монотонность и экстремумы.",
            "reference": "Найти f'(x), решить f'(x)=0, определить знаки.",
            "rubric": [
                {"criterion": "Найдены критические точки", "max_points": 4, "description": ""},
                {"criterion": "Определены экстремумы", "max_points": 4, "description": ""},
                {"criterion": "Сформулирован вывод", "max_points": 2, "description": ""},
            ],
            "due_in_days": 21,
        },
        {
            "title": "Определённый интеграл",
            "description": "Вычислить определённые интегралы.",
            "reference": "Использовать формулу Ньютона-Лейбница.",
            "rubric": [
                {"criterion": "Корректная первообразная", "max_points": 5, "description": ""},
                {"criterion": "Правильное вычисление", "max_points": 5, "description": ""},
            ],
            "due_in_days": 28,
        },
    ],
    "Discrete Mathematics": [
        {
            "title": "Тождества над множествами",
            "description": "Доказать дистрибутивность объединения относительно пересечения.",
            "reference": "A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C). Доказывать включение в обе стороны.",
            "rubric": [
                {"criterion": "Включение слева направо", "max_points": 5, "description": ""},
                {"criterion": "Включение справа налево", "max_points": 5, "description": ""},
            ],
            "due_in_days": 10,
        },
        {
            "title": "Логика высказываний",
            "description": "Доказать тавтологию таблицей истинности.",
            "reference": "Построить полную таблицу и убедиться, что итог везде 1.",
            "rubric": [
                {"criterion": "Полная таблица", "max_points": 5, "description": ""},
                {"criterion": "Корректный вывод", "max_points": 5, "description": ""},
            ],
            "due_in_days": 17,
        },
        {
            "title": "Метод математической индукции",
            "description": "Доказать тождество для всех n.",
            "reference": "База + переход.",
            "rubric": [
                {"criterion": "База индукции", "max_points": 3, "description": ""},
                {"criterion": "Индукционный переход", "max_points": 5, "description": ""},
                {"criterion": "Вывод", "max_points": 2, "description": ""},
            ],
            "due_in_days": 24,
        },
        {
            "title": "Графы: BFS / DFS",
            "description": "Реализовать обход графа и кратчайший путь.",
            "reference": "BFS — очередь, DFS — стек/рекурсия.",
            "rubric": [
                {"criterion": "Алгоритм корректен", "max_points": 6, "description": ""},
                {"criterion": "Доказательство сложности", "max_points": 4, "description": ""},
            ],
            "due_in_days": 30,
        },
    ],
    "Python for Data Analysis": [
        {
            "title": "Базовые операции на списках",
            "description": "Реализовать `mean`, `median`, `std` без NumPy.",
            "reference": "Не использовать numpy. Учесть пустой список.",
            "rubric": [
                {"criterion": "Корректная mean", "max_points": 30, "description": "Должна возвращать None на пустом"},
                {"criterion": "Корректная median", "max_points": 30, "description": ""},
                {"criterion": "Корректная std", "max_points": 30, "description": ""},
                {"criterion": "Тесты проходят", "max_points": 10, "description": ""},
            ],
            "due_in_days": 7,
        },
        {
            "title": "Pandas: чтение и фильтрация",
            "description": "Прочитать CSV, отфильтровать строки.",
            "reference": "pd.read_csv, df.loc[df['col'] > X].",
            "rubric": [
                {"criterion": "Чтение CSV", "max_points": 20, "description": ""},
                {"criterion": "Фильтрация", "max_points": 40, "description": ""},
                {"criterion": "Группировка", "max_points": 40, "description": ""},
            ],
            "due_in_days": 14,
        },
        {
            "title": "Визуализация: matplotlib",
            "description": "Построить гистограмму и боксплот.",
            "reference": "plt.hist, plt.boxplot, подписи осей.",
            "rubric": [
                {"criterion": "Корректные графики", "max_points": 60, "description": ""},
                {"criterion": "Подписи и оформление", "max_points": 40, "description": ""},
            ],
            "due_in_days": 21,
        },
        {
            "title": "Линейная регрессия (sklearn)",
            "description": "Обучить LinearRegression, посчитать R².",
            "reference": "from sklearn.linear_model import LinearRegression.",
            "rubric": [
                {"criterion": "Подготовка данных", "max_points": 30, "description": ""},
                {"criterion": "Обучение модели", "max_points": 40, "description": ""},
                {"criterion": "Оценка R²", "max_points": 30, "description": ""},
            ],
            "due_in_days": 28,
        },
    ],
}


def _wipe(db):
    for model in (
        GradingDataset,
        Message,
        Notification,
        Submission,
        Assignment,
        Enrollment,
        Group,
        User,
    ):
        db.query(model).delete()
    db.commit()


def _copy_seed_file_to_storage(
    seed_filename: str, *, assignment_id: str
) -> str:
    """Кладёт seed-файл в storage и возвращает относительный путь."""
    src = Path(__file__).resolve().parents[1] / "seed_files" / seed_filename
    storage_root = Path(settings.storage_path).resolve()
    dest_dir = storage_root / "submissions" / assignment_id / "seed"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / seed_filename
    shutil.copy(src, dest)
    return str(dest.relative_to(storage_root))


def main():
    Path(settings.storage_path).mkdir(parents=True, exist_ok=True)
    Path(settings.grading_workdir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        _wipe(db)

        teacher = User(
            email=TEACHER_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            full_name=TEACHER_NAME,
            role="teacher",
        )
        db.add(teacher)
        db.flush()

        students: list[User] = []
        for email, name in STUDENTS:
            u = User(
                email=email,
                password_hash=hash_password(DEMO_PASSWORD),
                full_name=name,
                role="student",
            )
            db.add(u)
            students.append(u)
        db.flush()

        groups: dict[str, Group] = {}
        for cfg in GROUPS:
            g = Group(
                name=cfg["name"],
                description=cfg["description"],
                teacher_id=teacher.id,
                grade_scale=cfg["scale"],
            )
            db.add(g)
            groups[cfg["name"]] = g
        db.flush()

        # Все студенты во всех группах
        for g in groups.values():
            for s in students:
                db.add(Enrollment(student_id=s.id, group_id=g.id))
        db.flush()

        # Задания
        now = datetime.utcnow()
        assignments_by_name: dict[tuple[str, str], Assignment] = {}
        for group_name, items in ASSIGNMENTS.items():
            g = groups[group_name]
            for it in items:
                a = Assignment(
                    group_id=g.id,
                    title=it["title"],
                    description=it["description"],
                    due_date=now + timedelta(days=it["due_in_days"]),
                    reference_solution=it["reference"],
                    rubric=it["rubric"],
                    max_score=max_score_for_scale(g.grade_scale),
                )
                db.add(a)
                assignments_by_name[(group_name, it["title"])] = a
        db.flush()

        # Готовые сабмишены: 3 шт. в разных статусах
        def _by_email(email: str) -> User:
            return next(s for s in students if s.email == email)

        # 1) Elena → Calculus: Производные элементарных функций → pending
        elena = _by_email("elena.morozova@email.com")
        calc_a1 = assignments_by_name[("Calculus", "Производные элементарных функций")]
        sub1 = Submission(
            assignment_id=calc_a1.id,
            student_id=elena.id,
            file_path=_copy_seed_file_to_storage(
                "derivatives_correct.tex", assignment_id=calc_a1.id
            ),
            file_type="latex",
            student_notes="Загружаю первое задание.",
            status="pending",
            submitted_at=now - timedelta(hours=2),
        )
        db.add(sub1)

        # 2) Mikhail → Calculus: Производные элементарных функций → ai_graded (с ошибкой)
        mikhail = _by_email("mikhail.kuznetsov@email.com")
        sub2 = Submission(
            assignment_id=calc_a1.id,
            student_id=mikhail.id,
            file_path=_copy_seed_file_to_storage(
                "derivatives_with_error.tex", assignment_id=calc_a1.id
            ),
            file_type="latex",
            student_notes="",
            status="ai_graded",
            ai_score=6.5,
            ai_feedback=(
                "Решение в целом понятное, но допущена ошибка: производная "
                "константы равна 0, поэтому слагаемое +7 не должно появляться "
                "в ответе. Корректный ответ: f'(x) = 3x^2 + 4x - 5."
            ),
            ai_suggestions=[
                "Студент применил степенное правило корректно",
                "Ошибка: производная константы равна 0, а не самой константе",
                "Финальный ответ нужно скорректировать",
            ],
            ai_confidence=0.92,
            ai_per_criterion=[
                {
                    "criterion": "Правильный итоговый ответ",
                    "points": 2.0,
                    "max_points": 5.0,
                    "comment": "Неверный итоговый ответ из-за добавленной константы 7.",
                },
                {
                    "criterion": "Показаны промежуточные шаги",
                    "points": 2.5,
                    "max_points": 3.0,
                    "comment": "Шаги показаны, но без явного применения правила для константы.",
                },
                {
                    "criterion": "Аккуратность оформления",
                    "points": 2.0,
                    "max_points": 2.0,
                    "comment": "Оформление аккуратное.",
                },
            ],
            submitted_at=now - timedelta(days=1, hours=3),
            ai_graded_at=now - timedelta(days=1, hours=2, minutes=58),
        )
        db.add(sub2)

        # 3) Ivan → Discrete Mathematics: Тождества над множествами → graded (закрыто)
        ivan = _by_email("ivan.petrov@email.com")
        dm_a1 = assignments_by_name[
            ("Discrete Mathematics", "Тождества над множествами")
        ]
        sub3 = Submission(
            assignment_id=dm_a1.id,
            student_id=ivan.id,
            file_path=_copy_seed_file_to_storage(
                "dsa_set_proof.tex", assignment_id=dm_a1.id
            ),
            file_type="latex",
            student_notes="",
            status="graded",
            ai_score=9.5,
            ai_feedback=(
                "Доказательство построено правильно, включения в обе стороны "
                "обоснованы. Можно немного формализовать переход «если не A»."
            ),
            ai_suggestions=[
                "Доказательство корректное",
                "Обе стороны включения разобраны",
                "Стоит чётче зафиксировать предположение x ∉ A",
            ],
            ai_confidence=0.95,
            ai_per_criterion=[
                {
                    "criterion": "Включение слева направо",
                    "points": 5.0,
                    "max_points": 5.0,
                    "comment": "Разбор случаев корректный.",
                },
                {
                    "criterion": "Включение справа налево",
                    "points": 4.5,
                    "max_points": 5.0,
                    "comment": "Можно явно записать «пусть x ∉ A».",
                },
            ],
            final_score=9.0,
            teacher_feedback="Хорошо! Снизил на 0.5 за неформальность.",
            graded_by=teacher.id,
            submitted_at=now - timedelta(days=3),
            ai_graded_at=now - timedelta(days=3) + timedelta(minutes=2),
            graded_at=now - timedelta(days=2),
        )
        db.add(sub3)
        db.flush()

        # Data Moat для закрытого сабмита
        db.add(
            GradingDataset(
                submission_id=sub3.id,
                ai_score=sub3.ai_score,
                final_score=sub3.final_score,
                teacher_changed=True,
                delta=sub3.final_score - sub3.ai_score,
            )
        )

        # Уведомления для демонстрации
        from app.services import notifications_service

        notifications_service.notify_new_submission(
            db,
            teacher_id=teacher.id,
            submission_id=sub1.id,
            student_name=elena.full_name,
            assignment_title=calc_a1.title,
        )
        notifications_service.notify_grading_done(
            db,
            teacher_id=teacher.id,
            submission_id=sub2.id,
            student_name=mikhail.full_name,
            assignment_title=calc_a1.title,
            ai_score=sub2.ai_score,
        )

        db.commit()

        print("=" * 64)
        print("Seed complete.")
        print(f"  Teacher:  {TEACHER_EMAIL}  /  {DEMO_PASSWORD}")
        print(f"  Students: {len(STUDENTS)}  (one of them: {STUDENTS[0][0]} / {DEMO_PASSWORD})")
        print(f"  Groups:   {len(GROUPS)}")
        print(
            f"  Assignments: {sum(len(v) for v in ASSIGNMENTS.values())}"
        )
        print(f"  Submissions: 3 (pending / ai_graded / graded)")
        print("=" * 64)
    finally:
        db.close()


if __name__ == "__main__":
    main()
