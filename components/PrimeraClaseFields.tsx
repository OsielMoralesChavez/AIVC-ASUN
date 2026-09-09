"use client";

export interface PrimeraClaseFieldValues {
  teacherName: string;
  teacherTitle: string;
  teacherFormation: string;
  teacherExperience: string;
  teacherSpecialty: string;
  teacherContact: string;
  teamActivityDescription: string;
  teamActivityDueDate: string;
  individualActivityDescription: string;
  individualActivityDueDate: string;
  forumDescription: string;
}

interface PrimeraClaseFieldsProps {
  values: PrimeraClaseFieldValues;
  onChange: <K extends keyof PrimeraClaseFieldValues>(key: K, value: PrimeraClaseFieldValues[K]) => void;
}

export function PrimeraClaseFields({ values, onChange }: PrimeraClaseFieldsProps) {
  return (
    <div className="panel" style={{ marginTop: "1rem" }} aria-label="Datos de la primera clase">
      <h3 style={{ marginTop: 0 }}>Datos de la primera clase</h3>
      <p className="field-hint">
        Se usan en la presentación del docente, del curso y de las actividades. Puedes dejar campos vacíos: se
        marcarán como pendientes para completarlos después.
      </p>

      <div className="summary-grid">
        <div className="field-group">
          <label htmlFor="teacher-name">Nombre del docente</label>
          <input id="teacher-name" type="text" value={values.teacherName} onChange={(e) => onChange("teacherName", e.target.value)} />
        </div>
        <div className="field-group">
          <label htmlFor="teacher-title">Grado / cargo académico</label>
          <input id="teacher-title" type="text" value={values.teacherTitle} onChange={(e) => onChange("teacherTitle", e.target.value)} />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="teacher-formation">Formación académica</label>
        <input id="teacher-formation" type="text" value={values.teacherFormation} onChange={(e) => onChange("teacherFormation", e.target.value)} />
      </div>
      <div className="field-group">
        <label htmlFor="teacher-experience">Experiencia profesional</label>
        <input id="teacher-experience" type="text" value={values.teacherExperience} onChange={(e) => onChange("teacherExperience", e.target.value)} />
      </div>
      <div className="field-group">
        <label htmlFor="teacher-specialty">Áreas de especialidad</label>
        <input id="teacher-specialty" type="text" value={values.teacherSpecialty} onChange={(e) => onChange("teacherSpecialty", e.target.value)} />
      </div>
      <div className="field-group">
        <label htmlFor="teacher-contact">Contacto (correo institucional)</label>
        <input id="teacher-contact" type="text" value={values.teacherContact} onChange={(e) => onChange("teacherContact", e.target.value)} />
      </div>

      <div className="summary-grid">
        <div className="field-group">
          <label htmlFor="team-activity">Actividad en equipo</label>
          <textarea id="team-activity" rows={2} value={values.teamActivityDescription} onChange={(e) => onChange("teamActivityDescription", e.target.value)} />
        </div>
        <div className="field-group">
          <label htmlFor="team-activity-date">Fecha de entrega (equipo)</label>
          <input id="team-activity-date" type="text" placeholder="dd/mm/aaaa" value={values.teamActivityDueDate} onChange={(e) => onChange("teamActivityDueDate", e.target.value)} />
        </div>
      </div>

      <div className="summary-grid">
        <div className="field-group">
          <label htmlFor="individual-activity">Actividad individual</label>
          <textarea id="individual-activity" rows={2} value={values.individualActivityDescription} onChange={(e) => onChange("individualActivityDescription", e.target.value)} />
        </div>
        <div className="field-group">
          <label htmlFor="individual-activity-date">Fecha de entrega (individual)</label>
          <input id="individual-activity-date" type="text" placeholder="dd/mm/aaaa" value={values.individualActivityDueDate} onChange={(e) => onChange("individualActivityDueDate", e.target.value)} />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="forum-description">Descripción del foro «Pregúntale al profesor»</label>
        <textarea id="forum-description" rows={2} value={values.forumDescription} onChange={(e) => onChange("forumDescription", e.target.value)} />
      </div>
    </div>
  );
}
