# DirectCloud Jira — Product Requirements Document

**Version**: 1.0
**Date**: 2026-04-05
**Status**: Active
**Owner**: DirectCloud AI Team

---

## 1. Overview

DirectCloud Jira는 Plane(오픈소스 프로젝트 관리 도구)을 포크하여 DirectCloud 내부 개발팀 전용으로 커스터마이징한 프로젝트 관리 도구이다.

## 2. Problem Statement

- 외부 SaaS(Jira) 의존으로 인한 비용 및 데이터 통제 문제
- DirectCloud 내부 워크플로우에 맞지 않는 범용 기능 과잉
- MS365 기반 사내 인증 체계와의 통합 부재
- AI 기반 이슈 관리 자동화 부재

## 3. Target Users

| 사용자 | 역할 |
|--------|------|
| 내부 개발자 | 이슈 생성, 칸반 보드 관리, 스프린트 참여 |
| 팀 리드 | 프로젝트 관리, 리포트 확인, 워크로드 분배 |
| CTO/관리자 | 인스턴스 관리, 모니터링, 보안 설정 |

**대상 규모**: 내부 개발팀 (외부 고객 제공 범위 아님)

## 4. Goals & Success Criteria

### 4.1 Goals

1. Jira 대체 가능한 프로젝트 관리 도구 확보
2. MS365 SSO로 사내 인증 통합
3. AI 기능으로 이슈 관리 효율 향상
4. 자체 인프라에서 데이터 통제

### 4.2 Success Criteria

- [ ] MS365 OAuth 인증으로 내부 팀원 로그인 가능
- [ ] AWS에 Docker 기반 배포 완료 (내부 접근 가능)
- [ ] CI/CD 파이프라인으로 자동 빌드/배포 동작
- [ ] 모니터링/알람 설정 (CloudWatch)
- [ ] 칸반 보드에서 이슈 생성/수정/이동 가능
- [ ] AI 기능 1개 이상 동작 (이슈 자동 분류 or 일일 요약)
- [ ] 내부 팀 2주 병행 사용 후 전환 결정

## 5. Functional Requirements

### 5.1 Phase 1 — 포크 + 인증 + 배포 (4주)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | Plane v1.2.3 포크 + DirectCloud 브랜딩 적용 | P0 |
| FR-02 | MS365 OAuth 인증 (Azure AD) — 로그인/로그아웃/토큰 갱신 | P0 |
| FR-03 | web, space, admin 앱 모두 MS365 로그인 지원 | P0 |
| FR-04 | AWS 배포 (ECS + RDS + ALB) | P0 |
| FR-05 | GitHub Actions CI/CD 파이프라인 | P0 |
| FR-06 | CloudWatch 모니터링 + 알람 | P1 |

### 5.2 Phase 2 — 칸반 보드 커스터마이징 (4주)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-07 | 불필요 기능 비활성화 (숨김 처리) | P1 |
| FR-08 | DirectCloud 워크플로우 기본 상태 구성 (To Do → In Progress → Review → QA → Done) | P1 |
| FR-09 | 이슈 템플릿 (버그/기능요청/개선) | P1 |
| FR-10 | 내부 팀 온보딩 + 2주 병행 사용 | P1 |

### 5.3 Phase 3 — AI 기능 추가 (6주)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-11 | AI 이슈 자동 분류 (라벨 추천) | P1 |
| FR-12 | 중복 이슈 탐지 (임베딩 기반 유사도) | P2 |
| FR-13 | 일일 프로젝트 요약 자동 생성 | P2 |
| FR-14 | AI 실패 시 수동 fallback 유지 | P0 |

### 5.4 Phase 4 — 스프린트/리포트 확장 (TBD)

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-15 | 스프린트 관리 커스터마이징 | P2 |
| FR-16 | 번다운 차트 + 팀 워크로드 대시보드 | P2 |

## 6. Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 인증 | MS365 OAuth 2.0, JWT 토큰 기반 API 인증 |
| NFR-02 | 보안 | HTTPS 강제, CORS 설정, 시크릿 외부 주입 (AWS Secrets Manager) |
| NFR-03 | 가용성 | ECS 멀티 태스크 + ALB 헬스체크 |
| NFR-04 | 백업 | RDS 자동 백업 + 스냅샷 복원 테스트 |
| NFR-05 | 모니터링 | CloudWatch 로그 + CPU/메모리/에러율 알람 |
| NFR-06 | AI 응답 시간 | 이슈 분류 3초 이내, 중복 탐지 3초 이내 |
| NFR-07 | 테스트 커버리지 | 80% 이상 |

## 7. Tech Stack

| 계층 | 기술 |
|------|------|
| Backend | Django (Plane 기존) |
| Frontend | Next.js (Plane 기존) |
| Database | PostgreSQL (AWS RDS) |
| Auth | MS365 OAuth (Azure AD) |
| Infra | AWS ECS + RDS + ALB + CloudWatch |
| AI | Claude API or OpenAI API |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |

## 8. Out of Scope

- 커스텀 워크플로우 편집기
- JQL 수준의 고급 검색
- 모바일 앱
- 외부 고객 제공 (내부 전용)
- 기존 Jira 데이터 자동 마이그레이션 (Phase 1에서는 수동)

## 9. Risks & Mitigations

| 리스크 | 대응 |
|--------|------|
| Plane 업스트림 breaking change | 월 1회 확인, 보안 패치만 즉시 cherry-pick, 커스텀 코드 모듈 격리 |
| Azure AD 승인 리드타임 | Week 1에 사전 요청 |
| AI API rate limit | 큐 기반 처리 + fallback to 수동 |
| DB 마이그레이션 실패 | 롤백 스크립트 + RDS 스냅샷 복원 |

## 10. Jira 전환 전략

1. Phase 1~2: 기존 Jira와 병행 운영
2. Phase 2 완료 후: 내부 팀 2주간 병행 사용 테스트
3. 전환 결정: 팀 투표 + 주요 워크플로우 커버리지 80% 이상
4. 롤백 계획: 기존 Jira 인스턴스 최소 3개월 유지

## 11. Timeline

| Phase | 기간 | 내용 | 상태 |
|-------|------|------|------|
| Phase 1 | 4주 | 포크 + 인증 + 배포 | Week 2 완료 |
| Phase 2 | 4주 | 칸반 커스터마이징 | 미시작 |
| Phase 3 | 6주 | AI 기능 | 미시작 |
| Phase 4 | TBD | 스프린트/리포트 | Phase 3 이후 계획 |
