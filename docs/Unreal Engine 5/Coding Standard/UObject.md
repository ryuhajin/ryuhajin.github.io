---
layout: default
title: "UObject"
parent: "Coding Standard"
nav_order: 5
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

## UObject 사용 기능
## 1. 객체 생성 및 관리
- UObject의 **인스턴스화(Instantiation)와 기본 설정을 담당하는 단계**
- "어떻게 객체가 만들어지고, 참조되고, 접근되는가?"

### (1) 객체 생성

- **Outer와 Package**: 객체의 계층 구조와 저장 위치 결정
```c++
// Outer: 객체의 소유자 (일반적으로 현재 객체를 생성하는 객체)
// Package: 에셋으로 저장될 경우 대상 패키지 (예: /Game/MyAsset)
UMyObject* Obj = NewObject<UMyObject>(Outer, Package, NAME_None, RF_Transactional);
```
- `RF_Transactional`: 에디터 실행 취소(Undo) 시스템에 등록할 때 사용하는 플래그
- `RF_Standalone`:  패키지와 무관한 독립적 존재 (에셋이 아닌경우)
- `RF_Transient` : 임시 객체 (저장되지 않음)
- `RF_Public` :에셋으로 저장 시 공개적으로 표시

```c++
// 1. 일반적인 생성 (Outer와 Name 지정 가능)
UMyObject* Obj = NewObject<UMyObject>(GetTransientPackage(), TEXT("MyObj"));

// 2. 서브오브젝트 생성 (주로 Actor/Component에서 사용)
UMyComponent* Comp = CreateDefaultSubobject<UMyComponent>(TEXT("Comp"));
```
- `NewObject<T>()`: 새로운 UObject 인스턴스 생성
- `CreateDefaultSubobject()`: 생성자에서 서브오브젝트 생성 시 사용
- `TWeakObjectPtr<T>`:  GC 영향을 받지 않는 참조 생성

### (2) 객체 접근 및 유효성 검사
```c++
// 유효성 체크 (GC에 의해 파괴되지 않았는지 확인)
if (IsValid(Obj)) {
    Obj->DoSomething();
}

// 약한 참조 (WeakPtr)로 GC 방지
TWeakObjectPtr<UMyObject> WeakObj = Obj;
```

### (3) 객체 등록 관리
```c++
// 객체를 특정 패키지에 등록
Obj->Rename(nullptr, MyPackage); // 에셋으로 저장 가능하게 함
```

## 2. 라이프 사이클 관리
- UObject가 **생성부터 파괴까지 거치는 전체 과정을 관리**
- "객체가 어떤 단계를 거쳐 존재하고 소멸하는가?"를 정의
- 가비지 컬렉션과 연동 가능

### (1) 생성
- **생성자** → **`PostInitProperties()`** → **`Initialize()`** (필요 시) → **`PostLoad()`** (에셋 로드 완료 시)

함수|호출 시점|용도|
|---|---|---|
생성자|NewObject() 시|메모리 할당 + 기본 설정|
PostInitProperties()|생성자 직후|프로퍼티 초기화 완료 시점|
Initialize()|(선택적)|런타임에 추가 초기화 필요 시<br> 공식 라이프 사이클 아님|
PostLoad()|에셋 로드 완료 시|디스크에서 로드한 데이터 처리|


```c++
  // 예시: 초기화 흐름
  UCLASS()
  class UMyAsset : public UObject {
      GENERATED_BODY()
  public:
      UMyAsset() { /* 생성자 */ }

      // 프로퍼티 초기화 후 호출
      virtual void PostInitProperties() override {
          Super::PostInitProperties();
          InitDefaultValues(); // 기본값 설정
      }

      // 명시적 초기화 (필요한 경우)
      void Initialize() {
          LoadExternalData();
      }

      // 에셋 로드 완료 시 호출
      virtual void PostLoad() override {
          Super::PostLoad();
          ApplyLoadedData(); // 로드된 데이터 적용
      }
  };
```

### (2) 사용
```c++
// 활성화/비활성화 제어 (AActor 파생클래스 예시)
virtual void BeginPlay() override;  // 게임 시작 시 호출
virtual void EndPlay() override;    // 게임 종료 또는 제거 시 호출
```

### (3) 파괴
```c++
virtual void BeginDestroy() override {
    // 리소스 해제 로직
    Super::BeginDestroy();
}

virtual void FinishDestroy() override {
    // 최종 정리 작업
    Super::FinishDestroy();
}
```

### UObject 라이프 사이클 3단계 요약

단계|주요 함수/이벤트|호출 시기|용도|주의사항|
---|---|---|---|---|
생성|생성자|NewObject() 호출 시|메모리 할당 + 기본값 설정|UPROPERTY는 아직 초기화되지 않음|
	|PostInitProperties()|생성자 직후|프로퍼티 초기화 완료 시점|에디터에서 설정한 기본값 적용됨|
	|PostLoad()|에셋 로드 완료 시|디스크 데이터 처리|에셋 전용 (동적 생성 객체는 호출 X)|
사용|AddToRoot()|수동 호출 시|GC 대상에서 제외|남용 시 메모리 누수 가능성|
	|BeginPlay()|게임 시작 시|(AActor 한정)|게임플레이 로직 초기화|UObject 직접 사용 불가 (Actor/Component 필요)|
	|Tick()|매 프레임 (AActor 한정)|지속적인 업데이트|성성능 저하 가능성 → 꼭 필요할 때만 사용|
파괴|ConditionalBeginDestroy()	수동 호출 또는 GC 시작 시	파괴 시작 신호	객체는 즉시 삭제되지 않음
	|BeginDestroy()|GC 마킹 후|	리소스 해제 (텍스처, 메모리 등)|가상 함수 오버라이드 필수|
	|FinishDestroy()|메모리 해제 직전|최종 정리|이후 모든 접근 불가능|

### (4) 가비지 컬렉션 연동
```c++
// GC 대상에서 제외 (특수한 경우만 사용)
Obj->AddToRoot(); 
// GC 대상으로 복귀
Obj->RemoveFromRoot();
```
- `BeginDestroy()`: 객체가 파괴되기 전에 호출
- `IsValidLowLevel()`: 객체가 유효한지 확인

## 3. 메타 데이터 시스템
- UObject의 데이터(프로퍼티, 함수, 클래스 등)에 대해 **추가 정보를 부여하는 키-값 쌍의 데이터**
- "이 객체를 어떻게 표시하고, 직렬화하고, 에디터에서 다룰 것인가?"를 제어
  - "어떻게 에디터에서 표시할지", "어떤 제약 조건을 둘지", "블루프린트에 노출 여부" 등
- `UCLASS`, `UPROPERTY` 등에 메타데이터 추가 가능

```c++
UPROPERTY(EditAnywhere, meta=(DisplayName="My Custom Name"))
FString CustomizedName;
```

### (1) 에디터 연동 및 UI 제어
```c++
UPROPERTY(EditAnywhere, meta=(DisplayName="플레이어 이름", Tooltip="캐릭터의 이름입니다."))
FString CharacterName;
```

### (2) 직렬화 동작 설정
```c++
UPROPERTY(SaveGame, meta=(NoAutoLoad=true))
FString SaveSlotName; // 세이브 파일에 저장되지만 자동 로드 안 함
```

### (3) 리플렉션 시스템 연동
```c++
UFUNCTION(meta=(WorldContext="WorldContextObject"))
static void MyFunction(UObject* WorldContextObject);
//블루프린트에서 자동으로 World Context 연결
```

### (4) 제약 및 제어 커스텀
```c++
UPROPERTY(meta=(ClampMin=0, ClampMax=100))
int32 Health; // 에디터에서 0~100 사이값만 입력 가능
```

### 메타데이터 시스템에서 자주 쓰는 키 목록

|메타 키|용도|예시|
|---|---|---|
BlueprintType|블루프린트 변수로 사용 허용|`UCLASS(BlueprintType)`|
Category|디테일 패널에서 그룹으로 묶임|`UPROPERTY(Category="Gameplay")`|
AdvancedDisplay|디테일 패널에서 접기|`meta=(AdvancedDisplay=true)`|

## 세 시스템 차이점 요약

|시스템|핵심 질문|주요 도구|사용 예시|
|---|---|---|---|
객체 생성 및 관리|"객체를 어떻게 만들고 참조할까?"|NewObject <br> CreateDefaultSubobject <br>IsValid|동적 객체 생성<br>서브오브젝트 관리|
라이프사이클 관리|"객체가 생애주기 동안 무엇을 하는가?"	|PostInitProperties<br>BeginDestroy<br>FinishDestroy|리소스 할당/해제<br>게임 로직 초기화|
메타데이터 시스템|"이 객체를 어떻게 표시/조작할까?"|meta=(...),<br>UPROPERTY()/UFUNCTION()|에디터 UI 커스터마이징<br>직렬화 제어|

## UObject 사용 결과
## 1. 리플렉션(Reflection)
**런타임에 객체의 타입, 필드, 메서드 정보를 조회하고 동적으로 접근/수정할 수 있는 기능**

- 리플렉션 데이터는 컴파일 시점에 UHT(Unreal Header Tool)이 자동 생성
    - `GENERATED_BODY()` 매크로가 이를 활성화

- **런타임 타입 정보(RTTI)**: UCLASS, UPROPERTY, UFUNCTION 등 매크로를 통해 리플렉션 데이터 생성
- **동적 캐스팅**: `Cast<UMyClass>(SomeObject)` 형태로 안전한 타입 변환 가능
- **프로퍼티 검사**: 런타임에 객체의 프로퍼티를 검사하고 수정할 수 있음

- C++ 표준에는 런타임 리플렉션 기능이 없음
  -  예를 들어, 클래스에 어떤 필드가 있는지, 메서드가 무엇인지 런타임에 알 수 없음
  -  RTTI로 typeid, dynamic_cast 정도만 제공
- 언리얼의 리플렉션
  - 자체적인 리플렉션 시스템을 만들어 **UObject 계열 클래스에 한해 런타임 타입 정보, 속성, 함수 목록 등을 관리**
  - C++ **매크로(UCLASS, UPROPERTY, UFUNCTION)**와 **Unreal Header Tool(UHT)**이 **자동으로 메타데이터를 생성해 코드에 삽입**

### 내부 매커니즘
- 각 UObject 인스턴스는 UClass 타입 메타데이터(속성, 함수, 부모 정보 등)를 보유.
- 런타임에 GetClass(), FindField, GetDefaultObject, ProcessEvent 등의 API로 동적 접근.


## 2. 가비지 컬렉션(Garbage Collection)
더 이상 필요하지 않은 **객체(메모리)를 자동으로 탐지하여 해제하는 메커니즘**

- **자동 메모리 관리**: UObject는 UE의 가비지 컬렉션 시스템과 통합되어 있어 **참조가 없어지면 자동으로 제거**
- `UPROPERTY()` 매크로로 표시된 멤버 변수는 **가비지 컬렉터가 추적**

- C++은 **명시적 메모리 관리(new/delete, 스마트 포인터)를 요구**
    - 실수로 delete를 빼먹거나, 중복해서 delete하면 메모리 누수/오류가 발생할 수 있음.
- 언리얼의 가비지 컬렉션
  -  **UObject 파생 객체만 엔진의 GC 대상이 됨 (일반 C++ 객체는 해당 없음)**
  -  엔진은 참조 그래프(Reference Graph)를 따라 **"루트 오브젝트에서부터 도달할 수 없는 UObject"를 자동 삭제**

## 레퍼런스 그래프(Reference Graph)
**GC가 객체 간 참조 관계를 추적하는 핵심 메커니즘**
>
- 주기적으로 또는 명시적으로(엔진 Tick, 레벨 변경 등) GC가 수행됨
- UObject만 추적. 일반 C++ 객체/스마트 포인터는 GC 영향 없음
- 순환 참조 문제 자동 해결

```c++
// A가 B를 참조, B가 A를 참조해도 루트 연결이 없으면 모두 삭제됨
class A { UPROPERTY() B* RefB; };
class B { UPROPERTY() A* RefA; };
```

**1. 루트 객체(Root Objects) 식별**
- **가비지 컬렉션의 시작점**으로 **절대 삭제되지 않는 객체들**

```markdown
- 월드에 배치된 `AActor`
- `AddToRoot()`로 등록된 객체  
- 게임 인스턴스(`UGameInstance`) 
- 에디터에서 열린 에셋 (`UPackage`) 
```

**2. 그래프 탐색 (Mark 단계)**
- 루트 객체부터 `UPROPERTY()` 참조를 재귀적으로 따라가며 도달 가능한 객체 마킹

Mark 단계 순서
1. GC Root(예: 월드, 게임 인스턴스, 에디터 오브젝트 등)에서 탐색 시작
2. RootObjectA를 방문(Mark)
3. RootObjectA의 UPROPERTY 필드 참조를 따라 ObjB, ObjC를 방문(Mark)
4. ObjB의 UPROPERTY 필드 참조를 따라 ObjD, ObjE 방문(Mark)
5. ... 이하 반복
6. 모든 방문이 끝나면, **Mark되지 않은 나머지 객체들은 GC 대상으로 간주**

**3. 미사용 객체 삭제 (Sweep 단계)**
- 마킹되지 않은 객체를 안전하게 제거

## 3. 직렬화(Serialization)
UObject 기반 클래스 객체는 파일이나 네트워크로 저장/불러오거나 복제할 수 있음.

- 맵, 에셋, 게임 세이브 파일, 블루프린트 인스턴스 등은 모두 UObject 파생 클래스의 직렬화에 기반해 저장/복원
- `FArchive` 기반의 엔진 직렬화 시스템이 모든 `UPROPERTY` 데이터를 자동으로 기록 및 재구성
    - `UPROPERTY()`로 선언된 변수는 별도의 코드 없이도 자동 직렬화 대상
    - 예: SaveGame, 네트워크 동기화, 복제 등
- `Serialize(FArchive& Ar)` 메서드를 오버라이드하면, 특정 데이터를 커스텀하게 저장/복원할 수 있음

### 자동 직렬화 예시
```c++
UCLASS()
class UMySaveGame : public USaveGame
{
    GENERATED_BODY()

public:
    UPROPERTY()
    int32 PlayerLevel;

    UPROPERTY()
    FString PlayerName;
};
// 이렇게 선언된 변수는 SaveGame 파일에 자동 저장/복원
```

### 커스텀 직렬화 시 버전 호환성을 위한 패턴
```c++
void Serialize(FArchive& Ar) {
    Super::Serialize(Ar);
    int32 Version = 0;
    Ar << Version; // 버전 기록
    if (Version >= 1) {
        Ar << MyNewVariable;
    }
}
```

## 데이터 저장 흐름
1. UObject 계열 클래스는 저장 대상이 되면
   - 엔진 내부의 FArchive 객체(파일/메모리/네트워크 스트림)를 통함
   - 각 UPROPERTY 값을 자동으로 기록(Serialize)한다
2. 불러오기(로드) 시 저장된 바이너리 데이터가 FArchive로 읽혀짐
   - UPROPERTY 정보를 기반으로 객체(=UObject)의 멤버 변수로 복원(Deserialize)

## SaveGame 동작 예시

```c++
// SaveGame 객체 선언
UMySaveGame* SaveGameObj = NewObject<UMySaveGame>();
SaveGameObj->PlayerLevel = 25;
SaveGameObj->PlayerName = TEXT("홍길동");

// 저장
UGameplayStatics::SaveGameToSlot(SaveGameObj, TEXT("MySlot"), 0);

// 불러오기
UMySaveGame* LoadedGame = Cast<UMySaveGame>(
    UGameplayStatics::LoadGameFromSlot(TEXT("MySlot"), 0)
);
int32 LoadedLevel = LoadedGame->PlayerLevel; // 직렬화된 값이 자동 복원
```
1. 저장(Serialize) 과정
- SaveGame 클래스 객체를 생성
- UGameplayStatics::SaveGameToSlot() 같은 API 호출
- 내부적으로 **SaveGame 객체 → FArchive → UPROPERTY 자동 순회 및 값 기록**
**결과적으로 바이너리 파일(.sav 등)로 저장**

2. 불러오기(Deserialize) 과정
- UGameplayStatics::LoadGameFromSlot() 같은 API 호출
- **FArchive가 파일을 읽고, SaveGame 객체를 새로 만듦**
- **FArchive 데이터 → UPROPERTY 기반으로 멤버 변수 값이 자동 복원**

## 네트워크 동기화 (Replicate) 동작 예시
나중에 멀티 플레이 공부할 때 채워넣겠음

## 4. 에디터 통합
메타데이터로 자동으로 디테일 패널 생성.

- 디테일 패널 표시: UPROPERTY 지정자를 통해 에디터에서 편집 가능
- 블루프린트 노출: UFUNCTION에 BlueprintCallable 등의 지정자 추가로 블루프린트에서 사용 가능

### 커스텀 프로퍼티 에디터 예시
```c++
FPropertyEditorModule& PropModule = FModuleManager::LoadModuleChecked<FPropertyEditorModule>("PropertyEditor");
```

**정리**
```c++
// 1. 객체 생성 + 메타데이터
UCLASS(BlueprintType, meta=(DisplayName="My Cool Object"))
class UMyObject : public UObject {
    GENERATED_BODY()
public:
    // 2. 라이프사이클 관리
    virtual void BeginDestroy() override {
        CleanupResources();
        Super::BeginDestroy();
    }

    // 3. 메타데이터 활용
    UPROPERTY(EditAnywhere, meta=(ClampMin=0))
    int32 Value;
};

// 결과:
// - 블루프린트에서 "My Cool Object"로 노출 (리플렉션)
// - Value는 에디터에서 0 이상 값만 입력 가능 (에디터 통합)
// - 객체 파괴 시 CleanupResources() 자동 호출 (GC 연동)
```

**참고 링크**
- [Memory Management & Garbage Collection in Unreal Engine 5](https://mikelis.net/memory-management-garbage-collection-in-unreal-engine/)
- [04. Reflection and Garbage Collection](https://youtu.be/V0QnaZr_c6A?si=44xPYT-iUbV0Yrhk)
