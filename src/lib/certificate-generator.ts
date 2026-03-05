import {
  DISABILITY_CONFIG, DOMAINS,
  type AuditTrail, type CertificateHeader, type DisabilityType, type ScoreDistribution,
} from './ifbra-types';

function pad(str: string, len: number, right = false): string {
  if (right) return str.padEnd(len);
  return str.padStart(len);
}

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

function distTable(label: string, orig: ScoreDistribution, fuzzy: ScoreDistribution): string {
  const lines: string[] = [];
  const h1 = label;
  lines.push(`${pad(h1, 30, true)} ${'PERÍCIA'.padEnd(16)} MATRIZ FUZZY`);
  lines.push(`${''.padEnd(30)} ${'Itens'.padEnd(7)} ${'Pontos'.padEnd(9)} ${'Itens'.padEnd(7)} Pontos`);
  lines.push('-'.repeat(68));

  const rows: Array<{ label: string; origCount: number; origPts: number; fuzzyCount: number; fuzzyPts: number }> = [
    { label: 'PONTUAÇÃO 25', origCount: orig.count25, origPts: orig.points25, fuzzyCount: fuzzy.count25, fuzzyPts: fuzzy.points25 },
    { label: 'PONTUAÇÃO 50', origCount: orig.count50, origPts: orig.points50, fuzzyCount: fuzzy.count50, fuzzyPts: fuzzy.points50 },
    { label: 'PONTUAÇÃO 75', origCount: orig.count75, origPts: orig.points75, fuzzyCount: fuzzy.count75, fuzzyPts: fuzzy.points75 },
    { label: 'PONTUAÇÃO 100', origCount: orig.count100, origPts: orig.points100, fuzzyCount: fuzzy.count100, fuzzyPts: fuzzy.points100 },
  ];

  for (const r of rows) {
    lines.push(
      `${pad(r.label, 30, true)} ${pad(String(r.origCount), 7)} ${pad(formatNumber(r.origPts), 9)} ${pad(String(r.fuzzyCount), 7)} ${pad(formatNumber(r.fuzzyPts), 7)}`
    );
  }
  lines.push('-'.repeat(68));
  const origTotal = orig.count25 + orig.count50 + orig.count75 + orig.count100;
  const fuzzyTotal = fuzzy.count25 + fuzzy.count50 + fuzzy.count75 + fuzzy.count100;
  lines.push(
    `${pad('TOTAL', 30, true)} ${pad(String(origTotal), 7)} ${pad(formatNumber(orig.total), 9)} ${pad(String(fuzzyTotal), 7)} ${pad(formatNumber(fuzzy.total), 7)}`
  );

  return lines.join('\n');
}

export function generateCertificate(
  header: CertificateHeader,
  audit: AuditTrail,
  selectedDisabilities: DisabilityType[],
): string {
  const lines: string[] = [];

  

  // Disability conditions
  if (selectedDisabilities.length > 0) {
    lines.push('DEFICIÊNCIA E CONDIÇÕES:');
    lines.push('');
    for (const d of selectedDisabilities) {
      const config = DISABILITY_CONFIG[d];
      const auditEntry = audit.disabilities.find(e => e.disability === d);
      if (!auditEntry) continue;

      lines.push(config.label);
      lines.push('');
      // Score condition (use social as representative, but both are checked)
      const scoreDetected = auditEntry.social.scoreConditionDetected || auditEntry.medical.scoreConditionDetected;
      lines.push(`( ${scoreDetected ? 'X' : ' '} ) ${config.scoreConditionText}`);
      lines.push(`( ${auditEntry.social.auxilio ? 'X' : ' '} ) Não dispõe do auxílio de terceiros sempre que necessário.`);
      lines.push(`( ${auditEntry.social.emblematic ? 'X' : ' '} ) ${config.emblematicQuestion}`);
      lines.push('');
    }
  }

  // Social table
  lines.push(distTable('PERÍCIA SOCIAL', audit.social.original, audit.social.fuzzy));
  lines.push('');

  // Social fuzzy explanation
  let socialFuzzyApplied = false;
  for (const entry of audit.disabilities) {
    if (!entry.social.fired) continue;
    for (const domain of entry.social.domainsAffected) {
      if (domain.itemsChanged.length > 0) {
        socialFuzzyApplied = true;
        const domainDef = DOMAINS.find(d => d.id === domain.domainId);
        lines.push(`Nesta perícia social, houve a aplicação do Método Linguístico Fuzzy, uma vez que a pontuação ${domain.minScore} foi atribuída em itens do Domínio ${domainDef?.name ?? domain.domainName}, implicando sua repetição a todas as atividades pertencentes à área.`);
      }
    }
  }
  if (!socialFuzzyApplied) {
    lines.push('Modelo Fuzzy de ajuste de pontuação não aplicado, porque não atendida nenhuma das condições acima.');
  }
  lines.push('');

  // Medical table
  lines.push(distTable('PERÍCIA MÉDICA', audit.medical.original, audit.medical.fuzzy));
  lines.push('');

  // Medical fuzzy explanation
  let medicalFuzzyApplied = false;
  for (const entry of audit.disabilities) {
    if (!entry.medical.fired) continue;
    for (const domain of entry.medical.domainsAffected) {
      if (domain.itemsChanged.length > 0) {
        medicalFuzzyApplied = true;
        const domainDef = DOMAINS.find(d => d.id === domain.domainId);
        lines.push(`Nesta perícia médica, houve a aplicação do Método Linguístico Fuzzy, uma vez que a pontuação ${domain.minScore} foi atribuída em itens do Domínio ${domainDef?.name ?? domain.domainName}, implicando sua repetição a todas as atividades pertencentes à área.`);
      }
    }
  }
  if (!medicalFuzzyApplied) {
    lines.push('Modelo Fuzzy de ajuste de pontuação não aplicado, porque não atendida nenhuma das condições acima.');
  }
  lines.push('');

  // Summary
  lines.push('RESUMO DA PONTUAÇÃO:');
  lines.push('');
  lines.push(`${''.padEnd(35)} ${'PERÍCIA'.padEnd(12)} FUZZY`);
  lines.push('-'.repeat(55));
  lines.push(`${pad('PERÍCIA SOCIAL', 35, true)} ${pad(formatNumber(audit.social.original.total), 12)} ${formatNumber(audit.social.fuzzy.total)}`);
  lines.push(`${pad('PERÍCIA MÉDICA', 35, true)} ${pad(formatNumber(audit.medical.original.total), 12)} ${formatNumber(audit.medical.fuzzy.total)}`);
  lines.push('-'.repeat(55));
  lines.push(`${pad('TOTAL', 35, true)} ${pad(formatNumber(audit.combinedOriginal), 12)} ${formatNumber(audit.combinedFuzzy)}`);
  lines.push('');

  // Classification
  const fuzzyApplied = audit.combinedOriginal !== audit.combinedFuzzy;
  const isInsuficienteFuzzy = audit.classificationFuzzy === 'Insuficiente';
  const isInsuficienteOrig = audit.classificationOriginal === 'Insuficiente';

  if (fuzzyApplied) {
    if (isInsuficienteFuzzy) {
      lines.push(`A soma da pontuação das perícias alcança ${formatNumber(audit.combinedFuzzy)} pontos, sendo insuficiente para enquadramento nos termos da Portaria Interministerial nº 1/2014.`);
    } else {
      lines.push(`A soma da pontuação das perícias alcança ${formatNumber(audit.combinedFuzzy)} pontos dentro do método IF-BrA com aplicação do Modelo Linguístico Fuzzy, correspondendo à existência de uma "deficiência ${audit.classificationFuzzy.toLowerCase()}" (classificação conforme Portaria Interministerial nº 1/2014).`);
    }
    if (audit.classificationOriginal !== audit.classificationFuzzy) {
      lines.push('');
      if (isInsuficienteOrig) {
        lines.push(`Sem a aplicação do Modelo Fuzzy, a pontuação seria ${formatNumber(audit.combinedOriginal)} pontos, sendo insuficiente para enquadramento.`);
      } else {
        lines.push(`Sem a aplicação do Modelo Fuzzy, a pontuação seria ${formatNumber(audit.combinedOriginal)} pontos, correspondendo a "deficiência ${audit.classificationOriginal.toLowerCase()}".`);
      }
    }
  } else {
    if (isInsuficienteOrig) {
      lines.push(`A soma da pontuação das perícias alcança ${formatNumber(audit.combinedOriginal)} pontos, sendo insuficiente para enquadramento nos termos da Portaria Interministerial nº 1/2014.`);
    } else {
      lines.push(`A soma da pontuação das perícias alcança ${formatNumber(audit.combinedOriginal)} pontos, correspondendo à existência de uma "deficiência ${audit.classificationOriginal.toLowerCase()}" (classificação conforme Portaria Interministerial nº 1/2014).`);
    }
  }
  lines.push('');
  lines.push('Era o que havia a certificar.');
  lines.push('');

  return lines.join('\n');
}
