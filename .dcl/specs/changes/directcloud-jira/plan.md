# DirectCloud Jira - Plan

**Date**: 2026-04-03
**Status**: Approved
**Approach**: Plane 포크 + 모듈 단계 확장 + AI 차별화
**Plane Version**: 최신 stable 릴리즈 기준 (포크 시점에 태그 확인 후 확정)

---

## Intent

Plane(오픈소스 Jira 대안)을 포크하여 DirectCloud 자체 프로젝트 관리 도구를 구축한다.
Django + Next.js + PostgreSQL 스택을 그대로 유지하고, MS365 인증 연동 + AI 기능을 추가하여
내부 개발팀이 사용하는 것을 목표로 한다.

## Chosen Alternative

**A. Plane 포크 (Django + Next.js 그대로 유지)**

- Rationale: Django 백엔드가 Python 스택과 일치, Jira 핵심 기능이 이미 구현됨,
  프론트엔드 전환 불필요(Next.js 유지), Docker + 셀프호스팅 지원으로 AWS 배포 용이
- Rejected: Taiga 포크(Angular 전환 비용 큼, 유지보수 불확실), 처음부터 구축(12주+ 소요)

## Tech Stack

- Backend: Django (Plane 기존)
- Frontend: Next.js (Plane 기존)
- Database: PostgreSQL (AWS RDS)
- Auth: MS365 OAuth (Azure AD)
- Infra: AWS (ECS + RDS + ALB + CloudWatch)
- AI: Claude API or OpenAI API
- CI/CD: GitHub Actions

## Fork Strategy

- `main` 브랜치: DirectCloud 커스터마이징 코드
- `upstream` 리모트: Plane 원본 레포지토리
- 업스트림 동기화: 월 1회 확인, 보안 패치는 즉시 cherry-pick
- 충돌 해결: DirectCloud 커스텀 코드 우선, 업스트림 기능은 선택적 수용
- 커스텀 코드는 가능한 별도 모듈/디렉토리에 격리하여 충돌 최소화

## Jira 전환 전략

- Phase 1~2: 기존 Jira와 병행 운영
- Phase 2 완료 후: 내부 팀 대상 2주간 병행 사용 테스트
- 전환 결정: 팀 투표 + 주요 워크플로우 커버리지 80% 이상
- 롤백 계획: 기존 Jira 인스턴스 유지 (최소 3개월)
- 데이터 마이그레이션: Phase 2에서 별도 계획 수립

---

## Spec

### What
Plane을 포크하여 DirectCloud 브랜딩 + MS365 인증 + AI 기능을 추가한 내부 프로젝트 관리 도구 구축

### Why
외부 Jira 의존도를 낮추고, DirectCloud 내부 워크플로우에 최적화된 프로젝트 관리 도구 확보.
AI 기능으로 이슈 관리 효율 향상.

### Success Criteria
- [ ] Plane 포크 + DirectCloud 브랜딩 적용
- [ ] MS365 OAuth 인증으로 내부 팀원 로그인 가능
- [ ] AWS에 Docker 기반 배포 완료 (내부 접근 가능)
- [ ] CI/CD 파이프라인으로 자동 빌드/배포 동작
- [ ] 모니터링/알람 설정 (CloudWatch)
- [ ] 칸반 보드에서 이슈 생성/수정/이동 가능
- [ ] AI 기능 1개 이상 동작 (이슈 자동 분류 or 일일 요약)
- [ ] 내부 개발팀이 실사용 전환 가능한 수준

### Error Scenarios
- MS365 OAuth 토큰 만료 시: 자동 갱신 + 실패 시 재로그인 안내
- AI 분류 실패 시: fallback으로 수동 분류 유지 (AI는 추천만)
- Plane 업스트림 업데이트 충돌: fork 전략으로 선택적 cherry-pick
- DB 마이그레이션 실패 시: 롤백 스크립트 준비, RDS 스냅샷에서 복원

### Edge Cases
- 사용자가 여러 프로젝트에 동시 소속
- 이슈 상태 전이 시 권한 체크
- AI 분류 시 한국어/영어 혼용 이슈 제목
- 대량 이슈 생성 시 AI API rate limit

### Security
- MS365 OAuth 2.0 PKCE 플로우
- API 인증은 JWT 토큰 기반
- AI API 호출 시 이슈 데이터 외부 전송 범위 최소화
- Phase 1 완료 후 보안 리뷰 실시 (인증 플로우, API 엔드포인트)

### Out of Scope
- 커스텀 워크플로우 편집기
- JQL 수준의 고급 검색
- 모바일 앱
- 외부 고객 제공 (내부 전용)
- 기존 Jira 데이터 자동 마이그레이션 (Phase 1에서는 수동)

### Dependencies
- Plane GitHub 레포지토리 (Apache 2.0, 저작권 고지 유지 필요)
- MS365 OAuth 앱 등록 (Azure AD, 테넌트 관리자 승인 필요 — 리드타임 주의)
- AWS 인프라 (ECS + RDS PostgreSQL + ALB + CloudWatch)
- AI API (Claude API or OpenAI API)

---

## Task Breakdown

### Phase 1: 포크 + 인증 + 배포 (4주)

#### Week 1: 포크 + 로컬 환경

```
Task 1: Plane 레포지토리 포크 및 버전 확정
- Goal: Plane 최신 stable 릴리즈를 포크하고 upstream 리모트 설정
- Files: .git/config, README.md
- Done when: 포크 완료, upstream 리모트 추가, 버전 태그 기록
- Deps: 없음

Task 2: 로컬 Docker Compose 환경 구축
- Goal: 로컬에서 Plane 전체 스택(Django + Next.js + PostgreSQL + Redis) 실행
- Files: docker-compose.yml, .env.example
- Done when: localhost에서 Plane UI 접근 + 이슈 생성 가능
- Deps: Task 1

Task 3: 로컬 환경 동작 검증
- Goal: Plane 기본 기능(가입, 프로젝트 생성, 이슈 CRUD) 동작 확인
- Files: 없음 (수동 검증)
- Done when: 기본 워크플로우 5가지 수동 테스트 통과
- Deps: Task 2

Task 4: DirectCloud 브랜딩 적용 (로고, 앱명, 파비콘, 컬러)
- Goal: Plane UI를 DirectCloud 브랜딩으로 교체
- Files: web/public/logo*, web/constants/common.ts, web/styles/
- Done when: 로고/앱명/파비콘이 DirectCloud로 표시됨
- Deps: Task 2

Task 5: 브랜딩 시각 확인
- Goal: 주요 화면(로그인, 대시보드, 보드, 이슈 상세)에서 브랜딩 확인
- Files: 없음 (시각 검증)
- Done when: 주요 4개 화면 스크린샷 확보 + Plane 원본 로고 잔존 없음
- Deps: Task 4
```

#### Week 2: MS365 인증 연동 (Azure AD 앱 등록은 Week 1에 병행 요청)

```
Task 6: Azure AD OAuth 앱 등록 요청
- Goal: Azure AD에 OAuth 앱 등록 + 클라이언트 ID/Secret 발급
- Files: .env (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
- Done when: 앱 등록 완료 + 인증 정보 .env에 기록
- Deps: 없음 (Week 1에 관리자에게 요청, 승인 대기)
- Risk: 테넌트 관리자 승인 리드타임 1~3일

Task 7: Plane 인증 구조 분석
- Goal: Plane의 기존 인증 플로우(회원가입/로그인/OAuth) 코드 분석
- Files: apiserver/plane/authentication/, apiserver/plane/settings/
- Done when: 인증 아키텍처 문서화 (어디를 수정해야 하는지 파악)
- Deps: Task 2

Task 8: Django 백엔드 MS365 OAuth 연동 구현
- Goal: django-allauth 또는 커스텀 OAuth로 MS365 로그인 추가
- Files: apiserver/plane/authentication/provider/, apiserver/plane/settings/oauth.py
- Done when: MS365 계정으로 로그인 시 사용자 생성/매칭 동작
- Deps: Task 6, Task 7

Task 9: Next.js 프론트엔드 MS365 로그인 버튼 추가
- Goal: 로그인 페이지에 "MS365로 로그인" 버튼 추가
- Files: web/components/auth/, web/services/auth.service.ts
- Done when: 버튼 클릭 → MS365 OAuth 플로우 → 로그인 완료
- Deps: Task 8

Task 10: MS365 인증 테스트
- Goal: 로그인/로그아웃/토큰 갱신/권한 없는 사용자 차단 테스트
- Files: apiserver/tests/auth/test_ms365_oauth.py
- Done when: 4개 시나리오 테스트 통과 (로그인, 로그아웃, 토큰 갱신, 미인가 차단)
- Deps: Task 8, Task 9

Task 11: DB 마이그레이션 전략 수립
- Goal: MS365 사용자 모델 확장에 필요한 마이그레이션 정리
- Files: apiserver/plane/db/migrations/
- Done when: 마이그레이션 파일 생성 + 적용 + 롤백 스크립트 확인
- Deps: Task 8
```

#### Week 3: AWS 인프라 + CI/CD

```
Task 12: AWS 네트워크 인프라 구성 (VPC, 서브넷, 보안 그룹)
- Goal: Plane 배포를 위한 네트워크 기반 구성
- Files: infra/vpc.tf (또는 CDK)
- Done when: VPC + public/private 서브넷 + 보안 그룹 생성
- Deps: 없음

Task 13: AWS RDS PostgreSQL 인스턴스 구성
- Goal: Plane 데이터베이스용 RDS 인스턴스 생성
- Files: infra/rds.tf
- Done when: RDS 인스턴스 생성 + 접속 확인 + 자동 백업 설정
- Deps: Task 12

Task 14: AWS ECS 클러스터 + ALB 구성
- Goal: Django + Next.js 컨테이너를 실행할 ECS 클러스터 + 로드밸런서
- Files: infra/ecs.tf, infra/alb.tf
- Done when: ECS 클러스터 + ALB + 타겟 그룹 생성
- Deps: Task 12

Task 15: ECR 레포지토리 생성 + Docker 이미지 빌드/푸시
- Goal: Django/Next.js Docker 이미지를 ECR에 등록
- Files: Dockerfile, infra/ecr.tf
- Done when: ECR에 이미지 존재 + pull 가능
- Deps: Task 14

Task 16: GitHub Actions CI/CD 파이프라인 구성
- Goal: main 브랜치 푸시 시 자동 빌드 → 테스트 → ECR 푸시 → ECS 배포
- Files: .github/workflows/ci.yml, .github/workflows/deploy.yml
- Done when: PR 머지 → 자동 배포까지 파이프라인 동작
- Deps: Task 15

Task 17: IAM 역할 + 시크릿 관리
- Goal: ECS 태스크 역할, GitHub Actions OIDC, 시크릿(DB 비밀번호, OAuth 키) 관리
- Files: infra/iam.tf, AWS Secrets Manager 또는 Parameter Store
- Done when: 시크릿이 코드에 하드코딩되지 않고 안전하게 주입됨
- Deps: Task 14
```

#### Week 4: 배포 + 모니터링 + 검증

```
Task 18: AWS 배포 + 내부 접근 확인
- Goal: ECS에 Plane 배포 + 내부 URL로 접근 가능
- Files: infra/, .env.production
- Done when: 내부 URL로 DirectCloud Jira 접근 + MS365 로그인 동작
- Deps: Task 13, Task 14, Task 15, Task 17

Task 19: CloudWatch 모니터링 + 알람 설정
- Goal: 로그 수집, CPU/메모리 알람, 헬스체크, 에러율 알람
- Files: infra/monitoring.tf
- Done when: CloudWatch 대시보드 + 알람 3개 이상 (헬스, CPU, 에러) 설정
- Deps: Task 18

Task 20: 배포 인수 테스트 (E2E)
- Goal: 배포된 환경에서 핵심 워크플로우 검증
- Files: tests/e2e/
- Done when: MS365 로그인 → 프로젝트 생성 → 이슈 생성 → 보드 이동 플로우 통과
- Deps: Task 18

Task 21: 보안 리뷰
- Goal: 인증 플로우, API 엔드포인트, 네트워크 보안 점검
- Files: 없음 (체크리스트 기반)
- Done when: OAuth PKCE 확인, HTTPS 강제, 불필요 엔드포인트 차단, CORS 설정 확인
- Deps: Task 18

Task 22: RDS 백업/복구 테스트
- Goal: RDS 스냅샷 생성 + 복원 테스트
- Files: 없음 (AWS 콘솔/CLI)
- Done when: 스냅샷에서 복원 → 데이터 정합성 확인
- Deps: Task 13
```

### Phase 2: 칸반 보드 커스터마이징 (4주)

```
Task 23: Plane 기능 매핑 + 비활성화 대상 목록 정의
- Goal: Plane 전체 기능 목록 작성 → 필요/불필요 분류 → 비활성화 대상 확정
- Files: docs/feature-mapping.md
- Done when: 기능 목록 + 활성/비활성 분류표 작성
- Deps: Task 20 (배포 완료 후)

Task 24: 불필요 기능 비활성화 (제거가 아닌 숨김/비활성화)
- Goal: 내부팀에 불필요한 기능을 메뉴에서 숨기고 라우팅 비활성화
- Files: web/components/sidebar/, web/app/
- Done when: 비활성화 대상 기능이 UI에서 접근 불가 + 기존 기능 정상 동작
- Deps: Task 23

Task 25: 비활성화 후 기능 검증
- Goal: 숨긴 기능으로 인한 사이드 이펙트 없는지 확인
- Files: tests/e2e/
- Done when: 핵심 워크플로우 E2E 테스트 통과
- Deps: Task 24

Task 26: 칸반 보드 기본 상태/라벨 구성
- Goal: DirectCloud 워크플로우에 맞는 기본 상태(To Do, In Progress, Review, QA, Done)와 라벨 구성
- Files: apiserver/plane/db/models/, web/components/issues/
- Done when: 프로젝트 생성 시 기본 상태/라벨이 DirectCloud 워크플로우에 맞게 설정됨
- Deps: Task 24

Task 27: 이슈 템플릿 구성 (버그/기능요청/개선)
- Goal: 이슈 생성 시 템플릿 선택 가능
- Files: apiserver/plane/db/models/issue.py, web/components/issues/create/
- Done when: 이슈 생성 시 3가지 템플릿 선택 + 자동 필드 채움
- Deps: Task 26

Task 28: 이슈 템플릿 테스트
- Goal: 템플릿 생성/수정/삭제 + 이슈 생성 시 적용 검증
- Files: apiserver/tests/issue/test_templates.py
- Done when: 템플릿 CRUD + 적용 테스트 통과
- Deps: Task 27

Task 29: 내부 팀 온보딩 + 2주 병행 사용
- Goal: 내부 팀 사용 시작, 기존 Jira와 병행 운영
- Files: docs/onboarding.md
- Done when: 팀원 전원 가입 + 2주간 사용 + 피드백 목록 정리
- Deps: Task 26

Task 30: 피드백 반영 + Phase 2 마무리
- Goal: 온보딩 피드백 중 우선순위 높은 것 반영
- Files: 피드백에 따라 결정
- Done when: 상위 3개 피드백 반영 완료
- Deps: Task 29
```

### Phase 3: AI 기능 추가 (6주)

```
Task 31: AI 서비스 모듈 설계
- Goal: AI 기능을 위한 백엔드 모듈 구조 + API 키 관리 + rate limit 처리 설계
- Files: apiserver/plane/ai/__init__.py, apiserver/plane/ai/client.py
- Done when: AI 모듈 구조 생성 + API 클라이언트 래퍼 + rate limit 핸들링
- Deps: Phase 2 완료

Task 32: AI DB 마이그레이션
- Goal: AI 분류 결과, 중복 탐지 결과, 요약 데이터를 저장할 테이블 추가
- Files: apiserver/plane/db/models/ai.py, apiserver/plane/db/migrations/
- Done when: 마이그레이션 적용 + 롤백 스크립트 확인
- Deps: Task 31

Task 33: 이슈 자동 분류 — 프롬프트 설계 + 평가 기준 수립
- Goal: 이슈 제목/설명 → 라벨 추천 프롬프트 설계 + 정확도 평가 기준
- Files: apiserver/plane/ai/prompts/classifier.py, tests/ai/fixtures/
- Done when: 한국어/영어 혼용 20개 샘플로 정확도 80% 이상
- Deps: Task 31

Task 34: 이슈 자동 분류 백엔드 구현
- Goal: 이슈 생성 시 AI 라벨 추천 API 엔드포인트
- Files: apiserver/plane/ai/classifier.py, apiserver/plane/api/views/ai.py
- Done when: POST /api/ai/classify → 라벨 추천 응답 반환
- Deps: Task 33

Task 35: 이슈 자동 분류 프론트엔드 연동
- Goal: 이슈 생성 화면에서 AI 라벨 추천 표시
- Files: web/components/issues/create/, web/services/ai.service.ts
- Done when: 이슈 생성 시 AI 라벨 추천이 태그로 표시 + 클릭으로 적용/무시
- Deps: Task 34

Task 36: 이슈 자동 분류 테스트
- Goal: 단위 테스트 + AI 실패 시 fallback 테스트
- Files: apiserver/tests/ai/test_classifier.py
- Done when: 정상 분류, API 실패 fallback, rate limit 처리 테스트 통과
- Deps: Task 34

Task 37: 중복 이슈 탐지 구현
- Goal: 새 이슈 생성 시 유사 기존 이슈를 임베딩 기반으로 탐지
- Files: apiserver/plane/ai/duplicate_detector.py, web/components/issues/create/
- Done when: 이슈 생성 시 "유사 이슈" 목록 표시 (유사도 70% 이상)
- Deps: Task 32

Task 38: 중복 이슈 탐지 테스트
- Goal: 유사 이슈 탐지 정확도 + 성능 테스트
- Files: apiserver/tests/ai/test_duplicate.py
- Done when: 10개 테스트 케이스 통과 + 응답 시간 3초 이내
- Deps: Task 37

Task 39: 일일 요약 기능 구현
- Goal: 매일 아침 프로젝트별 이슈 변경 요약 자동 생성
- Files: apiserver/plane/ai/summarizer.py, apiserver/plane/tasks/daily_summary.py
- Done when: Celery 스케줄러로 매일 09:00 요약 생성 + 대시보드에 표시
- Deps: Task 32

Task 40: 일일 요약 테스트
- Goal: 요약 생성 정확성 + 스케줄러 동작 검증
- Files: apiserver/tests/ai/test_summarizer.py
- Done when: 요약 생성 + 빈 프로젝트 처리 + 스케줄 동작 테스트 통과
- Deps: Task 39

Task 41: AI 기능 통합 테스트 + 보안 리뷰
- Goal: 분류/중복/요약 전체 플로우 E2E + AI API로 전송되는 데이터 범위 확인
- Files: tests/ai/test_integration.py
- Done when: E2E 통과 + 민감 데이터 미전송 확인
- Deps: Task 36, Task 38, Task 40
```

### Phase 4: 스프린트/백로그/리포트 확장 (상세 계획은 Phase 3 완료 후 수립)

```
Task 42: 스프린트 관리 커스터마이징
- Goal: Plane 기본 스프린트를 팀 프로세스에 맞게 조정
- Files: web/components/cycles/, apiserver/
- Done when: 스프린트 생성/관리/완료 플로우 동작

Task 43: 스프린트 관리 테스트
- Goal: 스프린트 CRUD + 이슈 할당/이동 테스트
- Files: apiserver/tests/cycle/
- Done when: 스프린트 워크플로우 테스트 통과

Task 44: 리포트/대시보드 구성
- Goal: 번다운 차트, 팀 워크로드, AI 분석 대시보드
- Files: web/components/analytics/
- Done when: 대시보드에서 주요 지표 확인 가능

Task 45: 리포트 데이터 정합성 테스트
- Goal: 대시보드 수치가 실제 데이터와 일치하는지 검증
- Files: apiserver/tests/analytics/
- Done when: 3개 이상 지표의 정합성 테스트 통과

(Phase 4 상세 태스크는 Phase 3 완료 시점에 사용 피드백 기반으로 재수립)
```

---

## Execution Status

Phase 1 (4주): Ready
Phase 2 (4주): Not started
Phase 3 (6주): Not started
Phase 4 (TBD): Not started — Phase 3 완료 후 상세 계획 수립
