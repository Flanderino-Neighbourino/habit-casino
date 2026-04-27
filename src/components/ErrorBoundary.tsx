import { Component, type ReactNode } from "react";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    console.error("App error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen p-6 flex items-center justify-center">
          <div className="card p-6 max-w-xl w-full space-y-3">
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400">
              Something broke.
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The app hit an error while rendering. The details below help debug.
              You can usually recover by clearing storage and reloading.
            </p>
            <pre className="text-xs p-3 bg-slate-100 dark:bg-slate-800 rounded overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
              <button
                className="btn-primary bg-red-500 text-white hover:bg-red-400"
                onClick={() => {
                  try {
                    localStorage.removeItem("habitCasino");
                  } catch {
                    // ignore
                  }
                  window.location.reload();
                }}
              >
                Wipe storage & reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
