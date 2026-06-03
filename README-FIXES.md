# Summary of All Fixes for Rebuild

## 1. Database Fix
- Created `k8s/postgres-pv.yaml` - PersistentVolume for PostgreSQL (5Gi)
- Created `k8s/postgres-pvc.yaml` - PersistentVolumeClaim for PostgreSQL
- Created `k8s/postgres-deployment.yaml` - PostgreSQL 16-alpine deployment
- Created `k8s/postgres-service.yaml` - Service `postgres-service` on port 5432

To deploy: `kubectl apply -f k8s/postgres-pv.yaml -f k8s/postgres-pvc.yaml -f k8s/postgres-deployment.yaml -f k8s/postgres-service.yaml`

Then run Prisma migration: 
```
kubectl cp ./prisma ns-blogapp/$(kubectl get pod -n ns-blogapp -l app=blogapp -o jsonpath='{.items[0].metadata.name}'):/app/prisma
kubectl exec -n ns-blogapp deploy/blogapp-deployment -- npx prisma@5.22.0 db push --schema=/app/prisma/schema.prisma --skip-generate
```

## 2. Source Code Changes (all will be included in next Docker build)

### a) `src/app/api/auth/register/route.ts`
- Changed `emailVerified: null` → `emailVerified: new Date()` (auto-verify on registration)
- Removed verification token generation + email send logic
- Changed success message

### b) `src/app/api/posts/route.ts`
- Fixed: `categoryId: data.categoryId || null` → `categoryId: data.categoryId && data.categoryId !== "" ? data.categoryId : null`
- This prevents foreign key violation when category is not selected

### c) `src/components/layout/header.tsx`
- Added sign-out button in user avatar dropdown menu
- Added Profile link
- Added Dashboard link
- Uses existing `DropdownMenu` components

### d) `src/components/editor/post-editor.tsx`
- Fixed: Tiptap content was managed as local React state but not synced to react-hook-form. Added `setValue("content", content)` in a useEffect so the zod validation sees the rich text content during form submission.
- Added `content` to the form's `defaultValues`
- Removed redundant `content` override in `onSubmit` since it's now in the form data

## 3. Build & Deploy
```bash
docker build -t mokadir/blogapp:11 .
docker push mokadir/blogapp:11
kubectl set image -n ns-blogapp deployment/blogapp-deployment blogapp-container=mokadir/blogapp:11