---
title: Water Shader
tagline: 엔진이나 머티리얼 그래프 없이 DirectX 11 + raw HLSL로 작성한 스타일라이즈드 수면 셰이더 — 모든 파라미터를 ImGui로 실시간 조절
order: 2
group: Computer Graphics
status: Quality pass in progress
year: '2026'
role: Solo · 셰이더 · 셰이더 벤치 툴
stack: [C++20, DirectX 11, HLSL SM 5.0, Dear ImGui, DirectXTK, CMake, vcpkg]
accent: '#14b8a6'
cover:
  poster: /projects/water-shader/cover.webp
  alt: 청록색 수면에 잔물결과 파도 마루가 겹겹이 이어지고 멀리 해가 지는 장면
overview: >-
  물 표면의 움직임, 반사, 색 변화, 노멀 흐름을 ImGui로 실시간 조절할 수 있는 스타일라이즈드 수면 셰이더입니다.
  셰이더 코드와 파라미터 조절로 물의 시각 요소를 단계적으로 쌓아 올리는 것을 목표로 했고,
  2차 작업에서는 '색칠된 천'처럼 보이던 수면을 태양 반사광이 반짝이고 하늘을 비추는 '물'로 읽히도록 다듬고 있습니다.
highlights:
  - Gerstner 파도 4개로 마루는 뾰족하고 골은 넓은 수면 실루엣
  - 서로 다른 방향·속도로 스크롤하는 2-layer 노멀맵과 Fresnel 기반 큐브맵 반사
  - HDR 태양 글린트와 하이라이트 롤오프로 반짝이는 수면
  - Basic · Sunset · Tropical 프리셋과 Debug View, 셰이더 저장 시 약 0.2초 안에 핫 리로드
specs:
  - label: Waves
    value: Gerstner 4개 (파장 1.6 / 1.05 / 0.62 / 0.41, 방향 ±40°)
  - label: Surface
    value: 1024² ocean grid, 지수 매핑으로 반경 400까지 (가까울수록 촘촘)
  - label: Shading
    value: Lambert + Blinn-Phong + Fresnel(F0 0.05) 큐브맵 반사 + HDR 태양 글린트
  - label: Tools
    value: ImGui Shader Bench, 프리셋 저장/적용, Debug View 6종, 고정 카메라 캡처
video:
  youtube: q1OxTRRmUzg
  title: Water Shader 시연 영상 (1차 버전)
  poster: /projects/water-shader/v1-sunset.webp
techniques:
  - title: Gerstner Wave
    sub: 정점 변위
    body: 1차 버전의 sine wave 2개는 높이만 움직여 '텐트' 모양이 됐습니다. 정점을 수평으로도 모아 주는 Gerstner 파도 4개로 바꿔 마루는 뾰족하고 골은 넓게 만들었습니다.
    formula: |-
      θ = k(D·xz) − ωt
      P.xz += Q·A·D·cos θ ;  P.y += A·sin θ
      Qᵢ = steepnessᵢ / (kᵢ·Aᵢ·N)
  - title: 2-layer Normal Map
    sub: 잔물결
    body: 노멀맵 하나를 서로 다른 방향·속도로 두 번 스크롤해 whiteout blend로 합치고, 두 번째 레이어를 3배 스케일로 올려 잔물결이 겹쳐 흐르는 표면을 만들었습니다.
    formula: N = normalize((n₁.xy + n₂.xy)·strength, n₁.z·n₂.z)
  - title: Fresnel Reflection
    sub: 하늘 비추기
    body: 시야각이 낮을수록 큐브맵 반사가 강해집니다. 수평선 아래를 향한 반사 벡터는 위로 접어, 초원 대신 하늘을 비추게 했습니다.
    formula: |-
      F = F0 + (1 − F0)·(1 − N·V)^p,  F0 = 0.05, p = 5  (Schlick)
      envDir = (R.x, |R.y|, R.z)
  - title: HDR Sun Glint
    sub: 반짝임
    body: 반사 벡터와 태양 방향이 겹치는 곳에 강한 글린트를 더하고, 0.8을 넘는 하이라이트만 지수 곡선으로 눌렀습니다. 하늘은 LDR이라 물에만 ACES를 걸면 반사가 실제 하늘보다 어두워지기 때문입니다.
    formula: glint = pow(saturate(R·L), glintPower) · glintIntensity · F
  - title: Ocean Grid
    sub: 거리 LOD
    body: 1024² 격자를 지수 함수로 펼쳐 가까운 곳은 촘촘하게, 먼 곳은 성기게 만들고, 파장의 8~14배 거리에서 파도를 서서히 줄여 중거리 모아레를 없앴습니다.
    formula: |-
      x = sign(t)·R·(e^{g|t|} − 1) / (e^g − 1),  R = 400, g = 6
      waveFade = 1 − smoothstep(8λ, 14λ, dist)
galleries:
  - title: Presets
    kicker: Basic · Sunset · Tropical
    cols: 3
    caption: 프리셋 하나에 물 색, Fresnel, 노멀 세기, 파도, 태양 방향과 글린트 값이 함께 저장됩니다. (Basic 맑은 호수 · Sunset 어두운 보라 · Tropical 터쿼이즈)
    items:
      - src: /projects/water-shader/preset-basic.webp
        label: Basic
        note: 태양 고도 20°
      - src: /projects/water-shader/preset-sunset.webp
        label: Sunset
        note: 태양 고도 5°
      - src: /projects/water-shader/preset-tropical.webp
        label: Tropical
        note: 태양 고도 32°
  - title: Debug View
    kicker: Shader Bench · ImGui
    cols: 5
    caption: Debug Mode 드롭다운으로 노멀맵 샘플, 월드 노멀, UV, 라이팅 항을 바로 확인하며 셰이더 단계를 검증했습니다 (Tropical 프리셋).
    items:
      - src: /projects/water-shader/debug-0.webp
        label: 0 Render
      - src: /projects/water-shader/debug-1.webp
        label: 1 Sampled Normal Map
      - src: /projects/water-shader/debug-2.webp
        label: 2 World-space Normal
      - src: /projects/water-shader/debug-3.webp
        label: 3 UV
      - src: /projects/water-shader/debug-5.webp
        label: 5 Lighting terms
        note: R Lambert · G Blinn-Phong · B Fresnel
  - title: 1차 버전
    kicker: 2026-05 · sine wave
    cols: 3
    caption: 1차 버전(2026-04 ~ 05)은 sine wave 2개, 노멀맵 1장 재사용, 스타일라이즈드 반사율 0.5로 만들었습니다. 현재 품질 개선 작업의 Before입니다.
    items:
      - src: /projects/water-shader/v1-basic.webp
        label: Basic
        note: Skybox On
      - src: /projects/water-shader/v1-sunset.webp
        label: Sunset
        note: Skybox On
      - src: /projects/water-shader/v1-tropical.webp
        label: Tropical
        note: Skybox On
compare:
  title: '색칠된 천 → 물'
  kicker: Quality pass · step by step
  slider: true
  caption: 같은 카메라(sunward, t = 12 s 고정)로 단계마다 캡처했습니다. 아래 단계를 고르면 왼쪽에 겹쳐지고, 가운데 핸들을 끌어 최종 결과와 비교할 수 있습니다.
  steps:
    - src: /projects/water-shader/step-0.webp
      label: Before
      note: 1차 버전. 노멀이 한쪽으로 기울어 표면이 천처럼 보임
    - src: /projects/water-shader/step-1.webp
      label: 버그 수정
      note: 노멀맵 sRGB 디코딩 버그와 태양 방향 버그 수정
    - src: /projects/water-shader/step-2.webp
      label: 태양 글린트
      note: HDR 글린트와 하이라이트 롤오프
    - src: /projects/water-shader/step-3.webp
      label: 잔물결
      note: whiteout blend, 레이어 B 3배 스케일, 수평선 아래 반사 접기
    - src: /projects/water-shader/step-4.webp
      label: 물 몸체 색
      note: F0 0.5 → 0.05, 몸체 색을 산란광 색으로 밝게, 은박지 같은 스페큘러 약화
    - src: /projects/water-shader/step-5.webp
      label: Gerstner
      note: 파도 4개, 마루는 뾰족하고 골은 넓게
    - src: /projects/water-shader/step-6.webp
      label: 현재 (Ocean grid)
      note: 1024² 지수 격자와 거리 LOD
problems:
  - title: 노멀맵이 한쪽으로 기울어 있었다
    problem: 수면이 전체적으로 한 방향을 향해 '색칠된 천'처럼 보였습니다. DDS 노멀맵의 평균 RGB가 (128,128,255)가 아니라 (55,57,246)이었고, 월드 노멀이 (−0.37, 0.88, −0.53)으로 기울어 있었습니다.
    approach: 128을 sRGB → linear로 바꾸면 정확히 55가 된다는 점에서 데이터 텍스처가 색 공간 변환을 거쳤다고 판단했고, texconv --ignore-srgb로 노멀맵을 다시 만들었습니다.
    result: 노멀이 평면 기준으로 돌아왔습니다. 노멀맵·마스크 같은 데이터 텍스처는 색 공간 변환을 거치면 안 된다는 규칙을 문서로 남겼습니다.
  - title: 태양이 수면 아래에 있었다
    problem: 음수 pitch를 쓰는 프리셋에서 광원 방향이 뒤집혀, 태양이 수면 아래에서 비추고 있었습니다.
    approach: 광원을 Sun Yaw / Sun Elevation으로 다시 정의하고, 스카이박스의 태양 위치(yaw ≈ 34.5°, 고도 ≈ 4°)에 맞추는 Match Skybox Sun 버튼을 만들었습니다. R Lambert / G Blinn-Phong / B Fresnel을 보여 주는 Debug Mode 5도 추가했습니다.
    result: 스카이박스 해와 글린트 위치가 일치하고, 라이팅 항을 채널별로 바로 검증할 수 있게 됐습니다.
  - title: 중거리 모아레
    problem: 처음 만든 512² 격자와 10λ~18λ 페이드에서는 중거리 파도에 모아레 무늬가 생겼습니다.
    approach: 파장당 정점이 5개 이상 되도록 격자 밀도와 페이드 구간을 다시 계산해 1024², 8λ~14λ로 바꿨습니다.
    result: 먼 수면까지 무늬 없이 파도가 이어집니다. cbuffer 레이아웃은 32바이트를 유지하고 static_assert로 C++ 쪽 크기를 고정했습니다.
limitations:
  - 평면 기준 tangent frame이라 파도가 크게 휘면 노멀맵 방향이 어긋남 → 파동 도함수로 TBN 재구성 예정
  - 다음 후보 — 마루의 fake SSS, Jacobian 기반 거품(foam), 거리별 노멀 감쇠와 두 번째 노멀맵, sRGB 스왑체인 + 선형 라이팅
  - 진행 중(bench-tools) — 마우스 회전, 카메라 프리셋, 프리셋별 큐브맵, CPU/GPU 타이머 오버레이
links:
  - label: GitHub — WaterShader
    href: https://github.com/ryuhajin/WaterShader
  - label: YouTube — 1차 버전 시연 영상
    href: https://www.youtube.com/watch?v=q1OxTRRmUzg
---
