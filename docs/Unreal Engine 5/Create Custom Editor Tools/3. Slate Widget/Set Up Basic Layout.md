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
- HAlign/VAlign: 박스 안에서 자식 위젯의 정렬을 결정
- Padding: 각 자식 위젯의 Slot에 여백 부여


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

## 텍스트 속성 지정
텍스트 속성 지정은 `STextBlock`을 사용해 지정한다
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
