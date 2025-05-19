---
layout: default
title: "String"
parent: "Coding Standard"
nav_order: 1
---

# String

## FString
FString은 **일반적인 문자열 데이터**로 문자열 **검색, 수정, 비교**를 할 수 있다.

1. **데이터 구조**
- **메모리 상에 각 인스턴스마다 고유 문자 배열을 직접 저장**
- 내부적으로 `TArray<TCHAR>` (=동적 배열 기반 유니코드 문자열)
- C++의 std::wstring(wide string)과 비슷하지만, 언리얼 엔진 특화 기능(TCHAR, UTF-16, 매크로 등)이 있다

2. **대표적 사용 예**
- 파일 경로, 로그 메시지
- 유저 입력 (채팅, 이름 등)
- 임시 데이터 처리, 문자열 연산

3. **특징**
- 수정 가능
- 문자열 조작이 자유로움
- 각 인스턴스가 자체 메모리 공간 사용

## FName
FString과 다르게 문자열 전체 저장 X. **글로벌 네임 테이블에 저장되어 데이터를 경량화**

1. **데이터 구조**
- 엔진 시작 시부터 종료까지 고유 문자열을 전역적으로 관리하는 글로벌 네임 테이블 사용
  - **실제 문자열 데이터는 네임 테이블에 한번만 등록**됨
- 어떤 FName이 새로 생성될 때, 문자열이 **이미 테이블에 있으면 기존 인덱스를 사용**하고, 없으면 새로 추가함
    - 문자열의 중복 저장을 막고, 모든 **FName이 같은 문자열이면 동일한 인덱스를 공유**한다

2. **대표적인 사용 예**
- 오브젝트 식별에 주로 사용
- 변수명, 파라미터 이름
- 리소스/에셋 이름
- GameplayTags

3. **특징**
- 수정 불가
- 비교 검색이 매우 빠름
  - 문자열끼리 직접 비교하는 대신, **인덱스만 비교하면 되기 때문에 성능이 우수**하다
- **대소문자 구분이 없다**
- 가비지 컬렉션 대상이 아니다 (엔진이 꺼질 때 까지 유지)

## FText
**사용자에게 보여지는 텍스트**에 주로 사용된다. **다국어 번역**이 필요한 경우 사용.

FText는 외부 API에서 받은 플레이어 이름 등을 UI에 표시할 때처럼, **현지화 테이블 미등록 텍스트 문자열**에도 쓰인다.

1. **데이터 구조**

**최상위**
  -  ITextData(인터페이스)의 TSharedRef 스마트 포인터만을 소유
  -  실질적 데이터는 FTextData에 들어있다.
```c++
class FText
{
private:
    TSharedRef<ITextData, ESPMode::ThreadSafe> TextData;
    ...
};
```

**FTextData 구조체**

```c++
struct FTextData : ITextData
{
    FString SourceString;   // 원본 문자열
    FCulturePtr TextCulture; // 해당 텍스트의 문화권(언어) 정보
    FTextHistory TextHistory; // 텍스트 생성/변환 이력 (핵심!)
    ...
};
```

**현지화 히스토리**
- 다양한 하위 클래스를 통해 데이터 관리 가능
  - FTextHistory_LocalizedString : 현지화 키, 원본 텍스트, 로컬라이제이션 리소스 정보 등 저장
  - FTextHistory_FormattedNumber : 숫자 포맷, 소수점, 지역화 등 정보
  - FTextHistory_FormatString : 포맷 패턴, 인자 배열 등 

```c++
class FTextHistory_LocalizedString : public FTextHistory_Base
{
    FString SourceString;        // 원본 텍스트
    FString Namespace;           // 현지화 네임스페이스
    FString Key;                 // 현지화 키
    FString LocalizedString;     // 번역된 문자열(캐싱)
    ...
};
```

**FText 구조 정리**

```
FText
 └─ TextData (FTextData)
       ├─ SourceString (원본)
       ├─ TextCulture (문화권)
       └─ TextHistory (생성/포맷/현지화 이력)
             ├─ 현지화키
             ├─ 네임스페이스
             ├─ 포맷정보
             └─ 캐시된 번역값 등...
```

1. **대표적인 사용 예**
- UI 버튼/ 메뉴 텍스트 (시작, Continue 등)
- 게임 대사, 퀘스트 설명, 튜토리얼 메시지
- 점수, 날짜, 숫자 등 표시
- 모든 다국어 지원 필요한 표시용 텍스트

1. **특징**
- 현지화, 포맷, 문화권별 번역 자동 처리
- 직접 수정 불가. 변환 후 새로 만들어야 함
- 직접 비교/조작은 제한됨
  - FText끼리 `==` 연산은 데이터 주소 또는 히스토리 비교이므로, 실제 표시 문자열이 같아도 false가 나올 수 있음


## 정리

| 클래스 |사용 목적|데이터 구조| 특징 |
|---|---|---|---|
| FString |임의 문자열, 수정/검색/연결| TArray<TCHAR>(인스턴스별 동적 배열) | 수정 가능, 조작 자유|
| FText   |현지화/번역 표시 텍스트| TSharedRef<ITextData> + FTextHistory | 현지화 지원, 수정 어려움, 포맷/언어 처리|
| FName   |식별자/키/이름/빠른비교| 글로벌 해시 테이블 인덱스+번호| 비교 빠름, 대소문자 무시, 수정 불가 |


**참고 링크**
- [String Handling](https://dev.epicgames.com/documentation/en-us/unreal-engine/string-handling-in-unreal-engine?application_version=5.4)
- [Why you should be using GameplayTags in Unreal Engine](https://www.tomlooman.com/unreal-engine-gameplaytags-data-driven-design/)
