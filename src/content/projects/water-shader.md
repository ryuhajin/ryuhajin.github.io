---
title: Water Shader
tagline: DirectX 11 · HLSL로 만든 물 셰이더 — Gerstner 파도와 두 겹의 노멀맵, HDR 하늘 반사로 잔잔한 호수부터 노을 지는 바다까지 실시간으로 그립니다
order: 2
group: Computer Graphics
year: '2026'
role: Solo · 셰이더 · 셰이더 벤치 툴
stack: [C++20, DirectX 11, HLSL SM 5.0, Dear ImGui, DirectXTK, CMake, vcpkg]
accent: '#14b8a6'
cover:
  poster: /projects/water-shader/cover.webp
  alt: Basic · Calm lake — 낮은 시점에서 본 호수. 잔물결 위로 하늘과 갈대가 고스란히 비친다
overview: >-
  "물을 표현하기 위해선 어떤 기능이 필요할까?"에서 출발한 프로젝트입니다.
  그동안 당연하게 보던 물의 모습을 하나하나 뜯어보게 되었습니다.
  Gerstner 파도와 두 겹의 노멀맵으로 물결을 만들고 실제 하늘(HDR)을 비춰,
  화창한 한낮부터 노을 지는 저녁까지 서로 다른 분위기의 수면을 실시간으로 그립니다.
highlights:
  - 바람 방향, 세기 등 여러 파라미터로 파도 4개의 형상을 조절합니다.
  - 가까운 파도는 수면을 직접 움직이고, 먼 물결은 거칠기로 바꿔 햇빛 반사를 넓힙니다.
  - 두 겹의 잔물결 텍스처가 흐르며, 그 방향을 바람 방향에 맞출 수 있습니다.
  - HDR 하늘을 큐브맵으로 반사하고, 그 하늘에서 추출한 태양의 방향·색·세기를 조명에 적용할 수 있습니다.
  - 카메라, 라이트, 워터 디버그 패널에서 값을 조절하고, 마음에 드는 설정은 프리셋으로 저장합니다.
specs:
  - label: Waves
    value: Gerstner 파도 4개를 1024² 그리드(약 105만 정점)에 적용, 멀수록 작은 파도는 줄임
  - label: Normal
    value: 잔물결 노멀맵 5종 중 2장을 골라 섞어 사용
  - label: Lighting
    value: 보는 각도에 따라 반사가 달라지는 Fresnel, 하늘 반사, 에너지 보존 태양 글린트
  - label: HDR
    value: RGBA16F 리니어 렌더로 밝은 빛까지 담고 노출·톤 매핑으로 마무리
  - label: Performance
    value: 오션 그리드 GPU 약 0.2 ms (Release, 1280×720)
video:
  youtube: hAdJnM9oWXo
  title: Water Shader 시연 영상
techniques:
  - title: Gerstner Wave
    sub: 물의 모양
    body: 바다의 물은 위아래로만 움직이지 않고 작은 원을 그립니다. 정점을 수평으로도 모아 주는 Gerstner 파도 4개를 겹쳐 마루는 뾰족하고 골은 넓게 만들었고, 바람 방향·퍼짐·크기·높이·거칠기 값으로 4개를 한 번에 생성합니다.
    formula: |-
      θ = k(D·xz) − ωt
      P.xz += Q·A·D·cos θ ;  P.y += A·sin θ
      Qᵢ = steepnessᵢ / (kᵢ·Aᵢ·N)
  - title: Far Waves → Roughness
    sub: 수평선까지
    body: 멀어서 메시로 표현할 수 없는 파도는 픽셀 단위의 기울기로, 그보다 작아지면 표면 거칠기(넓은 햇빛 반짝임)로 이어 그립니다. 그래서 수평선까지 바람 방향이 유지됩니다.
  - title: 2-layer Normal Map
    sub: 물의 질감
    body: 노멀맵 5종 중 두 장을 서로 다른 크기와 방향으로 흘려 겹칩니다. 한 장만 쓸 때 보이는 반복 무늬가 줄고, 흐르는 방향을 바람 방향에 맞출 수 있습니다.
    formula: N = normalize((n₁.xy + n₂.xy)·strength, n₁.z·n₂.z)
  - title: Fresnel Reflection
    sub: 물의 색과 반사
    body: 물은 내려다보면 속이 비치고, 수평에 가깝게 볼수록 하늘을 비춥니다. Fresnel로 보는 각도에 따라 물 색과 하늘 반사의 비율이 바뀌고, 프리셋마다 기본 반사율(F0)과 지수를 다르게 둡니다.
    formula: |-
      F = F0 + (1 − F0)·(1 − N·V)^p   (Schlick)
      envDir = (R.x, |R.y|, R.z)
  - title: HDR Sky Lighting
    sub: 빛
    body: 조명 값을 임의로 정하지 않고 HDR 하늘에서 해의 방향·색·밝기와 주변광을 읽어 옵니다. 하늘을 바꾸면 물에 닿는 빛도 함께 바뀌고, RGBA16F 리니어 버퍼에 그린 뒤 노출과 톤 매핑으로 마무리합니다.
  - title: Sun Glint
    sub: 햇빛 반짝임
    body: 반사 방향과 태양 방향이 겹치는 곳에 에너지가 보존되는 글린트를 더합니다. 먼 바다의 잔물결은 거칠기로 넘어가 반짝임이 넓게 퍼지도록 했습니다.
presets:
  title: Water Presets
  kicker: 3 Theme Presets · Wind Waves
  items:
    - title: Basic
      sub: 잔잔한 호수
      images:
        - src: /projects/water-shader/preset-basic-hero.webp
          label: Ocean hero
        - src: /projects/water-shader/preset-basic-surface.webp
          label: Ocean surface
        - src: /projects/water-shader/preset-basic-top.webp
          label: 벤치 평면
      swatches:
        colors: ['#2e6680', '#0d263d']
        label: 물 색  위에서 볼 때 → 낮은 각도에서 볼 때
      specs:
        - label: Sky
          value: HDR Field day · 태양 고도 43.5° · 노출 −0.4 EV
        - label: Waves
          value: 바람 −105° · 퍼짐 25° · 파도 크기 3.6 · 높이 0.05 · 거칠기 0.30
        - label: Ripples
          value: Long streaks + Soft swell · 세기 0.45 · 바람 정렬
        - label: Water
          value: 반사 0.70 · 기본 반사율(F0) 0.04 · Fresnel 지수 5.0
      body: 길고 낮은 파도가 바람을 따라 천천히 흐르는 호수입니다. 긴 줄무늬 잔물결을 바람 방향으로 흘려 물의 흐름이 보이게 했습니다.
    - title: Sunset
      sub: 바람 부는 노을 바다
      images:
        - src: /projects/water-shader/preset-sunset-hero.webp
          label: Ocean hero
        - src: /projects/water-shader/preset-sunset-surface.webp
          label: Ocean surface
        - src: /projects/water-shader/preset-sunset-top.webp
          label: 벤치 평면
      swatches:
        colors: ['#c496ff', '#613890']
        label: 물 색  위에서 볼 때 → 낮은 각도에서 볼 때
      specs:
        - label: Sky
          value: HDR Sunset sea · 태양 고도 26° · 노출 −1.43 EV
        - label: Waves
          value: 바람 −125° · 퍼짐 38° · 파도 크기 4.1 · 높이 0.089 · 거칠기 0.77
        - label: Ripples
          value: Diagonal ripples + Fine chop · 세기 0.18
        - label: Water
          value: 반사 0.29 · 기본 반사율(F0) 0.15 · Fresnel 지수 3.4
      body: 높고 거친 파도 위로 지는 해가 긴 빛의 길을 만듭니다. 반사를 줄이고 각도에 따른 반사 변화를 완만하게 해, 노을빛이 물 색에 스며들게 했습니다.
    - title: Tropical
      sub: 에메랄드빛 바다
      images:
        - src: /projects/water-shader/preset-tropical-hero.webp
          label: Ocean hero
        - src: /projects/water-shader/preset-tropical-surface.webp
          label: Ocean surface
        - src: /projects/water-shader/preset-tropical-top.webp
          label: 벤치 평면
      swatches:
        colors: ['#29d1a3', '#00bdbd']
        label: 물 색  위에서 볼 때 → 낮은 각도에서 볼 때
      specs:
        - label: Sky
          value: HDR Beach day · 태양 고도 36.9° · 노출 −0.78 EV
        - label: Waves
          value: 바람 −80° · 퍼짐 43° · 파도 크기 3.42 · 높이 0.064 · 거칠기 0.85
        - label: Ripples
          value: Soft chop + Fine chop · 세기 0.70
        - label: Water
          value: 반사 0.80 · 기본 반사율(F0) 0.02 · Fresnel 지수 5.0
      body: 위에서 보면 밝은 에메랄드빛, 낮은 각도에서는 청록빛으로 보이는 얕은 바다입니다. 작고 선명한 햇빛 반사로 강한 한낮 햇살을 표현했습니다.
galleries:
  - title: Before / After
    kicker: Water Breakdown
    cols: 2
    items:
      - src: /projects/water-shader/before.webp
        label: BEFORE  2026-05 · Tropical
        note: 사인파 2개로 만든 단조로운 수면
      - src: /projects/water-shader/after.webp
        label: AFTER  2026-10 · Tropical
        note: 파도와 햇빛 반사가 살아난 수면
  - title: Debug View
    kicker: View 패널
    cols: 6
    caption: View 패널의 Debug View에서 노멀, UV, 조명, LOD를 나눠 볼 수 있습니다.
    items:
      - src: /projects/water-shader/dbg-0.webp
        label: 1  Normal
      - src: /projects/water-shader/dbg-1.webp
        label: 2  World N
      - src: /projects/water-shader/dbg-2.webp
        label: 3  UV
      - src: /projects/water-shader/dbg-3.webp
        label: 4  Lighting
      - src: /projects/water-shader/dbg-4.webp
        label: 5  LOD
      - src: /projects/water-shader/dbg-5.webp
        label: 6  Final
breakdown:
  title: 품질 개선과 문제 해결
  kicker: Breakdown
  columns:
    - title: 품질 개선 과정
      items:
        - 사인파 2개였던 파도를 마루가 뾰족한 Gerstner 파도 4개로 바꿨습니다.
        - 잔물결 2겹과 태양 글린트를 더해 수면에 햇빛 반사가 살아나게 했습니다.
        - 리니어·HDR 렌더링과 톤 매핑으로 밝은 빛이 날아가지 않게 했습니다.
        - LOD를 추가하여 먼 물결도 깨지지 않고 수평선까지 이어지게 했습니다.
        - 자연스러운 먼 바다를 표현할 수 있도록 원경 detail 설정을 추가했습니다.
    - title: 문제 해결 과정
      items:
        - DDS 변환 때 감마가 적용돼 기울어진 노멀맵 방향을 바로잡았습니다.
        - 노멀맵의 회전·흐름 계산 순서를 바꿔 바람 방향에 맞게 흐르게 했습니다.
        - 물결 뒷면에 땅이 비치던 반사를 위로 뒤집어 하늘로 근사했습니다.
        - 대기 원근에 생기던 줄무늬를 샘플 높이를 올려 없앴습니다.
problems:
  - title: 한쪽으로 기운 노멀맵
    problem: 물 표면 전체가 한쪽으로 기울어 보이고, 해를 수면 아래에 둬야 반사가 보였습니다. 노멀맵의 평균 RGB가 평평한 값 (128,128,255)가 아니라 (55,57,246)이었습니다.
    approach: 128을 sRGB → linear로 바꾸면 정확히 55가 된다는 점에서, DDS로 변환할 때 사진용 감마 보정이 데이터 텍스처에 적용됐다고 판단했습니다. 색 변환 없이(--ignore-srgb) 다시 변환했습니다.
    result: 노멀이 평면 기준으로 돌아왔고, 노멀맵·마스크 같은 데이터 텍스처는 색 공간 변환을 거치지 않는다는 규칙을 문서로 남겼습니다.
  - title: 바람과 다른 쪽으로 흐르는 잔물결
    problem: 바람 정렬을 켠 잔물결이 흐름 방향 표시와 다른 쪽으로 흘렀습니다(Sunset에서 49° 어긋남).
    approach: 텍스처를 회전한 뒤에 흐름 이동을 더해, 흐름까지 정렬 각도만큼 돌아가 있었습니다. 이동을 회전 전에 더하도록 순서를 바꿨습니다.
    result: 두 시점의 무늬 이동을 측정해 흐름이 표시와 1° 이내로 맞는 것을 확인했습니다.
  - title: 물결 뒷면에 비친 땅
    problem: 물결 뒷면처럼 반사 방향이 수평선 아래로 꺾이는 곳에 하늘 대신 땅이 비쳤습니다.
    approach: 수평선 아래를 향한 반사 방향을 위로 접어(y 성분의 절댓값) 하늘을 비추게 했습니다.
    result: 물결 뒷면에도 하늘색이 이어져 수면이 얼룩지지 않습니다.
  - title: 수평선 연무의 줄무늬
    problem: 수평선 연무가 화면 세로 방향으로 방사형 줄무늬를 만들었습니다. 수평선 바로 위의 하늘을 샘플해 언덕과 나무를 화면 열마다 집어 왔기 때문입니다.
    approach: 샘플 높이를 올려, 조금 위(앙각 약 10°)의 흐린 하늘색을 쓰도록 바꿨습니다.
    result: 줄무늬 없이 먼 바다가 하늘에 부드럽게 녹아듭니다.
limitations:
  - Foam mask — 파도 마루의 흰 거품
  - Waterfall — 폭포 리본 메시와 가장자리 거품
  - Ripple SDF — 시간에 따라 퍼지는 원형 물결
  - UE5 포팅
links:
  - label: GitHub — WaterShader
    href: https://github.com/ryuhajin/WaterShader
  - label: YouTube — 시연 영상
    href: https://youtu.be/hAdJnM9oWXo
---
