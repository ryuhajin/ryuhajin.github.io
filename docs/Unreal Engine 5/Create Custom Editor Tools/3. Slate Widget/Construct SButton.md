---
layout: default
title: "Construct SButton"
parent: "3. Slate Widget"
nav_order: 6
---

## 목표 : SListView 에 delete 버튼 생성

# SButton
사용자 상호작용 (클릭, 호버 등)을 처리하는 클릭 가능한 버튼을 구현한 위젯

- SPrimitiveButton을 상속

## 특징
- 다양한 상호작용 상태 
  - Normal 기본
  - Hovered 호버
  - Pressed 클릭
  - Disabled 비활성
- 커스텀 콘텐츠 지원 : 텍스트, 아이콘, 복합 위젯 수용 가능
- 접근성 기능 : 키보드 포커스, 게임패드 네비게이션 지원
- 시각적 피드백 : 클릭 애니메이션, 상태별 스타일 변경

## 생성 예시
```c++
TSharedRef<SButton> MyButton = SNew(SButton)
    .Text(LOCTEXT("Submit", "제출"))
    .OnClicked(FOnClicked::CreateLambda([](){
        UE_LOG(LogTemp, Warning, TEXT("Button Clicked!"));
        return FReply::Handled();
    }));
```

## 동작 원리
1. SButton이 클릭/호버/누름 상태를 감지해 스타일을 변경
2. 클릭 등 입력 이벤트 발생 시, Delegate(예: `OnClicked`)에 바인딩된 함수가 호출
3. 버튼 내부에 포함된 Slate 위젯은 Slot에 넣는 방식으로 조합 가능
4. 비활성(Disable) 상태는 입력 차단 및 스타일 변경

# 주요 속성
## .OnClicked
버튼 클릭 시 호출될 델리게이트. 반드시 **FReply를 반환**

```c++
SNew(SButton)
    .OnClicked(this, &SMyWidget::OnButtonClicked)

FReply SMyWidget::OnButtonClicked()
{
    // 버튼 클릭 시 동작 구현
    return FReply::Handled();
}
```

## .OnPressed
버튼이 눌리는 순간(마우스 다운 등)에 호출되는 델리게이트

```c++
SNew(SButton)
    .OnPressed(this, &SMyWidget::OnButtonPressed)

void SMyWidget::OnButtonPressed()
{
    // 버튼을 누르는 순간의 처리
}
```

## .OnReleased
버튼을 눌렸다가 뗄 때(마우스 업)에 호출되는 델리게이트

## .IsEnabled()
버튼의 활성/비활성(Enable/Disable) 상태를 지정

```c++
SNew(SButton)
    .IsEnabled(true) // 항상 활성

// 동적 제어 예시
.IsEnabled(this, &SMyWidget::IsButtonEnabled)

bool SMyWidget::IsButtonEnabled() const
{
    return bCanClickButton;
}
```

## SButton 속성 정리

| 속성명  | 설명 | 코드 예시     |
|---|---|---|
| `.OnClicked`  | 버튼 클릭 시 호출될 델리게이트 (반환: FReply)   | `.OnClicked(this, &SMyWidget::OnButtonClicked)`   |
| `.OnPressed`  | 마우스 버튼 눌렀을 때 호출 | `.OnPressed(this, &SMyWidget::OnButtonPressed)`   |
| `.OnReleased` | 마우스 버튼 뗐을 때 호출  | `.OnReleased(this, &SMyWidget::OnButtonReleased)` |
| `.IsEnabled`  | 버튼 활성/비활성 바인딩| `.IsEnabled(bEnableButton)`   |
| `.ContentPadding`  | 버튼 내부 패딩     | `.ContentPadding(FMargin(10,5))` |
| `.ButtonColorAndOpacity` | 버튼 배경 색 및 투명도| `.ButtonColorAndOpacity(FLinearColor::Blue)`|
| `.ForegroundColor` | 버튼 내부 컨텐츠(주로 텍스트) 색상  | `.ForegroundColor(FLinearColor::White)`|
| `.HAlign`     | 내부 컨텐츠 수평 정렬 | `.HAlign(HAlign_Center)`|
| `.VAlign`     | 내부 컨텐츠 수직 정렬 | `.VAlign(VAlign_Center)`|
| `.Style`| 버튼 스타일(FButtonStyle) 지정    | `.Style(&MyCustomStyle)`      |
| `[ ... ]`     | 버튼 내부 컨텐츠 (STextBlock, SImage 등) | `[SNew(STextBlock).Text(...)]`|

# FReply
UI 입력 이벤트에 대한 처리 결과와 후속 동작을 Slate에 전달하는 응답 객체

- SlateCore 모듈에 정의된 불변(Immutable) 객체
  - 불변 객체 : 생성 후 값이 변하지 않는 객체 
  - 체이닝 방식 (setter 메서드)은 내부적으로 새로운 객체를 복사, 반환
  - 멀티스레드 환경에서 안전, 예측 가능한 동작 보장
- 대부분의 Slate 입력 이벤트 델리게이트(특히 OnClicked, OnMouseButtonDown 등)의 반환 타입
- 이벤트 버블링(Bubbling) 및 전파(Propagation) 제어
  - 이벤트 전파 방향: 하위 -> 상위

## 특징
- **체이닝 디자인**: 메서드 체인으로 복합 동작 구성 가능
- **스레드 안전성**: 모든 메서드가 const로 선언되어 재사용 가능
- **이벤트 라우팅**: 입력 이벤트의 계층적 전파 제어
- **다양한 응답 타입**: 핸들링 여부, 포커스 변경, 커서 모드 등 지원
- **고성능**: 힙 할당 없이 스택에서 작동 (약 16바이트 크기)

## 사용 예시
```c++
FReply MyWidget::OnMouseButtonDown(const FGeometry& Geometry, const FPointerEvent& Event)
{
    if (Event.GetEffectingButton() == EKeys::LeftMouseButton)
    {
        // 이벤트 처리 완료
        return FReply::Handled().ReleaseMouseCapture();
    }
    return FReply::Unhandled(); // 이벤트 계속 전파
}
```
## FReply 생성과 라이프사이클
1. FReply는 함수 내에서 “임시로” 생성되는, 단순한 값 객체(value type, struct)
2. 이벤트 핸들러(예: OnClicked, OnMouseButtonDown)가 호출될 때마다 매번 새로운 FReply 인스턴스가 반환됨
3. 반환 이후에는 Slate가 해당 객체를 해석해서 입력 전파/포커스 등 후속 처리
    - 그 후 FReply 인스턴스는 더 이상 사용되지 않음

## 동작 원리
1. 이벤트 수신
   - 슬레이트 입력 시스템이 이벤트 분배
2. 응답 생성
   - 위젯이 Handled() 또는 Unhandled() 반환
3. 전파 결정
   - Unhandled 시 부모 위젯으로 이벤트 버블링
4. 부가 작업 (이벤트 체이닝)
   - 핸들링 후 추가 명령 실행(포커스 변경 등)

# 주요 메서드
## FReply::Handled()
입력 처리

```c++
FReply SMyWidget::OnButtonClicked()
{
    // 버튼 클릭에 대한 동작 수행
    return FReply::Handled();
}
```

## FReply::Unhandled()
입력 무시 -> 부모나 다른 위젯에게 이벤트 위임

```c++
FReply SMyWidget::OnButtonClicked()
{
    // 클릭을 무시(부모나 다른 위젯에게 이벤트 위임)
    return FReply::Unhandled();
}
```

### Handled() vs Unhandled() 동작 비교

구분|	Handled()	|Unhandled()|
의미|	"이 이벤트는 처리 완료됨"	|"이 이벤트를 더 처리해야 함"|
전파|	즉시 중단	|부모 위젯으로 계속 전달|
사용 사례|	버튼 클릭 처리 후	|이벤트를 추가로 처리해야 할 때|
체이닝|	추가 액션 연결 가능	|추가 액션 연결 불가능|

## 포커스 제어 (체이닝)
입력 후 추가 행동 설정

```c++
// 체이닝 예시
FReply Reply = FReply::Handled().SetUserFocus(...).CaptureMouse(...);

FReply SMyWidget::OnButtonClicked()
{
    return FReply::Handled().SetUserFocus(MyWidgetSharedRef, EFocusCause::SetDirectly);
}
```

## 주요 메서드 정리

| 메서드  | 설명|                       
|---|---|
| `Handled()`| 이벤트를 처리함(기본 FReply 생성) |
| `Unhandled()`| 이벤트를 무시함  | 
| `SetUserFocus(TSharedRef<SWidget>)`| 특정 위젯에 키보드 포커스 부여   | 
| `ClearUserFocus(bool bInAllUsers)`| 포커스 제거|
| `CaptureMouse(TSharedPtr<SWidget>)`| 위젯에 마우스 캡처(드래그 등)   |
| `ReleaseMouseCapture()`    | 마우스 캡처 해제    |
| `SetMousePos(FVector2D)`   | 마우스 커서 위치 강제 이동 |
| `SetCursor(EMouseCursor::Type)`   | 커서 모양 변경     |
|`.SetKeyboardFocus(TSharedPtr<SWidget>)`|  키보드 포커스 설정|
|`.SetUserFocus(EFocusCause::SetDirectly)` |사용자 포커스 설정|
|`.ClearUserFocus(EFocusCause::Cleared)` | 포커스 해제|
| `PreventThrottling()`      | Slate Tick 최적화 예외(강제 업데이트) |
| `DetectDrag(TSharedPtr<SWidget>, EKeys)` | 드래그 시작 이벤트 감지| 
| `BeginDragDrop(TSharedRef<FDragDropOperation>)` | 커스텀 드래그 앤 드롭 시작     |
| `EndDragDrop()`     | 드래그 앤 드롭 종료  |
| `RouteReplyThrough(TSharedPtr<SWidget>)` | 이벤트를 다른 위젯을 통해 라우팅  |
| `ScrollToWidget(TSharedPtr<SWidget>)`    | 특정 위젯 위치로 스크롤 이동    | 

### 응답 객체 상태 검사 관련 메서드

| 메서드  | 설명 | 
|---|---|
| `IsEventHandled()` | 이벤트 처리 여부     | 
| `GetMouseCaptor()` | 마우스 캡처한 위젯 반환 | 
