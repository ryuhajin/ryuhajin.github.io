---
layout: default
title: "Rendering pipeline"
parent: "Unreal Engine 5"
nav_order: 6
has_children: true
---

# Rendering pipeline

UE5 렌더링 파이프라인 정리하기

**읽어보기**
- [Unity 개발자를 위한 언리얼 엔진 렌더링 소개](https://dev.epicgames.com/documentation/unreal-engine/introduction-to-rendering-in-unreal-engine-for-unity-developers)

**콘솔 명령어**
- [콘솔 변수 레퍼런스](https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-console-variables-reference)

---

위 링크의 디퍼드 렌더링이 각 프레임마가 수행하는 단계
![](/images/UE5-RenderingPass-m.png)

| 단계 | 그림에서의 표현  | 렌더링 패스  | 의미  |
| ----- | --- | ------------- | ------------ |
| 1     | Scene Prep and Occlusion     | **CPU Scene Gather / Visibility Culling / Occlusion Result 반영** | 이번 프레임에 그릴 오브젝트를 준비하고, 안 보이는 것들을 걸러냄      |
| 2     | Geometry Rendering    | **Vertex Processing / Primitive Setup / Mesh Draw Submission**  | 메시의 정점과 삼각형을 GPU가 처리할 준비를 함               |
| 3     | Rasterization and GBuffer    | **Base Pass (Rasterization + GBuffer Write)**                   | 삼각형을 픽셀 후보로 바꾸고, 재질 정보를 GBuffer에 기록       |
| 4     | Rendering Textures           | **Material Texture Sampling (Base Pass 내부)**                    | BaseColor / Normal / Roughness 텍스처 등을 읽음  |
| 5     | Pixel Shader and Materials   | **Material Pixel Shader (Base Pass 내부)**                        | 텍스처와 머티리얼 노드를 계산해서 GBuffer 값을 만듦          |
| 6     | Reflections                  | **SSR / Reflection Capture / Lumen Reflections**                | 반사 관련 정보를 계산하거나 합성                        |
| 7     | Static Lighting and Shadows  | **Lightmap / Baked Shadow / Volumetric Lightmap 샘플링**           | 미리 구워둔 정적 조명 정보를 사용                       |
| 8     | Dynamic Lighting and Shadows | **Shadow Pass + Deferred Lighting Pass**                        | 실시간 라이트와 그림자를 계산                          |
| 9     | Fog and Transparency         | **Translucency / Fog / Volumetric Fog / Particles**             | 투명 오브젝트와 안개 계열 효과를 합성                     |
| 10    | Post Processing              | **PostProcess Passes**                                          | Tone Mapping, Bloom, DOF, TAA/TSR 등 최종 보정 |


---

## 렌더링 패스 정리
![](/images/UE5-RenderingPass.png){: width="30%" height="30%"}

---

### 쉽게 보는 흐름

| 순서 | 언리얼 기준 핵심 패스      | 의미         | 결과물             |
| -- | ------------------------ | ------------|--------------- |
| 1  | CPU Scene Prep / Culling | 렌더 대상 준비 (드로우 콜) | 렌더 대상 목록     |
| 2  | PrePass                  | 카메라 기준 depth 생성 | SceneDepth      |
| 3  | Shadow Pass              | 광원 기준 shadow depth 생성 | ShadowMap / VSM |
| 4  | Base Pass                | GBuffer 기록 (표면 정보)   | GBuffer         |
| 5  | Deferred Lighting        | 실시간 direct light 계산 + 그림자 계산 | SceneColor(직접광) |
| 6  | Reflection / GI / AO     | 반사/간접광/화면기반 효과|보강된 SceneColor  |
| 7  | Translucency / Fog       | 투명/안개|합성된 SceneColor  |
| 8  | Post Processing          | 최종 화면 보정 | Final Image     |

---

**참고하면 좋은 링크**

- [Rendering pipeline UE5](https://dev.epicgames.com/community/learning/tutorials/lyJK/unreal-engine-rendering-pipeline-ue5)
- [UE4 Graphics Profiling: All Categories Guide (Rendering Passes)](https://www.youtube.com/watch?v=C3lumWdwHmA)
- [GPU and Rendering Pipelines](https://unrealartoptimization.github.io/book/pipelines/)
- [Unreal’s Rendering Passes](https://unrealartoptimization.github.io/book/profiling/passes/)
- [Interplay of Light](https://interplayoflight.wordpress.com/)
- [Gamedev Guide](https://ikrima.dev/ue4guide/graphics-development/shader-development/add-custom-shading-model/)


### 나중에 문서로 옮기기

1. [Visibility and Occlusion Culling](https://dev.epicgames.com/documentation/unreal-engine/visibility-and-occlusion-culling-in-unreal-engine?application_version=5.7)
2. [가상 텍스처의 실제 작동 방식](https://www.shlom.dev/articles/how-virtual-textures-really-work/)
3. [Runtime Virtual Textures: The Ultimate Starter Guide](https://youtu.be/RLEPA16QDRw?si=NK7PB2NXY6XrP_TD)
4. [Unreal Engine 5 Tutorial - Instanced Static Meshes - ISM/HISM](https://youtu.be/cfR36FTbvcQ?si=we_OzA-WgZmdFQzm)
5. [Shadow Mapping](https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping)
6. [Shadows - 3D Graphics Overview](https://youtu.be/TvFda5KJkew?si=VztuUkjoJfUrsB3Q)
7. [Shadow](https://youtu.be/lOIGOT88Aqc?si=q7LTOfKov9fSnZXx)
8. [기본 그림자 매핑 // OpenGL 튜토리얼 #35](https://youtu.be/kCCsko29pv0?si=kNldTjnT3vDBx8oF)

---

- [hierarchical-depth-buffers](https://miketuritzin.com/post/hierarchical-depth-buffers/)
- [Precomputed Atmospheric Scattering:
a New Implementation](https://ebruneton.github.io/precomputed_atmospheric_scattering/)
