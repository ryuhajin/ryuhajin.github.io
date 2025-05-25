---
layout: default
title: "Add Custom Delegate"
parent: "2. Extend Content Browser Menu"
nav_order: 1
---

## 목표: 콘텐트 브라우저 모듈 로드하기

## Pragma region
- IDE에서 확장하거나 축소할 수 있는 코드 블록 지정
- 버튼을 통해 소스 코드 블록을 접었다 펼 수 있다
  
```c++
#pragma region 리전이름
	void Test(){
    	// ...
    }
#pragma endregion 리전이름
```

## InitCBMenuExtention() 함수 구현에 사용한 메서드

### 1. Module.GetAllPathViewContextMenuExtenders()
Content Browser의 폴더 뷰(경로 뷰)에서 우클릭 시 메뉴를 추가할 수 있도록 델리게이트(Extender) 리스트를 리턴해줌

```c++
TArray<FContentBrowserMenuExtender_SelectedPaths>& GetAllPathViewContextMenuExtenders();
```

- 반환값:
    - `TArray<FContentBrowserMenuExtender_SelectedPaths>&`
    - 폴더 뷰 컨텍스트 메뉴 확장자(델리게이트) 리스트의 레퍼런스
    - 이 리스트에 새로운 확장 델리게이트를 추가(Add) 하면, 폴더(경로) 우클릭 시 커스텀 메뉴가 동적으로 삽입됨

## 델리게이트 리스트
언리얼에서는 기존 시스템을 건드리지 않고 사용자만의 기능을 쉽게 추가할 수 있도록 모듈 내부에 델리게이트 배열을 가지고 있다

- 모듈별로 델리게이트 리스트가 있음
- 여기에 커스텀 델리게이트를 추가하면 이벤트 발생 시 엔진이 모든 델리게이트를 순회하여 호출함

| 모듈  | 확장 대상| 델리게이트 리스트 함수   |
|---|---|---|
| FContentBrowserModule  | 폴더(경로) 컨텍스트 메뉴 | `GetAllPathViewContextMenuExtenders()`  |
| FContentBrowserModule  | 에셋(파일) 컨텍스트 메뉴 | `GetAllAssetViewContextMenuExtenders()` |
| FContentBrowserModule  | 컬렉션 컨텍스트 메뉴    | `GetAllCollectionViewContextMenuExtenders()` |
| FLevelEditorModule| 툴바 메뉴| `GetAllLevelEditorToolbarMenuExtenders()`    |
| FLevelEditorModule| 뷰포트 컨텍스트 메뉴    | `GetAllLevelViewportContextMenuExtenders()`  |
| FLevelEditorModule| 레벨 에디터 컨텍스트 메뉴 | `GetAllLevelEditorContextMenuExtenders()`    |
| FSequencerModule  | 시퀀서 메뉴    | `GetAddMenuExtensibilityManager()` |
| FMainFrameModule  | 메인 프레임 메뉴/툴바   | `GetMainFrameMenuExtensibilityManager()`|
| FBlueprintEditorModule | 블루프린트 툴바/메뉴    | `GetMenuExtensibilityManager()`<br>`GetToolbarExtensibilityManager()` |
| FPersonaModule    | 캐릭터 에디터 메뉴| `GetMenuExtensibilityManager()`    |
| FPersonaModule    | 캐릭터 에디터 툴바| `GetToolbarExtensibilityManager()` |
| FComponentAssetBrokerModule | 에디터 에셋 관련 메뉴   | `GetAssetBrokerMenuExtensibilityManager()`   |

### 폴더(경로) 메뉴 확장 델리게이트 등록 예시

```c++
void RegisterContentBrowserFolderMenuExtender()
{
    // 1. ContentBrowser 모듈 인스턴스 획득
    FContentBrowserModule& ContentBrowserModule = 
        FModuleManager::LoadModuleChecked<FContentBrowserModule>(TEXT("ContentBrowser"));

    // 2. 폴더 뷰 컨텍스트 메뉴 델리게이트 리스트 획득
    TArray<FContentBrowserMenuExtender_SelectedPaths>& Extenders = 
        ContentBrowserModule.GetAllPathViewContextMenuExtenders();

    // 3. 사용자 델리게이트 생성 (람다 예시)
    FContentBrowserMenuExtender_SelectedPaths MyFolderMenuExtender = 
        FContentBrowserMenuExtender_SelectedPaths::CreateLambda(
            [](const TArray<FString>& SelectedPaths) -> TSharedRef<FExtender>
            {
                TSharedRef<FExtender> Extender = MakeShared<FExtender>();
                // 여기서 Extender->AddMenuExtension 등으로 커스텀 메뉴 항목을 추가
                return Extender;
            }
        );

    // 4. 델리게이트 리스트에 등록 (Add)
    Extenders.Add(MyFolderMenuExtender);
}
```

