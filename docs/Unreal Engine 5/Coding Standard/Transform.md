---
layout: default
title: "Transform"
parent: "Coding Standard"
nav_order: 3
---

# Transform

## FVector
3차원 공간상의 위치, 방향, 속도, 크기 등 벡터 값을 표현할 때 사용

- 오브젝트의 위치 (Location) : `SetActorLocation(FVector(100.f, 200.f, 300.f));`
- 이동 방향 및 속도 (Velocity, Direction) : `FVector Direction = Target - Source;`
- 스케일(Scale) 값 (상대적 크기)
- 힘(Force), 가속도(Acceleration) 등 물리 연산
- 충돌 처리에서 법선 벡터(Normal) 표현

1. 데이터 구조
```c++
struct FVector {
    float X;
    float Y;
    float Z;
};
```
- 오른손 법칙 좌표계 : Z-위, X-앞, Y-오른쪽

2. 특징
- 기본적인 연산자 오버로딩 지원 (+, -, *, /, dot, cross 등)
- 크기, 정규화, 내적(dot), 외적(cross) 등 벡터 연산 지원
- 단순 위치/방향뿐 아니라, 각종 수학적, 물리적 벡터 표현에 모두 사용
- 방향성과 크기를 함께 가짐 (예: 방향 벡터는 크기=1로 정규화)

3. 주요 메서드

|메서드|매개변수|반환값|설명|
|---|---|---|---|
| `Size()`      | 없음                     | float   | 벡터의 크기를 반환합니다.|   
| `Normalize()` | 없음                     | 없음         | 벡터를 정규화합니다.|
| `Dot()`       | const FVector& Other | float   | 두 벡터의 내적|
| `Cross()`     | const FVector& Other | FVector  | 두 벡터의 외적|
| `Rotation()`  | 없음                     | FRotator | 벡터의 방향을 회전 값으로 반환|
|`Lerp()`|const FVector& A <br> const FVector& B <br> float Alpha|FVector|두 벡터 간의 선형 보간|
|`Size() / SizeSquared()`||벡터의 크기 또는 크기의 제곱을 반환|


### 배경 수학

벡터 연산(덧셈, 뺄셈, 스칼라 곱/나눗셈, 내적/외적 등)은 선형대수의 기본 연산.

**내적(Dot Product)**: 두 벡터의 방향성이 얼마나 일치하는지 계산 → 코사인 법칙과 연관되어 각도 구하기, 투영, 정규화, 평면 법선 등 계산에 사용

```
A·B = Ax * Bx + Ay * By + Az * Bz
```

**외적(Cross Product)**: 두 벡터에 수직인 벡터 산출 → 평면의 법선, 회전축 등 계산
```
A×B = (Ay*Bz - Az*By, Az*Bx - Ax*Bz, Ax*By - Ay*Bx)
```

**정규화(Normalization)** → 크기를 1로 맞춤
```
V.Normalize() → V / |V|
```

**거리/길이**
```
V.Size() = sqrt(X^2 + Y^2 + Z^2)
```

**선형보간(LERP)**
```
Lerp(A, B, Alpha) = (1-Alpha)*A + Alpha*B
```

## FRotator
오일러 각(Euler Angle)(Pitch, Yaw, Roll)로 3D 회전을 표현할 때 사용

- 오브젝트 회전 : `SetActorRotation(FRotator(0.f, 90.f, 0.f));`
- 캐릭터, 카메라의 방향(회전)
- Actor/Component의 회전값 저장 : `GetActorRotation()`
- 블루프린트, 에디터의 회전값 입력 등

1. 데이터 구조
```c++
struct FRotator {
        float Pitch; // X축 회전 (상하)
        float Yaw;   // Z축 회전 (좌우)
        float Roll;  // Y축 회전 (틸트)
};
```
- 세 개의 float값(Pitch, Yaw, Roll)로 오일러 각 표현

2. 특징
- 오일러 각 특성상 Gimbal Lock(짐벌락) 문제 발생 가능
- 사람에게 직관적으로 이해하기 쉬움 (디자이너, 에디터에서 많이 사용)
- 내부적으로는 보통 Degree(각도) 단위 사용 (Radian 변환 필요시 지원)
- FRotator는 내부적으로 회전 행렬 혹은 쿼터니언으로 변환 가능

3. 주요 메서드

|메서드|매개변수|반환값|설명|
|---|---|---|---|
| `Quaternion()`| 없음| FQuat   | 오일러 각을 쿼터니언으로 변환|   
| `RotateVector()` | const FVector& V| FVector | 벡터를 회전|
| `UnrotateVector()`| const FVector& V | FVector| 회전된 벡터를 원래 방향으로 되돌림|
| `GetNormalized()`|없음|FVector| 회전된 벡터를 원래 방향으로 되돌림|
| `Clamp()`  | 없음 | FRotator |회전 값을 제한|

### 배경 수학
- **오일러 각(Euler Angle)** : 세 축(X, Y, Z)에 대한 **회전 각도(θx, θy, θz)**로 회전을 표현.
- 언리얼 엔진은 **Z(Yaw) → Y(Pitch) → X(Roll) 순서로 회전** (즉, "Yaw → Pitch → Roll" 오더)

**행렬 변환**: 오일러 각은 각각의 축 회전을 행렬로 변환 후 곱셈해서 최종 회전값을 만듦
```
R = Rz(Yaw) * Ry(Pitch) * Rx(Roll)
```

**Gimbal Lock**: 두 축이 일치하여 3차원 회전 자유도가 2차원으로 줄어드는 현상
- 예: Pitch가 ±90°에 가까워지면, Roll과 Yaw가 같은 평면이 됨

## FQuat
3D 공간에서 회전을 **쿼터니언(Quaternion)**으로 표현하여, 회전 연산의 정확성 및 안정성 확보

- 모션 블렌딩, 본(스켈레톤) 등 애니메이션의 회전 보간
- 부드러운 연속 회전 (SLERP)
- Gimbal Lock 방지가 중요한 복잡한 회전 연산

1. 데이터 구조
```c++
struct FQuat {
        float X; // 허수 (벡터)
        float Y; // 허수 (벡터)
        float Z; // 허수 (벡터)
        float W; // 실수 (스칼라) 부분
};
```
- 4개의 float형 멤버(X, Y, Z, W)로 구성
- 단위 쿼터니언(norm = 1) 으로 회전 표현

2. 특징
- 4차원 복소수로 회전 표현
- Gimbal Lock 문제 없음
- 회전 합성/보간에 최적화 (SLERP, NLERP 등 지원)
- FRotator, FMatrix 등과 상호 변환 함수 제공
- 보통은 FRotator(에디터/코드) ↔ FQuat(엔진 내부)로 변환하며 사용

3. 주요 메서드

|메서드|매개변수|반환값|설명|
|---|---|---|---|
| `RotateVector()`| const FVector& V| FVector|  벡터를 회전|   
| `Inverse()` | 없음| FQuat |쿼터니언의 역을 반환|
| `Slerp()`| const FQuat& A <br> const FQuat& B <br> float Alpha| FQuat | 두 쿼터니언 간의 구면 선형 보간을 수행|
| `ToAxisAndAngle()`|FVector& Axis <br> float& Angle | 없음 (출력 매개변수 사용)| 회전 축과 각도로 변환 |
| `MakeFromEuler()`| const FVector& Euler | FQuat |오일러 각도로부터 쿼터니언을 생성|

### 배경 수학
- **쿼터니언(Quaternion)**: 실수부(w)와 허수부(x, y, z)로 구성된 4차원 수학 구조
```
Q = w + xi + yj + zk (i, j, k는 허수 단위벡터)
```
- **회전 표현**: 3D 공간에서 임의의 축(axis)과 각도(θ)에 대한 회전
```
Q = [cos(θ/2), (axis * sin(θ/2))]
```

- **복합 회전**: 쿼터니언 곱셈으로 연속 회전 표현
```
Q' = Q2 * Q1 (Q1 후 Q2 수행)
```
- **회전 적용**: 점 P를 Q로 회전시키려면
```
P' = Q * P * Q⁻¹
(여기서 P는 벡터를 허수부로 취급한 쿼터니언)
```

## FTransform
위치, 회전, 스케일을 함께 관리하여 오브젝트의 변환을 효율적으로 처리

- 오브젝트의 전체 변환 설정: `SetActorTransform(FTransform(Rotation, Translation, Scale));`

1. 데이터 구조
```c++
struct FTransform
{
            FQuat   Rotation;
            FVector Translation;
            FVector Scale3D;
};
```

2. 특징
- 위치, 회전, 스케일을 하나의 구조체로 관리
- 계층적 트랜스폼 계산에 유용
- 블루프린트에서 쉽게 사용할 수 있도록 지원

3. 주요 메서드

많아서 나중에 정리할랭

## 정리

|타입|목적/용도|데이터 구조|특징 요약|
|---|---|---|---|
|FVector|3D 위치, 방향, 벡터|X, Y, Z (float)| 모든 위치/방향/벡터 연산에 사용|
|FRotator|오일러 각 기반 3D 회전|Pitch, Yaw, Roll (float)| 직관적, Gimbal Lock 위험|
|FQuat|쿼터니언 기반 3D 회전|X, Y, Z, W (float)| Gimbal Lock 없음, 고급 회전|
|FTransform |위치, 회전, 스케일 통합 변환 |위치, 회전, 스케일 구조체| Actor 변환, 부모-자식 변환 관리|

**참고 링크**
- [UE4 Transform Calculus](https://nerivec.github.io/old-ue4-wiki/pages/ue4-transform-calculus-part-1.html)
- [Vectors](https://www.mathsisfun.com/algebra/vectors.html)
- [Roll, Pitch, Yaw](https://howthingsfly.si.edu/flight-dynamics/roll-pitch-and-yaw)
- [Quaternion](https://en.wikipedia.org/wiki/Quaternion)
- [Gimbal lock](https://en.wikipedia.org/wiki/Gimbal_lock)
