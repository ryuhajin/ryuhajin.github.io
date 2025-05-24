---
layout: default
title: "Add Prifixes To Assets"
parent: "1. Quick Asset Actions"
nav_order: 3
---

## 목표: 콘텐트 폴더에서 선택한 에셋 클래스에 맞는 접두사(예: `BP_`) 붙이기

# Add Prifixes To Assets
- TMap<UClass*, FString> PrefixMap 에 Prifixes 목록 작성
  - 예: `{UBlueprint::StaticClass(),TEXT("BP_")}` 

## add Prifixes 함수 구현에 사용한 메서드
### 1. UObject* S->GetClass()->GetName()
- **클래스 이름**을 반환
  -  **(예: "AActor", "UMyComponent")**
- 해당 오브젝트가 어떤 클래스로 생성되었는지 알 수 있음


### 2. UObject* S->GetName()
- **오브젝트 인스턴스의 이름을 반환**
  - **(예: "Player_123", "Weapon_Sword")**
- 에디터에서 부여한 이름이나 동적으로 생성된 이름이 반환

```c++
AActor* MyActor = GetWorld()->SpawnActor<AActor>(...);
FString ClassName = MyActor->GetClass()->GetName();  // "AActor"
FString InstanceName = MyActor->GetName();           // "MyActor_42"
```

### 3. FString::StartsWith()
- 문자열이 **특정 문자열로 시작하는지 여부를 bool로 반환**
- 대소문자 구분 여부 선택 옵션 존재
- 주의 : InPrefix가 **빈 문자열이면 항상 true를 반환**

### 함수 시그니처
```c++
bool StartsWith(
    const FString& InPrefix, 
    ESearchCase::Type SearchCase = ESearchCase::IgnoreCase
) const;
```
### 사용 예시
```c++
FString FilePath = "Content/Textures/PlayerTexture.png";

// 대소문자 무시 (기본값)
bool bIsContent = FilePath.StartsWith("Content"); // true

// 대소문자 구분
bool bIsExact = FilePath.StartsWith("content", ESearchCase::CaseSensitive); // false

// 실제 활용 예시
if (FilePath.StartsWith("Content/Textures/"))
{
    UE_LOG(LogTemp, Warning, TEXT("텍스처 경로가 유효합니다."));
}
```

### 4. FString::RemoveFromStart
- 대상 문자열의 앞부분이 특정 문자열로 시작할 경우, 해당 부분을 제거

```c++
bool RemoveFromStart(const FString& InPrefix, ESearchCase::Type SearchCase = ESearchCase::IgnoreCase);
```
- 매개변수
  - InPrefix: 앞에서 제거하고자 하는 문자열(접두사, Prefix)
  - SearchCase: 대소문자 구분 여부 (ESearchCase::IgnoreCase 또는 ESearchCase::CaseSensitive)
- 반환값
  - 제거 성공 true / 실패 false 

### 5. FString::RemoveFromEnd
- 대상 문자열의 끝이 특정 문자열로 끝날 경우, 해당 부분을 제거
- 위 메서드와 동일하게 뒤에서 제거하고자 하는 문자열과 대소문자 구분 여부를 받는다.

```c++
FString Str = TEXT("HelloWorld");
bool bRemoved = Str.RemoveFromEnd(TEXT("World")); // Str은 "Hello"가 되고, bRemoved는 true

FString Str2 = TEXT("HelloWorld");
bool bRemoved2 = Str2.RemoveFromEnd(TEXT("Hi"));  // Str2는 그대로 "HelloWorld", bRemoved2는 false
```

### 6. UObject::IsA<T>()
- 해당 오브젝트가 **특정 클래스 타입이거나 그 클래스의 자식 클래스인지를 확인하는 메서드**
- 비슷한 경우로 `IsA(UClass*)` 가 있다

### 예시
```c++
// IsA<T>()
template<typename T>
FORCEINLINE bool IsA() const
{
    return IsA(T::StaticClass());
}

if (SelectedObject->IsA<UMaterialInstanceConstant>()) 
{
    // UMaterialInstanceConstant 타입일 때 실행
}

// IsA()
bool IsA(const UClass* TargetClass) const;

if (SelectedObject->IsA(AActor::StaticClass())) 
{
    UE_LOG(LogTemp, Warning, TEXT("이 오브젝트는 Actor입니다!"));
}
```

{: .new-title}
> ❓ 왜 머티리얼 인스턴스 클래스를 찾으려면 `UMaterialInstanceConstant`를 사용해야 할까?

- 계층구조
```
UMaterialInterface (베이스)
├─ UMaterial (실제 마테리얼 에셋)
└─ UMaterialInstance (인스턴스 베이스)
            ├─ UMaterialInstanceDynamic (런타임 생성 인스턴스)
            └─ UMaterialInstanceConstant (에디터에서 생성된 인스턴스)
```

>
- **UMaterialInstance**
  - **추상 베이스 클래스.** 직접 인스턴스화되지 않음
- **UMaterialInstanceConstant**
  - **에디터에서 미리 생성해 놓은 정적 마테리얼 인스턴스**
  - 런타임 중 파라미터 변경이 불가능
- **UMaterialInstanceDynamic (MID)**
   - **런타임에 동적으로 생성되며, 파라미터를 실시간으로 변경할 수 있음**

