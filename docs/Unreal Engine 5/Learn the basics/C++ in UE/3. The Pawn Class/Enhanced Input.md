---
layout: default
title: "Enhanced Input"
parent: "3. The Pawn Class"
nav_order: 3
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

---

## 이전 입력 처리 방식 (Legacy Input System)
### 1. 프로젝트 세팅에서 입력 매핑 정의

1. 상단의 Edit -> Project Settings 클릭
2. 목록의 Engine 섹션에서 input 클릭
3. Binding에서 Axis Mappings(연속적인 입력, 예: WASD 이동) 추가
4. Binding에서 Action Mappings(단발적인 입력, 예: 점프)를 추가

> 단순히 "어떤 키가 어떤 입력 이름에 매핑되는지"를 정의할 뿐, 실제 게임 로직과 연결되지 않음

<br>

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

---

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

<br>

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
- 헤더에 `"EnhancedInputSubsystems.h"` 인클루드
- PlayerController 캐스팅 / Subsystem에 MappingContext 추가
    ```c++
        if (APlayerController* PlayerController = Cast<APlayerController>(GetController()))
        {
            if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem < UEnhancedInputLocalPlayerSubsystem >(PlayerController->GetLocalPlayer()))
            {
                Subsystem->AddMappingContext(BirdMappingContext, 0);
            }
        }
    ```
3. Input Action 멤버 변수 선언
    ```c++
        UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = input)
        UInputAction* MoveAction;
    ```
4. 입력 콜백 함수 구현
    ```c++
    //hpp
    void Move(const FInputActionValue& Value); 

    //cpp
    void ABird::Move(const FInputActionValue& value)
    {
        const bool CurrentValue = value.Get<bool>();

        if (CurrentValue)
        {
            UE_LOG(LogTemp, Warning, TEXT("IA_Move triggered"));
        }
    }
    ```
5. `SetupPlayerInputComponent`에서 InputAction에 바인딩
    ```c++
    void ABird::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
    {
        Super::SetupPlayerInputComponent(PlayerInputComponent);

        if (UEnhancedInputComponent* EnhancedInputComponent = CastChecked<UEnhancedInputComponent>(PlayerInputComponent))
        {
            // UInputAciont* MoveAction에 콜백 함수 (ABird::Move) 바인딩
            EnhancedInputComponent->BindAction(MoveAction, ETriggerEvent::Triggered, this, &ABird::Move);
        }
    }
    ```
