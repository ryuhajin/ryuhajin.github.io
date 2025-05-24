---
layout: default
title: "C++"
nav_order: 3
---

# C++

# 스마트 포인터
- C++11부터 표준 라이브러리에 포함됨
- raw pointer보다 스마트 포인터 사용이 권장됨
- 상황에 맞는 스마트 포인터를 선택하고, 반드시 소유권 규칙을 명확히 해야 함

## 스마트 포인터 종류
### 1. std::unique_ptr
- 단일 소유권(Exclusive ownership): 오직 하나의 포인터만 객체를 소유
- 소유자가 사라질 때(포인터 scope 종료, 소멸자 호출 등) 자동으로 자원 해제
- 복사가 금지되어 있고, 소유권 이동은 move(이동)만 허용
- 용도: 소유권 이전(transfer)이 명확하고, 참조 카운팅이 필요 없는 객체

```c++
#include <memory>

void func() {
    std::unique_ptr<int> ptr1 = std::make_unique<int>(42);
    // std::unique_ptr<int> ptr2 = ptr1; // 컴파일 에러! 복사 불가
    std::unique_ptr<int> ptr2 = std::move(ptr1); // 소유권 이동
}
```

### 2. std::shared_ptr
- 공유 소유권(Shared ownership): 여러 개의 포인터가 동일한 객체를 소유
- 내부적으로 참조 카운트(reference count) 관리
    - (카운트가 0이 되면 자원 해제)
- 용도: 여러 곳에서 동시에 객체를 소유/관리해야 할 때

```c++
#include <memory>

void func() {
    std::shared_ptr<int> ptr1 = std::make_shared<int>(42);
    std::shared_ptr<int> ptr2 = ptr1; // 복사 가능, 참조 카운트 증가
    // ptr1과 ptr2가 모두 소멸되면 메모리 해제
}
```

### 3. std::weak_ptr
- 비소유 참조(Non-owning reference): shared_ptr로 관리되는 객체를 참조하지만, 참조 카운트에는 관여하지 않음
- 주로 순환 참조(circular reference) 방지 목적
- 용도: shared_ptr들 사이에서 서로 참조(특히 그래프, 트리 등)할 때 메모리 누수 방지

```c++
#include <memory>

void func() {
    std::shared_ptr<int> shared = std::make_shared<int>(42);
    std::weak_ptr<int> weak = shared; // 소유권 없음, 참조 카운트 변하지 않음

    if (auto locked = weak.lock()) { // shared_ptr로 잠금 가능
        // 객체가 아직 살아있을 때만 접근 가능
        int value = *locked;
    }
}
```

### 스마트 포인터의 장점
- 자동 메모리 관리: RAII(Resource Acquisition Is Initialization) 패턴 적용
- 예외 안전성: 예외 발생 시에도 자원 누수 없음
- 명확한 소유권 모델: 객체의 라이프사이클이 코드상에서 드러남

### 스마트 포인터의 단점
- 순환 참조 문제: shared_ptr만 사용하면 서로를 참조하는 객체들에서 해제가 안 될 수 있음(→ weak_ptr로 해결)
- 성능 오버헤드: 특히 shared_ptr의 참조 카운트 갱신 비용
- 사용법 혼동 주의: 소유권 이전/공유 규칙이 코딩 컨벤션으로 정립되어야 함

# 람다
- C++11에서 도입된 기능으로, 이름 없는 함수(익명 함수)를 만들 수 있게 해줌
- 간단한 함수 객체(functor)나 콜백(callback) 등을 즉석에서 정의

## 기본 문법과 구조
람다 함수의 기본 형태

```c++
// [캡처](매개변수) -> 반환타입 { 함수본문 }
[capture](parameters) -> return_type {
    // 함수 본문
}
```

- `[capture]` : 외부 변수(스코프 밖의 변수)를 람다 내부에서 사용할 때 어떻게 사용할지 지정
- `(parameters)` : 함수의 매개변수 목록
    - `-> return_type` : 반환 타입 명시 (생략 가능 / 컴파일러가 추론)

## c++98 함수 객체 vs C++11 람다

**c++98**
```c++
struct Compare {
    bool operator()(int a, int b) {
        return a < b;
    }
};

std::vector<int> v;
std::sort(v.begin(), v.end(), Compare()); // 함수 객체 전달
```

**c++11**
```c++
std::vector<int> v;
std::sort(v.begin(), v.end(), [](int a, int b) {
    return a < b; // 람다로 간결하게 표현
});
```

## 람다 핵심 개념 : 캡처 리스트
외부 변수를 람다에서 어떻게 참조할지 결정

|캡처 형태|의미|예시|
|---|---|---|
[]|아무것도 캡처하지 않음|`[]() { /* ... */ }`|
[=]|모든 외부 변수를 값으로 복사|`[=]() { cout << x; }`|
[&]|모든 외부 변수를 참조로 사용|`[&]() { x = 42; }`|
[x, &y]|특정 변수 선택적 캡처|`[x, &y]() { y += x; }`|


### []
```c++
#include <iostream>

int main() {
    int x = 10, y = 20;

    // 외부 변수 캡처 없음 → 오직 매개변수만 사용 가능
    auto lambda = [](int a, int b) {
        return a + b;
    };

    std::cout << lambda(3, 5); // 출력: 8
    // std::cout << lambda(x, y); // ⚠️ x, y는 매개변수로 전달해야 함
}
```

### [=]
- 원본 보존 필요시 사용

```c++
#include <iostream>

int main() {
    int x = 10, y = 20;

    // 모든 외부 변수를 값으로 복사 (x, y의 복사본 사용)
    auto lambda = [=]() {
        std::cout << x + y; // 출력: 30 (원본 x, y는 변경되지 않음)
    };

    lambda();
    x = 100; // 원본 수정
    lambda(); // 출력: 30 (복사본은 영향 없음)
}
```
- 람다가 생성될 때 [=]는 **현재 스코프의 모든 변수 (x 등)를 값으로 복사해 저장**
    - **람다 객체 내부에 int x_copy = x; 같은 복사본이 생김**
- 람다는 **항상 자신이 가진 복사본(x_copy)을 참조하므로, 원본이 변경되어도 복사본은 변하지 않음**

### [&]
- 원본 제어 필요시 사용

```c++
#include <iostream>

int main() {
    int x = 10, y = 20;

    // 모든 외부 변수를 참조로 캡처 (원본 직접 접근)
    auto lambda = [&]() {
        x = 30; // 원본 수정
        std::cout << y; // 출력: 20
    };

    lambda();
    std::cout << x; // 출력: 30 (람다에서 수정된 값)
}
```

### [x, &y]
- 특정 변수만 선택적으로 캡처할 때 사용

```c++
#include <iostream>

int main() {
    int x = 10, y = 20;

    // x는 값으로, y는 참조로 캡처
    auto lambda = [x, &y]() {
        y += x; // y는 원본 참조 (y = 20 + 10)
        // x = 5; // x는 복사본이므로 수정 불가 (mutable 키워드 필요)
    };

    lambda();
    std::cout << y; // 출력: 30 (원본 y 변경됨)
}
```

# 아래부터 나중에 추가 정리해야 할 것
---

언리얼 엔진5의 스마트 포인터
UE5는 C++ 표준 라이브러리와의 호환성 문제(예: 모듈 경계, 플랫폼별 동작 차이)로 자체 스마트 포인터를 제공합니다.

(1) TSharedPtr<>
C++의 std::shared_ptr<>과 유사하지만 UE5 전용 최적화가 적용됨.

관리 대상: UObject를 상속받지 않은 일반 C++ 클래스.

특징:

참조 카운팅 + 스레드 안전성 지원.

TWeakPtr<>으로 약한 참조 가능.

MakeShared<>()로 생성 최적화.

(2) TUniquePtr<>
C++의 std::unique_ptr<>과 거의 동일하지만 UE5 메모리 할당자와 통합됨.

관리 대상: UObject가 아닌 객체.

특징:

복사 불가능, 이동만 가능.

MakeUnique<>()로 생성.

(3) FObjectPtr (UE5+)
UObject 전용으로 설계된 경량 포인터.

C++ 표준과 무관하며, UE5의 가비지 컬렉션 시스템과 연동됩니다.

특징:

UObject의 안전한 참조를 위해 사용 (예: 크로스-스레드 접근 방지).

TSharedPtr<>과 달리 참조 카운팅 없이 엔진 내부에서 관리.

3. C++ vs UE5 스마트 포인터 비교
기능	C++ (std)	UE5	차이점
공유 소유권	std::shared_ptr<>	TSharedPtr<>	UE5는 스레드 안전성 강화.
독점 소유권	std::unique_ptr<>	TUniquePtr<>	UE5는 할당자 통합.
약한 참조	std::weak_ptr<>	TWeakPtr<>	동일한 개념.
가비지 컬렉션	없음	FObjectPtr	UObject 전용.
생성 방법	std::make_shared<>	MakeShared<>	UE5는 커스텀 메모리 풀 사용 가능.
