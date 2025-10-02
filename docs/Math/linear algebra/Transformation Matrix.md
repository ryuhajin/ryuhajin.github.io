---
layout: default
title: "Transformation Matrix"
parent: "Linear Algebra"
nav_order: 6
has_children: false
---

# Transformation Matrix
변환 행렬

**링크**
- [Change of basis](https://youtu.be/P2LTAUO1TdA?si=OjNsAXzS3EYHh0ah)

---

## 1. 좌표계와 기저
벡터는 추상적인 "화살표"

- 우리가 벡터를 [3,2]처럼 숫자로 표현하는 것은 **기저 벡터를 정했기 때문**

**예**

표준 기저 $$\hat{i} = (1,0), \quad \hat{j} = (0,1)$$
- 따라서 [3,2]는  $$3\hat{i} + 2\hat{j}$$

---

즉 좌표계란? **원점 + 기저벡터 집합**

---

## 2. 다른 기저 사용
위 링크 영상을 예로 들어보자. 제니퍼의 세상에서는 다른 기저를 쓴다

**예**

제니퍼 기저 $$\hat{J_i} = (2,1), \quad \hat{J_j} = (-1,1)$$

- 같은 벡터라도 제니퍼의 기저로 표현하면 좌표가 달라진다
- 예 : [3,2] → 제니퍼 좌표에서는 [5/3, 1/3]

---

## 좌표 변환 원리
- 제니퍼 좌표는 실제 공간에서 이렇게 벡터를 만든다

---

$$\vec{v} = n\hat{J_i} + n\hat{J_j}$$

---

- 변환 행렬 T의 각 열은 **원래 좌표계(여기서는 제니퍼 좌표계)의 기저 벡터들이 대상 좌표계(표준 좌표계)에서 어떻게 표현되는지**를 나타냄

> 즉 J 좌표계의 기저 벡터가 S 좌표계에서는 어떻게 보이는가?를 열 행렬로 표현 : $$(M_{J \rightarrow S})$$

---

$$T = \begin{bmatrix} \hat{J_i} & \hat{J_j} \end{bmatrix}
= \begin{bmatrix} 2 & -1 \\ 1 & 1 \end{bmatrix} $$

---

- 제니퍼 기저를 표준 좌표에서 표현한 식 T가 변환 행렬

---

$$[v]_S = T[v]_J$$

---

- T : 변환 행렬
- [v]J : 제니퍼 좌표에서 본 벡터 좌표
- [v]S : 표준 좌표에서 본 벡터 좌표

---

- 반대로 표준 좌표를 제니퍼 좌표로 변환하려면 역행렬을 구하면 됨

---

$$[v]_J = T^{-1}[v]_S$$

---

### 좌표 변환 직관적 비유
- 좌표계: 각 나라의 '언어'
- 벡터: 우리가 표현하고 싶은 '과일' (예: 사과 🍎)
- 좌표: 그 나라 언어로 표현된 '과일 이름' (예: 'Apple', 'Pomme')

A나라 사람에게 'Apple'이라고 말하면 바로 알아듣지만, B나라 사람에게 'Apple'이라고 하면 못 알아들음
- 변환 행렬이 번역기 역할을 함

---


## 정리
### 변환 행렬 구하는 법
1. **B 좌표계의 기준축을 A 좌표계에서 표현한다**  
   - 예: B의 x축이 A 좌표계에서 (0.7, 0.7, 0)처럼 보일 수 있다
   - B의 y축, z축도 마찬가지로 A 좌표계로 표현한다

2. 이 세 개의 벡터를 **열(column)**로 모으면 행렬이 된다 
   
---

$$
M_{BA} =
\begin{bmatrix}
| & | & | \\
b_x & b_y & b_z \\
| & | & |
\end{bmatrix}
$$

- $$b_x, b_y, b_z$$: B의 단위축을 A 좌표계에서 표현한 벡터

---

해당 행렬을 써서 좌표 변환하기

$$
[v]_A = M_{BA}[v]_B
$$

---

$$
[v]_B = M_{BA}^{-1}[v]_A
$$

---

## Orthonormal Basis (정규 직교 기저)
그래픽스에서 사용하는 월드, 뷰, 카메라 좌표계의 변환은 보통 정규 직교 기저를 가진다
- 따라서 **회전만 포함된 경우, 역행렬은 단순히 전치행렬로 계산할 수 있다**

---

- 정규 (Orthonormal) : 각 축 벡터의 길이가 1이다
- 직교 (Orthogonal) : 모든 축이 서로 90도(직각)를 이룬다

> 좌표계가 이 성질을 만족하면 (이동 부분 제외) 역행렬은 전치 행렬(Transpose Matrix)과 같다

- 전치 행렬: 행렬의 행과 열을 뒤바꾼 행렬. 계산이 엄청나게 빠르고 간단

---

$$ \text {If M is orthonormal, then} M^{−1} =M^T$$

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}^T
=
\begin{pmatrix}
a & c \\
b & d
\end{pmatrix}
$$

---

## 전치 행렬 vs 일반 역행렬 정리
전치 행렬로 역행렬을 대신할 수 있는 경우와 아닌 경우 정리

| 변환 종류 | 좌표축 성질 | 역행렬 계산 방법 | 예시 행렬 | 결과 |
|---|---|---|---|---|
| **회전 (Rotation)** | 직교 + 길이 1 | 전치 = 역행렬 | $$R=\begin{bmatrix}0&-1\\1&0\end{bmatrix}$$ | $$R^{-1}=R^T$$ |
| **반사 (Reflection)** | 직교 + 길이 1 | 전치 = 역행렬 | $$M=\begin{bmatrix}-1&0\\0&1\end{bmatrix}$$ | $$M^{-1}=M^T=M$$ |
| **균등 스케일 (Uniform scale)** | 직교 + 길이≠1 | 전치 ≠ 역행렬 | $$S=\begin{bmatrix}2&0\\0&2\end{bmatrix}$$ | $$S^{-1}=\tfrac{1}{2}I$$ |
| **비균등 스케일 (Non-uniform scale)** | 각 축 벡터의 길이가 1이 아님 | 일반 역행렬 필요 | $$S=\begin{bmatrix}2&0\\0&3\end{bmatrix}$$ | $$S^{-1}=\begin{bmatrix}0.5&0\\0&0.333\end{bmatrix}$$ |
| **전단 (Shear)** | 직각 아님 | 일반 역행렬 필요 | $$Sh=\begin{bmatrix}1&1\\0&1\end{bmatrix}$$ | $$Sh^{-1}=\begin{bmatrix}1&-1\\0&1\end{bmatrix}$$ |
| **투영 (Projection)** | 축 일부 손실 | 역행렬 존재 X (비가역) | 예: 직교 투영 | 역행렬 없음 |
