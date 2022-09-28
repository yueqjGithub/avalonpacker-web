import { defineConfig, loadEnv } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import legacy from '@vitejs/plugin-legacy'
// https://vitejs.dev/config/

export default ({ mode }) => {
  const iamUrl = loadEnv(mode, process.cwd()).VITE_IAMURL
  /** 项目实例id需要在iam后台进行配置 */
  const instanceId = loadEnv(mode, process.cwd()).VITE_INSTACE_ID
  const iamUrlValue = encodeURIComponent(Buffer.from(encodeURIComponent(iamUrl)).toString('base64'))
  return defineConfig({
    base: './',
    server: {
      https: true,
      host: '10.172.188.117',
      port: 20001,
      proxy: {
        '/packer': 'http://10.172.188.117:8087'
        // '/packer': 'http://test-packer.avalongames.com'
      },
      open: `/?iam_url=${iamUrlValue}&instance_id=${instanceId}`
    },
    optimizeDeps: {
      include: ['avalon-iam-util-client', 'avalon-common-util-global', 'avalon-iam-util-global', 'avalon-antd-util-client']
    },
    plugins: [
      reactRefresh(),
      legacy({
        targets: ['defaults', 'not IE 11']
      })
    ],
    build: {
      target: 'es2015'
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    }
  })
}
