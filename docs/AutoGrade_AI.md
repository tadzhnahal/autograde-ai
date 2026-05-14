# AutoGrade AI

> Ассистент проверки домашних работ для преподавателей. Сокращает время проверки и сохраняет единые критерии оценки. Финальное решение об оценке всегда остаётся за преподавателем.

> ⚠️ **Контекст этого документа.** Это ТЗ для локального демо-MVP, который собирается на машине разработчика и снимается на видео для демонстрации работоспособности идеи. Никакой сетевой инфраструктуры. Никакого платного Anthropic API. Роль AI-грейдера выполняет **локально установленный Claude Code (CLI)**, авторизованный через существующую подписку разработчика.

---

## 1. Проблема: ручная проверка не масштабируется

Курс на 100–150 студентов создаёт узкое место в процессе обучения — проверку работ.

Задания приходят в разных форматах: рукописные решения, PDF, документы. Даже с ассистентами проверка занимает дни, а качество обратной связи падает.

Студенты не понимают логику оценок и чаще подают апелляции. Кафедры фиксируют разброс оценок между потоками из-за разной интерпретации критериев.

В результате растёт операционная нагрузка, снижается скорость обратной связи, а текущая модель проверки перестаёт масштабироваться под курс.

---

## 2. Задача преподавателя — что должно происходить в идеале

При большом потоке студентов преподавателю важно быстро и последовательно оценивать работы по единым критериям, сохраняя контроль над итоговой оценкой.

Студенты должны понимать логику выставленных баллов и получать понятный разбор, а курс — сохранять стабильное качество между потоками.

Текущая модель ручной проверки не закрывает эту задачу: она замедляет выставление оценок, усиливает субъективность и не позволяет применять единые критерии при большом объёме работ и плотном учебном графике.

---

## 3. Как выглядит процесс проверки сегодня — ручная проверка ломается на каждом этапе

**До проверки.** Работы приходят в разных форматах: файлы, сканы, фотографии, рукописные решения. Разнообразие форматов создаёт операционную нагрузку ещё до начала проверки.

**Во время проверки.** Преподаватель вручную сверяет решения с эталоном, начисляет баллы и пишет комментарии. При большом объёме работ проверка растягивается на вечера и выходные, усталость снижает внимание, одинаковые решения получают разные оценки.

**После проверки.** Оценки возвращаются с задержкой, комментарии остаются минимальными. Студенты чаще подают апелляции, кафедра фиксирует разброс оценок и рост нагрузки без улучшения качества.

---

## 4. Цифровые сервисы проверки работ уже используют в ведущих университетах США и Канады

В **Northwestern University** внедрили цифровой сервис **Crowdmark** для проверки письменных экзаменов в больших группах студентов. Преподаватели проверяют работы по общим критериям и используют единый набор комментариев. Это сократило время проверки примерно на **40%** и сэкономило около **16 660 часов** работы проверяющих, а также снизило число пересмотров оценок.

В **University of British Columbia** применили цифровой сервис проверки коротких текстовых ответов в курсе по cloud computing. Генеративную модель встроили поверх автогрейдера и оставили финальное решение за преподавателем. Точность проверки заданий с однозначным ответом выросла с **39% до 99%**, а коротких ответов на экзаменационных вопросах — **до 98%**.

---

## 5. Инструменты на рынке решают частные задачи проверки, но не работают с рукописными решениями

Рынок уже использует сервисы проверки, но каждый из них решает отдельную часть задачи.

- **Gradescope** — упрощает работу с рубриками и цифровыми ответами, но не проверяет ход решения.
- **Crowdmark** — ускоряет командную проверку экзаменов, но оставляет анализ решения преподавателю.
- **Copilot-подобные инструменты** — дают фидбек, но не сверяют ответ с эталоном преподавателя.
- **Плагины LMS** — проверяют простые форматы и не работают с формулами и рукописным вводом.

---

## 6. Что такое AutoGrade AI

**AutoGrade AI** — ассистент проверки домашних работ, который сокращает время преподавателя на проверку студенческих работ и сохраняет единые критерии оценки.

Преподаватель отправляет эталонное решение и критерии, а система готовит черновую оценку и обоснование. **Финальное решение об оценке принимает преподаватель.**

---

## 7. AutoGrade AI помогает преподавателю проверять работы студентов

AutoGrade AI работает как вспомогательный сервис: он берёт на себя первичную проверку по критериям, а преподаватель сохраняет контроль над итоговой оценкой и едиными правилами для всего потока.

| Задача и боль | Что даёт AutoGrade AI |
|---|---|
| Проверка сложных заданий занимает вечера и выходные | Сокращает время проверки за счёт автоматизированной первичной оценки |
| Трудно применять одни и те же критерии ко всем работам | Проверяет по эталонным решениям и критериям преподавателя |
| Комментарии сокращаются из-за нехватки времени | Готовит понятное обоснование оценки по каждому решению |
| Студенты не понимают логику баллов | Повышает прозрачность проверок и снижает число апелляций |
| Рост потока увеличивает нагрузку на кафедру | Делает процесс оценивания предсказуемым и устойчивым |

---

## 8. AutoGrade AI подходит для университетов, онлайн-школ и отделов корпоративного обучения

AutoGrade AI решает задачу проверки заданий там, где большой поток работ создаёт операционную нагрузку и замедляет обратную связь.

| Сегмент | Проблемы |
|---|---|
| Университеты | Проверка большого потока работ перегружает преподавателей и ассистентов |
| Онлайн-школы | Ручная проверка замедляет рост курсов и выпуск студентов |
| Корпоративное обучение | Ручное оценивание мешает применять единые критерии |

**ДО:**
- ✖ Медленно
- ✖ Субъективно
- ✖ Разный фидбэк
- ✖ Не масштабируется

**ПОСЛЕ:**
- ✔ Быстро
- ✔ По единым критериям
- ✔ Прозрачный фидбэк
- ✔ Контроль преподавателя

---

## 9. Как работает AutoGrade AI

1. **Принимает работы.** Студент загружает решение в формате PDF, фото или документа. Преподаватель сохраняет текущий процесс сдачи заданий.
2. **Приводит решение к единому виду.** Система распознаёт текст, формулы и структуру и переводит работу в читаемый формат. Преподаватель видит содержание решения без искажений формата.
3. **Сравнивает с эталонным решением по критериям.** Преподаватель задаёт эталон, критерии и rubric. Система сравнивает решение студента по критериям.
4. **Готовит результат для преподавателя.** Система формирует баллы по критериям, комментарии с объяснением. Преподаватель проверяет результат, вносит правки и ставит оценку.

---

## 10. Архитектура системы AutoGrade AI

**Входы:**
- Преподаватель отправляет задание, эталонное решение, критерии оценивания.
- Студент отправляет фото рукописного решения в PDF- или DOC-файле.

**Конвейер обработки внутри системы AutoGrade AI:**

1. **Распознавание.** Мультимодальная модель распознаёт и анализирует фото рукописей, формулы и структуру решения.
2. **Сравнение.** Модель сравнивает решение студента с эталонным, проверяет логику рассуждений и выставляет оценку по единым критериям.
3. **Результат.** Система ставит балл, оставляет комментарии по шагам решения и вычисляет коэффициент валидности оценки.

**Выходы:**
- Студент получает баллы за работу, а также комментарии по доработке заданий.
- Система сохраняет проверки в БД как датасет «решение → AI-оценка → правка преподавателя → финальная оценка» (Data Moat для будущих итераций).

> 🔧 **В локальной демо-сборке** роль мультимодальной модели играет **локально установленный Claude Code (CLI)**. Бэкенд вызывает `claude` как subprocess и парсит JSON-ответ. Ничего наружу не уходит, никаких API-токенов и платежей не требуется — используется существующая авторизация Claude Code на машине разработчика. См. раздел 23.

---

## 11. Интерфейсы продукта

### 11.1. Экран входа и дашборд студента

**Экран входа (Sign In):**
- Заголовок «Welcome to AutoGrade AI» / «Upload your homework and check your grades».
- Переключатель ролей: **Student / Teacher**.
- Поля: Email, Password.
- Кнопка «Sign In as Student».
- Подпись «Demo: Use any email to sign in».

**Дашборд студента (AutoGrade AI — Student):**
- Шапка: имя дашборда, email пользователя, кнопка Logout.
- Три KPI-карточки сверху:
  - **Total Assignments** (например, 15)
  - **Average Grade** (например, 9.1/10)
  - **Pending Submissions** (например, 5)
- Раздел **My Subjects** — список предметов студента:
  - Calculus — «3/6 assignments completed», Avg 9.2/10
  - Discrete Mathematics — «3/4 assignments completed», Avg 8.8/10
  - Python for Data Analysis — «4/5 assignments completed», Avg 9.2/10
- Каждый предмет — карточка с иконкой, прогрессом и кликом для перехода.

### 11.2. Экран предмета и сдачи задания (студент)

**Экран курса (например, Calculus):**
- Хлебные крошки «Back to My Subjects».
- Прогресс по курсу: «Progress: 3/6 assignments completed».
- Список заданий, у каждого:
  - Название (например, «Derivatives Problem Set»).
  - Описание (например, «Complete problems 1-15 on derivatives»).
  - Дата сдачи (например, Due: 10/15/2025).
  - Статус-бейдж: **Graded / Submitted / Pending**.
  - Если оценено — оценка (например, 9.5/10) и блок **Feedback** с текстовым комментарием от преподавателя/AI.
- Кнопка **Submit Homework** у непросроченных заданий.

**Модалка отправки задания (Submit: ...):**
- Заголовок и подсказка «Upload your homework file and add any notes».
- Поле **Homework File** — выбор файла (Browse).
- Поле **Notes (Optional)** — текстовая заметка.
- Кнопка **Submit Assignment**.

### 11.3. Дашборд преподавателя и экран ревью работы

**Список submissions (AutoGrade AI — Teacher):**
- Хлебные крошки «Back to All Subjects».
- Название курса (Calculus), статус «Submissions: 8 pending».
- Фильтры-табы: **All (8) / Pending (8) / Graded (12) / Homework #3**.
- Таблица сабмишенов с колонками: Student, Submitted, Grade, AI Score, Status, Action (Review).
- Для каждой строки: аватар + ФИО + email студента, время сдачи, AI Score (например, 9.1/10), статус Pending, кнопка **Review**.

**Экран ревью работы (Calculus Assignment Review):**
- Заголовок: студент (например, Elena Morozova), email.
- Метаданные сабмишена: «Homework #3 / Submitted: ... ago».
- Превью загруженного решения (сканы/фото с пометками «Correct» по шагам).
- Правая панель:
  - **Review Results** — итоговый AI-балл (например, 9.1/10).
  - **AI Suggestions** — список тезисов от AI, например:
    - «Solutions correctly follow the problem-solving steps»
    - «No calculation errors were detected»
    - «Clean and legible presentation»
    - «Required criteria met: showed all steps, used correct notation»
  - Подпись «All results should be verified before finalizing any grade».
  - **Grade & Feedback** — поле для финальной оценки (например, 9.0).
  - Поле текстового комментария преподавателя.
  - Кнопки **Finish Review** и **Mark as Revision**.

---

## 12. Data Moat — формируется из реальных проверок

AutoGrade AI строит **Data Moat** на данных реальной проверки заданий. Система использует эти данные для дообучения на подтверждённых примерах, где преподаватель принял или изменил результат. **Data Moat растёт вместе с использованием продукта.**

> В локальном MVP данные сохраняются в БД как датасет `submission_id → ai_score → final_score → delta`. Дообучения модели в этой версии нет.

---

## 13. Бизнес-модель — AutoGrade AI продаёт подписку образовательным организациям

- AutoGrade AI работает как **B2B SaaS**.
- Основная модель — **подписка** с оплатой за преподавателя или за курс.
- Для крупных клиентов — **enterprise-лицензия**.

---

## 14. Масштабирование — по предметам, языкам и рынкам

- Продукт проверяет задания по **математике, программированию и логическим дисциплинам** и добавляет новые предметы через эталон и критерии преподавателя.
- **Поддержка новых языков** позволяет проверять задания и писать комментарии на языке курса.
- **Интеграция с LMS** (Moodle, Canvas и пр.).

---

## 15. Почему сейчас?

LLM-модели научились работать с **учебными заданиями**, а не только с тестами и эссе. Они сравнивают решения по шагам, учитывают формулы, код и текст и применяют критерии преподавателя к каждому элементу ответа.

Преподаватели проверяют работы от больших потоков студентов в сложных форматах: рукописные решения, сканы, фотографии и код. Этот процесс занимает много времени и больше не укладывается в учебные сроки.

---

## 16. Как мы решаем пять потенциальных рисков

1. **Риск ошибок в оценке.** Система выполняет только первичную проверку, показывает уровень уверенности и отправляет сомнительные работы на ручной просмотр. Преподаватель утверждает финальную оценку.
2. **Риск «чёрного ящика».** Система проверяет строго по эталону и критериям преподавателя и даёт обоснование баллов по каждому пункту. Преподаватель видит логику оценки до утверждения.
3. **Риск потери контроля у преподавателя.** Преподаватель задаёт эталон, критерии и правила. Система не выставляет итоговую оценку без подтверждения от человека.
4. **Риск утечки данных студентов.** Организация контролирует хранение и доступ к данным. В локальной сборке всё хранится на машине пользователя.
5. **Риск сложного внедрения.** Система принимает работы в текущих форматах и интегрируется с LMS. Преподаватель не меняет способ сдачи и проверки заданий.

---

## 17. План пилота

Запустить пилот на **1–2 курсах** с текущими заданиями и форматами сдачи. Преподаватель задаёт эталон и критерии, система выполняет первичную проверку, преподаватель утверждает итог.

Измеряем: время проверки, единообразие оценок, число апелляций, качество комментариев.

После пилота принимаем решение о масштабировании.

---

# Часть II. Технические требования к локальной демо-сборке (ТЗ для Claude Code)

> Цель этой части — собрать локальный демо-MVP, который можно записать на видео и показать как работающую концепцию. Не продакшн, не сетевой деплой, не подключение к платному API.

## 18. Цель и принципы локальной сборки

**Цель:** записать видео-демо, где видно: студент сдаёт работу → бэкенд запускает локальный Claude Code → Claude Code анализирует работу по эталону и рубрике → преподаватель в UI видит AI-оценку, AI-suggestions, превью файла → правит оценку и закрывает ревью.

**Принципы:**

1. **Никакого Anthropic API.** Грейдинг идёт через локальный CLI `claude` (Claude Code), который уже установлен и авторизован у разработчика через подписку Claude.ai / Claude Pro / Max. Это бесплатно для разработчика в рамках его существующего лимита.
2. **Никакой сетевой инфры.** SQLite, локальная папка для файлов, всё запускается двумя командами в двух терминалах.
3. **Демо-режим аутентификации.** Любой email/пароль работает. Роль выбирается переключателем на экране входа, как в макете.
4. **Минимум зависимостей.** Никаких очередей, Docker, Redis, S3 и прочего overhead. Фоновые задачи — через `BackgroundTasks` FastAPI.
5. **Стиль UI 1-в-1 с макетами** со страниц 11–13 презентации.

## 19. Стек

**Frontend:**
- **React 18 + Vite + TypeScript**.
- **TailwindCSS** + минимальный набор компонентов из **shadcn/ui** (Button, Card, Dialog, Input, Badge, Tabs, Table, Avatar).
- **React Router v6** — навигация.
- **Zustand** — глобальное состояние (auth, role).
- **TanStack Query** — fetch и инвалидация (для опроса статуса грейдинга).
- **lucide-react** — иконки.

**Backend:**
- **Python 3.11+**.
- **FastAPI** + **uvicorn**.
- **SQLAlchemy 2.x** + **Alembic** — ORM и миграции (для демо можно `Base.metadata.create_all()` без Alembic).
- **Pydantic v2** — валидация.
- **python-multipart** — приём файлов.
- **pypdf** — извлечение текста из PDF.
- **pdf2image** + **Pillow** — конвертация страниц PDF в PNG (для передачи Claude Code как изображений).
- **python-docx** — текст из DOCX.
- **passlib[bcrypt]** + **python-jose[cryptography]** — JWT для demo-логина.

**База данных:**
- **SQLite** (`backend/autograde.db`).

**Грейдер:**
- Локальный **Claude Code CLI** — команда `claude`. Должна быть в `$PATH`. Если разработчик пользуется Claude Code через VS Code расширение, CLI обычно ставится автоматически вместе с ним. Проверка: `claude --version`.

## 20. Структура репозитория

```
autograde-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models/                # SQLAlchemy
│   │   ├── schemas/               # Pydantic
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── student.py
│   │   │   ├── teacher.py
│   │   │   ├── files.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── grader.py          # Subprocess-вызов Claude Code
│   │   │   ├── file_processor.py  # PDF/image/docx → нормализация
│   │   │   └── auth_service.py
│   │   └── prompts/
│   │       └── grading_prompt.py
│   ├── scripts/
│   │   └── seed.py
│   ├── seed_files/                # эталонные файлы для сидов
│   ├── storage/                   # submissions/{id}/* (gitignored)
│   ├── grading_workdir/           # временные папки для каждого грейдинга (gitignored)
│   ├── autograde.db               # SQLite (gitignored)
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/                   # HTTP-клиент
│   │   ├── components/ui/         # shadcn
│   │   ├── components/student/
│   │   ├── components/teacher/
│   │   ├── pages/
│   │   │   ├── SignIn.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentCourse.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── TeacherCourse.tsx
│   │   │   └── TeacherReview.tsx
│   │   ├── store/
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── docs/
│   └── AutoGrade_AI.md            # этот файл
├── .gitignore
└── README.md
```

## 21. Модель данных (SQLite)

**User**
- `id` (uuid str)
- `email` (unique)
- `password_hash`
- `full_name`
- `role` (`student` | `teacher`)
- `created_at`

**Subject**
- `id`, `name`, `description`, `teacher_id` → User, `created_at`

**Enrollment**
- `id`, `student_id` → User, `subject_id` → Subject

**Assignment**
- `id`, `subject_id` → Subject
- `title`, `description`
- `due_date`
- `reference_solution` (text/markdown)
- `rubric` (JSON: `[{ "criterion": str, "max_points": float, "description": str }]`)
- `max_score` (float, default 10.0)
- `created_at`

**Submission**
- `id`, `assignment_id` → Assignment, `student_id` → User
- `file_path` (относительный путь в `storage/`)
- `file_type` (`pdf` | `image` | `docx`)
- `student_notes` (text, optional)
- `status` (`pending` | `grading` | `ai_graded` | `graded` | `revision` | `error`)
- `ai_score` (float, nullable)
- `ai_feedback` (text, nullable)
- `ai_suggestions` (JSON, nullable)
- `ai_confidence` (float 0..1, nullable)
- `ai_per_criterion` (JSON, nullable)
- `ai_raw_output` (text, nullable — сырой stdout от Claude Code для дебага)
- `final_score` (float, nullable)
- `teacher_feedback` (text, nullable)
- `graded_by` → User (nullable)
- `submitted_at`
- `ai_graded_at` (nullable)
- `graded_at` (nullable)

**GradingDataset** (Data Moat)
- `id`, `submission_id` → Submission
- `ai_score`, `final_score`, `teacher_changed` (bool), `delta`
- `created_at`

## 22. REST API

**Auth**
- `POST /api/auth/login` — `{email, password, role}` → `{token, user}`. Любой email/пароль валидны в demo.
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Student**
- `GET /api/student/dashboard` — `{total_assignments, average_grade, pending_submissions, subjects: [...]}`.
- `GET /api/student/subjects/{subject_id}/assignments` — задания с прикреплёнными `submission` текущего студента.
- `POST /api/student/assignments/{assignment_id}/submit` — multipart: `file`, `notes`. Создаёт `Submission` со статусом `pending`, запускает фоновый грейдинг → статус становится `grading`, потом `ai_graded`.

**Teacher**
- `GET /api/teacher/subjects` — курсы преподавателя со счётчиками pending/graded.
- `GET /api/teacher/subjects/{subject_id}/submissions?status=&assignment_id=` — список сабмишенов с AI-баллами.
- `GET /api/teacher/submissions/{submission_id}` — детали + AI-результат + ссылка на файл.
- `POST /api/teacher/assignments` — создать задание (для seed-сценария или ручного добавления).
- `POST /api/teacher/submissions/{submission_id}/finish` — `{final_score, teacher_feedback}` → закрыть ревью + запись в `GradingDataset`.
- `POST /api/teacher/submissions/{submission_id}/revision` — статус `revision`.
- `POST /api/teacher/submissions/{submission_id}/regrade` — перезапустить пайплайн грейдинга.

**Files**
- `GET /api/files/submissions/{submission_id}` — отдать файл (с проверкой прав).

**Health**
- `GET /api/health/grader` — проверяет, что `claude --version` отрабатывает; возвращает версию или ошибку. Используется на старте бэка и для бейджа в UI «AI grader: online».

## 23. Пайплайн «AI-грейдер через локальный Claude Code CLI»

Это центральная часть демо. **Никакого Anthropic API.** Только subprocess к локальному CLI.

### 23.1. Высокоуровневый поток

После сабмита:

1. Создаём временную папку `backend/grading_workdir/{submission_id}/`.
2. Кладём туда:
   - `student_work.pdf` (или `.png` / `.docx`) — копия файла студента.
   - `student_work_pages/page_01.png`, `page_02.png`, ... — если PDF, рендерим страницы в PNG (Claude Code сможет их прочитать как изображения).
   - `assignment.json` — `{ title, description, reference_solution, rubric, max_score }`.
   - `instructions.md` — промпт для Claude Code (см. 23.3).
3. Запускаем subprocess:
   ```
   claude -p "<содержимое instructions.md>" \
          --output-format json \
          --permission-mode acceptEdits \
          --add-dir <абсолютный путь к grading_workdir/{submission_id}>
   ```
   *(точные имена флагов сверять с `claude --help` той версии CLI, что установлена у разработчика; `-p` запускает Claude Code в неинтерактивном print-режиме и возвращает финальный ответ ассистента в stdout)*.
4. Парсим stdout (JSON-обёртка → итоговый ответ ассистента → JSON оценки).
5. Валидируем через Pydantic-схему `GradingResult`.
6. Записываем в `Submission` (`ai_score`, `ai_feedback`, `ai_suggestions`, `ai_per_criterion`, `ai_confidence`, `ai_raw_output`).
7. Статус: `ai_graded`. При ошибке парсинга / падении subprocess — статус `error`, сохраняем stderr в `ai_raw_output`.

### 23.2. Вызов CLI — псевдокод

`backend/app/services/grader.py`:

```python
import subprocess, json, shutil
from pathlib import Path
from .file_processor import render_pdf_to_pngs
from app.prompts.grading_prompt import GRADING_PROMPT

WORKDIR_ROOT = Path("grading_workdir")
CLAUDE_BIN = "claude"
TIMEOUT = 300

class GraderError(RuntimeError): pass

def grade_submission(submission, assignment, source_file: Path) -> dict:
    workdir = (WORKDIR_ROOT / str(submission.id)).resolve()
    workdir.mkdir(parents=True, exist_ok=True)

    # 1. Готовим файлы в рабочей папке
    shutil.copy(source_file, workdir / source_file.name)
    if source_file.suffix.lower() == ".pdf":
        render_pdf_to_pngs(source_file, workdir / "student_work_pages")

    (workdir / "assignment.json").write_text(
        json.dumps({
            "title": assignment.title,
            "description": assignment.description,
            "reference_solution": assignment.reference_solution,
            "rubric": assignment.rubric,
            "max_score": assignment.max_score,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (workdir / "instructions.md").write_text(GRADING_PROMPT, encoding="utf-8")

    # 2. Запуск локального Claude Code
    cmd = [
        CLAUDE_BIN,
        "-p", GRADING_PROMPT,
        "--output-format", "json",
        "--permission-mode", "acceptEdits",
        "--add-dir", str(workdir),
    ]
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=TIMEOUT,
        cwd=workdir,
    )
    if proc.returncode != 0:
        raise GraderError(proc.stderr or "claude CLI failed")

    return parse_claude_output(proc.stdout, workdir)
```

**Замечания:**
- `--output-format json` возвращает обёртку с метаданными запуска и финальным сообщением ассистента; в `parse_claude_output` сначала достаём это сообщение, затем извлекаем из него полезный JSON оценки.
- `--permission-mode acceptEdits` — на случай, если Claude Code захочет сохранить промежуточный файл (мы как раз просим его записать `grading_result.json`). Чтение файлов в `--add-dir` обычно не требует разрешений.
- Таймаут 5 минут с запасом на сложные работы.
- Если `claude` не найден или авторизация не пройдена — `/api/health/grader` это покажет, а сабмит уйдёт в статус `error`.
- На Windows запускать через `cmd /c claude ...` или с `shell=True` — закладывай в конфиг через `CLAUDE_BIN`.

### 23.3. Промпт для Claude Code (`instructions.md`)

`backend/app/prompts/grading_prompt.py`:

```text
Ты — AI-ассистент проверки домашних работ в системе AutoGrade AI.

В этой рабочей папке (она передана тебе через --add-dir и является твоим cwd) лежат:
- assignment.json — задание, эталонное решение и критерии (rubric).
- student_work.<pdf|png|jpg|docx> — оригинальный файл студента.
- student_work_pages/page_*.png — постраничные рендеры (если был PDF).

ТВОЯ ЗАДАЧА:
1. Прочитай assignment.json — пойми, что от студента требовалось, какой эталон и какие критерии оценки.
2. Прочитай работу студента. Если есть PNG-страницы рукописи — прочитай их как изображения. Если есть текстовый файл — прочитай текст. Распознай формулы и шаги решения.
3. Сверь работу студента с эталоном по каждому критерию из rubric.
4. По каждому критерию выстави балл, максимум и короткий комментарий.
5. Оцени свою уверенность от 0 до 1. Если работа плохо читается, неоднозначна или часть решения отсутствует — снижай confidence.
6. Сформулируй 3–5 коротких AI-suggestions для преподавателя (что хорошо / на что обратить внимание).
7. Напиши итоговый feedback для студента (3–6 предложений, дружелюбно, по делу).

ВАЖНО:
- Ты НЕ выставляешь финальную оценку. Ты готовишь черновик для преподавателя.
- Оценивай ТОЛЬКО по критериям из rubric. Не добавляй своих критериев.
- Не запускай bash и не ходи в сеть. Только чтение файлов из этой папки.
- Создай в текущей папке файл `grading_result.json` с результатом по схеме ниже.
- В финальном ответе верни ТОЛЬКО этот же JSON, без markdown-обёрток и без преамбулы.

СХЕМА grading_result.json:
{
  "ai_score": number,            // сумма по всем per_criterion.points
  "max_score": number,           // = assignment.max_score
  "confidence": number,          // 0..1
  "per_criterion": [
    {
      "criterion": string,       // дословно из rubric
      "points": number,
      "max_points": number,      // дословно из rubric
      "comment": string          // 1-2 предложения
    }
  ],
  "suggestions": [string, ...],  // 3-5 пунктов
  "feedback": string             // 3-6 предложений для студента
}
```

### 23.4. Парсинг ответа

```python
from pydantic import BaseModel, Field
import json, re

class CriterionScore(BaseModel):
    criterion: str
    points: float
    max_points: float
    comment: str

class GradingResult(BaseModel):
    ai_score: float
    max_score: float
    confidence: float = Field(ge=0, le=1)
    per_criterion: list[CriterionScore]
    suggestions: list[str]
    feedback: str

def parse_claude_output(stdout: str, workdir: Path) -> dict:
    # 1) Самый надёжный путь — файл grading_result.json в workdir
    result_file = workdir / "grading_result.json"
    if result_file.exists():
        return GradingResult.model_validate_json(result_file.read_text("utf-8")).model_dump()

    # 2) Иначе — парсим stdout
    # --output-format json возвращает что-то вроде:
    # { "type": "result", "result": "<финальный текст ассистента>", ... }
    try:
        wrapper = json.loads(stdout)
        text = wrapper.get("result") or wrapper.get("content") or stdout
    except json.JSONDecodeError:
        text = stdout

    # 3) Достаём JSON из текста (первый { ... последний })
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise GraderError(f"No JSON in Claude output: {text[:500]}")
    return GradingResult.model_validate_json(match.group(0)).model_dump()
```

### 23.5. Стратегия запуска

Для демо достаточно `BackgroundTasks` FastAPI: после `POST /submit` отдаём 202 с `submission_id`, грейдинг идёт в фоне. Фронт каждые 2 секунды опрашивает `GET /api/teacher/submissions/{id}` через TanStack Query — для демо хватит polling, WebSocket не нужен.

### 23.6. Демо-fallback (если CLI недоступен)

В `.env` флаг `GRADER_MODE=claude_cli | mock`. В режиме `mock` сервис возвращает фиктивный валидный `GradingResult` (со случайным баллом 7.0–9.5 и шаблонными комментариями) после 2-секундной задержки. Полезно, чтобы UI разрабатывался независимо от наличия `claude` CLI и чтобы видео можно было записать даже если CLI временно лежит.

## 24. UI-требования (по макетам из презентации)

**Общее:**
- Светлая тема, белый фон, slate-50 для второстепенных поверхностей.
- Чёрные кнопки primary, серые secondary.
- Бейджи: фиолетовый (AI Score / Avg), зелёный (Graded), синий (Submitted), серый (Pending).
- Шрифт: Inter / системный.
- Радиусы: `rounded-xl` карточки, `rounded-lg` кнопки.
- Иконки: `lucide-react`.

**Sign In (стр. 11):** карточка по центру, переключатель Student/Teacher, поля email/password, кнопка «Sign In as Student/Teacher», подпись «Demo: Use any email to sign in».

**Student Dashboard (стр. 11):** шапка с email и Logout, три KPI-карточки (Total Assignments / Average Grade / Pending Submissions), секция «My Subjects» — список предметов с иконкой-книгой, прогрессом, фиолетовым badge со средней оценкой, бейджем `3/6`, стрелкой.

**Student Course View (стр. 12):** «Back to My Subjects», заголовок, прогресс, список заданий-карточек со статусами и фидбеком в зелёной плашке, кнопка «Submit Homework», модалка с полями Homework File + Notes + кнопкой Submit Assignment.

**Teacher Submissions List (стр. 13):** шапка преподавателя, «Back to All Subjects», заголовок курса + счётчик pending, табы All/Pending/Graded/Homework, таблица сабмишенов (Student, Submitted, Grade, AI Score, Status, Review).

**Teacher Review Screen (стр. 13):** имя студента, метаданные сабмишена, слева превью файла (PDF-viewer или image-viewer), справа панель Review Results: AI Score, AI Suggestions (чек-листом), дисклеймер, Grade & Feedback с финальной оценкой и текстом, кнопки Finish Review и Mark as Revision.

**Бейдж «AI Grader: online/offline»** в углу шапки — индикатор результата `/api/health/grader`. Полезно показать в видео-демо: «смотрите, грейдер локальный, работает».

## 25. Сид-данные для демо

`backend/scripts/seed.py` создаёт:

- 1 преподавателя: `prof.ktitanov@email.com`, имя «Prof. K. Titanov».
- 8 студентов с теми же ФИО, что в макете: Elena Morozova, Mikhail Kuznetsov, Ivan Petrov, Maria Ivanova, Artem Volkov, Alina Smirnova, Kirill Egorov, Sofia Belova.
- 3 предмета: Calculus (преподаватель — Titanov), Discrete Mathematics, Python for Data Analysis.
- По 4–6 заданий на каждый предмет с заполненными `reference_solution` и `rubric`.
- 2–3 заранее загруженных тестовых файла (например, рукописное решение по производным в `seed_files/derivatives_*.png`), привязанных к разным студентам, в статусах `submitted` и `ai_graded`, чтобы демо-видео началось с уже наполненной системой.

## 26. Конфигурация и запуск

**`.env.example` (backend):**
```
DATABASE_URL=sqlite:///./autograde.db
STORAGE_PATH=./storage
GRADING_WORKDIR=./grading_workdir
JWT_SECRET=dev-secret-change-me
CORS_ORIGINS=http://localhost:5173

# Грейдер
GRADER_MODE=claude_cli            # claude_cli | mock
CLAUDE_BIN=claude                 # путь или имя в PATH
CLAUDE_TIMEOUT_SECONDS=300
```

**`README.md` корневой — раздел «Запуск»:**

Предварительные требования:
- Python 3.11+, Node 20+.
- Установленный Claude Code: `claude --version` должно работать. Если установлено только VS Code расширение, проверь, доступна ли команда `claude` в обычном терминале — обычно она ставится вместе с расширением. Авторизация — `claude` один раз в терминале, войти через подписку.

Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Проверка работоспособности грейдера:
```bash
curl http://localhost:8000/api/health/grader
# { "status": "ok", "version": "claude-code x.y.z" }
```

## 27. Реализация рисков из презентации в коде

| Риск | Техническая реализация |
|---|---|
| Ошибки в оценке | Поле `ai_confidence`. Если `< 0.7` — UI красит карточку в жёлтый и пишет «Требует ручной проверки». Кнопка Regrade. |
| Чёрный ящик | Обязательное `per_criterion` с комментарием по каждому пункту rubric. Блок AI Suggestions в правой панели ревью. |
| Потеря контроля у преподавателя | `ai_score` и `final_score` — разные поля. Оценка студенту показывается только после `Finish Review`. |
| Утечка данных | Всё локально. Файлы — в `backend/storage`, БД — SQLite, грейдинг — локальный CLI. Ничего наружу не уходит, кроме штатного трафика Claude Code, которым уже владеет пользователь. |
| Сложное внедрение | Загрузка PDF/JPG/PNG/DOCX. Структура БД с полями `reference_solution`/`rubric` совместима с импортом из LMS в будущем. |

## 28. Acceptance Criteria (что считается «готово» для видео-демо)

1. **Health.** `GET /api/health/grader` возвращает `ok` и версию локального `claude`. В шапке UI горит зелёный бейдж «AI Grader: online».
2. **Login как студент.** Любой email + пароль на табе Student → попадаем на дашборд с тремя KPI и тремя курсами как на макете.
3. **Сабмит.** В курсе Calculus открываем задание Pending → жмём Submit Homework → выбираем PDF/PNG с рукописным решением → отправляем.
4. **Грейдинг.** Через 10–60 секунд (в зависимости от Claude Code) статус задания меняется на `ai_graded`. В UI студента появляется AI-оценка и feedback.
5. **Login как преподаватель.** На табе Teacher любой email → дашборд с курсами → Calculus → список сабмишенов → видим строки студентов с AI Score.
6. **Review.** Открываем сабмишен Elena Morozova → видим превью файла слева, справа AI Score, AI Suggestions, дисклеймер, поля Grade & Feedback.
7. **Finish Review.** Меняем оценку с 9.1 на 9.0, пишем фидбек, жмём Finish Review → статус `graded`, у студента в курсе сразу видна финальная оценка и комментарий.
8. **Data Moat.** В таблице `GradingDataset` появилась запись с `delta = -0.1`.
9. **Regrade на ошибке.** Если намеренно подсунуть сломанный файл — статус `error`, кнопка Regrade рабочая.
10. **Mock-режим.** При `GRADER_MODE=mock` всё работает без `claude` CLI — UI получает фиктивный валидный результат, чтобы можно было снять видео даже на машине без CLI.

## 29. Что НЕ входит в локальный демо-MVP

- Anthropic API, любые платные облачные сервисы.
- Сетевой деплой, домены, HTTPS, reverse-proxy, Docker.
- Production-grade аутентификация (SSO, OAuth, MFA).
- Интеграции с LMS (Moodle / Canvas) — заложена модель данных, без реализации.
- Биллинг и подписки.
- Дообучение собственной модели (SFT/RL) — собираем датасет в `GradingDataset`, но не тренируем.
- Мультиязычный UI (UI — английский по макету; feedback студенту — на языке, на котором писал Claude Code).
- Мобильное приложение.

## 30. Сценарий для записи видео-демо

1. Открыть терминал, показать `claude --version` — есть локальный CLI.
2. Открыть два терминала, запустить backend и frontend.
3. В браузере зайти на `http://localhost:5173` — экран Sign In.
4. Залогиниться как студент `elena.morozova@email.com` → дашборд с KPI и тремя предметами.
5. Зайти в Calculus → задание «Applications of Derivatives» в Pending → нажать Submit Homework, прикрепить заранее подготовленный PNG с рукописным решением → Submit.
6. Подождать 10–30 секунд, показать как статус меняется (можно для эффекта в соседнем окне открыть `tail -f` логов бэка, чтобы было видно вызов `claude`).
7. Разлогиниться → залогиниться как преподаватель `prof.ktitanov@email.com` (роль Teacher на тоггле).
8. Открыть Calculus → список pending → нажать Review на этой работе.
9. На экране ревью показать: превью работы слева, AI Score справа, AI Suggestions с 3–5 пунктами, AI-feedback.
10. Изменить оценку, вписать комментарий, нажать Finish Review.
11. Вернуться в роль студента — показать обновлённую оценку и feedback в карточке задания.
12. (Опционально) Открыть SQLite в DB Browser, показать запись в `GradingDataset` с `delta`.

Если по этому сценарию всё проходит без ручных правок — продукт готов к видео-демо.
