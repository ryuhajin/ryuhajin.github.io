---
layout: default
title: "Exposing Variables to Blueprint"
parent: "2. Moving Objects With Code"
nav_order: 2
---

# Exposing Variables to Blueprint
블루프린트에 클래스 변수 노출시키기

## 사용 예시
- `UPROPERTY` 매크로 사용
  -  변수에 메타데이터 및 속성을 부여해 언리얼의 리플렉션 시스템과 에디터, 블루프린트 등에서 활용할 수 있게 함

```c++
UCLASS()
class YOURPROJECT_API UMyClass : public UObject
{
    GENERATED_BODY()
    
public:
    // 블루프린트에서 읽기/쓰기 가능한 변수
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="MyCategory")
    float MyFloatVariable;
    
    // 블루프린트에서 읽기만 가능한 변수
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="MyCategory")
    int32 MyReadOnlyInt;
};
```

## UPROPERTY()

```c++
UPROPERTY([specifier1, specifier2, ...], [meta=(key1=value1, key2=value2, ...])
```

- Specifiers : 변수의 기본 동작을 정의하는 필수 속성들
    - 쉼표로 구분하여 여러 개 지정 가능
- Meta Data : 선택적 추가 설정 (meta=로 시작)
  - key=value 형태로 지정

## 특징
1. 블루프린트 노출
   - 변수를 블루프린트에서 사용하려면 반드시 BlueprintReadOnly 또는 BlueprintReadWrite를 지정
2. 카테고리 지정
   - Category 속성을 사용하면 에디터에서 속성이 그룹화되어 표시
3. 네트워크 복제
   - 멀티플레이어 게임에서는 Replicated 속성을 사용하여 변수를 복제
4. 에디터 표시
   - meta 속성들을 사용하여 에디터에서 변수가 어떻게 표시되고 동작할지 세부 조정 가능

## Specifiers 정리
- EditDefaultsOnly : 블루프린트 기본 설정 (이벤트 그래프) 디테일 패널에 노출
- EditInstanceOnly : 블루프린트 인스턴스 (레벨 뷰) 디테일 패널에 노출
- EditAnywhere : 둘 다 보임. 인스턴스에서 설정 건드리면 기본 설정 바꿔도 인스턴스 설정 그대로 따라감

---

- BlueprintReadWrite :  블루 프린트 노드로 클래스 변수 사용 가능하게 해줌
  - `private` 안에서 사용 불가 

---

속성 |	설명 |	사용 예시 |
EditAnywhere	 |에디터의 모든 인스턴스에서 편집 가능 |	UPROPERTY(EditAnywhere)
VisibleAnywhere	 |에디터에서 볼 수 있지만 편집 불가 |	UPROPERTY(VisibleAnywhere)
EditDefaultsOnly	 |클래스 기본값에서만 편집 가능	 |UPROPERTY(EditDefaultsOnly)
VisibleDefaultsOnly	 |클래스 기본값에서만 보임	 |UPROPERTY(VisibleDefaultsOnly)
EditInstanceOnly	 |인스턴스에서만 편집 가능	 |UPROPERTY(EditInstanceOnly)
BlueprintReadWrite	 |블루프린트에서 읽기/쓰기 가능	 |UPROPERTY(BlueprintReadWrite)
BlueprintReadOnly	 |블루프린트에서 읽기만 가능	 |UPROPERTY(BlueprintReadOnly)
Category	|에디터에서 표시될 카테고리	|UPROPERTY(Category="Gameplay")
Replicated	|네트워크 복제 활성화	|UPROPERTY(Replicated)
ReplicatedUsing	|복제 시 호출할 함수 지정|	UPROPERTY(ReplicatedUsing=OnRep_MyVar)
SaveGame	|세이브 게임에 포함	|UPROPERTY(SaveGame)
Transient	|저장되지 않는 임시 변수|	UPROPERTY(Transient)
Config	|config 파일에서 값 로드	|UPROPERTY(Config)

## Meta Data 정리

속성	 |기능	 |사용 예시 |
AllowPrivateAccess	 |private C++ 변수를 블루프린트에서 접근 가능하게 함 |  meta = (AllowPrivateAccess = "true")|


**참고하면 좋은 링크**
- [gameplay classes Properties](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-uproperties)
