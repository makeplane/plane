# Team Rules

## AI Team
- LLM 모델 실험 코드는 `experiments/` 디렉토리에 격리.
- 프롬프트 변경은 버전 태그 필수 (`v1`, `v2`, ...).
- Vector DB 스키마 변경은 CTO 리뷰 필수.

## AI Team Workflow
- 모델 실험 코드의 테스트 기준은 팀장이 결정.
- Vector DB 스키마 변경 시 별도 리뷰 프로세스.
- 배포: develop 머지 시 자동.

- **NEVER** change Vector DB schema without CTO review.
- **NEVER** deploy model changes without benchmark comparison.
