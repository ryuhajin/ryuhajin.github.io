---
layout: default
title: "HLSL"
parent: "Computer Graphics"
nav_order: 2
has_children: true
---

# High-Level Shading Language (HLSL)

---

# DirectX Tutorial

---

## windows 입문
- 기본적인 Windows 애플리케이션을 만드는 방법 배우기
- 컴파일 오류 시
  - 프로젝트 속성 → Linker(링커) → System → SubSystem을 Windows (/SUBSYSTEM:WINDOWS) 로 변경

---

- "Hello World!" 창 띄우는 예시

```c++
#include <windows.h>

// 모든 Windows 프로그램의 진입점 (WINAPI WinMain)

int WINAPI WinMain(HINSTANCE hInstance,
					HINSTANCE hPrevInstance,
					LPSTR IpCmdLine,
					int nCmdShow)
{
	//MessageBox()를 사용해 메시지 상자 만들기
	MessageBox(NULL,
		L"Hello World!",
		L"Just Hello World Program!",
		MB_ICONEXCLAMATION | MB_OK);

	// windows에 0 반환
	return (0);
}

```

### int WINAPI WinMain
- **HINSTANCE hInstance** 
  - 인스턴스 핸들.객체를 식별하는 32비트 정수
  - 프로그램이 시작되면 windows는 숫자를 선택하여 hInstance 매개변수에 입력함
- **HINSTANCE hPrevInstance**
  - 과거의 유물. 현재는 사용하지 않음.이전 버전과 호환성을 위해서 존재
  - 과거에는 이전 인스턴스가 있는 경우 핸들을 제공하고, 없는 경우 (인스턴스가 유일한 경우) NULL을 반환함
- **LPSTR lpCmdLine** 
  - 프로그램 호출 명령줄을 포함하는 문자열에 대한 포인터
  - "MyApp.exe"라는 애플리케이션을 시작 메뉴의 실행 명령 프롬프트에서 실행한 경우
  - "MyApp.exe" 또는 "MyApp.exe RunA" 또는 "MyApp.exe RunB"와 같이 실행할 수 있다
  - lpCmdLine은 입력된 모든 내용을 저장하여 프로그램이 특수 매개변수를 확인할 수 있도록 한다
	- 안전 모드, 창 모드, 소프트웨어 렌더링 모드 등 특수 모드를 실행하는 데 유용
- **int nCmdShow** 
  - 창이 생성될 때 어떻게 표시될지 지정
  - 창을 최소화, 최대화 또는 일반 모드로 표시하거나, 백그라운드에서 실행 중인 창을 열도록 설정

### MessageBox
- **HWND hWnd**
  - 창의 핸들. 핸들은 색체를 식별하는 정수.
  - 현재 아직 창이 생성되지 않았으므로 NULL로 지정됨
	- NULL : 어떤 창에서도 오지 않고 바탕화면에서 옴
- **LPCTSTR lptext**
  - 메시지 박스 안에 표시될 텍스트가 담긴 16비트 문자열을 가리키는 포인터
- **LPCTSTR lpcaption**
  - 메시지 상자의 제목 표시줄이나 캡션 텍스트를 포함하는 16비트 문자열을 가리키는 포인터
- **UINT utype**
  - 메시지 상자의 스타일을 결정. 여러 값의 경우 논리 OR (`|`) 연산자와 함께 사용

---

**참고 링크**

- [The Book of Shaders](https://thebookofshaders.com/)
- [Processing](https://processing.org/tutorials/)
- [DirectX Tutorial](http://www.directxtutorial.com/LessonList.aspx?listid=11)