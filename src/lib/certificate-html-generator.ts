import {
  DISABILITY_CONFIG, DOMAINS, ITEMS,
  type AuditTrail, type CertificateHeader, type DisabilityType, type ScoreDistribution,
} from './ifbra-types';

function fmt(n: number): string {
  return n.toLocaleString('pt-BR');
}

function distTableHtml(label: string, orig: ScoreDistribution, fuzzy: ScoreDistribution): string {
  const rows = [
    { label: 'Pontuação 25', oc: orig.count25, op: orig.points25, fc: fuzzy.count25, fp: fuzzy.points25 },
    { label: 'Pontuação 50', oc: orig.count50, op: orig.points50, fc: fuzzy.count50, fp: fuzzy.points50 },
    { label: 'Pontuação 75', oc: orig.count75, op: orig.points75, fc: fuzzy.count75, fp: fuzzy.points75 },
    { label: 'Pontuação 100', oc: orig.count100, op: orig.points100, fc: fuzzy.count100, fp: fuzzy.points100 },
  ];
  const origTotal = orig.count25 + orig.count50 + orig.count75 + orig.count100;
  const fuzzyTotal = fuzzy.count25 + fuzzy.count50 + fuzzy.count75 + fuzzy.count100;

  return `
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:11pt;">
  <thead>
    <tr>
      <th style="border:1px solid #999;padding:6px 10px;text-align:left;background:#f0f4f8;" colspan="5"><strong>${label}</strong></th>
    </tr>
    <tr style="background:#f7f9fb;">
      <th style="border:1px solid #999;padding:4px 10px;text-align:left;"></th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;" colspan="2">PERÍCIA</th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;" colspan="2">MATRIZ FUZZY</th>
    </tr>
    <tr style="background:#f7f9fb;font-size:10pt;">
      <th style="border:1px solid #999;padding:4px 10px;"></th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;">Itens</th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;">Pontos</th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;">Itens</th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;">Pontos</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(r => `
    <tr>
      <td style="border:1px solid #999;padding:4px 10px;font-weight:600;font-size:10pt;">${r.label}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${r.oc}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(r.op)}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${r.fc}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(r.fp)}</td>
    </tr>`).join('')}
    <tr style="background:#f0f4f8;font-weight:bold;">
      <td style="border:1px solid #999;padding:4px 10px;">TOTAL</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${origTotal}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(orig.total)}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fuzzyTotal}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(fuzzy.total)}</td>
    </tr>
  </tbody>
</table>`;
}

function fuzzyExplanationHtml(audit: AuditTrail, type: 'social' | 'medical'): string {
  const lines: string[] = [];
  for (const entry of audit.disabilities) {
    const side = type === 'social' ? entry.social : entry.medical;
    if (!side.fired) continue;
    for (const domain of side.domainsAffected) {
      if (domain.itemsChanged.length > 0) {
        const domainDef = DOMAINS.find(d => d.id === domain.domainId);
        const periLabel = type === 'social' ? 'social' : 'médica';
        lines.push(`<p>Nesta perícia ${periLabel}, houve a aplicação do Método Linguístico Fuzzy, uma vez que a pontuação ${domain.minScore} foi atribuída em itens do Domínio ${domainDef?.name ?? domain.domainName}, implicando sua repetição a todas as atividades pertencentes à área.</p>`);
      }
    }
  }
  return lines.join('\n');
}

export function generateCertificateHtml(
  header: CertificateHeader,
  audit: AuditTrail,
  selectedDisabilities: DisabilityType[],
): string {
  const parts: string[] = [];


  // Disability conditions
  if (selectedDisabilities.length > 0) {
    parts.push(`<p><strong>DEFICIÊNCIA E CONDIÇÕES:</strong></p>`);
    for (const d of selectedDisabilities) {
      const config = DISABILITY_CONFIG[d];
      const auditEntry = audit.disabilities.find(e => e.disability === d);
      if (!auditEntry) continue;
      parts.push(`<p><strong>${config.label}</strong></p>`);
      const scoreDetected = auditEntry.social.scoreConditionDetected || auditEntry.medical.scoreConditionDetected;
      parts.push(`<p>( ${scoreDetected ? 'X' : '&nbsp;&nbsp;'} ) ${config.scoreConditionText}</p>`);
      parts.push(`<p>( ${auditEntry.social.auxilio ? 'X' : '&nbsp;&nbsp;'} ) Não dispõe do auxílio de terceiros sempre que necessário.</p>`);
      parts.push(`<p>( ${auditEntry.social.emblematic ? 'X' : '&nbsp;&nbsp;'} ) ${config.emblematicQuestion}</p>`);
    }
  }

  // Social table
  parts.push(distTableHtml('PERÍCIA SOCIAL', audit.social.original, audit.social.fuzzy));
  parts.push(fuzzyExplanationHtml(audit, 'social'));

  // Medical table
  parts.push(distTableHtml('PERÍCIA MÉDICA', audit.medical.original, audit.medical.fuzzy));
  parts.push(fuzzyExplanationHtml(audit, 'medical'));

  // Summary table
  const fuzzyApplied = audit.combinedOriginal !== audit.combinedFuzzy;
  parts.push(`
<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:11pt;">
  <thead>
    <tr>
      <th style="border:1px solid #999;padding:6px 10px;text-align:left;background:#f0f4f8;" colspan="3"><strong>RESUMO DA PONTUAÇÃO</strong></th>
    </tr>
    <tr style="background:#f7f9fb;">
      <th style="border:1px solid #999;padding:4px 10px;text-align:left;"></th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;">PERÍCIA</th>
      <th style="border:1px solid #999;padding:4px 10px;text-align:center;">FUZZY</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border:1px solid #999;padding:4px 10px;font-weight:600;">PERÍCIA SOCIAL</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(audit.social.original.total)}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(audit.social.fuzzy.total)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #999;padding:4px 10px;font-weight:600;">PERÍCIA MÉDICA</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(audit.medical.original.total)}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(audit.medical.fuzzy.total)}</td>
    </tr>
    <tr style="background:#f0f4f8;font-weight:bold;">
      <td style="border:1px solid #999;padding:4px 10px;">TOTAL</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(audit.combinedOriginal)}</td>
      <td style="border:1px solid #999;padding:4px 10px;text-align:center;">${fmt(audit.combinedFuzzy)}</td>
    </tr>
  </tbody>
</table>`);

  // Classification
  const isInsuficienteFuzzy = audit.classificationFuzzy === 'Insuficiente';
  const isInsuficienteOrig = audit.classificationOriginal === 'Insuficiente';

  if (fuzzyApplied) {
    if (isInsuficienteFuzzy) {
      parts.push(`<p>A soma da pontuação das perícias alcança <strong>${fmt(audit.combinedFuzzy)}</strong> pontos, sendo insuficiente para enquadramento nos termos da Portaria Interministerial nº 1/2014.</p>`);
    } else {
      parts.push(`<p>A soma da pontuação das perícias alcança <strong>${fmt(audit.combinedFuzzy)}</strong> pontos dentro do método IF-BrA com aplicação do Modelo Linguístico Fuzzy, correspondendo à existência de uma "<strong>deficiência ${audit.classificationFuzzy.toLowerCase()}</strong>" (classificação conforme Portaria Interministerial nº 1/2014).</p>`);
    }
    if (audit.classificationOriginal !== audit.classificationFuzzy) {
      if (isInsuficienteOrig) {
        parts.push(`<p>Sem a aplicação do Modelo Fuzzy, a pontuação seria ${fmt(audit.combinedOriginal)} pontos, sendo insuficiente para enquadramento.</p>`);
      } else {
        parts.push(`<p>Sem a aplicação do Modelo Fuzzy, a pontuação seria ${fmt(audit.combinedOriginal)} pontos, correspondendo a "deficiência ${audit.classificationOriginal.toLowerCase()}".</p>`);
      }
    }
  } else {
    if (isInsuficienteOrig) {
      parts.push(`<p>A soma da pontuação das perícias alcança <strong>${fmt(audit.combinedOriginal)}</strong> pontos, sendo insuficiente para enquadramento nos termos da Portaria Interministerial nº 1/2014.</p>`);
    } else {
      parts.push(`<p>A soma da pontuação das perícias alcança <strong>${fmt(audit.combinedOriginal)}</strong> pontos, correspondendo à existência de uma "<strong>deficiência ${audit.classificationOriginal.toLowerCase()}</strong>" (classificação conforme Portaria Interministerial nº 1/2014).</p>`);
    }
  }

  parts.push(`<p>Era o que havia a certificar.</p>`);
  parts.push(`<p>Data: ${header.dataHora}</p>`);

  const bodyHtml = parts.join('\n');

  // Full HTML document for download
  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Certidão IFBrA${header.processo ? ` — ${header.processo}` : ''}</title>
<style>
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #000; }
  h2 { font-size: 14pt; }
  table { page-break-inside: avoid; }
  p { margin: 6px 0; }
  ul { margin: 6px 0 6px 20px; }
  @media print { body { margin: 0; padding: 20px; } }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  return fullHtml;
}

/** Returns only the inner HTML body content for clipboard / preview */
export function getCertificateBodyHtml(
  header: CertificateHeader,
  audit: AuditTrail,
  selectedDisabilities: DisabilityType[],
): string {
  const full = generateCertificateHtml(header, audit, selectedDisabilities);
  const match = full.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : full;
}

/** Generate single-report HTML for printing as PDF */
export function generateSingleReportHtml(
  type: 'social' | 'medical',
  scores: Record<string, number>,
  fuzzyScores: Record<string, number>,
  header: { processo: string; perito: string; data: string; orgao: string },
  auditInfo: { fuzzyApplied: boolean; domainsAffected: Array<{ domainName: string; minScore: number }>; totalOriginal: number; totalFuzzy: number },
): string {
  const periLabel = type === 'social' ? 'Perícia Social' : 'Perícia Médica';

  let tableRows = '';
  for (const domain of DOMAINS) {
    const domainItems = ITEMS.filter(i => i.domainId === domain.id);
    tableRows += `<tr style="background:#f0f4f8;"><td colspan="4" style="border:1px solid #999;padding:4px 10px;font-weight:bold;font-size:10pt;">${domain.id}. ${domain.name}</td></tr>`;
    for (const item of domainItems) {
      const s = scores[item.id] ?? '';
      const f = fuzzyScores[item.id] ?? '';
      const changed = s !== f;
      tableRows += `<tr>
        <td style="border:1px solid #999;padding:3px 8px;font-size:10pt;">${item.id}</td>
        <td style="border:1px solid #999;padding:3px 8px;font-size:10pt;">${item.name}</td>
        <td style="border:1px solid #999;padding:3px 8px;text-align:center;font-size:10pt;">${s}</td>
        <td style="border:1px solid #999;padding:3px 8px;text-align:center;font-size:10pt;${changed ? 'font-weight:bold;color:#0d6655;' : ''}">${f}</td>
      </tr>`;
    }
  }

  const domainsText = auditInfo.domainsAffected.length > 0
    ? auditInfo.domainsAffected.map(d => `${d.domainName} (minScore: ${d.minScore})`).join('; ')
    : 'Nenhum';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Laudo IFBrA — ${periLabel}${header.processo ? ` — ${header.processo}` : ''}</title>
<style>
  body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; max-width: 800px; margin: 30px auto; padding: 0 20px; color: #000; }
  table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
  h1 { font-size: 14pt; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 12pt; margin: 16px 0 8px; }
  .header-info { text-align: center; font-size: 10pt; color: #555; margin-bottom: 16px; }
  .footer-box { margin-top: 16px; padding: 12px; border: 1px solid #999; background: #f7f9fb; font-size: 10pt; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: bold; }
  .badge-applied { background: #d1fae5; color: #065f46; }
  .badge-not { background: #f3f4f6; color: #6b7280; }
  @media print { body { margin: 0; padding: 15px; } }
</style>
</head>
<body>
<h1>IFBrA — ${periLabel}</h1>
<div class="header-info">
  ${header.processo ? `Processo: ${header.processo} · ` : ''}${header.perito ? `Perito: ${header.perito} · ` : ''}${header.data ? `Data: ${header.data}` : ''}
  ${header.orgao ? `<br/>Órgão: ${header.orgao}` : ''}
</div>

<table>
  <thead>
    <tr style="background:#f0f4f8;">
      <th style="border:1px solid #999;padding:4px 8px;text-align:left;width:40px;">Item</th>
      <th style="border:1px solid #999;padding:4px 8px;text-align:left;">Atividade</th>
      <th style="border:1px solid #999;padding:4px 8px;text-align:center;width:80px;">Pontuação</th>
      <th style="border:1px solid #999;padding:4px 8px;text-align:center;width:80px;">Pontuação Ajustada</th>
    </tr>
  </thead>
  <tbody>
    ${tableRows}
  </tbody>
</table>

<div class="footer-box">
  <p><strong>Total (Perícia):</strong> ${fmt(auditInfo.totalOriginal)} &nbsp;&nbsp; <strong>Total (Fuzzy):</strong> ${fmt(auditInfo.totalFuzzy)}</p>
  <p>
    <span class="badge ${auditInfo.fuzzyApplied ? 'badge-applied' : 'badge-not'}">${auditInfo.fuzzyApplied ? 'Fuzzy aplicado' : 'Fuzzy não aplicado'}</span>
  </p>
  ${auditInfo.fuzzyApplied ? `<p><strong>Domínios sensíveis afetados:</strong> ${domainsText}</p>` : ''}
</div>
</body>
</html>`;
}
