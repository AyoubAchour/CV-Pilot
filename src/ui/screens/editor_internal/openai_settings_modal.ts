export type BindOpenAiSettingsModalArgs = {
  root: HTMLElement;
};

type StatusMessage = {
  kind: "info" | "error" | "success";
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function bindOpenAiSettingsModal({ root }: BindOpenAiSettingsModalArgs): void {
  const openButton = root.querySelector<HTMLButtonElement>(
    '[data-action="openai-settings"]'
  );

  const open = async () => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4";

    const panel = document.createElement("div");
    panel.className = "w-full max-w-lg";
    overlay.appendChild(panel);

    let isBusy = false;
    let isLoadingStatus = true;
    let status: OpenAiStatus | null = null;
    let message: StatusMessage | null = null;

    let apiKeyDraft = "";
    let modelDraft = "";

    const cleanup = () => {
      overlay.remove();
    };

    const refreshStatus = async () => {
      try {
        status = await window.cvPilot.openaiGetStatus();
        modelDraft = status.model;
      } catch (err) {
        status = null;
        const raw = err instanceof Error ? err.message : "Failed to load OpenAI status.";
        const needsRestart = raw.includes("No handler registered") || raw.includes("openaiGetStatus");
        message = needsRestart
          ? {
              kind: "error",
              text:
                "The app's main process doesn't have the new OpenAI IPC handlers yet. Fully restart the Electron app (stop `npm start` and run it again), then reopen this modal.",
            }
          : { kind: "error", text: raw };
      }
    };

    const render = () => {
      const configured = status?.configured ?? false;
      const storageAvailable = status?.storageAvailable ?? true;
      const model = modelDraft || status?.model || "gpt-4o-mini";

      const canInteract = !isBusy && !isLoadingStatus;

      const presetModels = ["gpt-5.2", "gpt-5-mini", "gpt-4o-mini"] as const;
      const presetSet = new Set<string>(presetModels);
      const modelOptions = [
        ...presetModels.map((m) => ({ value: m, label: m })),
        ...(presetSet.has(model)
          ? []
          : [{ value: model, label: `Custom (stored): ${model}` }]),
      ];

      const messageHtml =
        message
          ? `<div class="mt-3 rounded border px-3 py-2 text-xs ${
              message.kind === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : message.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }">${escapeHtml(message.text)}</div>`
          : "";

      panel.innerHTML = `
        <div class="rounded-lg bg-white shadow-xl">
          <div class="border-b border-slate-200 px-5 py-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-slate-900">OpenAI Settings</div>
                <div class="mt-1 text-xs text-slate-600">Configure your OpenAI API key (stored securely on this machine).</div>
              </div>
              <button type="button" class="text-slate-500 hover:text-slate-800" data-action="close" aria-label="Close">✕</button>
            </div>
          </div>

          <div class="px-5 py-4">
            ${
              isLoadingStatus
                ? `<div class="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">Loading OpenAI status…</div>`
                : ""
            }

            <div class="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <div>Configured: <span class="font-semibold ${configured ? "text-emerald-700" : "text-rose-700"}">${configured ? "Yes" : "No"}</span></div>
              <div class="mt-0.5">Secure storage available: <span class="font-semibold ${storageAvailable ? "text-emerald-700" : "text-rose-700"}">${storageAvailable ? "Yes" : "No"}</span></div>
              <div class="mt-0.5">Default model: <span class="font-semibold text-slate-900">${escapeHtml(model)}</span></div>
            </div>

            ${
              storageAvailable
                ? ""
                : `<div class="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">Secure storage is not available on this system, so API keys cannot be saved. This must be fixed before using OpenAI.</div>`
            }

            <div class="mt-4 grid grid-cols-1 gap-3">
              <label class="block">
                <span class="text-xs font-medium text-slate-700">API key</span>
                <input
                  class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  type="password"
                  autocomplete="off"
                  placeholder="sk-..."
                  data-field="api-key"
                  ${!canInteract || !storageAvailable ? "disabled" : ""}
                />
                <div class="mt-1 text-[11px] text-slate-500">The key is never shown after saving.</div>
              </label>

              <label class="block">
                <span class="text-xs font-medium text-slate-700">Model</span>
                <select
                  class="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  data-field="model"
                  ${!canInteract ? "disabled" : ""}
                >
                  ${modelOptions
                    .map(
                      (opt) =>
                        `<option value="${escapeHtml(opt.value)}" ${
                          opt.value === model ? "selected" : ""
                        }>${escapeHtml(opt.label)}</option>`
                    )
                    .join("")}
                </select>
                <div class="mt-1 text-[11px] text-slate-500">Recommended: ${presetModels
                  .map((m) => escapeHtml(m))
                  .join(" · ")}</div>
              </label>
            </div>

            ${messageHtml}
          </div>

          <div class="border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-end gap-2">
            <button type="button" class="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50" data-action="close">Close</button>
            <button type="button" class="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60" data-action="test" ${
              !canInteract || !storageAvailable ? "disabled" : ""
            }>Test</button>
            <button type="button" class="border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60" data-action="clear" ${
              !canInteract || !configured ? "disabled" : ""
            }>Remove key</button>
            <button type="button" class="bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" data-action="save" ${
              !canInteract || !storageAvailable ? "disabled" : ""
            }>Save</button>
          </div>
        </div>
      `;

      panel.querySelectorAll<HTMLElement>("[data-action=close]").forEach((b) => {
        b.addEventListener("click", () => cleanup());
      });

      panel
        .querySelector<HTMLInputElement>("[data-field=api-key]")
        ?.addEventListener("input", (e) => {
          apiKeyDraft = (e.target as HTMLInputElement).value;
        });

      panel
        .querySelector<HTMLSelectElement>("[data-field=model]")
        ?.addEventListener("change", (e) => {
          modelDraft = (e.target as HTMLSelectElement).value;
        });

      panel
        .querySelector<HTMLElement>("[data-action=test]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;

          const apiKey = apiKeyDraft.trim();
          const modelValue = modelDraft.trim();

          isBusy = true;
          message = { kind: "info", text: "Testing OpenAI connection…" };
          render();

          try {
            const result = await window.cvPilot.openaiTest(
              apiKey
                ? { apiKey, model: modelValue.length > 0 ? modelValue : undefined }
                : { model: modelValue.length > 0 ? modelValue : undefined }
            );
            message = result.ok
              ? {
                  kind: "success",
                  text: `Test OK (${result.model}): ${result.message || "Connected."}`,
                }
              : {
                  kind: "error",
                  text: `Test failed (${result.model}): ${result.message || "Unknown error."}`,
                };
          } catch (err) {
            message = {
              kind: "error",
              text: err instanceof Error ? err.message : "OpenAI test failed.",
            };
          } finally {
            isBusy = false;
            render();
          }
        });

      panel
        .querySelector<HTMLElement>("[data-action=save]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;

          const apiKey = apiKeyDraft.trim();
          const modelValue = modelDraft.trim();

          // Allow updating model without re-entering the key if already configured.
          if (!apiKey && !configured && storageAvailable) {
            message = { kind: "error", text: "API key is required." };
            render();
            return;
          }

          isBusy = true;
          message = null;
          render();

          try {
            await window.cvPilot.openaiSetConfig(
              apiKey
                ? { apiKey, model: modelValue.length > 0 ? modelValue : undefined }
                : { model: modelValue.length > 0 ? modelValue : undefined }
            );
            apiKeyDraft = "";
            await refreshStatus();
            message = { kind: "success", text: "Saved OpenAI settings." };
          } catch (err) {
            message = {
              kind: "error",
              text: err instanceof Error ? err.message : "Failed to save OpenAI settings.",
            };
          } finally {
            isBusy = false;
            render();
          }
        });

      panel
        .querySelector<HTMLElement>("[data-action=clear]")
        ?.addEventListener("click", async () => {
          if (isBusy) return;

          const confirmed = window.confirm(
            "Remove the stored OpenAI API key from this machine?"
          );
          if (!confirmed) {
            return;
          }

          isBusy = true;
          message = null;
          render();

          try {
            await window.cvPilot.openaiClearConfig();
            apiKeyDraft = "";
            await refreshStatus();
            message = { kind: "success", text: "Cleared OpenAI settings." };
          } catch (err) {
            message = {
              kind: "error",
              text: err instanceof Error ? err.message : "Failed to clear OpenAI settings.",
            };
          } finally {
            isBusy = false;
            render();
          }
        });
    };

    // Render immediately (loading), then fetch status.
    render();
    document.body.appendChild(overlay);

    try {
      await refreshStatus();
    } finally {
      isLoadingStatus = false;
      render();
    }
  };

  const openFromEvent = () => {
    void open();
  };

  openButton?.addEventListener("click", openFromEvent);

  // Allow other modules (like the GitHub import modal) to request opening settings.
  window.addEventListener("cvpilot:openai-settings", openFromEvent);
}
