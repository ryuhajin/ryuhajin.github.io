---
layout: default
title: "Material"
parent: "Unreal Engine 5"
nav_order: 3
has_children: true
---

# Material

**메뉴얼 링크**
- [material concepts](https://dev.epicgames.com/documentation/ko-kr/unreal-engine/essential-unreal-engine-material-concepts)

---

## All-in-One Master
하나의 거대한 마스터 머티리얼 안에 프로젝트에 필요한 모든 기능 (바람, 투명, 피부, 코팅 등)을 전부 다 넣어두는 방식. 스위치(Switch) 파라미터를 이용해 필요한 기능만 켜고 끄는 방식으로 사용

1. 장점
- 유연성: 마스터 머티리얼이 단 하나이므로 어떤 인스턴스든 모든 기능에 접근할 수 있다. 예를 들어 MI_Stone 인스턴스에서 갑자기 '바람에 흔들리는' 스위치를 켜서 특이한 효과를 만들 수도 있다
- 단순한 파일 구조: 관리할 마스터 머티리얼 파일이 하나뿐
1. 단점:
- 성능 저하: 가장 치명적인 단점. 기능 스위치를 껐다고 해서 해당 기능의 셰이더 코드가 완전히 사라지는 것이 아닙니다. 최종적으로 컴파일된 셰이더는 사용하지 않는 기능을 포함한 모든 코드를 짊어지고 있어 매우 무겁고 비효율. 이는 셰이더 복잡도(Shader Complexity)를 높여 게임 전체의 성능을 저하시키는 주된 원인
- 복잡성: 마스터 머티리얼의 노드 그래프가 수백, 수천 개에 달할 수 있어 '스파게티'처럼 얽히게 됨. 한 사람이 관리하기 어려워지며, 수정 시 얘기치 못한 부분에서 문제가 발생할 위험이 큼.

## Specialized Masters
기능적으로나 시각적으로 뚜렷하게 구분되는 재질의 '종류'마다 별도의 마스터 머티리얼 만들기

```
[ M_Surface ]  (기본 기능)
   ├─ MI_OakWood
   ├─ MI_SteelMetal
   └─ MI_RoughStone

[ M_Foliage ]  (기본 기능 + '바람' 기능)
   ├─ MI_Grass
   └─ MI_TreeLeaves

[ M_CharacterSkin ] (기본 기능 + '피부' 기능)
   ├─ MI_HeroFace
   └─ MI_MonsterArm
```

> 마스터 머티리얼을 재질별로 만들어보자

### 만들어야 할 마스터 머티리얼 목록
- M_Surface,M_Foliage, M_CharacterSkin, M_Transparent(glass), M_CarPaint 

---
