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
  alt: 검은 배경 위에 흰 선으로 그려진, 한쪽으로 솟은 산맥 모양의 등각 투영 와이어프레임 지형 (t2.fdf)
overview: >-
  FdF 프로젝트의 목표는 입력된 텍스트 데이터를 3차원 공간상의 좌표로 인식하고,
  이 점들을 선으로 연결하여 와이어프레임 형태의 3D 지도를 그리는 것입니다.
  42 교육 과정에서 그래픽 프로그래밍 입문을 돕기 위해 제공되는 MiniLibX(창 생성, 키/마우스 이벤트, 이미지 버퍼 접근)만으로 구현했습니다.
highlights:
  - 텍스트 지도 입력 — 행은 x축, 열은 y축, 값은 z축(고도)
  - 맵 크기에 맞춰 스케일과 고도 배율을 자동으로 정하고 창 가운데에 배치
  - 실수 연산 없이 정수 오차 누적만으로 직선을 긋는 브레젠험 알고리즘
  - 행 길이·숫자·정수 범위·빈 줄까지 검사하는 입력 검증과 모든 오류 경로의 메모리 해제
specs:
  - label: Output
    value: 1920×1080 이미지 버퍼에 그린 뒤 한 번에 창으로 출력
  - label: Input
    value: .fdf 텍스트 지도 (공백으로 구분한 정수 높이 값)
  - label: Capture
    value: minilibx-linux 포팅 빌드(WSL2) · 3840×2160 버퍼를 저장해 1920으로 축소
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
    - Read — get_next_line으로 한 줄씩 읽어 연결 리스트에 저장
    - Validate — 행마다 열 개수 동일, 숫자와 부호만 허용, int 범위, 빈 줄 금지, 확장자 .fdf
    - Vectorize — 공백으로 나눠 {x, y, z} 실수 벡터 리스트로 변환
    - Fit — 자동 스케일·고도 배율 → 등각 투영 → 창 중앙 정렬
    - Draw — 오른쪽·아래 이웃과 브레젠험으로 연결해 이미지 버퍼에 기록, 창에 출력
galleries:
  - title: Maps
    kicker: Output
    cols: 3
    caption: 과제 테스트 지도들을 같은 프로그램으로 렌더링한 결과입니다. macOS 전용 MiniLibX(Swift · Metal)로 만든 과제라, 코드는 그대로 두고 minilibx-linux로 포팅해 WSL2에서 이미지 버퍼를 저장했습니다. 웹에서 선이 뭉개지지 않도록 촬영 빌드에서만 4K 해상도와 3px 선으로 그린 뒤 축소했습니다.
    items:
      - src: /projects/fdf/cover.webp
        label: t2.fdf
      - src: /projects/fdf/map-50-4.webp
        label: 50-4.fdf
      - src: /projects/fdf/map-20-60.webp
        label: 20-60.fdf
      - src: /projects/fdf/map-elem2.webp
        label: elem2.fdf
      - src: /projects/fdf/map-pyramide.webp
        label: pyramide.fdf
      - src: /projects/fdf/map-42.webp
        label: 42.fdf
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
  - label: GitHub — 42seoul/fdf
    href: https://github.com/ryuhajin/42seoul/tree/master/fdf
---
