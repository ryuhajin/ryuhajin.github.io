---
layout: default
title: "Construct SCheckBox"
parent: "3. Slate Widget"
nav_order: 5
---

## 목표 : 체크 박스를 통해 SListView 의 에셋 선택

# SCheckBox
슬레이트(UI 프레임워크)에서 제공하는 체크박스 위젯. 사용자가 선택/해제할 수 있는 상호작용 요소

## 특징
1. 기본 기능
- 켜짐/꺼짐 상태를 나타내는 박스와 레이블로 구성
- 마우스 클릭이나 키보드로 상태 전환 가능
- 일반 체크박스, 라디오 버튼, 토글 버튼 등 다양한 형태로 사용 가능
2. 상태 종류
- **ECheckBoxState::Unchecked** : 선택된 상태
- **ECheckBoxState::Unchecked** : 선택되지 않은 상태
- **ECheckBoxState::Undetermined** : 부분 선택 또는 결정되지 않은 상태(3-state 체크박스)
  - 스위치 케이스 문을 통해 각 상태 별로 동작 다르게 설정 가능

## 기본 사용법
```c++
TSharedRef<SCheckBox> MyCheckBox = SNew(SCheckBox)
    .IsChecked(ECheckBoxState::Unchecked) // 초기 상태 설정
    .OnCheckStateChanged(this, &MyClass::HandleCheckStateChanged) // 상태 변경 핸들러
    [
        SNew(STextBlock)
        .Text(LOCTEXT("CheckBoxLabel", "옵션 활성화"))
    ];
```

# 주요 속성
## .Type
SCheckBox의 시각적/기능적 동작 모드를 결정하는 속성
- `ESlateCheckBoxType::`을 통해 타입 지정 가능

### enum ESlateCheckBoxType
```c++
enum class ESlateCheckBoxType : uint8
{
    /** 표준 체크박스 (사각형, 체크 표시) */
    CheckBox,

    /** 라디오 버튼 (원형, 동그라미가 채워지는 형태, 그룹 내 단일 선택) */
    RadioButton,

    /** Toggle 버튼 (스위치 느낌의 토글형 UI, UE5에서 추가됨) */
    ToggleButton
};
```
### .Type 속성 사용예시
```c++
SNew(SCheckBox)
    .Type(ESlateCheckBoxType::CheckBox)
    .IsChecked(...)
    .OnCheckStateChanged(...)
    [
        SNew(STextBlock).Text(FText::FromString(TEXT("옵션 1")))
    ]
```

| 값 | 설명 및 사용 예시|
|---|---|
| `CheckBox`| - 일반적인 체크박스 UI<br>- 여러 항목을 중복 선택 가능<br>- `✔` 표시 또는 3-state(불확정) 표시 지원 |
| `RadioButton`  | - 원형 라디오 버튼 UI<br>- 한 그룹에서 한 항목만 선택 가능<br>- 중복 선택 불가 |
| `ToggleButton` | - 스위치 UI처럼 On/Off 시각적 효과<br>- 단일 토글용 (스마트폰의 토글 스위치와 유사)|


## .IsChecked
체크박스의 현재 체크 상태를 반환하는 델리게이트 지정
- Slate Tick 주기마다 IsChecked에 지정된 함수를 호출하여 UI에 표시할 상태를 동적으로 갱신
- 내부 데이터(`bOptionEnabled`)가 바뀌면, Slate가 자동으로 체크 상태를 갱신해서 보여줌

### .IsChecked 속성 사용예시
```c++
.IsChecked(this, &SMyWidget::GetCheckBoxState)

ECheckBoxState SMyWidget::GetCheckBoxState() const
{
    return bOptionEnabled ? ECheckBoxState::Checked : ECheckBoxState::Unchecked;
}
```

## .OnCheckStateChanged
사용자가 체크박스를 클릭하여 체크 상태가 변경될 때마다 호출되는 델리게이트
- 이벤트의 파라미터로 새 상태(`ECheckBoxState`)가 전달
- 이 핸들러에서 보통 내부 상태를 갱신하거나, 추가 로직(예: 설정값 저장 등)을 처리
- 보통 `.IsChecked`와 연결된 멤버 변수(`bOptionEnabled`)를 여기서 변경

### .OnCheckStateChanged 속성 사용예시
```c++
.OnCheckStateChanged(this, &SMyWidget::OnCheckBoxStateChanged)

void SMyWidget::OnCheckBoxStateChanged(ECheckBoxState NewState)
{
    bOptionEnabled = (NewState == ECheckBoxState::Checked);
}
```

## .Visibility
SWidget에서 사용 가능한 표시/숨김 상태를 제어하는 속성

-  **EVisibility::Visible** : 위젯이 보이고 상호작용 가능
-  **EVisibility::Collapsed** :  위젯이 보이지 않고, 공간도 차지하지 않음
-  **EVisibility::Hidden** : 위젯이 보이지 않지만, 공간은 차지함

### .Visibility 속성 사용예시
```c++
SNew(SCheckBox)
    .Visibility(EVisibility::Visible)     // 항상 보임
```
```c++
// 동적 컨트롤
SNew(SCheckBox)
    .Visibility(this, &SMyWidget::GetCheckBoxVisibility)

EVisibility SMyWidget::GetCheckBoxVisibility() const
{
    return bShouldShow ? EVisibility::Visible : EVisibility::Collapsed;
}
```
