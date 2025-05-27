---
layout: default
title: "2. Extend Content Browser Menu"
parent: "Create Custom Editor Tools"
nav_order: 2
has_children: true
---

# 1. Extend Content Browser Menu
에디터 내 Content Browser의 폴더/에셋을 우클릭할 때, “나만의 기능” 메뉴를 추가하기

## 에디터 메뉴 시스템 확장 과정
1. 모듈 생성 및 초기화
- Editor 타입의 모듈 생성 (uplugin의 "Type": "Editor")

1. 명령(Command) 정의
- 메뉴에 바인딩될 명령(이름, 단축키, 아이콘, 툴팁 등)을 `TCommands`를 상속받아 정의

1. 실제 동작 (Action) 바인딩
- 실제 실행할 동작을 정의 (함수 구현) 한 후 델리게이트로 바인딩
- 보통 플러그인이나 에디터 모듈의 `StartupModule()`에서 이루어짐

1. 메뉴 확장(Menu Extension) 적용
- `FExtender/FMenuExtensionDelegate` 를 통해 기존 메뉴 섹션에 새로운 엔트리(항목)를 추가
- 원하는 위치 (섹션명)은 엔진 문서 참고

1. UI 적용 및 정리
- 에디터가 종료될 때 `ShutdownModule()`를 통해 리소스 및 이벤트 정리

# Delegate
이벤트 기반 프로그래밍을 구현하기 위한 강력한 시스템으로, C++의 함수 포인터나 콜백 시스템을 더 안전하고 유연하게 확장한 개념

## 델리게이트 특징
- 타입 안전성: 컴파일 시점에 타입 검사를 수행
- 멤버 함수 바인딩: 객체 인스턴스와 함께 멤버 함수를 바인딩 가능
- 멀티캐스트 지원: 하나의 이벤트에 여러 함수를 등록 가능
- 다이나믹 델리게이트: 블루프린트와 연동 가능

## 델리게이트 사용하기
### Delegate 타입 선언 : 매크로 사용

```c++
DECLARE_DELEGATE(FMyDelegate);
DECLARE_DELEGATE_RetVal_OneParam(ReturnType, DelegateName, ParamType);
```
- ReturnType: 반환 타입 (예: int32)
- DelegateName: 델리게이트 타입 이름 (예: FMyDelegateWithReturn)
- ParamType: 함수에 전달될 파라미터의 타입 (예: FString)

### 바인딩 : 위에 선언한 델리게이트 타입 객체에 함수 연결

```c++
FMyDelegate MyDelegate;  // 선언(위 매크로로 정의된 타입)
MyDelegate.BindRaw(this, &FMyClass::Handler);
```

- Bind~(), Add~(), Execute(), Broadcast() 등의 멤버 함수를 사용해 연결/호출

## 델리게이트 종류
### 1. 단일 캐스트 델리게이트  (Single-cast Delegates)
- 하나의 함수만 바인딩 가능
- DECLARE_DELEGATE 매크로로 선언
- 반환 값이 있을 경우 DECLARE_DELEGATE_RetVal 사용

```c++
DECLARE_DELEGATE(FMyDelegate); // 기본 형태
DECLARE_DELEGATE_OneParam(FMyDelegateWithParam, FString); // 매개변수 하나
DECLARE_DELEGATE_RetVal_OneParam(int32, FMyDelegateWithReturn, FString); // 반환 값과 매개변수

// 사용 예
FMyDelegate MyDelegate;
MyDelegate.BindUObject(this, &AMyClass::MyFunction);
MyDelegate.Execute();
```

### 2. 멀티캐스트 델리게이트 (Multi-cast Delegates)
- 여러 함수를 동시에 바인딩 가능
- DECLARE_MULTICAST_DELEGATE 매크로로 선언
- 반환 값 지원 안함

```c++
DECLARE_MULTICAST_DELEGATE(FMyMulticastDelegate);

// 사용 예
FMyMulticastDelegate MyMulticastDelegate;
MyMulticastDelegate.AddUObject(this, &AMyClass::Function1);
MyMulticastDelegate.AddUObject(OtherObject, &AOtherClass::Function2);
MyMulticastDelegate.Broadcast();
```

### 3. 다이나믹 델리게이트  (Dynamic Delegates)
- 블루프린트와 연동 가능
- 시리얼라이즈(직렬화) 지원
- 이름 기반 바인딩으로 런타임에 바인딩 가능
- DECLARE_DYNAMIC_DELEGATE로 선언

```c++
DECLARE_DYNAMIC_DELEGATE(FMyDynamicDelegate);

// 사용 예
FMyDynamicDelegate MyDynamicDelegate;
MyDynamicDelegate.BindDynamic(this, &AMyClass::MyFunction);
```

## 델리게이트 바인딩 메서드

| 메서드 | 대상 유형| 지원 Delegate 타입 | 자동 해제 | 용도/특징  | 주의점 |
|---|---|---|---|---|---|
| **BindRaw** | 일반 C++ 객체 | Single | X | 일반 포인터 대상, Raw C++ 객체| 수명 관리 직접 필요 |
| **AddRaw**| 일반 C++ 객체 | Multi| X | 멀티캐스트 Delegate에 Raw 객체 바인딩 | 수명 관리 직접 필요 |
| **BindUObject** | UObject 파생 객체 | Single | O | Unreal UObject에 안전하게 바인딩 | GC 연동, 자동 해제 지원 |
| **AddUObject**| UObject 파생 객체 | Multi| O | 멀티캐스트 Delegate에 UObject 바인딩| GC 연동, 자동 해제 지원 |
| **BindSP**| TSharedPtr 객체 | Single | O | TSharedPtr 기반 객체에 안전하게 바인딩 | WeakPtr로 자동 해제|
| **AddSP** | TSharedPtr 객체 | Multi| O | 멀티캐스트 Delegate에 TSharedPtr 바인딩 | WeakPtr로 자동 해제|
| **BindLambda**| 람다(익명함수)| Single | X | 임시 람다식 함수 직접 바인딩 | 캡처 객체 수명 주의 |
| **AddLambda** | 람다(익명함수)| Multi| X | 멀티캐스트 Delegate에 람다 함수 추가 | 캡처 객체 수명 주의 |

```c++
// Raw
MyDelegate.BindRaw(this, &FMyClass::Func);   // this는 일반 C++ 객체

// UObject
MyDelegate.BindUObject(this, &UMyObject::Func); // this는 UObject 파생 클래스

// SharedPtr
MyDelegate.BindSP(MySharedPtr, &FMySharedClass::Func);

// Lambda
MyDelegate.BindLambda([](){ /* ... */ });
```
