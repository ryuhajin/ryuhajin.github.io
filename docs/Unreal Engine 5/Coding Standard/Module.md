---
layout: default
title: "Module"
parent: "Coding Standard"
nav_order: 6
---

# Module
특정 에디터 도구, 런타임 기능, 라이브러리 또는 기타 기능들을 독립적인 코드 단위로 캡슐화한 것

## 특징
- **코드 분리** : 모듈은 **코드 분리를 강제**하여, 기능을 **캡슐화하고 내부 구현을 숨길 수 있음**
- **독립적 빌드** : 모듈은 **독립적인 컴파일 단위로 빌드됨**
  - **변경된 모듈만 다시 빌드**되므로, 대규모 프로젝트의 빌드 속도가 크게 향상
- **의존성 그래프 및 헤더 관리** : 모듈 간 의존성 그래프가 생성되고, 실제 사용되는 코드에만 헤더 포함이 허용
  - 사용하지 않는 모듈은 컴파일에서 안전하게 제외
- **런타임 로드/언로드 제어** : 특정 모듈을 언제 로드/언로드할지 제어 가능
  - 이를 통해 프로젝트의 성능 최적화가 가능
- **플랫폼별 포함/제외** : 모듈을 플랫폼별로 포함하거나 제외할 수 있음
  - 예: 윈도우, 맥, 리눅스, 안드로이드 등에서 포함하거나 제외


## 모듈 디렉터리 구조
```bash
YourProject/
├── Source/ # 모든 모듈은 반드시 프로젝트 또는 플러그인의 Source 디렉토리 하위에 위치
│   ├── YourModule/       # 모듈 루트 폴더명은 모듈명과 동일해야 함함
│   │   ├── Public/       # 외부에 노출할 헤더 파일
│   │   ├── Private/      # 내부 구현 파일 (.cpp 및 내부 헤더)
│   │   └── YourModule.Build.cs
│   ├── YourPlugin.uplugin
├── YourProject.uproject

```
- **Public/**: 외부 모듈에서 사용할 수 있도록 공개된 헤더 파일 (.h) 
- **Private/**: 해당 모듈 내부에서만 사용하는 구현 파일 (.cpp) 과 헤더 파일 포함
  - .cpp 파일은 모두 private 폴더에 두는 것이 권장됨 
- **Build.cs**: 모듈의 빌드 설정과 의존성을 정의하는 파일
  -  Target.cs는 최종 빌드 옵션과 엔트리 포인트를 정의
- **.uproject / .uplugin** :  "Modules" 리스트가 있어, 어떤 모듈이 어떻게 로드될지 정의
  - 이름, 타입, 지원 플랫폼, 로딩 단계 등을 지정 

## 모듈 타입 설정
.uproject 또는 .uplugin 파일의 `Type` 에서 정의
- 모듈 타입에 따라 로드/언로드, 의존성, 포함 가능 플랫폼이 달라짐

```c++
{
    "Modules": [
        {
            "Name": "YourModule",
            "Type": "Runtime",          // 모듈 타입 지정
            "LoadingPhase": "Default"   // 로딩 단계 지정
        }
    ]
}
```
- Type (모듈 타입)
    - `"Runtime"` : 게임 실행 시 필수적인 기능 제공 (예: Core, Engine)
    - `"Editor"` : 에디터 전용 기능 제공 (예: 플러그인)
    - `"Program"` : 독립 실행형 프로그램으로 사용 (예: UnrealHeaderTool)
    - `"Developer"` : 개발 전용 (예: Profiler, Visualizer)
      -  Shipping(릴리즈) 빌드에 포함되지 않는 특수 모듈 
    - `"ThirdParty"` : 외부 라이브러리 래핑용
      -   외부 바이너리/헤더 포함 및 관리 목적

## 로딩 단계 지정
.uproject 또는 .uplugin 파일의 `LoadingPhase` 에서 정의
- LoadingPhase (주요 로딩 단계)
    - `"PreDefault"` : 엔진 초기화 전 로드 (예: 코어 시스템)
    - `"Default"` : 대부분 모듈의 기본 단계 (기본값)
    - `"PostDefault"` : 기본 모듈 로드 후 (예: 게임플레이 코드)
    - `"PostConfigInit"` : 설정 파일 로드 후 (예: 설정 의존성 모듈)
    - `"PostSplashScreen"` : 스플래시 스크린 표시 후 (예: UI 모듈)

### 로딩 주의 사항
A 모듈이 B 모듈에 의존할 때, B의 로딩 단계가 A보다 빠르거나 같아야 함
  - 예: B가 PreDefault, A가 Default여야 정상 작동

## Build.cs 파일에서 의존성 설정
언리얼 빌드 시스템은 프로젝트의 **`Target.cs`와 각 모듈의 `Build.cs` 파일을 기준으로 프로젝트를 빌드함**

- 각 모듈에는 반드시 [ModuleName].Build.cs가 필요
-  ModuleRules 클래스를 상속받아 자신의 모듈을 정의

### Build.cs 파일 예시
```c++
using UnrealBuildTool;

public class ModuleTest : ModuleRules
{
    public ModuleTest(ReadOnlyTargetRules Target) : base(Target)
    {
        PrivateDependencyModuleNames.AddRange(new string[] { "Core" });
    }
    ...
}
```
## 주요 의존성 설정
**1. PublicDependencyModuleNames**
```c++
PublicDependencyModuleNames.AddRange(new string[] { "Core", "Engine" });
```

- 해당 리스트에 들어간 모듈은 **내 모듈의 Public 코드(즉, Public 헤더 파일)와 Private 코드에서 모두 사용 가능**
- 해당 모듈에 의존하는 **다른 모듈의 Public 코드에서도 이 의존성 모듈의 Public 헤더를 사용**


**2. PrivateDependencyModuleNames**
```c++
PrivateDependencyModuleNames.AddRange(new string[] { "Slate", "SlateCore" });
```
- Private 리스트에 들어간 모듈은 **내 모듈의 Private 코드에서만 사용** 가능
  - 내 모듈의 Public 헤더에서는 해당 모듈의 헤더를 include할 수 없음
- 이 모듈을 의존하는 **다른 모듈에서는 이 의존성이 전파되지 않음**


**3. PublicIncludePaths / PrivateIncludePaths**
```c++
// Public 또는 Private 폴더 외부에 헤더 파일이 위치한 경우
PublicIncludePaths.Add(Path.Combine(ModuleDirectory, "ThirdParty/SomeLibrary/include")); 

// 서브디렉토리를 포함해야 하는 경우
PrivateIncludePaths.Add(Path.Combine(ModuleDirectory, "Private/SubModule"));

// 외부 라이브러리 사용
PublicIncludePaths.Add("C:/ExternalLibs/SomeLibrary/include"); 
```
- 헤더 파일의 **추가 경로를 지정**함
  -  비표준 디렉토리 구조를 사용하는 경우
  -  서브디렉토리를 포함해야 하는 경우
  -  외부 라이브러리를 사용하는 경우

## 의존성 정리

| 구분| PublicDependencyModuleNames | PrivateDependencyModuleNames |
|---|---|---|
| 내 모듈의 Public 코드  | O (사용 가능) | X (사용 불가)  |
| 내 모듈의 Private 코드 | O (사용 가능) | O (사용 가능)  |
| 의존 모듈의 Public 코드 | O (전파됨)   | X (전파 안 됨) |

```c++
PublicDependencyModuleNames.AddRange(new string[] { "Core", "Engine" });
PrivateDependencyModuleNames.AddRange(new string[] { "Slate" });
```
- Core, Engine
    - 내 모듈의 Public/Private 코드 모두에서 사용 가능
    - 내 모듈을 사용하는 다른 모듈의 Public 코드에서도 사용 가능(전파)
- Slate
    - 내 모듈의 Private 코드에서만 사용 가능
    - 내 모듈의 Public 코드, 내 모듈을 사용하는 다른 모듈에서는 Slate 의존성이 전파되지 않음

## 주의사항
- 프로젝트 파일 재생성: Build.cs 파일이나 소스 폴더를 이동/수정한 경우, 반드시 프로젝트 파일을 재생성해야 함
  - GenerateProjectFiles.bat 실행
  - .uproject 파일 우클릭 후 “Generate Project Files” 선택
  - Unreal Editor의 메뉴: File > Refresh Visual Studio Project
- UE 빌드 시스템은 모듈 간 순환 참조(의존성)를 허용하지 않음
- 반드시 실제로 사용하는 헤더만 명시적으로 추가함
  -  실제 사용하는 헤더만 #include하고 그 헤더의 위치가 Public/Private이라면 빌드 시스템이 알아서 처리

**참고 링크**
- [Unreal Engine Modules](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-modules)
- [Module Properties](https://dev.epicgames.com/documentation/en-us/unreal-engine/module-properties-in-unreal-engine)
