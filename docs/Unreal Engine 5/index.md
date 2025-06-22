---
layout: default
title: "Unreal Engine 5"
nav_order: 6
has_children: true
---
# Unreal Engine 5

**참고하면 좋은 링크**
- [UnrealEngine c++ Guide](https://www.tomlooman.com/unreal-engine-cpp-guide/)
- [blueprints vs c++](https://awforsythe.com/unreal/blueprints_vs_cpp/)
- [Exploring Unreal's physics framework](https://itscai.us/blog/post/ue-physics-framework/)
- [Unreal Engine UI Tutorials](https://unreal-garden.com/)
- [Unreal Engine C++ API Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/API)
- [UE Classes API](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Classes)

---

# Coordinate System
UE 좌표계는 왼손 좌표계 기준

|축|방향|+|-|
|X|깊이 |앞(카메라와 멀어짐)| 뒤 (카메라와 가까워짐)|
|Y|측면 |오른쪽|왼쪽|
|Z|높이 |위|아래|

**참고하면 좋은 링크**
- [coordinate-system](https://techarthub.com/a-practical-guide-to-unreal-engines-coordinate-system/)
- [Coordinate System and Spaces](https://dev.epicgames.com/documentation/en-us/unreal-engine/coordinate-system-and-spaces-in-unreal-engine)


# Level Editor Viewport

## 카메라 동작
- 우측 카메라 아이콘으로 속도 조절 가능
1. 왼쪽 클릭 : 카메라 수평 이동
2. 오른쪽 클릭 : 카메라 상하 이동
3. 왼쪽 클릭 + C : 줌인 (확대)
4. 클릭 + WASD : 카메라 이동 

# View Modes
## Show 
왼쪽 Show (표시)를 이용해 레벨에서 보고 싶은 에셋 플래그 on/off 설정 가능

## Lit
레벨 라이팅 설정 on/off, 와이어 프레임 등 여러가지 설정 가능

## perspective
카메라 원근 설정. 직교 투영으로 오브젝트트 배치 편하게 가능

## 맨 우측 화면 분할 아이콘
4개의 개별 뷰포트로 분할 가능

## 맨 좌측 리스트 아이콘
1. Show FPS 로 프레임 보기 가능
   - ctrl + shift + H
2. Bookmarks 를 통해 시점 저장, 불러오기 가능 
    - ctrl + 0 ~ 9 으로 북마크 저장
    - 키보드 0 ~ 9 으로 저장한 북마크 불러오기
3. 게임 뷰
    - 단축키 : G
    - 아이콘 사라짐
4. 몰입 모드
    - 단축키 : F11
    - 화면 크게
5. 고해상도 스크린샷
    - 우측 상단 캡처 지정 아이콘 클릭 -> 캡처 사각형 지정

# Object manipulate 오브젝트 조종
1. 오브젝트 선택
    - 단축키 : Q
2. 오브젝트 움직이기 (기즈모 사용)
    - 단축키 : W
3. 오브젝트 회전
    - 단축키 : E
4. 오브젝트 스케일 조절
    - 단축키 : R

## 스냅
스냅 유무를 아이콘을 통해 on/off. 스냅에 쓸 단위도 조절 가능

- 그리드 아이콘 : 오브젝트 이동 스냅
- 각도 아이콘 : 오브젝트 회전 각도 스냅
- 스케일 아이콘 : 오브젝트 스케일 스냅
- 표면 스냅 아이콘 : 오브젝트 가져올 때 표면에 어떻게 놓을 것인지 설정
  - on/off로 표면에 딱 붙일 것인지 설정
  - 오프셋으로 표면에서 얼마나 떨어트릴 것인지 설정
  - 언리얼 엔진의 1 unit = 1cm

## 좌표
오브젝트 조종 옆에 있는 아이콘을 통해 어떤 좌표를 사용할 것인지 조절 가능
- 단축키 : ctrl + `
- 세계 좌표에 있는 경우 세계 아이콘 표시
- 로컬 좌표에 있는 경우 로컬 아이콘 표시

## 오브젝트 복사
1. Alt + 기즈모 이동을 통해 복사
2. 여러개 복사하고 싶으면 shift로 오브젝트 다중 선택 후 Alt + 기즈모 이동
    - 회전도 복사 가능

# Panels 패널
## Outliner
world에 있는 모든 오브젝트 목록

1. 아웃라이너에서 오브젝트 이름으로 오브젝트 찾기 가능
2. 아웃라이너에서 오브젝트 이름 누른 뒤 F 키를 통해 오브젝트로 이동

## Details
선택한 오브젝트 속성 변경

1. Location : 월드 좌표에서의 오브젝트 위치
2. Physics
    - Simulate physics : 체크 박스에 체크하면 물리학 활성화
