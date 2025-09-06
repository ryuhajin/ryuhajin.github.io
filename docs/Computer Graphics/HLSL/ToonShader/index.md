---
layout: default
title: "ToonShader"
parent: "HLSL"
nav_order: 4
has_children: true
---

# ToonShader
HLSL로 툰 쉐이더 구현해보자

---

## Cel Shading
툰 셰이더(Cel Shading)의 핵심은 **빛의 세기를 몇 개의 단계로 단순화(discretize)**하여 만화 같은 느낌을 내는 것

1. 기본 명암 계산: 먼저 일반적인 3D 셰이더처럼 빛의 방향과 물체 표면의 방향(법선 벡터)을 내적(dot
   product)하여 빛의 세기(lightIntensity, 0.0 ~ 1.0 사이)를 계산합니다. 값이 1에 가까울수록 빛을 정면으로
   받는 밝은 부분

2. 명암 단계화 (핵심): 계산된 빛의 세기를 연속적인 값(gradient)으로 사용하지 않고, if 문이나 step 함수를
   사용해 몇 개의 정해진 값으로 뚝뚝 끊어줍니다.
    * 예: lightIntensity가 0.9보다 크면 -> 1.0 (가장 밝음)
    * lightIntensity가 0.5보다 크면 -> 0.7 (중간 밝기)
    * lightIntensity가 0.2보다 크면 -> 0.3 (어두움)
    * 그 외 -> 0.1 (가장 어두움)
   이렇게 하면 부드러운 명암 대신 만화처럼 경계가 명확한 그림자 덩어리가 생깁니다.

   1. 최종 색상 조합: 단계별로 나뉜 명암 값(lightIntensity)을 이용해 최종 색상을 만듭니다.
       * 주변광(Ambient): 빛이 직접 닿지 않는 부분의 기본 밝기를 더해줍니다.
       * 분산광(Diffuse): 위에서 계산한 단계별 명암과 곱해져 그림자 색을 결정합니다.
       * 텍스처 색상(Texture): 물체의 기본 색상(돌 질감 등)을 여기에 곱해줍니다.
       * 최종 색상 = (주변광 + 분산광 * 단계명암) * 텍스처 색상

---

outline.vs
  이 정점 셰이더의 역할은 모델의 정점들을 각 정점의 법선(normal) 방향으로 살짝 밀어내어 모델을 크게 만드는
  것

 outline.ps
  이 픽셀 셰이더의 역할은 매우 간단. 화면에 그려지는 모든 픽셀을 그냥 검은색으로 칠함

---

## 림 라이팅(Rim Lighting)

아, 그렇군요! 정반사광(specular)이 아니라 모델의 어두운 영역을 감싸는 듯한 후광 효과를 원하시는군요.

  그 효과는 일반적으로 림 라이팅(Rim Lighting) 이라고 부릅니다.

  마치 모델 뒤에서 조명을 비추는 것처럼, 물체의 가장자리(테두리)를 밝게 빛나게 해서 입체감을 살리고 배경과
  분리시켜주는 역할을 합니다. '후광', '역광(Backlight)' 또는 스타일을 살린 '프레넬(Fresnel) 효과'라고도
  불립니다.

  림 라이팅의 원리

  림 라이팅은 빛의 방향이 아니라 카메라(시점)와 물체 표면이 이루는 각도를 이용해 계산합니다.

   * 카메라가 물체의 표면을 정면으로 바라볼 때는 효과가 나타나지 않습니다.
   * 카메라가 물체의 가장자리, 즉 둥근 표면이 꺾이는 부분을 비스듬히 바라볼 때 빛이 강하게 나타납니다.

  구현 방법

  놀랍게도, 림 라이팅을 구현하는 방법은 제가 이전에 설명드렸던 반사광 구현 방법과 거의 동일합니다. 왜냐하면
  림 라이팅 역시 계산을 위해 카메라의 위치 정보가 필요하기 때문입니다.

  C++ 코드에서 카메라 위치와 '림 라이트 색상/강도'를 셰이더로 넘겨주고, 픽셀 셰이더에서 그 값들을 이용해
  계산 방식만 살짝 바꿔주면 됩니다.

  픽셀 셰이더(`toon.ps`)에서의 계산 예시:

    1 // 1. 뷰 방향 계산 (카메라 위치 - 픽셀의 월드 위치)
    2 float3 viewDir = normalize(cameraPosition - input.worldPosition);
    3
    4 // 2. 뷰 방향과 법선 벡터를 내적
    5 //    (가장자리에 가까울수록 내적 결과가 0에 가까워짐)
    6 float rimDot = dot(viewDir, input.normal);
    7
    8 // 3. 1에서 내적값을 빼서 가장자리일수록 1에 가까운 값을 얻음
    9 float rimIntensity = 1.0 - saturate(rimDot);
   10
   11 // 4. pow() 함수로 빛의 두께(날카로움)를 조절
   12 rimIntensity = pow(rimIntensity, rimPower); // rimPower는 C++에서 전달
   13
   14 // 5. 최종 색상에 림 라이트 색상을 더함
   15 //    사용자께서 말씀하신대로, 어두운 부분에만 더해줄 수도 있습니다.
   16 if(lightIntensity < 0.5f) // 툰 셰이딩의 조명 강도가 특정 값보다 낮을 때만
   17 {
   18     finalColor.rgb += rimColor.rgb * rimIntensity;
   19 }

---

## 림 라이트(Rim Light) 구현

  림 라이트는 모델의 외곽선을 밝게 강조하여 배경과 분리시켜주고, 입체감과 스타일리시한 느낌을 더해주는
  효과입니다.

  림 라이트의 핵심 아이디어는 매우 간단합니다.

  > "표면이 내 시선 방향과 거의 수직일 때 (즉, 모델의 가장자리 부분일 때) 빛이 나게 한다."

  1. 필요한 벡터들
   * N: 표면의 노멀 벡터 (표면이 바라보는 방향)
   * V: 시선 방향 벡터 (표면에서 카메라(눈)로 향하는 방향)

  2. 림 라이트 세기(`Rim Intensity`) 계산 공식

  노멀 벡터 N과 시선 벡터 V가 얼마나 수직에 가까운지를 계산합니다. dot(N, V)는 두 벡터가 같은 방향일수록 1,
  수직일수록 0, 반대 방향일수록 -1이 됩니다. 우리는 수직일 때(0) 가장 강한 효과를 원합니다.

  dot 결과가 0일 때 1이 되고, 1일 때 0이 되도록 만드는 가장 간단한 방법은 1.0 - dot(N, V) 입니다.

  Rim Intensity = 1.0 - saturate(dot(N, V))

   * dot(N, V)가 1에 가까우면 (정면을 바라봄) -> Rim Intensity는 0에 가까워집니다. (빛 없음)
   * dot(N, V)가 0에 가까우면 (가장자리에 위치) -> Rim Intensity는 1에 가까워집니다. (가장 밝은 빛)
   * saturate()는 dot 결과가 음수가 되는 뒷면을 0으로 처리해 줍니다.

  3. 림 라이트 두께(`Rim Factor`) 조절 공식

  위에서 구한 Rim Intensity를 rimPower(또는 rimWidth) 값으로 거듭제곱하여 림 라이트의 두께와 선명도를
  조절합니다. rimPower 값이 클수록 림 라이트의 두께는 더 얇고 날카로워집니다.

  Rim Factor = pow(Rim Intensity, rimPower)

  ---

  HLSL 코드 예시

  픽셀 셰이더(toon.ps) 내에서 아래와 같이 구현할 수 있습니다.

    1 // --- 입력 변수 (상수 버퍼나 다른 곳에서 미리 계산되어 넘어옴) ---
    2 // float3 input.normal      : 픽셀의 노멀 벡터
    3 // float3 viewDir           : 정규화된 시선 방향 벡터 (표면 -> 카메라)
    4 // float4 rimColor          : 림 라이트의 색상
    5 // float  rimPower          : 림 라이트의 두께/세기 (예: 2.0, 3.0 ...)
    6
    7
    8 // --- 림 라이트 계산 과정 ---
    9
   10 // 1. 노멀(N)과 시선(V) 벡터를 내적합니다.
   11 float rimDot = dot(input.normal, viewDir);
   12
   13 // 2. 림 라이트의 기본 세기를 계산합니다. (가장자리일수록 1에 가까워짐)
   14 float rimIntensity = 1.0 - saturate(rimDot);
   15
   16 // 3. pow 함수를 이용해 림 라이트의 두께와 세기를 조절합니다.
   17 float rimFactor = pow(rimIntensity, rimPower);
   18
   19
   20 // (선택) 툰 스타일처럼 딱딱한 림 라이트를 원한다면 step 함수를 사용할 수 있습니다.
   21 // float rimFactorToon = step(0.5f, rimFactor); // rimFactor가 0.5를 넘으면 1, 아니면 0
   22
   23
   24 // 4. 최종 림 라이트 색상을 계산합니다.
   25 float4 finalRimLight = rimFactor * rimColor;
   26
   27
   28 // --- 최종 색상 조합 ---
   29 // 이 finalRimLight 값을 최종 색상에 더해주면 됩니다.
   30 // finalColor = baseColor + finalSpecular + finalRimLight;

  요약:

   1. 1.0 - saturate(dot(N, V)) 로 시선과 수직인 가장자리 부분을 찾아내고,
   2. pow() 함수로 두께를 조절한 뒤,
   3. rimColor를 곱해 색상을 입혀주면 림 라이트가 완성됩니다.
   4. 마지막으로 이 결과를 최종 색상에 더해주면 됩니다.


---

## 상수 버퍼의 패킹 규칙(Constant Buffer Packing Rules)

컴퓨터 그래픽스에서 CPU(C++ 코드)와 GPU(HLSL 셰이더)는 서로 데이터를 주고받아야 합니다. 이때 사용하는 통로 중 하나가 바로 '상수 버퍼(Constant Buffer)'입니다. GPU는 매우 빠른 병렬 연산에 최적화되어 있어서, 데이터를 어중간한 크기로 가져오는 것보다 **정해진 큰 덩어리(chunk)**로 한 번에 가져오는 것이 훨씬 효율적입니다.

Direct3D에서는 이 '덩어리'의 기본 단위를 16바이트로 약속했습니다. 이는 float4 나 XMFLOAT4 변수 하나의 크기와 같습니다 (float 하나가 4바이트이므로 4 * 4 = 16).

### C++ 명시적으로 16바이트 규칙 맞춰주기

```c++
// C++ 쪽 구조체 정의
// DirectXMath 라이브러리를 사용하기 위해 헤더를 포함합니다.
#include <DirectXMath.h> 

// 'using namespace DirectX;'는 코드의 가독성을 높여줍니다.
// 이제 XMFLOAT3 같은 타입을 바로 사용할 수 있습니다.
using namespace DirectX;

struct CameraBufferType
{
    // 카메라의 위치를 저장하는 3차원 벡터입니다.
    // float가 3개 있으므로 크기는 12바이트 (4 * 3) 입니다.
    XMFLOAT3 cameraPosition;

    // 패딩(Padding) 변수입니다. 
    // cameraPosition (12바이트) 다음에 4바이트를 추가하여
    // 전체 구조체의 크기를 16바이트의 배수로 만들어줍니다.
    // 이는 HLSL의 16바이트 정렬 규칙을 맞추기 위함입니다.
    float padding; 
};
```

만약 padding을 추가하지 않으면 sizeof(CameraBufferType)은 12가 됩니다. 데이터를 GPU로 복사할 때, 이 구조체 여러 개가 배열로 있다면 데이터가 계속 12바이트 간격으로 이어지게 되어 GPU가 예상한 16바이트 간격과 어긋나게 됩니다. 이는 결국 렌더링 깨짐 현상으로 이어집니다.

### HLSL의 경우
HLSL 컴파일러는 이 16바이트 패킹 규칙을 이미 알고 있습니다. 따라서 프로그래머가 굳이 padding 변수를 선언하지 않아도, 알아서 다음 변수를 16바이트 경계에 배치합니다.

```HLSL
// HLSL 쪽 상수 버퍼(Constant Buffer) 정의
// cbuffer는 C++에서 보내준 데이터가 담길 공간입니다.
// register(b0)는 이 버퍼가 0번 슬롯(slot)에 바인딩됨을 의미합니다.
cbuffer CameraBuffer : register(b0)
{
    // C++의 cameraPosition 데이터가 이곳으로 복사됩니다.
    // float3는 12바이트 크기입니다.
    // HLSL 컴파일러는 이 변수 다음에 4바이트의 빈 공간이 있을 것이라고
    // '암묵적으로' 인지하고 있습니다.
    // 따라서 C++의 padding 변수와 짝이 맞는 가상의 공간이 있는 셈입니다.
    float3 cameraPosition;
};

// 아주 간단한 픽셀 셰이더 예시
float4 main(float4 pos : SV_POSITION) : SV_TARGET
{
    // 상수 버퍼에서 카메라 위치 값을 읽어옵니다.
    // 예를 들어, 카메라의 x좌표 값에 따라 다른 색을 출력할 수 있습니다.
    if (cameraPosition.x > 0)
    {
        return float4(1.0f, 0.0f, 0.0f, 1.0f); // 빨간색
    }
    else
    {
        return float4(0.0f, 0.0f, 1.0f, 1.0f); // 파란색
    }
}
```
- [hlsl-packing-rules] (https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-packing-rules)

---

# KEYWORD NOTE

# lerp

---

# step


---

# Clarity Notes
공부하며 헷갈렸던 부분 명료화 하기

---

# Color Operations in HLSL
덧셈과 곱셈은 빛과 색을 다루는 방식의 차이가 있다

---

## Multiplication (곱셈) - 빛의 반사율과 감산 혼합
물체의 색상(텍스처)은 각 색상 채널(R, G, B)의 빛을 얼마나 **반사(Reflect)**하는지를 나타내는 **반사율(Reflectance)**의 집합이다

> 물체 표면의 알베도(Albedo, 기본 색상)가 특정 파장의 빛을 얼마나 반사하는지를 나타냄

---

### Albedo = Diffuse Color = 물체의 고유 색
빛이 물체 표면에 닿았을 때 어떤 색으로 반사되는지를 결정하는 텍스처

- Albedo의 각 component (R, G, B)는 **해당 채널의 빛이 반사되는 비율**이다
- 즉, 그림자, 빛의 강도, 반사광 등 모든 효과가 제거된 **물체의 순수한 색상 정보**

```hlsl
// (순수한 빨간색): 빨간광은 100% 반사, 녹색과 파란광은 0% 반사 (완전 흡수).
albedoColor = (1.0, 0.0, 0.0) 

// (회색): 모든 빛을 50% 반사하고 50% 흡수.
albedoColor = (0.5, 0.5, 0.5)
```

---

### Component-wise Multiplication (성분별 곱셈) 예시
각 채널(R, G, B)끼리 독립적으로 곱셈을 수행

- 백색광 (White Light) : (1.0, 1.0, 1.0)
- 붉은 사과 : 반사율 (1.0, 0.1, 0.1)

---

$$
\text{Final Color} = \text{Incoming Light Color} × \text{Surface Reflectance} \\
$$

---

$$
(1.0,1.0,1.0)×(1.0,0.1,0.1) = (1.0×1.0,1.0×0.1,1.0×0.1) \\
= (1.0,0.1,0.1)
$$

---

우리 눈에는 R 성분이 강한 빛이 들어오므로 사과가 빨갛게 보임

- 물감을 섞는 것과 같은 **감산 혼합(Subtractive Color Model)**의 원리와 유사
- 물감을 섞을수록 특정 파장의 빛이 더 많이 흡수되어 어두워지는 것처럼
> 색상 곱셈은 항상 결과가 입력보다 어두워지거나 같아진다

---

## Addition (덧셈) - 광원의 중첩과 가산 혼합
여러 광원에서 출발한 빛 에너지가 한 지점에 모이면 그 지점의 총 에너지는 각 에너지의 합이 된다

- 한 픽셀이 받는 **총 빛의 양은 각 광원으로부터 오는 빛의 양을 모두 합산한 것과 같음**

```hlsl
float3 totalLighting = ambientLight;
totalLighting += diffuseLight1;
totalLighting += specularLight1;
totalLighting += diffuseLight2;
// ... (다른 광원들 추가)
```

---

$$
\text{Total Illumination} = \text{Ambient Light} + \text{Specular Light} + ... \text{다른 광원들}
$$

---

주변광, 방향광 등 서로 다른 광원들은 서로의 존재에 영향을 주지 않고 장면에 빛을 더해감

- 빛을 섞을수록 밝아지는 **가산 혼합(Additive Color Model)**의 원리와 같다
- 우리 눈이나 모니터의 RGB 픽셀이 빛을 혼합하는 방식

---

## 결론
- 곱셈 (*) = 반사율
- 덧셈 (+) = 광원 중첩

---

**참고 링크**
- [RB Whitaker's Wiki - Creating a Toon Shader](http://rbwhitaker.wikidot.com/toon-shader)
- [Basic Theory of Physically-Based Rendering](https://marmoset.co/posts/basic-theory-of-physically-based-rendering/)