---
layout: default
title: "2. Moving Objects With Code"
parent: "C++ in UE"
nav_order: 3
has_children: true
---

# 2. Moving Objects With Code

## FRotator
```c++
FRotator::FRotator(float InPitch, float InYaw, float InRoll)
```
- 매개변수:
  - InPitch: Up/Down (-90°~+90° 권장)
    - `-` : 아래
    - `+` : 위 
  - InYaw: Left/Right (-180°~+180°)
	- `-`: 왼쪽 (반시계)
    - `+`: 오른쪽 (시계)
  - InRoll: 비틀기 (-180°~+180°)
    - `-`: 왼쪽  (↙)
    - `+`: 오른쪽  (↘)

회전 종류|	기준 축|	평면 변화|		비유|	
Pitch|		Y축 |	XZ 평면|캐릭터가 머리를 위아래로 끄덕임
Yaw|		Z축	|	XY 평면	|	캐릭터가 좌우로 고개를 돌려 방향 전환
Roll|		X축	|	YZ 평면	|	비행기의 날개가 좌우로 기울어지는 동작

- Pitch 제한 : Pitch는 일반적으로 -90°~+90°로 제한됨
  - Pitch가 ±90°일 때 Gimbal Lock 발생 가능 → FQuat 사용 권장
- Yaw/Roll 범위: 360° 회전 시 정규화

### 사용예시
```c++
FRotator NewRotation(0.0f, 0.0f, 0.0f); // 초기화
NewRotation.Pitch = -45.0f; // 아래 45도로 고개 숙임
NewRotation.Yaw = -90.0f; // 왼쪽 90도로 방향 전환
NewRotation.Roll = 30.0f; // 오른쪽 30도로 몸체 기울이기


FRotator Rot(370.0f, -190.0f, 0.0f); // 360도 이상 일 때 정규화
FRotator Normalized = Rot.GetNormalized(); // (10°, 170°, 0°)
```

## SetActorLocation
벡터 통해 액터 위치 설정하기

```c++
void AItem::BeginPlay()
{
	Super::BeginPlay();
	
	UWorld* World = GetWorld();

	SetActorLocation(FVector(0.f, 0.f, 50.f)); // 액터 위치 설정

	FVector Location = GetActorLocation();
	FVector Forward = GetActorForwardVector();

	DRAW_VECTOR(Location, Location + Forward * 100.f);
}
```

## SetActorRotation
```c++
void AItem::BeginPlay()
{
	Super::BeginPlay();
	
	UWorld* World = GetWorld();

	SetActorLocation(FVector(0.f, 0.f, 50.f));
    SetActorRotation(FRotator(0.f, 45.f, 0.f)); // 액터 회전 설정

	FVector Location = GetActorLocation();
	FVector Forward = GetActorForwardVector();

	DRAW_VECTOR(Location, Location + Forward * 100.f);
}
```

## Actor Wolrd Offset
- BP
  - Add Actor World Offset
  - Add Actor World Rotation

### 프레임 속도 조절
1. Edit -> Project Settings
2. frame rate 검색
3. Use Fixed Frame Rate 체크
4. 원하는 프레임 수 설정

- 프레임 따라 움직이기
    - 프레임은 들쭉날쭉 하기때문에 비율로 조절해야 속도가 일정하게 찍힘

```c++
void AItem::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// movement rate in units of cm/s
	float MovementRate = 50.f;
	float RotationRate = 45.f;

	// MovementRate * DeltaTime (cm/s) * (s/frame) = (cm/frame)
	AddActorWorldOffset(FVector(MovementRate * DeltaTime, 0.f, 0.f));
	AddActorWorldRotation(FRotator(0.f, RotationRate * DeltaTime, 0.f));
	DRAW_SPHERE_SingleFrame(GetActorLocation());
	DRAW_VECTOR_SingleFrame(GetActorLocation(), GetActorLocation() + GetActorForwardVector() * 100.f);
}
```
