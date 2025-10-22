---
layout: default
title: "Light Mobility"
parent: "Dynamic Sky"
nav_order: 0
---

# Light Mobility
실시간 기능에 영향을 미치는 조명 설정

3가지 유형이 있음

- Static
- Stationary
- Movable

**📌보면 한번에 이해되는 유튜브 링크**
- [Learn Unreal Engine 4 - Light Mobility](https://youtu.be/b_oVCl6QlZ0?si=Kluc8V8zKS9PcTCc)

---

## Static (정적)
1. 베이크된 라이트맵에만 기여
2. 런타임 중에 변경 불가능
3. Static은 라이트맵을 굽기 때문에 빌드 시간이 존재
4. 런타임 성능 비용이 가장 낮음

> 라이트를 움직이거나 변경할 수 없음

**사용 사례**

```
레벨에서 절대 움직이지 않는 라이트

건물 외부 조명, 간접 조명

모바일 플랫폼이나 성능이 중요한 상황
```

---

## Stationary (고정)
1. 정적 오브젝트에 대해서는 라이트맵으로 베이크되고, 동적 오브젝트는 실시간 그림자를 계산
2. 색상과 강도는 런타임 중에 변경 가능
3. 위치, 회전, 영향 반경 변경 불가

> 한정된 수의 Stationary 라이트만 사용 가능

---

## Movable (이동 가능)
1. 완전한 실시간 라이트
2. 모든 파라미터 런타임 중 변경 가능
3. 빌드 시간 필요 없음
4. 가장 높은 런타임 성능 비용

> 완전한 동적 제어 가능

**사용 사례**
```
플레이어가 들고 다니는 횃불

움직이는 차량 헤드라이트

특수 효과용 동적 조명

시간에 따라 변화하는 조명
```

---

## 정리

기준	| Static	| Stationary	| Movable| 
성능	| 최고	| 중간	| 낮음 | 
유연성	| 최저	| 중간	| 최고 | 
빌드 시간	| 많음	| 중간 | 없음 | 
동적 오브젝트	|  불가	| 가능	| 가능 | 


1. **성능 최적화**: 가능한 많은 라이트를 Static으로 설정
2. **동적 요소**: 움직여야 하는 라이트만 Movable 사용
3. **균형 잡기**: 대부분의 경우 Stationary가 좋은 절충안
4. **Lumen 사용 시**: Movable 라이트가 Lumen과 가장 잘 호환됨

---

## light Map
라이트맵 베이킹은 언리얼 엔진 내부에서 하는것이 효율적

**링크**
- [Learn Unreal Engine 4 - Light Baking](https://youtu.be/fB2X_39aXUU?si=otttNyhmMMaCTkc1)
- [UE - Understanding Lightmapping](https://dev.epicgames.com/documentation/en-us/unreal-engine/understanding-lightmapping-in-unreal-engine?application_version=5.5#creatingalightmap)

1. **자동 UV 생성**
    - 언리얼이 라이트맵용 2nd UV 채널 자동 생성
    - 겹침, 늘림 없이 최적화된 UV 레이아웃
2. **실시간 프리뷰**
    - 베이크 중 실시간으로 결과 확인 가능
    - 라이트맵 density 시각화 도구 제공
3. **통합된 라이팅 시스템**
    - 언리얼의 모든 라이트 소스(Directional, Point, Spot, Sky Light 등)가 통합되어 계산
    - 언리얼 머티리얼과의 완벽한 호환성
    - 포스트 프로세스 효과(블룸, 익스포저 등) 반영

## light Map data
언리얼이 **라이트맵 데이터를 자동으로 관리하며 스태틱 메시 임포트 시 자동 생성됨**

```
1. 소스 메시 → 2. 라이트맵 UV 생성 → 3. Lightmass 베이크 → 4. DerivedDataCache 저장 → 5. 맵 파일에 참조
```

### 저장 위치

```
[프로젝트폴더]/DerivedDataCache/
```

- 실제 라이트맵 데이터는 이 폴더에 바이너리 형태로 저장됨
- 캐시 시스템이므로 직접 편집하지 않음

> DerivedDataCache는 엔진 빌드 캐시 위치일 뿐 최종 빌드에서는 `.uasset` 내부에 포함되어 패키징 됨

### 라이트 맵 저장 경로

```
[프로젝트폴더]/Saved/
├── Bakelets/
├── Builds/
├── Maps/
└── Lightmass/
```

- 라이트맵 베이킹 설정과 결과 메타데이터 저장
- 특정 맵의 라이트맵 정보는 해당 맵 파일 내부에 저장

### 라이트맵 해상도 확인

```
스태틱 메시 선택 → Details 패널 → Lighting
```

- "Overridden Light Map Resolution" 설정에서 확인

---

## Lightmass
라이트맵 베이킹 시스템은 CPU 기반으로 굽냐, GPU 기반으로 굽냐 나눠짐

```
Lightmass(GPU/CPU)는 Static Lightmap 베이킹 시에만 동작
```

- Static 또는 Stationary 라이트가 있을 때 Build 메뉴 → Build Lighting Only 실행 시 Lightmass가 동작
- 이때 GPU Lightmass 플러그인 활성화 여부에 따라 CPU Lightmass 또는 GPU Lightmass가 선택

### GPU Lightmass 사용 조건
1. Edit → Plugins에서 GPU Lightmass 플러그인 활성화
2. Editor 재시작
3. World Settings → Lightmass Settings 항목이 활성화됨
4. Static Light 또는 Stationary Light를 배치하고 Build Lighting Only 실행 시 GPU로 빌드 진행

- 플러그인을 켜지 않으면 기본적으로 CPU Lightmass가 백그라운드에서 동작
