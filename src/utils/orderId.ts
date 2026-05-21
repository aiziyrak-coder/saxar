/** Django REST buyurtma ID (raqamli). Firestore ID — UUID/ boshqa format. */
export function isDjangoOrderId(id: string | number | undefined): boolean {
  if (id == null || id === '') return false;
  return /^\d+$/.test(String(id));
}
