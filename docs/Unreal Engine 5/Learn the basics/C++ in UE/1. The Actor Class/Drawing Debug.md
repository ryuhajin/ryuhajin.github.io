---
layout: default
title: "Drawing Debug"
parent: "1. The Actor Class"
nav_order: 2
---

# Drawing Debug
디버그 메서드를 블루프린트와 C++로 어떻게 구현하는지 알아보자

## Drawing Debug Spheres
디버그용 구 그리기

### DrawDebugSphere() 함수 원형

```c++
void DrawDebugSphere(
    const UWorld* InWorld,
    const FVector& Center,
    float Radius,
    int32 Segments,
    FColor Color,
    bool bPersistentLines = false,
    float LifeTime = -1.f,
    uint8 DepthPriority = 0,
    float Thickness = 0.f
);
```

- 매개변수
  - InWorld: 월드 객체 포인터
  - Center: 구의 중심 좌표
  - Radius: 반지름
  - Segments: 구 세그먼트 수
  - Color: 색상
  - bPersistentLines: 지속적으로 표시할지 여부
  - LifeTime: 디버그 라인이 화면에 유지될 시간(초, -1은 무한 지속)
  - DepthPriority: 렌더링 우선순위
  - Thickness: 선 두께

- **bPersistentLines**
  - true: 엔진 내부에서 해당 디버그 요소를 지속성 목록(Persistent List)에 등록하여 관리
    - `FlushPersistentDebugLines()`로 수동 제거 가능 
    - 지속적인 메모리 사용이 발생하지만 매 프레임 재생성 비용 절감
  - false: 프레임 임시 배열에만 저장
    - 매 프레임 생성/삭제 반복

- **LifeTime**

|값|예시|
|LifeTime = -1|무한 지속|
|LifeTime = 0|1 프레임만 출력되고 사라짐|
|LifeTime > 0| 지정된 시간(초) 동안 지속 후 사라짐| 

### BP
- Draw Debug Sphere
  - Get Actor Location : 디버그용 구의 Center 지정에 사용

### C++
```c++
#include "DrawDebugHelpers.h" // 디버그 헤더 인클루드

void AItem::BeginPlay()
{
        Super::BeginPlay();

        UWorld* World = GetWorld();
        FVector Location = GetActorLocation();

        if (World)
        {
                DrawDebugSphere(World, Location, 25.f, 24, FColor::Red, false, 30.f);
        }
}
```

- `define` 사용하기

```c++
#define DRAW_SPHERE(Location) if (GetWorld()) DrawDebugSphere(GetWorld(), Location, 25.f, 12, FColor::Red, true);

AItem::AItem()
{
	FVector Location = GetActorLocation();
	DRAW_SPHERE(Location)
}
```

---

## Drawing Debug Lines
디버그용 벡터 라인 시각화하기

### Drawing Debug Lines() 함수 원형
```c++
void DrawDebugLine(
    const UWorld* InWorld,
    const FVector& LineStart,
    const FVector& LineEnd,
    FColor Color,
    bool bPersistentLines = false,
    float LifeTime = -1.f,
    uint8 DepthPriority = 0,
    float Thickness = 0.f
);
```

- 매개변수
  - InWorld: 월드 객체 포인터
  - LineStart: 시작 좌표
  - LineEnd: 끝 좌표
  - Color: 색상
  - bPersistentLines: 지속적으로 표시할지 여부
  - LifeTime: 디버그 라인이 화면에 유지될 시간(초, -1은 무한 지속)
  - DepthPriority: 렌더링 우선순위
  - Thickness: 선 두께

### BP
- Draw Debug Line
  - Get Actor Location : 디버그용 라인의 Start 지정에 사용
  - Get Actor Foward Vector : 전방 벡터 불러오기
    - 위 두개를 ADD 해 Line End에 잇는다
    - 벡터 단위는 `cm`
      - 따라서 Foward Vector 크기 곱셈 필요

### C++
```c++
void AItem::BeginPlay()
{
        Super::BeginPlay();

        UWorld* World = GetWorld();
        FVector Location = GetActorLocation();

        if (World)
        {
                FVector Forward = ForwardVector();
                DrawDebugLine(World, Location, Location + Forward * 100.f, FColor::Red, true);
        }
}
```


- `define` 사용하기

```c++
#define DRAW_LINE(StartLocation, EndLocation) if (GetWorld()) DrawDebugLine(GetWorld(), StartLocation, EndLocation, FColor::Red, true, -1.f, 0, 1.f);

AItem::AItem()
{
	FVector Location = GetActorLocation();
        FVector Forward = GetActorForwardVector();

	DRAW_LINE(Location, Location + Forward * 100.f)
}
```

---

## Drawing Debug Point
디버그용 포인트 찍기 

- 벡터의 처음과 끝을 표시하기에 좋음
- 포인트 크기는 거리에 따라 변하지 않음 (고정)

### DrawingDebugPoint() 함수 원형
```c++
void DrawDebugPoint(
    const UWorld* InWorld,
    FVector const& Position,
    float Size,
    FColor const& Color,
    bool bPersistentLines,
    float LifeTime,
    uint8 DepthPriority
);
```
- 매개변수
  - InWorld: 디버그 포인트를 그릴 월드 컨텍스트
  - Position: 포인트의 위치 (FVector)
  - Size: 포인트의 크기 (float)
  - Color: 포인트의 색상 (FColor)
  - bPersistentLines: 지속적으로 표시할지 여부
  - LifeTime: 디버그 포인트가 화면에 유지될 시간(초)
  - DepthPriority: 렌더링 우선순위

### BP
- Draw Debug Point
  - Get Actor Location : 디버그용 포인트 찍을 Position

### C++
```c++
void AItem::BeginPlay()
{
        Super::BeginPlay();

        UWorld* World = GetWorld();
        FVector Location = GetActorLocation();

        if (World)
        {
                FVector Forward = ForwardVector();
                DrawDebugPoint(World, Location + Forward * 100.f, 15.f, FColor::Red, true);
                // 벡터 끝에 점찍기
        }
}
```

- `define` 사용하기

```c++
#define DRAW_POINT(Location) if (GetWorld()) DrawDebugPoint(GetWorld(), Location, 15.f, FColor::Red, true);

AItem::AItem()
{
	FVector Location = GetActorLocation();
        FVector Forward = GetActorForwardVector();

	DRAW_POINT(Location + Forward * 100.f)
}
```

---

## Line + Point 로 벡터 그리기

- `\` 사용해 매크로 계속 이어갈 수 있음

```c++
#define DRAW_VECTOR(StartLocation, EndLocation) if (GetWorld()) \
	{ \
		DrawDebugLine(GetWorld(), StartLocation, EndLocation, FColor::Red, true, -1.f, 0, 1.f); \
		DrawDebugPoint(GetWorld(), EndLocation, 15.f, FColor::Red, true); \
	};

AItem::AItem()
{
	FVector Location = GetActorLocation();
        FVector Forward = GetActorForwardVector();

	DRAW_VECTOR(Location, Location + Forward * 100.f)
}
```
