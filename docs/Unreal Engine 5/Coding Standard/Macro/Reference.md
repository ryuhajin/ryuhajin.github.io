---
layout: default
title: "Reference"
parent: "Macro"
nav_order: 3
---

# 주요 매크로 유형
## 1. UCLASS
- 클래스를 언리얼 리플렉션 시스템에 등록 (직렬화, GC, 에디터/블루프린트/네트워크 노출 가능)
```c++
UCLASS(Blueprintable)
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()
};
```
- UCLASS()는 클래스 선언부 바로 위에 위치
- Blueprintable 등 옵션으로 블루프린트 생성 가능 여부 등 제어

## 2. USTRUCT
- 구조체를 리플렉션 시스템에 등록
```c++
USTRUCT(BlueprintType)
struct FMyStruct
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere)
    int32 Value;
};
```
- BlueprintType : 블루프린트에서도 사용 가능하게 지정

## 3. UENUM
열거형(enum)을 리플렉션/에디터/블루프린트에 노출
```c++
UENUM(BlueprintType)
enum class EMyType : uint8
{
    TypeA UMETA(DisplayName = "Type A"),
    TypeB UMETA(DisplayName = "Type B")
};
```
- BlueprintType : 블루프린트에서 사용 가능
- UMETA(DisplayName = ...) : 에디터에 표시될 이름 지정

## 4. UPROPERTY
- 클래스 멤버 변수를 언리얼 리플렉션 시스템에 등록하기 위해 사용
- 에디터에서의 노출, 직렬화, 복제 등 다양한 기능 제어

```c++
UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Stats")
    int32 Health;
};
```
- UPROPERTY로 연결된 객체만이 가비지 컬렉션에서 참조로 간주되어 소멸 방지
- 옵션(AccessSpecifier, Category 등): 노출 범위, 에디터 분류 등 지정
- 에디터, 블루프린트에서 실시간으로 값 변경 가능

## 5. UFUNCTION
- 맴버 함수를 블루프린트에서 호출 가능하게 하거나 리플렉션 시스템에 등록

```c++
UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category="Actions")
    void TakeDamage(int32 Amount);
};
```
- BlueprintCallable :  블루프린트에서 호출 가능
- Server, Client 등 RPC 옵션 부여 가능

## 6. GENERATED_BODY
- UHT(Unreal Header Tool)가 생성한 코드를 포함시키기 위해 사용
- 클래스 선언 끝에 반드시 포함되어야 함
```c++
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()
    // ...
};
```
- GENERATED_BODY() 매크로가 없으면 UHT가 오류를 발생시킴

## 7. UINTERFACE
- 인터페이스 선언
  - 두 개의 타입을 동시에 정의함
    - UINTERFACE로 선언되는 UObject 기반 클래스 (메타데이터/리플렉션 목적)
    - 실제 인터페이스 본체 (관례적으로 I 접두어)

### UObject 기반 클래스
```c++
// 헤더 파일: MyInterface.h

// 1. UINTERFACE로 UObject 파생 클래스 선언
UINTERFACE(BlueprintType)
class UMyInterface : public UInterface
{
    GENERATED_BODY()
};

// 2. 실제 인터페이스 본체(I 접두사 사용)
class IMyInterface
{
    GENERATED_BODY()

public:
    // 인터페이스 함수 선언 (구현은 해당 인터페이스를 상속받는 클래스에서!)
    UFUNCTION(BlueprintCallable, Category="MyInterface")
    void MyFunction();
};
```

### 상속 및 구현 예시
```c++
UCLASS()
class AMyActor : public AActor, public IMyInterface
{
    GENERATED_BODY()

public:
    virtual void MyFunction() override;
};
```

## 7. DECLARE_* 및 IMPLEMENT_* 매크로
- 다양한 기능을 선언하고 구현하기 위한 매크로 쌍
  - DECLARE_*: 헤더 파일(.h)에 위치,  선언만 노출 (클래스/함수/변수의 존재를 시스템에 알림)
  - IMPLEMENT_*: 소스 파일(.cpp)에 위치,  실제 구현을 생성 (선언된 요소의 구체적인 동작 정의)
- 모듈/플러그인 등록 (DECLARE_MODULE + IMPLEMENT_MODULE)
- 로그 카테고리 생성 (DECLARE_LOG_CATEGORY_EXTERN + DEFINE_LOG_CATEGORY)
- 인터페이스 구현 (DECLARE_INTERFACE + IMPLEMENT_INTERFACE)

### 기본 예시
```c++
// MyModule.h
class FMyModule : public IModuleInterface
{
public:
    DECLARE_MODULE(FMyModule)  // 1. 모듈 선언
};

// MyModule.cpp
IMPLEMENT_MODULE(FMyModule, MyModule)  // 2. 모듈 구현
```
- IMPLEMENT_MODULE이 자동으로 StartupModule(), ShutdownModule() 함수를 생성하고 모듈을 엔진에 등록

### 내부 동작
```c++
// 순수 C++ 방식
class MyClass {};  // 직접 구현

// 언리얼 방식
DECLARE_CLASS(MyClass)  // UHT가 자동으로 다음 코드 생성:
/*
  class MyClass { 
    static StaticClass(); 
    virtual UClass* GetClass() const; 
    ... 
  };
*/
IMPLEMENT_CLASS(MyClass) // UHT가 자동으로 StaticClass() 구현체 생성
```

## 정리

| 매크로 | 적용 대상 | 리플렉션 | 직렬화 |  GC |  네트워크  | 블루프린트 | 비고 |
|---|---|---|---|---|---|---|---|---|
| UCLASS()| 클래스|   O  |  O  |  O  |    O   |   O   |    |
| USTRUCT() | 구조체|   O  |  O  |  X  |    X   |   O   |     |
| UENUM()|  enum|   O  |  O  |  X  |    X   |   O   |        |
| UPROPERTY() | 멤버 변수  |   O  |  O  |  O  | 옵션에 따라 |   O   | 옵션(Replicated 등)        |
| UFUNCTION() | 멤버 함수  |   O  |  X  |  X  | 옵션에 따라 |   O   | 옵션(BlueprintCallable 등) |
| UINTERFACE() | 인터페이스 클래스     |   O  |  X  |  X  |    X   |   O   |   |
| GENERATED_BODY() | 클래스/구조체/인터페이스 |   -  |  -  |  -  |    -   |   -   | UHT 생성 코드 삽입 |

## 매크로 사용 시 주의사항
- **리플렉션 매크로는 템플릿 클래스와 호환되지 않음**
- **가상 함수**에 `UFUNCTION` 사용 시 반드시 **`override` 키워드 추가**
- `Replicated` 변수는 반드시 **기본값 초기화 필요**
```c++
UPROPERTY(Replicated)
int32 Health = 100;  // 초기화 필수
```
- 에디터 전용 코드
  -  `WITH_EDITOR` 매크로로 감싸지 않으면 런타임 크래시 가능성
```c++
#if WITH_EDITOR
void EditorOnlyFunction() { ... }
#endif
```
- 메모리 관리 : TObjectPtr 도입 (UE5.1+)
  -  **UObject 파생 클래스는 절대 일반 C++ 포인터로 저장하지 말 것**

```c++
// 잘못된 예
UPROPERTY()
AActor* RawPtr;  // 가비지 컬렉션 대상에서 누락될 수 있음

// 올바른 예
UPROPERTY()
TObjectPtr<AActor> SafePtr;  // UE5 권장 방식
```

**참고 링크**
- [UStruct](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/structs-in-unreal-engine)
- [UFuncion](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/ufunctions-in-unreal-engine)
- [UInterface](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/interfaces-in-unreal-engine)
- [메타데이터 지정자](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/metadata-specifiers-in-unreal-engine)