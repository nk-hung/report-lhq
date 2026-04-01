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
│       ├── app.module.ts                    # Root module (Mongoose, Auth, Import, Report, etc.)
│       ├── common/
│       │   ├── interceptors/
│       │   │   └── response.interceptor.ts  # Wraps all responses in { data, message, statusCode }
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts        # JWT authentication guard
│       │   │   └── roles.guard.ts           # Role-based authorization guard (checks 'roles' metadata)
│       │   ├── decorators/
│       │   │   └── roles.decorator.ts       # @Roles() decorator to set required roles on endpoints
│       │   └── middleware/
│       │       └── request-logger.middleware.ts  # Logs HTTP requests (method, url, status, duration)
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts           # POST /api/auth/register (superadmin only)
│       │   │                                # POST /api/auth/login
│       │   │                                # GET /api/auth/users (superadmin only)
│       │   │                                # DELETE /api/auth/users/:id (superadmin only)
│       │   ├── auth.service.ts              # User registration, login, JWT token generation
│       │   │                                # Seeds superadmin (admin/admin123) on first startup
│       │   │                                # getUsers, deleteUser (cannot delete superadmin)
│       │   ├── dto/
│       │   │   ├── register.dto.ts
│       │   │   └── login.dto.ts
│       │   ├── schemas/
│       │   │   └── user.schema.ts           # Mongoose User schema (username, password, role)
│       │   └── strategies/
│       │       ├── jwt.strategy.ts          # Passport JWT strategy (returns userId, username, role)
│       │       └── local.strategy.ts        # Passport local strategy
│       ├── import/
│       │   ├── import.module.ts
│       │   ├── import.controller.ts         # POST /api/import/upload (multipart)
│       │   │                                # GET /api/import/sessions (list sessions with recordCount)
│       │   │                                # DELETE /api/import/sessions/:id (delete + recalc order)
│       │   ├── import.service.ts            # Auto-detect XLSX/CSV, parsing, data joining, DB insert
│       │   │                                # getSessions: list sessions sorted by importDate DESC
│       │   │                                # deleteSession: remove session + records, recalc importOrder
│       │   ├── dto/
│       │   │   └── upload-import.dto.ts
│       │   └── schemas/
│       │       ├── import-session.schema.ts # Mongoose ImportSession schema
│       │       └── import-record.schema.ts  # Mongoose ImportRecord schema
│       ├── report/
│       │   ├── report.module.ts
│       │   ├── report.controller.ts         # GET /api/report/total, expend, revenue, compare(?sessionId)
│       │   │                                # DELETE /api/reset
│       │   └── report.service.ts            # Aggregation queries for reports
│       ├── saved-products/
│       │   ├── saved-products.module.ts
│       │   ├── saved-products.controller.ts # POST /api/saved-products, GET (with ?folderId filter),
│       │   │                                # PATCH :subId2/move, DELETE :subId2
│       │   ├── saved-products.service.ts    # Save, list, move between folders, remove saved products
│       │   ├── dto/
│       │   │   └── create-saved-product.dto.ts  # subId2 + optional folderId
│       │   └── schemas/
│       │       └── saved-product.schema.ts  # Mongoose SavedProduct schema (userId, subId2, folderId)
│       ├── product-folders/
│       │   ├── product-folders.module.ts
│       │   ├── product-folders.controller.ts # POST /api/product-folders, GET, PATCH :id, DELETE :id
│       │   ├── product-folders.service.ts    # Create, list, update, delete product folders
│       │   ├── dto/
│       │   │   ├── create-folder.dto.ts      # name (required, min 1 char, trimmed)
│       │   │   └── update-folder.dto.ts      # name (required, min 1 char, trimmed)
│       │   └── schemas/
│       │       └── product-folder.schema.ts  # Mongoose ProductFolder schema (userId, name, unique index)
│       └── user-preferences/
│           ├── user-preferences.module.ts
│           ├── user-preferences.controller.ts
│           ├── user-preferences.service.ts
│           ├── dto/
│           │   └── update-highlighted-sub-ids.dto.ts
│           └── schemas/
│               └── user-preference.schema.ts
└── frontend/                                # React 19 + Vite 8 + TypeScript
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
        │   ├── useAuth.ts                   # useLogin, useLogout, isAuthenticated, isSuperAdmin, getUsername, useCreateUser, useUsers, useDeleteUser
        │   ├── useReport.ts                 # useTotalReport, useCompareReport (TanStack Query)
        │   ├── useHighlight.ts              # useHighlight - manage highlighted subId2s
        │   ├── useSavedProducts.ts          # useSavedProducts - CRUD + move with folder support
        │   └── useProductFolders.ts         # useProductFolders - CRUD product folders
        ├── pages/
        │   ├── LoginPage.tsx                # Login form → POST /api/auth/login
        │   ├── AdminUsersPage.tsx           # User management (superadmin only) - create, list, delete users
        │   ├── DashboardPage.tsx            # 3 stat cards (TCP, TDT, TLN) → GET /api/report/total
        │   ├── ImportPage.tsx               # Dual file upload (xlsx + csv) → POST /api/import/upload
        │   ├── ReportPage.tsx               # Comparison table + save to folder modal
        │   └── SavedProductsPage.tsx        # Tabs-based folder view for saved products
        ├── components/
        │   ├── AppLayout.tsx                # AntDesign Layout with Sider navigation
        │   ├── ProtectedRoute.tsx           # Redirects to /login if no JWT token
        │   ├── SavedProductsPanel.tsx       # List saved products with stats, move, unsave
        │   └── SaveFolderModal.tsx          # Modal to pick folder when saving a product
        └── types/
            └── index.ts                     # TypeScript interfaces for API contracts
```
