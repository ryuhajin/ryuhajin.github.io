---
layout: default
title: "Learn the basics"
parent: "Unreal Engine 5"
nav_order: 2
has_children: true
---

# Learn the basics

# Console Commands
디버깅에 필요한 콘솔 명령어 정리

## 콘솔 명령어 사용 방법
**뷰포트 콘솔 (`~` 키)** : 뷰포트에서 `~` (물결표) 키를 눌러 열리는 콘솔에 입력

```
블루프린트 노드 `Execute Console Command` 노드를 사용해 명령어 실행할 수 있다는데 나중에 테스트 해봐야겠음
```

---

## 성능 및 프로파일링 명령어
성능 병목 지점을 찾는 핵심 도구. 다양한 서브시스템의 성능 데이터를 실시간으로 확인

| 명령어 | 설명 |
|---|---|
| stat fps | 실시간 프레임률(FPS) 표시 |
| stat unit | 프레임 타임, 게임 스레드, 렌더 스레드, GPU 시간 표시 |
| stat unitgraph | CPU/GPU 사용률을 실시간 그래프로 표시 |
| stat gpu | GPU가 각 렌더링 단계에서 소비한 시간(ms) 표시 |
| stat scenerendering | 드로우 콜(Draw Call) 및 렌더링 관련 상세 통계 표시 |
| stat engine | 프레임 시간, 렌더링된 삼각형 수 등 엔진 전반 통계 |
| stat memory | 메모리 사용 현황 (메모리 최적화에 유용) | 
| stat startfile / stat stopfile | 성능 데이터 기록 시작/종료 (.ue4stats 파일로 저장) |
| profilegpu | 현재 프레임의 GPU 상세 프로파일 정보를 Output Log에 출력 |
| t.maxfps [value] | 최대 프레임률 제한 설정 | t.maxfps 60 |

> 성능 데이터 기록 시작/종료의 경우 명령어 두개 사용할 것. stat startfile → stat stopfile 

---

## 렌더링 디버깅 명령어
**렌더링 관련 `r.` 명령어**들은 그래픽스 연구와 디버깅에 핵심적인 도구

| 명령어 | 설명 | 사용 예시 |
|---|---|---|
| r.vsync [0/1] | 수직 동기화(VSync) 켜기/끄기 | `r.vsync 0` (끄기) |
| r.ScreenPercentage [0-100] | 렌더링 해상도를 기본값 대비 백분율로 설정 | `r.ScreenPercentage 50` |
| r.Shadow.Quality [0-2] | 그림자 품질 설정 (0: 최저, 2: 최고) | `r.Shadow.Quality 0` (성능 테스트) |
| r.AntialiasingQuality [0-4] | 안티얼라이싱 품질 설정 | `r.AntialiasingQuality 4` |
| r.Streaming.PoolSize [MB] | 텍스처 스트리밍 풀 크기 설정 (0: 무제한) | `r.Streaming.PoolSize 4096` |
| r.MultithreadedRendering [0/1] | 멀티스레드 렌더링 켜기/끄기 (성능 영향) | `r.MultithreadedRendering 1` |

---

## 시각화 및 뷰 모드 명령어
**레벨 뷰포트의 렌더링 결과를 다양한 디버그 뷰로 전환해 분석**

- 섀도우, 라이트, 노멀, UV 등 렌더링의 각 요소를 분리해서 볼 수 있어, 커스텀 셰이더와 라이트 연구에 유용

| 명령어 | 설명 | 사용 예시 |
|---|---|---|
| viewmode [ModeName] | 뷰포트의 디스플레이 모드 변경 | `viewmode lit`(조명), `viewmode unlit`(무조명), `viewmode wireframe`(와이어프레임) |
| r.VisualizeOccludedPrimitives [0/1] | 가려진(occluded) 오브젝트를 시각적으로 표시 | `r.VisualizeOccludedPrimitives 1` |
| ShowFlag.[FlagName] [0/1] | 특정 렌더링 기능 켜기/끄기 (예: `ShowFlag.PostProcessing 0`) | `ShowFlag.Lighting 0`, `ShowFlag.Decals 0`, `ShowFlag.Fog 0` |
| mat_showwireframe [0/1] | 모든 머티리얼을 와이어프레임 모드로 표시 | `mat_showwireframe 1` |
| r.TonemapperFilm [0/1] | 토� 매핑(톤 매핑) 후처리 효과 켜기/끄기 | `r.TonemapperFilm 0` |
| r.DebugViewMode [Value] | 다양한 디버그 뷰 모드 활성화 | `r.DebugViewMode 2` (라이팅 전용), `r.DebugViewMode 4` (UV 오버랩) |

---

## 스크린샷 및 출력 명령어
렌더링 결과를 고화질 이미지로 저장하거나, 화면에 표시되는 디버그 메시지를 제어

| 명령어 | 설명 | 사용 예시 |
|---|---|---|
| HighResShot [Multiplier] | 현재 뷰포트 크기의 배수로 고해상도 스크린샷 저장 | `HighResShot 2` (2배 해상도) |
| HighResShot [W]x[H] | 지정한 해상도로 스크린샷 저장 | `HighResShot 3840x2160` |
| DisableAllScreenMessages | 화면에 표시되는 모든 디버그 메시지 일괄 숨김 | `DisableAllScreenMessages` |
| EnableAllScreenMessages | 숨겨진 디버그 메시지 다시 표시 | `EnableAllScreenMessages` |

---

## 게임플레이 및 치트 명령어

| 명령어 | 설명 | 사용 예시 |
|---|---|---|
| EnableCheats | PIE 및 비배포 빌드에서 치트/디버그 명령어 활성화 | `EnableCheats` |
| AbilitySystem.Ability.Grant [ClassName/AssetName] | 특정 어빌리티를 캐릭터에 부여 | `AbilitySystem.Ability.Grant GA_Jump` |
| AbilitySystem.Ability.Activate [Tag/Class/Asset] | 어빌리티 즉시 활성화 (태그, 클래스명, 에셋명으로 지정) | `AbilitySystem.Ability.Activate GA_Dash` |
| AbilitySystem.Ability.Cancel [AbilityClass] | 진행 중인 어빌리티 중단 | `AbilitySystem.Ability.Cancel GA_Dash` |
| open [MapName] | 지정한 레벨(맵) 로드 | `open /Game/Maps/MyTestLevel` |
| quit / exit | 게임 또는 에디터 종료 | `quit` |
| bugit | 현재 화면의 스크린샷과 플레이어 위치 로그를 `Screenshots/` 폴더에 저장 | `bugit` |

---