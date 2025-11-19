---
layout: default
title: "Ninate"
parent: "Rendering pipeline"
nav_order: 2
---

# Nanite

- [How does Unreal Engine 5's Nanite work?](https://gamedev.stackexchange.com/questions/198454/how-does-unreal-engine-5s-nanite-work)
- [Nanite - Inside Unreal](https://youtu.be/TMorJX3Nj6U?feature=shared)

---

# LOD
**카메라와 객체 간의 거리에 따라 기하학적 정밀도를 이산적(Discrete)으로 조절**하는 **Level of Detail**, 이하 LOD 시스템

- [UE - Creating and Using LODs](https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-and-using-lods-in-unreal-engine)
- [LODs](https://www.artstation.com/blogs/samslover/QwNE/ue4-optimization-performance-pt2-lods)

---

```
현재 언리얼 엔진 생태계 내에서 공존하고 있는 두 가지 핵심 기하학 처리 기술은 두 가지다

1. 전통적인 LOD 시스템
2. 나나이트 시스템
```

두 시스템은 목적·구조·처리 단위가 크게 다르며, 실무에서는 상황에 따라 혼합해 사용

# Level of Detail
전통적인 LOD 시스템

## LOD 개념 
1. 단일 에셋에 대해 **폴리곤 밀도가 서로 다른 여러 단계의 메쉬(LOD 0, LOD 1,..., LOD n)를 미리 생성**
2. **모든 LOD 메쉬는 메모리에 상주한 상태에서, 카메라 조건에 따라 통째로 스왑**된다

---

## LOD 전환 기준 (Screen Size 기반)
언리얼 엔진은 객체의 **바운딩 스피어가 화면 투영 상에서 차지하는 정규화된 크기(Screen Size)**를 기준으로 LOD를 선택

```
LOD 선택 = ScreenSize(투영 반지름) vs LOD 임계값 비교
```

- **Screen Size** = 객체가 화면 수직 높이를 얼마나 차지하는가
    - 1.0: 화면 세로를 가득 채움
    - 0.1: 화면의 10%
- 매 프레임 **카메라 파라미터(FOV, 거리), 해상도 등을 고려하여 계산**
- LODSettings의 **Threshold(임계점)를 기준으로 가장 적절한 LOD 인덱스를 선택**

### 객체의 화면 크기 값 결정 요소
1. 바운딩 스피어 반지름
2. 카메라와의 실제 거리
3. 카메라 FOV
4. 화면 해상도(정규화 연산으로 간접 반영)

---

# Nanite
Nanite는 **기하학 데이터를 텍스처 스트리밍처럼 페이징**하고, **화면당 필요한 만큼만 로딩·셰이딩하는 가상화 렌더링 기술**

> 나나이트의 목표: 화면에 보이는 픽셀 수만큼만 연산 비용을 지불하자

- [UE - 나노기술 가상화 기하학 개요](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-virtualized-geometry-in-unreal-engine)
- [Nanite - a Deep Dive](https://advances.realtimerendering.com/s2021/Karis_Nanite_SIGGRAPH_Advances_2021_final.pdf)

---

## Nanite 핵심 데이터 구조
나나이트의 핵심은 **메쉬를 통째로 그리는 것이 아니라, 클러스터(Cluster) 단위로 쪼개서 관리하는 것**

1. **클러스터링 (Clustering)**
   - Nanite는 메쉬를 약 64~128 삼각형 규모의 클러스터(Cluster) 단위로 자동 분할
   - 메쉬의 곡률 · 분포 · 밀도에 따라 클러스터 크기가 최적화
   - 이 클러스터는 렌더링 단위이자 스트리밍 단위
2. **계층 구조 (Cluster Hierarchy) - DAG**
    - 전통 LOD는 “메쉬 전체”를 교체하지만 Nanite는 클러스터 단위로 LOD를 결정
    - Nanite 계층 구조는 트리(Tree)가 아닌 DAG(Directed Acyclic Graph) 기반
        - 목적 : 클러스터 간 중복 지오메트리 재사용
        - 압축 효율 및 페이지 스트리밍 효율 향상
        - LOD 간 중복 최소화

> Nanite는 메쉬 단일 객체의 LOD 문제를 해결
> - HLOD는 수십~수백 개 객체를 묶어 거리 기반/스트리밍 기반 최적화

---

## Visibility Buffer
Nanite는 G-Buffer 패스를 직접 만들지 않고, 먼저 **Visibility Buffer(VisBuffer)를 생성**


### VisBuffer에는 다음 정보가 64bit로 압축되어 기록
- Mesh ID
- Cluster ID
- Triangle ID
- Depth

```
화면의 각 픽셀에 대해 “어떤 메쉬·클러스터·삼각형이 보이는가?” 만 기록
```

이후 Material Table Lookup → Shading 단계에서 최종적으로 **화면에 기여하는 픽셀만 머티리얼 셰이딩을 수행하므로 Overdraw 비용이 크게 감소**

---

## Hybrid Rasterization
Nanite는 래스터 단계에서 **클러스터의 투영 크기(Screen-space area)**에 따라 두 가지 경로를 동적으로 선택

1. **작은 삼각형(Micropoly)을 그릴 때** : Compute Raster / Software Raster
   - 예 : **1픽셀**의 작은 삼각형
   - Compute Shader 기반 소프트웨어 래스터가 대체 수행
2. **일반 삼각형 처리** : GPU 하드웨어 래스터
    - 화면에서 충분한 면적을 차지하는 삼각형은 기존 GPU 파이프라인 래스터라이저 사용

### 이렇게 구분해서 사용하는 이유?
GPU 하드웨어는 **2x2 픽셀 쿼드(Quad) 단위로 처리하도록 설계**

- 삼각형이 1픽셀이라면, 유효한 픽셀은 1개인데 4개를 처리해야 하므로 효율이 25% 이하로 떨어짐
- 따라서 클러스터의 투영 크기(Screen-space area)가 작으면 Compute Shader가 계산 

---

## nanite 를 사용할 때 주의할 점 (UE 5.5 기준)
1. **머티리얼 지원**
    - Masked(Clip) 재질은 대부분 Nanite 지원
    - Translucent(반투명) 재질은 Nanite 미지원
      - → Glass, Hologram, Water 등은 기존 LOD Static Mesh 필요
    - Dithered Transparency도 제한적 지원
2. **Foliage 단순화**
    - 잎사귀 카드처럼 서로 떨어진 섬 형태의 기하는 단순화 과정에서 잘 병합되지 않아 Nanite 효율이 낮음
3. **빽빽한 숲/잔디의 성능**
    - 멀리 있는 대량 Grass, 매우 저비용 폴리지 → 전통 LOD가 유리
    - 근거리 고품질 Foliage → Nanite가 종종 성능 우위
4. **VSM(가상 섀도우 맵)**
    - 언리얼은 `Nanite + Lumen + VSM` 조합을 기본 렌더링 파이프라인으로 삼고있다
    - Nanite는 VSM이 절대 필수는 아니지만 VSM 사용이 일반적
    - 가상 섀도우 맵은 **16k 해상도**의 텍스처 페이지를 관리하며 **높은 메모리와 연산 비용을 요구**
5. **Skeletal Mesh 미지원**
    - UE 5.5 기준, Nanite는 Skeletal Mesh 또는 대규모 변형(Deformation)이 있는 Mesh는 미지원
    - 단, Static Pose로 베이크된 Mesh는 Nanite로 변환 가능
6. **WPO(World Position Offset) 지원 범위**
    - UE 5.3 이후 부분적 WPO 지원
    - 대규모 변위·변형은 불가
    - Foliage 흔들림 등 “소규모 변형”은 가능하지만 제약 존재
