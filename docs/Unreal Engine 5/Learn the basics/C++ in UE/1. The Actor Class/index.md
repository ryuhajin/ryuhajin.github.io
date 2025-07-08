---
layout: default
title: "1. The Actor Class"
parent: "C++ in UE"
nav_order: 2
has_children: true
---

# 1. The Actor Class
월드에 배치되는 독립적 객체

---

## 클래스 생성
1. 에디터 상단의 도구 (Tools) 클릭
2. New C++ Class 클릭
3. 엔진에서 제공하는 클래스 선택 가능

## 언리얼 모듈 Public/Private 폴더
New C++ Class 를 통해 생성할 때 어디에 클래스를 생성할지 선택하게 된다

폴더명 |	용도 및 특징|
Public	|다른 모듈(외부)에서 사용할 수 있게 공개하려는 헤더 파일 <br>
        |즉, '외부에 노출'되는 API/클래스/함수의 헤더(.h) 파일을 여기에 둠|
Private	|모듈 내부에서만 사용할 클래스/구현 파일 <br>
        |보통 소스(.cpp) 파일, 혹은 외부에 노출하지 않아도 되는 헤더(.h) 파일을 둠|

- Public 폴더 : 다른 모듈에서 `#include` 가능
- Private 폴더 :  원칙적으로 해당 모듈 외부에서 `#include` 할 수 없음

## Super::
**상위 클래스의 함수를 호출할 때 사용되는 접두사**

- 부모(상위) 클래스의 함수, 생성자, 멤버 등에 접근할 때 사용

```c++
void AMyActor::BeginPlay()
{
    Super::BeginPlay(); // 부모 클래스의 BeginPlay() 호출
    // 이 아래에 자식에서의 추가 동작 구현
}
```

---

## Blueprint Creation
생성한 C++ 기반 클래스를 블루 프린트로 가져오기

1. 에디터 우클릭 -> 블루 프린트 클래스 클릭
2. ALL Classes에 가져오고 싶은 클래스 검색
3. 선택 후 `BP_` 붙여 네이밍하기
4. 클래스 기반 블루 프린트 생성

---

## 사용한 메서드 정리
### GetWorld()
```c++
UWorld* UObject::GetWorld() const;
```
- 매개변수: 없음
- 리턴값: 현재 객체가 속한 월드의 포인터를 반환
  - 대부분의 Actor, Component 등에서 사용 가능

### GetActorLocation()
```c++
FVector AActor::GetActorLocation() const;
```
- 매개변수: 없음
- 리턴값: FVector (액터의 월드 공간 위치)
  - 액터가 현재 월드에서 어느 좌표에 있는지 반환

### GetActorForwardVector()
```c++
FVector AActor::GetActorForwardVector() const;
```

- 매개변수: 없음
- 리턴값: FVector (액터의 앞 방향 벡터(Forward), 정규화됨)
  - 로컬 Z축이 아닌, 로컬 X축 기준 (언리얼은 X가 Forward)


# Custom Header Files
매크로 전용 헤더 파일 만들기

1. Visual Studio 로 사용자 모듈 열기
2. Games/사용자모듈/Source/사용자모듈이름 우클릭
3. Add -> New item 클릭
4. 만들 종류로 헤더 파일 선택 -> 헤더 이름 정하기
5. 헤더가 들어갈 폴더 지정해주기
   - 예: `사용자 모듈\Source\사용자 모듈 이름`


**참고하면 좋은 링크**
- [Actor Lifecycle](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-actor-lifecycle?application_version=5.5)