import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface IdleSessionDialogProps {
  open: boolean;
  onContinue: () => void;
}

export function IdleSessionDialog({ open, onContinue }: IdleSessionDialogProps) {
  return (
    <Modal isOpen={open} onClose={onContinue} title="Sessiya faolligi" size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Uzoq vaqt harakat sezilmadi. Davom etishni tasdiqlang — aks holda xavfsizlik uchun keyinroq qayta
        kiring.
      </p>
      <Button type="button" variant="primary" className="w-full justify-center" onClick={onContinue}>
        Davom etaman
      </Button>
    </Modal>
  );
}
