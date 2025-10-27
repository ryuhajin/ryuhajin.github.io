---
layout: default
title: "Graphics rendering pipeline"
parent: "Computer Graphics"
nav_order: 1
has_children: true
---

# Graphics rendering pipeline
3D 좌표로 표현된 기하학적 객체의 장면을 2D 디스플레이에 렌더링하는 데 필요한 일련의 단계

<br>

![graphics pipeline](/images/graphics-pipeline.png)


**참고 링크**

- [Graphics Programming Compendium](https://graphicscompendium.com/index.html)
- [a trip through the graphics pipeline](https://alaingalvan.gitbook.io/a-trip-through-the-graphics-pipeline)

---

# 아핀 변환
- 선형 변환(Linear Transformation)과 평행 이동(Translation)을 결합한 변환
- 기하학적 특성 보존:
  - 직선성 유지 (직선 → 직선)
  - 평행성 유지 (평행선 → 평행선)
  - 중심점 보존 (무게중심 보존)

---

## 주요 변환 유형

| 변환 유형 | 설명 | 특징 |
| 이동(Translation) | 객체 위치 변경 | 방향/크기 불변 |
| 회전(Rotation) | 각도 θ만큼 회전 | 거리 보존 |
| 크기 변환(Scaling) | 축별 크기 조정 | $$s_x, s_y$$ 배율 |
| 대칭(Reflection) | 축에 대한 반사 | 행렬식 = -1 |
| 전단(Shear) | 층밀림 효과 | 각도 변화 |

---

## 정의

<br>

$$\vec{y} = A\vec{x} + \vec{b}$$

---

- A : 선형 변환을 나타내는 행렬
- $$\vec{b}$$ : 평행이동(translation) 벡터
- $$\vec{x}$$ : 입력 벡터 (좌표)
- $$\vec{y}$$ : 변환된 출력 벡터

---

$$
\begin{aligned}
\begin{bmatrix} x' \\ y' \end{bmatrix} 
&= \begin{bmatrix} a & b \\ c & d \end{bmatrix} 
\begin{bmatrix} x \\ y \end{bmatrix} 
+ \begin{bmatrix} e \\ f \end{bmatrix} \\
&= \begin{bmatrix} a x + b y + e \\ c x + d y + f \end{bmatrix}
\end{aligned}
$$

---

- $$\begin{bmatrix} a & b \\ c & d \end{bmatrix}$$ : 선형 변환을 나타내는 행렬 (아핀 변환 행렬)
- $$\begin{bmatrix} x \\ y \end{bmatrix}$$ : 입력 벡터
- $$\begin{bmatrix} e \\ f \end{bmatrix}$$ : 평행 이동 벡터
- $$\begin{bmatrix} x' \\ y' \end{bmatrix}$$ : 변환된 출력 벡터

---

**참고하면 좋은 링크**
- [아핀 변환](https://angeloyeo.github.io/2024/06/28/Affine_Transformation.html)

----

# homogeneous coordinates (동차 좌표)
- 아핀변환을 행렬 곱셈 하나로 표현하기 위해 도입된 확장 좌표계
- n차원 공간의 점을 n+1차원 공간의 벡터로 확장하여 표현하는 방식

---

## 동차좌표가 필요한 이유

- **문제점** : 기존의 2×2 행렬 곱셈 만으로는 이동(translation) 변환을 행렬 곱셈으로 표현할 수 없다

---

$$
\begin{bmatrix}
x'
\\
y'
\end{bmatrix} =
\begin{bmatrix} 
a & b \\
c & d 
\end{bmatrix} 
\begin{bmatrix}
x
\\
y
\end{bmatrix}
$$

---

- 이동 변환을 (예 : $$x' = x + t_x, \ y' = y + t_y $$) 위 수식으로 표현 불가

> - 따라서 좌표를 한 차원 올려 3차원 벡터 (x,y,1)로 보고
> - 3×3 행렬 곱셈으로 이동/회전/스케일/전단 등을 한 번에 처리

---

## 동차 좌표에서 점(Point) vs 방향 벡터(Direction)
w의 값에 따라 점이냐 벡터냐를 알 수 있다

- 기하학적 의미 차이

| 구분 | 동차좌표 표현 | 의미 | w 성분 |
| 점 | (x,y,1) | 공간의 특정 위치 | w = 1 |
| 방향 벡터 | (x,y,0) | 크기와 방향만 가짐 (위치 없음) | w = 0 |

- 점 : "어디에 있는가?" → 위치 정보 포함

$$\text{예: } (3, 4, 1) = \text{좌표 (3,4)}$$

- 방향 벡터 : "어느 방향인가?" → 이동 가능성만 표현

$$\text{예: } (1, -2, 0) = \text{오른쪽+아래 방향}$$

---

### 아핀 변환의 동차좌표 표현 (2D)

$$
T =
\begin{bmatrix}
A & \mathbf{b} \\
\mathbf{0}^T & 1
\end{bmatrix}
=
\begin{bmatrix}
a_{11} & a_{12} & b_{1} \\
a_{21} & a_{22} & b_{2} \\
0 & 0 & 1
\end{bmatrix}
$$

- $$T$$ : $$\ \vec{y} = A\vec{x} + \vec{b}$$ 꼴을 동차좌표계에서 표현한 아핀 변환 행렬
- $$A \in \mathbb{R}^{2\times2}$$ : 회전, 스케일, 전단, 대칭 등 선형 변환
- $$\mathbf{b} \in \mathbb{R}^{2}$$ : 이동(translation) 벡터
- $$\mathbf{0}^T = [0\;0]$$ : 이동을 w성분으로 제어하기 위해 필요한 마지막 행

---

### 점(Point) vs 방향 벡터(Direction)

- 점(point): $$ (x, y, 1)^T $$
- 방향 벡터(direction): $$ (v_x, v_y, 0)^T $$

점에 적용:

$$
T
\begin{bmatrix}
x \\ y \\ 1
\end{bmatrix}
=
\begin{bmatrix}
A\begin{bmatrix}x \\ y\end{bmatrix} + \mathbf{b} \\
1
\end{bmatrix}
$$

방향 벡터에 적용:

$$
T
\begin{bmatrix}
v_x \\ v_y \\ 0
\end{bmatrix}
=
\begin{bmatrix}
A\begin{bmatrix}v_x \\ v_y\end{bmatrix} \\
0
\end{bmatrix}
$$

> **핵심**: 동일한 행렬 \(T\)를 써도, \(w=1\)이면 이동이 적용되고 \(w=0\)이면 이동이 자동으로 사라짐

---

### 예시 1: 순수 이동

$$
T_{\text{trans}} =
\begin{bmatrix}
1 & 0 & t_x \\
0 & 1 & t_y \\
0 & 0 & 1
\end{bmatrix}
$$

점:

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
=
\begin{bmatrix}
x + t_x \\
y + t_y \\
1
\end{bmatrix}
$$

방향 벡터:

$$
\begin{bmatrix} v_x' \\ v_y' \\ 0 \end{bmatrix}
=
\begin{bmatrix}
v_x \\
v_y \\
0
\end{bmatrix}
$$

---

### 예시 2: 순수 회전(원점 기준)

$$
R(\theta) =
\begin{bmatrix}
\cos\theta & -\sin\theta & 0 \\
\sin\theta & \cos\theta  & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

점:

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
=
\begin{bmatrix}
x\cos\theta - y\sin\theta \\
x\sin\theta + y\cos\theta \\
1
\end{bmatrix}
$$

방향 벡터:

$$
\begin{bmatrix} v_x' \\ v_y' \\ 0 \end{bmatrix}
=
\begin{bmatrix}
v_x\cos\theta - v_y\sin\theta \\
v_x\sin\theta + v_y\cos\theta \\
0
\end{bmatrix}
$$

---

### 예시 3: 임의의 점 \(p_0=(p_x,p_y)\) 주변 회전

$$
T = T_{+p_0} \; R(\theta) \; T_{-p_0}
$$

- 여기서 \(T_{\pm p_0}\)는 평행이동 행렬
- 결과 행렬의 \(\mathbf{b}\neq 0\): 점에는 이동+회전, 방향 벡터에는 회전만 적용


---

### 물리적 해석

- 점과 점 빼기 → 방향벡터 생성

$$(x_2,y_2,1) - (x_1,y_1,1) = (x_2-x_1, y_2-y_1, 0)$$

- 점 + 방향벡터 → 새로운 점

$$(x,y,1) + (a,b,0) = (x+a, y+b, 1)$$

---

### 실제 적용 사례
3D 그래픽스에서 활용되는 예시

- 점 : 객체의 월드 좌표 위치

$$\text{예: 삼각형의 꼭짓점 } (x,y,z,1)$$

- 방향벡터 : 빛의 방향/법선 벡터

$$\text{예: 조명 방향 } (dx,dy,dz,0)$$

> 방향벡터를 w=1로 설정하면 이동 변환 시 의도치 않은 왜곡이 발생한다

---


{: .new-title}
> ❓ 동차좌표에서 점과 방향 벡터를 왜 구분해야 해?
>
- 변환의 물리적 정확성: 이동 변환 시 방향은 불변해야 함
- 기하학적 연산의 명확성: 점-벡터 연산 규칙 보장 (예: 점 - 점 = 벡터)
- 렌더링 시스템의 안정성: 3D 엔진에서 광원, 법선 등 방향성 데이터 오염 방지

---

## 아핀변환의 동차좌표 표현

---

- 2D 예시

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} 
= \begin{bmatrix} 
a & b & e \\ 
c & d & f \\ 
0 & 0 & 1 
\end{bmatrix} 
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

---

## 아핀변환 예시

- 평행 이동(Translation) : x축으로 $$t_x$$, y축으로 $$t_y$$ 만큼 이동

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} 
= \begin{bmatrix} 
1 & 0 & t_x \\ 
0 & 1 & t_y \\ 
0 & 0 & 1 
\end{bmatrix} 
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

---

$$
\begin{bmatrix} 
1 & 0 & t_x \\ 
0 & 1 & t_y \\ 
0 & 0 & 1 
\end{bmatrix} 
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
=
\begin{bmatrix} 
x+t_x \\ 
y+t_y \\ 
1
\end{bmatrix} 
$$

---

- 회전 (Rotation) : 원점을 중심으로 $$\theta$$ 만큼 회전

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} 
= \begin{bmatrix} 
\cos\theta & -\sin\theta & 0 \\ 
\sin\theta & \cos\theta & 0 \\ 
0 & 0 & 1 
\end{bmatrix} 
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
= \begin{bmatrix} 
x\cosθ - y\sinθ \\ 
x\sinθ + y\cosθ \\ 
1
\end{bmatrix}
$$

---

- 크기 조절 (Scaling) : x축으로 $$s_x$$ 배, y축으로 $$s_y$$ 배 확대/축소

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} 
= \begin{bmatrix} 
s_x & 0 & 0 \\ 
0 & s_y & 0 \\ 
0 & 0 & 1 
\end{bmatrix} 
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
= \begin{bmatrix} s_x x \\ s_y y \\ 1 \end{bmatrix}
$$

---

- 전단(Shear) : x축 방향으로 k만큼 전단

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} =
\begin{bmatrix}
1 & k & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
=
\begin{bmatrix}
x + k y \\
y \\
1
\end{bmatrix}
$$

---

- 대칭(Reflection) : x축에 대한 대칭

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} =
\begin{bmatrix}
1 & 0 & 0 \\
0 & -1 & 0 \\
0 & 0 & 1
\end{bmatrix}
\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
$$

---

$$
\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}
=
\begin{bmatrix}
x \\
- y \\
1
\end{bmatrix}
$$

---

- 아핀변환 조합 : 여러 아핀변환을 연속적으로 적용할 때는 행렬을 곱하여 하나의 변환 행렬로 결합 가능
    - 열벡터 기준 오른쪽의 $$T_1$$ 이 먼저 적용

$$
T_{\text{total}} = T_n \cdots T_2 T_1
$$

---

**참고하면 좋은 링크**

- [동차 좌표계](https://www.songho.ca/math/homogeneous/homogeneous.html)
- [렌더링 파이프라인에서 왜 동차 좌표계를 쓸까](https://enghqii.tistory.com/59)
