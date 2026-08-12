// @ts-check
import { defineConfig } from 'astro/config';

// 정적 산출(static). 서버 런타임이 없어야 개인정보를 서버에 보관할 여지 자체가 없다.
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
});
