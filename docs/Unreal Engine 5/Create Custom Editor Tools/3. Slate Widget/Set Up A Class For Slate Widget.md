---
layout: default
title: "Set Up A Class For Slate Widget"
parent: "3. Slate Widget"
nav_order: 2
---

## 목표: SCompoundWidget 상속받아 커스텀 위젯 클래스 만든 후 바인딩하기

# 커스텀 위젯 등록과 바인딩
## StartupModule에서 이벤트 등록 

## StartupModule의 역할
어떤 일이 생길 때, 무슨 코드를 실행할지를 **엔진의 전역 관리자에게 등록**
>
**등록**: 함수 포인터/Delegate, 생성자 콜백, 이름(ID) 등만 엔진 전역 자료구조에 저장
메모리상에는 해당 모듈이 필요해지면 이 콜백을 실행해서 만든다는 정보만 들어있음
  - 전역 테이블(맵, 배열, 리스트 등)에 ‘예약’만 해놓음

```c++
void FBacgroundToolsModule::StartupModule()
{
	InitCBMenuExtention();
	RegisterAdvanceDeletionTab();
}
```
- StartupModule()에서 RegisterAdvanceDeletionTab()을 호출
  - **탭(Advanced Deletion 패널)을 에디터에 “등록”**하는 과정이 실행

```c++
void FBacgroundToolsModule::RegisterAdvanceDeletionTab()
{
	FGlobalTabmanager::Get()->RegisterNomadTabSpawner(FName("AdvanceDeletion"),
		FOnSpawnTab::CreateRaw(this, &FBacgroundToolsModule::OnSpawnAdvanceDeletionTab))
		.SetDisplayName(FText::FromString(TEXT("Advance Deletion")));
}
```
`FGlobalTabmanager::Get()->RegisterNomadTabSpawner`
   - FGlobalTabmanager(언리얼 에디터의 전역 탭 관리자)에 “AdvanceDeletion” 이라는 ID로 탭 생성자를 등록
>
실제로 이 탭을 띄우기 전까지는 “정의만 되어있는 상태”이다
>
즉, “Advanced Deletion”이라는 이름의 탭을 만들 준비만 마친 것

## 탭을 실제로 여는 시점 (이벤트 발생)
1. OnAdvancedDeletionButtonClicked 함수
- `TryInvokeTab("AdvanceDeletion")`을 통해 등록된 스포너(생성 콜백)를 호출

2. OnSpawnAdvanceDeletionTab() 함수를 통해 실제 인스턴스 생성
- 이 순간부터 Advance Deletion 탭이 실제로 화면에 나타남
```c++
TSharedRef<SDockTab> FBacgroundToolsModule::OnSpawnAdvanceDeletionTab(const FSpawnTabArgs& SpawnTabArgs)
{
        return SNew(SDockTab).TabRole(ETabRole::NomadTab)
        [
            SNew(SAdvanceDeletionTab)
                .TestString(TEXT("I am passing data"))
        ];
}
```

## 정리
1. StartupModule()의 `RegisterAdvanceDeletionTab()`는 해당 이벤트 발생 전 준비만 바인딩
   - 이름만 등록, 실제 위젯 인스턴스 없음
2. `OnAdvancedDeletionButtonClicked()`는 실제 사용자가 해당 이벤트를 발생시켰을 때 동작 바인딩
   - 실제 인스턴스 생성, SDockTab의 ChildSlot에 내가 생성한 위젯이 들어감

```
StartupModule()      (에디터/플러그인 모듈 초기화)
  └→ RegisterAdvanceDeletionTab()
        └→ FGlobalTabmanager::RegisterNomadTabSpawner("AdvanceDeletion", OnSpawnTab...)
                └→ "AdvanceDeletion" 탭 생성 콜백(준비만 해둠)
                └→ (사용자 요청이 있을 때까지 기다림)

(사용자: 우클릭→Advanced deletion 메뉴 클릭)
  └→ OnAdvancedDeletionButtonClicked() → TryInvokeTab("AdvanceDeletion")
        └→ FGlobalTabmanager에서 해당 탭 콜백 호출
            └→ OnSpawnAdvanceDeletionTab() 실행
                └→ SDockTab 생성, ChildSlot에 SAdvanceDeletionTab(Slate 위젯) 추가
                └→ 트리 구조로 에디터 Slate 트리에 편입, 렌더링 시작
```

# FGlobalTabmanager
언리얼 에디터 Slate 시스템의 탭(도킹 패널) 전체를 총괄하는 전역 관리자
- 전역 객체 구조
   - FGlobalTabmanager::Get() : 항상 같은 전역 인스턴스 가져옴
   - 실제로는 FSlateApplication 내부에 저장된 전역 포인터이다
- 역할
  - 탭의 등록/생성/소멸/상태관리
  - 탭의 열림/닫힘/포커스/배치 등 관리
  - ID(이름) ↔ 탭 생성자(Delegate) 맵 관리
  - Slate 트리(SDockTab, SDockingArea, SWindow 등)와 연동

## 주요 메서드
## RegisterNomadTabSpawner
```c++
RegisterNomadTabSpawner(
    FName TabId,
    FOnSpawnTab OnSpawnTabDelegate
)
```
- TabId : 이름의 도킹/플러그인 패널을 등록
- OnSpawnTabDelegate : 생성자 델리게이트 등록

### 사용 예시
```c++
// 탭 등록
FGlobalTabmanager::Get()->RegisterNomadTabSpawner(
    FName("AdvanceDeletion"),
    FOnSpawnTab::CreateRaw(this, &MyModule::OnSpawnAdvanceDeletionTab)
);
```

## TryInvokeTab
```c++
TSharedPtr<SDockTab> TryInvokeTab(FName TabId);
```
- “TabId”의 탭이 열려있으면 포커스
- 없으면 등록된 Delegate로 탭 새로 생성/열기

### 사용 예시
```c++
// 탭 열기 (생성)
FGlobalTabmanager::Get()->TryInvokeTab(FName("AdvanceDeletion"));
```

## UnregisterNomadTabSpawner
```c++
void UnregisterNomadTabSpawner(FName TabId);
```
- 등록해둔 탭 생성자(Delegate)와 ID 연결을 해제
  - 모듈이 종료될 때, ShutdownModule에서 주로 사용

### 사용 예시
```c++
// 탭 해제
FGlobalTabmanager::Get()->UnregisterNomadTabSpawner(FName("MyCustomTab"));
```

## FindExistingLiveTab
```c++
TSharedPtr<SDockTab> FindExistingLiveTab(FName TabId);
```
- 이미 열려 있는 특정 TabId의 SDockTab Slate 객체를 반환
  - 없으면 nullptr
 
### 사용 예시
```c++
// 이미 열린 탭 객체 얻기
TSharedPtr<SDockTab> LiveTab = FGlobalTabmanager::Get()->FindExistingLiveTab(FName("MyCustomTab"));
if (LiveTab.IsValid()) {
    // Tab이 이미 열려 있음 → 추가 동작 가능
}
```

{: .new-title}
> ❓부모 모듈에서 에셋 데이터를 넘겨줘야 하는 이유?
>
> - AdvanceDeletionTab은 “선택된 폴더 내의 에셋 데이터”를 리스트로 보여줘야 하므로,
그 데이터를 생성 시점에 한 번에 전달받아야 함
> - 따라서 자식 위젯 클래스에서 설정한 SLATE_ARGUMENT에 부모가 에셋 리스트를 넘겨줘야 위젯의 생성자 초기화가 올바르게 세팅됨
> - 부모에서 자식 탭을 생성할 때 반드시 값을 전달해야 함