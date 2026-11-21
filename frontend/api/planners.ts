import { api, type Planner } from "./core";

export function listPlanners() {
  return api<Planner[]>("/planners");
}

export function deletePlanner(id: string) {
  return api(`/planners/${encodeURIComponent(id)}`, undefined, "DELETE");
}

// Serialize full snapshots per planner so older writes cannot overwrite newer edits.
const saves = new Map<string, Promise<Planner>>();
const saveErrors = new Map<string, Error>();

export function savePlanner(planner: Planner): Promise<Planner> {
  const value = structuredClone(planner);
  const pending = (saves.get(value.id) ?? Promise.resolve())
    .catch(() => {})
    .then(() =>
      api<Planner>(
        `/planners/${encodeURIComponent(value.id)}`,
        { name: value.name, plans: value.plans },
        "PUT",
      ),
    );
  saves.set(value.id, pending);

  function settled(error?: Error) {
    if (saves.get(value.id) !== pending) return;
    saves.delete(value.id);
    if (error) saveErrors.set(value.id, error);
    else saveErrors.delete(value.id);
  }

  // Handle background saves without hiding rejection from an awaiting caller.
  // A rejection handler also avoids creating a rejected, unobserved finally promise.
  void pending.then(
    () => settled(),
    (cause: unknown) =>
      settled(
        cause instanceof Error
          ? cause
          : new Error("플래너를 저장하지 못했습니다. 다시 시도해주세요."),
      ),
  );
  return pending;
}

// Existing navigation/logout callers only wait for completion.
export async function flushSaves() {
  while (saves.size) await Promise.allSettled([...saves.values()]);
}

// Use before operations that require this planner's latest snapshot to be saved.
export async function flushPlannerSaves(id: string): Promise<void> {
  let pending = saves.get(id);
  while (pending) {
    await pending.catch(() => {});
    pending = saves.get(id);
  }
  const error = saveErrors.get(id);
  if (error) throw error;
}
