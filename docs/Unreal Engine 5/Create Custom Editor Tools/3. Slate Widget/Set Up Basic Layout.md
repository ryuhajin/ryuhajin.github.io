---
layout: default
title: "Set Up Basic Layout"
parent: "3. Slate Widget"
nav_order: 3
---

## 목표: 슬레이트 탭 레이아웃 작성

# 레이아웃 샘플 예시 보기
1. 에디터 플러그인 폴더 -> 모듈 콘텐츠 폴더로 이동
2. 우클릭 -> 에디터 유틸리티 -> 에디터 유틸리티 위젯 클릭
3. 생성된 에디터 유틸리티 위젯 더블클릭
4. 검색을 통해 슬롯에 추가 등 샘플 미리 볼 수 있음

# 위젯 여러개 배치
SVerticalBox(세로 박스) 또는 SHorizontalBox(가로 박스)와 같은 패널 위젯을 사용
- 해당 박스들은 여러개의 슬롯을 가질 수 있음 (보통 위젯은 하나의 슬롯만 가짐)

# SNew
위젯을 생성하기 위한 핵심 매크로로, 타입 안전성과 메모리 관리를 자동화하는 데 사용

- 생명주기를 동적으로 제어해야 할 때 SNew를 TSharedPtr 변수에 담아둔다
  - 메모리 관리와 수명 제어가 유연하게 필요하면 TSharedPtr
  - 절대 null이 될 수 없고, 항상 살아있어야 하면 TSharedRef

```c++
// SNew()로 생성된 TSharedRef를 바로 반환하면:
return SNew(SListView<...>); // 임시 객체가 즉시 파괴될 위험

// TSharedPtr에 보관하면 참조 카운트 유지
TSharedPtr < SListView < TSharedPtr <FAssetData> > >  ConstructedAssetListView = SNew(SListView<...>); // 참조 +1
return ConstructedAssetListView.ToSharedRef();   // 참조 +1 (총 2)
```

방식|장점	|단점|
TSharedRef |직접 반환|	간결함|	이후 접근 불가능|
TSharedPtr |저장 후 변환|	생명주기 관리 용이|	코드가 약간 길어짐|

## 특징
1. 메모리 관리 자동화
  - 반환된 TSharedRef가 범위를 벗어나면 자동으로 메모리 해제
  - 명시적인 delete 호출 불필요
2. 빌더 패턴 지원 (`.속성`으로 속성 설정, `[]` 자식 위젯 추가)
3. 타입 안정성
  - 컴파일 타임에 위젯 타입 검증

## 생성 방법

- 생성 방식: SNew(WidgetClass) 형태로 사용하며, **항상 `TSharedRef<WidgetClass>`를 반환**

```c++
TSharedRef<SCheckBox> MyCheckBox = SNew(SCheckBox)
    .IsChecked(true)
    .OnCheckStateChanged(this, &MyClass::Handler);
```

## SVerticalBox
자식 위젯들을 수직 방향(위에서 아래로)으로 배치하는 레이아웃 컨테이너

- 각 자식 위젯은 새로운 행에 배치됨
- SVerticalBox에 슬롯을 추가
  - `.AddSlot()`
  - `+ SVerticalBox::Slot()` 

```c++
// 메인 세로 박스
SNew(SVerticalBox)
+ SVerticalBox::Slot()
.AutoHeight()
[
    // 첫 번째 슬롯: 타이틀 텍스트
    SNew(STextBlock)
    .Text(FText::FromString(TEXT("Advanced Deletion")))
    // 아래에 속성 추가
]
```

## SHorizontalBox
자식 위젯들을 수평 방향으로 배치하는 레이아웃 컨테이너 (왼쪽-> 오른쪽)

- 각 자식은 새로운 열에 배치됨
- `+SHorizontalBox::Slot()`

# 속성 지정자
각각의 컨테이너는 각자의 Slot 구조체를 가지고 있고, 이 Slot의 속성을 통해 레이아웃을 제어할 수 있다
- SVerticalBox::Slot()
- SHorizontalBox::Slot()
- SGridPanel::Slot() 등등

## 주요 Slot 속성 지정자

속성 지정자	|설명	|적용 가능한 컨테이너|
--|--|--|
AutoWidth()	|자식 위젯의 자연스러운 너비로 자동 조정|	SHorizontalBox|
AutoHeight()|자식 위젯의 자연스러운 높이로 자동 조정|SVerticalBox|
FillWidth(float)|사용 가능한 수평 공간을 지정된 비율로 채움 (1.0 = 전체 공간)	|SHorizontalBox|
FillHeight(float)|사용 가능한 수직 공간을 지정된 비율로 채움 (1.0 = 전체 공간)	|SVerticalBox|
Padding(FMargin)|슬롯 내부의 여백 설정 (Left, Top, Right, Bottom)	|모두|
HAlign(HAlign)|수평 정렬 방식 (Left, Center, Right, Fill)	|모두|
VAlign(VAlign)|수직 정렬 방식 (Top, Center, Bottom, Fill)	|모두|
MaxWidth(float)|최대 너비 제한	|SHorizontalBox|
MaxHeight(float)|최대 높이 제한	|SVerticalBox|
Expose(ExposedSlot&)|슬롯을 외부에서 접근할 수 있도록 노출	|모두|

- AutoHeight/AutoWidth: 해당 자식 위젯의 DesiredSize에 맞춰 영역을 할
- FillHeight/FillWidth: 남은 공간을 지정된 가중치대로 자식들에게 분배
  - 예: FillHeight(1.0f), FillHeight(2.0f)로 지정하면 1:2 비율로 높이를 나눔
- HAlign/VAlign : 현재 위젯/슬롯의 자식에 대한 정렬 제어
  - 부모 레이아웃(SVerticalBox, SScrollBox 등)의 슬롯에서 설정 → 자식 위젯의 공간 배분을 결정
  - 자식 위젯(예: STextBlock)에서 직접 설정 → 자신의 할당된 공간 내 정렬을 결정
- Padding: 각 자식 위젯의 Slot에 여백 부여


# STextBlock
순수한 텍스트 렌더링에 특화된 텍스트 표시를 위한 기본 위젯

## 특징
- 고성능 렌더링: DirectX/OpenGL 기반 하드웨어 가속 텍스트 렌더링
- 다국어 지원: FText와 통합된 LOC 시스템(로컬라이제이션)
- 스타일 커스터마이징: 폰트, 색상, 정렬 등 완전한 제어 가능
- 동적 업데이트: 텍스트 내용 실시간 변경 가능
- 레이아웃 통합: 다른 슬레이트 위젯과 자유롭게 조합 가능

## 생성 방법
```c++
TSharedRef<STextBlock> MyTextBlock = SNew(STextBlock)
    .Text(LOCTEXT("Greeting", "안녕하세요!"))
    .Font(FSlateFontInfo("Roboto", 16))
    .ColorAndOpacity(FLinearColor::White);

// 동적 바인딩
FText GetDynamicText() const;

// 구현
SNew(STextBlock)
.Text(this, &MyClass::GetDynamicText)
```

# 주요 속성
## .Text
표시할 텍스트. FText 사용

## .Font
폰트 정보. 스타일, 크기, 폰트 패밀리 등 지정
- 아래의 FSlateFontInfo 참고

## .ColorAndOpacity
텍스트 색상 및 투명도(FSlateColor)

```c++
.ColorAndOpacity(FSlateColor(FLinearColor::Red))

// FLinearColor 바로 전달
.ColorAndOpacity(FLinearColor::Green)
```

## .Justification
정렬 방식 (ETextJustify::Type)

## .AutoWrapText
자동 줄바꿈 여부

```c++
.AutoWrapText(true) // 영역에 맞춰 자동 줄바꿈
```

## .MinDesiredWidth
최소 너비(줄바꿈용)

```c++
.MinDesiredWidth(200.0f)
```

## .WrappingPolicy
줄바꿈 정책 (UE5에서 도입, 텍스트 나누는 방식 선택)

```c++
.WrappingPolicy(ETextWrappingPolicy::DefaultWrapping)
```

## STextBlock 속성 지정 정리
```c++
// 텍스트 블록에 적용
SNew(STextBlock)
.Font(FontInfo) // FSlateFontInfo 구조체 사용
.Text(FText::FromString("Hello Unreal"))
.ColorAndOpacity(FLinearColor::White)
.Justification(ETextJustify::Center);
```

| 지정자 | 설명 | 예시 코드 |
|---|---|---|
| `.Text(FText)` | 표시할 텍스트 지정  | .Text(FText::FromString(TEXT("Hello"))) |
| `.Font(const FSlateFontInfo&)`| 폰트 패밀리/크기/스타일 지정  |.Font(FSlateFontInfo("Roboto-Bold", 24)) |
| `.ColorAndOpacity(FSlateColor)`  | 텍스트 색상 및 불투명도(알파) 지정 | .ColorAndOpacity(FLinearColor::Red)|
| `.ShadowOffset(FVector2D)` | 텍스트 그림자 오프셋(거리)| .ShadowOffset(FVector2D(1, 1)) |
| `.ShadowColorAndOpacity(FLinearColor)` | 텍스트 그림자 색상 및 알파| .ShadowColorAndOpacity(FLinearColor::Black)|
| `.Justification(ETextJustify::Type)`| 텍스트 정렬(좌/중앙/우) | .Justification(ETextJustify::Center) |
| `.WrapTextAt(float)` | 지정한 너비에서 텍스트 줄바꿈  | .WrapTextAt(200.0f) |
| `.MinDesiredWidth(float)`  | 최소 표시 너비 | .MinDesiredWidth(50.0f)|
| `.LineHeightPercentage(float)`| 줄 간격 비율(1.0=기본)| .LineHeightPercentage(1.2f)|
| `.AutoWrapText(bool)`| 컨테이너 너비에 맞춰 자동 줄바꿈| .AutoWrapText(true) |


# FSlateFontInfo
Slate 위젯에 텍스트 스타일 지정에 사용되는 구조체. 폰트 스타일, 크기 정보

- `STextBlock`의 폰트 속성 지정자에 사용

```c++
struct FSlateFontInfo
{
    UObject* FontObject; // 사용할 폰트 객체 (UFont 또는 FSlateFontInfo::GetFont)
    FName TypefaceFontName; // 폰트 페이스 이름(예: "Bold", "Regular")
    int32 Size; // 폰트 크기
    FName FontMaterial; // 폰트 머티리얼
    TEnumAsByte<EFontHinting> Hinting; // 폰트 힌팅 방식
    bool bEnableOutline; // 아웃라인 사용 여부
    float OutlineSize; // 아웃라인 크기
    FLinearColor OutlineColor; // 아웃라인 색상
};
```

## 생성 방법

```c++
// 에디터에서 제공하는 폰트 사용
FSlateFontInfo FontInfo = FCoreStyle::Get().GetFontStyle("Bold", 18);

// 직접 지정
FSlateFontInfo FontInfo("Roboto-Regular", 24); // 폰트 패밀리, 크기

// 경로로 지정
FSlateFontInfo FontInfo(
    FPaths::EngineContentDir() / TEXT("Slate/Fonts/Roboto-Regular.ttf"),
    20
);
```

# FSlateColor
UI 요소의 색상 및 투명도(opacity)를 표현하고, 동적으로 바인딩하거나 테마 기반으로 자동 갱신할 수 있게 설계된 컬러 래퍼 구조체

- `.ColorAndOpacity` 등 여러 스타일 속성에서 사용되는 색상 타입
- 내부적으로 `FLinearColor` 값을 갖음
- 직접 색상 지정 또는 Slate 색상 테마 (브러시/스타일) 참조 둘 다 지원

## 특징
- 정적 색상: 고정된 FLinearColor 값
- 동적 바인딩: Slate Attribute 시스템을 통한 동적 색상 변경
- Slate 브러시/스타일 연동: 테마/스타일에서 정의된 색상 참조 가능
- 투명도(Opacity) 포함

## 생성 예시
```c++
// 정적 색상 지정
.ColorAndOpacity(FSlateColor(FLinearColor::Red))
.ColorAndOpacity(FSlateColor(FLinearColor(1, 0.5, 0, 1))) // 오렌지색, RGBA

// FLinearColor 타입을 FSlateColor 생성자에 바로 전달해도 자동 변환
.ColorAndOpacity(FLinearColor::Green)

// 동적 속성 바인딩 (예: 상태에 따른 색상 변경)
.ColorAndOpacity(this, &SMyWidget::GetTextColor)

FSlateColor SMyWidget::GetTextColor() const
{
    return bIsError ? FLinearColor::Red : FLinearColor::White;
}
```

## 스타일 기반 참조
- 스타일 시스템이 지정한 색상 사용
- 테마가 바뀌면 자동으로 색상이 바뀌도록 할 때 필수적
```c++
.ColorAndOpacity(FSlateColor::UseForeground())
.ColorAndOpacity(FSlateColor::UseSubduedForeground())
```
