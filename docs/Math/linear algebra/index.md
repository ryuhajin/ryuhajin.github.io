---
layout: default
title: "Linear Algebra"
parent: "Math"
nav_order: 1
has_children: true
---

# Linear Algebra

- [An Intuitive Guide to Linear Algebra](https://betterexplained.com/articles/linear-algebra-guide/)

---

## lining up the variable
미지수가 3개인 방정식을 행렬로 만들어보자

---

예시

$$
\begin{cases}
2x + 3y - z = 11\\
7y = 6 - x -4z\\
-8z + 3 = y
\end{cases}
$$

---

- 위와 같은 미지수가 3개인 방정식이 있다고 할 때,
`x y z = c` 와 같은 꼴로 정리한다.

$$
\begin{cases}
2x + 3y - z = 11\\
x + 7y +4z = 6 \\
0x - y -8z = -3
\end{cases}
$$

---

- 그 후 값을 행렬에 넣어준다

$$
\begin{pmatrix}
\begin{array}{ccc|c}
2 & 3 & -1 & 11\\
1 & 7 & 4 & 6 \\
0 & -1 & -8 & -3
\end{array}
\end{pmatrix}
$$

---

# 행렬 연산 표기
## Switching two rows
행을 맞바꿀 때 사용하는 기호

$$ {R_1 \leftrightarrow R_2} $$

- 예시

$$
\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
\end{pmatrix}
\xrightarrow{R_1 \leftrightarrow R_2}
\begin{pmatrix}
4 & 5 & 6 \\
1 & 2 & 3 \\
\end{pmatrix}
$$

---

## Multplying a row by a constant
행에 곱셈을 할 때 사용하는 기호

$$ {2R_1 \rightarrow R_1} $$

- 예시

$$
\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
\end{pmatrix}
\xrightarrow{2R_1 \rightarrow R_1}
\begin{pmatrix}
2 & 4 & 6 \\
4 & 5 & 6
\end{pmatrix}
$$

---

## Add a row to another row
행에 덧셈을 할 때 사용하는 기호

$$ {R_1 + R_2 \rightarrow R_1} $$

- 예시

$$
\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
\end{pmatrix}
\xrightarrow{R_1 + R_2 \rightarrow R_1}
\begin{pmatrix}
5 & 7 & 9 \\
4 & 5 & 6
\end{pmatrix}
$$

---

**참고하면 좋은 링크**
- [선형대수 1: 벡터 공간과 열 공간](https://ai.plainenglish.io/linear-algebra-1-vector-spaces-and-the-columnspace-8c7c61943549)