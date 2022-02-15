import path from 'path'
import { Plugin } from 'vite'

import {
  defineUniPagesJsonPlugin,
  normalizeAppConfigService,
  normalizePagesJson,
  parseManifestJsonOnce,
  getLocaleFiles,
  normalizeAppNVuePagesJson,
  APP_CONFIG_SERVICE,
} from '@dcloudio/uni-cli-shared'

export function uniPagesJsonPlugin({
  renderer,
  appService,
}: {
  renderer?: 'native'
  appService: boolean
}): Plugin {
  return defineUniPagesJsonPlugin((opts) => {
    return {
      name: 'uni:app-nvue-pages-json',
      enforce: 'pre',
      transform(code, id) {
        if (!opts.filter(id)) {
          return
        }
        this.addWatchFile(path.resolve(process.env.UNI_INPUT_DIR, 'pages.json'))
        getLocaleFiles(
          path.resolve(process.env.UNI_INPUT_DIR, 'locale')
        ).forEach((filepath) => {
          this.addWatchFile(filepath)
        })
        const pagesJson = normalizePagesJson(code, process.env.UNI_PLATFORM)
        pagesJson.pages.forEach((page) => {
          if (page.style.isNVue) {
            this.addWatchFile(
              path.resolve(process.env.UNI_INPUT_DIR, page.path + '.nvue')
            )
          }
        })
        if (renderer === 'native' && appService) {
          this.emitFile({
            fileName: APP_CONFIG_SERVICE,
            type: 'asset',
            source: normalizeAppConfigService(
              pagesJson,
              parseManifestJsonOnce(process.env.UNI_INPUT_DIR)
            ),
          })
          return {
            code: '',
            map: { mappings: '' },
          }
        }
        return {
          code: normalizeAppNVuePagesJson(pagesJson),
          map: { mappings: '' },
        }
      },
    }
  })
}