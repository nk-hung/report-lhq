# Camp Report App - Directory Structure

```
camp-report-app/
├── CLAUDE.md
├── DIRECTORY_STRUCTURE.md
├── samples/
│   └── (sample files for column structure reference)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts                          # App bootstrap, CORS, Swagger, ValidationPipe
│       ├── app.module.ts                    # Root module (Mongoose, Auth, Import, Report)
│       ├── common/
│       │   ├── interceptors/
│       │   │   └── response.interceptor.ts  # Wraps all responses in { data, message, statusCode }
│       │   └── guards/
│       │       └── jwt-auth.guard.ts        # JWT authentication guard
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts           # POST /api/auth/register, POST /api/auth/login
│       │   ├── auth.service.ts              # User registration, login, JWT token generation
│       │   ├── dto/
│       │   │   ├── register.dto.ts
│       │   │   └── login.dto.ts
│       │   ├── schemas/
│       │   │   └── user.schema.ts           # Mongoose User schema
│       │   └── strategies/
│       │       ├── jwt.strategy.ts          # Passport JWT strategy
│       │       └── local.strategy.ts        # Passport local strategy
│       ├── import/
│       │   ├── import.module.ts
│       │   ├── import.controller.ts         # POST /api/import/upload (multipart)
│       │   ├── import.service.ts            # Auto-detect XLSX/CSV for both files, parsing, data joining, DB insert
│       │   ├── dto/
│       │   │   └── upload-import.dto.ts
│       │   └── schemas/
│       │       ├── import-session.schema.ts # Mongoose ImportSession schema
│       │       └── import-record.schema.ts  # Mongoose ImportRecord schema
│       └── report/
│           ├── report.module.ts
│           ├── report.controller.ts         # GET /api/report/total, expend, revenue, compare(?sessionId)
│           │                                # DELETE /api/reset
│           └── report.service.ts            # Aggregation queries for reports
└── frontend/                                # React 18 + Vite + TypeScript
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── vite.config.ts                       # Vite config with Tailwind CSS plugin
    ├── index.html
    └── src/
        ├── main.tsx                         # App entry point
        ├── App.tsx                          # Router + QueryClient + ConfigProvider
        ├── index.css                        # Tailwind CSS imports
        ├── api/
        │   └── axios.ts                     # Axios instance, JWT interceptor, 401 redirect
        ├── hooks/
        │   ├── useAuth.ts                   # useLogin, useRegister, useLogout, isAuthenticated
        │   └── useReport.ts                 # useTotalReport, useCompareReport (TanStack Query)
        ├── pages/
        │   ├── LoginPage.tsx                # Login form → POST /api/auth/login
        │   ├── RegisterPage.tsx             # Register form → POST /api/auth/register
        │   ├── DashboardPage.tsx            # 3 stat cards (TCP, TDT, TLN) → GET /api/report/total
        │   ├── ImportPage.tsx               # Dual file upload (xlsx + csv) → POST /api/import/upload
        │   └── ReportPage.tsx               # Comparison table with day columns + session pagination → GET /api/report/compare
        ├── components/
        │   ├── AppLayout.tsx                # AntDesign Layout with Sider navigation
        │   └── ProtectedRoute.tsx           # Redirects to /login if no JWT token
        └── types/
            └── index.ts                     # TypeScript interfaces for API contracts
```
