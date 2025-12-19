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

- 원을 오른쪽으로 3만큼 옮기고 싶다 = 공간 차제를 왼쪽으로 3만큼 당긴다

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

- **회전 후 이동 : 전체 화면 중심을 기준으로 객체 회전**
- 이동 벡터 자체가 회전에 휘말리므 화면 원점 기준으로 빙글빙글 도는 결과

```c++
float scene(float2 position) {
    float2 circlePosition = position;
    circlePosition = rotate(circlePosition, _Time.y); // 전체 화면 중심을 기준으로 객체 회전
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
    circlePosition = translate(circlePosition, float2(2, 0)); // 전체 화면 중심 이동
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


