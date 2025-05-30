---
layout: default
title: "Search And Delete Empty Folders"
parent: "2. Extend Content Browser Menu"
nav_order: 4
---

## 목표: 빈 폴더 찾아내서 삭제하기

강의에서는 UEditorAssetLibrary::ListAssets() 메서드를 통해 빈 폴더를 찾았지만, 내 버전 (UE 5.5)에서는 제대로 동작하지 않았다

그래서 `AssetRegistry` Module을 통해 해결했다

## OnDeleteEmptyFoldersButtonClicked() 함수 구현에 사용한 메서드
### AssetRegistryModule.Get().GetSubPaths()
특정 경로(폴더) 기준으로, 하위에 존재하는 모든 서브 폴더의 목록을 조회하는 기능

```c++
void IAssetRegistry::GetSubPaths(
    const FString& InBasePath,
    TArray<FString>& OutPathList,
    bool bInRecurse
) const;
```

- 매개변수
    - const FString& InBasePath : 서브 폴더를 검색할 기준이 되는 상위 폴더 경로
        - 예시: "/Game/MyFolder"
        - 반드시 패키지 경로 형식이어야 하며, 슬래시(/)로 시작함
    - TArray<FString>& OutPathList : 검색 결과로 반환될 서브 폴더 경로 문자열의 배열
        - 함수 호출 시 빈 배열을 넘기면 됨
        - 함수가 반환되면, InBasePath의 하위에 존재하는 직속/모든(옵션) 폴더 경로가 여기 저장됨
        - 패키지 경로 형식으로 배열에 담김김
    - bool bInRecurse
        - true : InBasePath의 **모든 하위 폴더(재귀적으로 모든 Depth)**를 탐색
        - false : InBasePath 바로 직속 1 Depth의 폴더만 반환 (재귀 X)
- 반환값
  - 반환값은 없으며, 결과는 OutPathList에 담김

### UEditorAssetLibrary::DoesDirectoryExist()
언리얼 에디터가 인식하는 특정 패키지 경로(폴더)가 실제로 존재하는지 확인하는 기능

>
이 함수는 "UE 에디터에서 인식"하는 패키지 경로 기준으로 폴더의 존재 유무만 판단한다

파일 시스템상의 디렉터리 유무와는 다를 수 있음 (에디터 DB에 등록된 경로만 인식)

```c++
static bool UEditorAssetLibrary::DoesDirectoryExist(
    const FString& DirectoryPath
);
```

- 매개변수
    - const FString& DirectoryPath : 존재 여부를 확인할 대상 폴더의 경로
        - 실제 파일 시스템 경로가 아니라, 에디터와 AssetRegistry에서 인식하는 경로임
- 반환값
    - true : 해당 경로의 폴더가 에디터 내에 실제로 존재함
      - 폴더가 비어있더라도, 존재하면 true를 반환
    - false : 해당 경로의 폴더가 존재하지 않음
      - 완전히 삭제된 경우(에셋/폴더 모두 삭제 후 GC 반영 등), false를 반환 

### UEditorAssetLibrary::DoesDirectoryHaveAssets()
지정한 패키지 경로(폴더)에 최소 1개 이상의 에셋(Asset)이 존재하는지를 확인하는 기능

```c++
static bool UEditorAssetLibrary::DoesDirectoryHaveAssets(
    const FString& DirectoryPath
);
```

- 매개변수
    - const FString& DirectoryPath : 에셋 존재 유무를 확인할 폴더의 경로
        - 실제 파일 시스템 경로가 아니라, 언리얼 에디터가 인식하는 경로임
- 반환값
    - true : 해당 폴더 내에 최소 1개 이상의 에셋이 존재
    - false : 폴더가 비어있거나(에셋 0개), 폴더 자체가 존재하지 않을 경우

### FString::Append()
문자열(또는 TCHAR 포인터, FString, FText 등) 값을 뒤에 이어붙이는 함수. 문자열 결합용

```c++
FString S = TEXT("Hello");
S.Append(TEXT(" World")); // S = "Hello World"
```

### TArray::Append()
다른 배열이나 범위의 모든 요소를 현재 배열 뒤에 "한꺼번에" 추가

```c++
TArray<Type> Array;
Array.Append(OtherArray); // OtherArray의 모든 원소를 뒤에 추가

Array.Append({ "a", "b", "c" }); // initializer list로 여러 개 추가

TArray<FString> Names = { "Apple" };
TArray<FString> NewFruits = { "Banana", "Cherry" };
Names.Append(NewFruits); // 배열: ["Apple", "Banana", "Cherry"]
```

- 결론
    - Add(): 배열에 "한 개"의 값을 추가
    - Append(): 배열에 "여러 개(0개~N개)"의 값을 한 번에 추가

### UEditorAssetLibrary::DeleteDirectory()
지정한 패키지 경로(폴더) 및 그 하위의 모든 에셋과 폴더를 완전히 삭제하는 기능

>
삭제된 폴더/에셋은 휴지통(Trash) 등으로 이동되지 않고, 실제로 프로젝트에서 사라짐

```c++
static bool UEditorAssetLibrary::DeleteDirectory(
    const FString& DirectoryPath
);
```

- 매개변수
    - const FString& DirectoryPath : 삭제할 대상 폴더의 패키지 경로
- 반환값
    - true : 폴더 및 하위 모든 에셋/폴더의 삭제에 성공
    - false : 삭제 실패(예: 에디터가 폴더/에셋을 참조 중이거나, 파일 권한 문제 등)
        - **일부 에셋/폴더만 삭제된 경우에도, 하나라도 실패 시 false**

### 동작 설명
DirectoryPath에 해당하는 폴더 및 모든 하위 폴더/에셋을 재귀적으로 완전 삭제
1. 해당 폴더 내 모든 에셋 및 폴더를 찾음
2. 하위 폴더, 에셋 순으로 모두 삭제
3. 삭제가 정상적으로 끝나면 true 반환
4. 만약 삭제 불가(읽기 전용, 다른 곳에서 사용 중 등)한 경우 false

