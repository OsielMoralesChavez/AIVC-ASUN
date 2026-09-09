"use client";

import type {
  AgendaItem,
  BloomObjective,
  CardContent,
  GlassPartContent,
  LinkResourceContent,
  StepContent,
} from "../../types/unir";

interface FieldProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
}

export function TextField({ label, value, onChange, id }: FieldProps<string> & { id: string }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, id, rows = 3 }: FieldProps<string> & { id: string; rows?: number }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function AgendaEditor({ items, onChange }: { items: AgendaItem[]; onChange: (items: AgendaItem[]) => void }) {
  const total = items.reduce((sum, item) => sum + (Number.isFinite(item.minutes) ? item.minutes : 0), 0);
  const update = (index: number, patch: Partial<AgendaItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  return (
    <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
      <legend className="field-legend">
        Agenda (suma actual: {total} min)
      </legend>
      {items.map((item, i) => (
        <div className="bullet-row" key={i}>
          <input
            aria-label={`Bloque ${i + 1}`}
            type="text"
            value={item.label}
            onChange={(e) => update(i, { label: e.target.value })}
            style={{ flex: 3 }}
          />
          <input
            aria-label={`Minutos del bloque ${i + 1}`}
            type="number"
            min={1}
            value={item.minutes}
            onChange={(e) => update(i, { minutes: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
        </div>
      ))}
    </fieldset>
  );
}

export function CardsEditor({
  title,
  onTitleChange,
  cards,
  onChange,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  cards: CardContent[];
  onChange: (cards: CardContent[]) => void;
}) {
  const update = (index: number, patch: Partial<CardContent>) => {
    const next = [...cards];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  return (
    <div className="field-group">
      <TextField id="cards-title" label="Título del bloque de tarjetas" value={title} onChange={onTitleChange} />
      <div className="option-grid">
        {cards.map((card, i) => (
          <div key={i} className="panel" style={{ padding: "0.75rem" }}>
            <TextField id={`card-title-${i}`} label={`Tarjeta ${i + 1} — título`} value={card.title} onChange={(v) => update(i, { title: v })} />
            <TextAreaField id={`card-body-${i}`} label="Contenido" value={card.body} onChange={(v) => update(i, { body: v })} rows={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepsEditor({
  title,
  onTitleChange,
  steps,
  onChange,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  steps: StepContent[];
  onChange: (steps: StepContent[]) => void;
}) {
  const update = (index: number, patch: Partial<StepContent>) => {
    const next = [...steps];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  const remove = (index: number) => {
    if (steps.length <= 3) return;
    onChange(steps.filter((_, i) => i !== index));
  };
  const add = () => {
    if (steps.length >= 5) return;
    onChange([...steps, { title: `Paso ${steps.length + 1}`, body: "" }]);
  };
  return (
    <div className="field-group">
      <TextField id="steps-title" label="Título del bloque de pasos" value={title} onChange={onTitleChange} />
      {steps.map((step, i) => (
        <div key={i} className="panel" style={{ padding: "0.75rem" }}>
          <div className="bullet-row">
            <input
              aria-label={`Paso ${i + 1} — título`}
              type="text"
              value={step.title}
              onChange={(e) => update(i, { title: e.target.value })}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-text" onClick={() => remove(i)} disabled={steps.length <= 3}>
              ×
            </button>
          </div>
          <textarea
            aria-label={`Paso ${i + 1} — descripción`}
            rows={2}
            value={step.body}
            onChange={(e) => update(i, { body: e.target.value })}
          />
        </div>
      ))}
      {steps.length < 5 && (
        <button type="button" className="btn btn-secondary" onClick={add}>
          <span className="btn-label" data-label="+ Agregar paso">
            + Agregar paso
          </span>
        </button>
      )}
    </div>
  );
}

export function GlassPartsEditor({
  eyebrow,
  onEyebrowChange,
  parts,
  onChange,
  showNotes = false,
}: {
  eyebrow: string;
  onEyebrowChange: (v: string) => void;
  parts: GlassPartContent[];
  onChange: (parts: GlassPartContent[]) => void;
  showNotes?: boolean;
}) {
  const update = (index: number, patch: Partial<GlassPartContent>) => {
    const next = [...parts];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  return (
    <div className="field-group">
      <TextField id="case-eyebrow" label="Etiqueta del bloque" value={eyebrow} onChange={onEyebrowChange} />
      {parts.map((part, i) => (
        <div key={i} className="field-group">
          <TextAreaField id={`case-part-${i}`} label={part.label} value={part.body} onChange={(v) => update(i, { body: v })} rows={3} />
          {showNotes && (
            <TextAreaField
              id={`case-part-note-${i}`}
              label={`Nota del presentador — ${part.label}`}
              value={part.note ?? ""}
              onChange={(v) => update(i, { note: v })}
              rows={2}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function PresenterNotesEditor<K extends string>({
  title = "Notas del presentador",
  hint = 'Cada nota debe empezar con "[nivel N · verbo] ..." (taxonomía de Bloom).',
  keys,
  labels,
  notes,
  onChange,
}: {
  title?: string;
  hint?: string;
  keys: readonly K[];
  labels: Record<K, string>;
  notes: Partial<Record<K, string>>;
  onChange: (notes: Partial<Record<K, string>>) => void;
}) {
  const update = (key: K, value: string) => {
    onChange({ ...notes, [key]: value });
  };
  return (
    <div className="panel" style={{ padding: "0.75rem" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="field-hint">{hint}</p>
      {keys.map((key) => (
        <TextAreaField
          key={key}
          id={`presenter-note-${key}`}
          label={labels[key]}
          value={notes[key] ?? ""}
          onChange={(v) => update(key, v)}
          rows={2}
        />
      ))}
    </div>
  );
}

export function LinksEditor({ links, onChange }: { links: LinkResourceContent[]; onChange: (links: LinkResourceContent[]) => void }) {
  const update = (index: number, patch: Partial<LinkResourceContent>) => {
    const next = [...links];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };
  // El esquema exige al menos 1 enlace (linkResourceSchema.min(1)); no se permite bajar de ahí.
  const remove = (index: number) => {
    if (links.length <= 1) return;
    onChange(links.filter((_, i) => i !== index));
  };
  const add = () => {
    if (links.length >= 5) return;
    onChange([...links, { name: "", description: "", verified: false }]);
  };
  return (
    <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
      <legend className="field-legend">Enlaces de interés</legend>
      {links.map((link, i) => (
        <div key={i} className="panel" style={{ padding: "0.75rem" }}>
          <div className="bullet-row">
            <input
              aria-label={`Enlace ${i + 1} — nombre`}
              type="text"
              placeholder="Nombre del recurso"
              value={link.name}
              onChange={(e) => update(i, { name: e.target.value })}
              style={{ flex: 2 }}
            />
            <input
              aria-label={`Enlace ${i + 1} — año`}
              type="number"
              placeholder="Año"
              value={link.year ?? ""}
              onChange={(e) => update(i, { year: e.target.value ? Number(e.target.value) : undefined })}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-text" onClick={() => remove(i)} disabled={links.length <= 1}>
              ×
            </button>
          </div>
          <textarea
            aria-label={`Enlace ${i + 1} — descripción`}
            rows={2}
            placeholder="Qué resuelve este recurso"
            value={link.description}
            onChange={(e) => update(i, { description: e.target.value })}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem" }}>
            <input type="checkbox" checked={link.verified} onChange={(e) => update(i, { verified: e.target.checked })} />
            Verificado
          </label>
        </div>
      ))}
      {links.length < 5 && (
        <button type="button" className="btn btn-secondary" onClick={add}>
          <span className="btn-label" data-label="+ Agregar enlace">
            + Agregar enlace
          </span>
        </button>
      )}
    </fieldset>
  );
}

export function StringListEditor({
  label,
  items,
  onChange,
  max,
  min = 0,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  max?: number;
  min?: number;
}) {
  const update = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const remove = (index: number) => {
    if (items.length <= min) return;
    onChange(items.filter((_, i) => i !== index));
  };
  const add = () => onChange([...items, ""]);
  return (
    <fieldset className="field-group" style={{ border: "none", padding: 0 }}>
      <legend className="field-legend">{label}</legend>
      {items.map((item, i) => (
        <div className="bullet-row" key={i}>
          <textarea
            aria-label={`${label} ${i + 1}`}
            rows={2}
            value={item}
            onChange={(e) => update(i, e.target.value)}
          />
          <button type="button" className="btn btn-text" onClick={() => remove(i)} disabled={items.length <= min}>
            ×
          </button>
        </div>
      ))}
      {(!max || items.length < max) && (
        <button type="button" className="btn btn-secondary" onClick={add}>
          <span className="btn-label" data-label="+ Agregar">
            + Agregar
          </span>
        </button>
      )}
    </fieldset>
  );
}

const BLOOM_LEVEL_LABELS: Record<number, string> = {
  1: "1 · Recordar",
  2: "2 · Comprender",
  3: "3 · Aplicar",
  4: "4 · Analizar",
  5: "5 · Evaluar",
  6: "6 · Crear",
};

export function BloomEditor({ objective, onChange }: { objective: BloomObjective; onChange: (o: BloomObjective) => void }) {
  return (
    <div className="field-group">
      <span className="field-legend">Objetivo de aprendizaje (taxonomía de Bloom)</span>
      <div className="summary-grid">
        <div className="field-group">
          <label htmlFor="bloom-level">Nivel</label>
          <select
            id="bloom-level"
            value={objective.level}
            onChange={(e) => onChange({ ...objective, level: Number(e.target.value) as BloomObjective["level"] })}
          >
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <option key={level} value={level}>
                {BLOOM_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>
        <TextField id="bloom-verb" label="Verbo observable" value={objective.verb} onChange={(v) => onChange({ ...objective, verb: v })} />
      </div>
      <TextAreaField
        id="bloom-statement"
        label="Enunciado completo"
        value={objective.statement}
        onChange={(v) => onChange({ ...objective, statement: v })}
        rows={2}
      />
    </div>
  );
}
