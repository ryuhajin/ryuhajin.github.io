---
layout: default
title: "Niagara"
parent: "Unreal Engine 5"
nav_order: 5
has_children: true
---

# Niagara
나이아가라 VFX

- [UE - niagara 개요](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/overview-of-niagara-effects-for-unreal-engine)
- [UE - GPU Sprite Effect](https://dev.epicgames.com/documentation/en-us/unreal-engine/tutorials-for-niagara-effects-in-unreal-engine)

---

## 시스템 핵심 개념

핵심 구성 요소	| 설명 |
|---|---|
시스템 (System)	| 이펙트에 필요한 모든 요소(이미터, 모듈 등)를 담는 최상위 컨테이너 <br> 최종적으로 레벨에 배치하는 단위 |
이미터 (Emitter) | 시스템 내에서 실제로 파티클을 생성하고 제어하는 주체 <br> 하나의 시스템에 여러 이미터를 넣어 복잡한 효과를 만들 수 있다 |
모듈 (Module) | 이미터에 추가되어 파티클의 특정 행동(속도 추가, 색상 변경 등)을 정의하는 기능의 기본 단위 <br> 모듈은 스택(Stack)에 쌓아 순차적으로 적용 |
파라미터 (Parameter) |시뮬레이션 내의 데이터를 추상화한 것으로, 숫자, 벡터, 색상 등 다양한 형태를 가질 수 있다 <br> 사용자 파라미터(User Parameter)를 만들어 외부(블루프린트 등)에서 쉽게 값을 제어할 수 있음 |

> 나이아가라의 스택(Stack) 은 위에서 아래로 실행된다

```
스택의 상단(Top)에 있는 모듈이 먼저 실행되고, 아래로 내려갈수록 나중에 실행

모듈의 동작 방식은 두 가지로 구분

• 덮어쓰기(Override): Set Velocity, Set Color 등 - 아래 모듈이 위 모듈의 결과를 덮어쓴다
• 누적(Additive): Add Velocity, Add Force 등 - 위에서 아래로 실행되며 효과가 누적

따라서 모듈의 종류에 따라 최종 결과가 달라짐
```

---

# Stages In Niagara

## Renderer
나이아가라 파티클 데이터를 실제 화면 픽셀로 그리는 최종 단계

- [Niagara Renderers](https://dev.epicgames.com/documentation/en-us/unreal-engine/render-module-reference-for-niagara-effects-in-unreal-engine)


## 렌더러 역할
1. **데이터 변환**
    - 파티클 속성을 GPU 버퍼로 전송하여 각 파티클이 어떤 위치·크기·색으로 그려질지 정의
2. **드로우콜 구성**
    - Sprite면 쿼드 (2D 평면)
    - Mesh면 3D 메시 인스턴스를 배치
    - Ribbon이면 연속선 형태로 연결
3. **머티리얼 바인딩**
    - 파티클 속성(Particle.Color, Particle.CustomData0~3, Particle.Position)을 머티리얼의 파라미터와 매핑
    - 이때 GPU Instance Data 구조를 정의해 머티리얼에서 Particle 노드로 접근 가능
4. **정렬·카메라 대응**
    - Billboard 회전, Depth Sort, Facing Mode, Camera Facing, Screen Alignment 등 수행
5. **버퍼 관리**
    - 파티클 수만큼 GPU 인스턴싱 데이터 생성 및 업데이트
    - LOD/Distance Culling/Visibility 처리 포함

## 렌더러 종류

| 렌더러 유형  | 용도  | 특징   |
| --- | --- | --- |
| **Sprite Renderer** | 일반 파티클 (불, 연기, 먼지 등)| 2D 카메라 정면 Billboard. 가장 기본적이며 GPU 인스턴싱 효율적 |
| **Mesh Renderer**    | 입자마다 3D 메시를 그릴 때 (파편, 잔해 등) | 스태틱 메시 또는 스켈레탈 메시 사용 가능. 메시 오리엔테이션, 스케일, 색 지원        |
| **Ribbon Renderer**  | 궤적, 트레일, 라이트스트릭 | 파티클 순서를 따라 선분 연결. UV 제어 및 카메라 정렬 지원    |
| **Light Renderer**   | 파티클을 라이트 소스로 사용 | **동적 포인트 라이트/스포트라이트 생성** <br> **주의: 성능 부담이 매우 크므로 신중하게 사용** <br> 개별 파티클마다 라이트 컴포넌트 생성 |
| **Decal Renderer**   | 파티클로 데칼 투사    | 표면에 충돌 시 스코치, 블러드, 먼지 흔적 등 <br> **Projection Distance, Size, Fade 설정으로 표면에 데칼 부착** |
| **GPU Volume / Grid Renderer**     | 볼륨 효과, 필드 시각화 | Simulation Stage에서 생성한 3D 필드(Grid Data Interface) 시각화 |

---

# Emitter

이미터 전체 흐름

```
[Emitter Lifecycle]
Emitter Spawn → Emitter Update → [Particle Spawn → Particle Update] 반복 → Emitter Death

[Particle Lifecycle]  
Particle Spawn (한 번) → Particle Update (매 프레임) → Particle Death (한 번)
```

## Spawn, Update 속성
1. **Spawn**
  - Event BeginPlay와 비슷
  - **Runs once 한번 런하고 끝**
2. **Update**
    - Event Tick과 비슷
    - **Every Frame 계속 프레임에 그려짐**

---

## Emitter Stage
1. **Emitter Spawn**
    - 이미터 시작 스테이지
    - 이미터가 **처음 생성될 때 단 한 번만 실행**
      - 이미터의 초기 위치 설정
      - 한 번만 계산할 파라미터 초기화
      - 특정 조건에서 이미터 비활성화
2. **Emitter Update**
    - 이미터 업데이트 스테이지
    - 다양한 모듈을 넣을 수 있음
    - **중요한 것 : 생성하는 파티클**
    - **이미터가 스폰하는 파티클 수 지정**

## Particle Stage
1. **Paticle Spawn**
    - 이미터가 스폰한 파티클을 제어한다
    - **초기 위치, 크기, 색상 등 설정**
    - **중요한 것 : 파티클 수명**
2. **Paticle Update**
    - 파티클의 움직임 제어
    - **Movement, Scaling, Fading**

---

## Properties
이미터의 전체적인 행동을 정의하는 마스터 컨트롤

## 주요 설정

### Simulation Target (CPU vs GPU)
이미터의 파티클 연산을 어디서 할 것인지 결정

1. **CPU**
    - **복잡한 로직과 상호작용에 사용**
    - 블루프린트와의 실시간 통신, 복잡한 충돌 검사
    - 각 파티클마다 다른 행동 등 다양한 조건문과 분기 처리가 필요할 때 선택
    - 단점: 한계가 뚜렷해 수천 ~ 수만 개 이상의 파티클을 안정적으로 돌리기 어렵디
2. **GPU**
    - 대량의 파티클과 최고의 성능이 필요할 때 사용
    - **수만, 수십만 개의 파티클을 부드럽게 표현해야 하는 효과 (비, 눈, 먼지, 대규모 폭발)**
    - 단점: CPU와의 직접적인 통신이 매우 제한적이며, 복잡한 분기 로직을 구현하기 어려움

---

### Bounds
렌더링 엔진이 이 **이펙트를 얼마만큼의 공간을 차지하는 것으로 인식하게 할 것인가? 를 정의**

1. **Dynamic (동적)**
    - CPU가 매 프레임 파티클들이 퍼져있는 영역을 실시간으로 계산하여 Bounds를 자동으로 조절
    - CPU 시뮬레이션에 사용
    - 파티클이 예측 불가능하게 퍼져나가도 Bounds가 따라오기 때문에 화면에서 사라지는 현상을 방지
2. **Fixed (고정)**
    - 사용자가 직접 Bounds의 크기와 위치를 지정
    - 시뮬레이션이 실행되어도 이 경계는 변하지 않음
    - GPU 시뮬레이션에 필수로 사용

❓ **왜 GPU로 설정하면 Fixed Bounds를 쓰라고 할까?**
```
Dynamic Bounds는 

1. CPU가 파티클들의 위치를 모니터링
2. 매 프레임 가장자리를 찾아 새로운 Bounds를 계산
3. 그 결과를 GPU에 알려야 함

느린 CPU-GPU 통신을 매 프레임 유발하는 꼴!

따라서 Fixed Bounds를 사용하면 Bounds는 고정. CPU는 GPU에게 Bounds 정보를 단 한 번만 전달
```

---

## Module override
**단일 스칼라나 벡터를 직접 세팅하는 모듈은 아래쪽 모듈이 같은 파라미터 이름을 쓸 때 덮어씀**

- 예: **Set Velocity, Set Color**

| 모듈 유형  | 스택 아래 모듈의 영향  | 이유  |
| --- | --- | --- |
| **Force류 (Gravity, Drag, Point Force, Noise)** | 누적 (Add) | 물리 법칙은 중첩되어 적용됨 |
| **Add Velocity / Acceleration**                | 누적 (Add)  |  벡터 값이 기존 속도에 더해짐        |
| **Set Velocity / Set Position / Set Color**    | 덮어쓰기 (Override)  | 속성에 직접 새로운 값 할당   |
| **Scale Color / Size**	 | 곱셈 (Multiply)	 | 기존 값에 비율 적용  | 
| **Initialize Particle**  | 초기값 설정 후, 아래 모듈이 수정 가능 | 실행 순서에 따라 최종값 결정 |
