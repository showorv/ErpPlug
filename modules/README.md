# modules

Business modules (the Lego blocks). Each lives in `modules/<key>/` with the same shape:

```
manifest.ts   prisma/   api/   domain/   contracts/   listeners/   hooks/   web/
```

New module = copy `modules/notes` (Uday's reference module) and rename.

| Module            | Owner   | Built in |
| ----------------- | ------- | -------- |
| notes (reference) | Uday    | Phase 0  |
| contacts          | Showrov | Phase 3  |
| products          | Showrov | Phase 3  |
| sales             | Showrov | Phase 3  |
| purchase          | Showrov | Phase 3  |
| accounting        | Uday    | Phase 3  |
| inventory         | Uday    | Phase 3  |
