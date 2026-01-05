import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';

export default defineConfig({
  base: '/cgcs2000-projection-zones/', // 仓库名必须与 GitHub 仓库完全一致
  transpileDependencies: true,
  lintOnSave: false, //关闭eslint检测
  server: {
    host: true,
    port: 8088,
    open: true,
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'pinia', 'vue-router'],
      resolvers: [
        // Element按需加载
        ElementPlusResolver(), // 自动导入图标组件
        IconsResolver({
          prefix: 'Icon',
        }),
      ],
    }),
    Components({
      deep: true, // 搜索子目录
      dirs: ['src/components'], // 按需加载的文件夹
      resolvers: [
        // 自动注册图标组件
        IconsResolver({
          enabledCollections: ['ep'],
        }), // 自动导入 Element Plus 组件
        ElementPlusResolver(),
      ],
    }),
    Icons({
      autoInstall: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
