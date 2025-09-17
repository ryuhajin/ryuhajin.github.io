---
layout: default
title: "Forward vs Deferred"
parent: "Graphics rendering pipeline"
nav_order: 8
---

# Forward Rendering
직관적이고 전통적인 렌더링 방식으로 오브젝트(Object) 단위로 렌더링을 처리한다

- 화면에 그려야 할 **물체 하나를 가져옴**
- 그 물체에 영향을 미치는 **모든 광원(Light)을 계산하여 최종 색상을 결정**
- **그다음 물체를 가져와 이 과정을 반복**

---

## Forward Rendering 장점 vs 단점
### 장점 
1. 구현이 직관적이고 간단하다
2. **투명(Transparent) 객체나 반투명(Translucent) 객체를 처리하기 용이**하다
- 이미 그려진 배경 위에 알파 블렌딩(Alpha Blending)을 적용하면 되기 때문
3. 다양한 재질(Material)을 표현하는 데 유연하다
- **각 오브젝트마다 완전히 다른 쉐이더(Shader)를 적용하기 쉽기 때문**

### 단점
1. 광원의 수가 많아지면 성능이 급격히 저하됨
- 예를 들어, 오브젝트 100개, 광원 100개가 있다면 `100 * 100 = 10000`번의 조명 계산이 필요할 수 있음
2. 오버드로우(Overdraw) 문제가 심각할 수 있음
- 깊이 테스트(Depth Test)에 의해 **최종적으로 화면에 보이지 않을 픽셀(Fragment)에 대해서도 복잡한 조명 계산을 수행하는 낭비가 발생**

---

- N : 오브젝트 수
- M : 광원의 수

$$
O(N \times M)
$$

---

> 오브젝트의 수(N)와 광원의 수(M)에 비례하여 쉐이딩 계산량이 증가

---

- Forward Rendering 과정 코드 예시

```c++
// 이 코드는 개념을 설명하기 위한 의사 코드(Pseudo-code)

// 메인 렌더링 루프
void ForwardRender(Scene& scene) {
    // 화면을 특정 색으로 초기화
    ClearRenderTarget();
    ClearDepthBuffer();

    // 씬에 있는 모든 렌더링할 오브젝트에 대해 반복
    for (const auto& object : scene.GetObjects()) {
        
        // 이 오브젝트에 적용할 쉐이더를 활성화
        object.GetMaterial()->GetShader()->Bind();

        // 쉐이더에 필요한 데이터를 버텍스 쉐이더로 전달. (예: 월드, 뷰, 투영 행렬)
        SetShaderConstants(object.GetWorldMatrix(), viewMatrix, projectionMatrix);

        // 씬에 있는 모든 광원 정보를 픽셀 쉐이더로 전달
        // 이것이 순방향 렌더링의 핵심이며, 성능 저하의 주된 원인이 될 수 있다.
        SetShaderLights(scene.GetLights());

        // 오브젝트의 메쉬(정점 데이터)를 GPU에 그리도록 명령.
        object.GetMesh()->Draw();
    }
}
```

---

# Deferred Rendering
복잡하고 비용이 큰 조명 계산을 나중으로 미루는 방식.

- 순방향 렌더링이 다수의 광원 환경에서 겪는 성능 문제를 해결하기 위해 고안되었다

**링크**
- [openGL - Deferred Shading](https://learnopengl.com/Advanced-Lighting/Deferred-Shading)

---

## Deferred Rendering 과정
화면(Screen) 공간을 기준으로 렌더링을 처리하며, 크게 두 단계로 나뉨

### Geometry Pass (지오메트리 패스)
1. 씬의 모든 오브젝트를 렌더링하지만, **조명 계산은 전혀 하지 않음**
2. 대신, **조명 계산에 필요한 정보들을 여러 장의 텍스처에 저장**
- 예: 픽셀의 깊이(Depth), 표면 법선(Normal), 색상(Albedo), 반사율(Specular) 등
3. 이 텍스처 세트를 **G-Buffer(Geometric Buffer)**라고 부름

---

### Lighting Pass (라이팅 패스)
1. G-Buffer가 완성되면, 화면을 덮는 거대한 사각형 하나만 그림
2. 이 사각형의 **각 픽셀을 처리할 때, G-Buffer에서 해당 픽셀의 위치, 노멀, 색상 등의 정보를 읽어옴**
3. 그리고 이 정보를 사용하여 **모든 광원과의 조명 계산을 수행하여 최종 픽셀 색상을 결정**

---

## Deferred Rendering 장점 vs 단점
### 장점
1. 수많은 광원을 효율적으로 처리할 수 있다
- 조명 계산량이 **오브젝트 수와 무관하며, 화면 픽셀 수와 광원 수에만 비례함**
2. 조명 계산에 필요한 **모든 데이터를 G-Buffer에서 한 번에 가져올 수 있다**
- 데이터 지역성(Data Locality)이 좋아짐
3. SSAO(Screen Space Ambient Occlusion)와 같은 **화면 공간 기반의 후처리(Post-processing) 효과를 적용하기 용이**

### 단점
1. **투명 객체 처리가 매우 까다롭다** (블렌딩 불가)
- G-버퍼의 모든 값이 **단일 프래그먼트에서 생성**되기 때문
- **블렌딩은 여러 프래그먼트의 조합으로 작동하기 때문에 블렌딩이 불가**
2. **다양한 재질을 표현하기 어렵다**
- 모든 오브젝트가 표준화된 데이터를 제공하고, 표준화된 조명 계산을 거쳐야 한다는 제약이 따름
- 독특한 재질을 표현하려면, 지연 렌더링 파이프라인을 우회하여 해당 객체만 따로 순방향 렌더링으로 그리는 등의 추가 작업이 필요해짐
3. **메모리 대역폭(Memory Bandwidth) 사용량이 높다**
- G-Buffer를 저장하기 위해 여러 장의 큰 텍스처를 사용하기 때문
4. MSAA(Multisample Anti-aliasing)와 같은 **하드웨어 기반 안티앨리어싱을 직접 적용하기 어렵다**
- G-Buffer를 생성할 때, 각 픽셀은 단 하나의 정보(하나의 노멀, 하나의 색상 등)만을 저장
- 이 과정에서 픽셀 내부의 서브샘플들이 어디에 있었는지, 경계선이 정확히 어디를 지나갔는지에 대한 '지오메트리 정보'가 손실
- 라이팅 패스에서는  G-Buffer의 값만 읽을 뿐 원래 어떤 삼각형의 일부였는지, 픽셀 내의 경계선 정보가 어떠했는지 전혀 알지 못함
- 따라서 최종 이미지에 후처리(Post-processing) 방식으로 적용하는 **FXAA나 TAA 같은 이미지 기반 안티앨리어싱 기법에 의존**

---

- P : 화면의 총 픽셀 수 (p = screen width * screen height)
- M : 장면에 있는 총 광원의 수

$$
O(P \times M)
$$

---

> 조명 계산은 **최종 화면에 그려질 픽셀(P)**에 대해서만 한 번씩 수행
> - 오브젝트가 수백, 수천 개가 있더라도 지연 렌더링의 조명 계산 비용은 변하지 않음
> - 최종적으로 눈에 보이는 픽셀에 대해서만 계산하기 때문

---

# Deferred Rendering shader
디퍼드 렌더링은 **지오메트리 패스와 라이팅 패스 모두** 각각의 목적에 맞는 **버텍스 셰이더와 픽셀 셰이더를 사용**

## Geometry Pass
목표: 3D 모델의 정보를 G-Buffer 텍스처에 기록

- Vertex Shader

```hlsl
// GeometryPass_VS

cbuffer MatrixBuffer : register(b0)
{
    matrix worldMatrix;
    matrix viewMatrix;
    matrix projectionMatrix;
};

struct VertexInputType
{
    float3 position : POSITION;
    float2 tex      : TEXCOORD0;
    float3 normal   : NORMAL;
};

// 픽셀 셰이더로 넘겨줄 데이터 구조
struct PixelInputType
{
    float4 position   : SV_POSITION; // 클립 공간 위치 (필수)
    float2 tex        : TEXCOORD0;   // 텍스처 좌표
    float3 normal     : NORMAL;      // 월드 공간 법선
    float3 worldPos   : WORLDPOS;    // 월드 공간 위치
};

PixelInputType main(VertexInputType input)
{
    PixelInputType output;

    // 1. 정점 위치를 월드, 뷰, 프로젝션 순으로 변환
    float4 worldPos = mul(float4(input.position, 1.0f), worldMatrix);
    float4 viewPos = mul(worldPos, viewMatrix);
    output.position = mul(viewPos, projectionMatrix);

    // 2. 픽셀 셰이더에서 사용할 월드 공간 위치와 법선을 계산
    output.worldPos = worldPos.xyz;
    output.normal = normalize(mul(input.normal, (float3x3)worldMatrix));

    // 3. 텍스처 좌표 전달
    output.tex = input.tex;

    return output;
}
```

---

- Pixel Shader

```hlsl
//GeometryPass_PS

Texture2D shaderTexture : register(t0);
  SamplerState SampleType  : register(s0);

  struct PixelInputType
  {
      float4 position   : SV_POSITION;
      float2 tex        : TEXCOORD0;
      float3 normal     : NORMAL;
      float3 worldPos   : WORLDPOS;
  };

  // G-Buffer 출력을 위한 구조체 (MRT: Multiple Render Targets)
  struct GBufferOutputType
  {
      float4 worldPos : SV_Target0; // 타겟 0: 월드 위치 텍스처
      float4 albedo   : SV_Target1; // 타겟 1: Albedo 색상 텍스처
      float4 normal   : SV_Target2; // 타겟 2: 월드 법선 텍스처
  };

  GBufferOutputType main(PixelInputType input)
  {
      GBufferOutputType output;

      // 입력 데이터를 각 G-Buffer 타겟에 맞게 채워넣기
      output.worldPos = float4(input.worldPos, 1.0f);
      output.albedo = shaderTexture.Sample(SampleType, input.tex);
      output.normal = float4(normalize(input.normal), 1.0f);

      return output;
  }
```
---

## Lighting Pass
목표: G-Buffer의 정보를 읽어와 최종 조명 계산을 수행

- Vertex Shader

```hlsl
//LightingPass_VS

struct VertexInputType
{
    float3 position : POSITION;
    float2 tex      : TEXCOORD0;
};

struct PixelInputType
{
    float4 position : SV_POSITION;
    float2 tex      : TEXCOORD0;
};

PixelInputType main(VertexInputType input)
{
    PixelInputType output;

    // 이미 화면 좌표계로 정점이 들어온다고 가정하고 그대로 출력
    output.position = float4(input.position, 1.0f);
    output.tex = input.tex;

    return output;
}
```

---

- Pixel Shader

```hlsl
// LightingPass_PS

// 지오메트리 패스에서 만든 G-Buffer 텍스처들을 입력으로 받음
Texture2D worldPosTexture : register(t0);
Texture2D albedoTexture   : register(t1);
Texture2D normalTexture   : register(t2);
SamplerState SampleType   : register(s0);

cbuffer LightBuffer : register(b0)
{
    float3 lightDirection;
    float4 diffuseColor;
};

struct PixelInputType
{
    float4 position : SV_POSITION;
    float2 tex      : TEXCOORD0;
};

// 최종 출력은 색상 하나
float4 main(PixelInputType input) : SV_TARGET
{
    // 1. 현재 픽셀의 UV 좌표를 이용해 G-Buffer에서 데이터 샘플링
    float3 worldPos = worldPosTexture.Sample(SampleType, input.tex).xyz;
    float4 albedo = albedoTexture.Sample(SampleType, input.tex);
    float3 normal = normalize(normalTexture.Sample(SampleType, input.tex).xyz);

    // 2. 간단한 방향성 광원(Directional Light) 계산
    float lightIntensity = saturate(dot(normal, -lightDirection));
    float4 finalColor = lightIntensity  diffuseColor  albedo;

    // 3. 최종 계산된 색상 출력
    return finalColor;
}
```

---

## 차이점 요약

|특징	|순방향 렌더링 (Forward Rendering)	|지연 렌더링 (Deferred Rendering)|
|---|---|---|
처리 단위	|오브젝트(Object) 단위	| 화면(Screen) 공간, 픽셀 단위|
조명 계산	|오브젝트를 그릴 때마다 모든 광원 계산	|모든 오브젝트를 그린 후(G-Buffer), 픽셀별로 한 번에 계산|
성능 (광원 수)|	광원 수에 매우 민감	| 광원 수에 덜 민감|
메모리	|상대적으로 적은 메모리 사용	|G-Buffer 때문에 많은 메모리 및 대역폭 사용|
투명 객체	|처리하기 용이함|	처리하기 매우 복잡함 (보통 순방향 렌더링 혼용)|
재질 다양성|	각 오브젝트마다 다른 쉐이더 사용 가능 (높은 유연성)	|모든 재질이 G-Buffer 포맷을 따라야 함 (낮은 유연성)|
안티앨리어싱|	MSAA 등 하드웨어 AA 적용 용이|	하드웨어 AA 적용이 어려워 FXAA, TAA 등 후처리 방식 사용|
주요 사용처|광원이 적은 게임, 모바일 게임|	수백, 수천 개의 동적 광원이 필요한 현대 AAA 게임|

---

**참고하면 좋은 링크**

- [forward-and-deferred-rendering](https://www.benmandrew.com/articles/forward-and-deferred-rendering)
- [Interactive Graphics 21 - Deferred, Variable-Rate, & Adaptive Shading](https://youtu.be/9_v8cvd-BSQ?feature=shared)