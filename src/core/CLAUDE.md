本目录只放纯函数。禁止 import 任何 Vue/Nuxt/DOM 或 content/ 下的数据文件。
所有数据（星座基线、题库、配置）以**参数**注入，不在此 import；这样函数可单测、可调参。
每个导出函数都要有对应 tests/*.test.ts 覆盖正常与边界。
改动公式时，先看 design/02_技术设计文档.md 第 5 节的默认参数与校准要求，再动手。
改完跑 tests/calibration.test.ts，确认异变率仍落在 15%–30%。
