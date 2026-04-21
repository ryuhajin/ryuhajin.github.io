---
layout: default
title: "Project Settings"
parent: "Rendering pipeline"
nav_order: 5
---

# Project Settings
시작 시 게임 플레이 또는 엔진 행동 환경설정

- [UE5.7 - 환경설정 파일](https://dev.epicgames.com/documentation/unreal-engine/configuration-files-in-unreal-engine)
- [UE5.7 - 디바이스 프로파일 설정](https://dev.epicgames.com/documentation/unreal-engine/setting-up-device-profiles-in-unreal-engine)

---

## 환경 설정 파일
환경설정 파일(Configuration Files) 은 언리얼 엔진(Unreal Engine, UE) 의 초기 설정을 제공한다

> 빈 프로젝트를 생성하면 DefaultEngine.ini, DefaultGame.ini 파일이 생성됨

```c++
[SECTION1]
<KEY1>=<VALUE1>
<KEY2>=<VALUE2>
 
[SECTION2]
<KEY3>=<VALUE3>
```

- 모든 환경설정 변수는 **하나의 섹션에 포함**되어야 하며 `<KEY>=<VALUE>` 쌍으로 묶여야 한다

---

## 환경 설정 파일 개념
- [UE5.7 - 프로젝트로 알아보는 엔진 퀄리티 및 디바이스 프로파일](https://dev.epicgames.com/documentation/unreal-engine/scalability-and-device-profiles-in-lyra-sample-game-for-unreal-engine)
- [UE5.7 - Scalability 설명](https://dev.epicgames.com/documentation/unreal-engine/scalability-and-the-developer-for-unreal-engine)


## 환경설정 파일 계층구조
`.ini` 파일은 프로젝트 **기본값을 레이어로 쌓는 설정 시스템**이다

- 즉 동일한 카테고리의 환경설정 파일은 계층구조에 따라 정리된다
- **동일한 카테고리의 파일에 중복된 키-값 쌍이 있는 경우** : 계층구조의 뒤에 오는 파일이 앞에 오는 파일의 키-값 할당을 오버라이드

```
환경설정 파일 계층구조에 대한 자세한 정보는
Engine/Source/Runtime/Core/Public/Misc 에 위치한 ConfigHierarchy.h 헤더 파일 참고
```

---

### DefaultEngine.ini
프로젝트 **전체의 렌더링 경로/기본 기능 선택**을 넣는 곳

- 예: Lumen 사용 여부, 하드웨어 레이트레이싱 지원, Virtual Shadow Maps, 렌더러 기본 방향 같은 프로젝트의 뼈대
- 에디터의 Project Settings에서 바꾸는 많은 렌더링 옵션도 결국 프로젝트 Config에 반영됨

### DefaultScalability.ini
- **Low / Medium / High / Epic 같은 품질 단계별 묶음값을 정의**하는 곳
- 엔진 기본값은 `BaseScalability.ini`에 있고, 프로젝트에서 오버라이드할 수 있음
- 즉, 여기에는 유저 품질 옵션에 따라 바뀌어야 하는 값을 넣는다

### DefaultDeviceProfiles.ini
- **플랫폼/하드웨어 계층별 기기별 오버라이드**를 넣는 곳
- Windows 고사양 PC, 중저가 Android, 특정 콘솔 같은 식으로 **하드웨어 특성에 따라 텍스처 풀, 해상도 비율, 그림자 옵션 등을 다르게 줄 수 있음**
- 공식 문서도 프로젝트 안의 Config/DefaultDeviceProfiles.ini 생성 방식을 권장

### ConsoleVariables.ini
- 개인 개발자 실험용에 가까움
- 엔진 시작 시 콘솔 변수 상태를 로드할 수 있지만, 공식 문서는 이 파일을 로컬 개발자용 공간으로 설명
- 팀 공용/출시 기본값보다는 임시 측정, 개인 실험, 디버그 프리셋 용도로 쓰는 편이 안전

### DefaultGameUserSettings.ini
- 신규 사용자용 기본 그래픽 옵션
- 유저별 저장값의 초기 상태 정의

### PlatformEngine.ini / PlatformScalability.ini
- 플랫폼별 기본값
- PC/모바일/콘솔 차등 기본값 분리

<br>

```
[정리]

프로젝트의 기본 렌더링 방향 → DefaultEngine.ini
유저 품질 단계 → DefaultScalability.ini
플랫폼/기기별 차등 대응 → DefaultDeviceProfiles.ini
내 PC에서만 잠깐 하는 측정/실험 → ConsoleVariables.ini
```

---

## Renderer Settings
섹션에 어떤 구조로 세팅하는지 대표 예시

- [Customizing Device Profiles and Scalability for Android](https://dev.epicgames.com/documentation/unreal-engine/customizing-device-profiles-and-scalability-for-android?application_version=4.27)

### RendererSettings : 기본 렌더링 노선
프로젝트 정체성 확립하기

- 동적 조명 중심인가
- Lumen을 쓸 건가
- Reflections도 Lumen으로 갈 건가
- VSM을 기본 그림자로 쓸 건가
- HWRT를 프로젝트 기본 capability로 켤 건가
- MegaLights가 필요한 프로젝트인가 등등

```md
파일 : Config/DefaultEngine.ini

[/Script/Engine.RendererSettings]

; 정적 라이트맵 대신 동적 조명 중심으로 갈 때 자주 꺼둠
r.AllowStaticLighting=False

; Lumen Software RT에 필요
r.GenerateMeshDistanceFields=True

; GI 기본 방식: 0=None, 1=Lumen
r.DynamicGlobalIlluminationMethod=1

; 반사 기본 방식: 0=None, 1=Lumen
r.ReflectionMethod=1

; 그림자 기본 방식: Virtual Shadow Maps 사용
r.Shadow.Virtual.Enable=1

; HWRT를 쓸 때 시작 시 활성화 상태로 둘 수 있음
r.RayTracing.Enable=1

; MegaLights를 프로젝트 기본으로 허용
r.MegaLights.Allow=1
```

---

### DefaultScalability.ini : 유저 품질 단계
- [Scalability, 엔진 퀄리티 레퍼런스](https://dev.epicgames.com/documentation/unreal-engine/scalability-reference?application_version=4.27)

유저 옵션 / 플랫폼 대응 / QA 비교 기준

- Low: ViewDistance / Shadows / PP / Texture Pool 강하게 절감
- Medium: Low보다 완화
- High: 기본 플레이 타깃
- Epic: 캡처/하이엔드 기준

```md
파일 :  Config/DefaultScalability.ini

; -------------------------
; View Distance
; -------------------------
[ViewDistanceQuality@0]
r.ViewDistanceScale=0.4

[ViewDistanceQuality@1]
r.ViewDistanceScale=0.7

[ViewDistanceQuality@3]
r.ViewDistanceScale=1.0

; UE5/Lyra 계열에서는 foliage/grass 밀도를 ViewDistanceQuality 쪽으로 옮겨 쓰기도 함
[ViewDistanceQuality@0]
foliage.DensityScale=0.25
grass.DensityScale=0.25


; -------------------------
; Shadow
; -------------------------
[ShadowQuality@0]
r.LightFunctionQuality=0
r.ShadowQuality=0
r.Shadow.CSM.MaxCascades=1
r.Shadow.MaxResolution=512
r.Shadow.MaxCSMResolution=512


; -------------------------
; Texture
; -------------------------
[TextureQuality@0]
r.Streaming.MipBias=2.5
r.MaxAnisotropy=0
r.Streaming.PoolSize=200


; -------------------------
; Post Process
; -------------------------
[PostProcessQuality@0]
r.MotionBlurQuality=0
r.BloomQuality=1
r.EyeAdaptationQuality=0
r.PostProcessAAQuality=3


; -------------------------
; Foliage
; -------------------------
[FoliageQuality@0]
foliage.DensityScale=0.25
grass.DensityScale=0.25
```

---
