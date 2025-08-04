---
layout: default
title: "HLSL"
parent: "Computer Graphics"
nav_order: 2
has_children: true
---

# High-Level Shading Language (HLSL)
쉐이더 프로그래밍은 그래픽 렌더링 파이프라인에서 특정 단계를 프로그래밍하는 기술이다

> 각각의 쉐이더는 GPU에서 병렬로 실행되는 작은 프로그램이다

## 쉐이더 종류

- **정점 쉐이더 (Vertex Shader, VS)**
  - **입력**: 3D 모델의 개별 정점 데이터 (위치, 색상, 노멀, 텍스처 좌표 등)
  - **역할**: 정점의 위치를 모델 공간에서 클립 공간으로 변환 (필수 출력: `SV_POSITION`)
  - **출력**: 변환된 정점 위치와 픽셀 쉐이더로 전달할 데이터 (보간될 값)

- **테셀레이션 (Tessellation)**: 높은 디테일의 메시를 동적으로 생성
  - **Hull Shader (HS)**: 패치(patch)의 분할 수준(tessellation factor)과 패치별 상수를 계산
  - **Tessellator (Fixed-Function)**: HS가 지정한 분할 수준에 따라 하드웨어에서 정점을 세분화
  - **Domain Shader (DS)**: 세분화된 각 점의 최종 위치를 계산

- **기하 쉐이더 (Geometry Shader, GS)**
  - **입력**: 프리미티브(점, 선, 삼각형) 단위의 정점 데이터
  - **역할**: 프리미티브를 생성, 수정 또는 제거(예: 파티클 생성, 실루엣 렌더링)
  - **출력**: 하나 이상의 프리미티브를 스트림으로 출력

- **픽셀 쉐이더 (Pixel Shader, PS / Fragment Shader)**
  - **입력**: 래스터라이저에 의해 생성된 픽셀 조각(fragment)과 VS에서 보간된 데이터
  - **역할**: 각 픽셀의 최종 색상을 계산 (예: 텍스처 샘플링, 조명 계산)
  - **출력**: 최종 픽셀 색상 (`SV_Target`)

- **컴퓨트 쉐이더 (Compute Shader, CS)**
  - **역할**: 렌더링 파이프라인과 독립적으로 범용 병렬 계산(GPGPU)을 수행
  - `Dispatch` 호출로 실행

---

## 쉐이더 프로젝트 구조

```md
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

- `.hlsli` : 여러 쉐이더 간 공유되는 struct, 함수, 매크로를 정의하는 헤더 파일
- `.cso` : 빌드 단계에서 생성되는 컴파일된 쉐이더 바이트 코드
- `ShaderManager` : 런타임에서 `.cso`를 읽어 `CreateVertexShader`, `CreatePixelShader` 등의 D3D 함수를 호출하여 쉐이더 객체를 생성
  - 개발 중에는 파일 타임스탬프를 감지하여 핫 리로딩(Hot Reloading)을 지원

---

# GPU와 CPU의 역할 분담 및 쉐이더 실행 흐름 이해
## CPU (애플리케이션)
1.  **리소스 생성 및 관리**:
    -   **버퍼 생성**: 정점 버퍼(Vertex Buffer), 인덱스 버퍼(Index Buffer), 상수 버퍼(Constant Buffer) 등을 생성하고 데이터를 채움
    -   **텍스처 로딩**: 텍스처 파일을 읽어 GPU 메모리에 텍스처 리소스를 생성
    -   **쉐이더 컴파일**: `D3DCompileFromFile`과 같은 함수를 사용해 HLSL 코드를 바이트 코드로 컴파일
2.  **파이프라인 상태 설정 (Pipeline State Objects, PSOs)**:
    -   **입력 레이아웃 (Input Layout)**: 정점 버퍼의 데이터 구조가 VS의 입력 시그니처와 어떻게 매핑되는지 정의
    -   **쉐이더 바인딩**: `VSSetShader`, `PSSetShader` 등으로 각 파이프라인 단계에 사용할 쉐이더를 설정
    -   **리소스 뷰 바인딩**: `PSSetShaderResources` (SRV), `OMSetRenderTargets` (RTV) 등으로 쉐이더가 접근할 리소스 뷰를 바인딩
    -   **기타 상태 설정**: 래스터라이저 상태(culling, fill mode), 블렌드 상태, 깊이/스텐실 상태 등을 설정
3.  **렌더링 명령 (Draw Calls)**:
    -   **상수 버퍼 업데이트**: `UpdateSubresource` 또는 `Map`/`Unmap`을 통해 월드/뷰/프로젝션 행렬과 같은 데이터를 상수 버퍼에 업데이트
    -   **드로우 콜**: `DrawIndexed` 또는 `Draw`를 호출하여 GPU에 렌더링 작업을 명령
    -   이 명령은 커맨드 버퍼에 기록됨

## GPU
1.  **커맨드 버퍼 처리**: CPU가 보낸 명령들을 비동기적으로 처리
2.  **파이프라인 실행**:
    -   **입력 조립기 (Input Assembler)**: 정점/인덱스 버퍼에서 데이터를 읽어 프리미티브를 조립
    -   **정점 쉐이더 (VS)**: 각 정점을 처리
    -   **(테셀레이션/기하 쉐이더)**: (활성화된 경우) 실행
    -   **래스터라이저 (Rasterizer)**: 프리미티브를 픽셀 조각(fragment)으로 변환
    -   **픽셀 쉐이더 (PS)**: 각 픽셀 조각의 색상을 계산
    -   **출력 병합기 (Output Merger)**: 픽셀 쉐이더의 결과를 렌더 타겟 뷰(RTV)에 쓰고, 깊이/스텐실 테스트를 수행

---

## 초기화 단계 (보통 로딩 시 한 번)
- 쉐이더를 컴파일해서 GPU에 올리는 과정

1. 파일 읽기 및 컴파일 (CPU)
  - `D3DCompileFromFile()` 같은 함수로 `.hlsl` 쉐이더 소스 코드를 읽어 바이트 코드(Bytecode)로 컴파일
  - 이 바이트 코드는 아직 CPU의 메모리에 있음
2. 쉐이더 객체 생성 (CPU -> GPU)
   - `CreateVertexShader()`, `CreatePixelShader()` 같은 함수 호출
   - 이 함수들은 컴파일된 바이트 코드를 GPU 드라이버에 전달
3. GPU 메모리에 저장
   - 드라이버는 이 바이트 코드를 받아서 GPU가 직접 실행할 수 있는 형태로 변환하고 GPU 메모리의 특정 공간에 저장
4. 핸들(Handle) 반환
   - GPU는 쉐이더를 가리키는 일종의 '포인터' 또는 '참조 ID'를 CPU에게 돌려줌 (예: `ID3D11VertexShader*` 객체)
   - CPU는 무거운 바이트 코드 덩어리 대신, 이 가벼운 핸들(포인터)를 가지고 쉐이더를 제어

## 렌더링 루프 단계 (매 프레임 반복)
- 매 프레임마다 오브젝트를 그릴 때 일어나는 과정

1. 파이프라인 상태 설정 (State Binding)
   - `Draw()`를 호출하기 전에, CPU는 DirectX API를 통해 GPU에게 "이번에 그림을 그릴 때 사용할 도구들은 이것들이야" 라고 미리 알림 (**인풋 레이아웃 설정 / 버퍼 설정**)
      * IASetInputLayout(...): "정점 데이터는 이런 형식으로 들어올 거야."
      * IASetVertexBuffers(...): "정점 데이터는 저기 있는 버퍼에서 가져다 써."
      * VSSetShader(...), PSSetShader(...): "이번 그리기에 쓸 정점 쉐이더는 아까 만들어 둔 A번 쉐이더(핸들)고,
     픽셀 쉐이더는 B번 쉐이더(핸들)야."
      * PSSetShaderResources(...): "픽셀 쉐이더가 쓸 텍스처는 저기 있는 C번 텍스처야."
      * VSSetConstantBuffers(...): "월드/뷰/프로젝션 행렬 같은 데이터는 저기 D번 상수 버퍼에서 가져다 써."

2. 그리기 명령 (Draw Call)
  - 모든 설정이 끝나면, CPU는 마침내 DrawIndexed() 또는 Draw()를 호출
 * 이 호출의 의미는 "GPU 너가 일할 차례야. 방금 내가 세팅해 준 그 상태 그대로, 정점 3,000개
그려!" 라는 '실행 트리거'

## GPU의 작업 실행
1. 명령 수신
  - GPU는 CPU로부터 Draw 명령을 받음
2. 상태 확인
   - GPU는 현재 파이프라인에 바인딩된 쉐이더, 버퍼, 텍스처 등을 확인
3. 계산 수행
  - 바인딩된 정점 버퍼에서 데이터를 가져와, 바인딩된 정점 쉐이더(의 바이트 코드)를 실행하여
정점들을 변환
  - 그리고 이어서 픽셀 쉐이더 등 나머지 파이프라인 단계를 실행하여 최종 픽셀 색상을 계산

---

**참고하면 좋은 링크**

- [The Book of Shaders](https://thebookofshaders.com/)
- [Processing](https://processing.org/tutorials/)
- [OGL Dev](https://ogldev.org/)