# 拾光排版（Moment Grid）

朋友圈照片智能筛选、排序、排版与文案生成工具。

## 目录

- `apps/web`：React + TypeScript + Vite 前端
- `apps/api`：Java 21 + Spring Boot 后端
- `docs/superpowers/plans`：实施计划
- `plan.md`：产品和技术方案

## 环境要求

- Node.js 20+
- npm 10+
- Java 21
- Maven 3.9+

本机可以使用 IntelliJ IDEA 自带的 Java 21：

```powershell
$env:JAVA_HOME = 'D:\IntelliJ IDEA 2024.2.1\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

## 前端

```powershell
Set-Location apps/web
npm install
npm run dev
```

开发服务器会把 `/api` 代理到 `http://127.0.0.1:8080`，因此日常联调应先启动后端，再启动前端。

测试与构建：

```powershell
npm test -- --run
npm run build
```

## 端到端验证

第一次运行先安装 Chromium：

```powershell
Set-Location apps/web
npx playwright install chromium
```

之后一条命令会自动启动 Spring Boot 和 Vite，并跑完选片、推荐、重排、文案复制与 PNG 下载流程：

```powershell
$env:MOMENT_GRID_JAVA_HOME = 'D:\IntelliJ IDEA 2024.2.1\jbr'
npm run e2e
```

## 后端

```powershell
Set-Location apps/api
$env:JAVA_HOME = 'D:\IntelliJ IDEA 2024.2.1\jbr'
mvn spring-boot:run
```

测试：

```powershell
$env:JAVA_HOME = 'D:\IntelliJ IDEA 2024.2.1\jbr'
mvn test
```

前端开发服务器默认运行在 `http://localhost:5173`，后端默认运行在 `http://localhost:8080`。

## 当前 MVP 边界

- 原图只保留在浏览器会话中；后端接收尺寸、文件名等元数据，不上传图片内容。
- 推荐引擎标记为 `metadata-mvp-v1`，不会虚构人脸、闭眼、色温等尚未接入的视觉识别结果。
- PostgreSQL、Redis、MinIO 仅在 `docker-compose.yml` 的 `infra` profile 中预留，当前内存纵向切片无需启动它们。
- 如需试运行未来基础设施，可执行 `docker compose --profile infra up -d`；开发数据使用示例凭据，不得用于生产。
