---
# SAMPLE — placeholder content. Replace text + media with the real project.
title: Dynamic Sky System
tagline: UE5 시간대 기반 하늘 · 대기 · 구름 시스템 — 하나의 파라미터로 하루를 제어
order: 2
sample: true
year: '2025'
role: Solo · Technical art / Blueprint
stack: [Unreal Engine 5, Blueprint, Material Graph, Sky Atmosphere]
accent: '#7cc4ff'
cover:
  poster: /projects/dynamic-sky-system/cover.svg
  alt: 하늘 색이 낮에서 노을, 밤으로 바뀌며 태양이 호를 그리며 이동하는 화면
overview: >-
  Directional Light, Sky Atmosphere, Volumetric Cloud, Sky Light 를 하나의 TimeOfDay 값으로 묶어 제어하는 UE5 하늘 시스템.
  커브 에셋으로 시간대별 색·강도를 정의하고, 별/달 머티리얼과 연동해 낮과 밤 전환을 자연스럽게 만들었다.
highlights:
  - TimeOfDay 단일 파라미터로 모든 하늘 요소 동기화
  - Curve Asset 기반 시간대별 색/강도 프리셋
  - 밤하늘 별 · 달 머티리얼과 Sky Light 리캡처 최적화
architecture:
  caption: TimeOfDay 가 각 컴포넌트로 흘러가는 구조
  points:
    - BP_DynamicSky — TimeOfDay 값 소유, Tick 또는 에디터에서 갱신
    - Sun/Moon Rotation — 위도·시간으로 Directional Light 회전 계산
    - Curve Sampling — 광원 색, 강도, 안개 밀도를 커브에서 샘플
    - Sky Light — 변화량이 임계값을 넘을 때만 Recapture
problems:
  - title: Sky Light 리캡처 비용
    problem: 매 프레임 Recapture 시 GPU 스파이크 발생
    approach: 시간 변화량 누적이 임계값을 넘을 때만 리캡처하도록 스로틀링
    result: 프레임 스파이크 제거, 시각적 차이 거의 없음
  - title: 해질녘 색 전환이 부자연스러움
    problem: 선형 보간으로 노을 구간이 너무 짧게 지나감
    approach: 태양 고도 기반 커브로 재매핑하고 노을 구간 키 추가
    result: 골든아워 구간이 길고 부드럽게 표현
decisions:
  - choice: Blueprint 중심 구현
    why: 아티스트/레벨 디자이너가 에디터에서 바로 수정 가능
    tradeoff: 복잡한 계산은 C++ 대비 성능·가독성 불리
  - choice: 시간대 데이터를 Curve Asset 으로 분리
    why: 로직 수정 없이 룩(look) 변경, 프리셋 교체 용이
links:
  - label: Notes — Dynamic Sky
    href: /notes/unreal-engine-5/dynamic-sky/
---
