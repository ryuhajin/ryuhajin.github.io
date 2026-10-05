---
title: FDF
tagline: 높이 값이 적힌 텍스트 지도를 3차원 좌표로 읽어, 등각 투영과 브레젠험 직선으로 와이어프레임 지형을 그리는 42 Seoul 그래픽 과제
order: 5
group: 42 Seoul
year: '2023'
role: Solo · 42 Seoul 그래픽 과제
stack: [C, MiniLibX, Makefile]
accent: '#38bdf8'
cover:
  poster: /projects/fdf/cover.webp
  video: /projects/fdf/cover.mp4
  alt: 검은 배경 위에 흰 선으로 그려진, 한쪽으로 산맥이 솟은 등각 투영 와이어프레임 지형 (t1.fdf)
overview: >-
  42 서울 그래픽스 과제인 FdF 프로젝트입니다.
  텍스트 지도(.fdf)를 읽어 3D 와이어프레임 지형으로 그리는 것이 목표입니다.
  줄(행)의 개수가 y 방향 점 개수, 한 줄에 있는 숫자(열)의 개수가 x 방향 점 개수, 숫자 값은 높이(z)가 됩니다.
highlights:
  - MiniLibX(창 생성, 키 이벤트, 이미지 버퍼 접근)만으로 구현
  - 맵 크기에 맞춰 스케일과 고도 배율을 자동으로 정하고 창 가운데에 배치
  - 실수 연산 없이 정수 오차 누적만으로 직선을 긋는 브레젠험 알고리즘
  - 행 길이·숫자·정수 범위·빈 줄까지 검사하는 입력 검증과 모든 오류 경로의 메모리 해제
specs:
  - label: Output
    value: 1920×1080 이미지 버퍼에 그린 뒤 한 번에 창으로 출력
  - label: Input
    value: .fdf 텍스트 지도 (공백으로 구분한 정수 높이 값)
  - label: Capture
    value: minilibx-linux 포팅 빌드(WSL2) · 3840×2160 버퍼를 저장해 1920으로 축소, 높이 3배
techniques:
  - title: Isometric Projection
    sub: 등각 투영
    body: 3차원 객체를 2차원 평면에 표현하기 위한 투영 기법입니다. 원근감을 적용하지 않아 객체의 평행선이 그대로 유지되고, 모든 축이 같은 비율로 표현됩니다.
    formula: |-
      x' = (x − y) · cos(30°)
      y' = (x + y) · sin(30°) − z · zratio
  - title: Bresenham's Line Algorithm
    sub: 브레젠험 라인 알고리즘
    body: 실수 연산 없이 오직 정수 연산만으로 다음 픽셀의 위치를 결정합니다. 변화량이 큰 방향인 주축으로 한 칸씩 이동하며, 정수형 오차값을 누적해 보조축 방향으로 이동할지 여부를 판단합니다. 부동소수점 오차를 피하고 매우 빠르게 선을 그릴 수 있습니다.
    formula: |-
      err += 2·|Δminor|
      if (err > |Δmajor|) { minor += step; err −= 2·|Δmajor| }
  - title: Auto Fit
    sub: 스케일과 중앙 정렬
    body: 지도의 세 꼭짓점을 z = 0으로 먼저 투영해 투영 후 크기를 구하고, 창에 맞는 배율과 고도 배율을 정한 뒤 도형 전체를 창 가운데로 옮깁니다.
    formula: scale = min(W / w, H / h) · 0.6
architecture:
  caption: 텍스트에서 와이어프레임까지
  points:
    - Read — get_next_line으로 파일을 한 줄씩 읽어 저장
    - Validate — 줄마다 숫자 개수가 같은지, 값·확장자가 올바른지 검사
    - Vectorize — 숫자 하나를 점 하나 {x, y, z}로 바꿈
    - Fit — 창에 맞게 크기를 정하고 비스듬히 내려다본 시점(등각 투영)으로 옮김
    - Draw — 이웃한 점끼리 정수 계산만 쓰는 브레젠험 직선으로 연결
galleries:
  - title: Maps
    kicker: Output
    cols: 3
    caption: >-
      맨 위 화면은 t1.fdf를 등각 투영으로 그린 결과입니다. 점마다 높이값을 받아 와이어프레임 지형이 됩니다.
      macOS 전용 MiniLibX로 만든 과제라, 코드는 그대로 두고 minilibx-linux로 포팅해 WSL2에서 촬영했습니다 (촬영 빌드에서만 높이 3배).
    items:
      - src: /projects/fdf/input-42.webp
        label: INPUT · 42.fdf
        note: 숫자 하나가 점 하나, 값이 높이
      - src: /projects/fdf/map-42.webp
        label: 42.fdf
      - src: /projects/fdf/map-pyra.webp
        label: pyra.fdf
      - src: /projects/fdf/map-mars.webp
        label: mars.fdf
      - src: /projects/fdf/map-julia.webp
        label: julia.fdf
      - src: /projects/fdf/map-elem-fract.webp
        label: elem-fract.fdf
problems:
  - title: 정수 좌표의 누적 오차
    problem: 처음에는 좌표를 int로 계산해, 투영과 스케일을 거치면서 선이 어긋나고 도형이 찌그러졌습니다.
    approach: 벡터를 float로 바꿔 투영·스케일·이동을 실수로 계산하고, 마지막 픽셀 단계에서만 정수로 바꿨습니다.
    result: 작은 지도부터 큰 지도까지 격자 간격이 고르게 유지됩니다.
  - title: 지도 크기가 제각각
    problem: 몇 칸짜리 지도와 수백 칸짜리 지도가 같은 배율로 그려져, 너무 작거나 창 밖으로 벗어났습니다.
    approach: 투영 후 크기로 창에 맞는 배율을 구하고, 원점 기준으로 옮긴 뒤 다시 창 가운데로 이동시켰습니다.
    result: 어떤 지도든 창 안 가운데에 적당한 크기로 그려집니다.
links:
  - label: GitHub — 42-fdf
    href: https://github.com/ryuhajin/42-fdf
---
