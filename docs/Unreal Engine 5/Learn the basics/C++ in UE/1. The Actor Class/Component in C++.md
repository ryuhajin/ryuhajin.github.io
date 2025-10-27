---
layout: default
title: "Component in C++"
parent: "1. The Actor Class"
nav_order: 4
---

# Component in C++
컴포넌트 등록을 c++로 해보자

---

# CDO (Class Default Object)
클래스의 기본 설정값을 가지는 싱글톤 객체
> 해당 클래스의 모든 인스턴스가 참조하는 템플릿

{: .new-title}
> ❓ CDO는 언제 생성돼?
> - 게임/에디터 시작 시 UClass가 로드될 때 한 번만 생성
> - 그 후 인스턴스를 생성할 때 마다 CDO를 참조해 프로퍼티를 복사
> - 즉 UClass의 CDO는 기본값 정의이다

## 특징
- UClass별 유일 객체: 각 UClass당 하나만 존재
- 템플릿 역할: 새 객체 생성 시 CDO의 프로퍼티 값들이 기본값으로 복사됨
  - 인스턴스가 직접 CDO를 참조하는 구조 X, 복사 원본 역할
- 에디터 통합: 블루프린트/프로퍼티 윈도우에서 편집하는 값들이 CDO에 저장
- 메모리 효율: 모든 인스턴스가 공유하는 기본값을 중앙에서 관리

![](/images/UECOD.png)

- CDO Constructor : 모든 인스턴스에 공통적으로 적용되는 설정 초기화
  - 월드 의존 로직 X (월드 내 위치 값 등), 인풋 바인딩 X (컨트롤러 미확정) 
- BeginPlay : 런타임에서 실제 게임이 시작될 때 호출
  - 게임 중 변하는 값은 BeginPlay에서 로드

---

# Default Sub Object
컴포넌트의 기본 서브 오브젝트

## 특징
- 액터 클래스에 기본적으로 포함되는 서브 컴포넌트
- CDO에 귀속되어 저장되고 생성/관리됨
- `CreateDefaultSubobject<T>()` 로 생성
  - `Type*` 반환 

![](/images/UEDSO.png)

## 사용 예시
```c++
// 헤더 파일에서 선언
UPROPERTY(VisibleAnyWhere, Category="Components")

UStaticMeshComponent* MeshComp;

// CPP 파일에서 생성
AMyActor::AMyActor()
{
    MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComp"));
    MeshComp->SetupAttachment(RootComponent); // 컴포넌트 간 부모-자식 관계 설정
}

// 혹은 바로 루트 컴포넌트로 설정 가능
AItem::AItem()
{
	PrimaryActorTick.bCanEverTick = true;

	ItemMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ItemMeshComponent"));
	RootComponent = ItemMesh;
}

// 혹은 바로 루트 컴포넌트로 설정 가능 2
AItem::AItem()
{
	PrimaryActorTick.bCanEverTick = true;

	ItemMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("ItemMeshComponent"));
	SetRootComponent(ItemMesh);
}
```

- MyActor()의 생성자는 CDO 생성 때 한 번만 실행됨
- 인스턴스 생성 시에는 CDO의 Default Subobject들이 복사되어 개별 인스턴스의 컴포넌트 트리로 초기화됨
  - 해당 클래스의 모든 인스턴스가 동일한 컴포넌트 트리를 갖도록 하는 기본 역할
