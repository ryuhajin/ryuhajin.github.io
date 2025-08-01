---
layout: default
title: "Forward lighting"
parent: "HLSL"
nav_order: 10
---

# 1. Forward lighting

## 이 챕터에서 다루는 조명 목록
- Hemispheric ambient light
- Directional light
- Point light
- Spot light
- Capsule light
- Projected texture – point light
- Projected texture – spot light
- Multiple lights in a single pass

---

- 고수준 관점 (high-level view) 에서 장면 내 각 조명 소스마다 메쉬를 한 번씩 렌더링하는 방식으로 작동한다
- 해당 렌더링 호출은 최종 화면에 표시되는 조명된 이미지에 해당 조명의 색상 기여도를 추가한다
- N개의 조명과 M개의 메쉬가 있는 장면에서는 N × M개의 렌더링 호출이 필요하다

---

## 최적화 4가지 방법
1. 깊이 버퍼를 모두 불투명 매쉬로 채운다
    - 다른 픽셀에 의해 덮어 쓰이는 픽셀을 렌더링 하는데 자원을 낭비하지 않게됨
2. 카메라에서 보이지 않는 조명 소스와 장면 요소는 무시한다
3. 충돌 테스트를 수행하여 어떤 빛이 어떤 메시에 영향을 미치는지 확인한다
    - 충돌 테스트 결과에 따라 빛/메시 렌더링 호출을 건너 뜀
4. 동일한 메시에 영향을 미치는 여러 빛 소스를 단일 렌더링 호출로 결합한다
    - 렌더링 호출 수를 줄일 뿐만 아니라 조명용 메시 정보 준비의 오버헤드도 감소 시킴

> - 2,3 번째 방법은 CPU에서 구현됨
- 

---

- 포워드 조명은 투명한 재질을 조명하는데 필요함
- 디퍼드 메소드의 경우 불투명한 재질만을 핸들링 하기 때문에 투명도가 들어간 경우 포워드 조명이 쓰임

---


