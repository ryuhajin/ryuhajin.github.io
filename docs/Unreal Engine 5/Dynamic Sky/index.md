---
layout: default
title: "Dynamic Sky"
parent: "Unreal Engine 5"
nav_order: 8
has_children: true
---

# Dynamic Sky

## Map vs Level
1. **Map** : 물리 파일(.umap)
  - 레벨 데이터를 저장하는 에셋 파일 자체. 지형, 액터 배치, 라이팅, 환경 정보를 포함 
  - 하나의 프로젝트에 여러 레벨(Map 파일)을 둘 수 있음 
2. **Level**
  - Map이 표현하는 플레이 공간의 개념
  - Persistent Level과 Sub Level로 계층 구조를 구성할 수 있다

### 빈 오픈월드 vs 빈 레벨맵
1. **빈 레벨맵**
    - 단일 Map 파일
    - 별도 월드 파티셔닝이나 스트리밍 없음. 소규모 맵, 프로토타입, 실내 등에 적합
2. **빈 오픈월드**
    - 월드 파티셔닝 활성화된 Map
    - World Partition, HLOD, Data Layer 등의 시스템이 기본 셋업
    - 대규모 지형, 스트리밍 월드 제작 전제

```
단순 테스트 → 빈 레벨맵

넓은 지형이나 스트리밍 설계 필요 → 빈 오픈월드
```

---

## folder path
언리얼 5에서 텍스처 팩 추가. 보통 두 가지 방법이 있는데

```
콘텐츠 브라우저를 통한 임포트 (가장 권장하는 표준 방법)

프로젝트 폴더에 직접 복사 (빠르지만 주의 필요)
```

나는 폴더에 직접 복사 하기로 함

---

### 폴더 직접 복사
1. 언리얼 프로젝트 폴더 진입
```
D:\UnrealProjects\MyProject\
```
2. Content 폴더 안에 복사.
```
D:\UnrealProjects\MyProject\Content\Textures\
```
3. 언리얼 에디터 실행 → Content Drawer(콘텐츠 브라우저) 열기
4. Content/Textures 경로에서 추가된 텍스처 확인
5. 만약 보이지 않으면 오른쪽 클릭 → “Fix Up Redirectors in Folder” 실행 후 에디터 새로고침.

> 버전이 같거나 높아야 충돌 x

### 대체 경로 (엔진 공용)
공용 리소스로 쓰려면 **엔진 폴더에 두기**

```
C:\Program Files\Epic Games\UE_5.X\Engine\Content\
```

- 이 경로는 업데이트나 버전 차이로 깨질 수 있으므로 권장하지 않음 (프로젝트 Content 폴더가 기본)

---

**링크**
- [Level] (https://dev.epicgames.com/documentation/ko-kr/unreal-engine/levels-in-unreal-engine)
