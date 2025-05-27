---
layout: default
title: "Add Custom Delegate"
parent: "2. Extend Content Browser Menu"
nav_order: 1
---

## 목표: 콘텐트 브라우저 모듈을 로드하고 해당 모듈의 델리게이트 배열에 Custom 메뉴 델리게이트 추가하기

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

### 2. FContentBrowserMenuExtender_SelectedPaths CustomCBMenuDelegate
콘텐츠 브라우저(Content Browser)의 컨텍스트 메뉴를 확장하기 위해 사용되는 델리게이트 타입

- `GetAllPathViewContextMenuExtenders()`가 리턴하는 타입으로 델리게이트 타입 추론 가능
- 해당 타입의 정의를 가보면 반환값, 파라미터를 설명한 델리게이트 매크로를 볼 수 있음

### 3. CreateRaw(this, &FBacgroundToolsModule::CustomCBMenuExtender)
델리게이트에서 제공하는 여러 바인딩 메서드를 사용해 바인딩 할 수 있다

## 델리게이트 바인딩 케이스
### Case 1 : 명시적 변수 선언 + 바인딩 + 델리게이트 배열에 추가

```c++
// 델리게이트 객체 선언
FContentBrowserMenuExtender_SelectedPaths CustomCBMenuDelegate;

// 델리게이트를 통해 내가 쓸 커스텀 함수에 바인딩
CustomCBMenuDelegate.BindRaw(this, &FBacgroundToolsModule::CustomCBMenuExtender);

// 모듈의 델리게이트 배열에 내 함수를 바인딩한 델리게이트 추가
ContentBroswerModuleMenuExtenders.Add(CustomCBMenuDelegate);
```
- 가독성: delegate 선언 → 바인딩 → 추가, 각각의 단계가 명확하게 분리됨
- 디버깅 용이: 바인딩된 delegate를 변수로 직접 디버깅/추적/조작할 수 있음

### Case 2 : CreateRaw()로 delegate 생성과 배열 추가 한번에 하기

```c++
ContentBroswerModuleMenuExtenders.Add(FContentBrowserMenuExtender_SelectedPaths::
		CreateRaw(this, &FBacgroundToolsModule::CustomCBMenuExtender));
```

- 델리게이트 시스템에서 제공하는 정적 메서드 `CreateRaw()`로 생성과 배열 추가 한번에 가능
- 임시 변수가 없음: delegate 객체가 따로 이름을 가지지 않음

## 델리게이트 static 생성 메서드 
언리얼 델리게이트 타입이 아래 메서드들을 일관되게 제공

### 1. Raw 포인터 바인딩
```c++
CreateRaw( RawObjectPtr, &Class::Method )

FMyDelegate::CreateRaw(this, &MyClass::Handler)
```
- 비-UObject C++ 클래스용

### 2. UObject 바인딩 (자동 수명 관리)
```c++
CreateUObject( UObject*, &UClass::Method )

FMyDelegate::CreateUObject(this, &AMyActor::EventHandler)
```
- 가비지 컬렉션 대상 객체용

### 3. 스마트 포인터 바인딩
```c++
CreateSP( SharedPtr, &Class::Method )

FMyDelegate::CreateSP(MySharedPtr.ToSharedRef(), &FMyClass::Callback)
```
- TSharedPtr/TSharedRef와 함께 사용

### 4. 스레드-안전 약한 포인터
```c++
CreateThreadSafeSP( WeakPtr, &Class::Method )

FMyDelegate::CreateThreadSafeSP(MyWeakPtr.Pin(), &FMyClass::ThreadCallback)
```

- 멀티스레드 환경용

### 5. 람다 함수 바인딩
```c++
CreateLambda( []{ ... } )

FMyDelegate::CreateLambda([this](){ 
    UE_LOG(LogTemp, Warning, TEXT("Lambda called!")); 
```

- 인라인 콜백 구현
