import { api, type Planner } from "./core";

export function listPlanners() {
  return api<Planner[]>("/planners");
}

export function deletePlanner(id: string) {
  return api(`/planners/${encodeURIComponent(id)}`, undefined, "DELETE");
}

// Serialize writes per planner so an older in-flight save cannot overwrite a newer edit.
const saves = new Map<string, Promise<unknown>>();
export function savePlanner(planner: Planner) {
  const value = structuredClone(planner);
  const pending = (saves.get(value.id) ?? Promise.resolve())
    .catch(() => {})
    .then(() =>
      api<Planner>(
        `/planners/${encodeURIComponent(value.id)}`,
        { name: value.name, plans: value.plans },
        "PUT",
      ),
    )
    .catch(() => {});
  saves.set(value.id, pending);
  void pending.finally(() => {
    if (saves.get(value.id) === pending) saves.delete(value.id);
  });
  return pending;
}

export async function flushSaves() {
  while (saves.size) await Promise.all([...saves.values()]);
}

export function saveFavorite(id: string, isFavorite: boolean) {
  return api<Pick<Planner, "is_favorite">>(
    `/planners/${encodeURIComponent(id)}/favorite`,
    { is_favorite: isFavorite },
    "PUT",
  );
}
