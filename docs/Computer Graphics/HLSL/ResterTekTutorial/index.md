---
layout: default
title: "ResterTekTutorial"
parent: "HLSL"
nav_order: 3
has_children: true
---

# ResterTekTutorial
directX 11 tutorial

**참고 링크**
- [Direct3D 11.3 Functional Specification](https://microsoft.github.io/DirectX-Specs/d3d/archive/D3D11_3_FunctionalSpec.htm)
- [RasterTek](https://www.rastertek.com/tutindex.html)
- [DirectX 11 - Braynzar Soft Tutorials](https://www.braynzarsoft.net/viewtutorial/q16390-braynzar-soft-directx-11-tutorials)

---

# Linear Mapping (선형 변환)
한 범위 안에 있는 값의 상대적인 위치를 그대로 유지하면서 다른 범위로 옮기는 과정

- 예 : [0, 255] 범위의 중간 값인 127.5는 [-1, 1] 범위로 변환했을 때도 정확히 중간 값인 0
- 값들 사이의 비례 관계가 직선(linear)처럼 유지된다고 해서 선형 변환

---

# Linear Mapping 공식 유도 과정

## 변수 정의

- 변환하려는 값: $$ x $$
- 원본 범위: $$[A_{min}, A_{max}]$$
- 목표 범위: $$[B_{min}, B_{max}]$$
- 최종 변환된 값: $$ x'$$

---

## 1단계: 원본 범위의 값을 [0, 1] 범위로 정규화하기

---

먼저, 값 $$x$$가 원본 범위 $$[A_{min}, A_{max}]$$ 내에서 차지하는 상대적인 비율(0~1 사이의 값)을 구한다

### 1. 범위를 0에서 시작하도록 평행이동
- 값 $$x$$에서 시작점 $$A_{min}$$을 빼서, 범위의 시작을 0으로 만든다
- 이렇게 하면 값의 범위는 $$[0, A_{max} - A_{min}]$$ 이 됨

---

$$ x - A_{min} $$

---

예 : 범위 [100, 200], x = 150 (중간값)
- $$ x - A_{min}  = 150 - 100 = 50$$, x는 여전히 중간 값
- 바뀐 범위 [0, 100]

---

### 2.  범위의 전체 길이로 나누어 비율 계산
- 위에서 얻은 값을 범위의 전체 길이 $$(A_{max} - A_{min})$$로 나누어 0과 1 사이의 비율로 만든다
- 이 값을 `t`라고 하자

---

$$ t = \frac{x - A_{min}}{A_{max} - A_{min}} $$

---

## 2단계: [0, 1] 범위의 값을 목표 범위로 확장하기

---

1단계에서 구한 비율 `t`를 사용해 목표 범위 $$[B_{min}, B_{max}]$$ 에서의 실제 값을 계산

### 1. 목표 범위의 길이만큼 스케일링
비율 `t`에 목표 범위의 전체 길이 $$(B_{max} - B_{min})$$ 를 곱함

---
    
$$ t \times (B_{max} - B_{min}) $$

---

- 이 값은 목표 범위가 0에서 시작한다고 가정했을 때의 상대적인 위치

### 2. 목표 범위의 시작점에 맞게 평행이동
위에서 계산한 값에 목표 범위의 시작점 $$B_{min}$$을 더해 최종 위치 찾기

---

$$ x' = (t \times (B_{max} - B_{min})) + B_{min} $$

---

## 최종 공식: 두 단계를 하나로 합치기

2단계 공식의 `t` 자리에 1단계에서 구한 공식을 그대로 대입하면, 선형 변환을 위한 최종 공식이 완성

---

$$
x' = \left( \frac{x - A_{min}}{A_{max} - A_{min}} \right) \times (B_{max} - B_{min}) + B_{min}
$$

---

## 예제

$$ x' = c + \frac{(x - a)(d - c)}{b - a} $$

- [a, b] = 원래 범위
- [c, d] = 바꿀 범위 (위 공식 유도의 B식을 분자로 옮긴것)
- x = 변환할 원래 값
- x' = 변환된 값

---

### 1. [0 ~ 255] → [0 ~ 1]
- 원래 범위: [a, b] = [0, 255]
- 새 범위: [c, d] = [0, 1]

$$ x' = 0 + \frac{(x - 0)(1 - 0)}{255 - 0} $$

$$ = \frac{x}{255} $$

즉 `x / 255`

---

### 2. [0 ~ 800] → [-1 ~ 1]
- 원래 범위: [a, b] = [0, 800]
- 새 범위: [c, d] = [-1, 1]

$$ x' = -1 + \frac{(x - 0)(1 - (-1))}{800 - 0} $$

$$ = -1 + \frac{x \cdot 2}{800} $$

$$ = -1 + \frac{x}{400} $$

즉 `-1 + x / 400`

---

### 알아두기

- $$ A_{min} = A_{max} $$ 면 정의 불가
- 범위를 거꾸로 넣으면 (예: $$ A_{max} < A_{min} $$) 부호 반전으로 역순 매핑

---

## Lerp (선형 보간) 와 관계
선형 변환 공식은 컴퓨터 그래픽스에서 매우 중요한 **선형 보간(Linear Interpolation, Lerp)**과 사실상 동일한 구조

---


```
(시작값 + (끝값 - 시작값) * t)
```
$$ Lerp(a,b,t) = a + (b−a) \cdot t $$ 

- "시작값 + 변화량" 구조라 직관적
- 그래픽스 API, 게임 엔진에서 이 형태를 많이 씀

---

```
(시작값 * (1 - t) + 끝값 * t)
```
$$ Lerp(a,b,t) = a(1 - t) + bt $$

- 가중 평균(weighted average) 구조라 의미가 명확
- t = 0 이면 a 100%, t = 1 이면 t 100%
- 그 사이 값은 a와 b의 가중치 합으로 해석 가능
- 수치 해석, 보간, 혼합(blending) 설명할 때 자주 씀

---

- 우리가 유도한 $$ x' = ( B_{min} + (B_{max} - B_{min})) \cdot t  $$ 는 `Lerp(B_min, B_max, t)` 와 같음


즉 선형 변환은 어떤 값의 **원본 범위 내 상대적 위치(t)를 계산**한 뒤 **그 위치(t)를 이용해 목표 범위 내의 값을 선형 보간하는 과정**이라고 정의할 수 있다