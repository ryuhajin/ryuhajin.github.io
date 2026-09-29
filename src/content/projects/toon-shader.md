---
title: Toon Shader
tagline: 3D 모델에 애니메이션처럼 손으로 그린 듯한 외곽선과 단계적인 명암을 입히는 DirectX 11 / HLSL 툰 셰이더
order: 4
group: Computer Graphics
year: '2025'
role: Solo · HLSL 학습 프로젝트
stack: [C++, DirectX 11, HLSL, Win32]
accent: '#fb923c'
cover:
  poster: /projects/toon-shader/cover.webp
  alt: 회색 배경 위에 어두운 외곽선과 밝은 살구색, 주황색 두 단계 명암으로 칠해진 구
overview: >-
  3D 모델에 애니메이션처럼 손으로 그린 듯한 외곽선과 단계적인 명암을 입히는 툰 셰이더입니다.
  DirectX 11 / HLSL로 외곽선 패스와 셀 셰이딩 패스를 나눠 구현했습니다.
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
    - Outline Pass — 컬링을 Front로 바꾸고, 정점을 뷰 공간 법선 방향으로 0.03만큼 밀어 확대한 모델을 단색(0.18 회색)으로 그림. 뒷면만 남아 외곽선이 됨
    - Cel Pass — 컬링을 Back으로 되돌리고 카메라·광원 상수 버퍼를 설정한 뒤, 원본 모델을 셀 셰이딩해 외곽선 위에 덮어 그림
techniques:
  - title: Inverted Hull Outline
    body: 정점을 뷰 공간 법선 방향으로 밀어 모델을 살짝 키운 뒤, 앞면을 컬링해 뒷면만 단색으로 그려 외곽선을 만듭니다.
    formula: posView += Nview · 0.03   (Front-face Culling)
  - title: Cel Shading
    body: N·L을 0.5 / 0.3 임계값으로 나눠 3단계 명암을 만들고, 가장 어두운 구간은 주황→보라 그림자색으로 보간해 색감 있는 그림자를 표현했습니다.
    formula: N·L > 0.5 → Lit · 0.3~0.5 → Warm · < 0.3 → lerp(Warm, Purple)
  - title: Specular Highlight
    body: Blinn-Phong 하프 벡터로 작고 날카로운 하이라이트를 더해 재질의 광택을 표현했습니다.
    formula: spec = saturate(N·H)^350
  - title: Rim Light (옵션)
    body: 시선과 법선이 벌어질수록 커지는 림 값을 5제곱하고, 0.7 이상에서만 더해 가장자리에 역광 띠를 넣습니다.
    formula: rim = (1 − N·V)^5   (1 − N·V > 0.7)
galleries:
  - title: Step by step
    kicker: Breakdown
    cols: 5
    ratio: square
    caption: 셰이더 복사본으로 단계를 하나씩 켜며 렌더링한 분해 결과입니다.
    items:
      - src: /projects/toon-shader/step-1.webp
        label: ① Outline Pass
      - src: /projects/toon-shader/step-2.webp
        label: ② Lambert (비교)
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
    caption: 최종 결과(Rim Light off / on)와, 밴드 색·그림자 색을 바꿔 가며 실험한 결과입니다.
    items:
      - src: /projects/toon-shader/cover.webp
        label: Final
        note: Rim Light off
      - src: /projects/toon-shader/final-rim.webp
        label: Final
        note: Rim Light on
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
  - 값이 모두 코드에 고정되어 있어 런타임 조절 UI가 없음 — 이후 프로젝트(Water, SDFs)에서 ImGui 패널로 해결
links:
  - label: Notes — Toon Shader 구현 기록
    href: /notes/computer-graphics/hlsl/toonshader/
---
