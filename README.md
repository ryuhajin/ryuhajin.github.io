# ryuhajin.github.io

Portfolio + Notes. [Astro](https://astro.build) + [Starlight](https://starlight.astro.build), GitHub Pages로 배포.

| 경로 | 내용 | 소스 |
|---|---|---|
| `/` | 랜딩 (메뉴 hover 시 커서 트레일) | `src/pages/index.astro` |
| `/projects/` | 프로젝트 박스 3개 (Grid / List 전환) | `src/pages/projects/index.astro` |
| `/projects/<slug>/` | 화면 단위 프로젝트 쇼케이스 | `src/pages/projects/[slug].astro` |
| `/about/` | 소개 | `src/pages/about.astro` |
| `/notes/...` | 공부 노트 (Starlight) | `src/content/docs/notes/**` |
| `/docs/...` | 예전 Jekyll 주소 → `/notes/...` 리다이렉트 | `public/docs/**` |

## 로컬 실행

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # dist/ 생성 + 검색 색인(Pagefind)
npm run preview   # 빌드 결과 확인 (검색은 빌드 후에만 동작)
```

`main` 브랜치에 push 하면 `.github/workflows/pages.yml` 이 빌드 후 배포합니다.

## 노트 추가

`src/content/docs/notes/` 아래에 `.md` 파일을 추가하면 끝. **폴더 구조 = 좌측 트리**.

```md
---
title: 새 노트
sidebar:
  order: 40      # 선택. 같은 폴더 안에서 작은 숫자가 위. 생략하면 폴더 맨 뒤(가나다순)
---

본문은 `##` 부터 시작합니다 (`#` 은 페이지 제목으로 자동 표시).

인라인 수식 $a^2 + b^2$, 블록 수식:

$$
M_{world} = T \cdot R \cdot S
$$

:::tip[❓ 질문 형태 메모]
Starlight aside 문법. note / tip / caution / danger
:::
```

- 이미지: `public/images/` 에 넣고 `![](/images/파일.png)` 로 참조. 크기 조절은 `<img src="/images/파일.png" style="width:60%" />`.
- 폴더의 `index.md` 는 트리에서 `Overview` 로 표시됩니다.

## 프로젝트 추가

`src/content/projects/<slug>.md` 에 frontmatter만 채우면 목록/상세 페이지가 생성됩니다. 스키마는 `src/content.config.ts`.

- 미디어: `public/projects/<slug>/` 에 두고 `cover.poster`(정지 이미지)와 `cover.video`(webm/mp4 권장, gif도 가능)를 지정.
  영상은 hover 시점에만 로드됩니다. 가벼운 `webm`(VP9, 720p, 5~10초 루프)을 권장.
- `sample: true` 인 항목은 SAMPLE 뱃지가 붙습니다. 지금 있는 3개는 레이아웃 확인용 샘플이니 실제 프로젝트로 교체하세요.
- 섹션: `overview` → `architecture` → `problems` → `decisions` → `links` 순서로 한 화면씩 전환됩니다.

사이트 이름, 소개 문구, 메뉴는 `src/site.ts` 에서 수정합니다.

## 디자인 커스터마이징

### Notes Thema
- 목록: `src/notes/palettes.mjs` (id, 이름, dark/light, 코드블록 Shiki 테마)
- 색상: `src/styles/notes/palettes.css` 의 `[data-palette='<id>']` 블록 (배경, 텍스트, border, accent, 코드블록 배경 등)
- 새 테마 추가: 두 파일에 같은 id 로 항목 하나씩 추가
- 타이포/레이아웃/사이드바/표/인용: `src/styles/notes/base.css`
- 코드블록(폰트, 테두리, 패딩, 탭 바): `ec.config.mjs`

### Portfolio Thema (Notes 테마와 별개)
- 목록/카드 미리보기/우측 도형 세트: `src/portfolio/themes.ts`
- 색상·폰트 토큰: `src/styles/portfolio-themes.css` 의 `[data-ptheme='<id>']`
- 새 테마 추가: 두 파일에 같은 id 로 항목 하나씩 추가 (`shapes`: geo / space / candy / pixel)

### Portfolio 연출
- 페이지 전환: `src/styles/page-transitions.css` (방향별 애니메이션, `--vt-dur` 전환 시간) + `src/scripts/vt-types.js` (목적지별 방향: Projects ↑, Notes ←, About ↓)
- 메뉴 hover 글리치: `src/styles/glitch.css`
- 메뉴 hover 이미지 구성: `src/portfolio/hover-sets.ts` (이미지 위치·크기·회전), 파일은 `public/trail/<menu>/` (출처 `public/trail/CREDITS.md`)
- 랜딩 우측 도형: `src/components/portfolio/HeroShapes.astro` + `src/scripts/portfolio/hero-shapes.ts`

## 기타

- 수식: `remark-math` + `rehype-katex` (빌드 시 렌더링, 클라이언트 JS 없음)
- 검색: Pagefind (한국어 포함, 빌드 시 색인)
- `scripts/migrate-jekyll.mjs`: Jekyll → Starlight 1회성 변환 스크립트 (기록용)
