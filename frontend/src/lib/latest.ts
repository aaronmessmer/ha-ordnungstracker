/**
 * Nur die Antwort auf die zuletzt gestellte Frage zählt. So überholt eine langsame, ältere
 * Antwort nie eine neuere – die Anzeige bleibt ruhig und flackert nicht.
 */
export class Latest {
  private seq = 0;

  /** `fn` ausführen; liefert `undefined`, wenn inzwischen eine neuere Anfrage gestartet wurde. */
  async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    const mine = ++this.seq;
    const result = await fn();
    return mine === this.seq ? result : undefined;
  }

  /** Laufende Anfragen verwerfen. */
  cancel(): void {
    this.seq++;
  }
}

/** Funktion verzögert aufrufen; jeder neue Aufruf setzt die Wartezeit zurück. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(timer);
  wrapped.flush = (...args: A) => {
    clearTimeout(timer);
    fn(...args);
  };
  return wrapped;
}
