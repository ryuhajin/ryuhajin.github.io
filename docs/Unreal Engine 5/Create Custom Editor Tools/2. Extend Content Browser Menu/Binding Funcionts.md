---
layout: default
title: "Binding Funcionts"
parent: "2. Extend Content Browser Menu"
nav_order: 2
---

## 목표: hook을 사용해 메뉴 엔트리, 메뉴 항목, 사용할 함수 바인딩 하기

# 에디터에서 Extension hook 보기
1. 언리얼 에디터 툴바에서 편집 클릭
2. 하단 환경설정의 에디터 환경설정 클릭
3. 에디터 환경설정 창의 검색에 ui extension 입력
4. Developer Tools의 Display UI Extension Points 활성화

# FExtender와 FExtensionBase의 동작 원리 이해하기
- FExtender = 각각의 FExtensionBase 정보를 통합
- FExtensionBase = 메뉴, 툴바 등 실제 확장 정보 데이터

## FExtensionBase
언리얼 엔진 Slate UI에서 메뉴/툴바 확장 시스템에서 사용하는 기본 추상 베이스 클래스

- 실질적인 메뉴/툴바 확장 정보를 가지고 있음

```c++
class FExtensionBase
{
    public:
        /** 멤버가 제대로 정리되도록 가상 소멸자가 필요함 */
        virtual ~FExtensionBase()
        {
        }

        /** @return 확장 객체의 유형을 반환합니다.  파생 클래스에서 구현하세요 */
        virtual EExtensionType::Type GetType() const = 0;

        /** 확장 포인트의 ID */
        FName Hook;

        /** 확장 지점과 관련하여 후크할 위치 */
        EExtensionHook::Position HookPosition;

        /** UI에 추가되는 액션에 사용할 커맨드 목록 */
        TSharedPtr< FUICommandList > CommandList;
};
```

### 주요 파생 클래스들
주요 파생 클래스들에는 **델리게이트까지 추가됨**

- FMenuExtension : 메뉴 확장 구현
- FToolBarExtension : 툴바 확장 구현
- FMenuBarExtension : 메뉴 바 확장 구현

| 인자   | 역할 | 설명 |
|---|---|---|
| `FName Hook`| 확장 위치 지정 | 어떤 Hook(지점) 근처에 엔트리를 추가할지(예: "Delete") |
| `EExtensionHook::Position HookPosition` | 상대 위치    | Hook 기준 Before/After/First 중 어디에 넣을지 |
| `const TSharedPtr<FUICommandList>& CommandList`| 커맨드 집합   | 메뉴 엔트리의 활성/실행/단축키/상태 관리용, 없으면 nullptr  |
| `const FMenuExtensionDelegate& MenuExtensionDelegate` | 생성 콜백 | 실제로 메뉴 엔트리 Slate 위젯을 추가하는 함수/람다 |

## FExtender
여러 소스에서 메뉴/툴바에 엔트리를 동적으로 삽입할 때, 각각의 확장 요청을 병합하는 기능을 담당

- 여러 소스에서 반환한 확장 요청을 실제 Slate UI에 적용하기 전 단일 리스트로 통합

## FExtender 동작 과정
### 1. 확장자 생성
```c++
TSharedPtr<FExtender> Extender = MakeShared<FExtender>();

TSharedRef<FExtender> MenuExtender(new FExtender());
```
- 빈 FExtender 컨테이너 생성

### 2. 확장 항목 생성 및 등록

```c++
MenuExtender->AddMenuExtension(
    FName("Delete"), // 확장 지점 (예: 컨텐트 폴더 우클릭 창의 삭제)
	EExtensionHook::After, // 위치 (예: 삭제 항목 다음에 추가)
	TSharedPtr<FUICommandList>(), // 명령 처리기 (단축키 설정)
	FMenuExtensionDelegate::CreateRaw(this, &FBacgroundToolsModule::AddCBMenuEntry) // 메뉴 엔트리 생성 함수
    );
```
1. AddMenuExtension 호출 시 새로운 FMenuExtension 인스턴스 생성
2. FMenuExtension 인스턴스는 아래 정보 저장
    - 확장 지점 이름(FName("Delete"))
    - 위치 정보(After)
    - 연결된 명령 리스트
    - 메뉴 생성 델리게이트
3. 생성된 객체는 FExtender의 내부 배열에 저장
    - `TArray< TSharedPtr< const FExtensionBase > > Extensions`

### FExtender 다이어그램
![](/images/FExtender.png){: width="50%" height="50%"}

### 3. 실제 메뉴 생성
사용자가 콘텐트 폴더를 우클릭하면 Slate가 `FExtender::Apply()`를 호출

1. FExtender의 Extensions를 순회하면서 조건에 맞는 확장 지점 찾음
2. 해당 지점에 등록된 모든 FExtensionBase 파생 객체 순회
3. 각 확장의 HookPosition에 따라 적절한 위치에 메뉴 항목 삽입
4. 파생 객체의 delegate를 실행해 메뉴/툴바에 실제 메뉴 항목 생성
5. 확장 해제(RemoveExtension) 가능
    - 사용자가 직접 반환받은 FExtensionBase 핸들을 이용해 해당 확장 객체를 Extensions에서 제거

### 확장 제거
```c++
// 확장 제거 예시
TSharedRef<const FExtensionBase> MyExtension = Extender->AddMenuExtension(...);
// ...
Extender->RemoveExtension(MyExtension);
```

## 정리
- 등록과 실행이 분리된다
  - 확장은 미리 등록만 해두고 실제로 필요할 때만 생성 (예: 메뉴가 열릴 때만 메뉴 항목 생성) 
- 확장 지점 기반으로 작동한다
  - 예: 같은 확장 지점 `Delete`에서 Before, After 생성 가능

## FMenuBuilder
FExtender와 함께 사용되어 컨텍스트 메뉴, 툴바 메뉴, 메인 메뉴 등을 구성

>
- FExtender : "어디에 메뉴를 추가할지" 결정
- FMenuBuilder : "메뉴에 무엇을 추가할지" 정의

## 자유 사용되는 메서드
### 1. AddMenuEntry()
기본 메뉴 항목 추가

```c++
AddMenuEntry(
    FText::FromString("메뉴 항목"),          // 표시 이름
    FText::FromString("툴팁 설명"),         // 툴팁
    FSlateIcon(FAppStyle::GetStyleSetName(), "Icons.Play"), // 아이콘
    FUIAction(FExecuteAction::CreateLambda([](){ /* 액션 로직 */ })) // 델리게이트
);
```

### FUIAction
Slate의 액션(메뉴 엔트리, 버튼 등)을 나타내는 컨테이너 구조체 -> 통합적 관리 가능

- 실행(FExecuteAction) : (void() 시그니처 콜백) 
  - 실행할 함수
- 활성화 가능 여부(FCanExecuteAction) : (bool() 시그니처 콜백, 선택적)
  - 메뉴가 활성화되는지/비활성화되는지
- 체크 상태(FIsActionChecked) : (bool() 시그니처 콜백, 토글 메뉴/버튼용, 선택적)
  -  체크(토글) 상태를 반영할지 말지

###  FExecuteAction만 단독 사용
```c++
FExecuteAction::CreateRaw(this, &FBacgroundToolsModule::OnDeleteUnsuedAssetButtonClicked)
```
- 내부적으로 활성/체크 상태 등은 기본값으로 취급

### 2. AddMenuSeparator()
메뉴 항목 사이에 구분선을 추가

```c++
AddMenuEntry(...); // 첫 번째 항목
AddMenuSeparator(); // ----- 구분선 -----
AddMenuEntry(...); // 두 번째 항목
```

### 3. AddWidget()
커스텀 위젯 추가 / 체크박스, 슬라이더, 버튼 등 복잡한 UI를 메뉴에 삽입할 때 사용

```c++
AddWidget(
    SNew(SCheckBox)
    .IsChecked(false)
    .OnCheckStateChanged_Lambda([](ECheckBoxState State){ /* 체크 상태 변경 */ })
);
```

## 총 세번의 바인딩
- 메뉴 엔트리 생성 위치(1차 바인딩)

```c++
InitCBMenuExtention() {
    ContentBroswerModuleMenuExtenders.Add(FContentBrowserMenuExtender_SelectedPaths::
	CreateRaw(this, &FBacgroundToolsModule::CustomCBMenuExtender));
}

// CreateRaw(this, &FBacgroundToolsModule::CustomCBMenuExtender));
TSharedRef<FExtender> FBacgroundToolsModule::CustomCBMenuExtender(const TArray<FString>& SelectedPaths)
{
	TSharedRef<FExtender> MenuExtender(new FExtender());

	if (SelectedPaths.Num() > 0)
	{

		MenuExtender->AddMenuExtension(FName("Delete"),
			EExtensionHook::After,
			TSharedPtr<FUICommandList>(),
			FMenuExtensionDelegate::CreateRaw(this, &FBacgroundToolsModule::AddCBMenuEntry));
	}

	return  MenuExtender;
}
```

- 메뉴 항목의 모양 및 동작(2차 바인딩)

```c++
// FMenuExtensionDelegate::CreateRaw(this, &FBacgroundToolsModule::AddCBMenuEntry));

void FBacgroundToolsModule::AddCBMenuEntry(FMenuBuilder& MenuBuilder)
{
	MenuBuilder.AddMenuEntry
	(
		FText::FromString(TEXT("Delete Unused Assets")),
		FText::FromString(TEXT("Safely delete all unused assets under folder")),
		FSlateIcon(),
		FExecuteAction::CreateRaw(this, &FBacgroundToolsModule::OnDeleteUnsuedAssetButtonClicked)
	);
}
```

- 실제 실행할 함수(3차 바인딩)

```c++
// FExecuteAction::CreateRaw(this, &FBacgroundToolsModule::OnDeleteUnsuedAssetButtonClicked)

void FBacgroundToolsModule::OnDeleteUnsuedAssetButtonClicked()
{
}
```
