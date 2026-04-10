---
layout: default
title: "Renderdoc"
parent: "Computer Graphics"
nav_order: 3
has_children: true
---

# Renderdoc
화면에 그려진 Frame을 캡쳐해 디버깅 해보자!

**링크**
- [RenderDoc 설치](https://renderdoc.org/)
- [RenderDoc 메뉴얼](https://renderdoc.org/docs/index.html)
- [언리얼 엔진에서 RenderDoc 사용하기](https://dev.epicgames.com/documentation/unreal-engine/using-renderdoc-with-unreal-engine)

**보면 유익한 유튜브 링크**

- [그래픽과 렌더링 코드를 이해하는 가장 좋은 방법](https://youtu.be/TEKYu00ca0E?si=okQHaysgPZ5wxnXG)
- [RenderDoc을 사용한 느린 프레임 분석](https://youtu.be/pnMQow_t0Ig?si=4KtEEP8RbqoDibtQ)

---

## 렌더독의 파이프라인 캡처 원리
엔진과 그래픽스 API (DirectX, Vulkan, OpenGL 등) 사이에서 '프록시(Proxy, 대리자)' 역할을 수행하며 데이터를 가로챈다

1. **개입 과정 (Hooking)**:
    - 게임 프로세스가 실행될 때 렌더독 모듈이 함께 로드되어, 언리얼 엔진이 그래픽 카드로 보내는 모든 API 호출(명령)의 통로를 장악
2. **기록 (Recording)**:
    - 사용자가 캡처 시, 렌더독은 정확히 다음 한 프레임(Next Frame) 동안 발생하는 모든 그래픽스 API 호출(Draw Call, 셰이더 바인딩, 렌더 타겟 설정, 버퍼 할당 등)을 순서대로 기록
3. **재구성 (Replay)**:
    - 기록된 데이터를 바탕으로 렌더독 자체 UI에서 해당 프레임이 화면에 그려지기까지의 과정을 단계별로 재구성하여 디버깅 가능

---

## 렌더독의 시간 측정 프로세스
렌더독은 게임이 실행되던 전체 맥락(Context)을 캡처하지만, 시간까지 정지시켜서 저장하지는 않음

- 시계 아이콘을 누르면 내부적으로 다음과 같은 과정이 일어남

1. **타임스탬프 삽입**
    - 렌더독이 현재 선택된(또는 전체) 이벤트의 앞뒤에 그래픽스 API의 타임스탬프 쿼리(Timestamp Query)를 삽입
2. **GPU 재실행 (Replay)**
    - 해당 렌더링 명령을 현재 장착된 그래픽 카드로 다시 보냄
3. **결과 반환**
    - GPU가 해당 명령을 처리하고 난 뒤의 시간 차이를 계산하여 UI에 띄움

### 올바른 시간 데이터 해석 방법
이러한 이유로 인해 렌더독에서 제공하는 타이밍 수치는 '절대적인 소요 시간(Absolute Time)'이 아니다

```
따라서 수십 마이크로초의 변동성에 집중하기보다는,
'프레임 전체에서 어느 렌더 패스(Render Pass)나 드로우 콜이 가장 높은 비중(%)을 차지하는가?'
```

> 를 파악하는 상대적인 병목(Bottleneck) 추적 용도로 사용하는 것이 올바른 접근 로직이다

> (예: "포스트 프로세싱 단계가 전체 렌더링 시간의 40%를 잡아먹고 있군!")

---

## 시작하기
나는 두가지 방법으로 캡쳐 해봤는데 하나는 렌더독에서 캡처할 프로그램을 실행하는 경우, 다른 하나는 언리얼에서 렌더독을 실행하는 경우였다

- **렌더독에서 실행하는 경우**는 `.exe` 실행 파일을 launch Applicaion에 경로 설정 해주면 됨

![](/images/renderDoc_started.png)

---

- **경로 설정 후 오른쪽 아래의 launch 버튼을 누르면 프로그램이 시작되며 왼쪽 상단에 디버깅 문구가 표시된다**

![](/images/renderDoc_started_0.png)

---

- **언리얼에서 렌더독을 실행하는 경우** 는 언리얼에서 **render doc 플러그인을 추가**해야 한다
    - 자세한건 위에 적어둔 [언리얼 엔진에서 RenderDoc 사용하기](https://dev.epicgames.com/documentation/unreal-engine/using-renderdoc-with-unreal-engine) 링크 참조

---

# 시작하며 힘들었던 점
## 1. 언리얼 엔진 캡쳐하기
1. **튜토리얼을 보고 renderDoc - File - Launch App을 하면 자동으로 경로 탐색이 되는줄 알았는데 아니었다**
   - 직접 Launch Application 경로를 입력해주니 됨
2. **Launch Application path 경로에 UnrealEditor를 넣으면 에디터 자체도 같이 디버깅 된다**
    - 레벨 뷰포트 렌더링 + 에디터 UI(Slate) + 각종 에디터 창이 같은 프로세스 안에 함께 보임

> 레벨 뷰포트만 잡는 절차, Standalone Game만 캡처하는 절차 필요

---

### 해결 방안
1. `Edit > Project Settings > Plugins > RenderDoc > Capture all activity` 옵션 끄기
    - 이 옵션이 켜져 있으면 에디터 전체 창 활동이 같이 잡힐 수 있다
2. 키보드 단축키 : **F11 (레벨 뷰포트 전체화면) > G (기즈모 등 끄기) > Alt+F12 (렌더독 캡쳐)**
3. PIE(Play In Editor) 환경에서 실행한 스탠드얼론 게임(Standalone Game) 모드
    - 게임 창에서 콘솔 명령 (**renderdoc.CaptureFrame**) 사용

---

## 2. Event Browser 타이밍 분석 오류
타이밍 분석(clock icon)을 키자 `D3D12 counters require Win10 developer mode enabled` 오류가 남

- 나는 win11을 사용하는데 win10 오류 메세지가 처음에 보여 당황했다
### 해결 방안
타이밍 분석은 **GPU 성능 카운터(Performance Counters)를 사용하는데, 이 기능은 개발자 모드에서만 접근할 수 있었다**

1. 윈도우 설정 -> 시스템 -> 고급 시스템 설정 -> 개발자용 카테고리의 개발자 모드 사용 ON

---

## 렌더독 콘솔 커맨드 (UE)

| 명령어 (Command) | 설명 (Description) |
| :--- | :--- |
| `renderdoc.ShowHelpOnStartup` | 0 - 시작 시 인사말이 표시되었으며 나타나지 않습니다. 1 - 다음 시작 시 인사말이 표시됩니다. |
| `renderdoc.SaveAllInitials` | 0 - 리소스의 초기 상태를 무시합니다. 1 - 항상 모든 렌더링 리소스의 초기 상태를 캡처합니다. 이 설정을 켜면 캡처 파일의 크기가 크게 증가하므로 주의하세요. |
| `renderdoc.ReferenceAllResources` | 0 - 실제로 사용된 리소스만 포함합니다. 1 - 프레임 동안 사용되지 않은 리소스를 포함하여 모든 렌더링 리소스를 캡처에 포함합니다. 이 설정을 켜면 캡처 파일의 크기가 크게 증가하므로... |
| `renderdoc.EnableCrashHandler` | 0 - 크래시(충돌) 처리를 전적으로 엔진에 위임합니다. 1 - 렌더독 크래시 핸들러를 사용합니다 (문제가 렌더독 자체에 있고 이를 Re... 에 알리고자 할 때만 사용하세요). |
| `renderdoc.CapturePIE` | PIE(Play In Editor) 세션을 시작하고, 시작 시점부터 지정된 수의 프레임을 캡처합니다. |
| `renderdoc.CaptureFrameCount` | 0보다 큰 값일 경우, 렌더독 캡처가 단일 프레임 이상을 포함하게 됩니다. 참고: 이는 모든 뷰포트와 에디터 창의 모든 활동이 캡처됨을 의미합니다 (즉, CaptureAllActivity와 동일하게 작동). |
| `renderdoc.CaptureFrame` | 다음 프레임의 렌더링 명령을 캡처하고 렌더독을 실행합니다. |
| `renderdoc.CaptureDelayInSeconds` | 0 - 캡처 지연의 단위가 '프레임'으로 설정됩니다. 1 - 캡처 지연의 단위가 '초'로 설정됩니다. |
| `renderdoc.CaptureDelay` | 0보다 큰 값일 경우, 렌더독은 지정된 시간(또는 CaptureDelayInSeconds가 0일 경우 지정된 프레임 수)이 지난 후에만 캡처를 트리거합니다. |
| `renderdoc.CaptureCallstacks` | 0 - 렌더독이 콜스택을 캡처하지 않습니다. 1 - 각 API 호출에 대한 콜스택을 캡처합니다. |
| `renderdoc.CaptureAllActivity` | 0 - 렌더독이 현재 활성화된 뷰포트의 데이터만 캡처합니다. 1 - 렌더독이 전체 프레임 동안 모든 뷰포트 및 에디터 창에서 발생하는 모든 활동을 캡처합니다. |
| `renderdoc.BinaryPath` | 연결할 메인 렌더독 실행 파일(.exe)의 경로를 지정합니다. |
| `renderdoc.AutoAttach` | 엔진 시작 시 렌더독이 자동으로 연결(Attach)됩니다. |
| `MaterialBaking.RenderDocCapture` | 렌더독 캡처를 트리거할지 여부를 결정합니다. |

---

