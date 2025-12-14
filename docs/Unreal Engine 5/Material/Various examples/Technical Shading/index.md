---
layout: default
title: "Technical Shading"
parent: "Various examples"
nav_order: 1
has_children: true
---

# Technical Shading
HLSL / SDF 예제

**링크**
- [Unreal Engine 5 Tutorial - Technical Shading](https://www.youtube.com/watch?v=lsXB1PQdGx0&list=PLoHLpVCC9RmMMmW5eP1aAyJrTjxd46rx_)

---

## Cost
ALU 명령어(산술 연산)의 복잡도 수준은 다양하다 (GPU 아키텍처에 따라 다를 수 있음)

### FREE (on most GPUs)
- saturate
- abs
- multiply by 2/4
- divide 2/4 (실제로 일부 하드웨어 명령어는 입력이나 출력에 "출력에 2를 곱하라"와 같은 수정자를 받을 수 있다)

---

### CHEAP TIER
- add
- subtract
- multiply
- min
- max
- floor
- ceil
- round
- frac
- clamp
- step
- lerp
- dot product
- if (분기 없는 삼항 비교라고도 함)

---

### MID TIER
- divide
- sin
- cos
- square root
- log2
- exp2
- sign
- cross product
- length
- distance
- smoothstep

---

### EXPENSIVE TIER
- power
- fmod
- tan
- inverse trigonometry (asin, acos, atan, atan2)
  - 역삼각법

```
상수로 전달된 값(매개변수가 아닌)은 컴파일 시간에 최적화 됨
(따라서 0.5를 곱하는 것과 2로 나누는 것은 상수인 경우 동일하게 처리되므로 걱정할 필요가 없음)
```

```
사용자 지정  노드는 필요한 경우에만 사용 (예: 노드 형태로 제공되지 않는 작업)

사용자 지정 노드는 일반 노드처럼 컴파일 시 최적화되지 않고, 모든 단계를 미리 볼 수 없으며, 팀원들이 이해하기 어려울 수 있다
```
