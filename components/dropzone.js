"use client";

export function Dropzone({
  accept,
  title,
  subtitle,
  buttonLabel,
  onFileSelect,
  disabled,
  hint
}) {
  function handleInputChange(event) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    if (disabled) {
      return;
    }

    const selectedFile = event.dataTransfer.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }

  return (
    <label
      className={disabled ? "dropzone is-disabled" : "dropzone"}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="dropzone-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 4v12m0-12-4 4m4-4 4 4M5 17.5A2.5 2.5 0 0 0 7.5 20h9A2.5 2.5 0 0 0 19 17.5" />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {hint ? <span className="dropzone-hint">{hint}</span> : null}
      <span className="dropzone-button">{buttonLabel}</span>
      <input type="file" accept={accept} hidden onChange={handleInputChange} disabled={disabled} />
    </label>
  );
}
