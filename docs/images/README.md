# 문서 이미지

[프로젝트 README](../../README.md)와 [주요 화면 모음](../screens.md)에서 사용하는 이미지입니다. 배너는 문서용 일러스트이고, 화면 이미지는 2026-10-18에 확인한 배포 화면을 정리한 [Figma UI 문서](https://www.figma.com/design/Y4orK4LUYK19NXmVlmskdV/mystery-mango)에서 가져왔습니다.

## README 배너

[readme-banner.png](readme-banner.png)는 2026-10-27에 기본 이미지 생성 도구 `image_gen`으로 제작한 1730 × 909 PNG입니다. [참고 저장소](https://github.com/laetipark/mobinogi-web)의 캐릭터·타이틀 중심 배너 구성에 맞춰, 미스터리 망고의 초록색·망고색과 망고 탐정·카드·주사위를 사용했습니다. 문서 표지용 그림이며 서비스 UI 또는 Figma 화면 캡처가 아닙니다.

실제 사용한 [생성 프롬프트](banner-prompt.txt)를 함께 보관합니다. 이 배너는 루트 README, 문서 허브, 프런트엔드 README에서 공통으로 사용합니다. 교체할 때는 제목의 가독성과 작은 화면에서의 잘림 여부를 확인합니다.

## 사이트 로고

[mango-detective.png](../../frontend/public/images/mango-detective.png)는 README 배너의 망고 탐정 캐릭터를 참고해 기본 이미지 생성 도구 `image_gen`으로 만든 1254 × 1254 투명 PNG입니다. 망고 얼굴·탐정 모자·초록 잎·돋보기를 남긴 로고이며 [실제 생성 프롬프트](logo-prompt.txt)를 함께 보관합니다.

사이트 헤더, 스튜디오 상단과 브라우저 파비콘이 같은 파일을 사용합니다. 헤더에서는 서비스 이름이 링크의 접근 가능한 이름을 제공하므로 캐릭터 이미지의 대체 텍스트는 비워 중복 읽기를 피합니다. 교체할 때는 흰색·차콜색 배경과 모바일 크기에서 투명 배경, 비율, 식별성을 확인합니다.

## Figma 화면 이미지

| 파일 | 크기 | 출처 |
| --- | --- | --- |
| [home.jpg](home.jpg) | 1838 × 871 | 홈 프로토타입의 첫 화면 캡처 |
| [home-full.png](home-full.png) | 1823 × 3335 | 홈 전체 프레임 `41:463` |
| [matching.png](matching.png) | 1823 × 1126 | 머더미스터리 매칭 조건 `68:589` |
| [studio-gallery.png](studio-gallery.png) | 1823 × 2106 | 템플릿과 내 작품 `68:7743` |
| [studio-story.png](studio-story.png) | 1838 × 871 | 이야기 흐름 편집 `68:8957` |
| [studio-publish.png](studio-publish.png) | 1838 × 871 | 공개 준비 `68:11351` |

## 화면 이미지 갱신 방법

1. 배포 화면 또는 로컬 개발 화면 중 어느 상태를 담는지 확인합니다.
2. Figma의 대응 프레임을 최신 화면에 맞추고 하단 누락·겹침과 원래 가로·세로 비율을 확인합니다.
3. 프레임은 원래 크기의 PNG로 내보내 같은 파일명으로 교체합니다. 홈 첫 화면은 프로토타입 캡처의 실제 파일 형식인 JPEG를 유지합니다.
4. 이 목록의 치수와 [화면 모음의 기준일·운영 반영 범위](../screens.md#이미지-기준과-갱신)를 함께 갱신합니다.
5. README·문서에서 이미지가 열리는지 확인합니다. Figma의 임시 다운로드 주소와 로컬 임시 경로는 본문에 사용하지 않습니다.

서비스 글꼴은 Pretendard이며, Figma에서 사용한 대체 글꼴은 Noto Sans KR입니다. 문서 이미지에 실제 게임의 개인 비밀·엔딩 본문이나 계정의 민감 정보를 추가하지 않습니다.
