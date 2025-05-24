---
layout: default
title: "Asset Batch Duplication"
parent: "1. Quick Asset Actions"
nav_order: 2
---

## 목표: 콘텐트 폴더에서 선택한 에셋 복사하기

# Scripting Libraries
## 1. UEditorUtilityLibrary::
에디터에서 에셋(Asset) 관련 작업을 자동화하기 위한 기능 제공
  - **에셋의 로드, 저장, 복사, 이동, 삭제 등 파일 시스템 수준의 작업**
  - **에셋 메타데이터(metadata) 접근 및 수정**
  - 에셋 의존성(dependencies) 분석
  - 에셋 브라우저(Content Browser)와 연동된 작업

### 메소드
  - GetSelectedAssetData() : `TArray<FAssetData>`를 반환
  - GetSelectedAssets() :  `TArray<UObject*>`를 반환
    - FAssetData는 UObject* 보다 더 많은 정보를 포함
  - 모두 static 함수임

## 2. UEditorAssetLibrary:: 클래스
에디터 UI 및 일반 유틸리티 작업을 지원
   - **선택된 객체(Selected Actors/Assets)에 접근**
   - 에디터 UI(알림, 다이얼로그) 제어
   - 월드/레벨 편집과 관련된 작업
   - 블루프린트/파이썬 스크립트와의 연동 용이

### 정리
- 에디터 상호작용 (선택된 객체 제어, 알림 표시, 다이얼로그 생성) → UEditorUtilityLibrary
- 에셋 작업 (일괄 임포트, 이름 변경, 메타데이터 편집) → UEditorAssetLibrary

>
- UEditorUtilityLibrary로 선택한 에셋을 가져온 후 UEditorAssetLibrary로 해당 에셋을 수정

# .uasset
Unreal Engine이 **에디터에서 사용하는 에셋(데이터) 저장 파일 포맷 (파일 확장자)**
- 모든 에셋은 UObject를 상속한 특정 클래스(예: UMaterial, UStaticMesh 등)로 만들어진다
- **에디터에서 만드는 에셋은 각기 다른 UObject 파생 클래스의 인스턴스가 디스크에 .uasset으로 저장된 것**
  - BP_NewBlueprint.uasset
  - MyMaterial.uasset

## 객체 식별
  - **Asset Name**: 에셋(객체) 이름. 에디터에서 보이는 에셋의 이름
    - (예: BP_NewBluePrint)
  - **Package Path**: 에셋이 저장된 폴더 경로 + 에셋 이름
    - (예:/Game/MyFolder/BP_NewBluePrint)
    - **'패키지'란 언리얼에서 하나의 저장 단위**
    -  **하나의 .uasset 파일 = 하나의 패키지**
       - 패키지 파일(.uasset) 안에는 여러 객체(에셋)가 저장 될 수 있음 
    -  패키지 경로는 항상 /로 시작
    -  패키지 경로에는 .uasset 확장자가 포함되지 않음
  - **Object Path**:  패키지 경로 + `.에셋(객체) 이름`
    - (예: /Game/MyFolder/BP_NewBluePrint.BP_NewBlueprint)
    - 패키지 내부에는 여러 객체가 있을 수 있으므로, 반드시 객체 이름까지 명시해야 객체를 특정할 수 있다


## duplicate 함수 구현에 사용한 메서드
### 1..ToString()
  - FString, FName, FText, FVector, FGuid 등 일부 엔진 주요 클래스에서 각 타입에 맞는 방식으로 문자열 변환

### 2.FString::FromInt()
- 정수형 값을 FString 객체로 변환하는 정적(static) 메서드

- 매개변수
  - int32 Value: 변환할 정수 값
- 반환값
  - FString: 정수를 문자열로 변환한 결과

```c++
int32 Number = 42;
FString Str = FString::FromInt(Number); // "42"
```
### 3.FPaths::Combine()
- 여러 개의 경로 문자열을 OS별로 올바른 구분자로 결합해 하나의 경로 문자열로 만듦.
	- 내부적으로 /, \ 자동 정리

- 매개변수
  - 오버로드가 많으나, 대표적으로 다음과 같은 버전
  -  const FString& PathA, const FString& PathB
- 반환값
  - FString: 결합된 경로 문자열

```c++
FString FullPath = FPaths::Combine(TEXT("C:/Project"), TEXT("Content"), TEXT("Textures"));
// "C:/Project/Content/Textures"
```

### 4.UEditorAssetLibrary::DuplicateAsset()
- 에디터 전용 라이브러리 함수. Content Browser에서 특정 자산(에셋)을 **지정 경로로 복제(복사)**함

- 매개변수
  -  const FString& SourceAssetPath: 원본 자산의 경로
     -  (예: "/Game/StarterContent/Textures/T_Wood")
  -  const FString& DestinationAssetPath: 복제될 위치의 경로
     -  (예: "/Game/MyFolder/T_Wood_Copy")
- 반환값
  -  UObject*: 복제된 자산의 포인터
     -  (복제 실패 시 nullptr 반환)

```c++
UObject* Duplicated = UEditorAssetLibrary::DuplicateAsset(TEXT("/Game/AssetA"), TEXT("/Game/Folder/AssetB"));
if (Duplicated) { /* 성공 */ }
```

### 5.UEditorAssetLibrary::SaveAsset()
- 에디터에서 지정한 자산(에셋)을 디스크에 저장

- 매개변수
   - const FString& AssetPath: 저장할 자산의 경로 (예: "/Game/MyFolder/AssetB")
- 반환값
	- bool (true: 저장 성공 / false: 저장 실패)

```c++
bool bSaved = UEditorAssetLibrary::SaveAsset(TEXT("/Game/MyFolder/AssetB"));
```

### 6.TEXT()
- C++의 **문자열 리터럴을 엔진 내부 문자 타입(TCHAR)**로 변환하는 매크로 
   - TEXT() 매크로는 C++의 매크로 전처리 기능을 사용

```c++
FString MyString = TEXT("Hello");
// ↓ 매크로 확장 후
FString MyString = L"Hello";  // C++ 컴파일러가 처리할 코드 생성
```
- L"Hello" :  UTF-16/유니코드 문자열 리터럴로 컴파일

# Custom Editor Message
- FMessageDialog를 사용해 메시지 대화 상자 출력하기 (모달)
- FNotificationInfo를 사용해 알림 정보 출력하기 (오른쪽 하단에 나타나는 비동기 알림)

## FMessageDialog
- 에디터 환경에서 사용자에게 메시지 박스(모달 대화상자)를 띄울 때 사용하는 유틸리티 클래스
- core 소속
- **블로킹(Blocking) 방식으로, 다이얼로그가 닫히기 전까지 다음 코드가 실행되지 않음**
- 정적(static) 메서드로만 구성

### 1. FMessageDialog::Open(EAppMsgType::Type MsgType, const FText& Message)
- 지정한 메시지 유형과 메시지 텍스트로 다이얼로그 표시

### 2. EAppReturnType::Type
```c++
EAppReturnType::Type ShowMsgDialog(
    EAppMsgType::Type MsgType, 
    const FString& Message, 
    bool bShowMsgAsWarning = true
)
```
- MsgType: 메시지 박스 버튼 조합(Ok, YesNo 등) 지정
- Message: 출력할 메시지 문자열
- bShowMsgAsWarning: 경고(Warning) 스타일로 메시지를 띄울지 여부, 기본값 true
   - true면 경고 스타일(노란색 경고 아이콘, "Warning" 타이틀 등)로 표시
   - false면 일반 정보 스타일(파란색 info 아이콘, "Message" 또는 "Info" 타이틀 등)로 표시

**EAppMsgType::Type 정리**

| 타입| 다이얼로그 버튼 조합  | 대표적 사용 상황 |
|---|---|---|
| `Ok`     | OK   | 단순 확인, 정보 알림  |
| `YesNo`  | Yes / No   | 선택(이행/거부)  |
| `YesNoCancel`  | Yes / No / Cancel| 저장 여부 등 3분기 선택|
| `OkCancel`     | OK / Cancel| 진행/중단   |
| `CancelRetryContinue`| Cancel / Retry / Continue     | 재시도 여부(예: 파일 저장 실패) |
| `YesNoYesAllNoAll`   | Yes / No / Yes to All / No to All   | 여러 작업에 대해 일괄 처리 |
| `YesNoYesAllNoAllCancel`   | Yes / No / Yes to All / No to All / Cancel| 여러 파일 작업에서 개별/일괄/취소 |
| `YesNoCancelContinue`| Yes / No / Cancel / Continue  | 드문 복합적 분기     |
| `YesNoYesAllNoAllCancelContinue` | Yes / No / Yes to All / No to All / Cancel / Continue | 매우 복잡한 결정     |


## FNotificationInfo
- 에디터 하단 (주로 오른쪽 아래)에 잠시 나타나는 비동기 알림(Notification Toast) 정보를 정의하는 구조체
- `FSlateNotificationManager`를 통해 **실제 알림을 생성/표시**
- slate 소속

```c++
FNotificationInfo Info(FText::FromString(TEXT("작업이 완료되었습니다.")));
Info.bFireAndForget = true;
Info.ExpireDuration = 2.0f; // 2초 후 자동 닫힘
Info.bUseThrobber = false; // 스피너 비표시

FSlateNotificationManager::Get().AddNotification(Info);
```
