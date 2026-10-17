# یادداشت‌های ساختاری پیاده‌سازی

- `src/components/token-map/` محل کامپوننت‌های رابط کاربری مربوط به Token Map است.
- `src/components/ui/` یک abstraction نازک روی UI Library است تا کامپوننت‌های Token Map مستقیماً به آن وابسته نباشند.
- Typeهای مشترک Token Map در `src/types/token-map.ts` تعریف می‌شوند و برای تعریف Typeها از `type` استفاده می‌کنیم.
- `src/components/selectVersion.tsx` از قبل وجود دارد و در مرحله‌ی پیاده‌سازی مجدداً استفاده یا migrate خواهد شد.
- این ساختار فقط مرزبندی اولیه‌ی فایل‌ها را مشخص می‌کند؛ جزئیات پیاده‌سازی در این مرحله تعیین نشده‌اند.
