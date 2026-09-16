# Plane for AI4MS 科研管理 P0 发布说明

| 项目     | 内容                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| 版本     | `2.0.1` → `2.1.0`（向下兼容的新功能，按次版本号递增）                              |
| 日期     | 2026-09-15                                                                         |
| 上游依据 | [`research-p0-development-prd.md`](./research-p0-development-prd.md)               |
| 评审依据 | [`research-p0-development-prd-review.md`](./research-p0-development-prd-review.md) |

## 1. 本版本交付范围

P0 十个开发阶段全部完成：

| 阶段  | 交付内容                                                   | 主要落点                                                       |
| ----- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| P0-A1 | 组织架构、成员角色、课题组主 PI、直接导师、审计底座        | `plane/db/models/research/org.py`、`audit.py`                  |
| P0-A2 | AI4MS OIDC 登录、身份映射与优先级、自动建号与冲突拒绝      | `authentication/provider/oauth/oidc.py`、`identity.py`         |
| P0-A3 | 科研 ACL：六级可见范围、只可收窄、自定义授权边界、开关分层 | `plane/research/utils/acl.py`、`config.py`                     |
| P0-A4 | 平台配置、报告模板、只读审计查询                           | `plane/research/views/settings.py`、`templates.py`、`audit.py` |
| P0-B1 | 个人科研 Project（一人一项目、归档/恢复、项目标识）        | `plane/db/models/research/project.py`                          |
| P0-C1 | 周报 / 月报闭环（周期、状态机、只读、退回原因、留痕）      | `plane/db/models/research/report.py`                           |
| P0-C2 | 图片 / PDF / Markdown 能力与 ACL 同权保护                  | `plane/research/utils/files.py`、`views/attachments.py`        |
| P0-C3 | 提交汇总看板与通知                                         | `plane/research/views/summary.py`、`utils/notifications.py`    |
| P0-D1 | 办公审批（复用 Issue、多级、或签/会签、逐级留痕）          | `plane/db/models/research/approval.py`                         |
| P0-E1 | 科研导航整合、通用回归、版本号同步、发布与回滚说明         | 本文档、侧边栏科研入口                                         |

数据库迁移新增 `0123` ~ `0130`，全部为新增表 / 新增可空字段 / 新增索引，无破坏性变更。

## 2. 环境变量清单（默认值即"未配置可安全运行"）

布尔开关在 `settings/common.py` 中按字符串比较，**只有 `1` 视为开启**，`0`、空值与其他写法均按关闭处理。

```env
# 科研模块全局开关（部署级，默认关闭）
RESEARCH_MODULE_ENABLED=0

# AI4MS OIDC（未配置时前端不渲染 SSO 入口，本地登录保持可用）
OIDC_ISSUER_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_REDIRECT_URI=
OIDC_SCOPES=openid profile email
OIDC_ENABLE_PKCE=1
OIDC_AUTO_PROVISION_USERS=0
OIDC_PROVIDER_NAME=ai4ms-oidc

# 科研附件限制（MB，可被 Workspace 配置覆盖）
RESEARCH_IMAGE_MAX_MB=20
RESEARCH_PDF_MAX_MB=100
RESEARCH_MARKDOWN_MAX_MB=5
```

约束：

- `OIDC_CLIENT_SECRET` 只存在于后端环境变量或密钥管理系统。
- 科研上传限制与 `FILE_SIZE_LIMIT` 完全隔离，普通附件、头像、封面行为不变。
- 请求体大小上限复用 `FILE_SIZE_LIMIT`（5MB），因此 Markdown 导入超过该值时由中间件返回 413。

## 3. 发布流程

```text
备份数据库
  → 执行迁移 0123 ~ 0130（可回滚）
  → 部署后端（RESEARCH_MODULE_ENABLED=0）
  → 部署前端（科研入口默认隐藏）
  → 冒烟：通用功能回归 + 科研接口不可用性（应返回 404 research_module_disabled）
  → 打开试点 Workspace 开关（PATCH /api/research/workspaces/<slug>/settings/ {"module_enabled": true}）
  → 业务方验收
  → 按批次扩大开关范围
```

打开 Workspace 开关时会自动为该工作区创建组织树根节点。

## 4. 回滚策略

| 问题类型     | 回滚动作                                                     |
| ------------ | ------------------------------------------------------------ |
| 科研功能异常 | 关闭对应 Workspace 或子模块开关，无需回滚代码（立即生效）    |
| 影响通用功能 | `RESEARCH_MODULE_ENABLED=0` 关闭全局开关，必要时回滚镜像     |
| 迁移升级失败 | `python manage.py migrate db 0122` 回滚到 P0 之前，恢复备份  |
| 身份登录异常 | 关闭 OIDC（`OIDC_*` 置空）使用本地登录，同时关闭科研入口     |
| 上传异常     | 关闭科研附件入口；`FILE_SIZE_LIMIT` 未变更，普通上传不受影响 |

## 5. 审计表加固（部署步骤，非迁移动作）

`research_audit_events` 在模型层禁止更新与删除。生产环境建议再回收数据库权限：

```sql
REVOKE UPDATE, DELETE ON research_audit_events FROM <app_role>;
```

开发与测试栈共用单一超级用户连接，因此该步骤以文档形式交付（见迁移 `0123` 顶部注释）。

## 6. 验证记录

| 验证项                    | 方式                                     | 结果                   |
| ------------------------- | ---------------------------------------- | ---------------------- |
| 科研模块自动化测试        | `pytest plane/tests/{unit,contract}`     | 见收尾提交记录（全绿） |
| 通用功能回归（§9.3 矩阵） | 既有测试套件 + 手工检查项                | 见 §7                  |
| 前端类型与构建            | `pnpm --filter=web check:types`、`build` | 见收尾提交记录         |
| 版本号一致性              | 全仓 `package.json` 统一为 `2.1.0`       | 通过                   |
| 硬编码人名检查            | 全仓检索科研模块文案与模型               | 无具体 PI 姓名         |

## 7. 通用功能回归矩阵执行说明

| 模块              | 回归手段                                           | 说明                            |
| ----------------- | -------------------------------------------------- | ------------------------------- |
| Workspace         | 既有契约测试                                       | 科研改动只新增路由与字段        |
| Project           | 既有契约测试 + 新增 `is_research_project` 字段断言 | 普通项目该字段恒为 `false`      |
| Work Item / Issue | 既有契约测试 + 审批不改写 Issue 历史               | 审批只推进状态                  |
| Page              | 既有契约测试 + 报告正文只读守卫                    | 非报告 Page 守卫立即返回 `None` |
| Cycle / Module    | 既有契约测试                                       | 未触及                          |
| 附件与文件        | 既有上传测试 + 科研独立限制测试                    | `FILE_SIZE_LIMIT` 未修改        |
| 通知              | 既有通知测试 + 科研通知 entity_name 隔离测试       | 科研通知不影响 Issue 通知       |
| 搜索              | 科研对象不进入全局搜索索引                         | P0 不注册科研搜索入口           |

## 8. 已知限制（P0 范围外）

- 报告正文编辑复用既有 Page 编辑器，报告详情页提供"打开正文"入口跳转；未在报告页内嵌编辑器组件。
- 报告**附件**（PDF / 图片 / Markdown）走科研独立限制；正文内嵌图片仍走既有编辑器 asset 通道，因此受
  `FILE_SIZE_LIMIT`（5MB）约束。这是 FILE-05（独立限制）与 FILE-08 / COMPAT-04（不改动原有上传行为）
  之间的取舍：为避免影响普通 Page 的既有上传行为，P0 未改写上游 asset 端点；如需正文图片放宽到 20MB，
  需在 P1 以"科研 Page 专用 asset 通道"方式实现。
- 摘要统计以"拥有进行中科研项目的成员"为应提交口径，未引入免交名单与补交时限。
- 审计提供查询，不提供导出与自动清理。
- Markdown 导入的本地图片需手工上传替换，远程图片保留外链。
