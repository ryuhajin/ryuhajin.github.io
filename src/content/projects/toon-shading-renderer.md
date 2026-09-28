---
# SAMPLE — placeholder content. Replace text + media with the real project.
title: Toon Shading Renderer
tagline: DirectX 11 기반 셀 셰이딩 렌더러 — 밴드 라이팅, 림 라이트, 스크린 스페이스 아웃라인
order: 1
sample: true
year: '2025'
role: Solo · Graphics programming
stack: [C++, DirectX 11, HLSL, RenderDoc]
accent: '#ffb454'
cover:
  poster: /projects/toon-shading-renderer/cover.svg
  alt: 밴드 라이팅이 적용된 두 개의 구체가 광원 이동에 따라 음영이 바뀌는 화면
overview: >-
  RasterTek 튜토리얼 기반의 DX11 포워드 렌더러 위에 NPR(Non-Photorealistic Rendering) 파이프라인을 올린 프로젝트.
  라이팅 계산을 단계화한 밴드 셰이딩, 뷰 방향 기반 림 라이트, 노멀/깊이 기반 아웃라인 패스를 구현했다.
highlights:
  - 램프 텍스처 없이 smoothstep 기반 밴드 경계 제어
  - 노멀 + 깊이 불연속 검출 아웃라인 (1 pass)
  - 셰이더 파라미터 실시간 튜닝 UI
architecture:
  caption: 프레임 단위 렌더 패스 구성
  points:
    - Geometry Pass — 월드/뷰/투영 변환, 노멀·깊이 G-Buffer 기록
    - Lighting Pass — N·L 양자화, 스페큘러 하이라이트 단계화, 림 라이트
    - Outline Pass — Sobel 필터로 깊이/노멀 엣지 검출
    - Composite — 톤 조정 후 백버퍼 출력
problems:
  - title: 밴드 경계의 계단 현상
    problem: floor() 로 N·L 을 양자화하면 경계가 앨리어싱되어 지글거림
    approach: fwidth() 로 픽셀 단위 변화량을 구해 smoothstep 폭을 적응적으로 조절
    result: 해상도와 무관하게 1~2px 의 부드러운 경계 유지
  - title: 아웃라인 두께 불균일
    problem: 거리가 멀어질수록 깊이 차이가 커져 먼 물체 외곽선이 과도하게 두꺼워짐
    approach: 선형 깊이로 변환 후 거리 기반으로 임계값 스케일링
    result: 근거리/원거리 외곽선 두께 편차 감소
  - title: 파라미터 튜닝 반복 비용
    problem: 값 하나 바꿀 때마다 재컴파일·재실행 필요
    approach: 상수 버퍼를 런타임 UI 와 바인딩하고 셰이더 핫리로드 추가
    result: 튜닝 사이클 수 초 단위로 단축
decisions:
  - choice: 램프 텍스처 대신 수식 기반 밴드
    why: 밴드 수와 경계 폭을 파라미터로 즉시 바꿀 수 있고 텍스처 샘플이 필요 없음
    tradeoff: 아티스트가 색 그라디언트를 직접 그리는 자유도는 낮아짐
  - choice: 포스트 프로세스 아웃라인 (inverted hull 대신)
    why: 메시 수정 없이 모든 오브젝트에 일괄 적용, 드로우콜 증가 없음
    tradeoff: 내부 실루엣 표현이 약하고 해상도 의존적
links:
  - label: Notes — Toon Shader
    href: /notes/computer-graphics/hlsl/toonshader/
---
