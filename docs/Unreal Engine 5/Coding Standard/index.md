---
layout: default
title: "Coding Standard"
parent: "Unreal Engine 5"
nav_order: 1
has_children: true
---

# Coding Standard

- [Coding Standard](https://dev.epicgames.com/documentation/en-us/unreal-engine/coding-standard?application_version=4.27#portablec++code)

## 저작권 고지
배포하는 모든 소스 파일(.h, .cpp, .xaml 등)에는 파일의 첫 줄에 반드시 다음과 같은 저작권 공지가 포함되어야 한다.

```c++
// Copyright Epic Games, Inc. All Rights Reserved.
```
**해당 줄이 없거나 형식이 다르면 오류 -> 빌드 실패 처리됨**

## 클래스 구성
클래스는 읽는 사람을 우선으로 구성해야 한다. 대부분 클래스를 읽는 사람들은 public 인터페이스를 사용한다.
따라서 클래스는
1. public
2. protected
3. private

순으로 작성한다.

## 클래스 접두사
언리얼 엔진의 클래스에는 접두사가 있다. 해당 접두사를 알고있으면 어떤 클래스에서 파생됐는지 알 수 있다.

|접두사|클래스|예시|
|---|---|---|
A|AActor|AActor, APawn, AGameMode|
U|UObject|UTexture, UBlueprintFunctionLibrary|
S|SWidget|SButton, Swidget|
F|사용자 구조체|FVector, FHitResult|
I|추상 인터페이스|IInterface|
T|템플릿 클래스|TArray<T>, TMap<<T>|
E|Enum 타입|EGAmeState|
G|globals 전역변수|GEngine|
b|Boolean 변수|bHasFadedIn, bDied|

**사용예시**
```c++
typedef TArray<FMytype> FArrayOfMyTypes;
```
typedef에는 해당 타입에 적합한 문자가 접두사로 붙어야 한다.

위 예시는 사용자 구조체 타입을 받는 템플릿 클래스다.

## 네이밍 규칙
- 단어 사이에 언더스코어(`_`) 를 **사용하지 않는다**
- **단어의 첫 글자는 대문자**로 표기한다
  - 예: `MouseCoordinates` (o), `delta_x` (x)
- **타입명**에는 추가로 **대문자 접두사**를 붙여 변수명과 구분한다
  - 예: `FSkin` (타입), `Skin` (FSkin 타입의 인스턴스)
- 모든 **변수는 한줄씩 선언**한다 
- 반환값이 있는 함수는 **이름만으로 반환값을 명확히 한다**
    - O: `bool IsTeaFresh(FTea Tea)` True 의미 명확
    - X: `bool CheckTea(FTea Tea)` 어떤걸 반환할지 의미 불명확
- **반환값이 없는 절차 함수는 강한 동사+목적어 형식**
  - 메서드의 목적어가 자기 자신이면 (맴버 함수) 생략 가능 
  - `Handle`, `Process` 등 모호한 동사 피하기
- **bool 반환 함수는 항상 Yes/No 질문 형태**를 취한다
  - `IsVisible()`, `ShouldClearBuffer()`

## Const 정확성
- 함수 인자가 함수 내에서 변경되지 않는다면, **const pointer 또는 const reference로 전달**
- **객체를 변경하지 않는 메서드는 const로 명시**
- 컨테이너를 수정하지 않는 반복문은 **const 반복자 사용**

**사용예시**

```c++
void SomeMutatingOperation(FThing& OutResult, const TArray<Int32>& InArray)
{
    // InArray는 수정되지 않음, OutResult는 아마 수정될것임
}

void FThing::SomeNonMutatingOperation() const
{
    // 이 코드는 FThing을 변경하지 않음
}

TArray<FString> StringArray;
for (const FString& : StringArray)
{
    // 반복문 내부에서 StringArray를 수정하지 않음
}
```

- 반환 타입에 **const 사용 금지** (컴파일 경고 발생)
  - **단 const 레퍼런스, 포인터 반환은 허용**

```c++
// 좋은 예시 - const 참조 반환
const TArray<FString>& GetSomeArray();

// 좋은 예시 - const 포인터 반환
const TArray<FString>* GetSomeArray();

// 나쁜 예시 - const 배열 반환
const TArray<FString> GetSomeArray();

// 나쁜 예시 - const 포인터를 const로 반환
const TArray<FString>* const GetSomeArray();
``` 

- **포인터 자체를 const**로 만들 때는 **타입 뒤에 const**
   - 포인터가 가리키는 값이 아닌, 포인터 자체의 재할당을 막음

```c++
// 포인터는 재할당 불가, T는 변경 가능
T* const Ptr = ...;

// 잘못된 사용: 불가(레퍼런스는 재할당 불가 특성상 의미 없음)
T& const Ref = ...; 
```

## 주석
- **클래스 주석**
  - 이 클래스가 해결하는 문제
  - 클래스 생성 이유
- **함수 (메서드) 주석**
  -  함수 목적 기입
- **매개변수 주석** `@param `
  - 측정 단위
  - 예상 값 범위
  - 불가능한 값
  - 상태/오류 코드 의미
- **반환값 주석** `@return`
  - 예상 반환 값
- 추가 정보
  - `@warning ` 경고, `@See`보기 등을을 선택적으로 사용함  

**사용예시**

```c++
/** The interface for drinkable objects. */
class IDrinkable
{
public:
    /**
     * Called when a player drinks this object.
     * @param OutFocusMultiplier - 반환 시, 마시는 사람의 집중력에 곱할 배수를 담는다.
     * @param OutThirstQuenchingFraction - 반환 시, 갈증 해소 정도(0~1)를 담는다.
     * @warning 반드시 음료가 제대로 준비된 후 호출해야 함.
     */
    virtual void Drink(float& OutFocusMultiplier, float& OutThirstQuenchingFraction) = 0;
};

/** 단일 찻잔 */
class FTea : public IDrinkable
{
public:
    /**
     * 주어진 물의 부피와 온도로 우려냈을 때, 차의 맛 변화량을 계산
     * @param VolumeOfWater - 우릴 때 사용된 물의 양(mL)
     * @param TemperatureOfWater - 물의 온도(Kelvin)
     * @param OutNewPotency - 우려낸 후 차의 효능(0.97~1.04)
     * @return 차의 맛 강도 변화량(1분당 TTU)
     */
    float Steep(
        const float VolumeOfWater,
        const float TemperatureOfWater,
        float& OutNewPotency
    );

    /** 설탕 당도 기준으로 감미를 추가 */
    void Sweeten(const float EquivalentGramsOfSucrose);

    /** 일본 내 판매가(엔) */
    float GetPrice() const
    {
        return Price;
    }

    virtual void Drink(float& OutFocusMultiplier, float& OutThirstQuenchingFraction) override;

private:
    /** 가격(엔) */
    float Price;

    /** 감미(설탕 환산 그램) */
    float Sweetness;
};

```

## 


## 사용가능한 표준 라이브러리 목록
- `<atomic`> : 신규 코드는 std::atomic 사용. 기존 TAtomic은 부분 구현만 되어 있음.
- `<type_traits>` : 겹치는 부분은 표준 trait 사용. (표준 trait는 value/type 소문자, 기존 UE는 대문자 Value/Type 주의)
- `<initializer_list>` : braced initializer 지원에 필수, 대체재 없음
- `<regex>` : 직접 사용 가능하나 에디터 전용 코드에 한정. 자체 구현 계획 없음.
- `<limits>` : std::numeric_limits 전부 사용 가능
- `<cmath>` : 부동소수점 비교 함수만 사용 허용

