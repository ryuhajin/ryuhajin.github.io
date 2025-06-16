---
layout: default
title: "C++ in UE"
parent: "Learn the basics"
nav_order: 1
has_children: true
---

# Setting up Visual Studio
## 지도 스크롤 사용
1. 상단의 도구 -> 설정
2. 텍스트 편집기 -> 모든 언어
3. 스크롤 막대 -> 세로 스크롤 막대에 지도 모드 사용 체크

## 외부 종속성 숨기기
1. 텍스트 편집기 ->  C/C++
2. 고급 -> 검색/탐색
3. 외부 종속성 폴더 숨기기 true 로 변경

## 매크로 보기
1. 텍스트 편집기 ->  C/C++
2. 뷰 -> 비활성 코드
3. 비활성 블록 표시 -> False

# Classes and Inheritance
![](../../../../images/UEClassesInheritance.png){: width="70%" height="60%"}

## 클래스에서 "Is A" VS "Has A"
- Is A : 상속 관계
  - 예 :  `a Child is a Parent`
  - 예 :  `a Child is not a Grandchild`
- Has A : 맴버 변수, 속성을 가지다
  - 예: `a Package has a World` 
  - 예: `a Level has Actors`

![](../../../../images/hasARelationships.png)
- 월드는 패키지의 서브 객체
- 레벨은 월드의 서브 객체
- 액터는 레벨의 서브 객체
- 컴포넌트는 액터의 서브 객체