---
layout: default
title: "UPlayer"
parent: "3. The Pawn Class"
nav_order: 4
---

# UPlayer
플레이어 표현의 최상위 추상 클래스로, 플레이어와 게임 세계 간의 상호작용을 관리하는 기본 프레임워크를 제공

## 특징
1. UObject를 상속받는 언리얼 엔진의 코어 클래스
2. 순수 가상 함수를 포함한 추상 클래스
3. 플레이어로서의 식별 정보, 네트워크 연결, 컨트롤러 정보를 추상적으로 제공

---

# ULocalPlayer
UPlayer를 상속받아 실제 로컬 머신에서 실행되는 플레이어를 표현하는 클래스

- 상속 : UObject → UPlayer → ULocalPlayer

## 특징
1. 스플릿 스크린 및 다중 뷰포트 지원
2. 로컬 플레이어(키보드/마우스/게임패드 직접 입력을 받는 플레이어) 전용 구현
3. 컨트롤러 입력과 뷰포트 렌더링 간의 연결 관리 (ViewPort 및 PlayerController와 연동)
4. 각 플레이어별로 LocalPlayerSubsystem 생성 및 입력, UI, HUD 등의 독립적 관리 가능

## 역할
1. 로컬 입력 장치와의 연결 관리 (PlayerController 연결)
2. 입력 관리 (키보드, 마우스, 게임패드 등 각 플레이어별로 입력 독립 처리)
3. UI, HUD 시스템과 상호작용 및 개별화
4. Player Profile 설정 관리
5. 로컬 세이브 데이터 관리


**참고하면 좋은 링크**
- [doc - ULocalPlayer](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/Engine/Engine/ULocalPlayer)
- [Unreal Engine 4 Gameplay Framework Overview](https://slonopotamus.github.io/ue4-docs/)