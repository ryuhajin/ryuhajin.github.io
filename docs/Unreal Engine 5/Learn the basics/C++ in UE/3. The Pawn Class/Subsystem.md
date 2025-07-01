---
layout: default
title: "Subsystem"
parent: "3. The Pawn Class"
nav_order: 3
---

# Subsystem
서브시스템은 코어 시스템 위에 추가되는 확장 레이어 (개발자가 선택적으로 구현)

> 서브시스템 모듈을 통해 체계적인 게임 시스템을 커스텀하여 구축할 수 있음 (플러그인)


## 코어 시스템 vs 서브 시스템

특징	|코어 시스템 (Core)	|서브시스템 (Subsystem)|
생성 주체	|엔진 자동 생성	|코어 시스템에 의해 생성|
생명 주기	|게임 실행부터 종료까지 유지	|부모 시스템(게임/월드/플레이어)과 동기화|
오버라이드	|엔진 소스 수정 필요 (드문 경우)|	상속받아 자유롭게 확장 가능|
예시	|UWorld, APlayerController|	UMySaveSystem, UDialogueManager|

## 종류

|Subsystem 유형|	주요 사용 예시|
UEngineSubsystem|게임 메커니즘, 물리 시뮬레이션, 렌더링 프로세스 등 엔진의 수명 주기와 관련된 로직 및 시스템|
UGameInstanceSubsystem	|플레이어 진행 상황, 저장 데이터, 옵션 등 전체 게임 세션과 관련된 데이터를 저장하고 관리|
ULocalPlayerSubsystem	| 로컬 플레이어의 입력, UI, 카메라, 사운드 등을 처리|
UWorldSubsystem|환경 효과, 레벨 스트리밍, AI 생성 등 특정 레벨에 특화된 논리와 시스템을 구현|
UEditorSubsystem	|커스텀 에디터 툴, 에셋 관리 확장|

## 생명 주기
Subsystem이 속한 코어 모듈(Engine, GameInstance, World, LocalPlayer 등)의 생명주기에 종속됨

> Subsystem은 런타임 중 필요 시점에 자동으로 인스턴스화되며, 명시적으로 생성/삭제하지 않는다

1. Engine Subsystem (UEngineSubsystem)
    - 시작: 엔진 초기화 시 생성 (UGameEngine/UEditorEngine 시작 시)
    - 종료: 엔진 종료 시 소멸 (에디터/게임 종료 시)
2. GameInstance Subsystem (UGameInstanceSubsystem)
    - 시작: UGameInstance 생성 시 (게임 실행 시)
    - 종료: UGameInstance 소멸 시 (레벨 이동 없이 게임 종료 시)
3. World Subsystem (UWorldSubsystem)
    - 시작: UWorld 생성 시 (레벨 로드 시)
    - 종료: UWorld 소멸 시 (레벨 언로드 시)
4. LocalPlayer Subsystem (ULocalPlayerSubsystem)
    - 시작: ULocalPlayer 생성 시 (플레이어 로그인 시)
    - 종료: ULocalPlayer 소멸 시 (플레이어 로그아웃 시)

---

# 나중에 쓰게되면 서브시스템 클래스 만드는 법 추가하기

---

**참고 링크**
- [doc - Programming Subsystems](https://dev.epicgames.com/documentation/en-us/unreal-engine/programming-subsystems-in-unreal-engine?application_version=5.5)
- [What are subsystems?](https://tech.flying-rat.studio/post/ue-subsystems.html)
- [subsystem-singleton](https://unreal-garden.com/tutorials/subsystem-singleton/)