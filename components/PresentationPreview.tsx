"use client";

import type { ReactNode } from "react";
import { ACADEMIC_LEVEL_LABELS } from "../types/presentation";
import type { NormalLikeContent, PrimeraClaseContent } from "../types/unir";

interface PresentationPreviewProps {
  content: PrimeraClaseContent | NormalLikeContent;
}

interface SlideCanvasProps {
  eyebrow: string;
  pageNumber: number;
  showLogo: boolean;
  dark?: boolean;
  children: ReactNode;
}

function SlideCanvas({ eyebrow, pageNumber, showLogo, dark = false, children }: SlideCanvasProps) {
  return (
    <article className="preview-slide" data-dark={dark}>
      {showLogo && <span className="preview-logo-badge">UNIR</span>}
      <span className="preview-eyebrow">{eyebrow}</span>
      <div className="preview-slide-body">{children}</div>
      <span className="preview-page-number">{String(pageNumber).padStart(2, "0")}</span>
    </article>
  );
}

export function PresentationPreview({ content }: PresentationPreviewProps) {
  const showLogo = content.institutionScope == null || content.institutionScope === "mexico";
  const caseStudyEyebrow = content.type === "primera-clase" ? "Caso práctico" : content.caseStudyEyebrow;
  let page = 0;
  const next = () => {
    page += 1;
    return page;
  };

  return (
    <div className="preview-deck" aria-label="Vista previa de la presentación" role="list">
      <SlideCanvas eyebrow={`${ACADEMIC_LEVEL_LABELS[content.academicLevel]} · ${content.durationMinutes} min`} pageNumber={next()} showLogo={showLogo} dark>
        <h3 className="preview-cover-title">{content.sessionTitle}</h3>
        <p className="preview-cover-subtitle">{content.learningObjective.statement}</p>
      </SlideCanvas>

      <SlideCanvas eyebrow="Agenda" pageNumber={next()} showLogo={showLogo}>
        <ul className="preview-agenda">
          {content.agenda.map((item, i) => (
            <li key={i}>
              <span className="preview-agenda-num">{i + 1}</span>
              <span className="preview-agenda-label">{item.label}</span>
              <span className="preview-agenda-min">{item.minutes} min</span>
            </li>
          ))}
        </ul>
      </SlideCanvas>

      <SlideCanvas eyebrow="Introducción" pageNumber={next()} showLogo={showLogo}>
        <p className="preview-body-text">{content.introduction}</p>
      </SlideCanvas>

      {content.type === "primera-clase" && (
        <SlideCanvas eyebrow="Docente" pageNumber={next()} showLogo={showLogo}>
          <p className="preview-body-text">
            <strong>{content.teacherName}</strong>
            <br />
            {content.teacherTitle}
          </p>
        </SlideCanvas>
      )}

      <SlideCanvas eyebrow={content.developmentCardsTitle} pageNumber={next()} showLogo={showLogo}>
        <div className="preview-card-grid">
          {content.developmentCards.map((card, i) => (
            <div key={i} className="preview-mini-card">
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </SlideCanvas>

      <SlideCanvas eyebrow={caseStudyEyebrow} pageNumber={next()} showLogo={showLogo} dark>
        <div className="preview-card-grid">
          {content.caseStudy.map((part, i) => (
            <div key={i} className="preview-mini-card preview-mini-card-dark">
              <strong>{part.label}</strong>
              <p>{part.body}</p>
            </div>
          ))}
        </div>
      </SlideCanvas>

      <SlideCanvas eyebrow="Cierre" pageNumber={next()} showLogo={showLogo}>
        <ul className="preview-conclusion">
          {content.conclusion.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <p className="preview-body-text preview-closing-question">{content.closingQuestion}</p>
      </SlideCanvas>
    </div>
  );
}
