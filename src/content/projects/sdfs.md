---
title: SDFs
tagline: DirectX 11과 HLSL로 Signed Distance Field를 카드 한 장씩 실험하고, coverflow로 넘겨 보며 실시간으로 수정하는 셰이더 학습 앱
order: 3
group: Computer Graphics
year: '2026'
role: Solo · 셰이더 · 앱 구조 · 툴
stack: [C++17, DirectX 11, HLSL SM 5.0, Dear ImGui, Win32, CMake]
accent: '#94a3b8'
cover:
  poster: /projects/sdfs/cover.webp
  video: /projects/sdfs/cover.mp4
  alt: 흑백 SDF 패턴 카드들이 coverflow로 늘어서 있고 가운데 카드가 정면을 향한 화면
overview: >-
  수식으로 도형과 무늬를 그리는 SDF의 원리를 직접 익혀 보고 싶었습니다.
  카드 한 장이 픽셀 셰이더 하나이며,
  2D 도형부터 노이즈 지형과 3D 레이마칭까지 13장의 카드로 실험했습니다.
highlights:
  - coverflow 카드 덱 — 가운데 카드가 편집 대상이고, 카드마다 시간이 따로 흐름
  - 셰이더 핫 리로드 — 저장하면 재컴파일, 실패하면 마지막 정상 셰이더를 유지하고 오류 창 표시
  - 카드별 런타임 파라미터(Param.xyzw, 이동·회전·크기, Fill/Stroke, 두 색)와 설정 저장
  - 공통 SDF 라이브러리(.hlsli) — 도형·연산자·변환·마스크·색·애니메이션 모듈
specs:
  - label: Cards
    value: 13장 (2D SDF 01~11 · 3D 레이마칭 12~13)
  - label: Render
    value: 카드마다 쿼드 한 장 + 카드별 픽셀 셰이더, coverflow 3D 배치
  - label: Controls
    value: ←/→ 카드 전환 · Space 일시정지 · ImGui 'SDFs Deck' 패널
video:
  youtube: Sd6XO_kqANc
  title: SDFs Deck 시연 영상
techniques:
  - title: Shape Library
    body: 원·박스·별·하트 등을 "경계까지의 거리" 함수로 정의
  - title: Operators
    body: min/max로 합치고 빼며, smooth min으로 경계를 부드럽게 합성
    formula: |-
      h = saturate(0.5 + 0.5·(b − a) / k)
      d = lerp(b, a, h) − k·h·(1 − h)
  - title: Domain Transform
    body: 좌표를 이동·회전·반복하고 접어 도형 하나로 패턴을 만듦
  - title: Noise
    body: value·gradient·simplex 노이즈, fBm, domain warp로 불규칙함 표현
  - title: Anti-aliasing
    body: fwidth로 픽셀 크기를 재 해상도와 무관하게 매끈한 경계를 만듦
    formula: aa = max(fwidth(d) · 1.5, 1e-4)
galleries:
  - title: The Deck
    kicker: 13 cards · coverflow
    cols: 7
    ratio: square
    caption: 카드 13장을 좌우로 넘겨 보며 비교하는 SDFs Deck입니다.
    items:
      - src: /projects/sdfs/card-01.webp
        label: 01 Repetition
        note: 반복한 세로 줄을 움직이는 두 사인 곡선 사이에 가둠
      - src: /projects/sdfs/card-02.webp
        label: 02 Dot Grid
        note: 움직이는 원의 거리장이 주변 점 격자를 밀고 당김
      - src: /projects/sdfs/card-03.webp
        label: 03 Polar Rings
        note: 원 둘레를 16칸으로 나누고 칸 번호 기반 파동이 돌아감
      - src: /projects/sdfs/card-04.webp
        label: 04 Tiling
        note: 6×6 원 격자의 행·열이 easing으로 차례로 밀림
      - src: /projects/sdfs/card-05.webp
        label: 05 Smooth Union
        note: 공전하는 두 원을 smooth min으로 합친 메타볼
      - src: /projects/sdfs/card-06.webp
        label: 06 Pivot & Rotation
        note: 이동·크기·회전과 pivot 기준 로컬 좌표
      - src: /projects/sdfs/card-07.webp
        label: 07 Random Tiles
        note: 10×10 칸마다 해시로 대각 삼각형을 무작위 뒤집기 (Truchet)
      - src: /projects/sdfs/card-08.webp
        label: 08 Glitch
        note: 행 단위 무작위 속도 스크롤과 RGB 색 번짐
      - src: /projects/sdfs/card-09.webp
        label: 09 Domain Warp
        note: Value / Gradient 노이즈 비교, 노이즈로 회전하는 선 패턴
      - src: /projects/sdfs/card-10.webp
        label: 10 Triangle Dissolve
        note: 겹친 삼각형 경계를 3D simplex 노이즈로 흩어 불씨처럼 사라짐
      - src: /projects/sdfs/card-11.webp
        label: 11 Topographic Map
        note: fBm 지형 — 등고선 지도 모드와 높이 → 법선 → 회전 태양 조명 모드
      - src: /projects/sdfs/card-12.webp
        label: 12 Volumetric Voronoi
        note: 구를 sphere tracing으로 찾고 내부 3D Voronoi 밀도를 누적
      - src: /projects/sdfs/card-13.webp
        label: 13 Raymarch 3D
        note: 직육면체로 배우는 회전 순서(XYZ/ZYX), 월드·로컬 축
  - title: Tools
    kicker: ImGui · Hot reload
    cols: 2
    items:
      - src: /projects/sdfs/ui-panel.webp
        label: SDFs Deck 패널
        note: Render · Cards(Param.x~w, Transform, Style) · Animation · Coverflow 튜닝
      - src: /projects/sdfs/card11-terrain.webp
        label: card 11 · 두 가지 모드
        note: 등고선 지도 모드와 높이 → 법선 → 회전 태양 조명 모드
motion:
  - title: card 05 · Smooth Union
    sprite: /projects/sdfs/motion-smoothmin.webp
    frames: 8
    body: 두 원을 smooth min으로 합쳐, 가까워질수록 경계가 녹듯이 하나로 이어집니다. 녹는 폭 k를 키우면 더 먼 거리에서부터 부드럽게 달라붙습니다.
    formula: |-
      h = saturate(0.5 + 0.5·(b − a) / k)
      d = lerp(b, a, h) − k·h·(1 − h)
  - title: card 12 · Volumetric Voronoi
    sprite: /projects/sdfs/motion-volume.webp
    frames: 8
    body: 레이마칭으로 광선이 구에 들어가고 나오는 지점을 찾고, 그 사이에 3D Voronoi 밀도(1 / F2³)를 쌓아 볼륨을 그립니다. 카메라는 5초마다 구 안을 맴도는 시점과 앞뒤로 드나드는 시점으로 바뀝니다.
  - title: card 02 · Dot Grid
    sprite: /projects/sdfs/motion-dotgrid.webp
    frames: 8
    body: 중심점이 sin·cos 궤적을 따라 움직이면, 5×9 격자 점들이 중심에 가까울수록 커집니다. 반경 0.75 안의 점은 선분 SDF로 중심과 이어집니다.
    formula: r = lerp(0.017, 0.038, 1 − smoothstep(0.10, 0.75, dist))
architecture:
  caption: 파일 저장에서 화면까지
  points:
    - FileWatcher — ReadDirectoryChangesW로 셰이더 폴더를 감시. .hlsl이 바뀌면 그 카드만, .hlsli가 바뀌면 모든 카드를 재컴파일
    - ShaderManager — 커스텀 ID3DInclude로 .hlsli 중첩 include 해석, 실패 시 이전 셰이더 유지 + 오류 창
    - ImGui → cbuffer — PerFrame / PerCard 상수 버퍼(Param.xyzw, Transform, Style, 카드 로컬 시간)
    - Coverflow — 위치·yaw·깊이를 near / far 구간별로 보간, 멀어지는 카드는 페이드 후 컬링
    - 'Renderer — 모든 카드가 quad.vs.hlsl과 공통 PSIn을 공유하고, 카드는 main(PSIn) : SV_Target만 작성'
problems:
  - title: 중첩 include 실패
    problem: .hlsli 라이브러리를 모듈로 나누자 기본 include 핸들러가 한 단계 안쪽 include를 찾지 못했습니다 (error X1507 — failed to open source file 'sdf_common.hlsli').
    approach: 여러 검색 경로를 순서대로 찾는 커스텀 ID3DInclude를 만들어 D3DCompile에 넘겼습니다.
    result: 라이브러리를 공통·도형·연산자·변환·마스크·색·애니메이션 모듈로 나눠도 카드 셰이더는 include만 하면 됩니다.
  - title: 카드 깜빡임과 링크 오류
    problem: 카드마다 픽셀 셰이더 입력 구조를 따로 선언해 VS/PS TEXCOORD 레지스터가 어긋났고, EXECUTION ERROR #343 (DEVICE_SHADER_LINKAGE_REGISTERINDEX)과 함께 카드가 깜빡였습니다.
    approach: 모든 카드가 공유하는 PSIn 구조체를 공통 헤더에 두고, 카드는 main(PSIn)만 작성하도록 규칙을 정했습니다.
    result: 링크 오류가 사라지고 새 카드를 추가할 때 입력 구조를 신경 쓸 필요가 없어졌습니다.
  - title: coverflow 겹침과 순간이동
    problem: 카드 위치를 선형으로 보간하자 ±1 카드가 가운데 카드와 겹치고, 덱 끝에서 처음으로 넘어갈 때 카드가 순간이동했습니다.
    approach: near / far 구간을 나눈 구간별 보간으로 바꾸고, 멀어지는 카드는 투명도로 페이드한 뒤 컬링했습니다. 카드 시간은 가운데 슬롯에 도착한 뒤부터 흐르게 했습니다.
    result: 좌우로 넘길 때 카드 간격이 일정하게 유지되고, 가운데 카드는 항상 처음부터 재생됩니다.
decisions:
  - choice: 카드 한 장 = 픽셀 셰이더 한 개
    why: 주제 하나를 독립된 셰이더로 격리해 실험과 비교가 쉽고, 카드 목록(card_files.txt)에 한 줄만 추가하면 덱에 들어갑니다.
  - choice: 파라미터 조작은 Dear ImGui
    why: 슬라이더·색 선택기를 바로 붙일 수 있어 셰이더 수식의 상수를 실시간으로 바꿔 보는 학습 흐름에 맞았습니다.
    tradeoff: 앱 전용 UI 디자인은 제한적입니다.
  - choice: 결정 기록(ADR)으로 설계 이유를 남김
    why: include 구조, 공통 입력 구조체, 카드 로컬 시간, coverflow 보간 등 10개의 결정을 문서로 남겨 다음 카드를 만들 때 기준으로 씁니다.
links:
  - label: GitHub — sdf-playground
    href: https://github.com/ryuhajin/sdf-playground
  - label: YouTube — 시연 영상
    href: https://youtu.be/Sd6XO_kqANc
  - label: Notes — Procedural Shapes, Patterns
    href: /notes/unreal-engine-5/material/procedural-shapes-patterns/
---
