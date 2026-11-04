"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import {
  filterWorkPhotos,
  workFilters,
  type WorkFilter,
  type WorkPhoto,
} from "@/lib/portfolio";

export default function WorkGallery({
  photos,
  children,
}: {
  photos: WorkPhoto[];
  children: React.ReactNode;
}) {
  const [filter, setFilter] = useState<WorkFilter>("todos");
  const [selected, setSelected] = useState<WorkPhoto | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const captionId = useId();
  const shown = filterWorkPhotos(photos, filter);

  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);

  function closePhoto() {
    setSelected(null);
    opener.current?.focus({ preventScroll: true });
  }

  return (
    <section
      className="section work-section"
      id="trabalhos"
      aria-labelledby={headingId}
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A ASSINATURA DO NOSSO CUIDADO</p>
            <h2 id={headingId}>Nossos Trabalhos</h2>
          </div>
          <p>Cortes, detalhes e transformações.</p>
        </div>
        <div
          className="work-filters"
          role="group"
          aria-label="Filtrar trabalhos"
        >
          {workFilters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          className="work-results"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {shown.length
            ? `${shown.length} ${shown.length === 1 ? "trabalho" : "trabalhos"}`
            : "Novas fotografias em breve."}
        </div>
        <div className="work-grid">
          {shown.map((photo) => (
            <figure key={photo.id} className="work-card">
              <button
                type="button"
                className="work-photo"
                aria-label={`Ampliar ${photo.title}`}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSelected(photo);
                }}
              >
                <img
                  src={photo.src!}
                  alt={photo.description}
                  width={900}
                  height={900}
                  loading="lazy"
                  decoding="async"
                />
                <span className="work-expand" aria-hidden="true">
                  <Expand size={18} />
                </span>
              </button>
              <figcaption>
                <h3>{photo.title}</h3>
                <p>{photo.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="work-booking">{children}</div>
      </div>
      {selected && (
        <dialog
          ref={dialog}
          className="work-lightbox"
          aria-label={selected.title}
          aria-describedby={captionId}
          onClose={closePhoto}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialog.current?.close();
          }}
        >
          <button
            type="button"
            className="work-close"
            aria-label="Fechar fotografia"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} />
          </button>
          <figure>
            <img src={selected.src!} alt={selected.description} />
            <figcaption id={captionId}>
              <strong>{selected.title}</strong>
              <p>{selected.description}</p>
            </figcaption>
          </figure>
        </dialog>
      )}
    </section>
  );
}
