---
title: Cub3D
tagline: 2D 맵 정보만으로 1인칭 3D 미로를 그리는 레이캐스팅 렌더러 — 울펜슈타인 3D 스타일의 42 Seoul 팀 과제
order: 6
group: 42 Seoul
year: '2024'
role: 2인 팀 · 레이캐스팅, 이동, 벽 텍스처 매핑, 바닥·천장 렌더링
team: jonghopa — .cub 파싱 · 맵 검증
stack: [C, MiniLibX, Makefile]
accent: '#ef4444'
cover:
  poster: /projects/cub3d/cover.webp
  video: /projects/cub3d/cover.mp4
  alt: 하늘색 천장과 갈색 바닥 사이로 벽돌 텍스처 벽과 기둥이 이어지는 1인칭 복도
overview: >-
  Cub3D의 목표는 전설적인 게임 '울펜슈타인 3D'와 유사한 1인칭 시점의 3D 미로 탐험 게임을 구현하는 것입니다.
  폴리곤 기반의 현대적인 3D 렌더링이 아닌, 레이캐스팅이라는 기법을 사용합니다.
  2D 맵 정보만으로 3D 공간의 환영을 만들어 내는 것이 Cub3D 세계를 구현하는 핵심입니다.
highlights:
  - .cub 파일 파싱 — 벽 텍스처 4방향(NO·SO·WE·EA), 바닥·천장 색(F·C), 맵과 플레이어 시작 방향
  - 벽으로 닫혀 있지 않은 맵, 중복·누락 식별자, 잘못된 RGB를 모두 오류로 처리
  - DDA로 벽을 찾고, 벽 방향마다 다른 텍스처를 입혀 세로줄 단위로 그리기
  - WASD 이동 · ←/→ 회전, 벽 충돌 판정
specs:
  - label: Output
    value: 1280×960, 매 프레임 이미지 버퍼에 그린 뒤 출력
  - label: FOV
    value: 카메라 평면 0.66 (약 66°)
  - label: Textures
    value: 벽 4방향 XPM 256×256
  - label: Capture
    value: minilibx-linux 포팅 빌드(WSL2) · 스크립트 입력으로 프레임 저장
techniques:
  - title: Raycasting
    sub: 레이캐스팅
    body: 레이캐스팅은 2D 맵에 3D 원근감을 부여하는 렌더링 기법입니다. 플레이어 시점에서 화면의 세로줄마다 광선을 쏘아, 광선이 벽에 닿으면 그 벽까지의 거리를 계산하고 거리에 따라 벽의 높이를 정해 그립니다.
    formula: |-
      camera_x = 2·x / WIDTH − 1
      ray = dir + plane · camera_x
      line_height = HEIGHT / perp_dist
  - title: Digital Differential Analysis
    sub: DDA 알고리즘
    body: 광선이 2D 맵 격자를 한 칸씩 지나갈 때마다 벽이 있는지 확인합니다. 다음 x면과 y면까지의 거리 중 가까운 쪽으로 한 칸씩 전진하며 벽을 만날 때까지 반복합니다.
    formula: |-
      delta_dist = |1 / ray|
      if (side_dist.x < side_dist.y) { side_dist.x += delta_dist.x; map.x += step.x }
      else                           { side_dist.y += delta_dist.y; map.y += step.y }
  - title: Perpendicular Distance
    sub: 어안 효과 방지
    body: 광선의 실제 길이 대신 카메라 평면까지의 수직 거리를 써서, 화면 가장자리의 벽이 휘어 보이는 어안 효과를 없앱니다.
    formula: perp_dist = side_dist − delta_dist   (마지막으로 넘은 면 기준)
  - title: Texture Mapping
    sub: 벽 텍스처
    body: 광선이 부딪힌 면과 방향으로 4방향 텍스처 중 하나를 고르고, 벽 위 충돌 위치의 소수 부분으로 텍스처 x 좌표를, 세로줄을 따라 일정 간격으로 y 좌표를 샘플링합니다.
    formula: |-
      wall_x = pos + perp_dist · ray   (side에 따라 y 또는 x)
      tex_x = frac(wall_x) · tex_width
      step = tex_height / line_height
galleries:
  - title: In the maze
    kicker: Output
    cols: 3
    caption: 팀 최종본 코드를 minilibx-linux로 포팅해 WSL2에서 촬영했습니다. 촬영용 맵과 스크립트 입력(키 상태 재생)만 추가했고, 렌더링 코드는 그대로입니다.
    items:
      - src: /projects/cub3d/cover.webp
        label: 복도와 기둥
      - src: /projects/cub3d/still-2.webp
        label: 회전
      - src: /projects/cub3d/still-3.webp
        label: 방향별 텍스처
architecture:
  caption: .cub에서 화면까지
  points:
    - Parse — 식별자 6개(NO·SO·WE·EA·F·C)를 순서 무관하게 읽고, 비트 마스크로 중복·누락 검사
    - Validate — 맵 문자 검사, 플레이어 1명, 빈 칸이 가장자리나 공백에 닿지 않는지 4방향 검사
    - Setup — MiniLibX 창·이미지 생성, 벽 텍스처 4장 로드, 키 누름/뗌 훅과 루프 훅 등록
    - Frame — 이동·회전 적용 → 바닥·천장 채우기 → 세로줄마다 DDA와 텍스처 샘플링 → 창에 출력
problems:
  - title: 맵 인덱스 뒤바뀜
    problem: 파싱된 맵을 map[x][y]로 읽어 가로·세로가 뒤바뀌고, 정사각형이 아닌 맵에서는 벽 판정이 엉뚱한 칸을 가리켰습니다.
    approach: 행 = y, 열 = x 규칙으로 map[y][x] 접근을 통일했습니다.
    result: 직사각형·불규칙한 맵에서도 충돌과 레이캐스팅이 올바른 칸을 봅니다.
  - title: 포인터 구조체 정리
    problem: 텍스처와 레이캐스트 상태를 포인터로 따로 할당해, 해제 경로가 복잡하고 누수 위험이 컸습니다.
    approach: t_texture와 t_raycast를 실행 데이터 구조체 안의 스택 값으로 옮기고, 누수 검사 스크립트와 sanitizer로 확인했습니다.
    result: 텍스처·레이 상태를 따로 할당하고 해제할 필요가 없어져 종료·오류 경로가 단순해졌습니다.
links:
  - label: GitHub — 42-cub3d
    href: https://github.com/ryuhajin/42-cub3d
  - label: GitHub — 팀 저장소 (jhdgo1225/cub3d)
    href: https://github.com/jhdgo1225/cub3d
---
