import { Modal } from "./Modal";

export function IdleReloadModal({
  open,
  onReload,
  onStay,
}: {
  open: boolean;
  onReload: () => void;
  onStay: () => void;
}) {
  return (
    <Modal open={open} closable={false} title="This tab has been idle" size="sm">
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Another device may have updated your data while this tab was inactive.
          Reload to make sure you're working with the latest cloud copy.
        </p>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onStay}>
            Stay here
          </button>
          <button className="btn-primary" onClick={onReload}>
            Reload now
          </button>
        </div>
      </div>
    </Modal>
  );
}
