---
layout: default
title: "Spawn A Coustom Editor Tab"
parent: "3. Slate Widget"
nav_order: 1
---

## 목표 : 커스텀 에디터 탭 등록

# SlateWidget 매크로
- `SLATE_BEGIN_ARGS` , `SLATE_END_ARGS` 매크로는 필수적으로 클래스 안에 들어가야 함

## SLATE_BEGIN_ARGS / SLATE_END_ARGS
위젯의 생성자 인자 구조체인 FArguments를 정의
- SLATE_BEGIN_ARGS는 구조체의 시작
- SLATE_END_ARGS는 구조체의 끝
- 시작과 끝 매크로 안에서 위젯의 속성, 이벤트 등을 선언

```c++
SLATE_BEGIN_ARGS(SMyWidget) //  시작 선언
    : _Title(FText::FromString("Default Title")) // 기본값 설정
{}
    SLATE_ARGUMENT(FText, Title)
    SLATE_ATTRIBUTE(int32, Count)
    SLATE_EVENT(FOnClicked, OnButtonClicked)
SLATE_END_ARGS() // 끝 선언
```

## SLATE_ARGUMENT(Type, Name)
생성자 인자로 전달되는 불변 값을 선언

- `SLATE_ARGUMENT(FText, Title)`은 FText 타입의 Title이라는 인자를 선언
- FArguments 구조체 내에서 `_Title`로 접근

## SLATE_ATTRIBUTE(Type, Name)
동적으로 변경 가능한 속성을 선언

>
외부 데이터와 바인딩하여 UI 요소가 실시간으로 업데이트되도록 할 수 있다

- `SLATE_ATTRIBUTE(int32, Count)`은 Count라는 이름의 속성을 선언

## SLATE_EVENT(DelegateType, Name)
위젯에서 발생하는 이벤트를 처리할 델리게이트를 선언

## SLATE_NAMED_SLOT(OwnerArgsType, SlotType, SlotName)
사용자 정의 슬롯을 선언할 때 사용. 슬롯은 위젯의 특정 위치에 다른 위젯을 삽입할 수 있는 영역을 의미

## 매크로 정리

매크로|용도|사용 예시|설명|
|---|---|---|---|
SLATE_BEGIN_ARGS|위젯 생성 인자 정의 시작|SLATE_BEGIN_ARGS(SMyWidget)|클래스의 생성 인자 정의 블록을 시작|
SLATE_END_ARGS	|위젯 생성 인자 정의 종료|SLATE_END_ARGS()|생성 인자 정의 블록을 종료|
SLATE_ARGUMENT	|단일 값 인자 정의|SLATE_ARGUMENT(FText, InitialText)	|위젯 생성 시 전달되는 단일 값 인자|
SLATE_ATTRIBUTE	|바인딩 가능한 속성 정의|SLATE_ATTRIBUTE(FText, DisplayText)|동적으로 변경 가능한 속성(TAttribute로 래핑됨)|
SLATE_EVENT|이벤트 핸들러 정의|SLATE_EVENT(FOnClicked, OnButtonClicked)|위젯에서 발생하는 이벤트 핸들러|
SLATE_STYLE_ARGUMENT|스타일 인자 정의|SLATE_STYLE_ARGUMENT(FName, StyleName)|스타일 세트에서 스타일을 지정하는 인자|
SLATE_DEFAULT_SLOT|기본 슬롯 속성 정의|SLATE_DEFAULT_SLOT(FArguments, Content)|위젯의 기본 콘텐츠 슬롯을 정의|
SLATE_NAMED_SLOT|명명된 슬롯 정의|SLATE_NAMED_SLOT(FArguments, Header)|특정 이름을 가진 슬롯을 정의|
SLATE_SUPPORTS_SLOT|슬롯 타입 지원 선언|SLATE_SUPPORTS_SLOT(SVerticalBox::FSlot)|위젯이 지원하는 슬롯 타입 선언|
SLATE_USER_ARGS|사용자 정의 인자 구조체|SLATE_USER_ARGS()|사용자 정의 인자 구조체 정의 시 사용|

#  SlateWidget 초기화 설정하기
Slate 위젯은 생성자(constructor) 대신 **Construct() 함수를 통해 실질적인 초기화를 수행한다**
- 엔진에서 위젯 인스턴스를 만든 뒤 곧바로 Construct를 호출하여 속성(Arguments)과 함께 위젯의 동작을 설정함

## 코드 예시

```c++
void SYourWidget::Construct(const FArguments& InArgs)
{
    // 1. 포커스 관련 설정
    bCanSupportFocus = true; // 또는 false (위젯 용도에 따라)
    
    // 2. 마우스 이벤트 처리 설정
    SetCanTick(true); // 틱 활성화 (애니메이션 등 필요시)
    bAcceptsInput = true; // 마우스/터치 입력 허용
    
    // 3. 시각적 상태 설정
    SetVisibility(EVisibility::Visible); // 기본 가시성 설정
    
    // 4. 콘텐츠 구성 (가장 중요한 부분)
    ChildSlot
    [
        // 위젯 계층 구조 정의
        SNew(SBorder)
        .Padding(FMargin(5))
        [
            SNew(STextBlock)
            .Text(LOCTEXT("DefaultText", "Hello Slate!"))
        ]
    ];
    
    // 5. 인자에서 전달받은 값 적용
    if (InArgs._SomeArgument.IsSet())
    {
        // 인자 처리 로직
    }
}
```

## 초기화 설정 정리

설정	|설명|	기본값|	사용 예시|
---|---|---|---|
bCanSupportFocus|위젯이 키보드 포커스를 받을 수 있는지 설정|	false	|bCanSupportFocus = true;|
bAcceptsInput	|마우스/터치 입력 허용 여부	|false	|bAcceptsInput = true;|
SetVisibility()	|위젯의 가시성 설정 <br> (Visible, Collapsed, Hidden, HitTestInvisible, SelfHitTestInvisible)|	EVisibility::Visible	|SetVisibility(EVisibility::Visible);|
SetCanTick()	|위젯이 Tick 이벤트를 받을지 설정 (애니메이션, 실시간 업데이트 시 필요)|	false	|SetCanTick(true);|
SetClipping()	|콘텐츠 클리핑 방식 <br> (OnDemand, ClipToBounds, ClipToBoundsWithoutIntersecting, ClipToBoundsAlways)|	EWidgetClipping::Inherit|	SetClipping(EWidgetClipping::ClipToBounds);|
SetCursor()|	마우스 오버 시 커서 모양 (Default, Hand, TextEdit, Crosshairs 등)	|EMouseCursor::Default	|SetCursor(EMouseCursor::Hand);|
SetEnabled()	|위젯의 활성화/비활성화 상태|	true|	SetEnabled(TAttribute<bool>(this, &SMyWidget::IsEnabled));|
SetToolTipText()	|툴팁 텍스트 설정|	FText::GetEmpty()	|SetToolTipText(LOCTEXT("Tooltip", "Click me!"));|
SetHAlign() / SetVAlign()	|수평/수직 정렬 (HAlign_Fill, VAlign_Center 등)|	HAlign_Fill, VAlign_Fill	|SetHAlign(HAlign_Center);|
SetPadding()	|안쪽 여백 설정|	FMargin(0)|	SetPadding(FMargin(5.0f));|
SetRenderTransform()	|변환 행렬 적용 (위치, 회전, 스케일)|	FSlateRenderTransform()|	SetRenderTransform(FSlateRenderTransform(FVector2D(10, 10)));|
SetRenderOpacity()|	투명도 설정 (0.0 ~ 1.0)	|1.0f	|SetRenderOpacity(0.5f);|
SetForegroundColor()|	전경색 (텍스트, 아이콘 등)	|FSlateColor::UseForeground()|	SetForegroundColor(FLinearColor::White);|

# 커스텀 위젯 플로우 요약
1. 사용자 정의 Slate 위젯 클래스 구현
2. 에디터 확장 코드에서 커스텀 Slate 위젯 인스턴스 생성
- (예: 커스텀 패널, 탭, 도킹 윈도우 등에서 SNew(SMyWidget) 사용)
3. Slate 위젯 트리(Widget Tree)에 삽입
- 에디터 패널/탭/도킹 윈도우 등의 컨테이너가 커스텀 Slate 위젯의 부모가 됨
4. Slate Application이 매 프레임마다 Tick & Render 호출
- Slate 렌더링 파이프라인에 따라 모든 위젯을 탐색하며 그리기
- DirectX/OpenGL/Vulkan 등 RHI 기반 드로우콜로 변환
5. 사용자 입력/이벤트 처리 및 갱신
- Slate Application이 마우스/키보드/포커스 등 이벤트 분배

![](/images/SlateWidgetprocess.png)
