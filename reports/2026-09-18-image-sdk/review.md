# 本地候选审查记录

日期：2026-09-18。范围：独立 PP-RotatedDetection 图片 SDK，本地0.1.0候选与发布准备。无远程仓库、模型Hub、npm或正式Demo发布。

## 结论

最终独立审查范围 `3173e33..e4ba486`：**Ready，可交付本地候选**。无剩余Critical或Important项。随后提交仅更新计划进度和审查/验收记录。

- runtime审查：缓存进度遗漏已由`8a9e4a0`修复，reading/miss/hit/invalid及完整性验证顺序三项回归通过，复审Approved。
- Demo/文档审查：`d2569da`符合本轮范围；`e4ba486`修复Vanilla运行中换图与Playwright超时参数两个minor，实浏览器与复审Approved。
- 评测审查：`ad0fcc9`修复旧comparison未绑定来源文件、在途取消测试触发过早两项P2。72项生命周期和证据篡改拒绝验证通过，复审Approved。
- 全分支审查：核对数学/资源/生命周期、公共API与Demo、打包资源、独立Paddle参考及发布边界。两份SDK构建摘要、三份对照来源绑定和脚本摘要一致，40项双路径比较及72生命周期记录通过。

完整质量/性能/浏览器/标准结果见[验收报告](README.md)。审查未把本地工作流存在等同远程配置或已发布，也未将390px布局扩大为手机验证。

## 非阻断后续改进

`scripts/evaluation/prepare_reference.py`接受`--upstream`目录，但尚未对整个上游源码身份加摘要锁；报告写入固定revision。因此未来复跑必须使用复现指南指定的固定源码快照，不能给任意目录再沿用固定版本声明。当前审查没有发现本次参考失真。下次扩展或重跑参考前，增加源码摘要锁或Git HEAD及相关文件状态验证。

该建议不影响现有固定模型、本次保存的张量/参考摘要或本地候选交付；它属于复现入口的后续加严项。

## 发布前必需工作

真实ModelScope/Hugging Face不可变资产、CORS/字节/SHA核验，填充清单并清除标准required失败；配置并回读远程仓库治理、发布npm与正式HTTPS Demo。当前本地标准仍为partial，详见standard-after.json。发布清单在docs/release-checklist.md。
