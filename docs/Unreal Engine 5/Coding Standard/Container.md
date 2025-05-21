---
layout: default
title: "Container"
parent: "Coding Standard"
nav_order: 3
---

# Container

# TArray
동일한 타입의 데이터를 순차적으로 저장, 관리, 반복, 조작하기 위한 **동적 배열 컨테이너**

## 특징
- **하나의 TArray에는 반드시 동일 타입만 저장** 가능
- **동적 크기 조절**: 요소 추가/삭제에 따라 자동으로 메모리 할당/해제 및 재조정
- **슬랙(slack) 최적화**: 추가/삭제에 따른 빈번한 할당/해제를 방지하기 위해 **여유 메모리 유지**
  - 실제 할당된 메모리는 Num(요소 개수) 이상일 수 있음(성능 최적화 목적)
- **깊은 복사(Deep copy)**: 배열 자체의 복사는 내부 요소 모두 복사
- 메모리 및 성능 측면에서 튜닝 가능(Allocator, Reserve/Empty/Reset 등)
- 블루프린트에서도 지원

## 생성자 속성
TArray를 생성할 때 element Type, Allocator 두 가지 속성을 사용할 수 있다.
```c++
TArray<int32> IntArray; // 요소 타입 지정
 
TArray<int32, TInlineAllocator<4>> IntArray; // 요소, 할당자 속성 지정, 할당자는 선택 옵션
```

### 요소 타입 (Element Type)
TArray는 동일한 타입의 요소들을 저장하는 동질적(homogeneous) 컨테이너
 - 즉, 배열에 저장되는 **모든 요소는 동일한 타입**이어야 한다
 - 이는 TArray<int32>, TArray<FString>, TArray<UMyObject*> 등으로 선언

요소 타입은 다음과 같은 조건을 만족해야 함
- 복사 가능(Copyable): 요소는 복사 생성자를 통해 복사될 수 있어야 함
- 소멸 가능(Destructible): 요소는 소멸자를 통해 적절히 정리될 수 있어야 함

### 할당자 (Allocator)
TArray는 메모리 할당 방식을 결정하는 **할당자(Allocator)**를 선택적으로 지정할 수 있음

|할당자|설명|
|---|---|
| `FDefaultAllocator`   | 기본 힙 기반 할당자 |
| `TInlineAllocator<N>` | 처음 `N`개의 요소는 스택에 할당하고, 그 이후는 힙에 할당. <br> 작은 배열에 유리하며, 스택 할당으로 인해 성능이 향상될 수 있음|
| `TFixedAllocator<N>`  | 고정 크기의 할당자로, 최대 `N`개의 요소만 저장할 수 있다. <br> 초과할 경우 런타임 에러가 발생 |

## ADD vs Emplace
### ADD
함수에 넘긴 인자를 **임시 객체(temporary)**로 만든 후, 그 **임시 객체를 배열 끝에 복사**하거나 이동해서 저장함

```c++
TArray<FString> Arr;
Arr.Add(TEXT("Hello"));
```
- `TEXT("Hello")`는 우선 **임시로 FString이 만들어지고**, 그 임시 객체가 TArray 내부에 복사/이동됨

### Emplace
배열 내부에 **직접 인자를 전달해 객체를 생성**함
```c++
TArray<FString> Arr;
Arr.Emplace(TEXT("Hello"));
```
- `TEXT("Hello")`를 **인자로 받아**서, 배열 메모리 공간에 바로 FString **생성자 호출**

**결론**
- `Add`: 임시 객체 → TArray 내부 복사(힙) (임시 객체는 함수 끝나면 사라짐)
  - **이미 만들어진 객체를 추가할 때 사용**
  - “이 객체를 배열에 더한다”는 의도가 명확함
- `Emplace`: 임시 객체 없이, 바로 TArray 내부(힙)에 생성
  - **임시 객체 생성/복사를 피함 → 성능 최적화**
  - **복잡한 객체 (복사/이동 비용이 큰 구조체 등)에서 효율적**

# TMap
키-값 쌍(key-value pair)을 저장하는 해시 맵(hash map) 구조 컨테이너

## 특징
- 키-값 쌍 저장: 키(Key)와 값(Value)을 쌍으로 저장하는 자료 구조
- 빠른 검색: 해시 테이블 기반으로 구현되어 있어 평균 O(1) 시간 복잡도로 검색 가능
- 템플릿 기반: TMap<KeyType, ValueType> 형태로 사용
- UPROPERTY로 선언 시, 세이브/로드, 네트워크 레플리케이션, 블루프린트에서 접근 가능
   - Key, Value 모두 리플렉션 및 직렬화 지원 타입이어야 함
   - 예: `TMap<FString, float>` → O , `TMap<int32, UObject*>` → X
- TMap은 삽입 순서나 정렬 순서를 보장하지 않음

### 기본 사용법
```c++
// TMap 선언
TMap<FString, int32> FruitPrices;

// 요소 추가
FruitPrices.Add(TEXT("Apple"), 1000);
FruitPrices.Add(TEXT("Banana"), 800);

// 요소 접근
int32 ApplePrice = FruitPrices["Apple"];

// 값 찾기
int32* Score = FruitPrices.Find(TEXT("Apple"));
int32 SafePrice = FruitPrices.FindRef(TEXT("Apple")); // 존재하지 않으면 ValueType의 기본값 반환( int32면 0)

// 값 변경
FruitPrices[TEXT("Apple")] = 90;

// 키 존재 확인
if (FruitPrices.Contains(TEXT("Banana"))) {
    // 처리 코드
}

// 키-쌍 제거
FruitPrices.Remove(TEXT("Apple"));

// 맵 비우기
FruitPrices.Empty();

// 반복문 순회
for (const TPair<FString, int32>& Elem : FruitPrices)
{
    UE_LOG(LogTemp, Log, TEXT("%s: %d"), *Elem.Key, Elem.Value);
}

// 포인터 값 저장 시 안전한 삭제 예시
TMap<FString, MyClass*> ObjectMap;
ObjectMap.Add(TEXT("Obj1"), new MyClass());

TMap<FString, TSharedPtr<MyClass>> SafeMap;
SafeMap.Add(TEXT("Obj1"), MakeShared<MyClass>());
SafeMap.Empty(); // 자동 해제됨
```

## 주요 메서드 정리

| 메서드 | 설명|
|---|---|
| `Add(Key, Value)` | 키-값 쌍 추가, 이미 키가 있으면 값 갱신      |
| `Find(Key)`       | 키에 해당하는 값 포인터 반환, 없으면 nullptr |
| `FindRef(Key)`    | 키에 해당하는 값의 복사본 반환 (키 없으면 기본값) |
| `Contains(Key)`   | 해당 키 존재 여부 반환 (bool) |
| `Remove(Key)`  | 키-값 쌍 제거, 성공 여부 반환|
| `RemoveAndCopyValue(Key, OutValue)` | 키 삭제 + 값 복사 (성공 여부 반환) |
| `Num()`  | 저장된 쌍의 개수 반환|
| `Empty()`| 모든 데이터 삭제|
| `Reset()`| 메모리 해제 및 초기화|
| `operator[]`| \[] 연산자로 값 접근/생성  |
| `GenerateKeyArray()`| 모든 키를 TArray로 반환  |
| `GenerateValueArray()` | 모든 값을 TArray로 반환  |


## 주의사항
- 포인터를 저장할 때는 메모리 관리에 유의 → 스마트 포인터(`TSharedPtr`) 사용 추천
  - Remove()나 Empty()는 맵에서의 연결만 끊을 뿐, 메모리 해제는 하지 않음
  - 만약 new로 할당한 객체를 저장했다면, 별도로 delete 하기
- `operator[]`는 **키가 없으면 기본값(0, nullptr 등) 생성 후 반환**하므로, 의도치 않은 값 생성 가능성 있음
  - 검색 전 `Contains()`로 확인하거나 `Find()`를 권장

## TSet


**참고 링크**
- [TArray](https://dev.epicgames.com/documentation/en-us/unreal-engine/array-containers-in-unreal-engine?application_version=5.4)
- [TMap](https://dev.epicgames.com/documentation/en-us/unreal-engine/map-containers-in-unreal-engine?application_version=5.4)
- [TSet](https://dev.epicgames.com/documentation/en-us/unreal-engine/set-containers-in-unreal-engine?application_version=5.4)
- [TArray vs std::vector](https://youtu.be/Jph7tHe5uL4?si=VMm6lG4cdEtcgDWn)
- [Optimizing TArray Usage for Performance](https://www.unrealengine.com/en-US/blog/optimizing-tarray-usage-for-performance)

