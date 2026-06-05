---
layout: default
title: "SkyLight"
parent: "Dynamic Sky"
nav_order: 1
---

# Unreal Engine 기준: Directional Light / Sky Atmosphere / Volumetric Cloud / Sky Light 흐름 정리

## 0. 큰 그림

언리얼에서 하늘, 태양, 구름, 환경광은 각각 역할이 다르다.

핵심 흐름은 다음과 같다.

[Directional Light]
→ 태양/달 같은 직접광을 만든다.
→ 물체 표면에 NdotL 기반의 강한 방향성 조명을 준다.
→ 그림자를 만든다.

[Sky Atmosphere]
→ 하늘과 대기 색을 계산해서 렌더링한다.
→ 태양 방향, 대기 산란, 밀도 등의 값으로 하늘 색을 만든다.
→ 텍스처 한 장이 아니라 하늘/대기를 계산하는 렌더링 시스템이다.

[Volumetric Cloud]
→ 3D 볼륨 구름을 렌더링한다.
→ 구름의 밀도, 빛 산란, 그림자 등을 계산한다.
→ 2D 구름 그림이 아니라 공간 안에 밀도를 가진 구름을 ray marching으로 그리는 시스템이다.

[Sky Light]
→ Sky Atmosphere, Volumetric Cloud, Sky Dome, 먼 배경 등을 캡처한다.
→ 그 캡처 결과를 환경광/IBL처럼 사용한다.
→ diffuse 환경광과 specular 환경 반사에 기여한다.


---

# 1. Directional Light

## 의미

Directional Light는 태양이나 달처럼 매우 멀리 있는 광원을 표현한다.

광원이 너무 멀리 있다고 가정하기 때문에 모든 빛이 거의 같은 방향으로 평행하게 들어온다고 본다.

## 역할

- 직접광 Direct Light 담당
- 태양빛 / 달빛 표현
- 명확한 방향성 제공
- 그림자 생성
- 표면에 강한 하이라이트와 명암을 만든다

## 셰이더 감각

Directional Light는 일반적인 조명 계산과 연결된다.

예를 들어 표면 노멀 N과 빛 방향 L이 있을 때:

NdotL = max(dot(N, L), 0)

이 값으로 표면이 빛을 얼마나 정면으로 받는지 계산한다.

즉 Directional Light는 다음과 같은 직접광 계산에 가깝다.

final_direct_light = light_color * light_intensity * NdotL

## 예시

야외 낮 장면에서 태양빛이 오른쪽 위에서 들어온다면:

- 오른쪽 위를 향한 면은 밝아짐
- 반대쪽 면은 어두워짐
- 건물, 나무, 캐릭터가 그림자를 만듦

## 정리

Directional Light는 "태양 방향에서 직접 때리는 빛"이다.
환경광보다는 직접광에 해당한다.


---

# 2. Sky Atmosphere

## 의미

Sky Atmosphere는 하늘 이미지를 불러오는 기능이 아니다.

태양 방향, 대기 밀도, 산란값 등을 기반으로 하늘과 대기 색을 계산해서 렌더링하는 시스템이다.

즉, Sky Atmosphere는 "HDR 하늘 텍스처"가 아니라 "하늘/대기 렌더링 알고리즘"에 가깝다.

## 역할

- 하늘 색 생성
- 태양 주변의 밝은 영역 표현
- 노을, 낮, 밤 등의 대기 색 변화 표현
- Rayleigh Scattering, Mie Scattering 같은 대기 산란 효과 표현
- 지평선 근처의 뿌연 대기감 표현

## Directional Light와의 관계

Sky Atmosphere는 보통 Directional Light의 방향을 태양 방향으로 사용한다.

즉:

Directional Light 방향
→ 태양이 있는 방향으로 해석
→ Sky Atmosphere가 그 방향을 기준으로 하늘 색을 계산

예를 들어 태양이 낮게 있으면 노을색이 강해지고,
태양이 위에 있으면 낮 하늘처럼 보인다.

## 텍스처인가?

기본 개념상 텍스처 한 장이 아니다.

잘못된 이해:
Sky Atmosphere = HDRI 텍스처 / 원형 하늘맵

정확한 이해:
Sky Atmosphere = 대기 산란을 계산해서 하늘을 그리는 렌더링 시스템

다만 Sky Light가 Sky Atmosphere를 캡처하면,
그 결과는 큐브맵처럼 환경광/반사에 사용될 수 있다.

## 정리

Sky Atmosphere는 "하늘과 대기를 계산해서 그리는 시스템"이다.
직접 조명을 때리는 라이트가 아니라, 하늘 배경과 하늘빛의 원천이 되는 시스템이다.


---

# 3. Volumetric Cloud

## 의미

Volumetric Cloud는 구름을 2D 이미지로 붙이는 것이 아니라,
공간 안에 밀도를 가진 3D 볼륨으로 구름을 표현하는 시스템이다.

## 역할

- 입체적인 구름 렌더링
- 구름의 두께, 밀도, 산란 표현
- 구름이 태양빛을 가리거나 흩뿌리는 효과
- 하늘에 떠 있는 실제 부피감 있는 구름 표현
- 시간대나 날씨 변화와 함께 동적으로 변화 가능

## 3D Volume Texture와의 관계

Volumetric Cloud는 구름 밀도나 노이즈를 표현하기 위해 3D volume texture를 사용할 수 있다.

2D Texture:
- 좌표가 UV
- 가로, 세로로 이루어진 이미지
- 예: albedo map, normal map, roughness map

3D Volume Texture:
- 좌표가 UVW
- 가로, 세로, 깊이를 가진 부피 데이터
- 예: 구름 밀도, 안개 밀도, 3D 노이즈

구름에서는 공간의 어떤 위치에 구름 밀도가 얼마나 있는지를 샘플링한다.

## Ray Marching

Volumetric Cloud는 카메라에서 구름 방향으로 광선을 쏘고,
그 광선을 조금씩 전진시키면서 구름 밀도를 누적한다.

흐름:

카메라에서 하늘 방향으로 ray를 쏨
→ 구름 볼륨 안으로 조금 이동
→ 현재 위치의 구름 밀도 샘플링
→ 다시 조금 이동
→ 또 밀도 샘플링
→ 여러 샘플을 누적
→ 최종 구름 색과 투명도 계산

이런 방식을 ray marching이라고 한다.

## 3D LUT인가?

아니다.

3D LUT:
- 입력값 3개를 넣으면 미리 저장된 결과를 찾아오는 표
- 주로 컬러 그레이딩 등에 사용

Volumetric Cloud:
- 공간 안의 밀도와 빛 산란을 샘플링해서 구름을 렌더링하는 시스템

따라서 Volumetric Cloud는 3D LUT가 아니라 볼륨 렌더링 시스템에 가깝다.

## 정리

Volumetric Cloud는 "입체적인 구름을 렌더링하는 시스템"이다.
Sky Atmosphere가 하늘/대기를 담당한다면,
Volumetric Cloud는 그 하늘 안에 있는 구름 볼륨을 담당한다.


---

# 4. Sky Light

## 의미

Sky Light는 하늘, 구름, 먼 배경, 스카이돔 등을 캡처해서
씬 전체에 환경광으로 제공하는 라이트다.

Directional Light가 한 방향에서 오는 태양빛이라면,
Sky Light는 하늘 전체와 주변 환경에서 오는 넓은 빛이다.

## 역할

- 환경광 Ambient / IBL 역할
- 하늘빛을 씬에 제공
- 그림자 안쪽이 완전히 검게 죽지 않도록 함
- 하늘/먼 배경 기반의 diffuse lighting 제공
- 금속, 물, 유리 등에 보이는 환경 반사에 기여
- Sky Atmosphere와 Volumetric Cloud를 캡처해서 조명/반사에 사용할 수 있음

## Sky Atmosphere / Volumetric Cloud와의 관계

Sky Atmosphere와 Volumetric Cloud는 하늘과 구름을 "그리는 쪽"이다.

Sky Light는 그 결과를 "캡처해서 조명으로 쓰는 쪽"이다.

흐름:

Sky Atmosphere
→ 하늘 색 계산

Volumetric Cloud
→ 구름 렌더링

Sky Light
→ 하늘과 구름을 캡처
→ 큐브맵/환경광처럼 사용
→ diffuse 환경광과 specular 환경 반사에 사용

## IBL과의 관계

Sky Light는 언리얼에서 IBL 역할을 하는 대표적인 시스템이다.

IBL은 Image-Based Lighting의 약자로,
환경 이미지를 기반으로 조명을 계산하는 방식이다.

Sky Light는 하늘과 먼 환경을 캡처해서
그 결과를 diffuse/specular 환경 조명으로 사용한다.

즉 Sky Light는 다음과 같이 이해할 수 있다.

Sky Light = 언리얼에서 하늘 기반 IBL을 제공하는 라이트

## 베이킹인가?

상황에 따라 다르다.

Static / Stationary Sky Light:
- 빌드 또는 캡처 시점의 하늘/환경을 저장해서 사용
- 베이킹에 가까움

Movable Sky Light + Real Time Capture:
- 하늘, 구름, 시간대 변화를 실시간으로 다시 캡처 가능
- 고정 베이킹이라기보다 실시간 환경 캡처에 가까움

## 정리

Sky Light는 "하늘과 환경을 캡처해서 씬 전체에 환경광과 반사를 제공하는 라이트"다.
직접광보다는 환경광/IBL에 해당한다.


---

# 5. 직접광과 환경광으로 나누기

## 직접광 Direct Light

직접광은 명확한 광원에서 직접 들어오는 빛이다.

대표:
- Directional Light
- Point Light
- Spot Light
- Rect Light

특징:
- 빛의 위치 또는 방향이 명확함
- NdotL 계산과 연결됨
- 직접 그림자를 만듦
- 강한 명암과 하이라이트를 만듦

예시:
- 태양빛
- 전구
- 손전등
- 창문으로 들어오는 강한 빛

Directional Light는 직접광이다.


## 환경광 Environment Light / Indirect 느낌

환경광은 하늘, 주변 배경, 먼 환경 전체에서 넓게 들어오는 빛이다.

대표:
- Sky Light
- IBL
- HDRI 기반 조명
- Reflection Capture
- Lumen GI와 함께 사용되는 하늘빛

특징:
- 특정 방향 하나가 아니라 여러 방향에서 들어오는 느낌
- 그림자 안쪽을 부드럽게 밝힘
- 하늘색, 지면 반사색, 주변 색감을 제공
- 금속/물/유리 반사에 사용됨

Sky Light는 환경광이다.


---

# 6. 네 가지를 하나의 흐름으로 합치기

1. Directional Light를 배치한다.
   - 태양 역할
   - 직접광과 그림자를 만든다.

2. Sky Atmosphere를 배치한다.
   - Directional Light의 방향을 태양 방향으로 사용한다.
   - 대기 산란을 계산해서 하늘 색을 만든다.

3. Volumetric Cloud를 배치한다.
   - 하늘에 입체적인 구름을 만든다.
   - 구름은 태양빛을 가리거나 산란시킨다.

4. Sky Light를 배치한다.
   - Sky Atmosphere와 Volumetric Cloud, 스카이돔, 먼 배경을 캡처한다.
   - 그 결과를 환경광/IBL로 사용한다.
   - diffuse 환경광과 specular 환경 반사에 기여한다.

5. Lumen GI나 Reflection 시스템이 추가로 사용된다.
   - Lumen GI는 빛이 씬 내부에서 튕기는 간접광을 계산한다.
   - Lumen Reflections나 Reflection Capture는 반사를 담당한다.


---

# 7. 한 줄 요약

Directional Light:
태양처럼 한 방향에서 직접 때리는 빛. 직접광과 그림자 담당.

Sky Atmosphere:
하늘/대기 색을 계산해서 그리는 시스템. 텍스처가 아니라 대기 렌더링 알고리즘.

Volumetric Cloud:
3D 볼륨 구름을 ray marching으로 렌더링하는 시스템.

Sky Light:
하늘, 구름, 먼 배경을 캡처해서 환경광/IBL과 환경 반사에 사용하는 라이트.


---

# 8. 가장 중요한 구분

Directional Light는 빛을 직접 쏜다.
Sky Atmosphere는 하늘을 계산해서 그린다.
Volumetric Cloud는 구름을 입체적으로 그린다.
Sky Light는 그 하늘과 구름을 캡처해서 조명/반사에 쓴다.

즉:

Directional Light
= 직접광 생성

Sky Atmosphere
= 하늘 생성

Volumetric Cloud
= 구름 생성

Sky Light
= 하늘/구름/환경을 캡처해서 IBL로 사용