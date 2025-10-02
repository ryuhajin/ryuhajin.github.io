---
layout: default
title: "Episode 1 - 4"
parent: "EP [1 , 10]"
nav_order: 2
---

# EP 1 : What is a shader? 
셰이더는 픽셀의 색을 계산하는 코드
- GPU에서 실행되며, 결과적으로 화면에 보이는 픽셀의 속성을 결정
- 예전에는 HLSL 같은 코드로 작성했지만, 언리얼 엔진에서는 노드 기반 Material Editor로 시각적으로 제작 가능

## 셰이더의 역할 변화
- **과거**
  - 셰이더가 표면 속성과 조명(빛)까지 모두 담당
- **현재**
  - PBR(Physically Based Rendering) 사용
  - 셰이더 = 표면 속성만 담당 (Base Color, Normal, Roughness, Metallic 등)
  - 엔진 = 조명, 반사, 그림자 등 광원 계산

> 따라서 표면 속성(Material)과 조명(Lighting)을 섞지 말아야 함

## 언리얼 머티리얼 에디터 기본 구조
1. 좌측 상단 미리보기 창
  - 구, 원기둥, 평면 등 모델에 셰이더 적용 결과 확인
2. 뷰포트 설정
  - 시점 변경, Lit/Unlit 모드, 그리드/배경 표시 On/Off
3. 좌측 하단 속성 패널
  - 선택한 노드의 속성 표시
4. 하단 Stats 패널
  - GPU에서 실행되는 연산 수(Instruction) 표시 → 최적화에 활용
5. 우측 팔레트 (노트 리스트)
  - 모든 셰이더 노드 목록. 하지만 보통은 빈 화면에서 우클릭 후 검색하여 바로 노드 추가

---

## 좌표 용어 정리

| 접미사| 풀네임| 좌표 공간 설명   | 예시 노드  | 주요 용도|
| --- | --- | --- | --- | --- |
| **WS** | World Space| 월드 좌표계 (월드 원점(0,0,0), 월드 축 기준) | `PixelNormalWS`, `AbsoluteWorldPosition`, `CameraVectorWS` | 프레넬, 림라이트, 거리 계산, 월드 정렬 텍스처  |
| **OS** | Object Space   | 오브젝트(메시) 자체의 로컬 좌표계| `ObjectPosition`, `ObjectOrientation`  | 오브젝트 로컬 기준 이펙트 (예: 메시 기반 패턴) |
| **TS** | Tangent Space  | 표면의 탄젠트/바이노멀/노멀 축으로 정의된 로컬 좌표계 | `TextureCoordinate`, `TangentSpaceNormal`  | 노멀맵, POM, 애니소트로픽 |
| **VS** | View Space (종종 사용) | 카메라 기준 좌표계 (카메라가 원점)   | 일반 노드에선 잘 안 보임, HLSL에서 자주 사용   | 스크린 공간 효과, 화면 기반 변환  |
| **CS** | Clip/Camera Space  | 클립 공간(투영 좌표) (-1에서 1 사이의 정규화된 공간)  | `ScreenPosition`   | 화면 UV, GrabPass, 포스트 프로세싱|
| **SS** | Screen Space   | 정규화된 스크린 좌표 (0~1 UV)   | `ScreenPosition`의 xy   | 화면 기반 마스크, 포스트 효과|

---

# EP 2 : Basics if PBR

## PBR 개요
PBR = Physically Based Rendering (물리 기반 렌더링)

- 목적: 단순히 빛의 “모습”을 흉내내는 것이 아니라 실제 빛의 물리적 거동을 모델링
- 장점: 기존 방식보다 훨씬 현실적인 그래픽 구현 가능

**두 구성 요소**
1. 빛(Light Properties) → 엔진이 계산
2. 표면(Surface Properties) → 아티스트가 머티리얼에서 정의

---

## 빛의 종류
**광원**
- Direct Light: 광원 → 표면 직진
- Indirect Light: 주변 환경에서 반사 · 산란 후 도달

**표면 반응**
- Diffuse: 산란
- Specular: 한 방향으로 반사

이 조합으로 4종류 구분

- Direct Diffuse
- Direct Specular
- Indirect Diffuse (주로 라이트맵으로 베이크)
- Indirect Specular (반사, 레이 트레이싱 등)

---

## Surface Properties (머티리얼 소켓)

### Base Color
표면의 Diffuse 색상 정의

**규칙**
- RGB 값 20–240 (sRGB) 범위 유지
- 지나치게 어둡거나 밝으면 조명이 올바르게 반응하지 않음
- Rough한 표면은 최소 50 이상 권장

> 베이스 텍스처에는 광원/그림자/AO 정보 포함 금지. 단순하고 평평해야 함

### Normal
표면의 세부 형상 정의

- RGB 값은 색상이 아니라 **벡터 방향(XYZ)**을 저장
- 반드시 하이폴리 → 로우폴리 베이킹으로 생성. 직접 페인팅하면 오류 발생

### Specular
표면의 반사율 제어

- 기본값 0.5 = 약 4% 반사 (대부분의 비금속 물체)
- 최대값 1 = 약 8% 반사 (예: 크리스털)
- 프레넬 효과: 정면에서는 낮은 반사율, 측면에서는 자동으로 100% 반사

일반적으로 값 고정(0.5) → 기본 반사율. 크리비스(crevice) 영역 (오목한 부분 / 틈·균열·구멍) 에서는 낮게 설정

### Roughness
미세 표면 거칠기 제어

- 0 = 매끈(거울 반사)
- 1 = 거칠음(흐릿한 반사)

Roughness 맵은 아티스트의 창의적 표현 영역. 표면 마모, 긁힘, 사용 흔적 반영

### Metallic
금속 여부(흑백 맵) 결정

- 0 = 비금속
- 1 = 금속

**특징**
구분	| Metallic = 0 (비금속) | 	Metallic = 1 (금속) | 
Base Color  | 	Diffuse Color (재질의 고유색)	 |  Specular Color (반사광의 색) |  
Diffuse	 |  Base Color 맵의 값을 따름  | 	검은색으로 고정  | 
Specular  |  흰색 (강도는 약 4%로 고정)	 |  Base Color 맵의 값을 따름 | 

> Metallic 맵은 Base Color 맵의 데이터를 'Diffuse'로 해석할지, 아니면 'Specular'로 해석할지를 결정하는 스위치

주의
1. 금속 맵은 흑백으로만 (회색값은 비현실적)
2. 금속 Base Color는 반드시 밝은 값(≥180 sRGB). 어두운 금속은 존재하지 않음

### Ambient Occlusion (AO)
간접광(Diffuse Light)이 틈새에 들어가지 않도록 보정

- GI(Global Illumination) 베이크 시에만 적용
- 단독으로는 프리뷰에서 효과 안 보임

---

# EP 3 : What are Data Types?

**왜 데이터 타입이 중요한가**
- 소켓별 허용 타입이 정해져 있음 → 맞지 않으면 연결 불가
- 어떤 소켓은 타입을 맞추지 않아도 연결되지만, 실제로는 일부 값만 사용하고 나머지는 버려짐
- 여러 데이터를 합쳐서 한 번에 계산하면 연산 효율↑

## 기본 데이터 타입
- Float → 1채널 (Metallic, Roughness, Specular) / constant 
- Float2 → 2채널 (UV 좌표) / constant Vector 2
- Float3 → 3채널 (Color, Normal 등)
- Float4 → 4채널 (Color + Alpha)

> 연산 규칙: 같은 타입끼리 가능, Float은 어디든 더할 수 있음
> - 하지만 Float2 ↔ Float3 ↔ Float4 사이에는 직접 연산 불가

## 가공 방법
1. Append / AppendMany → 채널 합치기
2. Mask / Split Components → 채널 분리
3. Swizzle → 채널 순서 바꾸기

### Masks
r,g,b,a 체크로 가져올 input 체크하기
- R에 체크 : R 값만 가져옴

### split Component
Vector2, Vector3와 같은 벡터 타입을 입력으로 받아, 그 안에 포함된 각 채널(R, G, B, A)을 별개의 float 출력 핀으로 나눔

### Append / Append Many
vector2에 floats push -> vector3

### swizzle
벡터의 구성 요소(component) 순서를 재배열하거나 특정 요소만 선택하여 새로운 벡터를 만든다

1. 선택 (Selection): 여러 채널 중 특정 채널 하나만 가져오기
2. 재배열 (Reordering): 채널들의 순서 바꾸기
3. 복제 (Duplication): 하나의 채널을 여러 번 사용하여 새로운 벡터 만들기
4. 조합 (Combination): 위 기능들을 모두 활용하여 원하는 대로 새로운 벡터를 생성

RGBA에서 (A, R, G) 라는 새로운 Vector3 만들기

### debug float value
디버깅용. base color에 넣고 값 확인 가능

---

# EP 4. Distortion Shader
Distortion Shader(왜곡 셰이더)를 제작해 UV 좌표 조작하기

## 파이프라인 연결 예

```
[TextureCoordinate] → [Texture Sample] → [Base Color]
```

## hlsl 예시

```hlsl
float2 uv = input.TexCoord0.xy;                     // TextureCoordinate
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

## TextureCoordinate mul

### UV 좌표와 샘플링
텍스처 샘플링은 **UV 좌표 (0~1)** 기준

- U가 0 → 1이면 텍스처의 가로 전체가 딱 한 번 샘플
- V가 0 → 1이면 텍스처의 세로 전체가 한 번 샘플

### 곱셈의 의미
UV에 2.0을 곱할 때

$$ U' = 2 \cdot U$$

U의 0 → 1 범위는 0 → 2로 바뀜
- 하지만 텍스처는 여전히 0 ~ 1 범위에서 래핑 (Address Mode가 Wrap일 때)
- 결과 : 0 ~ 1에서 한 번, 1 ~ 2에서 또 한 번 → 두 번 반복

반대로 0.2를 곱하면

$$ U' = 0.5 \cdot U$$

- 0 → 1 범위가 0 → 0.5로 축소
- 텍스처 좌표의 절반만 쓰게 됨
- 결과 : 텍스처가 늘어나서 확대된 것처럼 보임

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
