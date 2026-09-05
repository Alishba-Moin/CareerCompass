/**
 * CareerCompass — Roadmap PDF Export
 *
 * Generates a branded PDF (white/gold/brown theme) with the student's
 * 4-week action plan, portfolio project, and readiness score.
 *
 * NOTE: Uses jsPDF's built-in Helvetica (Latin only). Urdu-script content
 * is NOT reliably supported — the PDF always exports in English regardless
 * of the app's current language setting.
 */
import { jsPDF } from 'jspdf';

// Theme colors (RGB 0–255)
const GOLD = [201, 162, 39];
const BROWN = [111, 78, 46];
const BROWN_DARK = [63, 46, 30];
const CREAM = [250, 246, 239];
const WHITE = [255, 255, 255];
const MOCHA = [122, 106, 88];

/** Draws a rounded rectangle (filled). */
function roundedRect(doc, x, y, w, h, r, fill) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

/** Draws a horizontal rule. */
function hr(doc, y, color, width) {
  const c = color || CREAM;
  const w = width || 190;
  doc.setDrawColor(c[0], c[1], c[2]);
  doc.setLineWidth(0.4);
  doc.line(10, y, 10 + w, y);
}

export function exportRoadmapPDF({ student, analysis }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth(); // page width ~210
  const margin = 10;
  const contentW = pw - margin * 2;
  let y = margin;

  const studentName = student?.name || 'Student';
  const safeName = studentName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '');
  const targetRole = analysis?.targetRole || analysis?.marketAnalysis?.role_title || 'Career Path';
  const weeks = analysis?.weeklyTasks || [];
  const project = analysis?.portfolioProject;
  const score = analysis?.readinessScore ?? student?.readiness_score ?? 0;

  // ── Header band ─────────────────────────────────────────
  roundedRect(doc, margin, y, contentW, 28, 3, GOLD);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CareerCompass', margin + 6, y + 11);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Career Roadmap Report', margin + 6, y + 18);

  // Score badge on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const scoreText = `${score}`;
  const scoreW = doc.getTextWidth(scoreText) + 12;
  roundedRect(doc, margin + contentW - scoreW - 4, y + 4, scoreW, 20, 2, WHITE);
  doc.setTextColor(BROWN_DARK[0], BROWN_DARK[1], BROWN_DARK[2]);
  doc.text(scoreText, margin + contentW - scoreW / 2 - 4, y + 17, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(MOCHA[0], MOCHA[1], MOCHA[2]);
  doc.text('/ 100', margin + contentW - scoreW / 2 - 4, y + 22, { align: 'center' });

  y += 34;

  // ── Student info ────────────────────────────────────────
  doc.setTextColor(BROWN_DARK[0], BROWN_DARK[1], BROWN_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(studentName, margin, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MOCHA[0], MOCHA[1], MOCHA[2]);
  doc.text(`Target Role: ${targetRole}`, margin, y + 11);

  const edu = student?.education_level || '';
  const stream = student?.stream_or_degree || '';
  if (edu || stream) {
    doc.text(`Education: ${edu}${stream ? ` — ${stream}` : ''}`, margin, y + 17);
  }

  y += 24;
  hr(doc, y, GOLD);
  y += 6;

  // ── 4-Week Action Plan ──────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BROWN_DARK);
  doc.text('4-Week Action Plan', margin, y + 4);
  y += 10;

  for (const week of weeks) {
    // Week header
    roundedRect(doc, margin, y, contentW, 8, 1.5, CREAM);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(BROWN[0], BROWN[1], BROWN[2]);
    const themeText = (week.theme || '').split('—')[0].trim();
    doc.text(`Week ${week.week}: ${themeText}`, margin + 4, y + 5.5);
    y += 12;

    // Tasks
    for (const task of (week.tasks || [])) {
      if (y > 265) {
        doc.addPage();
        y = margin;
      }
      const done = task.status === 'completed';
      const symbol = done ? '[x]' : '[ ]';
      doc.setFont('helvetica', done ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(done ? GOLD[0] : BROWN_DARK[0], done ? GOLD[1] : BROWN_DARK[1], done ? GOLD[2] : BROWN_DARK[2]);

      const taskText = task.text || '';
      const lines = doc.splitTextToSize(`${symbol}  ${taskText}`, contentW - 8);
      doc.text(lines, margin + 4, y + 4);
      y += lines.length * 4.5 + 2;
    }
    y += 3;
  }

  // ── Portfolio Project ───────────────────────────────────
  if (project) {
    if (y > 230) {
      doc.addPage();
      y = margin;
    }
    hr(doc, y, GOLD);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BROWN_DARK[0], BROWN_DARK[1], BROWN_DARK[2]);
    doc.text('Recommended Portfolio Project', margin, y + 4);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text(project.title || '', margin, y + 2);
    y += 8;

    if (project.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(MOCHA[0], MOCHA[1], MOCHA[2]);
      const descLines = doc.splitTextToSize(project.description, contentW - 4);
      doc.text(descLines, margin, y + 2);
      y += descLines.length * 4.5 + 4;
    }

    // Tech stack + metadata
    const meta = [];
    if (project.tech_stack?.length) meta.push(`Tech: ${project.tech_stack.join(', ')}`);
    if (project.estimated_duration) meta.push(`Duration: ~${project.estimated_duration}`);
    if (project.impact) meta.push(`Impact: ${project.impact}`);

    if (meta.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(BROWN[0], BROWN[1], BROWN[2]);
      doc.text(meta.join('    |    '), margin, y + 2);
      y += 8;
    }
  }

  // ── Footer ──────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(MOCHA[0], MOCHA[1], MOCHA[2]);
  doc.text(
    `CareerCompass — Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    pw / 2,
    pageH - 8,
    { align: 'center' }
  );
  doc.text('50% skills + 30% demand + 20% tasks', pw / 2, pageH - 4, { align: 'center' });

  // ── Save ────────────────────────────────────────────────
  doc.save(`CareerCompass-Roadmap-${safeName}.pdf`);
}
