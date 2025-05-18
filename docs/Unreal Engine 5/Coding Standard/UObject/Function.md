---
layout: default
title: "Function"
parent: "UObject"
nav_order: 3
---

## UObject 특징
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
