---
layout: default
title: "Set Up A Class For Slate Widget"
parent: "3. Slate Widget"
nav_order: 2
---

## 목표: SCompoundWidget 상속받아 커스텀 위젯 클래스 만든 후 바인딩하기

# 커스텀 위젯 등록과 바인딩
## StartupModule에서 이벤트 등록 

```c++
void FBacgroundToolsModule::StartupModule()
{
	InitCBMenuExtention();
	RegisterAdvanceDeletionTab();
}
```

1. StartupModule의 역할
- 언리얼의 모든 Editor Module, Plugin Module은 **StartupModule()에서 자신만의 초기화(예: 명령 등록, 탭 등록 등)를 처리**

2. StartupModule()에서 RegisterAdvanceDeletionTab()을 호출
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

