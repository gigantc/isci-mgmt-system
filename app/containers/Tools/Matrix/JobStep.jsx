import { JOB_RX } from "./jobRules";
import styles from "./Matrix.module.scss";

const JobStep = ({ job, setJob, brandId, setBrandId, campaign, setCampaign, year, setYear, years, brands, blocker, onNext }) => {
  const brand = brands.find((b) => b.id === brandId);
  const jobInvalid = job.trim() !== "" && !JOB_RX.test(job.trim());

  return (
    <div className={styles.card}>
      <header className={styles.cardHead}>
        <h2 className={styles.cardTitle}>Job</h2>
      </header>
      <p className={styles.helper}>The job number is written into the matrix and the client sets the ISCI prefix.</p>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="mx-job">Job number</label>
          <input
            id="mx-job"
            type="text"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="123456.01"
            className={jobInvalid ? styles.invalid : ""}
            aria-invalid={jobInvalid}
          />
          {jobInvalid && <span className={styles.fieldError}>Use six digits, a dot and two or three digits, like 123456.01.</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="mx-client">Client</label>
          <select id="mx-client" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">Select a client...</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
          {brand && <span className={styles.hint}>ISCI prefix <span className={styles.mono}>{brand.code}</span></span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="mx-campaign">Campaign (optional)</label>
          <input
            id="mx-campaign"
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Campaign name"
          />
          <span className={styles.hint}>Goes into the filenames when filled in.</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="mx-year">Year</label>
          <select id="mx-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className={styles.hint}>Sets the two digit year in the codes.</span>
        </div>
      </div>

      <div className={styles.actions}>
        {blocker && <span className={styles.reason}>{blocker}</span>}
        <button type="button" className="btn-primary" disabled={!!blocker} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
};

export default JobStep;
