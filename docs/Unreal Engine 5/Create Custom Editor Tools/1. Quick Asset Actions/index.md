---
layout: default
title: "1. Quick Asset Actions"
parent: "Create Custom Editor Tools"
nav_order: 1
has_children: true
---

# 1. Quick Asset Actions
## 에셋 액션
언리얼 에디터에서 에셋(Asset)에 대해 사용자가 직접 수행할 수 있는 특정 동작/명령

## 동작 방식 (5.3 이상)
1. C++에서 UAssetActionUtility 기반 커스텀 클래스 생성
   - UAssetActionUtility는 언리얼이 제공하는 에디터 확장용 베이스 클래스
   - 이 클래스를 상속받아 C++ 또는 블루프린트에서 커스텀 명령(함수)을 구현
2. 함수에 UFUNCTION(CallInEditor) 매크로 등록
   - 에디터에서 호출 가능한 함수로 등록
   - 함수명은 명확하게 작성
3. 에디터 유틸리티 블루프린트(Asset Action Utility BP) 생성
   - 플러그인 또는 프로젝트의 콘텐츠 브라우저에서 생성
   - 부모 클래스로 1번에서 만든 커스텀 C++ 클래스를 선택
   - (에디터가 이 BP 인스턴스를 통해 실제 액션을 인식)
4. 동작 실행
   - 에디터에서 에셋을 우클릭 → "스크립팅된 에셋 액션"에서 등록된 함수가 메뉴에 나타남
   - 클릭 시 실제 동작 수행

# 모듈
모듈은 언리얼 엔진의 구성 블록이다.
에디터를 만들려면 자신만의 모듈을 만들어야 한다.

## 모듈에서 알아야 할 세가지 주요 포인트

- 모듈은 코드 분리를 강제한다.
    - 여러 개의 무작위 코드들이 서로 소통해야 할 때 매우 유용하다
- **모든 모듈은 Build.cs 파일이 필요**하다.
  -  새 프로젝트 자체도 하나의 모듈이다.
  -  모듈은 자신의 빌드 파일을 가진다.
```
[ModuleName].Build.cs
[ProjectName].Build.cs
```
- 모듈은 Build.cs 파일에 추가하여 포함할 수 있다.
  - 다른 모듈에 위치한 헤더 파일을 포함해야 할 때 해당 헤더의 모듈 이름을 Build.cs 파일에 추가한다.
  - 보통  `PublicDependencyModuleNames`에 모듈 이름을 추가하는 경우가 많다

## 플러그인 생성하기
1. 언리얼 상단 메뉴  Edit > Plugins 클릭
2. 왼쪽 상단의 +ADD 버튼 클릭
3. 여러가지 템플릿 목록에서 선택 (현재는 Blank 선택)
  - 플러그인 이름이 곧 모듈 이름이다.
  - 한번 정하면 변경할 수 없다.
4. Create Plugin 버튼 클릭
5. 비주얼 스튜디오로 돌아가 모두 로드 버튼 클릭
- 프로젝트 소스 폴더 위에 플러그인 폴더 생성된 것 확인

```c++
// .uplugin
	"Modules": [
		{
			"Name": "BackgroundTool",
			"Type": "Editor", // 만들 기능은 에디터 전용이므로 Runtime(게임 동작시 실행되는 타입) -> Editor로 변경
			"LoadingPhase": "PreDefault" // 플러그인이 언제 로드될지 결정함. PreDefault: 게임 모듈보다 먼저 로드됨
		}
	]
```

## 액터와 에셋
- **에셋** : 콘텐트 브라우저 안에 존재하는 것 (머티리얼, 스태틱 매시 등)
  -  에셋은 `AssetActionUtility`라는 내장 클래스를 사용
- **액터** : 레벨(뷰) 안에 존재하며 클릭할 수 있는 것
  -  액터는 `ActorActionUtility`라는 클래스를 사용

## Public/Private
- 모듈을 하나 생성할 때 Pubilc, Private 폴더를 나눠서 생성할 수 있음
  - **Pubilc** : 헤더
  - **Private** : cpp 소스 코드 

## build.cs
- 인클루드 된 헤더에 빨간 밑줄 : 현재 모듈이 이 헤더 파일에 **접근할 권한 없음**

**접근권한 해결하기**  
1. 솔루션 탐색기에서 해당 헤더 검색 후 헤더가 들어있는 모듈 찾기
2. 해당 모듈의 build.cs 소스 코드에 각각 private, pubilc 모듈 경로를 찾을수 있음
3. 내가 쓸 build.cs에 private, pubilc에 해당하는 경로 붙여넣기

## 테스트용 에셋 함수 구동하기 (5.3 이상)
**함수 준비하기 : 플러그인 콘텐트**
1. 플러그인의 콘텐트 폴더로 이동
2. 플러그인 콘텐트 브라우저에서 마우스 오른쪽 버튼 클릭
3. 에디터 유틸리티 -> 에디터 유틸리티 블루 프린트 -> 에셋 액션 유틸리티 선택하여 생성
4. 더블 클릭하여 해당 에셋을 열고 우측 상단의 파일 클릭
5. 부모 블루프린트 -> 내가 만든 c++ 클래스 입력
6. 컴파일 및 저장 클릭

이 과정이 없으면 에디터는 사용자가 만든 에셋 액션을 전혀 인식하지 못함
- C++ 클래스 = 설계도
- 에셋 액션 유틸리티 BP 에셋 = 실제 완성품 (에디터가 사용할 수 있는 인스턴스)

**함수 사용하기**
1. 메인 콘텐트에서 Blueprint 폴더 생성
2. Blueprint 클래스 생성
3. 해당 클래스 우클릭 -> Scripted Asset Actions
4. 플러그인 콘텐트에서 추가한 c++ 클래스가 보임
5. 클릭하여 동작 확인 가능

## 디버그 헤더 만들기
1. 플러그인 안의 폴더를 오른쪽 버튼으로 클릭
2. 새 항목 추가 선택
3. 추가 창이 뜨면 위치를 플러그인 -> 모듈 -> public 폴더로 선택
4. 만들 유형 헤더로 선택하고 Debug.h 이름 지정
5. Debug.h의 함수를 사용할 cpp 파일에 #include "Debug.h" 추가

```c++
void PrintMessage(const FString& Message, const FColor& Color)
{
	if (GEngine)
	{
		GEngine->AddOnScreenDebugMessage(-1, 8.f, Color, Message); // 화면 좌상단에 출력
	}
}

void PrintLog(const FString& Message)
{
	UE_LOG(LogTemp, Warning, TEXT("%s"), *Message); // 콘솔 로그창에 출력
}
```

## 단축키
- UE 상단에서 툴 -> visual studio 새로고침 선택
- Ctrl + B : vs studio 빌드
- Ctrl + F5 : 편집기 (엔진) 실행
- Ctrl + Alt + F11 : 라이브 코딩 실행
- Alt + F12(피킹 정의) : Quick Info 주석 보기
- Ctrl + ` : 터미널