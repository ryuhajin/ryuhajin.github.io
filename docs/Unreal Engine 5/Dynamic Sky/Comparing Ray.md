---
layout: default
title: "Comparing Ray"
parent: "Dynamic Sky"
nav_order: 2
---

# 레이 트레이싱 vs 레이 마칭(표면 SDF) vs 레이 마칭(볼륨)

## 1. 개요

이 문서에서 비교하는 세 방법은 모두 카메라에서 픽셀 방향으로 광선을 만들고, 그 광선이 지나가는 경로를 조사한다는 공통점이 있다.

카메라에서 픽셀 방향으로 쏘는 **1차 광선(primary ray)** 은 보통 아래 광선 방정식으로 표현한다.

---

```text
P(t) = O + tD
```

| 기호 | 의미 |
|---|---|
| `O` | 광선의 시작점(ray origin). 1차 광선에서는 보통 카메라 위치 |
| `D` | 광선 방향(ray direction) |
| `t` | 광선 위를 얼마나 이동했는지 나타내는 파라미터 |
| `P(t)` | 시작점에서 `t`만큼 이동한 광선 위의 위치 |

---

```hlsl
float3 ro = CameraPos;
float3 rd = normalize(GetRayDir(uv));
```

> `rd`를 정규화하면 `t`를 월드 공간 거리로 해석하기 쉬워진다.

단, `O = CameraPos`는 1차 광선 기준이다. 그림자·반사·굴절 같은 **2차 광선(secondary ray)** 은 보통 표면의 hit 지점에서 다시 출발한다.

```text
그림자 광선 시작점 = hitPoint + normal * T_MIN
반사 광선 시작점   = hitPoint + reflectedDir * T_MIN
굴절 광선 시작점   = hitPoint - normal * T_MIN   // 진행 방향에 따라 조정
```

`T_MIN`은 새 광선이 자기 자신이 출발한 표면을 다시 맞는 self-intersection 문제를 줄이기 위한 작은 오프셋

---

## 2. 용어 구분하기

---

### Ray Casting과 Ray Tracing의 차이

둘 다 광선을 쏘아 표면과의 교차를 찾지만, 보통은 **교차 뒤에 광선을 더 쏘는가**가 핵심 차이

| 용어 | 핵심 목적 | 광선 흐름 | 일반적인 결과 |
|---|---|---|---|
| **Ray Casting** | 카메라에서 보이는 첫 표면 찾기 | 카메라 → 가장 가까운 hit | 가시성, 깊이, 간단한 직접광 조명 |
| **Ray Tracing** | 빛의 경로를 더 추적해 조명 현상 계산 | 카메라 → hit → 그림자/반사/굴절 등의 2차 광선 | 그림자, 반사, 굴절, 간접광 등 |

### Ray Casting
Ray casting은 픽셀마다 카메라 광선을 하나 쏘고, 그 광선이 **처음 만나는 표면을 찾는 데 초점**을 둔다.

```text
카메라 → 가장 가까운 표면 hit → 해당 표면의 색 계산
```

예를 들어 화면에 보이는 물체, 깊이값, 단순 Lambert 조명을 계산하는 경우가 여기에 가깝다.

---

### Ray Tracing

Ray tracing은 **1차 광선이 표면에 닿은 뒤에도 필요한 광선을 추가**로 만든다.

```text
카메라 광선
  → 표면 hit
      → 광원 방향 그림자 광선
      → 반사 방향 반사 광선
      → 굴절 방향 굴절 광선
      → 필요하면 그 광선들도 다시 교차 검사
```

- 예를 들어 거울 반사는 반사 방향으로 광선을 한 번 더 쏘아 그 방향에서 보이는 색을 가져옴
- 유리는 굴절 방향 광선을 추가로 쏨
- 그림자는 hit 지점에서 광원 방향으로 광선을 보내 중간에 가로막는 물체가 있는지 검사

> 실무와 문헌에서 용어 경계가 항상 엄격하게 쓰이지는 않음

> 그러나 학습 단계에서는 **Ray casting = 주로 1차 광선의 첫 교차**, **Ray tracing = 2차 광선까지 추적하는 상위 렌더링 방식**으로 구분하면 이해하기 좋음

---

## 3. 교차 방법
아래 방식들은 **광선이 표면 또는 볼륨과 만나는 지점을 어떻게 찾거나 적분하는가**에 대한 것이다

---

1. **해석적 표면 교차(analytic ray–primitive intersection)**
   - 구·평면·삼각형 같은 기하 표면과의 교차 거리 `t`를 수식이나 교차 알고리즘으로 구한다.
2. **표면 레이마칭(surface ray marching / sphere tracing)**
   - SDF가 알려주는 표면까지의 거리만큼 광선을 반복해서 전진시킨다.
3. **볼륨 레이마칭(volumetric ray marching)**
   - 밀도장(density field)을 일정 간격으로 샘플링하며 산란광과 투과율을 누적한다.

---

따라서 하나의 렌더러 안에서 다음을 함께 사용할 수 있다.

```text
표면 메시: BVH + 삼각형 해석적 교차
절차적 SDF 오브젝트: Sphere Tracing
구름·안개: Volumetric Ray Marching
반사·그림자: 위 교차 방법을 사용한 2차 광선 추적
```

---

## 세 구현 방식의 핵심 차이
이 문서에서는 다음 세 가지 구현 방식을 비교한다.

1. **해석적 표면 교차**
  - "광선이 표면과 만나는 교차거리 t를 직접 푼다."
2. **표면 SDF 레이마칭**
    - "현재 위치에서 표면까지 남은 거리만큼 점프한다."
3. **볼륨 레이마칭**
    - "볼륨 내부를 작은 간격으로 걸으며 빛을 계속 누적한다."

---

## 4. Ray Casting / Ray Tracing의 표면 교차 흐름

### 4-1. 해석적 표면 교차란?

구·평면·삼각형처럼 **명확한 기하 표면은 광선과의 교차를 수식 또는 알고리즘으로 계산**할 수 있다.

- 구: 2차 방정식
- 평면: 선형 방정식
- 삼각형: Möller–Trumbore 같은 교차 알고리즘
- 실제 메시 장면: BVH 같은 가속 구조를 순회하며 후보 삼각형만 검사

개별 구와의 교차는 반복문 없이 계산할 수 있지만, 실제 메시 장면은 BVH 순회와 여러 삼각형 검사 때문에 반복 과정이 포함된다.

### 4-2. Ray Casting 흐름

```text
1. 픽셀마다 카메라 광선 생성
   ro = CameraPos
   rd = normalize(GetRayDir(uv))

2. 장면의 후보 물체 탐색
   - 단순 예제: 구, 평면, 삼각형을 직접 검사
   - 실제 메시 장면: BVH 순회

3. 각 후보와의 교차 거리 t 계산

4. 양수인 t 중 가장 작은 값 선택
   - 카메라 앞쪽에서 가장 가까운 표면

5. hitPoint 계산
   hitPoint = ro + rd * tHit

6. 법선·UV·재질 정보 계산

7. 직접광 기반의 표면 조명 계산

8. 최종 픽셀 색 출력
```

### 4-3. Ray Tracing에서 추가되는 단계

Ray tracing은 위의 7번 이후에 필요한 2차 광선을 더 만든다.

```text
표면 hit
  ├─ 그림자 광선: 광원 방향에 차단 물체가 있는지 검사
  ├─ 반사 광선: 반사 방향에서 보이는 색을 가져옴
  ├─ 굴절 광선: 굴절 방향에서 보이는 색을 가져옴
  └─ 간접광 광선: 다른 표면에서 들어오는 빛을 샘플링
```

재귀 또는 반복 깊이에는 보통 제한을 둔다.

```text
if (rayDepth >= MAX_RAY_DEPTH)
    추가 광선 추적 중단
```

---

## 5. 해석적 구 교차 HLSL 예제

아래 함수는 정규화되지 않은 `rayDir`도 처리할 수 있도록 일반형 2차식으로 작성했다.

```hlsl
bool RayIntersectSphere(
    float3 rayOrigin,
    float3 rayDir,
    float3 sphereCenter,
    float sphereRadius,
    out float tHit,
    out float3 hitPoint)
{
    const float T_MIN = 1e-4;

    float3 oc = rayOrigin - sphereCenter;

    // a * t^2 + 2 * halfB * t + c = 0
    float a = dot(rayDir, rayDir);
    float halfB = dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;

    float discriminant = halfB * halfB - a * c;

    if (discriminant < 0.0)
        return false;

    float sqrtD = sqrt(discriminant);

    // 가까운 교차점을 우선 선택
    float t0 = (-halfB - sqrtD) / a;
    float t1 = (-halfB + sqrtD) / a;

    tHit = (t0 > T_MIN) ? t0 : t1;

    if (tHit <= T_MIN)
        return false;

    hitPoint = rayOrigin + rayDir * tHit;
    return true;
}
```

---

### 사용 예시: Ray Casting

```hlsl
float3 ro = CameraPos;
float3 rd = normalize(GetRayDir(uv));

float tHit;
float3 hitPoint;

if (RayIntersectSphere(ro, rd, sphereCenter, radius, tHit, hitPoint))
{
    float3 normal = normalize(hitPoint - sphereCenter);
    float3 color = CalculateDirectLighting(hitPoint, normal);
    return float4(color, 1.0);
}

return float4(BackgroundColor, 1.0);
```

---

### 사용 예시: 그림자 광선

```hlsl
bool IsInShadow(float3 hitPoint, float3 normal, float3 lightDir, float lightDistance)
{
    const float T_MIN = 1e-4;

    float3 shadowOrigin = hitPoint + normal * T_MIN;
    float shadowT;
    float3 shadowHit;

    bool blocked = RayIntersectSphere(
        shadowOrigin,
        lightDir,
        sphereCenter,
        radius,
        shadowT,
        shadowHit);

    // 점 광원이라면 광원보다 앞에서 막혔는지도 확인해야 한다.
    return blocked && shadowT < lightDistance;
}
```

---

## 6. 표면 레이마칭: SDF / Sphere Tracing

### 6-1. SDF란?

SDF(Signed Distance Field)는 임의의 위치 `p`에서 표면까지의 거리를 반환하는 함수다. 부호는 위치가 물체의 안쪽인지 바깥쪽인지도 나타낸다.

| SDF 값 | 의미 |
|---|---|
| `SDF(p) > 0` | 물체 바깥 |
| `SDF(p) = 0` | 표면 |
| `SDF(p) < 0` | 물체 내부 |

예를 들어 반지름 `r`인 구의 SDF는 아래와 같다.

```text
SDF(p) = length(p - center) - radius
```

---

### 6-2. Sphere Tracing의 핵심

현재 위치에서 SDF를 샘플링해 얻은 **표면까지의 거리**만큼 광선을 전진시킨다.

```text
pos = ro + rd * t
dist = SceneSDF(pos)
t += abs(dist)
```

SceneSDF가 실제 거리 함수이거나 실제 거리보다 크게 나오지 않는 보수적인 distance estimator라면, 이 방식은 표면을 건너뛰지 않고 큰 빈 공간을 빠르게 건너갈 수 있다.

> 시작점이 물체 바깥이라는 전제에서는 보통 `t += dist`를 사용한다. 카메라가 물체 내부에 있을 수 있는 일반적인 예제에서는 음수 SDF 때문에 뒤로 이동하지 않도록 `abs(dist)` 또는 별도의 내부 처리 규칙을 둔다.

---

### 6-3. 흐름

```text
1. 픽셀마다 카메라 광선 생성
   ro = CameraPos
   rd = normalize(GetRayDir(uv))

2. 광선 이동 거리 초기화
   t = 0

3. 현재 광선 위치 계산
   pos = ro + rd * t

4. SDF 샘플링
   sdf = SceneSDF(pos)
   distanceToSurface = abs(sdf)

5. 표면 근처인지 검사
   distanceToSurface < SURFACE_EPSILON
   → 표면 hit

6. 표면이 아니라면 거리만큼 전진
   t += distanceToSurface

7. 최대 거리 또는 최대 스텝 초과 시 미교차 처리

8. hit한 경우 SDF gradient로 법선 근사

9. 재질·조명 계산 후 최종 픽셀 색 출력
```

### 6-4. HLSL 예제

```hlsl
static const int   MAX_STEPS       = 128;
static const float MAX_DISTANCE    = 100.0;
static const float SURFACE_EPSILON = 1e-3;
static const float NORMAL_EPSILON  = 1e-3;

// 간단한 구 SDF: 중심 (0, 2, 0), 반지름 1
float SceneSDF(float3 p)
{
    return length(p - float3(0.0, 2.0, 0.0)) - 1.0;
}

float3 EstimateNormal(float3 p)
{
    float e = NORMAL_EPSILON;

    float dx = SceneSDF(p + float3(e, 0.0, 0.0)) - SceneSDF(p - float3(e, 0.0, 0.0));
    float dy = SceneSDF(p + float3(0.0, e, 0.0)) - SceneSDF(p - float3(0.0, e, 0.0));
    float dz = SceneSDF(p + float3(0.0, 0.0, e)) - SceneSDF(p - float3(0.0, 0.0, e));

    return normalize(float3(dx, dy, dz));
}

float3 RayMarchSurface(float3 ro, float3 rd)
{
    float t = 0.0;

    [loop]
    for (int i = 0; i < MAX_STEPS; ++i)
    {
        float3 pos = ro + rd * t;
        float sdf = SceneSDF(pos);
        float distanceToSurface = abs(sdf);

        if (distanceToSurface < SURFACE_EPSILON)
        {
            float3 normal = EstimateNormal(pos);
            return CalculateDirectLighting(pos, normal);
        }

        t += distanceToSurface;

        if (t > MAX_DISTANCE)
            break;
    }

    return BackgroundColor;
}
```

### 6-5. 특징과 주의점

1. 광선이 표면에 닿을 때까지 매 스텝 `SceneSDF`를 호출한다.
2. 빈 공간에서는 SDF 거리만큼 크게 이동할 수 있다.
3. 구, 박스, CSG, 반복 구조, 변형된 절차적 형상, 프랙탈 등을 함수로 표현하기 좋다.
4. SDF가 실제 거리보다 크게 나오는 경우 표면을 건너뛸 수 있으므로, distance estimator의 정확도와 safety factor가 중요하다.
5. `SURFACE_EPSILON`과 `NORMAL_EPSILON`은 역할이 다르므로 분리하는 편이 좋다.

---

## 7. 볼륨 레이마칭: Volumetric Ray Marching

### 7-1. 개념

볼륨 레이마칭은 구름·안개·연기처럼 **명확한 표면 대신 공간 전체에 퍼진 매질(participating media)을 렌더링하는 방식**이다.

```md
- `density(p)`: 위치 `p`에 매질이 얼마나 있는지
- 산란(scattering): 빛이 매질에 부딪혀 카메라 방향으로 들어오는 현상
- 흡수(absorption): 빛 에너지가 매질에 의해 줄어드는 현상
- 소멸(extinction): 산란과 흡수를 합쳐 광선이 약해지는 정도
- 투과율(transmittance): 광선이 매질을 지나도 남아 있는 비율
```

> 볼륨에는 일반적으로 표면 hit가 없다. 따라서 광선은 볼륨 경계에 진입한 뒤 이탈할 때까지 일정한 간격으로 진행하며 빛을 누적한다.

---

### 7-2. Bounding Volume과 Density의 역할

볼륨 렌더링에서는 두 개념을 구분해야 한다.

1. **Bounding volume**
   - AABB, 구, 박스 등으로 레이마칭할 구간 `[tNear, tFar]`를 제한한다.
2. **Density field**
   - 그 구간 안의 각 위치에 실제 매질이 얼마나 있는지 정한다.

즉, bounding volume 내부라도 `density = 0`이면 그 위치는 빈 공간처럼 처리된다.

---

### 7-3. Beer–Lambert 법칙과 광학 두께

한 스텝에서 빛이 얼마나 줄어드는지는 광학 두께(optical depth)로 표현할 수 있다.

```hlsl
float opticalDepth = density * sigmaT * stepSize;
float stepTransmittance = exp(-opticalDepth);
```

| 변수 | 의미 |
|---|---|
| `density` | 현재 샘플 위치의 매질 양 |
| `sigmaA` | 흡수 계수(absorption coefficient) |
| `sigmaS` | 산란 계수(scattering coefficient) |
| `sigmaT` | 소멸 계수(extinction coefficient), 보통 `sigmaA + sigmaS` |
| `stepSize` | 한 번의 레이마칭에서 이동한 거리 |
| `opticalDepth` | 해당 스텝에서 빛이 약해지는 총량 |
| `stepTransmittance` | 해당 스텝을 통과한 뒤 남는 빛의 비율 |

```text
density 증가
또는 sigmaT 증가
또는 stepSize 증가
    ↓
opticalDepth 증가
    ↓
transmittance 감소
    ↓
배경은 덜 보이고 볼륨의 존재감은 강해짐
```

> `density`의 절대 범위는 엔진마다 다르다. 화면 결과는 `density`, `sigmaT`, `stepSize`가 함께 만드는 광학 두께로 판단해야 한다.

---

### 7-4. 산란광에 필요한 요소

실제 구름 조명에서는 보통 아래 값들을 함께 고려한다.

```text
카메라까지의 투과율
× 현재 위치의 밀도
× 산란 계수 sigmaS
× 광원에서 들어오는 빛
× 광원에서 샘플까지의 투과율
× phase function
× stepSize
```

- **phase function**: 빛이 어떤 방향으로 산란되기 쉬운지를 나타낸다.
- 구름은 전방 산란이 강한 경우가 많아서, 태양 방향을 바라볼 때 더 밝거나 은색 테두리가 나타날 수 있다.
- 광원에서 현재 샘플까지의 투과율은 별도의 light ray marching으로 근사하는 경우가 많다.

---

### 7-5. 흐름

```text
1. 픽셀마다 카메라 광선 생성
   ro = CameraPos
   rd = normalize(GetRayDir(uv))

2. 광선과 bounding volume의 교차 구간 계산
   tNear: 볼륨 진입 거리
   tFar : 볼륨 이탈 거리

3. 볼륨과 교차하지 않으면 배경 또는 기존 씬 색 반환

4. 실제 시작과 종료 거리 설정
   tStart = max(tNear, 0)
   tEnd   = tFar
   - 카메라가 볼륨 내부에 있을 수 있기 때문
   - 씬의 불투명 물체 깊이가 있다면 tEnd를 그 깊이보다 앞에서 자를 수 있음

5. [tStart, tEnd]를 여러 스텝으로 분할

6. 각 스텝의 중앙에서 밀도 샘플링

7. 산란광 누적 및 Beer–Lambert 법칙으로 투과율 감소

8. 투과율이 매우 작아지면 early termination

9. 최종 합성
   finalColor = scatteredLight + backgroundColor * transmittance
```

---

### 7-6. HLSL 예제

아래 코드는 학습용 단순화 예제다. `GetLightTransmittanceToLight`는 광원 방향으로 추가 레이마칭해 그림자와 self-shadowing을 근사하는 함수라고 가정

```hlsl
float SampleDensity(float3 p)
{
    float distanceFromCenter = length(p - float3(0.0, 5.0, 0.0));
    return 1.0 - smoothstep(2.4, 3.0, distanceFromCenter);
}

float PhaseIsotropic()
{
    static const float PI = 3.14159265359;

    // 등방성 산란의 단순 상수. 실제 구름은 Henyey-Greenstein 등을 자주 사용한다.
    return 1.0 / (4.0 * PI);
}

float GetLightTransmittanceToLight(float3 samplePos)
{
    // 학습용: 광원 그림자가 없다고 가정
    // 실제 구현에서는 lightDir 방향으로 짧은 추가 레이마칭을 수행할 수 있다.
    return 1.0;
}

float3 VolumetricRayMarch(
    float3 ro,
    float3 rd,
    float tStart,
    float tEnd,
    float3 backgroundColor)
{
    static const int STEP_COUNT = 64;

    float stepSize = (tEnd - tStart) / STEP_COUNT;

    float sigmaA = 0.10;
    float sigmaS = 0.20;
    float sigmaT = sigmaA + sigmaS;

    float transmittance = 1.0;
    float3 scatteredLight = 0.0;

    [loop]
    for (int i = 0; i < STEP_COUNT; ++i)
    {
        // 중앙 샘플링: 스텝 경계에서 바로 샘플링하는 편향을 줄인다.
        float sampleT = tStart + (i + 0.5) * stepSize;
        float3 samplePos = ro + rd * sampleT;

        float density = max(SampleDensity(samplePos), 0.0);

        if (density > 0.0)
        {
            float extinction = density * sigmaT;
            float stepTransmittance = exp(-extinction * stepSize);

            float3 lightColor = float3(1.0, 0.9, 0.7);
            float lightTransmittance = GetLightTransmittanceToLight(samplePos);
            float phase = PhaseIsotropic();

            // 1차 Riemann 적분 근사
            float3 inScatter =
                density
                * sigmaS
                * lightColor
                * lightTransmittance
                * phase;

            scatteredLight += transmittance * inScatter * stepSize;
            transmittance *= stepTransmittance;
        }

        if (transmittance < 0.01)
            break;
    }

    return scatteredLight + backgroundColor * transmittance;
}
```

---

### 7-7. 특징과 최적화

1. 광선은 볼륨의 시작점에서 끝점까지 고정된 간격으로 샘플링한다.
2. `transmittance < threshold`일 때 조기 종료할 수 있다.
3. 품질과 성능은 주로 `STEP_COUNT`, `stepSize`, density noise의 품질에 영향을 받는다.
4. 대표 최적화는 blue-noise jitter, temporal reprojection, low-resolution rendering, empty-space skipping, light ray step 수 축소 등이 있다.
5. 구름이 건물이나 산 뒤에 가려져야 한다면, opaque scene depth를 광선의 `t` 단위로 복원해 `tEnd`를 제한해야 한다.

---

## 8. 공통점과 차이점 비교

| 항목 | 해석적 표면 교차 | SDF 표면 레이마칭 | 볼륨 레이마칭 |
|---|---|---|---|
| 주 대상 | 삼각형 메시, 구, 평면 등 명확한 표면 | 암시적 표면, CSG, 절차적 형상, 프랙탈 | 구름, 안개, 연기, 불꽃 등 참여 매질 |
| 장면 표현 | 삼각형, 구, 평면 등 기하 프리미티브 | Signed Distance Field | Density Field |
| 광선 방정식 | `P(t) = O + tD` | 동일 | 동일 |
| 핵심 질문 | 표면과 만나는 `t`는 얼마인가? | 표면까지 얼마나 남았는가? | 매질이 얼마나 있고 빛이 얼마나 남는가? |
| `t` 처리 | 교차 수식/알고리즘으로 계산 | `t += distanceToSurface` | `t += stepSize` |
| 반복문 | 개별 교차식은 없을 수 있으나, 실제 메시 장면은 BVH 순회와 삼각형 검사 반복이 일반적 | 일반적으로 필요 | 일반적으로 필요 |
| 종료 조건 | 가장 가까운 유효 교차점 또는 미교차 | 표면 epsilon, 최대 거리, 최대 스텝 | 볼륨 경계 이탈, 최대 스텝, 낮은 투과율 |
| 표면 법선 | 메시 법선 또는 기하 수식 | SDF gradient 근사 | 보통 표면 법선 없음 |
| 핵심 조명 | BRDF, 직접광, 그림자, 반사, 굴절 | BRDF, SDF 그림자, 반사·굴절 확장 가능 | 산란, 흡수, 감쇠, phase function, 광원 방향 투과율 |
| 대표 최적화 | BVH, TLAS/BLAS, 광선 수 제한, denoising | 최대 스텝, bounding volume, 정확한 distance estimator | early termination, blue-noise jitter, temporal reprojection, empty-space skipping |
| Ray casting과의 관계 | Ray casting의 표면 교차에 자주 사용 | Ray casting / ray tracing의 표면 교차 방법으로 사용할 수 있음 | Ray tracing 렌더러 안에서 볼륨 적분 단계로 함께 사용할 수 있음 |

---

## 9. 최종 요약

```text
Ray Casting
= 카메라 광선으로 가장 가까운 표면을 찾아 화면에 무엇이 보이는지 계산하는 방식

Ray Tracing
= 표면 hit 이후 그림자·반사·굴절 등의 추가 광선까지 추적하는 더 넓은 렌더링 방식

해석적 표면 교차
= 구·평면·삼각형 등과 만나는 t를 수식이나 교차 알고리즘으로 구하는 방법

SDF 표면 레이마칭 / Sphere Tracing
= SDF가 알려주는 표면까지의 거리만큼 점프하면서 t를 찾는 방법

볼륨 레이마칭
= 밀도장 안을 일정 간격으로 이동하면서 산란광과 투과율을 누적하는 방법
```

한 줄로 압축하면 다음과 같다.

```text
Ray casting과 ray tracing은 광선을 어떻게 활용하는가에 대한 용어이고,
해석적 교차·SDF 레이마칭·볼륨 레이마칭은 광선이 장면과 상호작용하는 방식을 계산하는 방법이다.
```

---

### 부록 : 구 교차식
---

![](/images/ray-Sphere.png)
