---
layout: default
title: "Management"
parent: "UObject"
nav_order: 2
---

# UObject 사용 방법
## 1. 객체 생성 및 관리
- **UObject의 인스턴스화(Instantiation)와 기본 설정을 담당하는 단계**
- "어떻게 객체가 만들어지고, 참조되고, 접근되는가?"

### (1) UObject 객체 생성

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

### (2) UObject 객체 접근 및 유효성 검사
```c++
// 유효성 체크 (GC에 의해 파괴되지 않았는지 확인)
if (IsValid(Obj)) {
    Obj->DoSomething();
}

// 약한 참조 (WeakPtr)로 GC 방지
TWeakObjectPtr<UMyObject> WeakObj = Obj;
```

### (3) UObject 객체 등록 관리
```c++
// 객체를 특정 패키지에 등록
Obj->Rename(nullptr, MyPackage); // 에셋으로 저장 가능하게 함
```

## 2. 라이프 사이클 관리
- UObject가 **생성부터 파괴까지 거치는 전체 과정을 관리**
- "객체가 어떤 단계를 거쳐 존재하고 소멸하는가?"를 정의
- 가비지 컬렉션과 연동 가능

### (1) 라이프 사이클 - 생성
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

### (2) 라이프 사이클 - 사용
```c++
// 활성화/비활성화 제어 (AActor 파생클래스 예시)
virtual void BeginPlay() override;  // 게임 시작 시 호출
virtual void EndPlay() override;    // 게임 종료 또는 제거 시 호출
```

### (3) 라이프 사이클 - 파괴
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

**생성**

|주요 함수/이벤트|호출 시기|용도|주의사항|
|---|---|---|---|
생성자|NewObject() 호출 시|메모리 할당 + 기본값 설정|UPROPERTY는 아직 초기화되지 않음|
PostInitProperties()|생성자 직후|프로퍼티 초기화 완료 시점|에디터에서 설정한 기본값 적용됨|
PostLoad()|에셋 로드 완료 시|디스크 데이터 처리|에셋 전용 (동적 생성 객체는 호출 X)|

**사용**

|주요 함수/이벤트|호출 시기|용도|주의사항|
|---|---|---|---|
AddToRoot()|수동 호출 시|GC 대상에서 제외|남용 시 메모리 누수 가능성|
BeginPlay()|게임 시작 시(AActor 한정)|게임플레이 로직 초기화|UObject 직접 사용 불가 (Actor/Component 필요)|
Tick()|매 프레임 (AActor 한정)|지속적인 업데이트|성성능 저하 가능성 → 꼭 필요할 때만 사용|

**파괴**

|주요 함수/이벤트|호출 시기|용도|주의사항|
|---|---|---|---|
ConditionalBeginDestroy()|수동 호출 또는 GC 시작 시|파괴 시작 신호|객체는 즉시 삭제되지 않음|
BeginDestroy()|GC 마킹 후|	리소스 해제 (텍스처, 메모리 등)|가상 함수 오버라이드 필수|
FinishDestroy()|메모리 해제 직전|최종 정리|이후 모든 접근 불가능|

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