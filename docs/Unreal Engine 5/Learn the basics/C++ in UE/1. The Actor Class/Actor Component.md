---
layout: default
title: "Actor Component"
parent: "1. The Actor Class"
nav_order: 3
---

# Actor Component
Actor는 레벨에 출력되는 기본 단위이다. 이 Actor에 Component를 붙여 세부 기능을 추가할 수 있다

> - 컴포넌트란 액터의 부품으로 작동하며, 기능을 추가하는 모듈이다 (예: 메시, 충돌체, AI 로직 등)
> - Actor는 컴포넌트 시스템을 통해 기능을 확장할 수 있다

**참고하면 좋은 링크**
- [Components](https://dev.epicgames.com/documentation/en-us/unreal-engine/components-in-unreal-engine?application_version=5.0)

## 컴포넌트 클래스 상속 구조

```
UObject (최상위 베이스 클래스)
├── UActorComponent (모든 컴포넌트의 기본 클래스)
│   └── USceneComponent (변환(위치/회전/스케일)을 가진 컴포넌트)
│       ├── UPrimitiveComponent (시각적 표현과 물리적 상호작용 가능)
│       │   ├── UMeshComponent (메시 기반 컴포넌트)
│       │   │   ├── UStaticMeshComponent (정적 메시 렌더링)
│       │   │   └── USkeletalMeshComponent (스켈레탈 메시 렌더링)
│       │   └── ULightComponent (광원 컴포넌트)
│       └── UCameraComponent (카메라 기능 제공)
└── AActor (월드에 배치 가능한 객체)
    └── APawn (플레이어 또는 AI가 제어할 수 있는 액터)
        └── ACharacter (캐릭터 특화 액터)
```

## UActorComponent
가장 기본적인 컴포넌트로, 논리적 기능만 제공

> 액터 컴포넌트는 액터에 추가하여 동작을 확장할 수 있다

**사용 사례**
- 데이터 관리
- 타이머 기반 로직
- 네트워크 동기화가 필요한 기능

**특징**
- 변환(Transform) 정보 없음
- 렌더링 기능 없음

```c++
// UHealthComponent.h
UCLASS()
class UHealthComponent : public UActorComponent
{
    GENERATED_BODY()
    
    UPROPERTY(EditDefaultsOnly)
    float MaxHealth = 100.0f;
    
    UFUNCTION()
    void TakeDamage(float Damage);
};
```

## USceneComponent
위치, 회전, 스케일 정보를 가짐

- 위치(location): Fvector
- 회전(rotation): FRotator
- 크기(scale): FVector

![](/images/SceneComponent.png)
> GetActorLocation() : Root Compoent인 SceneComponent에서 위치 가져옴

**사용 사례**
- 계층 구조 형성 (부모-자식 관계)
- 다른 컴포넌트의 부모 역할
- 다른 컴포넌트에 Attachment 기능을 지원

**특징**
- 컴포넌트 간의 상대적 위치 지정 가능
- **액터의 RootComponent로 사용됨**

### Attachment
![](/images/SceneComponent-Attachment.png)
- 루트 구성요소가 이동하면 하위 SceneComponent도 같이 이동한다
- 루트와 하위 구성요소의 상대적인 거리는 항상 유지된다

## Static Mesh Component
스태틱 매시 컴포넌트를 Root Component로 만들 수도 있다
- UStaticMeshComponent는 USceneComponent를 상속받으므로 가능

![](/images/SceneComponent-StaticMesh.png)

### StaticMesh 컴포넌트를 Root로 만들기
1. 블루프린트 에디터 열기
2. 좌측 컴포넌트 패널의 `Add` 버튼 누르기
3. StaticMesh 컴포넌트 선택 -> Details 패널에서 Static Mesh로 쓸 모델링 선택
4. StaticMesh 컴포넌트를 드래그 하여 SceneRoot에 드롭
5. StaticMesh 컴포넌트가 Root 컴포넌트가 됨

