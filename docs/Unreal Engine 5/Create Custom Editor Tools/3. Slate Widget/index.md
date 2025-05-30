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

# 커스텀 Slate 레이아웃 구현 과정
## 1. Slate 위젯 클래스 정의
- 대부분의 커스텀 슬레이트 위젯은 SCompoundWidget을 상속

```c++
#pragma once

#include "Widgets/SCompoundWidget.h"

class SMyCustomLayout : public SCompoundWidget
{};
```
## 2. Slate 속성 매크로(Arguments) 활용
- SLATE_ARGUMENT: 생성 시 값 1회 전달, 복사.
- SLATE_ATTRIBUTE: 바인딩, 값이 동적으로 변할 수 있음.
- SLATE_EVENT: 델리게이트/함수 포인터 등 이벤트 전달.

```c++
// CustomButtonPanel.h
class SCustomButtonPanel : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SCustomButtonPanel) {}
      // 슬레이트 속성 정의
        SLATE_ARGUMENT(FText, Title)
        SLATE_ARGUMENT(TArray<FText>, ButtonLabels)
        SLATE_EVENT(FOnInt32Selected, OnButtonSelected)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    
private:
    // 위젯 상태 변수
    TArray<FText> ButtonLabels;
    FOnInt32Selected OnButtonSelected;
};
```

## 3. Construct 함수 구현
- ChildSlot을 이용해 Slate 레이아웃 선언
- ChildSlot(컨테이너의 루트)에 원하는 레이아웃 위젯(예: SVerticalBox, SHorizontalBox 등)으로 하위 위젯을 배치

```c++
void SMyCustomLayout::Construct(const FArguments& InArgs)
{
    Title = InArgs._Title;

    ChildSlot
    [
        SNew(SVerticalBox)
        + SVerticalBox::Slot()
        .AutoHeight()
        [
            SNew(STextBlock).Text(FText::FromString(Title))
        ]
        + SVerticalBox::Slot()
        .FillHeight(1.0f)
        [
            SNew(SButton)
            .Text(NSLOCTEXT("MyCustomLayout", "Button", "Click Me"))
            // .OnClicked(....)
        ]
    ];
}
```

## 4. Slate 스타일 및 Theme 적용
- FSlateStyleSet을 사용해 스타일 정의
- FSlateBrush로 브러시 설정
- FSlateFontInfo로 폰트 설정

## 5. 이벤트 처리
- 마우스/키보드 이벤트 바인딩
- 델리게이트를 사용한 커스텀 이벤트
