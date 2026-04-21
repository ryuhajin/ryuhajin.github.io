---
layout: default
title: "ISM,HISM"
parent: "Rendering pipeline"
nav_order: 4
---

# ISM (Instanced Static Mesh) / HISM (Hierarchical Instanced Static Mesh)

- [UE5.7 - static mesh](https://dev.epicgames.com/documentation/unreal-engine/static-meshes)
- [인스턴스드 스태틱 메시 컴포넌트](https://dev.epicgames.com/documentation/unreal-engine/instanced-static-mesh-component-in-unreal-engine)


**참고하면 좋은 링크**
- [UE5 Instancing: When to Use It and How to Maximize Performance - ISM/HISMs Deep Dive](https://youtu.be/pvvrfdr9jEA?si=F7eIup0sLoadxr0C)

---

## 스태틱 매쉬의 개념
1. **스태틱 메시(Static Mesh)**
   - UE5로 임포트된 모든 3D 모델의 기본 형태
   - 위치, 회전, 스케일 값은 변경할 수 있지만, 메시 자체의 **기하학적 구조(Geometry)는 고정**되어 있어 '스태틱'이라 불림
2. **컴포넌트 vs 액터**
    - 스태틱 메시는 **블루프린트 등에 종속된 컴포넌트**로 존재하거나
    - **월드에 직접 배치되는 액터**로 존재할 수 있다

---

## ISM과 HISM의 개념: 배칭(Batching)
ISM과 HISM은 **동일한 스태틱 메시들을 하나로 묶어 렌더링 연산을 공유**하는 방식이다

```
[비유]
복잡한 덧셈 문제 (예 : 1 + 2 + 3 + 2 + 3 + 2 ... + n) 을 풀 때
- 숫자 하나하나를 더하는 것은 비효율

> 각각의 숫자가 몇 개인지 파악하여 곱셈으로 변환 (예 : 1 x n + 2 x n ...) 하면 빠르게 계산할 수 있다!
```

따라서 ISM과 HISM는 메시들을 배치로 묶어 **개별 메시가 아닌 그룹으로 계산**
- 메시가 하나뿐이라면 곱셈이 오히려 계산을 더 복잡하게 만들 뿐 도움이 되지 않음

> 동일한 메시가 많을 때는 인스턴싱이 유리, 인스턴스 수가 적을 때는 효율이 떨어짐

### 인스턴싱 적용 기준과 제약 사항
1. **기능 공유**
    - 인스턴싱된 메시들은 설정을 공유함
    - **애니메이션은 동시에 움직이고, 콜리전(Collision) 및 머티리얼 설정도 그룹 전체에 동일하게 적용**
2. **물리 연산의 제한**
    - 인스턴스화된 개체들은 **개별적인 물리 시뮬레이션(Physics operation)을 적용받을 수 없음**
    - 예 : 수천 개의 돌멩이를 ISM으로 배치했다면, 모든 돌멩이가 하나로 묶여 바닥에 떨어짐

```
ISM/HISM은 모든 인스턴스 그룹에 대해 단일 충돌 이벤트만 발생시킨다
따라서 어떤 인스턴스가 충돌했는지 정확히 알 수 없다

해결법
- ISM/HISM 컴포넌트의 충돌 설정에서 Multi Body Overlap 옵션을 활성화
```

---

## 성능 지표: CPU와 GPU의 병목 현상
성능은 CPU, GPU 중 가장 느린 속도에 맞춰짐
- 인스턴싱은 CPU 타임 개선에 기여하기 때문에 GPU 병목의 경우 큰 효과를 느끼지 못함

### 인스턴싱과 드로우 콜
1. 10개의 스태틱 메시가 동일한 머티리얼을 사용해도 개별 배치 시 10번의 드로우 콜이 발생
2. 하지만 인스턴싱을 적용하면 단 1번의 드로우 콜로 처리됨
> 이는 CPU가 GPU에 전송하는 명령 횟수를 획기적으로 줄여줌

![](/images/ISM_drawCallInfo.png)

---

> 하지만 CPU 타임이 빠르더라도 인스턴싱이 도와주는 결정적인 성능 지표가 있다!

### 로딩 시간과 메모리 효율성
인스턴싱의 진정한 가치는 **레벨 로딩 시간과 메모리 효율**에서 나타난다

1. 메시를 씬에 불러오는 '초기 로딩 시간'에서 큰 차이가 발생한다
    - 5,000개의 고폴리곤 벽 메시를 테스트했을 때
    - 일반 컴포넌트 방식보다 ISM 방식이 약 2.5배 빠른 로딩 속도
2. 메모리 절감
    - 비인스턴스 방식에서 약 19MB를 차지하던 데이터가 인스턴싱 적용 후 0.1MB 이하로 감소

> 즉, 인스턴싱의 성과는 FPS보다는 로딩 시간으로 측정하는 것이 더 정확하다

---

