---
layout: default
title: "3. Slate Widget"
parent: "Create Custom Editor Tools"
nav_order: 3
has_children: true
---

## 목표 : 에디터 확장을 더 깊게 다루기 위해 슬레이트(Slate) 코드를 직접 작성해보자

## 슬레이트가 어렵게 느껴지는 이유
1. 슬레이트 코드는 고유의 문법을 가지고 있다
- 일반적인 C++ 코드와 매우 다르다
2. 시각화가 어렵다
- 위젯 레이아웃을 전부 코드로만 해야 한다는 것이 문제
- 변경한 내용을 바로바로 미리보기로 확인할 수 없다
3. 다른 모듈과의 연동
- 다른 모듈과 데이터를 주고받고 상호작용하는 것이 바로 연동(communication)이다
- 이 부분이 슬레이트 위젯을 구현할 때 가장 어렵고 중요하다

## 스마트 포인터
모듈 간의 데이터 전달 문제(communication issue)를 해결하기 위해서는 반드시 이해해야 할 중요한 개념

>
언리얼 엔진에서는 new 키워드를 직접 써서 객체를 만들도록 허용하지 않는다
- new 키워드로 메모리를 할당할 일이 있다면, 반드시 스마트 포인터와 함께 쓴다

### UE에서 지원하는 스마트 포인터
- Shared Pointer (TSharedPtr)
- Shared Reference (TSharedRef)
- Weak Pointer (TWeakPtr)
- Unique Pointer (TUniquePtr)

### TSharedPtr (Shared Pointer, 공유 포인터)
- 소유권(Owning) 보유: Shared Pointer는 해당 객체의 소유권을 갖는다
이 포인터가 존재하는 한 객체는 삭제되지 않음

- 참조 카운팅(reference counting) 방식:
이 객체를 참조하는 Shared Pointer/Reference가 모두 사라지면 자동으로 삭제

- null 할당 가능:
아직 가리키는 대상이 없어도 선언만 할 수 있다

### TSharedRef (Shared Reference, 공유 참조)
Shared Pointer와 거의 동일하지만 항상 유효한 객체만 가리킬 수 있다다

- null 할당 불가능:
항상 유효한 인스턴스가 존재해야 하므로, 슬레이트 함수 반환값 등에서 주로 사용

- 따라서 Shared Reference는 언제나 Shared Pointer로 변환할 수 있다

- 유효한 Shared Pointer는 언제나 Shared Reference로 변환이 가능하다

### TWeakPtr (Weak Pointer, 약한 참조)
- 소유권을 갖지 않음: Weak Pointer는 객체의 소유권이 없음
객체가 삭제되는 것을 막지 않는다

- “참조 순환(Reference Cycle)” 문제를 해결할 때 매우 유용하다
즉, 객체가 살아있을 때만 약하게 참조하고, 객체가 삭제되면 자동으로 무효(null)가 된다

- 사용할 때마다 “이 객체가 아직 살아 있나요?”라고 먼저 체크해야 하며,
살아있으면 사용할 수 있다

{: .new-title}
> ❓게임 개발에서는 잘 안 보이는 이유?
>
> - 스마트 포인터들은 UObject 기반 오브젝트에서는 쓸 수 없다
> - UObject 시스템 자체가 고유한 메모리 관리(가비지 컬렉션)를 사용하기 때문
> - Object 포인터를 직접 스마트 포인터로 관리하면
엔진의 GC 시스템과 충돌이 생김

## 스마트 포인터 생성 문법
```c++
TSharedRef<FMyType> MyObject = MakeShareable(new FMyType(...));
```

- MakeShareable
  - public 생성자가 필요하지만 훨씬 효율적 
- MakeShared
  - 제한이 덜하지만, 약간 비효율적 

> 위 함수들은  객체 인스턴스를 생성과 동시에 만든다

```c++
TSharedPtr<FMyType> Ptr = MakeShared<FMyType>(...);
```

슬레이트 위젯을 만들 때 자주 사용됨
