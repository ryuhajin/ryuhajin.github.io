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
  하늘을 올려다봤을 때 느껴지는 구름의 부피감과 빛을 화면에 담아보고 싶었습니다.
  레이마칭으로 구름 속 밀도와 빛의 산란을 계산해, 카메라에서 최대 50 km 떨어진 곳까지 이어지는 구름층을 그립니다.
  누구나 쉽게 모양과 분위기를 바꿔 볼 수 있도록 UI와 프리셋도 함께 만들었습니다.
highlights:
  - Weather Map으로 구름의 위치와 양을 정하고, 4가지 구름 타입을 골라 쓸 수 있습니다.
  - 3D 노이즈와 높이별 프로파일로 뭉게구름부터 얇은 층운까지 표현합니다.
  - 태양 방향에 따른 그림자로 구름의 실루엣이 살아납니다.
  - 물리 기반 대기와 톤 매핑으로 노을, 한낮 같은 하늘 분위기를 연출합니다.
  - F1~F4 패널에서 구름과 방향광을 조절하고, 마음에 드는 설정은 프리셋으로 저장합니다.
specs:
  - label: Resolution
    value: 1920×1080 전체 픽셀을 레이마칭, 60 fps
  - label: Noise
    value: 3D Worley 노이즈로 형태(128³)·침식(64³)·근경 디테일(64³)을 나눠 표현
  - label: Weather
    value: 구름이 어디에, 얼마나, 어떤 모양으로 생길지 256² 맵으로 결정 (64 km 반복)
  - label: Shadow
    value: 태양에서 본 구름 밀도를 512² 캐시에 미리 저장해 그림자 계산을 가볍게
  - label: Performance
    value: 구름 패스 p95 4.56 ms · 12개 장면 모두 10 ms 이하 (RTX 4080 SUPER, 1080p)
video:
  youtube: 3h6GUrbkmDY
  title: Volumetric Cloud 시연 영상
techniques:
  - title: Beer-Lambert 적분
    sub: 레이마칭
    body: 풀스크린 삼각형 하나를 그리고, 픽셀마다 구름층 두 평면과의 교차 구간을 100 m 간격(최대 512 step)으로 따라가며 밀도를 누적합니다. 충분히 불투명해지면(T ≤ 0.01) 일찍 끝냅니다.
    formula: |-
      Δτ = density · extinction · len
      T_step = exp(−Δτ)
      contrib = T · (1 − T_step);  T *= T_step
  - title: Physical Atmosphere LUT
    sub: 하늘 색 미리 계산
    body: 태양 높이에 따라 하늘색과 멀리 있는 구름의 뿌연 느낌이 자연스럽게 바뀌도록, 대기 산란을 미리 계산한 6개의 LUT(조회용 텍스처)를 만들었습니다.
  - title: Deep Shadow Cache
    sub: 그림자 미리 저장
    body: 태양 쪽에서 본 구름의 두께를 512² 텍스처에 미리 저장해 두고, 그림자가 필요할 때 바로 꺼내 씁니다. 캐시 범위 밖의 구름은 여러 방향 샘플로 보완합니다.
    formula: T_sun = exp(−opticalDepth)   // Near 24 km · Far 128 km
  - title: Dual-lobe HG Phase · Rim
    sub: 역광과 테두리 빛
    body: 빛이 구름을 지나며 앞으로 퍼지는 성질과 뒤로 튕기는 성질을 함께 섞어, 역광에서는 가장자리가 밝게 빛나고 순광에서는 부드러운 명암이 생깁니다.
  - title: Multiple Scattering · Ambient
    sub: 구름 속 빛
    body: 구름 안에서 빛이 여러 번 튕기는 효과와 하늘·지면에서 들어오는 빛을 더해, 구름 안쪽이 검게 뭉개지지 않고 은은하게 밝아집니다.
  - title: HDR Tone Mapping
    sub: 최종 색감
    body: 밝기 차이가 큰 HDR 화면을 노출 → 화이트밸런스 → ACES 순서로 다듬어, 모니터에서도 자연스러운 색으로 보여 줍니다.
galleries:
  - title: Cloud Types
    kicker: 4 Cloud Types · JSON Presets
    cols: 4
    caption: >-
      위: 지평선 시점(F6) · 아래: 구름층 위 시점(F8) · 조명 3 Bright noon 고정. 수치는 각 타입 JSON 프리셋 값이며,
      구름 두께는 Weather Map 값에 따라 범위 안에서 위치마다 달라집니다.
    items:
      - src: /projects/volumetric-cloud/type-stratus-f6.webp
        label: Stratus
        note: 시작 고도 3.6 km · 구름 두께 850 m · Coverage 0.59 · Density 2.2
      - src: /projects/volumetric-cloud/type-cumulus-f6.webp
        label: Cumulus
        note: 시작 고도 1.8 km · 구름 두께 2,000–3,200 m · Coverage 0.62 · Density 2.63
      - src: /projects/volumetric-cloud/type-altocumulus-f6.webp
        label: Altocumulus
        note: 시작 고도 3.1 km · 구름 두께 250–1,150 m · Coverage 0.43 · Density 2.37
      - src: /projects/volumetric-cloud/type-custom-f6.webp
        label: Custom
        note: 시작 고도 1.5 km · 구름 두께 1,500–2,300 m · Coverage 0.59 · Density 2.83
      - src: /projects/volumetric-cloud/type-stratus-f8.webp
        note: 바닥이 평평하고 얇게 넓게 퍼지는, 한 장의 담요처럼 평평하게 깔리는 구름입니다.
      - src: /projects/volumetric-cloud/type-cumulus-f8.webp
        note: 위로 갈수록 좁아지는 형태와 넉넉한 두께감의 구름으로, 명암이 가장 뚜렷하게 드러납니다.
      - src: /projects/volumetric-cloud/type-altocumulus-f8.webp
        note: 뭉게구름보다 한층 높은 곳에서, 작은 구름 조각들이 양떼처럼 모여 있는 모습을 표현합니다.
      - src: /projects/volumetric-cloud/type-custom-f8.webp
        note: 원하는 모양으로 직접 조절하고 저장해 두는 나만의 구름 슬롯입니다.
  - title: Lighting & Atmosphere
    kicker: Atmosphere LUT · Phase · Shadow
    cols: 4
    caption: 같은 구름, 같은 시점에서 조명 프리셋만 바꿔 본 결과입니다. 프리셋 하나에 태양의 방향과 색, 대기, 노출, 지면색까지 함께 저장됩니다.
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
    kicker: Breakdown & Tools
    cols: 6
    caption: 숫자키 0~9로 Weather, 밀도, 노이즈, 조명 등을 분해하여 확인할 수 있습니다. F1 패널로 구름을 바로 조절하고, Performance 창에서 패스별 시간을 실시간으로 확인합니다.
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
  - title: Scenes & Tools
    kicker: Output
    cols: 3
    items:
      - src: /projects/volumetric-cloud/cover.webp
        label: Cumulus · 조명 4 Lavender dream
        note: 지상 시점 (F6)
      - src: /projects/volumetric-cloud/sunset.webp
        label: Cumulus · 조명 2 Beach sunset
        note: 건물 앞 지상 시점 (F5)
      - src: /projects/volumetric-cloud/ui-f1.webp
        label: F1 Cloud Formation 패널
        note: 구름 타입·밀도·프로파일을 실시간으로 조절
compare:
  title: 품질 개선 과정
  kicker: Before → After
  caption: >-
    같은 건물 앞 시점에서 날짜별로 캡처했습니다. 그림자는 base 노이즈로만 계산하고 중간 크기 무늬를 1.5배 강조해 명암 대비를 살렸고,
    대기 원근 거리를 2배로 늘리고 Detail 노이즈를 64³로 올려 멀어질수록 구름이 하늘에 자연스럽게 녹아들게 했습니다.
  steps:
    - src: /projects/volumetric-cloud/progress-0904.webp
      label: 09-04
      note: 초기 결과 (CPU Weather Map). 구름이 납작하고 명암이 흐림
    - src: /projects/volumetric-cloud/progress-0908.webp
      label: 09-08
      note: Weather Map 생성을 GPU로 옮긴 뒤(09-05)의 Urban 장면
    - src: /projects/volumetric-cloud/progress-0914.webp
      label: 09-14
      note: 품질 개선 라운드를 시작하기 전 기준 화면
    - src: /projects/volumetric-cloud/progress-now.webp
      label: 현재
      note: detail 64³, 대기 원근 거리 2배, 근경 micro detail, 샘플 지터(09-25)까지 적용한 구름 · 조명 1
problems:
  - title: 동심원 모양 줄무늬
    problem: 영상 촬영 중 얇은 Stratus(850 m)를 위에서 볼 때(F7·F8) 카메라 중심의 동심원 banding이 보였습니다. 모든 픽셀이 같은 거리(구간 중앙)에서 샘플링해 급한 밀도 경계에서 에일리어싱이 생긴 것이 원인이었습니다.
    approach: 픽셀마다 Interleaved Gradient Noise로 샘플 위치를 구간 안에서 흩었습니다. TAA가 없어서 프레임마다 바뀌는 시간 지터 대신 화면 공간 고정 지터를 썼습니다.
    result: 동심원이 사라지고 성능은 그대로(p95 4.56 ms). 오차를 없앤 것이 아니라 고르게 흩은 것이라 노이즈 형태로 남습니다.
  - title: 레이마칭 비용
    problem: 기준(Reference) 레이마칭은 Cumulus 지평선 시점에서 구름 패스가 18.68 ms(p95)까지 올라갔습니다.
    approach: 구름 지지 영역 사전 검사, 빈 공간 탐색(연속 빈 표본이면 2배 간격), 조기 종료, 거리별 step, 고정 golden-angle Light cone을 넣고, Reference와 결과를 SSIM·RMSE로 자동 비교했습니다. 400 m까지 건너뛰는 4배 탐색은 등고선 alias가 생겨 탈락시켰습니다.
    result: 같은 장면이 8.64 ms로 약 53.8% 빨라졌고, 이후 12개 장면 모두 10 ms 예산 안에 들어왔습니다.
  - title: 그림자 비용
    problem: 픽셀마다 태양 방향으로 그림자 광선을 다시 쏘면 구름 패스가 p95 11.29 ms였습니다.
    approach: 태양에서 본 광학 깊이를 512² Deep Shadow Cache(Near 24 km · Far 128 km)에 미리 굽고 샘플링만 하도록 바꿨습니다. 캐시 밖은 cone 8 taps로 보완합니다.
    result: 11.29 ms → 6.91 ms. 해가 5° 이하로 낮을 때의 줄무늬는 캐시 간격 보정과 3~5° 구간 블렌딩으로 해결했습니다.
decisions:
  - choice: Full-resolution High 단일 경로
    why: 저해상도 렌더 + 업샘플링(Stage 10)과 Temporal reprojection(Stage 11)을 구현해 High와 나란히 비교했지만, 번짐과 잔상 대비 이득이 작았습니다.
    tradeoff: 실험 경로를 걷어 내 코드가 단순해진 대신, 더 무거운 장면에서는 최적화 여지가 줄어듭니다.
  - choice: 무거운 데이터는 Compute Shader로 미리 생성
    why: Weather Map, 노이즈 볼륨, 대기 LUT, 그림자 캐시를 값이 바뀔 때만 다시 만들어 매 프레임 비용에서 빼냈습니다.
  - choice: 핵심 수식은 CPU 테스트로 검증
    why: 셰이더 수식과 같은 CPU 기준 구현(Stage*Math.h)을 두고, 12개 장면 카메라를 자동 측정해 품질·성능 회귀를 잡았습니다.
links:
  - label: GitHub — VolumetricCloud
    href: https://github.com/ryuhajin/VolumetricCloud
  - label: YouTube — 시연 영상
    href: https://youtu.be/3h6GUrbkmDY
  - label: Notes — Volumetric clouds
    href: /notes/unreal-engine-5/dynamic-sky/clouds/2-volumetric-clouds/
---
