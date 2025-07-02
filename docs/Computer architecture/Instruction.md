---
layout: default
title: "Instruction"
parent: "Computer architecture"
nav_order: 3
---

# Instruction (명령어)
CPU가 수행할 작업을 지시하는 기본 단위

## 명령어의 기본 구성
1. 연산 코드(Opcode)
- 수행할 연산을 지정 (예: ADD, SUB, LOAD, JUMP)
2. 피연산자(Operand)
- 연산에 사용될 데이터 또는 데이터의 주소 (레지스터, 메모리 주소, 상수 등)

## Instruction Format (명령어 형식)
CPU 설계에 따라 다양한 형식으로 나뉘지만 주요 형식은 아래와 같음

1. 0-주소 명령어 (Stack Machine)
- 피연산자를 명시하지 않음 / 스택(Stack) 의 최상위 값(TOS)을 암묵적으로 사용
    ```markdown
    | Op-code |
    ```
   - 예: `ADD` (스택의 top 두 값을 꺼내 더한 후 결과를 push)
1. 1-주소 명령어 (Accumulator Machine)
- 하나의 피연산자만 명시
- 누산기(ACC)가 암묵적인 피연산자 
  - 누산기(Accumulator) : CPU 내부에서 산술 및 논리 연산 결과를 임시로 저장하는 특별한 레지스터
    ```markdown
    | Op-code | Address |
    ```
    - 예: `LOAD X` (메모리 주소 X의 값을 ACC에 적재)
1. 2-주소 명령어 (General Register Machine)
- 두 피연산자를 명시
- 결과는 첫 번째 피연산자에 저장
    ```markdown
    | Op-code | Address1 | Address2 |
    ```
    - 예: `ADD R1, R2` (R1 = R1 + R2)
1. 3-주소 명령어 (RISC 구조)
- 두 피연산자와 결과 저장 위치를 모두 명시
    ```markdown
    | Op-code | Address1 | Address2 | Address3 |
    ```
    - 예: `ADD R1, R2, R3` (R1 = R2 + R3)

|형식|0-주소 명령어|1-주소 명령어|2-주소 명령어|3-주소 명령어|
|장점|명령어 길이가 짧음|간단한 하드웨어 구현|유연성 높음 <br> (대부분의 현대 CPU에서 사용)|명확한 의미 전달 <br> 병렬 처리 용이|
|단점|스택 관리 복잡|연산마다 ACC 접근이 필요해 병목 현상 발생 가능|명령어 길이가 상대적으로 김|명령어 길이가 가장 김|

---

## 명령어의 피연산자 유형
주소 지정 방식 명령어를 이해하기 위해 피연산자 유형이 어떻게 지정되는지 설명

1. 즉시 (Immediate)
- 명령어 내에 상수 값 포함
- 예: `ADD R1, #5` (R1 = R1 + 5) 
2. 레지스터 (Register)
-  CPU 내 레지스터 참조
-  예: `MOV R1, R2` (R1 = R2)
3. 메모리 주소 (Memory Address)
-  직접 주소, 간접 주소, 인덱스 주소 등
-  예: `LOAD R1, [0x1000]` (메모리 주소 0x1000의 값을 R1에 적재)

## Addressing Mode (주소 지정 방식)
명령어가 지정한 피연산자(operand)를 메모리·레지스터·즉시값 등에서 어떤 방식으로 찾는가에 대한 규칙

|주소 지정 방식| 설명 | 명령어 예시| 의미| 
| **즉시(Immediate)**| 주소 필드에 들어있는 값 자체를 operand로 사용      | `ADD R1, #5` |(R1 = R1 + 5) |
|  **직접(Direct)**  | 주소 필드에 적힌 주소를 operand의 메모리 주소로 사용  | `LOAD R1, [1000]` |메모리 주소 0x1000의 값을 R1에 적재|
| **간접(Indirect)** | 주소 필드에 적힌 주소에 가서 <br> 그 안의 값을 operand 주소로 사용| `LOAD R1, [[0x1000]]` |1000번지에 저장된 값이 진짜 주소, 거기 있는 값을 R1에 로드 |
|**레지스터(Register)**| 주소 필드가 레지스터 번호 <br> 해당 레지스터 값을 operand로 사용  | `MOV R1, R2` |R1 = R2|
| **레지스터 간접(Register Indirect)** | 주소 필드가 가리키는 레지스터 안에 <br> 저장된 값(주소)을 실제 메모리 주소로 사용| `LOAD R1, [R2]` | R2의 값이 500이면, 500번지의 데이터를 R1에 로드 |
|  **상대(Relative/PC-relative)**  | 주소 필드 값과 현재 PC(program counter)의 값을 더해 실주소를 만듦 | `JMP 20` | (JUMP PC + 20) 현재 PC가 100이라면 120번지로 점프  |
|  **인덱스(Index)**  | 베이스 레지스터 + 인덱스 레지스터 | `LOAD R1, [ADRS + R2]` |R2가 10이고 ADRS가 1000이면 1010 주소 값 적재 |
|    **기타(변형)**    | 자동 증가/감소, 변위(Displacement), 스택 등   |    ||

### 인덱스 레지스터 동작 과정
배열, 테이블, 벡터와 같이 메모리에 연속적으로 저장된 데이터에 반복적으로 접근할 때 사용

- Base Address (기준 주소): 배열의 시작 주소 (예: 1000 = A[0]의 주소)
- Offset (인덱스 레지스터): 시작 주소로부터의 거리 (예: R2는 i × 원소 크기)
- 실제 주소: Base + Offset으로 계산

```c++
// LOAD R1, [ADRS + R2]
LOAD R1, 1000(R2)
```

0. 배열 원소의 크기는 4바이트로 가정
1. 배열 `A[0]`의 시작주소 = 1000
2. `R2`는 바이트 단위 Offset이 저장됨
    - R2 = 원하는 인덱스 × 원소 크기
    - 예: `A[3]` 접근 시 R2 = 3 × 4 = 12
3. 메모리 접근
    - 예: `LOAD R1, 1000(20)` → R1 = 메모리[1020] (즉, A[5]의 값)

# Instruction Set Architecture
CPU가 이해하는 명령어의 집합으로, 주요 유형은 아래와 같다

1. CISC (Complex Instruction Set Computer)
- 복잡한 명령어, 다양한 주소 지정 방식
- 예: x86 아키텍처
2. RISC (Reduced Instruction Set Computer)
- 간단한 명령어, 고정된 길이, 레지스터 중심
- 예: ARM, MIPS

## 아키텍처 요약

아키텍처|등장 시기/장소|	설계 철학|	주요 사용처	|현재|
MIPS	|1981, 스탠포드 대학|	RISC|	임베디드, 라우터, PS1/2|	쇠퇴, 일부 임베디드/네트워크에 잔존|
x86	|1978, 인텔	|CISC	|PC, 서버, 산업용|	PC/서버 시장 지배, 저전력은 약세|
ARM	|1985, 영국 Acorn	|RISC|	모바일, IoT, 임베디드|	모바일/임베디드 압도, PC/서버 확대|
