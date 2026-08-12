# 이미지 슬롯 안내

이 폴더에 아래 파일명으로 이미지를 넣으면 **다음 빌드부터 자동으로 페이지에 노출**됩니다.
파일이 없으면 홈은 자체 SVG 일러스트로 폴백되고, 상태판·가이드는 이미지 없이 렌더링됩니다.

각 이미지 하단에는 "이미지: AI 생성 — 실제 모습과 다릅니다" 캡션이 자동으로 붙습니다
(오정보 방지 원칙). **시공사 조감도·투시도·홍보 이미지는 저작권 원칙상 넣지 않습니다.**

| 파일명 | 위치 | 권장 크기 | 내용 |
|---|---|---|---|
| `hero-lake.jpg` | 홈 상단 히어로 | 1600×640 (5:2) | 호수공원 노을 풍경 |
| `status-city.jpg` | 상태판 상단 | 1600×500 | 건설 중인 신도시 |
| `guide-interior.jpg` | 가이드 상단 | 1600×500 | 밝은 아파트 거실 |

용량은 파일당 300KB 이하 권장 (JPG 품질 75~80, 또는 WebP).

## AI 생성 프롬프트

사이트 팔레트(파랑 `#2563c4`, 초록 `#2e8f6c`, 웜 샌드 노을톤)와 어울리도록 작성했습니다.
공통 금지어를 꼭 포함하세요: **no text, no logos, no watermark, no people's faces**.

### 1. hero-lake.jpg — 홈 히어로

> A serene lake park at dusk in a modern Korean new town, calm water reflecting a
> peach-and-blue gradient sky, silhouettes of modern high-rise apartment towers in the
> distance with a few warm lit windows, lakeside walking trail with trees, soft flat
> illustration style with subtle grain, muted blue and warm sand palette, wide panoramic
> composition, 5:2 aspect ratio, no text, no logos, no watermark

사진풍을 원하면 뒤쪽 스타일 부분을 이렇게 교체:
> ...cinematic photography, golden hour, soft haze, shot on 35mm, shallow depth of field

### 2. status-city.jpg — 상태판 상단

> A new town under construction at golden hour, tower cranes and building frames on the
> horizon, a newly opened light-rail station in the foreground, wide roads and young
> street trees, hopeful atmosphere, soft flat illustration style, muted blue and warm
> sand palette, wide panoramic composition, no text, no logos, no watermark

### 3. guide-interior.jpg — 가이드 상단

> A bright empty living room of a brand-new Korean apartment, floor-to-ceiling windows
> with soft morning light, light oak flooring, white walls, minimal staging with a single
> plant, clean and airy, soft flat illustration style, warm neutral palette with a hint
> of sage green, wide composition, no text, no logos, no watermark

## 주의

- 프롬프트에 단지명·브랜드명을 넣지 마세요. 실제 조감도와 유사해지면 저작권·오인 문제가 생깁니다.
- 생성 결과에 글자·워터마크·간판이 섞여 나오면 다시 생성하세요.
