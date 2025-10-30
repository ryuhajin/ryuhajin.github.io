---
layout: default
title: "Material"
parent: "Unreal Engine 5"
nav_order: 4
has_children: true
---

# Material

**메뉴얼 링크**
- [material concepts](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/essential-unreal-engine-material-concepts)
- [Material Blend Modes](https://dev.epicgames.com/documentation/en-us/unreal-engine/material-blend-modes-in-unreal-engine)

---

## shortcut key

| 단축키           | 표현식 노드                    | 설명                  |
| ------------- | ------------------------- | ------------------- |
| **A**         | Add                       | 두 값 더하기             |
| **B**         | BumpOffset                | 텍스처 좌표를 시차 기반으로 오프셋 |
| **C**         | Comment                   | 코멘트 박스 생성           |
| **D**         | Divide                    | 나누기                 |
| **E**         | Power                     | 거듭제곱 연산             |
| **F**         | Material Function Call    | 머티리얼 함수 호출          |
| **I**         | If                        | 조건 분기 처리            |
| **L**         | Linear Interpolate (Lerp) | 선형 보간               |
| **M**         | Multiply                  | 곱셈                  |
| **N**         | Normalize                 | 벡터 정규화              |
| **O**         | OneMinus                  | 1 - 입력값             |
| **P**         | Panner                    | 텍스처 UV 이동           |
| **R**         | Reflection Vector         | 반사 벡터 생성            |
| **S**         | Scalar Parameter          | 파라미터화된 스칼라 값        |
| **T**         | Texture Sample            | 텍스처 샘플링             |
| **U**         | Texture Coordinate        | UV 좌표 제어            |
| **V**         | Vector Parameter          | 파라미터화된 벡터 값         |
| **1**         | Constant                  | 단일 실수 값             |
| **2**         | Constant2Vector           | 2D 벡터 값             |
| **3**         | Constant3Vector           | 3D 벡터 값 (색상 자주 사용)  |
| **4**         | Constant4Vector           | 4D 벡터 값             |
| **Shift + C** | Component Mask            | RGB 채널 마스크          |

---

# Material Details

---

# blend mode
머티리얼의 색상이 **배경과 어떻게 혼합되는지를 결정**

**각 블렌드 모드 반사광 확인용**
![](/images/UE_blendmode1.jpeg)
![](/images/UE_blendmode2.jpeg)

---

## Opaque (불투명)
머티리얼 출력값이 **화면 뒤의 픽셀과 블렌딩되지 않고 완전 덮어씀**

```
Final color = Source color
```

- 조명 및 깊이 정보, Z-prepass 등의 최적화가 가능하며 **대부분의 일반적 표면(금속, 플라스틱, 돌 등)에 사용**
- **투명도를 갖는 머티리얼이 아님**
- 따라서 렌더링 순서(Ordering) 문제, 뒤에 있는 객체가 보이는 문제 등을 신경 쓸 필요 적음

### 활용 예시
1. 건물 벽, 바닥, 캐릭터 복장 등의 일반적이고 완전 불투명한 오브젝트
2. 렌더링에서 깊이 정보 이용한 그림자, 반사, 굴절 등이 필요한 경우
3. 퍼포먼스가 중요한 영역에서는 기본으로 선택할 모드

### 주의사항

```
투명하거나 반투명한 효과가 필요할 경우 사용 불가

머티리얼 내부에 Opacity(불투명도) 입력을 사용해도, Blend Mode가 Opaque이면 무시되거나 동작하지 않을 수 있음
```

---

## Masked (알파 컷오프/알파 테스트)
Opacity Mask 입력을 사용해 **픽셀을 100% 그리거나(Opaque), 100% 그리지 않는다 (Transparent)**

```
Final color = Source color

if (OpacityMask > OpacityMaskClipValue)
```

- 중간 투명도는 허용되지 않음 (참/거짓 이진 투명도)
- **마스크 모드에서 제거된 픽셀은 그려지지 않음. 따라서 그려지지 않은 곳은 어떤 반사도 볼 수 없음**

### 활용 예시
1. 사슬망이나 울타리처럼 구멍이 많이 있는 구조물
2. 나뭇잎이나 덩굴처럼 뚫린 형상을 가진 표면
3. 투명도 변화 없이 단순히 보이거나 안 보이게 처리하고자 할 때

### 주의사항

```
중간 단계의 반투명(예: 반쯤 보이는 모습)은 지원하지 않음. 반투명 효과가 필요하다면 Translucent 등이 적합

Masked 모드는 Z-prepass 최적화 효과가 크나, 너무 복잡한 마스크 텍스처나 오버드로우가 많으면 성능이 저하될 수 있음
```

---

## Translucent (반투명)
머리티리얼이 화면 뒤의 픽셀과 Opacity 값에 따라(0~1) 블렌딩

```
FinalColor = SourceColor × Opacity + DestColor × (1 − Opacity)
```

### 활용 예시
1. 유리 창, 플라스틱 커버, 물방울, 안개 효과 등
2. 파티클 시스템의 연기, 먼지, 흐림 효과 등 다양한 반투명 시각 효과
3. UI 요소 중 투명도를 가진 요소

### 주의사항

```
투명물체끼리 겹칠 때 올바른 깊이 처리 문제가 발생할 수 있다

성능 비용이 상대적으로 높을 수 있다 (특히 많은 픽셀/오버드로우)

스펙큘러(반사)나 그림자 처리가 일반 불투명 처리에 비해 제한적이다
```

---

## Additive (덧셈 블렌드)
머티리얼 **색상(source)과 배경 색상(dest)이 더해진다**

```
FinalColor = SourceColor + DestColor
```

- **검정(0,0,0)이 있는 곳은 배경이 그대로 보이고, 색상이 있는 부분은 가산**

### 활용 예시
1. 불꽃, 발광 효과(glow), 홀로그램, 마법 효과 등 밝게 빛나는 효과
2. 파티클 이펙트에서 오버레이 효과로 많이 사용됨

---

## Modulate (곱셈 블렌드)
머티리얼 **색상(source)과 배경 색상(dest)이 곱해짐**

```
FinalColor = SourceColor × DestColor
```

### 활용 예시
1. 파티클 이펙트 중 어두운 오버레이, 스모크, 그림자 느낌을 강조하는 효과
2. 배경 텍스처와 색상을 조합해 분위기 조명이나 색감 필터를 만드는 경우

### 주의사항

```
일반 모델링된 표면(material)보다는 언리얼 엔진 상에서 ‘이펙트’ 또는 디칼 영역에서 더 적합

곱셈으로 인해 색이 매우 어두워질 수 있으므로 밝기 조절이 필요

깊이 쓰기/조명 등이 제한될 수 있으므로 쓰임을 정확히 이해하고 사용해야 함
```

---

## Alpha Composite (프리멀티플라이드 알파 블렌드)
머티리얼의 어느 부분을 가산적으로 블렌딩하고, 어느 부분을 재료의 불투명도를 이용해 반투명하게 블렌딩할지 수동으로 지정

```
FinalColor = SourceColor + DestColor × (1 − SourceOpacity)
```

### 활용 예시
파티클 및 이펙트에서 배경이 밝거나 여러 겹이 겹치는 상황에서 디테일이 사라지는 문제를 줄이고자 할 때

### 주의사항

```
텍스처가 미리 Premultiplied alpha 상태인지 확인해야 함 (색상 * 알파가 이미 곱해져 있어야 기대한 대로 작동)
```

---

## Alpha Holdout
색상을 그리는 대신, 자신의 알파 값만큼 배경을 '지우는' 역할. 즉, 화면에 '구멍'을 뚫는다

- **이 블렌드 모드는 Unlit 셰이딩 모델을 사용해야 함**

```
FinalColor = DestColor × (1 − SourceOpacity)
```
