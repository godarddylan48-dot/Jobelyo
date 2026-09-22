'use client';
import { track } from '@vercel/analytics';

export default function TrackedApplyLink({ href, title, city }) {
  return (
    <a
      className="jobDetailApply"
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => track('apply_click', {
        source: 'francetravail',
        job_title: String(title || '').slice(0, 100),
        city: String(city || '').slice(0, 80),
        placement: 'job_detail'
      })}
    >
      Postuler sur le site de l’annonce ↗
    </a>
  );
}
