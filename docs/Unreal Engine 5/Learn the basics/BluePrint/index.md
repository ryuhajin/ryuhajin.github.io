---
layout: default
title: "BluePrint"
parent: "Learn the basics"
nav_order: 3
has_children: true
---

# BluePrint
비주얼 스크립팅 배우기

---

## key shortcut

| 단축키 | 설명 |
|---|---|
Ctrl + Tab	|  에디터 내에서 열려 있는 모든 창 사이를 순환하며 전환 | 
Ctrl + B	|  선택한 에셋을 콘텐츠 브라우저에서 찾기 | 
Ctrl + Space	|  콘텐츠 드로어 (콘텐츠 브라우저) 빠르게 열기/닫기 | 

---

## 블루프린트의 본질
1. 블루프린트는 UObject 혹은 AActor를 상속한 C++ 클래스의 서브클래스
    - 즉, `UCLASS()` 매크로로 정의된 클래스의 비주얼 서브클래스
2. `BlueprintGeneratedClass`로 컴파일되어, 런타임에 C++ 클래스처럼 행동

```c++
// C++
UCLASS(Blueprintable)
class AMyActor : public AActor {
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Health;

    UFUNCTION(BlueprintCallable)
    void TakeDamage(int32 Amount);
};
```
- 위 클래스를 기반으로 한 블루프린트 BP_MyActor는 AMyActor의 파생 클래스

---

## 변수, 함수 개념 대응

| C++ 개념              | 블루프린트에서의 대응          | 설명                               |
| ------------------- | -------------------- | -------------------------------- |
| 멤버 변수 (`UPROPERTY`) | 블루프린트 변수             | 동일한 메모리 레이아웃, 리플렉션 시스템으로 접근 가능   |
| 멤버 함수 (`UFUNCTION`) | 블루프린트 함수 노드          | 호출 규약은 동일. 단, 이벤트 그래프에서 시각적으로 표현 |
| 상속                  | 부모 블루프린트 or C++ 클래스  | 완전한 클래스 상속 구조 유지                 |
| 오버라이드               | 이벤트 그래프(Event Graph) | `BeginPlay`, `Tick` 등 오버라이드 가능   |

---

## 실행 흐름 차이
1. C++은 정적 바인딩, 블루프린트는 리플렉션 기반의 동적 호출
2. 언리얼은 `UFunction` 테이블을 통해 블루프린트 노드 호출을 C++ 함수로 디스패치
    - 즉, 블루프린트의 "노드 실행"은 내부적으로 `ProcessEvent()` 호출로 매핑

```c++
// Blueprint event call flow
this->ProcessEvent(FindFunctionChecked(TEXT("TakeDamage")), &Params);
```

---

## 블루프린트 이해하기
- 블루프린트는 “코드를 시각적으로 표현한 것”이지, 다른 언어가 아님
- C++의 상속, 가상 함수, 리플렉션, 이벤트 디스패치 개념을 모두 공유
- 즉, 런타임에는 전부 UObject 시스템 위의 C++ 코드로 돌아감

---

## 흐름 이해하기
1. UCLASS(Blueprintable) / UFUNCTION(BlueprintCallable) / UPROPERTY(EditAnywhere) 구조를 익히기
2. C++ 클래스 → 블루프린트 확장 → 그 확장에서 그래프 추가(함수, 이벤트)를 시도
3. Visual Studio에서 생성된 _gen.cpp나 BlueprintGeneratedClass의 내부를 디버깅하면 매핑이 보임
