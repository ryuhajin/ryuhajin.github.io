---
layout: default
title: "Episode 1 - 10"
parent: "UE4 Materials 101"
nav_order: 2
---

## material

머테리얼 에디터 아래의 통계 읽는법 추가하기

---

## Metallic
- base color
- specular

---
# Node function

### floats
- constant : 하나의 값 (메탈릭, 러프니스, 베이스 컬러, 스페큘라같은 곳에 쓰임)
- constant 2Vector : U,V 와 같은 곳에 쓰임
- constant 3Vector : RGB or vector
- constant 4Vector : alpha

### 개수가 다른 float끼리 더하고 곱셈하기
1. floats : 0.2
2. floats[2] : R 0.5, G 0.3
3. add 노드 사용
-> floats의 값이 floats[2]의 [0],[1]에 모두 더해짐

> Vector2와 Vector3를 합하면 error
> - 이럴 때 마스크로 활용

### Masks
r,g,b,a 체크로 가져올 input 체크하기
- R에 체크 : R 값만 가져옴

### Append / Append Many
vector2에 floats push -> vector3

### swizzle
벡터의 구성 요소(component) 순서를 재배열하거나 특정 요소만 선택하여 새로운 벡터를 만든다

1. 선택 (Selection): 여러 채널 중 특정 채널 하나만 가져오기
2. 재배열 (Reordering): 채널들의 순서 바꾸기
3. 복제 (Duplication): 하나의 채널을 여러 번 사용하여 새로운 벡터 만들기
4. 조합 (Combination): 위 기능들을 모두 활용하여 원하는 대로 새로운 벡터를 생성

RGBA에서 (A, R, G) 라는 새로운 Vector3 만들기

### split Component
Vector2, Vector3와 같은 벡터 타입을 입력으로 받아, 그 안에 포함된 각 채널(R, G, B, A)을 별개의 float 출력 핀으로 나눔

### debug float value
디버깅용. base color에 넣고 값 확인 가능

---

# UV control

## 파이프라인 연결 예

```
[TextureCoordinate] → [Texture Sample] → [Base Color]
```

## hlsl 예시

```hlsl
float2 uv = input.TexCoord0.xy;                    // TextureCoordinate
float4 color = MyTexture.Sample(MySampler, uv);    // Texture Sample
return color;                                      // Base Color 출력
```

## TextureCoordinate
TextureCoordinate = "좌표 공급자" (데이터만 제공)

## TextureCoordinate 노드가 input이 없는 것처럼 보이는 이유
1. 메시 데이터에 포함된 UV
- 모델링 툴에서 내보낸 메시에는 **버텍스 속성(attribute)**들이 들어 있음.
- 위치 (Position) / 법선 (Normal) / UV 좌표 (TexCoord0, TexCoord1, …) / 색상(Vertex Color) 등
- GPU는 이 속성을 **버텍스 버퍼(vertex buffer)**에 저장하고, 버텍스 셰이더에 전달
2. 셰이더 파이프라인에서의 UV 전달
- 버텍스 셰이더 입력: 메시 버텍스 버퍼에서 TEXCOORD0, TEXCOORD1 같은 UV 세트가 들어옴. 보통 여기서는 UV에 대한 연산 없이 그대로 출력 구조체에 담음.
- 래스터라이저: 삼각형 내부 픽셀마다 바리센트릭 좌표를 사용해 전달된 UV를 보간. 일반적으로 투영 보정(perspective-correct interpolation) 포함.
- 픽셀 셰이더 입력: 보간된 UV가 input.TexCoord0 형태로 들어옴. 여기서 샘플러에 전달 가능.
3. Unreal의 TextureCoordinate 노드
- 머티리얼 그래프의 TextureCoordinate 노드는 추가 연산 없이 이 UV 입력을 그대로 참조하는 래퍼.
- 단순히 메시에서 이미 넘어오는 **TexCoord[n]**을 가져와서 옵션(타일링/오프셋)을 곱해주는 것.

---

## Texture Sample
Texture Sample 노드 = GPU의 Texture2D.Sample 호출을 래핑한 것

- Texture Sample = "샘플러" (실제 텍스처 메모리에서 읽음)

```hlsl
float4 color = Texture2D.Sample(SamplerState, uv);
```

- Texture2D: GPU 메모리에 올라간 텍스처 객체.
- SamplerState: 필터링(Nearest, Bilinear, Trilinear, Anisotropic)과 주소 모드(Wrap, Clamp 등)를 정의.
- uv: 픽셀 셰이더 입력에서 넘어온 보간된 UV.

---

## 정리
- 버텍스 → “내가 UV 공간의 어디에 붙어야 하는지” 정보 가짐
- TextureCoordinate → 그 UV 좌표를 가져와서 머티리얼 그래프의 다른 노드들이 쓸 수 있게 출력
- Texture Sample → UV 좌표를 사용해 텍스처 버퍼에서 색을 읽음

---


## time
머티리얼이 렌더링되는 동안의 경과 시간을 제공

- CPU가 마련해 둔 시간 값을 셰이더(GPU)에서 손쉽게 꺼내 쓸 수 있도록 함

```c++
float t = MaterialParameters.Time;  // 엔진에서 넘겨주는 시간 값
```

- 출력: float (단일 값)
- 단위: 초(second)
- 값: 게임 실행 시점(또는 머티리얼이 처음 활성화된 시점)부터 누적된 시간
- GPU 셰이더로 전달될 때는 보통 GameTime 같은 전역 유니폼 값으로 들어감

## 활용
- 스크롤링 텍스쳐

```c++
UV = TexCoord + float2(Time * Speed, 0);
```

- 펄싱/사인 웨이브 효과

```c++
Glow = abs(sin(Time * Frequency));
```

- 노이즈 애니메이션 : 노이즈 텍스쳐 uv에 time을 곱해 움직히는 패턴 구현

---  

# Flipbook Animation

## Animation FPS
머티리얼에서 FPS라고 쓰는 건 사실 애니메이션 재생 속도를 의미하는 가상의 프레임레이트. 실제 렌더링 FPS와는 독립적

```c++
Frame = floor(Time * FPS) % N // n = 스프라이트 시트의 전체 프레임 개수
```

- 여기서 FPS는 1초 동안 몇 개의 스프라이트 칸을 넘길지를 의미
- 렌더링 FPS에 상관없이 애니메이션을 1초에 12장(12 FPS)의 속도로 재생하라고 명령한 것

## Flipbook
내장 함수. time과 행, 열 값을 받음

# Flipbook 효과 직접 만들기
## frac
숫자의 소수점 부분만 반환

- 0~1 사이의 주기적 패턴에 매우 유용
- UV 스크롤이나 간단한 펄스 생성에 사용

```c++
Frac(3.7) = 0.7
Frac(-2.3) = 0.7  // 주의: 음수일 때 결과가 양수
```

---

## floor
소수점 이하를 버리고 정수만 남김 (항상 내림)

```c++
Floor(3.0) = 3.0
Floor(3.2) = 3.0
Floor(3.7) = 3.0
Floor(3.999) = 3.0
Floor(-2.3) = -3.0  // 주의: 음수일 때 더 작은 수로 내림
```

### Floor vs 다른 정수화 노드 비교

입력값 |	Floor (내림)|Ceil (올림)|	Round (반올림)|
2.1	|2.0 | 3.0	|2.0|
2.5	|2.0	|3.0|	3.0|
2.9	|2.0	|3.0|	3.0|
-1.2	|-2.0	|-1.0|-1.0|

**플립북에는 왜 Floor를 사용하나?**
1. 시간이 흐르면서 프레임이 순차적으로 증가해야 함
2. Ceil을 사용하면 프레임이 도약하는 문제 발생
3. Round를 사용하면 2.5초 때 3번 프레임으로 점프하는 불연속 발생

---

## Modulo
언리얼의 실수 modulo는 C의 fmod 계열이라 피제수(첫 인자)의 부호를 따름

```c++
// 주의: y == 0이면 정의되지 않음
float r = FMath::Fmod(x, y);
if (r < 0) r += FMath::Abs(y);
```

### Modulo vs Clamp 비교

|연산	| 결과	| 용도| 
|Modulo	| 0,1,2,3,0,1,2,3,...	| 무한 반복 애니메이션|
|Clamp	| 0,1,2,3,3,3,3,3,...	| 한 번 재생하고 정지하는 애니메이션|

---

## fmod
부동소수점 숫자를 위한 나머지 연산

```c++
fmod( 7.5, -3.0) =  1.5  // 피제수가 양수면 결과 양수
fmod(-7.5,  3.0) = -1.5  // 피제수가 음수면 결과 음수
```

---

## param
1. Scalar Parameter : float
2. Vector Parameter : Vec3 → A 무시 / Vec2 → ComponentMask RG로 사용
3. Material Parameter Collection(MPC) : 전역 공유 값
4. Named Reroute (Declaration/Usage) : Vec2/Vec3/Vec4 모두 가능. 인스턴스에서 값 조절은 불가

---

