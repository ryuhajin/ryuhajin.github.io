---
layout: default
title: "HLSL"
parent: "Computer Graphics"
nav_order: 2
has_children: true
---

# High-Level Shading Language (HLSL)
쉐이더 프로그래밍은 그래픽 렌더링 파이프라인에서 특정 단계를 처리하는 작은 프로그램을 작성하는 것이다

- 정점 쉐이더(Vertex Shader, VS) : 3D 모델 정점 → 클립 공간 변환
- 테셀레이션 (세 개의 서브 스테이지로 구성됨)
  - **Hull Shader (HS)** : 분할 팩터·패치 상수 계산  
  - **Tessellator (Fixed)** : 하드웨어 세분화  
  - **Domain Shader (DS)** : 세분화된 점 위치 계산
- 기하 쉐이더(Geometry Shader, GS) : 기하학적 도형 (프리미티브) 생성, 변형 / 스트림 출력
- 픽셀 쉐이더(Pixel Shader, PS), 프래그먼트 쉐이더 : 픽셀 색, 머티리얼 계산
- 컴퓨트 쉐이더(Compute Shader, CS) : Dispatch 호출 기반 범용 병렬 작업

---

## 쉐이더 프로젝트 구조

```c++
MyGame/
 ├─ Assets/
 │   └─ Textures/ …
 ├─ Shaders/
 │   ├─ Common.hlsli        // 공통 상수·구조체
 │   ├─ BasicVS.hlsl        // 정점 쉐이더
 │   ├─ BasicPS.hlsl        // 픽셀 쉐이더
 │   ├─ Lighting.hlsli      // 라이트 계산 공통 함수
 │   └─ PostProcess/
 │       └─ BloomCS.hlsl
 ├─ Src/
 │   ├─ Renderer.cpp        // D3D 초기화·리소스 관리
 │   └─ ShaderManager.cpp   // 컴파일·캐시·Hot-Reload
 └─ BuildScripts/           // fxc/dxc 오프라인 컴파일 배치
```

- `.hlsli` : 여러 쉐이더 간 공유되는 struct, 함수, 매크로 정의
- `.cso` : 빌드 단계에서 생성되는 컴파일 결과물(바이트 코드)
- `ShaderManager` : 런타임에서 .cso를 읽어 Create*Shader 호출
  - 개발 중에는 파일 타임스탬프를 보고 Hot Reload 지원

---

## GPU와 CPU의 역할 분담 및 쉐이더 실행 흐름 이해
### CPU (애플리케이션)
1. 자원(리소스) 준비
 - 정점 버퍼(Vertex Buffer), 인덱스 버퍼(Index Buffer) 생성 및 데이터 채우기
 - 텍스처, 상수 버퍼(Constant Buffer) 준비
 - 쉐이더 코드 컴파일 (D3DCompileFromFile() 등 사용)
2. 상태 설정
 - 입력 레이아웃(Input Layout) 정의
 - 렌더링 파이프라인 상태 설정 (깊이 버퍼, 블렌딩 등)
 - 쉐이더 프로그램 바인딩
3. 명령 내리기
 - 드로우 콜(Draw Call) 실행 (Draw(), DrawIndexed() 등)
 - 리소스 업데이트 명령 전달

### GPU
1. 파이프라인 실행
- CPU가 전달한 명령을 비동기적으로 처리
- 모든 쉐이더 단계 병렬 실행
    - 정점 처리 -> 테셀레이션 -> 기하 처리 -> 래스터화 -> 픽셀 처리
2. 데이터 병렬 처리
- 수천 개의 코어에서 동시에 쉐이더 프로그램 실행
- 정점/픽셀 별로 독립적 처리

---

### 그림으로 보는 흐름

```c++
CPU                               GPU
┌──────────────┐  bytecode   ┌─────────────────┐
│ HLSL compile │────────────▶│ Driver/µ-code   │
└──────────────┘             └─────────────────┘
       ▲                                 │
Create*│Shader (once)                    ▼
       │                      ┌─────────────────┐
       │ Bind VS/PS (n번)     │ Command Buffer  │
       └────────────────────▶ │ /Cmd Processor  │
                              └─────────────────┘
                                         │
                               Shader cores 실행
```

- 쉐이더 소스코드를 컴파일 하여 쉐이더 생성 함수를 호출하고 나면 GPU에 업로드 된다
- 이후 `Draw` 를 호출하면 쉐이더 핸들 (쉐이더 포인터)로 쉐이더를 불러 GPU에서 계산을 한다

---

**참고 링크**

- [The Book of Shaders](https://thebookofshaders.com/)
- [Processing](https://processing.org/tutorials/)
- [DirectX Tutorial](http://www.directxtutorial.com/LessonList.aspx?listid=11)