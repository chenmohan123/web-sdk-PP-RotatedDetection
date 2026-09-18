# 发布检查清单

当前为0.1.0本地候选，未执行任何远程发布。根据标准模板逐项记录。

- [x] 中文默认README、英文README及双语七组指南。
- [x] 测试、类型检查、SDK与Demo构建、npm产物检查。
- [x] CI包含测试/类型/构建/模型身份检查；没有已上线CI记录声明。
- [x] 模型身份、SHA、许可依据、桌面验证条件和已知限制。
- [x] CHANGELOG与带门禁的Release/Pages工作流骨架。
- [ ] 上传ModelScope与Hugging Face，验证不可变revision、bytes、SHA及CORS。
- [ ] 填真实sources、assets，消除CONFIG-001。
- [ ] 远程GitHub/npm/在线Demo实际可达；目前只是计划地址。
- [ ] 默认分支Ruleset：PR、最新CI、会话解决、禁止删除/强推。
- [ ] v*标签Ruleset：禁止更新/删除；最小绕过权限。
- [ ] GitHub About、Homepage、topics与不可变GitHub Release。
- [ ] 受保护来源HTTPS部署、Actions Pages、github-pages环境、并发与最小权限。
- [ ] 通过远程API记录Ruleset、环境、部署标识、观测值和日期，不含凭据。
- [ ] 发布npm并验证安装；权重/评估图不得进入Git/npm/Demo。
- [ ] sdk:check无required失败，远程required全部验证后再宣称compliant。

本地候选不能因为workflow存在就声称发布完成。
