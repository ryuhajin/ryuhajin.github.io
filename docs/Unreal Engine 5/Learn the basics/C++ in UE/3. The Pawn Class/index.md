---
layout: default
title: "3. The Pawn Class"
parent: "C++ in UE"
nav_order: 4
has_children: true
---

# 3. The Pawn Class
플레이어나 AI가 제어할 수 있는 액터를 나타내는 기본 클래스

## 특징
1. 제어 가능성
- 플레이어 컨트롤러나 AI 컨트롤러에 의해 제어될 수 있음
2. 입력 처리
- 플레이어 입력을 받을 수 있음
- `SetupPlayerInputComponent()` 메서드를 통해 입력 바인딩 설정
3. 움직임 시스템
- 기본적인 움직임 컴포넌트 제공
- `UPawnMovementComponent` 또는 그 파생 클래스 사용
4. 카메라 처리
- 기본적인 카메라 뷰 관리 기능 제공
- `UCameraComponent`를 사용하여 뷰 설정 가능
5. 물리적 표현
- 콜리전(충돌) 메시를 가지고 물리적 상호작용 가능
- `USkeletalMeshComponent` 또는 `UStaticMeshComponent`로 시각적 표현

## Actor 클래스와 차이점

특징|	Pawn 클래스|	Actor 클래스|
제어 가능성	|플레이어/AI에 의해 제어 가능	|일반적으로 자동화된 동작만 수행
입력 처리	|직접적인 입력 처리 가능	|입력 처리 불가능 (별도 컴포넌트 필요)
움직임	|내장된 움직임 시스템	|기본 움직임 시스템 없음
목적	|게임 내 조종 가능한 엔티티	|일반적인 게임 오브젝트
컨트롤러	|컨트롤러에 연결 가능	|컨트롤러 연결 불가
기본 컴포넌트	|기본적인 움직임 컴포넌트 포함	|빈 상태로 생성

---

## 컨트롤러 활성화
### 에디터에서 플레이어 컨트롤러 활성화
1. 사용할 Pawn 클릭
2. Detail 패널에서 Pawn 검색
3. Auto Poeese Player (플레이어 자동 빙의)에서 플레이어 설정

### C++에서 플레이어 컨트롤러 활성화

```c++
//생성자에서
AutoPossessPlayer = EAutoReceiveInput::Player0;
```

**단축키**
- 마우스 커서 활성화: 게임 플레이 상태에서 Shift + F1
- 컨트롤러 분리 : 마우스 커서 활성화 후 Detach 컨트롤러 아이콘 클릭 or 단축키 F8

---

# Enhanced Input (UE 5.1)
기존 시스템보다 더 강력하고 유지보수가 용이한 입력 처리를 제공

## 특징
1. 데이터 기반 입력 시스템
- 입력 액션과 매핑을 에디터에서 설정 가능
- 코드 재컴파일 없이 입력 설정 변경 가능
2. 고급 입력 트리거
- Started (눌림 시작), Triggered (지속), Completed (놓임), Canceled (중단) 등 다양한 트리거 이벤트
- 탭, 홀드, 더블탭 등 복잡한 입력 패턴 지원
3. 입력 컨텍스트 시스템
- 상황에 따라 다른 입력 매핑을 활성화/비활성화 가능
    - 예: 걷기 상태와 운전 상태에서 다른 입력 매핑 사용
4. 입력 모디파이어
- 입력 값을 변환하는 모디파이어 적용 가능 (예: 감도 조정, 데드존 설정)
  - 게임패드 스틱의 민감도 곡선 조정 등
5. 크로스 플랫폼 입력 지원
- 여러 입력 장치를 통합 관리
- 장치 유형에 따라 다른 입력 처리 가능
6. 블루프린트 통합
- C++뿐만 아니라 블루프린트에서도 완전히 지원

## 이전 입력 처리 방식 (Legacy Input System)
### 1. 프로젝트 세팅에서 입력 매핑 정의

1. 상단의 Edit -> Project Settings 클릭
2. 목록의 Engine 섹션에서 input 클릭
3. Binding에서 Axis Mappings(연속적인 입력, 예: WASD 이동) 추가
4. Binding에서 Action Mappings(단발적인 입력, 예: 점프)를 추가

> 단순히 "어떤 키가 어떤 입력 이름에 매핑되는지"를 정의할 뿐, 실제 게임 로직과 연결되지 않음

### 2. C++/블루프린트에서 입력 바인딩

- `SetupPlayerInputComponent()` 함수에서 명시적으로 입력 이벤트와 함수를 연결
- 프로젝트 세팅에서 정의한 입력 이름(MoveForward, Jump 등)을 코드에서 하드코딩으로 참조

```c++
void AMyPawn::MoveForward(float Value)
{
    UE_LOG(LogTemp, warning, TEXT("Value: %f"), Value);
}

void AMyPawn::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) 
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);
    
    // 프로젝트 세팅에서 정의한 이름과 동일하게 작성해야 함!
    PlayerInputComponent->BindAxis("MoveForward", this, &AMyPawn::MoveForward);
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &AMyPawn::Jump);
}
```

## Enhanced Input 시스템 
### Blueprint 로 설정하기
1. Input Action 생성
- Content Browser에서 우클릭 → Input → Input Action
    - 'IA_Move'로 이름 지정
    - Value Type 설정
2. Input Mapping Context 생성
- Content Browser에서 우클릭 → Input → Input Mapping Context
    - 'IMC_Context'로 이름 지정
    - IMC_Context BP 더블클릭 후 Mappings + 아이콘 클릭
      - 'IA_Move'와 같은 Input Action 블루프린트 설정 
      - 맵핑하고 싶은 키 선택하여 연결 가능 
3. Pawn 블루프린트에 매핑 컨텍스트 연결
- BP_Pawn 블루프린트 열기
- Event Graph에서 BeginPlay에 다음 노드 연결
    - Get Controller 함수 노드 → Cast To PlayerController 노드
- Cast To PlayerController 노드의 As player Comtroller 핀에
    - Enhanced Input Local Player Subsystem 노드 연결
- Enhanced Input Local Player Subsystem  → Add Mapping Context 함수 노드의 타겟 핀 연결
  -  Cast To PlayerController → Add Mapping Context 연결
4. IA_Move Input Actoin 노드 가져오기
- Action Value를 Print String 노드에 연결하여 True/False 출력
5. 디버그로 작동 확인
- 게임 플레이 상태에서 `` ` `` 키로 콘솔창 띄우기 
- 콘솔 명령어 show debug enhancedinput 입력

### C++ 로 설정하기
1. Input Mapping Context 멤버 변수 선언
```c++
UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "input")
UInputMappingContext* BirdMappingContext;
```
2. BeginPlay에서 Enhanced Input Subsystem에 매핑 컨텍스트 등록
- build.cs에 `EnhancedInput` 모듈 추가
```c++
// build.cs
PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput" });
```
- 헤더에 `"EnhancedInputSubsystems.h` 인클루드
- PlayerController 캐스팅
```c++

```
- UEnhancedInputLocalPlayerSubsystem 획득
- AddMappingContext 호출 (BirdMappingContext, Priority=0)
- C++에서는 반드시 헤더파일 및 빌드 모듈(EnhancedInput) 의존성 추가 필요

1. Input Action 멤버 변수 선언
- UInputAction* MoveAction; (마찬가지로 Forward Declaration)
- UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input") 등으로 지정

1. 입력 콜백 함수 구현
- 함수 시그니처:
```
void Move(const FInputActionValue& Value);
```
- 헤더에서는 FInputActionValue는 구조체이므로 반드시 헤더 직접 include 필요
- 함수 내부에서

```
bool CurrentValue = Value.Get<bool>();
if (CurrentValue) { UE_LOG(LogTemp, Warning, TEXT("IA_Move triggered")); }
Get<T>()에 템플릿 타입 지정 (Bool/Vector2D/Vector 등)
```
5. SetupPlayerInputComponent에서 액션 바인딩

- EnhancedInputComponent로 캐스팅

```
if (UEnhancedInputComponent* EnhancedInputComponent = CastChecked<UEnhancedInputComponent>(PlayerInputComponent))
```
- 바인딩

```
EnhancedInputComponent->BindAction(MoveAction, ETriggerEvent::Triggered, this, &ABird::Move);
```
- 필요한 헤더 include

6. 블루프린트에서 BirdMappingContext, MoveAction 할당


## Switch Project UE Version
1. 버전을 바꾸고싶은 프로젝트의 `~.uproject` 우클릭
2. 추가 옵션 표시 클릭
3. Switch Unreal Engine Version 클릭
4. 원하는 버전 클릭하고 ok