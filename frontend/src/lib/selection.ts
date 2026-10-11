/**
 * Mehrfachauswahl. Langes Drücken auf einen Eintrag startet sie; solange sie aktiv ist,
 * wählt Antippen aus und ab. Ist nichts mehr gewählt, endet sie von selbst.
 */
export class Selection {
  private ids = new Set<string>();
  active = false;

  get size(): number {
    return this.ids.size;
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  values(): string[] {
    return [...this.ids];
  }

  /** Lang gedrückt: Auswahl beginnen (oder den Eintrag zusätzlich wählen). */
  start(id: string): void {
    this.active = true;
    this.ids.add(id);
  }

  toggle(id: string): void {
    if (this.ids.has(id)) this.ids.delete(id);
    else this.ids.add(id);
    if (this.ids.size === 0) this.active = false;
  }

  selectAll(ids: string[]): void {
    this.active = ids.length > 0;
    this.ids = new Set(ids);
  }

  clear(): void {
    this.ids.clear();
    this.active = false;
  }

  /** Nach dem Neuladen: nicht mehr vorhandene Einträge aus der Auswahl nehmen. */
  retain(existing: string[]): void {
    const keep = new Set(existing);
    for (const id of [...this.ids]) if (!keep.has(id)) this.ids.delete(id);
    if (this.ids.size === 0) this.active = false;
  }
}
