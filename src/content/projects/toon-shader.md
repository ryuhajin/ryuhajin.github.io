---
title: Toon Shader
tagline: 3D 모델에 애니메이션처럼 손으로 그린 듯한 외곽선과 단계적인 명암을 입히는 DirectX 11 / HLSL 툰 셰이더
order: 4
group: Computer Graphics
year: '2025'
role: Solo · HLSL 학습 프로젝트
stack: [C++, DirectX 11, HLSL, Dear ImGui, Win32]
accent: '#fb923c'
cover:
  poster: /projects/toon-shader/cover.webp
  video: /projects/toon-shader/cover.mp4
  alt: 회색 배경 위에 어두운 외곽선과 밝은 살구색, 주황색 두 단계 명암으로 칠해진 구
overview: >-
  애니메이션처럼 손으로 그린 듯한 외곽선과 단계적인 명암을 3D 모델에 입혀 보고 싶었습니다.
  외곽선 패스와 셀 셰이딩 패스를 나눠 구현하고, ImGui 패널과 실험 프리셋으로 색과 밴드 값을 바꿔 가며 비교했습니다.
highlights:
  - Inverted Hull 외곽선 — 메시를 법선 방향으로 키워 뒷면만 단색으로 그리기
  - N·L 3단계 셀 셰이딩과 주황 → 보라로 보간되는 색감 있는 그림자
  - Blinn-Phong 하이라이트와 선택형 림 라이트
specs:
  - label: Output
    value: 800×600 원본 렌더 · 구 모델(정점 14,700)
  - label: Passes
    value: 2 — Outline(Front-face Culling) → Cel(Back-face Culling)
architecture:
  caption: 한 프레임, 두 번의 드로우
  points:
    - Outline Pass — 부풀린 모델을 앞면 컬링으로 그려, 뒷면만 단색으로 남깁니다. (정점을 뷰 공간 법선 방향으로 0.03만큼 밀고, 0.18 회색으로 칠함)
    - Cel Pass — 뒷면 컬링으로 되돌려 원본 모델을 셀 셰이딩으로 덮어 그립니다.
techniques:
  - title: Inverted Hull Outline
    body: 모델을 법선 방향으로 살짝 부풀려 한 번 더 그리되, 앞면을 컬링해 뒷면만 남기면 원래 모델 바깥으로 테두리가 드러납니다.
    formula: posView += Nview · 0.03   (Front-face Culling)
  - title: Cel Shading
    body: 빛을 받는 정도(N·L)를 두 경계값으로 끊어 밝은 면·중간·그림자 3단계로 칠하고, 그림자는 주황에서 보라로 이어지는 색으로 채워 색감을 살렸습니다.
    formula: N·L > 0.5 → Lit · 0.3~0.5 → Warm · < 0.3 → lerp(Warm, Purple)
  - title: Specular Highlight
    body: 빛과 시선의 중간 방향(하프 벡터)을 쓰는 Blinn-Phong으로 작고 또렷한 하이라이트를 더해 광택을 표현했습니다.
    formula: spec = saturate(N·H)^350
  - title: Rim Light (옵션)
    body: 시선과 거의 수직인 가장자리일수록 밝아지는 값을 써서, 윤곽을 따라 얇은 빛 띠를 더합니다.
    formula: rim = (1 − N·V)^5   (1 − N·V > 0.7)
galleries:
  - title: Step by step
    kicker: Breakdown
    cols: 5
    ratio: square
    caption: 단계를 하나씩 켜 가며 렌더링해, 각 기법이 더하는 효과를 나눠 보여 줍니다.
    items:
      - src: /projects/toon-shader/step-1.webp
        label: ① Outline Pass
      - src: /projects/toon-shader/step-2.webp
        label: ② Lambert (일반)
      - src: /projects/toon-shader/step-3.webp
        label: ③ Cel 3-Band
      - src: /projects/toon-shader/step-4.webp
        label: ④ + Specular
      - src: /projects/toon-shader/step-5.webp
        label: ⑤ + Rim (옵션)
  - title: Output & Experiments
    kicker: Final · Color tests
    cols: 4
    ratio: auto
    caption: 최종 결과(림 라이트 off · on, 800×600 렌더)와 밴드 색과 그림자 색을 바꿔 본 실험 프리셋입니다.
    items:
      - src: /projects/toon-shader/cover.webp
        label: Final
        note: 림 라이트를 끈 상태
      - src: /projects/toon-shader/final-rim.webp
        label: Final
        note: 림 라이트를 켠 상태
      - src: /projects/toon-shader/exp-1.webp
        label: Experiment 1
      - src: /projects/toon-shader/exp-2.webp
        label: Experiment 2
      - src: /projects/toon-shader/exp-3.webp
        label: Experiment 3
      - src: /projects/toon-shader/exp-4.webp
        label: Experiment 4
      - src: /projects/toon-shader/exp-5.webp
        label: Experiment 5
decisions:
  - choice: 후처리 대신 Inverted Hull 외곽선
    why: 추가 렌더 타깃이나 엣지 검출 없이, 같은 메시를 한 번 더 그리는 것만으로 굵기를 조절할 수 있는 외곽선을 얻습니다.
    tradeoff: 메시를 두 번 그리고, 오목한 내부 윤곽선은 잘 나오지 않습니다.
  - choice: 램프 텍스처 대신 임계값 분기
    why: 밴드 경계(0.5 / 0.3)와 그림자 색을 셰이더 상수만으로 바꿔 가며 실험할 수 있습니다.
    tradeoff: 경계가 딱 잘려 해상도가 낮으면 계단이 보일 수 있습니다.
limitations:
  - 외곽선 정점 셰이더가 월드 변환 없이 뷰 행렬만 곱해, 월드 행렬이 단위 행렬인 장면에서만 올바르게 동작
links:
  - label: Notes — Toon Shader 구현 기록
    href: /notes/computer-graphics/hlsl/toonshader/
---
