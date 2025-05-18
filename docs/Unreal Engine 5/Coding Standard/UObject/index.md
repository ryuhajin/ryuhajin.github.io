---
layout: default
title: "UObject"
parent: "Coding Standard"
nav_order: 1
has_children: true
---

# UObject

언리얼 엔진의 모든 **객체 지향 시스템의 기반이 되는 핵심 클래스.**

- 게임플레이 요소, 컴포넌트, 에셋 등 거의 **모든 UE5 객체가 UObject에서 파생됨**
- UObject 객체를 생성함으로써 **리플렉션, 가비지 컬렉션(GC), 직렬화** 등의 기능을 사용할 수 있다

## 개발자가 직접 사용하는 도구 (원인)

- **객체 생성 및 관리**
  - `NewObject()`, `IsValid()`, `ConditionalBeginDestroy()`
- **라이프사이클 관리**
  - `PostInitProperties()`, `BeginDestroy()`, `AddToRoot()`
- **메타데이터 시스템**
  - `UPROPERTY(meta=(...))`, `UFUNCTION()` 지정자

## UObject를 사용함으로써 자동으로 얻는 기능 (결과)

- **리플렉션**
  - `UCLASS()`로 등록한 클래스가 **블루프린트/파이썬에서 자동 인식**
- **가비지 컬렉션**
  - `UPROPERTY()` 참조가 없어지면 **GC가 자동으로 객체 제거**
- **직렬화**
  - SaveGame 지정 시 별도 코드 없이도 **디스크에 저장 가능**
- **에디터 통합**
  - EditAnywhere 메타데이터로 **자동으로 디테일 패널 생성**

### UObject 상속 계층 구조
```
UObject (최상위 베이스 클래스)
├─ UActorComponent (액터 컴포넌트 베이스)
│   ├─ USceneComponent (변환 기능 포함)
│   │   ├─ UPrimitiveComponent (렌더링 가능)
│   │   │   ├─ UMeshComponent (메시 기반)
│   │   │   │   ├─ USkeletalMeshComponent (스켈레탈 메시)
│   │   │   │   └─ UStaticMeshComponent (스태틱 메시)
│   │   │   └─ ULightComponent (라이트 소스)
│   │   └─ UCameraComponent (카메라)
│   └─ UAudioComponent (사운드)
├─ AActor (월드 배치 객체)
│   ├─ APawn (플레이어/AI 제어 가능)
│   │   ├─ ACharacter (캐릭터 메시/이동 포함)
│   │   └─ ADefaultPawn (기본 이동 기능)
│   └─ AStaticMeshActor (스태틱 메시 배치)
├─ UDataAsset (데이터 전용 에셋)
│   ├─ UPrimaryDataAsset (프라이머리 에셋 시스템)
│   └─ UAnimSequence (애니메이션 데이터)
├─ UBlueprintFunctionLibrary (블루프린트 함수)
│   ├─ UKismetSystemLibrary (시스템 유틸리티)
│   └─ UKismetMathLibrary (수학 함수)
└─ 기타 주요 클래스
    ├─ UGameInstance (게임 인스턴스)
    ├─ UWorld (월드 컨텍스트)
    ├─ UUserWidget (UMG 위젯)
    └─ UMaterial (머티리얼)
```

### 주의사항
- 스택 할당 금지: 반드시 힙에 생성 (GC 관리 대상이어야 함)
- 다중 상속 제한: UObject를 다중 상속할 때는 주의가 필요 (일반적으로 UInterface 사용)
- 표준 C++ 타입과의 호환성: std::vector 등은 UPROPERTY()로 표시할 수 없으며, TArray를 사용함
- 아주 가벼운 데이터만 다룰 경우 USTRUCT를 권장

# UObject의 내부 구조
## UClass
- **UClass는 UObject 객체의 청사진**
- 프로퍼티의 이름/타입/위치(오프셋). 실제 힙에 할당 X
  - (예: "고양이" 종류의 객체는 "고양이 클래스" DNA를 가짐)
- 모든 UObject는 자신의 클래스 정보 `(UClass)`를 가리키는 ClassPrivate 포인터를 갖는다

```c++
class UClass : public UObject {
    TArray<UProperty*> Properties;  // 프로퍼티 목록 (예: 체력, 공격력)
    TArray<UFunction*> Functions;   // 함수 목록 (예: 점프(), 공격())
    UClass* SuperClass;             // 부모 클래스 (상속 관계)
    UObject* ClassDefaultObject;    // CDO 포인터
    // ... 기타 메타데이터
};
```

### 동작 예시
```c++
UMyObject* Obj = NewObject<UMyObject>();
UClass* ObjClass = Obj->GetClass(); // 데이터 추출
```

## CDO (Class Default Object)
- UClass가 관리하는 특별한 UObject 인스턴스
- 모든 UObject 인스턴스의 초기값을 제공하는 원본
  - (예: "고양이 클래스"의 기본 색상=검정, 기본 체력=100)

>
- 클래스가 언리얼 모듈에 로드될 때 한 번만 생성됨

### 내부 구조와 CDO의 관계 다이어그램
![CDO](/images/UObjectCDO.png)
- **UClass** : 모든 인스턴스가 공유하는 "청사진"
- **CDO** : 인스턴스들이 참조하는 변하지 않는 원본
- **UObject 인스턴스** : CDO의 기본값을 복사받아 생성된 개별 객체

### CDO 접근 방법
```c++
// CDO 얻기
UMyObject* Defaults = GetDefault<UMyObject>();

// 기본값 사용 예시
float DefaultHealth = Defaults->Health; // 에디터에서 설정한 Health 값
```

### CDO 실제 활용
- 에디터 연동 (인스턴스 초기값 세팅)
```c++
UPROPERTY(EditDefaultsOnly, Category="Settings")
float Health; // CDO에서만 편집 가능
```
- 런타임 검사
```c++
if (MyObj->Health == GetDefault<UMyObject>()->Health) {
    UE_LOG(LogTemp, Warning, TEXT("체력이 기본값입니다!"));
}
```

## UObject 객체 생성 과정
1. **UClass 로드** :  엔진 시작 시 UMyObject::StaticClass() 호출 → UClass 생성
2. **CDO 생성** : **UClass 초기화 과정에서 GetDefaultObject()가 CDO 생성**
3. **UObject 인스턴스 생성** : **NewObject() 시 CDO의 프로퍼티 값을 복사**

###  CDO vs 인스턴스

|비교 항목|CDO|일반 인스턴스|
---|---|---|
생성 시점	|모듈 로드 시 1회|	NewObject() 호출 시|
수정 가능성|	에디터에서만 (런타임 X)|	런타임 자유롭게 변경 가능|
메모리 위치|	영구적 (게임 종료 시까지)|	GC에 의해 삭제 가능|
용도|기본값 템플릿|실제 게임 내 객체|

- 에디터에서 Health=200 변경 → 모든 새 인스턴스는 Health=200으로 생성됨
- **기존 인스턴스는 영향 없음 (이미 생성된 객체는 독립적)**

## ObjectFlags
객체의 상태를 나타내는 비트 플래그

```c++
enum EObjectFlags {
    RF_Public      = 0x00000001,  // 에디터에 노출 여부
    RF_Transactional= 0x00002000, // Undo/Redo 지원
    RF_Transient   = 0x00004000,  // 임시 객체 (저장 안 됨)
    // ... 30여 가지 플래그
};
```
-  **UObject 인스턴스는 자신만의 ObjectFlags를 보유**
-  `UClass`는 UObject의 **파생 클래스**이므로, **UClass도 자신만의 ObjectFlags를 가짐**

### ObjectFlags 내부 구조 다이어그램
![내부 구조 다이어그램](/images/UObjectInside.png)

- **UObject 인스턴스의 ObjectFlags**: 개별 인스턴스의 **런타임** 상태 제어
  - 이 객체만의 상태 플래그
- **UClass의 ObjectFlags**: 클래스 전체의 **정적 특성** 정의, 추상 클래스 여부, 블루프린트 노출
  - 클래스 전체에 적용되는 플래그

# 서브오브젝트 시스템 (Subobject System)
## 서브오브젝트 (컴포넌트)
**다른 UObject (주로 AActor나 UActorComponent)에 종속된 자식 객체**
- “서브오브젝트”란 별도 클래스가 아니라, Outer 체계를 활용한 소유 관계/구조

- ACharacter 내부의 USkeletalMeshComponent (캐릭터 메시)
- UCameraComponent (플레이어 카메라)
- 커스텀 로직을 가진 UMyCustomComponent
  
## 서브오브젝트의 특징

특징|설명|
|---|---|
생명주기 |부모 종속	<br> 부모 객체가 파괴되면 함께 파괴됨 (GC 대상)|
생성 시점 제한|반드시 부모의 생성자에서 `CreateDefaultSubobject()`로 생성해야 함|
자동 직렬화|부모와 함께 저장/로드됨 (에디터에서 편집 가능)|

## 서브오브젝트 vs UObject

비교 항목	|서브오브젝트	|일반 UObject|
---|---|---|
생성 방법|	CreateDefaultSubobject()|NewObject()|
생명주기|부모 종속|독립적|
에디터 노출|부모의 디테일 패널에 자동 표시|별도 관리 필요|
사용 사례	|컴포넌트, 내부 부품 | 독립적인 데이터 에셋|

## 서브오브젝트 구조
```c++
class UObject {
protected:
    UObject* Outer;          // 상위 객체 (서브오브젝트인 경우 소유자)
    FName    Name;           // 고유 이름 (Outer + Name으로 식별)
    UClass*  Class;          // 타입 정보
    // 기타...
};
```
- **Outer** : 서브 오브젝트의 소유자 (예: `USceneComponent`의 Outer는 일반적으로 소유자 `AActor`)
- **Name** : 같은 소유자를 가진 그룹에서 고유하게 가져야함 (중복 시 경고 발생)
- 블루프린트: 에디터에서 Add Component 버튼으로 추가 가능
- **AActor**: Actor의 경우 추가로 **Components 배열 사용**

### UClass와의 관계
- UClass는 서브오브젝트 목록을 직접 관리하지 않음
- UPROPERTY 메타데이터를 통해 리플렉션 및 자동 탐색이 이루어짐

## 서브오브젝트 탐색 방식
### 1. 리플렉션 기반 탐색 (UPROPERTY)
- UPROPERTY()로 표시된 멤버만 탐색 가능
```c++
UCLASS()
class AMyActor : public AActor {
    GENERATED_BODY()
public:
    UPROPERTY(VisibleAnywhere)
    UMyComponent* Comp; // 서브오브젝트는 UPROPERTY로 노출됨
};
```

### 2. Outer 체인 탐색
- AActor가 아닌 일반 UObject 서브오브젝트를 찾을 때 사용
```c++
// 모든 서브오브젝트 순회 (예시 코드)
TArray<UObject*> Subobjects;
GetObjectsWithOuter(MyActor, Subobjects); // MyActor를 Outer로 가진 객체 찾기

// 결과 출력
for (UObject* Obj : Subobjects) {
    UE_LOG(LogTemp, Warning, TEXT("Subobject: %s"), *Obj->GetName());
}
```

### 3. AActor 특수 처리
- AActor만 Components 배열을 명시적으로 별도 관리

```c++
class AActor : public UObject {
    TArray<UActorComponent*> Components; // 서브오브젝트 명시적 관리
};

// FindComponentByClass 활용 (최적화된 탐색)
UMyComponent* MyComp = FindComponentByClass<UMyComponent>();
```

## 서브오브젝트 생성 및 과정
```c++
// MyActor.h
UCLASS()
class AMyActor : public AActor {
    GENERATED_BODY()
public:
    UPROPERTY(VisibleAnywhere)
    UMyComponent* MyComp; // 서브오브젝트 포인터

    AMyActor() {
        // 생성자에서 서브오브젝트 생성
        MyComp = CreateDefaultSubobject<UMyComponent>(TEXT("MyComp"));
    }
};
```
1. **생성자 호출**
   - 반드시 부모 객체의 생성자 내에서 호출
     - 예외: UActorComponent는 InitializeComponent()에서 추가 초기화
2. **메모리 할당**
  - 엔진은 UMyComponent 인스턴스를 생성하고, Outer를 AMyActor로 설정
3. **이름 등록**
  - TEXT("MyComp")를 이름으로 지정, 중복 검사 수행
4. **리플렉션 연동**
  - UPROPERTY가 없어도 서브오브젝트 생성 (에디터에서 수정 불가. 블루 프린트 노출 X)
  - UPROPERTY가 있으면 디테일 패널에 노출
5. **Actor에 등록**
  - AActor 전용으로 Actor와 연관된 오브젝트가 아닐 경우 패스됨
  - AActor의 경우 Components 배열에 자동 추가

## 서브오브젝트 다이어그램
![](/images/UObjectSub.png)
- 실선: 명시적 참조 (AActor의 Components 배열)
- 점선: 암시적 참조 (Outer 포인터)
