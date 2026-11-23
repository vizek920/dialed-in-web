const SPARKLE_PATH = 'M12 0C13 7 17 11 24 12 17 13 13 17 12 24 11 17 7 13 0 12 7 11 11 7 12 0Z';

function Sparkle({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={`sparkle ${className}`} aria-hidden="true">
      <path d={SPARKLE_PATH} fill="#CFEAFF" />
    </svg>
  );
}

// خلفية الموقع الشتوية: شفق قطبي + ثلج متساقط + جبال + نجوم متلألئة
export default function Backdrop() {
  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <div className="aurora aurora--teal" />
        <div className="aurora aurora--violet" />
        <div className="aurora aurora--blue" />
        <div className="snow" />
      </div>

      <Sparkle className="sparkle--1" />
      <Sparkle className="sparkle--2" />
      <Sparkle className="sparkle--3" />
      <Sparkle className="sparkle--4" />

      <svg className="mountains" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 220V120L120 60L230 130L360 40L520 140L650 80L800 150L960 50L1100 130L1240 70L1440 140V220Z"
          fill="var(--mountain-1)"
        />
        <path
          d="M100 76L120 60L142 78L130 73L120 81L110 73Z M335 62L360 40L388 66L372 60L360 70L348 60Z M936 72L960 50L986 74L972 68L960 78L948 68Z M1222 88L1240 70L1260 90L1248 85L1240 92L1232 85Z"
          fill="#DCEBFF"
          opacity=".85"
        />
        <path
          d="M0 220V170L180 120L340 175L520 135L700 185L900 130L1100 180L1280 140L1440 175V220Z"
          fill="var(--mountain-2)"
        />
        <path
          d="M36 205L50 150L64 205Z M106 205L120 150L134 205Z M196 205L210 150L224 205Z M1166 205L1180 150L1194 205Z M1246 205L1260 150L1274 205Z M1316 205L1330 150L1344 205Z M1386 205L1400 150L1414 205Z"
          fill="var(--mountain-3)"
        />
      </svg>
    </>
  );
}
