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

## Switch Project UE Version
1. 버전을 바꾸고싶은 프로젝트의 `~.uproject` 우클릭
2. 추가 옵션 표시 클릭
3. Switch Unreal Engine Version 클릭
4. 원하는 버전 클릭하고 ok