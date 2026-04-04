# DirectCloud Jira

Plane v1.2.3 포크 기반 내부 프로젝트 관리 도구.

## Project Structure

```
apps/
  api/          Django REST API (Python 3.11+)
  web/          Next.js 메인 웹앱
  admin/        Next.js 관리자 앱
  space/        Next.js 퍼블릭 스페이스 앱
  proxy/        Caddy 리버스 프록시
  live/         실시간 협업 (WebSocket)
packages/
  constants/    공유 상수 (metadata.ts 등)
  types/        TypeScript 타입 정의
  ui/           공유 UI 컴포넌트
  editor/       에디터 컴포넌트
  hooks/        공유 React 훅
  services/     API 서비스 레이어
  i18n/         다국어 지원
  utils/        유틸리티 함수
```

## Tech Stack

- **Backend**: Django + Django REST Framework + Celery
- **Frontend**: Next.js + TypeScript + TailwindCSS
- **Database**: PostgreSQL + Redis
- **Infra**: Docker Compose (로컬) / AWS ECS + RDS (프로덕션)

## Local Development

```bash
# 전체 실행
docker compose up -d

# 접속: http://localhost:8080 (Caddy proxy)
# 내부 포트: web=3000, admin=3001, space=3002, api=8000

# API 코드 변경 후
docker compose build api && docker compose up -d api

# 프론트엔드 변경 후
docker compose build web && docker compose up -d web
```

**주의**: Base URL 환경변수(APP_BASE_URL 등)는 반드시 proxy 포트 `http://localhost:8080` 사용. 내부 컨테이너 포트(3000 등)는 Docker 네트워크 내부 전용.

## Environment Variables

API 환경변수: `apps/api/.env` (`.env.example` 참고)

주요 변수:
- `SECRET_KEY` — Django secret key
- `DATABASE_URL` — PostgreSQL 연결 문자열
- `REDIS_URL` — Redis 연결 문자열
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` — MS365 OAuth
- `IS_MICROSOFT_ENABLED` — MS365 인증 활성화 플래그

## Auth

MS365 OAuth (Azure AD) 인증 구현 완료:
- Backend: `apps/api/plane/authentication/provider/oauth/microsoft.py`
- Views: `apps/api/plane/authentication/views/app/microsoft.py` (app), `space/microsoft.py` (space)
- URLs: `/auth/microsoft/`, `/auth/microsoft/callback/`, `/auth/space/microsoft/`, `/auth/space/microsoft/callback/`
- Frontend: 각 앱의 `hooks/oauth/core.tsx`에 Microsoft 버튼 추가

## Testing

```bash
# Python 테스트 (Docker 내부)
docker compose exec api python -m pytest

# 테스트 파일 위치
apps/api/plane/tests/unit/           # 단위 테스트
apps/api/plane/tests/contract/app/   # 계약 테스트
```

커버리지 목표: 80% 이상

## Git Workflow

- `main` — 프로덕션 (직접 push 금지)
- `develop` — 통합 (직접 push 금지)
- `feature/*` — 기능 개발 (`develop`에서 분기)
- `bugfix/*` — 버그 수정 (`develop`에서 분기)
- 모든 변경은 PR을 통해 진행

## Commit Convention

```
type(scope): subject

Co-Authored-By: <model> <noreply@anthropic.com>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Upstream

- Origin: `directcloudlab/plane`
- Upstream: `makeplane/plane` (Plane 원본)
- 동기화: 월 1회 확인, 보안 패치 즉시 cherry-pick
