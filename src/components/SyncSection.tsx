import { useEffect, useState } from "react";
import { Cloud, CloudOff, Download, Upload } from "lucide-react";
import { useApp } from "../state/AppContext";
import {
  clearPassphrase,
  getLastSyncedAt,
  isSyncConfigured,
  loadPassphrase,
  pullFromCloud,
  pushToCloud,
  savePassphrase,
} from "../lib/sync";
import { formatRelative } from "../lib/util";

export function SyncSection() {
  const { state, dispatch } = useApp();
  const [passphrase, setPassphrase] = useState<string>(loadPassphrase() ?? "");
  const [connected, setConnected] = useState<boolean>(loadPassphrase() !== null);
  const [busy, setBusy] = useState<"push" | "pull" | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(getLastSyncedAt());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmPull, setConfirmPull] = useState(false);

  useEffect(() => {
    setLastAt(getLastSyncedAt());
  }, [busy]);

  if (!isSyncConfigured()) {
    return (
      <section className="card p-4 space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <CloudOff className="w-4 h-4" /> Sync
        </h3>
        <p className="text-sm text-slate-500">
          Sync isn't configured for this build.
        </p>
      </section>
    );
  }

  const connect = () => {
    if (!passphrase.trim()) {
      setError("Pick a passphrase first.");
      return;
    }
    savePassphrase(passphrase);
    setConnected(true);
    setError(null);
    setInfo("Connected. Push to upload your data, or pull to load it from another device.");
  };

  const disconnect = () => {
    clearPassphrase();
    setConnected(false);
    setLastAt(null);
    setInfo("Sync disconnected.");
    setError(null);
  };

  const onPush = async () => {
    setBusy("push");
    setError(null);
    setInfo(null);
    try {
      await pushToCloud(passphrase, state);
      setInfo("Pushed.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const onPull = async () => {
    setBusy("pull");
    setError(null);
    setInfo(null);
    try {
      const result = await pullFromCloud(passphrase);
      if (!result) {
        setInfo("No cloud save found for this passphrase yet. Push from your other device first.");
        return;
      }
      dispatch({ type: "loadState", state: result.state });
      setInfo("Pulled. Local data replaced with cloud data.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      setConfirmPull(false);
    }
  };

  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Cloud className="w-4 h-4" /> Sync
      </h3>

      {!connected ? (
        <>
          <p className="text-sm text-slate-500">
            Pick a passphrase. Use the same passphrase on every device you want
            to share data with. Treat it like a password — anyone who guesses
            it can read and overwrite your data.
          </p>
          <input
            type="password"
            className="input"
            placeholder="Passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
          />
          <button className="btn-primary w-full" onClick={connect}>
            Connect this device
          </button>
        </>
      ) : (
        <>
          <div className="text-sm">
            <div className="text-slate-500">Connected with passphrase</div>
            <div className="font-mono">
              {"●".repeat(Math.min(passphrase.length, 12))}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Last synced:{" "}
              {lastAt ? formatRelative(lastAt) : "never"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary flex-1 min-w-[120px]"
              onClick={onPush}
              disabled={busy !== null}
            >
              <Upload className="w-4 h-4" />
              {busy === "push" ? "Pushing…" : "Push to cloud"}
            </button>
            <button
              className="btn-secondary flex-1 min-w-[120px]"
              onClick={() => setConfirmPull(true)}
              disabled={busy !== null}
            >
              <Download className="w-4 h-4" />
              {busy === "pull" ? "Pulling…" : "Pull from cloud"}
            </button>
          </div>

          <button
            className="btn-ghost text-xs text-slate-500"
            onClick={disconnect}
            disabled={busy !== null}
          >
            Disconnect this device
          </button>
        </>
      )}

      {confirmPull && (
        <div className="card p-3 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
          <p className="text-sm mb-2">
            Pulling will replace this device's data with whatever's in the cloud.
            This can't be undone. Continue?
          </p>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary" onClick={() => setConfirmPull(false)}>
              Cancel
            </button>
            <button
              className="btn-primary bg-red-500 text-white hover:bg-red-400"
              onClick={onPull}
            >
              Replace local data
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {info && !error && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{info}</p>
      )}
    </section>
  );
}
