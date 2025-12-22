---
layout: default
title: "Procedural Shapes, Patterns"
parent: "Material"
nav_order: 8
has_children: true
---

# Procedural Shapes, Patterns

- [2D 부호 있는 거리 필드 기본 사항](https://www.ronja-tutorials.com/post/034-2d-sdf-basics/)

## 2D Signed Distance Field
**어떤 점 p에서 가장 가까운 표면까지의 거리를 값으로 갖는 필드**(함수/텍스처)

## 핵심
부호(sign)

- **dist(p) < 0** : 도형 내부
- **dist(p) = 0** : 경계(표면)
- **dist(p) > 0** : 도형 외부

---

## Circle
원점 중심 원의 SDF

> 반지름을 빼는 순간부터 내부가 음수가 되어 “signed” 성질이 생김

```c++
dist(p) = length(p) - radius
```

```c++
float circle(float2 samplePosition, float radius) {
    return length(samplePosition) - radius;
}
```

- **length(samplePosition)**: 원점에서 샘플 포인트까지의 거리
- **radius**: 반지름을 빼서 원의 크기 조정

---

## Rectangle
1. **절댓값을 취하여 중심에서 직사각형까지의 거리를 구한 뒤 사각형 절반 크기 빼기**
    - d = abs(p) - halfSize
2. **밖(outside) 거리: 모서리 밖으로 튀어나온 성분만 남겨 길이 계산**
    - outside = length(max(d, 0))
3. **안(inside) 거리: 내부에서 가장 큰 성분을 사용하여 내부 거리 계산. 해당 값이 0보다 크지 않도록 0 이하로 clamp**
    - inside = min(max(d.x, d.y), 0)
4. **최종: dist = outside + inside**
    - 위 과정을 거쳐야 사각형 코너 주변 거리도 정확해짐

```c++
float rectangle(float2 samplePosition, float2 halfSize) {
    // 구성 요소별 가장자리 거리 계산
    float2 componentWiseEdgeDistance = abs(samplePosition) - halfSize;
    
    // 외부 거리 계산 (모서리 부분 정확히 처리)
    float outsideDistance = length(max(componentWiseEdgeDistance, 0));
    
    // 내부 거리 계산
    float insideDistance = min(max(componentWiseEdgeDistance.x, componentWiseEdgeDistance.y), 0);
    
    return outsideDistance + insideDistance;
}
```

---

## Translation
도형 자체를 움직이는 대신, **도형이 그려지는 '공간'을 반대로 움직인다고 생각하기**

- 원을 오른쪽으로 3만큼 옮기고 싶다 = 공간 자체를 왼쪽으로 3만큼 당긴다

### 개념 이해하기
원 SDF는 보통 원점(0,0) 중심으로 정의

- **원점을 벗어난 위치 (3,2)에 원**을 그리고 싶다 = 그 위치가 **월드 좌표에서 도형 로컬 좌표로 보면 어디야?**
- **= 점의 공간을 변환!**

```
“(3,2)에 도형을 두고 싶다”

→ 월드 좌표 (3,2)가 도형 로컬 좌표 (0,0)이 되게 만들자
→ (3,2) - (3,2) = (0,0)이므로 -offset
```

---

```c++
float2 translate(float2 samplePosition, float2 offset) {
    // 좌표를 반대로 이동시켜 물체가 해당 위치에 있는 것처럼 만들기
    return samplePosition - offset;
}
```

---

## Rotate
- **rotation * 2π로 라디안 변환**
- 도형을 **+로 돌리고 싶으면 좌표는 역방향으로 돌려야 해서 *-1을 넣음**

```c++
float2 rotate(float2 samplePosition, float rotation){
    const float PI = 3.14159;
    float angle = rotation * PI * 2 * -1;
    float sine, cosine;
    sincos(angle, sine, cosine);
    return float2(cosine * samplePosition.x + sine * samplePosition.y, cosine * samplePosition.y - sine * samplePosition.x);
}
```

> 회전은 순서가 중요하다

- **회전 후 이동 : SDF 평가 좌표계의 원점(0,0) 중심을 기준으로 객체 회전**
- 이동 벡터 자체가 회전에 휘말리므 화면 원점 기준으로 빙글빙글 도는 결과

```c++
float scene(float2 position) {
    float2 circlePosition = position;
    circlePosition = rotate(circlePosition, _Time.y); // SDF 평가 좌표계의 원점(0,0) 중심을 기준으로 객체 회전
    circlePosition = translate(circlePosition, float2(2, 0)); // 이동도 회전의 영향을 받음 (지구 공전)
    float sceneDistance = rectangle(circlePosition, float2(1, 2));
    return sceneDistance;
}
```

---

- **이동 후 회전 : 도형 자체 중심을 기준으로 회전**
- 도형 중심을 원점으로 가져온 뒤 회전이 되므로 도형 자신의 중심 기준 회전

```c++
float scene(float2 position) {
    float2 circlePosition = position;
    circlePosition = translate(circlePosition, float2(2, 0)); // SDF 평가 좌표계의 원점(0,0) 중심 이동
    circlePosition = rotate(circlePosition, _Time.y); // 도형의 중심이 좌표계의 중심 (지구 자전)
    float sceneDistance = rectangle(circlePosition, float2(1, 2));
    return sceneDistance;
}
```

---

## Scale
**좌표를 배율로 나누고 축소된 공간에 도형을 그리면 기본 좌표계에서 더 크게 보임**

```c++
float2 scale(float2 samplePosition, float scale){
    return samplePosition / scale;
}
```

- 좌표를 position/s로 줄이면, 거리도 같이 1/s로 줄어든 값이 나옴
- SDF의 장점인 dist가 실제 거리 (월드 단위)라는 성질이 깨짐
- 따라서 결과 dist에 스케일을 곱하는 보정 필요

```c++
dist = rectangle(pWorld / s, halfSize) * s;
```

> x와 y가 서로 다른 비율로 늘어나면 거리 1m의 의미가 방향에 따라 달라져 단일 보정 스칼라 s로는 진짜 거리를 복원할 수 없다
> - ratio 필요

---

# Visualisation
SDF 응용하기

## Hard Shape
SDF 값 **dist는 연속적이고, 경계가 항상 0으로 명확**하다

- 이 특성을 이용해 **안과 밖을 이진(binary)**로 만들면서
- **경계는 부드럽게(안티 앨리어싱) 처리**할 수 있다
- **텍스트 렌더링**에서 자주 쓰는 방식이며 저해상도여도 결과가 깔끔하다

---

## 핵심 개념
1. **다음 픽셀까지 거리 필드가 얼마나 변하는지** 계산한다
2. **변화량의 중심점에서 -,+ 변화량까지 smoothstep을 적용**한다

> 이 과정으로 경계인 0 주변에서 간단한 cutoff를 수행하고 안티 앨리어싱 효과를 갖는다

---

## 비유

```md
SDF 값: ────[ -1 -0.5 0 0.5 1 ]──── (연속적인 숫자)
부드러운 컷: ────(   안쪽   )|(   바깥쪽   )────
```

```md
// 개념적 설명 (실제 코드 아님)
거리 = 0.3 (표면에서 살짝 밖)
옆 픽셀 거리 = 0.2
변화량 = 0.1

부드러운 컷: 0.25~0.35 사이에서 서서히 변함
→ 경계가 뚜렷하지 않고 부드럽게!
```

---

## 과정
하드 쉐이프 구현의 핵심 로직

```c++
// 한 픽셀 내에서 dist가 얼마나 변하는지 (대략적인 경계 폭) 계산 (ddx, ddy)
float distanceChange = fwidth(dist) * 0.5; // 0.5는 +- 반 픽셀 폭을 만들기 위한 준비

// smoothstep을 사용해 경계선 0 근처를 부드럽게 cutoff
// edge 순서를 (+ → -)로 뒤집는 이유 : SDF의 음수(내부)가 보이게 만들기 위해
float antialiasedCutoff = smoothstep(distanceChange, -distanceChange, dist);

fixed4 col = fixed4(_Color, antialiasedCutoff);
```

> 결과 : 내부 = 1, 외부 = 0
> - 경게(dist = 0) 주변만 픽셀 단위로 부드럽게 변하는 깔끔한 실루엣 완성

---

### 1. 인접 픽셀 간 거리 값 변화 측정
옆 픽셀과 값이 얼마나 다른지 측정

- 목적: **안티앨리어싱 범위 결정**

```c++
abs(ddx(dist)) + abs(ddy(dist))
```

---

### 2. 경계선 부드럽게 만들기
- smoothstep (a,b,x) 사용
- a ≤ x ≤ b: 0 → 1 사이 부드럽게 변화

```c++
[smoothstep 함수 출력 값]

x < a: 0
x > b: 1
```

---

```c++
// dist = 0이 정확한 경계
// distanceChange만큼의 범위에서 부드럽게 전이
smoothstep(distanceChange, -distanceChange, dist)
```

---

## Height Lines
거리를 선으로 표시하기

- **dist를 주기 함수(삼각파 형태)로 접기 (frac)**
- dist = kD에서 **0이 되는 ‘라인까지의 거리’로 변환한 뒤 두께로 컷**
- **내부/외부를 다른 색으로 tint** 해서 구분

---

## 과정
등고선 핵심 과정

### 1. 내부, 외부 틴트 설정
- 내부, 외부 판정은 `step(0, dist)`
- `lerp`로 색 섞기

```c++
float4 _InsideColor("Inside Color", Color) = (.5, 0, 0, 1);

float4 _OutsideColor("Outside Color", Color) = (0, .5, 0, 1);

fixed4 col = lerp(_InsideColor, _OutsideColor, step(0, dist));
```

> step(0, dist)는 dist가 0 이상이면 1(외부), 아니면 0(내부)이므로 내부/외부를 바로 나눌 수 있음

---

### 2. 라인 간격, 두께 설정

```c++
float _LineDistance("Major Line Distance", Range(0, 2)) = 1;

float _LineThickness("Major Line Thickness", Range(0, 0.1)) = 0.05;
```

---

### 3. 가장 가까운 라인까지 거리 얻기 (핵심)
dist를 **라인 간격 D로 나눈 뒤, 소수부만 남겨 0~1 구간에서 반복시키기**
 
```c++
float majorLineDistance =
  abs(frac(dist / _LineDistance + 0.5) - 0.5) * _LineDistance;
```

1. **dist / D**
    - dist를 라인 간격 D 기준 단위로 정규화 (1.0 차이 = 라인 한 칸 차이)
2. **+0.5, frac(), -0.5**
    - frac()은 소수부분만 남김
    - 그냥 **frac(dist/D)만 쓰면 0을 통과하는 패턴의 기준점이 어긋날 수 있음**
      - 따라서 **+0.5로 이동 시킨 뒤 frac**
      - 다시 **-0.5를 하여 가운데를 0 기준으로 맞춤**
    - 0이 되는 지점이 0,1,2...로 정렬
3. **abs()**
    - 라인을 기준으로 앞/뒤가 **대칭**이 되게 만든다
    - **라인에서 얼마나 떨어졌는지 바꾸는 단계**
4. ***_LineDistance**
    - 처음 `/D`로 바꾼 단위를 다시 거리 단위로 되돌림
    - 이렇게 해야 안티앨리어싱 변화량도 유효해짐

---

```md
D = 1

라인은 dist = ..., -2, -1, 0, 1, 2, ...에서 생겨야 함
```

- 정수배 라인에 대한 거리

```md
dist = 0.00 → majorLineDistance = 0 (라인)

dist = 0.10 → 0.10 (라인에서 0.1 떨어짐)

dist = 0.49 → 0.49

dist = 0.50 → 0.50 (라인 사이 정확히 중간)

dist = 0.90 → 0.10 (다음 라인(dist=1)까지 0.1 남음)

dist = 1.00 → 0 (라인)

dist = -0.10 → 0.10 (음수도 동일하게 동작)
```

---

### 4. 두께 + 안티앨리어싱으로 라인 마스크 만들기
**AA 거리 ≤ 두께이면 라인을 그려라** = 라인 근처에서는 0에 가까워져 색이 어두워짐

```c++
float distanceChange = fwidth(dist) * 0.5; // AA

// 스무스스텝으로 부드러운 컷오프 만들기
float majorLines =
smoothstep(
  _LineThickness - distanceChange,
  _LineThickness + distanceChange,
  majorLineDistance
);

return col * majorLines;
```

- **majorLines = 0**
  - smoothstep(thickness-w, thickness+w, 0) = 0
  - **col * 0 = 0 (검은 선)**
- **majorLineDistance < _LineThickness**
  - 여전히 0에 가깝게 유지 → **선 영역**
- **majorLineDistance > _LineThickness + distanceChange**
  - smoothstep = 1
  - col * 1 → **원래 색 유지 (선 아님)**

> 경계 근처(_LineThickness ± distanceChange)에서만 0→1로 부드럽게 넘어가서 계단 현상(aliased edge)을 줄임

---

### 5. 얇은 라인 그리기
굵은 라인과 동일한 기법을 한 번 더 적용하되, 간격만 더 촘촘히

- **얇은 라인 개수**: _SubLines (IntRange로 정수만)
- **얇은 라인 두께**: _SubLineThickness

```c++
float distanceBetweenSubLines = _LineDistance / _SubLines;
```

---

- subLineDistance도 가장 가까운 라인까지의 거리로 만들기

```c++
float subLineDistance =
  abs(frac(dist / distanceBetweenSubLines + 0.5) - 0.5) * distanceBetweenSubLines;
```

---

- subLines mask 만들고 최종 그리기

```c++
float subLines = smoothstep(
  _SubLineThickness - distanceChange,
  _SubLineThickness + distanceChange,
  subLineDistance
);

return col * majorLines * subLines;
```

- majorLines가 0인 곳(굵은 라인)은 어차피 전체가 0이어서 굵은 라인이 유지
- majorLines가 1인 영역에서도 subLines가 0인 지점이 생겨 얇은 라인이 찍힘

> 굵은 라인 + 얇은 라인이 동시에 나타남