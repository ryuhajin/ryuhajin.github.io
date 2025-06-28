---
layout: default
title: "Forward Declaration"
parent: "3. The Pawn Class"
nav_order: 1
---

# Forward Declaration (전방 선언)
클래스나 구조체의 완전한 정의 없이 컴파일러에게 해당 타입의 존재만을 알리는 선언

> - 포인터(또는 참조) 변수만 쓸 때는 클래스 전체 정의가 필요 없음
> - 포인터는 타입의 실제 크기를 몰라도 주소값만 저장하므로 forward declaration만으로 충분

## Forward Declaration 사용 이유
1. 컴파일 시간 감소
   - 헤더 파일을 포함하면 해당 헤더와 모든 종속성이 재컴파일되지만, 전방 선언은 이를 방지함
2. 순환 참조 해결
   - 두 클래스가 서로를 참조할 때 발생하는 순환 종속성을 해결
3. 코드 팽창 방지
   - 불필요한 헤더 포함으로 인한 코드 크기 증가를 막음
4. 빌드 시스템 간소화
   - 종속성 감소로 빌드 시스템이 단순화

## Forward Declaration 예시
### hpp
```c++
// MyClass.h 헤더 파일
#pragma once

class ADependencyClass; // 전방 선언

UCLASS()
class UMyClass : public UObject
{
    GENERATED_BODY()
    
private:
    ADependencyClass* DependencyPtr; // 포인터로 사용 가능
};
```
### cpp
```c++
//  MyClass.cpp 소스 코드
#include "ADependencyClass.h" // 실제 객체를 생성하거나 멤버 함수, 변수 접근 시 필요

UMyClass::UMyClass() {
    DependencyPtr = CreateDefaultSubobject<ADependencyClass>(TEXT("MyComp"));
}
```

## 언제 헤더 파일을 include 해야 하나
1. 클래스를 상속할 때
   - 부모 클래스의 완전한 정의가 필요
2. 실제 객체(인스턴스)를 생성할 때
   - `new` 또는 `CreateDefaultSubobject` 등 메모리 할당이 필요한 경우
   - 타입의 크기를 알아야 할 때 (`sizeof` 등)
3. 멤버 변수 또는 함수에 접근할 때
   - 클래스의 실제 멤버 정보가 필요
4. 템플릿 인스턴스화가 필요할 때
   - 템플릿 타입을 특정 타입으로 인스턴스화할 때 완전한 정의 필요

## 권장 인클루드 순서
1. 현재 클래스의 헤더
    - `"MyClass.h"`
    - 자기 완결성 검증: 자신의 헤더가 다른 헤더에 의존하지 않고 독립적인지 확인
    - 컴파일 오류 조기 발견: 헤더 파일의 누락된 종속성을 즉시 확인 가능
2. 엔진/프레임워크 헤더
    - `<CoreMinimal.h>` 등
    - 시스템 종속성 분리: 플랫폼별 정의나 엔진 매크로가 먼저 로드되도록 보장
3. 다른 모듈의 헤더
    - `"MyGame/Public/ModuleX.h"`
    - 모듈 경계 명확화: 프로젝트 내부 모듈 간의 종속성을 가시화
4. 로컬, 프라이빗 헤더
    - `Private/Subsystem.h`
    - 구현 세부사항 은닉: 내부 구현용 헤더를 마지막에 위치시켜 public 헤더와 분리
5.  `UCLASS`, `USTRUCT`와 같은 매크로 사용시 `#include "MyClass.generated.h"` 맨 마지막에 선언
    - 강제 규칙: 반드시 마지막에 위치 (UHT 처리 요구사항) 

### 예시
```cpp
// 1. 현재 모듈 헤더 (생략)

// 2. 엔진 헤더
#include "CoreMinimal.h"
#include "GameFramework/Character.h"

// 3. 다른 모듈 헤더
#include "MyGame/Public/Components/HealthComponent.h"
#include "MyGame/Public/Weapons/WeaponManager.h"

// 4. 로컬 헤더
#include "MyCharacterCustomAnimInstance.h"

// 5. 생성 헤더
#include "MyCharacter.generated.h"
```