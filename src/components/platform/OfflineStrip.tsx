export function OfflineStrip({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-600 text-white text-center text-sm py-2 px-4 shadow-md">
      Internet aloqasi yo‘q. Ma’lumotlar sinxronlanishi kechikishi mumkin — ulanish tiklangach qayta urinib
      ko‘ring.
    </div>
  );
}
