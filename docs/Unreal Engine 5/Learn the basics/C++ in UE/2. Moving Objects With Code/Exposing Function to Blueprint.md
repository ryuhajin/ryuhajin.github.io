---
layout: default
title: "Exposing Function to Blueprint"
parent: "2. Moving Objects With Code"
nav_order: 3
---

# Exposing Function to Blueprint
클래스 함수 블루 프린트에 노출 시키기

## 사용 예시
- `UFUNCTION` 매크로 사용
    - C++ 함수에 UFUNCTION 매크로 + 특정 Specifier를 붙이면 블루프린트에서 호출하거나, 이벤트/오버라이드/멀티캐스트 등 다양한 방식으로 사용할 수 있음

```c++
UCLASS()
class MYPROJECT_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    // 블루프린트에서 호출 가능(이벤트 그래프에서 노드로 생성 가능)
    UFUNCTION(BlueprintCallable, Category="MyCategory")
    void MyFunction();

    // 블루프린트에서 오버라이드 가능한 이벤트로 노출
    UFUNCTION(BlueprintImplementableEvent, Category="MyCategory")
    void MyEvent();

    // 블루프린트에서 직접 구현 및 호출 가능한 함수로 노출
    UFUNCTION(BlueprintNativeEvent, Category="MyCategory")
    void MyNativeEvent();
};
```

# UFUNCIONT()
## Specifiers 정리

속성|설명|	예시|
BlueprintCallable|	블루프린트에서 노드로 호출 가능	|UFUNCTION(BlueprintCallable)|
BlueprintPure	|순수 함수. 값만 반환함	|UFUNCTION(BlueprintPure)|
BlueprintImplementableEvent|함수의 구현을 블루프린트에서 작성 (C++ 구현 없음)|	UFUNCTION(BlueprintImplementableEvent)|
BlueprintNativeEvent| C++ 기본 구현 + 블루프린트에서 오버라이드 가능	|UFUNCTION(BlueprintNativeEvent)|

## BlueprintCallable
- 블루프린트의 함수 노드로 직접 호출 가능
- 입력/출력 인자를 모두 지원. 함수의 실행 흐름에 실행 핀(Exec Pin)이 생김
- C++에서 구현하며, 블루프린트 그래프 내에서 다양한 조건문, 이벤트와 연결할 수 있음
  - 실행 흐름 제어가 필요한 곳에 적합

```c++
// 헤더
UFUNCTION(BlueprintCallable, Category="Gameplay")
void DealDamage(float DamageAmount);

// CPP
void AMyCharacter::DealDamage(float DamageAmount) {
    Health -= DamageAmount;
}
```

## BlueprintPure
- 순수 함수로 값만 반환함 (반드시 반환값이 있어야함)
- 실행 핀이 없이 입력값이 바뀌면 즉시 계산 결과 반환
  - 수식처럼 사용

```c++
// 헤더
UFUNCTION(BlueprintPure, Category="Stats")
float GetHealthPercentage() const;

// CPP
float AMyCharacter::GetHealthPercentage() const {
    return Health / MaxHealth;
}
```

## BlueprintImplementableEvent
- C++에서는 함수 선언만 하고 구현은 블루프린트에서 작성
- C++에서 이벤트를 발동(Trigger) 시키기 가능

```c++
// 헤더
UFUNCTION(BlueprintImplementableEvent, Category="AI")
void OnEnemySpotted(AActor* SpottedEnemy);

// CPP (구현부 없음!) -> 블루프린트에서: "On Enemy Spotted" 이벤트 구현 가능
```

## BlueprintNativeEvent
- C++ 기본 구현 + 블루프린트 오버라이드를 모두 지원
- `_Implementation` 접미사 규칙을 사용한다

  
```c++
// 헤더
UFUNCTION(BlueprintNativeEvent, Category="Inventory")
bool TryUseItem(UItem* Item);

// CPP (기본 구현)
bool AMyCharacter::TryUseItem_Implementation(UItem* Item) {
    return Item->bIsUsable;
} // 블루프린트에서: "Try Use Item" 노드로 오버라이드 가능
```
- C++ 호출은 `TryUseItem(Item)`로 호출 (자동으로 _Implementation 연결)
