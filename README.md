# AutoGrade AI — локальная демо-сборка

Ассистент проверки домашних работ для преподавателей. Преподаватель загружает
эталонное решение и rubric, ученик сдаёт работу (PDF / DOCX / LaTeX / фото),
**локальный Claude Code CLI** проводит первичную проверку, преподаватель
выставляет финальную оценку.

Полное ТЗ — в [docs/AutoGrade_AI.md](docs/AutoGrade_AI.md).

## Что внутри

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + кастомный shadcn-стиль.
- **Backend**: FastAPI + SQLAlchemy 2.x + SQLite + Pydantic v2.
- **AI-грейдер**: локальный Claude Code CLI через `subprocess`. Никакого
  Anthropic API. Альтернатива — `GRADER_MODE=mock`.
- **Хранилище файлов**: локальная папка `backend/storage/` через интерфейс
  `FileStorage` (легко переключить на S3/MinIO).

Концептуальная модель — плоская:

| Сущность | Что значит |
|----------|------------|
| `User` | Учитель (регистрируется сам) или ученик (создаёт учитель) |
| `Group` | Класс / группа / поток. У группы свой `grade_scale` (`0-5` / `0-10` / `0-100`) |
| `Enrollment` | Связь ученик ↔ группа |
| `Assignment` | Задание в группе: `reference_solution` + `rubric` JSON + `max_score` |
| `Submission` | Сдача ученика; AI-поля + финальная оценка преподавателя |
| `Message` | Чат ученик ↔ учитель в контексте группы |
| `Notification` | Уведомления (новый сабмит, AI закончил, новое сообщение, ...) |
| `GradingDataset` | Data Moat: пара (AI-оценка, финальная оценка, дельта) |

## Предварительные требования

- **Python 3.11+** (рекомендуем 3.13)
- **Node 20+**
- **Claude Code CLI**: команда `claude --version` должна работать.
  Авторизация — один раз `claude` в терминале, через подписку Claude (Pro/Max).
  Без подписки запускайте в `GRADER_MODE=mock`.
- **poppler** (для рендера PDF-страниц в PNG):
  - macOS: `brew install poppler`
  - Ubuntu: `apt install poppler-utils`

## Запуск

В двух терминалах.

### Terminal 1 — Backend

```bash
cd backend
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m scripts.seed
uvicorn app.main:app --reload --port 8000
```

Если Claude CLI не установлен — в `.env` поставьте `GRADER_MODE=mock`,
тогда грейдинг будет возвращать фиктивный валидный результат.

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

После старта откройте `http://localhost:5173` в браузере.

## Демо-аккаунты (после `seed.py`)

Пароль для всех демо-аккаунтов: **`demo1234`**.

| Роль | Email | Что увидит |
|------|-------|-----------|
| Учитель | `prof.ktitanov@email.com` | 3 группы, 8 учеников, 12 заданий, 3 уже сданные работы (pending / ai_graded / graded) |
| Ученики | `elena.morozova@email.com`, `mikhail.kuznetsov@email.com`, `ivan.petrov@email.com`, `maria.ivanova@email.com`, `artem.volkov@email.com`, `alina.smirnova@email.com`, `kirill.egorov@email.com`, `sofia.belova@email.com` | KPI, курсы, задания |

Кроме того, если в `.env` `DEMO_LOGIN=true`, при первом входе создаются
быстрые демо-аккаунты `prof.demo@email.com` / `student.demo@email.com`
с любым паролем.

## Сценарий демо (≈ 3 минуты)

1. **Health.** Бейдж «AI Grader: online» в шапке у обеих ролей.
2. **Студент.** Логин под `elena.morozova@email.com / demo1234`.
   Дашборд показывает 3 курса и средний балл. Открываете Calculus,
   видите «Производные элементарных функций» — Pending. Нажимаете
   «Сдать работу», прикрепляете `.tex` / `.pdf` / фото → Submit.
3. **Грейдинг.** Через 10–60 секунд (mock — 2 сек) статус автоматически
   меняется на `AI оценил`.
4. **Учитель.** Логин под `prof.ktitanov@email.com / demo1234`.
   В шапке появилось уведомление, в группе «Calculus» — новый pending.
5. **Review.** Открываете работу → слева превью файла, справа AI-балл,
   AI Suggestions, разбивка по критериям и AI Feedback. Меняете оценку,
   пишете комментарий, нажимаете **Finish Review**.
6. **Студент** видит финальную оценку и комментарий в своей карточке
   задания.
7. **Чат.** В обеих ролях вкладка «Чат» — переписка ученик ↔ преподаватель
   в контексте конкретной группы.
8. **Re-grade.** На экране ревью — кнопка `Re-grade`. Можно прогнать
   проверку ещё раз.

## Acceptance Criteria (из ТЗ, раздел 28) — статус

| # | Критерий | Статус |
|---|----------|--------|
| 1 | `/api/health/grader` возвращает `ok` + версию CLI; UI-бейдж «AI Grader: online» | ✓ |
| 2 | Логин студента с любым email/паролем (demo) → дашборд с KPI | ✓ |
| 3 | Submit Homework (PDF/PNG/DOCX/LaTeX) | ✓ |
| 4 | Авто-грейдинг → статус `ai_graded`, видна AI-оценка | ✓ |
| 5 | Логин преподавателя → список сабмишенов с AI Score | ✓ |
| 6 | Review screen: превью файла + AI Score + AI Suggestions + per-criterion | ✓ |
| 7 | Finish Review → статус `graded`, у студента сразу видна финальная оценка | ✓ |
| 8 | Запись в `GradingDataset` с `delta` | ✓ |
| 9 | Re-grade на ошибке | ✓ |
| 10 | Mock-режим (`GRADER_MODE=mock`) — всё работает без CLI | ✓ |

## Структура репозитория

```
autograde-ai-agent/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, роутеры, lifespan
│   │   ├── config.py          # Settings из .env
│   │   ├── db.py              # SQLAlchemy engine + Base + get_db
│   │   ├── deps.py            # get_current_user / teacher / student
│   │   ├── models/            # User, Group, Enrollment, Assignment, Submission,
│   │   │                      # Message, Notification, GradingDataset
│   │   ├── schemas/           # Pydantic
│   │   ├── routers/           # auth, teacher, student, files, chat, health
│   │   ├── services/
│   │   │   ├── auth_service.py     # JWT + bcrypt
│   │   │   ├── storage.py          # FileStorage + LocalStorage
│   │   │   ├── file_processor.py   # PDF→PNG, DOCX→TXT
│   │   │   ├── grader.py           # subprocess к claude CLI + mock
│   │   │   └── notifications_service.py
│   │   └── prompts/grading_prompt.py
│   ├── scripts/seed.py
│   ├── seed_files/            # эталонные .tex для сидов
│   ├── storage/               # сабмишены (gitignored)
│   ├── grading_workdir/       # временные папки на каждый грейдинг (gitignored)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # роутинг
│   │   ├── api/               # axios клиент + endpoints
│   │   ├── components/        # Chat, GraderBadge, SubmissionPreview, ui/*
│   │   ├── pages/
│   │   │   ├── SignIn.tsx
│   │   │   ├── student/       # StudentDashboard, Group, Chat, Notifications
│   │   │   └── teacher/       # Groups, GroupDetail, Students, StudentDetail,
│   │   │                      # Assignments, Review, Stats, Notifications, Chat
│   │   ├── store/auth.ts      # zustand
│   │   ├── types/api.ts
│   │   └── lib/utils.ts
│   ├── package.json, vite.config.ts, tailwind.config.ts
└── docs/AutoGrade_AI.md
```

## Прочее

- **БД и хранилище можно поменять** — `DATABASE_URL=postgresql+psycopg://...`
  переключит на Postgres; `FileStorage` тривиально расширяется на S3/MinIO
  (см. `backend/app/services/storage.py`).
- **Финальную оценку всегда ставит преподаватель** — `ai_score` и
  `final_score` — разные поля. Студенту итог показывается только после
  `Finish Review`.
- **Низкая уверенность AI** (`ai_confidence < 0.7`) — UI на экране ревью
  подсвечивает блок жёлтым и просит ручной разбор.

🤖 Built with [Claude Code](https://claude.com/claude-code).
