---
layout: default
title: "Custom Lighting Models"
parent: "Unreal Engine 5"
nav_order: 10
has_children: true
---

# Custom Lighting Models
커스텀 조명 모델 만들어보기

---

## 기존 쉐이더 파이프라인의 한계와 커스텀 조명의 정의
1. **일반적인 쉐이더의 역할 (표면 속성)**
    - Base Color, Normal, Metallic, Ambient Occlusion, Smoothness 등의 '머티리얼(재질) 속성'만을 계산
    - 엔진의 마스터 스택으로 넘김
2. **엔진의 역할 (조명 연산)**
    - 전달받은 표면 데이터를 바탕으로, 스페큘러 하이라이트(Specular highlight), 반사(Reflections), 전역 조명(GI) 등
    - 실제 '조명(Lighting)'을 엔진 내부(Under the hood)에서 계산

---

## 커스텀 조명 모델을 구축해야 하는 이유
### 1. 퍼포먼스 최적화
  - 최신 엔진의 PBR 조명은 극도로 사실적인 결과를 내기 위해 복잡하고 무거운 수학적 연산을 수행
  - 모바일이나 저사양 PC를 타겟으로 할 경우, 복잡한 빛 연산 로직 중 **일부를 의도적으로 누락시키거나 근사치(Approximation)로 단순화하여 연산 비용(Cost)을 크게 낮출 수 있음**

### 2. 스타일화
  - 빛의 음영이 지는 구간의 임계값(Threshold)을 조작하는 등 조명 계산 공식을 변형하여 프로젝트만의 고유한 비주얼을 확립

### 3. 조명 규칙의 커스터마이징
  - 현실의 물리 법칙을 벗어난 **특수한 게임적 허용이나 기믹**이 필요할 때 사용
  - 흑백 세계에서 광원이 닿는 곳에만 색상이 렌더링
  - 플레이어의 이동 궤적에 따라 빛의 성질이 바뀌는 등의 특수 처리등

---

## 광원 분류
컴퓨터 그래픽스에서는 연산의 효율성과 수학적 모델링을 위해 빛의 성질을

- 광원(Source)
- 표면 반응(Surface Interaction)을 기준으로 4가지로 분리하여 처리한다


![](/images/CustomLighting-category.png){: width="80%" height="80%"}

---

## Incoming (입사광)
- 빛이 표면에 도달하기까지의 방향성
- 빛이 표면에 닿기 직전, 어떤 경로와 방향을 가지고 들어오는가?

---

1. **Direct (직접광)**
    - 광원(Light Source)으로부터 표면으로 **직접, 단일 방향(Single Direction)**으로 쏟아짐
    - 계산해야 할 빛의 벡터(방향)가 명확하고 한정되어 있어 연산이 저비용

2. **Indirect (간접광)**
    - 광원에서 출발한 빛이 환경의 다른 표면들에 부딪혀 이리저리 튕겨 다니며(Bouncing) 환경광(Ambient)이 된 후
    - **모든 방향(All Directions)**에서 타겟 표면으로 들어옴
    - 사방에서 들어오는 수많은 빛의 벡터를 모두 추적하고 합산해야 하므로, 실시간 그래픽스에서는 **가장 무겁고 복잡한 연산 과정을 요구**

---

## Outgoing (출사광 / 표면 반응)
- 표면에 닿은 후 산란 방식
- 들어온 빛(Incoming)이 표면의 재질 특성과 만나 어떤 방향으로 튕겨 나가는가?

---

1. **Diffuse (난반사)**
    - 표면에 닿은 빛이 거친 미세 표면에 의해 여러 갈래로 부서지며 **사방으로 고르게 산란(Scattered in all directions)**되어 나감
    - 카메라(관찰자)의 위치에 크게 구애받지 않고, 표면 전반에 걸쳐 넓고 부드러운 형태의 기본 색상과 명암을 형성

2. **Specular (정반사)**
    - 빛이 산란되지 않고 **하나의 주된 초점 방향(One main focus direction)**으로 튕겨 나감
    - 카메라(관찰자)의 위치와 빛이 반사되는 각도가 일치할 때만 강하게 보이며, 표면에 맺히는 밝고 좁은 하이라이트 형성

---

# 네 가지 빛 타입

![](/images/CustomLighting-fourLight.png){: width="60%" height="60%"}

위의 논리를 바탕으로, 그래픽스 엔진은 최종 픽셀의 색상을 결정하기 위해
- 들어오는 빛의 종류 (2가지) 와
- 나가는 빛의 성질 (2가지) 을 교차 조합하여 4가지 주요 연산을 수행

---

## Direct Diffuse

![](/images/CustomLighting_directiDiffuse.png){: width="80%" height="80%"}

- 직접 들어온 빛(단일 방향)이 사방으로 산란됨
- 모델의 기본적인 밝은 면과 어두운 그림자 면 (형태감)

---

## Direct Specular

![](/images/CustomLighting_directispecular.png){: width="80%" height="80%"}

- 직접 들어온 빛(단일 방향)이 한 방향으로 정반사됨
- 광원의 형태가 표면에 맺히는 하이라이트 점

---

## Indirect Diffuse

![](/images/CustomLighting_indirectidiffuse.png){: width="80%" height="80%"}

- 사방에서 들어온 빛이 다시 사방으로 산란됨
- 직접광이 닿지 않는 그림자 영역의 은은한 밝기와 색 번짐(Color Bleeding)

---

## Indirect Specular

![](/images/CustomLighting_indirectspecular.png){: width="80%" height="80%"}

- 사방에서 들어온 빛이 한 방향으로 정반사됨
- 표면에 주변 환경 전체가 거울처럼 비치는 현상 (Reflections)

---

![](/images/CustomLighting-allLighting.png){: width="40%" height="40%"}

네 가지가 모두 합쳐진 렌더링 화면