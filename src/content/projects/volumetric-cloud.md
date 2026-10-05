---
title: Volumetric Cloud
tagline: DirectX 11 · HLSL 레이마칭으로 최대 50 km까지 이어지는 볼류메트릭 구름층을 그리고, 물리 기반 대기·HDR 조명과 합성하는 실시간 렌더러
order: 1
group: Computer Graphics
year: '2026'
role: Solo · 렌더링 파이프라인 · 셰이더 · 툴
stack: [C++17, DirectX 11, HLSL SM 5.0, Compute Shader, Dear ImGui, CMake]
accent: '#8b7cf6'
cover:
  poster: /projects/volumetric-cloud/cover.webp
  video: /projects/volumetric-cloud/cover.mp4
  alt: 라벤더빛 노을 조명 아래 지평선 위로 뭉게구름이 겹겹이 떠 있는 장면
overview: >-
  하늘을 올려다볼 때 느껴지는 구름의 부피감과 빛을 화면에 담았습니다.
  레이마칭으로 최대 50 km까지 이어지는 구름층을 실시간으로 그립니다.
beats:
  - title: 4가지 구름 타입
    body: Weather Map과 JSON 프리셋으로 모양과 양을 바꿉니다.
  - title: 물리 기반 하늘
    body: 해의 높이에 따라 노을부터 한낮까지 하늘색이 따라 바뀝니다.
  - title: 직접 만지는 툴
    body: F1~F4 패널, 디버그 뷰, 프리셋 저장.
facts: [1920×1080 · 60 fps, 구름 패스 평균 4.6 ms, 최대 50 km, DirectX 11 · HLSL]
video:
  youtube: 3h6GUrbkmDY
  title: Volumetric Cloud 시연 영상
techniques:
  - title: Beer-Lambert 적분
    body: 100 m 간격으로 밀도를 쌓고, 충분히 불투명해지면 멈춥니다.
  - title: Atmosphere LUT
    body: 대기 산란을 6장의 LUT로 미리 계산해, 해의 높이에 따라 하늘색이 바뀝니다.
  - title: Deep Shadow Cache
    body: 태양 쪽 구름 두께를 512² 텍스처에 구워 두고 바로 꺼내 씁니다.
  - title: Dual-lobe Phase
    body: 역광에서는 가장자리가 빛나고, 순광에서는 부드러운 명암이 생깁니다.
  - title: Multiple Scattering
    body: 여러 번 튕긴 빛을 더해 구름 속이 검게 뭉개지지 않습니다.
  - title: HDR Tone Mapping
    body: 노출 → 화이트밸런스 → ACES 순서로 마무리합니다.
galleries:
  - title: Cloud Types
    cols: 2
    caption: 같은 조명(3 · Bright noon) 아래에서 네 가지 구름 타입을 지평선 시점으로 담았습니다. 수치는 각 타입의 JSON 프리셋 값입니다.
    items:
      - src: /projects/volumetric-cloud/type-stratus-f6.webp
        label: Stratus
        note: 시작 고도 3.6 km · 두께 850 m — 한 장의 담요처럼 얇고 넓게 깔리는 구름
      - src: /projects/volumetric-cloud/type-cumulus-f6.webp
        label: Cumulus
        note: 시작 고도 1.8 km · 두께 2,000–3,200 m — 명암이 가장 뚜렷한 뭉게구름
      - src: /projects/volumetric-cloud/type-altocumulus-f6.webp
        label: Altocumulus
        note: 시작 고도 3.1 km · 두께 250–1,150 m — 양떼처럼 모인 작은 구름 조각
      - src: /projects/volumetric-cloud/type-custom-f6.webp
        label: Custom
        note: 시작 고도 1.5 km · 두께 1,500–2,300 m — 직접 조절해 저장하는 구름 슬롯
  - title: Lighting & Atmosphere
    with: techniques
    caption: 같은 구름, 같은 시점. 조명 프리셋 하나에 태양의 방향과 색, 대기, 노출이 함께 바뀝니다.
    items:
      - src: /projects/volumetric-cloud/light-1.webp
        label: 1 · Autumn morning
        note: 태양 고도 12° · 노출 0.35 EV
      - src: /projects/volumetric-cloud/light-2.webp
        label: 2 · Beach sunset
        note: 태양 고도 11.5° · 노출 0.60 EV
      - src: /projects/volumetric-cloud/light-3.webp
        label: 3 · Bright noon
        note: 태양 고도 17.4° · 노출 1.23 EV
      - src: /projects/volumetric-cloud/light-4.webp
        label: 4 · Lavender dream
        note: 태양 고도 10.9° · 노출 1.30 EV
  - title: Debug View
    with: compare
    caption: 숫자키로 한 겹씩
    items:
      - src: /projects/volumetric-cloud/dbg-weather.webp
        label: ① Weather Coverage
      - src: /projects/volumetric-cloud/dbg-base.webp
        label: ② Base Density
      - src: /projects/volumetric-cloud/dbg-detail.webp
        label: ③ Detail Noise
      - src: /projects/volumetric-cloud/dbg-final.webp
        label: ④ Final Density
      - src: /projects/volumetric-cloud/dbg-direct.webp
        label: ⑤ Direct Light
      - src: /projects/volumetric-cloud/dbg-composite.webp
        label: ⑥ Composite
compare:
  title: Before → After
  notes:
    - 그림자 대비를 살려 구름 덩어리를 입체적으로
    - 대기 원근 거리 2배 — 멀수록 하늘에 녹아드는 구름
    - 빈 공간은 건너뛰고, 불투명해지면 일찍 종료
    - 레이마칭 18.68 → 8.64 ms, 그림자 11.29 → 6.91 ms (p95)
  steps:
    - src: /projects/volumetric-cloud/progress-0904.webp
      label: BEFORE 09-04
      note: 초기 결과 · 구름이 납작하고 명암이 흐림
    - src: /projects/volumetric-cloud/progress-0908.webp
      label: 09-08
      note: Weather Map 생성을 GPU로 옮긴 뒤의 Urban 장면
    - src: /projects/volumetric-cloud/progress-0914.webp
      label: 09-14
      note: 품질 개선 라운드를 시작하기 전
    - src: /projects/volumetric-cloud/progress-now.webp
      label: AFTER 현재
      note: 입체감과 명암 대비가 살아난 구름
problems:
  - title: 레이마칭 비용
    metric: 18.68 → 8.64 ms
    problem: 지평선을 보는 Cumulus 장면에서 구름 패스가 18.68 ms(p95)까지 올라갔습니다.
    approach: 빈 공간 건너뛰기, 조기 종료, 거리별 step을 넣고 기준 결과와 SSIM으로 자동 비교했습니다.
    result: 같은 장면 약 54% 단축, 12개 장면 모두 10 ms 안.
  - title: 그림자 비용
    metric: 11.29 → 6.91 ms
    problem: 픽셀마다 태양 쪽으로 그림자 광선을 다시 쏘는 비용이 컸습니다.
    approach: 태양에서 본 구름 두께를 512² 캐시에 미리 굽고, 샘플링만 하도록 바꿨습니다.
    result: 낮은 해에서 생긴 줄무늬는 3~5° 구간 블렌딩으로 정리.
  - title: 동심원 줄무늬
    metric: +0 ms
    problem: 얇은 Stratus를 위에서 내려다보면 카메라를 중심으로 동심원이 보였습니다.
    approach: 픽셀마다 Interleaved Gradient Noise로 샘플 위치를 조금씩 흩었습니다.
    result: 동심원은 사라지고 성능은 그대로.
decisions:
  - choice: Full-resolution 단일 경로
    why: 저해상도 + 업샘플링, Temporal reprojection도 만들어 비교했지만 번짐과 잔상에 비해 이득이 작았습니다.
  - choice: 무거운 데이터는 Compute로 미리
    why: Weather Map, 노이즈, 대기 LUT, 그림자 캐시는 값이 바뀔 때만 다시 만듭니다.
  - choice: 수식은 CPU 테스트로 검증
    why: 셰이더와 같은 CPU 구현으로 12개 장면의 품질·성능 회귀를 잡습니다.
links:
  - label: GitHub — VolumetricCloud
    href: https://github.com/ryuhajin/VolumetricCloud
  - label: YouTube — 시연 영상
    href: https://youtu.be/3h6GUrbkmDY
  - label: Notes — Volumetric clouds
    href: /notes/unreal-engine-5/dynamic-sky/clouds/2-volumetric-clouds/
---
