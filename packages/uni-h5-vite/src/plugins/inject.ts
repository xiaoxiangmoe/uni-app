import path from 'path'
import { Plugin, ResolvedConfig } from 'vite'

import { extend } from '@vue/shared'

import {
  API_DEPS_CSS,
  COMMON_EXCLUDE,
  InjectOptions,
  buildInCssSet,
  uniViteInjectPlugin,
  isCombineBuiltInCss,
} from '@dcloudio/uni-cli-shared'

const apiJson = require(path.resolve(__dirname, '../../lib/api.json'))
const uniInjectPluginOptions: Partial<InjectOptions> = {
  exclude: [...COMMON_EXCLUDE],
  'uni.': [
    '@dcloudio/uni-h5',
    ((method: string) => apiJson.includes(method)) as any, // API白名单
  ],
  // 兼容 wx 对象
  'wx.': [
    '@dcloudio/uni-h5',
    ((method: string) => apiJson.includes(method)) as any, // API白名单
  ],
  getApp: ['@dcloudio/uni-h5', 'getApp'],
  getCurrentPages: ['@dcloudio/uni-h5', 'getCurrentPages'],
  UniServiceJSBridge: ['@dcloudio/uni-h5', 'UniServiceJSBridge'],
  UniViewJSBridge: ['@dcloudio/uni-h5', 'UniViewJSBridge'],
}

export function uniInjectPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig
  const callback: InjectOptions['callback'] = function (imports, mod) {
    const styles =
      mod[0] === '@dcloudio/uni-h5' &&
      API_DEPS_CSS[mod[1] as keyof typeof API_DEPS_CSS]
    if (!styles) {
      return
    }
    styles.forEach((style) => {
      if (isCombineBuiltInCss(resolvedConfig)) {
        buildInCssSet.add(style)
      } else {
        if (!imports.has(style)) {
          imports.set(style, `import '${style}';`)
        }
      }
    })
  }
  const injectPlugin = uniViteInjectPlugin(
    extend(uniInjectPluginOptions, {
      callback,
    })
  )
  return {
    name: 'vite:uni-h5-inject',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config
    },
    transform(code, id) {
      return injectPlugin.transform!.call(this, code, id)
    },
  }
}