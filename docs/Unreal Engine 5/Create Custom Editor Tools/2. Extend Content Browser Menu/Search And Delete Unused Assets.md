---
layout: default
title: "Search And Delete Unused Assets"
parent: "2. Extend Content Browser Menu"
nav_order: 3
---

## 목표 : 바인딩 된 함수 동작 구현하기

# 글로벌 함수의 링크 에러 및 static/네임스페이스 처리
G 접두사가 붙은 변수나 함수에 `static`을 추가하기

- 링크 에러 : 여러 cpp 파일에서 동일한 헤더를 include하고, 그 헤더에 글로벌 함수가 정의되어 있다면
컴파일 시 "중복 정의된 심볼" 에러 발생
- 전역 객체 : 전역 객체에 직접 접근하는 함수를 static으로 만들면 해당 함수를 사용하는 모듈이 전역 객체가 정의된 모듈에 대한 불필요한 종속성을 만들지 않음

-> 디버그 헤더에 namespace 추가 (클래스가 아니라 namespace::로 사용하기 위해)

## OnDeleteUnsuedAssetButtonClicked() 함수 구현에 사용한 메서드
### 1. UEditorAssetLibrary::ListAssets()
특정 폴더 경로 내의 모든 에셋(assets) 목록을 가져오는 기능

```c++
static TArray<FString> UEditorAssetLibrary::ListAssets(
    const FString& Path,
    bool bRecursive = true,
    bool bIncludeFolder = false
);
```

- 매개변수
  - Path : 에셋을 검색할 디렉터리 경로
  - bRecursive : 하위 폴더까지 탐색 여부 (기본값 true)
  - bIncludeFolder : 폴더 자체도 결과 배열에 포함할지 여부 (기본값 false)
- 반환값
  -  TArray<FString> :  폴더 내 모든 에셋/폴더의 "Object Path" 문자열 배열
     - 예 : `/Game/Test/Sub/SM_Sphere.SM_Sphere`

### 2. Contains()
문자열 또는 컨테이너 내 특정 요소의 존재 여부를 검사

```c++
bool FString::Contains(
    const TCHAR* SubStr, 
    ESearchCase::Type SearchCase = ESearchCase::IgnoreCase
) const;
```
- 매개변수
  -  const TCHAR* : 검색할 부분 문자열 (예: "Test")
  -  ESearchCase::Type : 대소문자 구분 여부
     - ESearchCase::IgnoreCase : 구분 안함
     - ESearchCase::CaseSensitive : 구분함
- 반환값
  - 포함되면 true / 아니면 false  

### 컨테이너 별 용도
- 문자열 검색 → FString::Contains()
- 빠른 요소 확인 → TSet::Contains()
- 키 존재 여부 → TMap::Contains()

### 3. UEditorAssetLibrary::DoesAssetExist()
에셋 경로(.uasset)가 실제로 존재하고 로드 가능한지 여부를 확인

```c++
static bool UEditorAssetLibrary::DoesAssetExist(
    const FString& AssetPath
);
```
- 매개변수
  -  const FString& : 검사할 에셋의 전체 경로 (예: "/Game/Characters/Hero.uasset")
- 반환 값
  - 에셋이 존재하면 true, 아니면 false

### 4. UEditorAssetLibrary::FindAssetData()
주어진 에셋 경로(.uasset)로부터 에셋의 메타데이터(FAssetData) 를 조회

``` c++
static FAssetData UEditorAssetLibrary::FindAssetData(
    const FString& AssetPath
);
```

- 매개변수
  -  const FString& : 검색할 에셋의 전체 경로 (예: "/Game/Characters/Hero.uasset")
- 반환값
  -  FAssetData : 에셋 정보를 담은 객체 (없으면 빈 객체)
