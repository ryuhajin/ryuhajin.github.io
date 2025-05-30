---
layout: default
title: "Fix Up Redirectors From Code"
parent: "1. Quick Asset Actions"
nav_order: 5
---

## 목표: 리다이렉터 정리하기

# Redirector
에셋이 이동하거나 이름이 변경되었을 때 기존 참조를 유지하기 위해 사용
- 에디터의 콘텐트 브라우저에서 이동하거나 변경하면 자동으로 생성함
- 탐색기나 터미널을 사용하여 에셋 이동 시 리다이렉터가 생성되지 않음
  - 에디터 API 를 사용하는 경우는 리다이렉터 정상 생성 
- 리다이렉터가 많아지면 빌드/로딩 속도가 느려짐 -> 정리 필요
- 콘텐츠 브라우저에서 우클릭 → '레퍼런스 뷰어'로 참조 관계 확인

## 리다이렉터가 필요한 이유
1. 언리얼 엔진 프로젝트는 에셋 간의 참조(Reference) 관계가 복잡하게 얽혀 있음
2. 만약 어떤 블루프린트, 머티리얼, 레벨 등이 특정 에셋을 참조하고 있는데, 그 에셋의 위치나 이름이 바뀌면 기존 참조가 모두 깨짐
3. 이 문제를 방지하기 위해, 기존 위치(예전 경로)에 ‘리다이렉터’ 에셋을 생성함
4. 이 리다이렉터 에셋은 “이 에셋은 이제 새로운 위치에 있습니다”라고 알려줌으로써, 예전 참조들이 새 위치의 에셋을 계속 사용할 수 있게 해줌

## 리다이렉터 작동 방식
### 1. 디스크(파일) 저장
리다이렉터는 ObjectRedirector 타입의 `.uasset` 파일로 저장
  - 자신이 원래 위치했던 경로(Original Path)
  - 참조해야 하는 대상 오브젝트(DestinationObject, 새 경로의 에셋에 대한 소프트 참조) 가 저장됨
  - 이 상태의 리다이렉터는 그냥 하나의 "Proxy" 에셋(패키지)일 뿐이며, 실제 오브젝트 인스턴스(UObject 인스턴스)는 생성되어 있지 않음

### 리다이렉터 에셋 개념적 구조

```c++
// ObjectRedirector.uasset (실제 파일은 바이너리이지만, 개념적으로 다음과 같은 정보를 저장)
{
    "OriginalObjectPath": "/Game/Characters/OldCharacter",  // 원본 경로
    "DestinationObjectPath": "/Game/Heroes/NewCharacter",   // 새 경로 (SoftObjectPath)
    "Flags": RF_Public | RF_Standalone,                     // 객체 플래그
    "DestinationObject": "Soft Reference"                   // 실제로는 포인터가 아니라 소프트 참조(경로 정보) 형태
}
```

### 2. 메모리 로드(에디터/엔진에서 참조할 때)
1. 리다이렉터가 메모리로 로드됨
  - 어떤 에셋이 리다이렉터 경로를 참조하고 있을 때, 언리얼은 먼저 리다이렉터(.uasset) 파일을 로드해서 UObjectRedirector 인스턴스로 메모리에 올림
2. DestinationObject로 즉시 변환
  - 엔진은 리다이렉터를 참조하는 순간, DestinationObject(실제 에셋)를 메모리로 로드하고 참조를 자동으로 대체함

## Fix Redirectors 함수 구현에 사용한 메서드
Fix 과정의 핵심
- 모든 리다이렉터를 탐색
- 각 리다이렉터의 DestinationObject를 메모리에 로드
- 예전 참조(리다이렉터 경로)를 새 참조(DestinationObject 경로)로 교체
- 리다이렉터 파일 삭제

### 1. IAssetRegistry& AssetRegistry
에셋 레지스트리 가져오기

{: .new-title}
> ❓ 왜 인터페이스 레퍼런스 타입으로 가져오는거야?
>
- `AssetRegistry`는 엔진 내부적으로 이미 생성되어 관리되는 객체
- new로 직접 인스턴스를 만들면, **엔진의 전역 에셋 DB와 분리된 “쓸모 없는 객체”**가 만들어짐
- 즉, 반드시 엔진이 소유/관리하는 인스턴스를 사용해야 하며, 이를 제공받는 공식 경로는 아래와 같다.

```c++
FModuleManager::LoadModuleChecked<FAssetRegistryModule>(TEXT("AssetRegistry")).Get()
```

## 함수명에 붙은 Checked란?
함수명에 "Checked"가 붙었을 때는 무조건 성공해야 하며, 실패 시 프로그램을 즉시 중단(Assert/Crash)한다는 의미
- CastChecked (타입 불일치 → 크래시)
- LoadModuleChecked (모듈 없음/실패 → 크래시)

### 비교 예시

| 함수  | 동작   | 실패 시 |
|---|---|---|
| LoadModule<T>()      | 모듈 로드, 실패 시 nullptr 반환             | 안전         |
| LoadModuleChecked<T>() | 모듈 로드, 실패 시 Assertion Failure(크래시) | 위험 (강제 중단) |
| GetModule<T>()       | 이미 로드된 모듈만 반환, 없으면 nullptr         | 안전         |


### 2. `FModuleManager::LoadModuleChecked<T>`
엔진/에디터 모듈을 런타임에 안전하게 로드

- FModuleManager::
  - 모듈 동적 로딩 시스템을 관리하는 핵심 클래스
- LoadModuleChecked<T>()
  - 템플릿 함수로, 지정된 모듈 타입(T)을 강제로 로드하고 검증 후 반환
  - 모듈이 존재하지 않으면 크래시

```c++
template<class T>
static T& LoadModuleChecked(FName ModuleName);
```

### 동작
1. ModuleName에 해당하는 모듈이 이미 로드되어 있으면
  - → 바로 그 모듈의 레퍼런스(포인터/레퍼런스)를 반환
2. 아직 로드되지 않았다면
  - 모듈을 로드(동적 DLL 또는 엔진 플러그인 로딩) 시도
  - 성공하면 인스턴스 반환
  - 실패시 크래시
3. 반환 타입은 T& (예: FAssetRegistryModule&)

### 3. `CastChecked<T>()`
주어진 포인터가 실제 런타임에 T 타입(혹은 그 하위 타입)인지 체크한 뒤, 맞으면 T로 변환해서 반환
- 틀리면 **에디터 빌드(Development/Debug)**에서는 **강제로 크래시(Assertion 실패)**를 일으킴

### `CastChecked<T>와 Cast<T>의 차이`

| 함수| 타입 체크 실패 시 동작 | 주로 사용하는 상황 |
|---|---|---|
| `Cast<T>()`        | 실패 시 `nullptr` 반환          | 타입이 확실하지 않을 때, if문으로 분기 필요할 때  |
| `CastChecked<T>()` | 실패 시 크래시/Assertion Failure | 타입이 **반드시** T여야 할 때 (논리 오류 방지) |


### 3. FARFilter
AssetRegistry 모듈에서 사용하는 에셋 검색 조건을 표현하는 구조체
- AssetRegistry API (GetAssets 등) 호출 시, 이 구조체를 넘겨주면 조건에 맞는 에셋만 결과로 반환

### FARFilter 주요 멤버

| 필드 | 역할 |
|---|---|
|`TArray<FName> PackagePaths` | 검색할 폴더 경로(예:/Game, /Game/MyFolder)|
|`TArray<FName> ClassPaths`   | 검색할 클래스 유형(예: Blueprint, ObjectRedirector) |
|bool bRecursivePaths       | 하위 폴더까지 검색할지 여부 |
|`TArray<FName> ObjectPaths`  | 특정 오브젝트 경로 지정(옵션) |
| ...  | 이 외에도 Tag, Metadata 등 다양한 조건 가능 |


### FARFilter 사용 예시

```c++
// AssetRegistry 모듈 참조 얻기
IAssetRegistry& AssetRegistry =
    FModuleManager::LoadModuleChecked<FAssetRegistryModule>(TEXT("AssetRegistry")).Get();

// FARFilter 구조체 생성
FARFilter Filter;

// 검색할 폴더 지정 (여러 개 가능)
Filter.PackagePaths.Add(FName("/Game/MyFolder")); // 예시: /Game/MyFolder 폴더만 검색

// 하위 폴더까지 재귀적으로 검색할지 여부
Filter.bRecursivePaths = true;

// 검색할 클래스 지정 (여러 개 가능)
Filter.ClassPaths.Add(UStaticMesh::StaticClass()->GetClassPathName());  // 스태틱 메시만 대상
// Filter.ClassPaths.Add(UMaterial::StaticClass()->GetClassPathName()); // 필요하면 다른 클래스도 추가

// 특정 태그 기반 검색 예시 (선택 사항)
// Filter.TagsAndValues.Add(FName("MyTag"), TEXT("MyValue"));

// 결과 저장할 배열
TArray<FAssetData> AssetList;

// 실제 검색 수행
AssetRegistry.GetAssets(Filter, AssetList);

// 결과 사용 예시
for (const FAssetData& Asset : AssetList)
{
    UE_LOG(LogTemp, Log, TEXT("Asset found: %s"), *Asset.AssetName.ToString());
}
```

### 4. AssetRegistry.GetAssets(Filter, AssetList)
Filter에 지정된 조건(폴더, 클래스, 태그 등)에 맞는 에셋의 메타데이터 목록을 OutAssetData(배열)에 추가

```c++
virtual bool GetAssets(
    const FARFilter& InFilter, 
    TArray<FAssetData>& OutAssetData, 
    bool bSkipARFilteredAssets
) const = 0;
```
- 매개변수
  - const FARFilter& Filter
    - 에셋 검색 조건
  - TArray<FAssetData>& OutAssetData
    - 검색 결과가 담길 배열 (에셋 메타데이터(FAssetData) 객체)
  - bool bSkipARFilteredAssets 
    - AssetRegistry에 이미 “숨김(Filtered Out)” 처리된 에셋을 결과에서 제외
    - 기본값 true (숨김 에셋 제외)

## AssetViewUtils
콘텐츠 브라우저(에셋 뷰)에서 에셋의 표시, 로딩, 정렬, 필터링 등과 관련된 작업 유틸리티
- ContentBrowser 모듈에 포함

- 에셋을 실제로 메모리로 로드(Load)
- 에셋 목록을 정렬(Sort), 필터(Filter)
- 콘텐츠 브라우저에서 사용할 다양한 유틸리티 제공

### 5. AssetViewUtils::FLoadAssetsSettings
에셋 로딩 동작을 세부적으로 제어하는 옵션 구조체
- 위에서 설명한 Filter와 마찬가지로 설정 옵션을 정의하는 용도로 쓰임

### FLoadAssetsSettings 주요 맴버

| 필드 | 역할  |
|---|---|
| bFollowRedirectors | 에셋 경로가 리다이렉터인 경우, **자동으로 실제 에셋을 따라갈지** 여부<br> - true면 리다이렉터를 따라가 실제 에셋을 로딩<br> - false면 리다이렉터 그 자체만 로드 |
| bAllowCancel      | 로딩 도중 **사용자가 취소(Interrupt/Cancel)할 수 있는 UI**가 노출될지 여부<br> - 에디터에서 대량 에셋 로딩시 “취소” 가능 |

### 6. AssetViewUtils::LoadAssetsIfNeeded
에셋의 오브젝트 경로(ObjectPath) 리스트를 받아, 실제로 필요한 에셋만 메모리로 로드하는 에디터 유틸리티 함수
- 이미 메모리에 로드된 에셋은 재로드하지 않음
- 콘텐츠 브라우저 및 에디터 툴에서 대량 에셋 로딩에 특화

```c++
// 매개변수 설명
    ELoadAssetsResult LoadAssetsIfNeeded(
        const TArray<FString>& AssetObjectPaths, // 오브젝트 경로 문자열 리스트
        TArray<UObject*>& LoadedAssets,          // 실제 로딩된 에셋 객체가 저장될 배열
        const FLoadAssetsSettings& Settings      // 로딩 옵션(구조체)
    );

    AssetViewUtils::LoadAssetsIfNeeded(AssetObjectPaths, LoadedAssets, Settings);
```

### 반환값

| 값   | 의미  |
|---|---|
| ELoadAssetsResult::Succeeded | 모든 에셋 정상 로드 |
| ELoadAssetsResult::Cancelled | 로딩 중 사용자 취소 |
| ELoadAssetsResult::Failed   | 로딩 자체 실패    |


### 7. AssetToolsModule.Get().FixupReferencers()
FixupReferencers()는 깨진 참조를 수정하는 핵심 함수이다

- 깨진 참조 자동 복구
  - 에셋 경로 변경으로 인해 깨진 참조를 검색하고 자동으로 수정
  - 리다이렉터가 존재할 경우 대상 경로로 참조를 업데이트
- 대상 범위
  - 선택한 에셋(들)을 참조하는 모든 다른 에셋을 검사
  - 블루프린트, 머티리얼, 레벨 등 모든 에셋 타입의 참조 처리 가능
- 리다이렉터 처리
  - 기존 리다이렉터를 제거하고 직접 참조로 변환할 수 있음

```c++
virtual void FixupReferencers(
    const TArray<UObjectRedirector*>& Redirectors,
    bool bCheckoutDialogPrompt = false,
    ERedirectFixupMode FixupMode = ERedirectFixupMode::DeleteFixedUpRedirectors
) = 0;
```
- 매개변수
  - Redirectors: UObjectRedirector*의 배열로, 참조를 갱신할 리다이렉터 목록
  - bCheckoutDialogPrompt: true로 설정하면, 소스 컨트롤 사용 시 체크아웃 다이얼로그를 표시
  - FixupMode: 리다이렉터 처리 방식을 지정
    - ERedirectFixupMode::DeleteFixedUpRedirectors: 참조가 갱신된 리다이렉터를 삭제
    - ERedirectFixupMode::LeaveFixedUpRedirectors: 참조가 갱신되더라도 리다이렉터를 유지
