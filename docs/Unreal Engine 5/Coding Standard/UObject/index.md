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
모든 UObject는 자신의 클래스 정보 `(UClass)`를 가리키는 ClassPrivate 포인터를 갖는다

```c++
class UClass : public UObject {
    TArray<UProperty*> Properties;  // 프로퍼티 목록 (예: 체력, 공격력)
    TArray<UFunction*> Functions;   // 함수 목록 (예: 점프(), 공격())
    UClass* SuperClass;             // 부모 클래스 (상속 관계)
    // ... 기타 메타데이터
};
```
### 동작 예시
```c++
UMyObject* Obj = NewObject<UMyObject>();
UClass* ObjClass = Obj->GetClass(); // 데이터 추출
```

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

### 내부 구조 다이어그램
![내부 구조 다이어그램](/images/UObjectInside.png)