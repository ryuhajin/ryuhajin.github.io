---
layout: default
title: "Macro"
parent: "Coding Standard"
nav_order: 5
has_children: true
---

# Macro
- 언리얼 전용 메타데이터 매크로는 코드 재사용성과 생산성을 높이기 위한 강력한 기능을 제공한다
- 함수나 변수마다 위에 매크로를 붙이지 않으면 언리얼 엔진의 리플렉션 시스템에 등록되지 않는다

## 매크로의 주요 기능
- **리플렉션 시스템 통합** : 런타임에 클래스 정보 조회 가능
- **블루프린트 연동** : C++과 블루프린트 간의 상호 운용성 제공
- **직렬화 지원** : 객체 상태 저장 및 로드 가능
- **네트워크 복제** : 멀티플레이어 게임에서 변수 및 함수 복제
- **가비지 컬렉션** : UObject 파생 클래스의 자동 메모리 관리

## 빌드 시스템과 매크로 연동
### 1. 빌드 시스템 기본 구조
- **UBT(Unreal Build Tool)**
  - 모든 빌드 명령을 관리/자동화.
  - 각종 `.Build.cs`, `.Target.cs` 파일을 해석하여 모듈, 의존성, 플랫폼, 설정에 따라 빌드를 분기

- **UnrealHeaderTool(UHT)**
    - 언리얼 리플렉션을 위해 추가적으로 동작하는 툴
    - 리플렉션 매크로(UCLASS, UPROPERTY, 등)가 붙은 소스코드를 파싱
    - 메타데이터와 Glue 코드(C++에선 자동 생성된 코드)를 생성

### 2. 매크로와 빌드 파이프라인
1. `UCLASS` 등을 통해 매크로를 사용한 코드 작성
2. UBT : 빌드 시작
3. UHT : 헤더 파싱 & Glue 코드(메타데이터) 생성
    - *.generated.h 를 반드시 #include로 포함해야 함
    - 이 파일이 누락될 경우 컴파일 에러 발생
4. C++ 컴파일러가 코드 + 자동코드 컴파일
5. 런타임: 리플렉션 시스템 작동

## UHT (UnrealHeaderTool) 의 작동 과정
---
1. **소스 코드 스캐닝**
   - UHT는 **.h 헤더 파일을 파싱**하여 UCLASS, USTRUCT, UFUNCTION, UPROPERTY 등의 **매크로가 포함된 특수 주석을 검색**
   - 일반 C++ 파서와 달리, 언리얼 특수 매크로를 이해하는 **커스텀 파서**를 사용
2. **메타데이터 추출**
    - 매크로에 지정된 **속성들(예: BlueprintCallable, EditAnywhere 등)을 분석**
    - 클래스 계층 구조, 프로퍼티 타입, 함수 시그니처 등의 정보를 추출
3. **리플렉션 코드 생성**
    - **`GENERATED_BODY()` 매크로 위치에 대체될 실제 코드를 생성**
    - 생성되는 파일들은 주로 `Intermediate/Build` 폴더에 저장
    - **주요 생성 파일**:
        - [ModuleName].generated.h
        - [ClassName].generated.cpp
4. **직렬화/리플렉션 시스템 통합**
    - UObject 시스템이 **런타임에 클래스 정보를 조회할 수 있도록 함**
    - 블루프린트와의 상호 운용을 위한 **바인딩 코드를 생성**

### 생성되는 코드 예시
- 원본
```c++
UCLASS(Blueprintable)
class AMyActor : public AActor
{
    GENERATED_BODY()
    
    UPROPERTY(EditAnywhere)
    float Health;
};
```
- UHT가 생성하는 코드 (간소화 된 예)

```c++
// AMyActor.generated.h
#define AMyActor_Extra_Code \
public: \
    static UClass* StaticClass(); \
    virtual UClass* GetClass() const override; \
    static void __StaticDependenciesAssets(TArray<FAssetData>& OutAssets); \
private: \
    static UClass* PrivateStaticClass; \
public: \
    DECLARE_CLASS(AMyActor, AActor, COMPILED_IN_FLAGS(0), CASTCLASS_None, TEXT("/Script/MyGame"), NO_API) \
    DECLARE_REPLICATION_FRAGMENT(AMyActor) \
    enum {IsIntrinsic=COMPILED_IN_INTRINSIC};

// 리플렉션 데이터 구조체
static const FClassFunctionLinkInfo Z_Construct_UClass_AMyActor_Functions[];
static const FPropertyParamsBase* const Z_Construct_UClass_AMyActor_Properties[];
```
### UHT가 생성하는 정보
- 클래스 등록용 StaticRegisterNatives
- UPROPERTY 메타정보 배열
- 블루프린트용 함수 등록
- C++에서 런타임에 사용할 수 있는 메타데이터 구조체
- 에디터/런타임용 데이터 구조

## UHT 처리의 특징
1. 템플릿 기반 코드 생성
    - 단순 복사-붙여넣기가 아닌, 템플릿을 기반으로 상황에 맞는 최적화된 코드 생성
2. 의존성 분석
    - 클래스 간의 관계를 분석하여 올바른 초기화 순서 보장
3. 크로스-레퍼런스 해결
    - 모듈 간 상호 참조 문제를 해결하기 위한 전방 선언(forward declaration) 생성
4. 빌드 시스템 통합
    - 생성된 코드가 실제 컴파일 과정에 올바르게 포함되도록 Makefile/UBT 스크립트 조정
5. 에러 체크
    - 잘못된 매크로 사용이나 충돌하는 설정을 빌드 전에 검출

## 매크로 카테고리

카테고리|주요 매크로|용도|
---|---|---|
코어 리플렉션	|UCLASS, USTRUCT, UENUM, UPROPERTY, UFUNCTION, GENERATED_BODY|언리얼 리플렉션 시스템 등록|
네트워크 복제	|Replicated, ReplicatedUsing, DOREPLIFETIME, RPC 관련 매크로|멀티플레이어 게임에서 변수/함수 동기화|
메모리 관리	|UPROPERTY(), UObject 관련 매크로|가비지 컬렉션 및 메모리 안전성 보장|
에디터 연동	|EditAnywhere, VisibleDefaultsOnly, BlueprintReadOnly, Category|에디터 노출 및 편집 제어|
플랫폼 특화	|PLATFORM_WINDOWS, PLATFORM_ANDROID, WITH_EDITOR, WITH_SERVER_CODE|플랫폼/빌드 설정별 코드 분기|
디버깅/로깅	|UE_LOG, UE_CHECK, UE_ASSERT, ensure(), check()|런타임 검증 및 로깅|
성능 최적화	|UE_INLINE, UE_NOINLINE, FORCEINLINE, CORE_API	|인라인 제어 및 DLL 인터페이스 정의|
메타데이터	|UMETA, DisplayName, ClampMin, ToolTip	|추가 속성 지정|
모듈/플러그인|IMPLEMENT_MODULE, IMPLEMENT_GAME_MODULE, PLUGIN_API|모듈 초기화 및 플러그인 시스템 통합|
최신 기능|UE_DEPRECATED, UE_NODISCARD, TOptional, TSoftObjectPtr 관련 매크로|현대적 C++ 기능 지원|

**참고 링크**
- [빌드 파이프라인](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/using-the-unreal-engine-build-pipeline?application_version=5.5)