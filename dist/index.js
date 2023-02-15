import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: external "node:fs/promises"
const promises_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs/promises");
;// CONCATENATED MODULE: ./src/index.js


async function run() {
  console.log('Action lanzada 1')
  console.log(process.env.TEST_VAR)
  console.log('Action lanzada 2')
  // const file = await readFile('./src/file.md', 'utf-8')
  // console.log(file)
}

run()

