---
# SAMPLE — placeholder content. Replace text + media with the real project.
title: Editor Tooling Suite
tagline: UE5 에디터 확장 — 에셋 감사(Audit) 툴과 커스텀 Slate 패널
order: 3
sample: true
year: '2026'
role: Solo · Tools programming
stack: [C++, Unreal Engine 5, Slate, Asset Registry]
accent: '#a882ff'
cover:
  poster: /projects/editor-tooling-suite/cover.svg
  alt: 에셋 목록과 노드 그래프가 있는 커스텀 에디터 패널에서 선택 행이 이동하는 화면
overview: >-
  프로젝트 에셋의 폴리곤 수, 텍스처 해상도, 머티리얼 인스턴스 사용 여부를 검사해 리포트를 만드는 에디터 툴.
  Asset Registry 로 에셋을 수집하고, SListView 기반 Slate 패널에서 필터/정렬/CSV 내보내기를 제공한다.
highlights:
  - Asset Registry 비동기 쿼리로 에디터 멈춤 없이 수집
  - SListView 가상화로 수천 행 목록도 부드럽게 스크롤
  - FExtender 로 콘텐츠 브라우저 컨텍스트 메뉴에 진입점 추가
architecture:
  caption: 모듈 구성과 데이터 흐름
  points:
    - Editor Module — 탭 스포너 등록, 메뉴 확장(FExtender)
    - Collector — Asset Registry 쿼리, 규칙별 Validator 실행
    - Report Model — FAuditReport 로 결과 병합·정렬
    - Slate View — SListView 행 위젯, 필터/검색, CSV Export
problems:
  - title: 대량 에셋 로딩 시 에디터 프리즈
    problem: 모든 에셋을 동기 로드하며 검사해 수십 초간 멈춤
    approach: 메타데이터(Asset Registry 태그)만으로 판단 가능한 규칙을 먼저 처리하고 나머지는 청크 단위 비동기 처리
    result: UI 응답성 유지, 체감 대기 시간 대폭 감소
  - title: 목록 갱신 시 선택 상태 유실
    problem: RequestListRefresh 후 선택/스크롤 위치가 초기화
    approach: 행 식별자를 안정적인 키로 두고 RebuildList 대신 부분 갱신
    result: 필터 변경 후에도 선택 유지
decisions:
  - choice: Editor Utility Widget 대신 C++ Slate
    why: 가상화 리스트, 커스텀 행 위젯 등 세밀한 제어와 성능
    tradeoff: 개발 속도가 느리고 비개발자가 수정하기 어려움
  - choice: 검사 규칙을 Validator 인터페이스로 분리
    why: 규칙 추가 시 기존 코드 수정 없이 확장
links:
  - label: Notes — Custom Editor Tools
    href: /notes/unreal-engine-5/create-custom-editor-tools/
---
