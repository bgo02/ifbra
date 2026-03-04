import {
  ITEMS, DOMAINS, DISABILITY_CONFIG,
  DisabilityType, ScoreOrigin,
  ScoreDistribution, ClassificationRanges, DEFAULT_RANGES,
  DisabilityFlags, DomainAuditEntry, DisabilityAuditEntry, AuditTrail,
} from './ifbra-types';

export function getItemsByDomain(domainId: number) {
  return ITEMS.filter(item => item.domainId === domainId);
}

export function getDomainName(domainId: number): string {
  return DOMAINS.find(d => d.id === domainId)?.name ?? `Domínio ${domainId}`;
}

export function calculateScoreDistribution(scores: Record<string, number>): ScoreDistribution {
  let count25 = 0, count50 = 0, count75 = 0, count100 = 0;
  for (const item of ITEMS) {
    const s = scores[item.id];
    if (s === 25) count25++;
    else if (s === 50) count50++;
    else if (s === 75) count75++;
    else if (s === 100) count100++;
  }
  return {
    count25, count50, count75, count100,
    points25: count25 * 25, points50: count50 * 50,
    points75: count75 * 75, points100: count100 * 100,
    total: count25 * 25 + count50 * 50 + count75 * 75 + count100 * 100,
  };
}

export function calculateDomainTotal(scores: Record<string, number>, domainId: number): number {
  return getItemsByDomain(domainId).reduce((sum, item) => sum + (scores[item.id] || 0), 0);
}

export function checkScoreCondition(scores: Record<string, number>, sensitiveDomains: number[]): boolean {
  for (const domainId of sensitiveDomains) {
    const domainItems = getItemsByDomain(domainId);
    const domainScores = domainItems.map(item => scores[item.id]).filter(s => s !== undefined);
    if (domainScores.length === 0) continue;
    const has25or50 = domainScores.some(s => s === 25 || s === 50);
    const all75 = domainScores.length > 0 && domainScores.every(s => s === 75);
    if (has25or50 || all75) return true;
  }
  return false;
}

export function applyFuzzy(
  socialScores: Record<string, number>,
  medicalScores: Record<string, number>,
  selectedDisabilities: DisabilityType[],
  disabilityFlags: Record<DisabilityType, DisabilityFlags>,
): {
  socialFuzzy: Record<string, number>;
  medicalFuzzy: Record<string, number>;
  auditEntries: DisabilityAuditEntry[];
} {
  const socialFuzzy = { ...socialScores };
  const medicalFuzzy = { ...medicalScores };
  const auditEntries: DisabilityAuditEntry[] = [];
  const socialProposals: Record<string, number[]> = {};
  const medicalProposals: Record<string, number[]> = {};

  for (const disability of selectedDisabilities) {
    const config = DISABILITY_CONFIG[disability];
    const flags = disabilityFlags[disability] || { emblematic: false, auxilio: false };
    const socialScoreCondition = checkScoreCondition(socialScores, config.sensitiveDomains);
    const medicalScoreCondition = checkScoreCondition(medicalScores, config.sensitiveDomains);
    const socialFired = socialScoreCondition || flags.emblematic || flags.auxilio;
    const medicalFired = medicalScoreCondition || flags.emblematic || flags.auxilio;

    const processDomains = (
      origScores: Record<string, number>,
      proposals: Record<string, number[]>,
      fired: boolean
    ): DomainAuditEntry[] => {
      const domainAudit: DomainAuditEntry[] = [];
      if (!fired) return domainAudit;
      for (const domainId of config.sensitiveDomains) {
        const domainItems = getItemsByDomain(domainId);
        const minScore = Math.min(...domainItems.map(item => origScores[item.id]));
        const changes: Array<{ itemId: string; before: number; after: number }> = [];
        for (const item of domainItems) {
          if (!proposals[item.id]) proposals[item.id] = [origScores[item.id]];
          proposals[item.id].push(minScore);
          if (origScores[item.id] !== minScore) {
            changes.push({ itemId: item.id, before: origScores[item.id], after: minScore });
          }
        }
        domainAudit.push({ domainId, domainName: getDomainName(domainId), minScore, itemsChanged: changes });
      }
      return domainAudit;
    };

    const socialDomainAudit = processDomains(socialScores, socialProposals, socialFired);
    const medicalDomainAudit = processDomains(medicalScores, medicalProposals, medicalFired);

    auditEntries.push({
      disability,
      social: { scoreConditionDetected: socialScoreCondition, emblematic: flags.emblematic, auxilio: flags.auxilio, fired: socialFired, domainsAffected: socialDomainAudit },
      medical: { scoreConditionDetected: medicalScoreCondition, emblematic: flags.emblematic, auxilio: flags.auxilio, fired: medicalFired, domainsAffected: medicalDomainAudit },
    });
  }

  for (const itemId of Object.keys(socialProposals)) {
    socialFuzzy[itemId] = Math.min(...socialProposals[itemId]);
  }
  for (const itemId of Object.keys(medicalProposals)) {
    medicalFuzzy[itemId] = Math.min(...medicalProposals[itemId]);
  }

  return { socialFuzzy, medicalFuzzy, auditEntries };
}

export function classify(total: number, ranges: ClassificationRanges = DEFAULT_RANGES): string {
  if (total <= ranges.grave.max) return 'Grave';
  if (total <= ranges.moderada.max) return 'Moderada';
  if (total <= ranges.leve.max) return 'Leve';
  return 'Insuficiente';
}

export function buildAuditTrail(
  socialScores: Record<string, number>,
  medicalScores: Record<string, number>,
  socialFuzzy: Record<string, number>,
  medicalFuzzy: Record<string, number>,
  auditEntries: DisabilityAuditEntry[],
  socialOrigins: Record<string, ScoreOrigin>,
  medicalOrigins: Record<string, ScoreOrigin>,
  ranges: ClassificationRanges,
): AuditTrail {
  const socialOrigDist = calculateScoreDistribution(socialScores);
  const socialFuzzyDist = calculateScoreDistribution(socialFuzzy);
  const medicalOrigDist = calculateScoreDistribution(medicalScores);
  const medicalFuzzyDist = calculateScoreDistribution(medicalFuzzy);
  const domainTotalsSocial: Record<number, { original: number; fuzzy: number }> = {};
  const domainTotalsMedical: Record<number, { original: number; fuzzy: number }> = {};
  for (const domain of DOMAINS) {
    domainTotalsSocial[domain.id] = { original: calculateDomainTotal(socialScores, domain.id), fuzzy: calculateDomainTotal(socialFuzzy, domain.id) };
    domainTotalsMedical[domain.id] = { original: calculateDomainTotal(medicalScores, domain.id), fuzzy: calculateDomainTotal(medicalFuzzy, domain.id) };
  }
  const combinedOrig = socialOrigDist.total + medicalOrigDist.total;
  const combinedFuzzy = socialFuzzyDist.total + medicalFuzzyDist.total;
  const itemOrigins: Record<string, { social: ScoreOrigin; medical: ScoreOrigin }> = {};
  for (const item of ITEMS) {
    itemOrigins[item.id] = { social: socialOrigins[item.id] || 'manual', medical: medicalOrigins[item.id] || 'manual' };
  }
  return {
    disabilities: auditEntries,
    social: { original: socialOrigDist, fuzzy: socialFuzzyDist, domainTotals: domainTotalsSocial },
    medical: { original: medicalOrigDist, fuzzy: medicalFuzzyDist, domainTotals: domainTotalsMedical },
    combinedOriginal: combinedOrig, combinedFuzzy,
    classificationOriginal: classify(combinedOrig, ranges),
    classificationFuzzy: classify(combinedFuzzy, ranges),
    itemOrigins,
  };
}

export function validateScores(scores: Record<string, number>): { valid: boolean; missing: string[]; invalid: string[] } {
  const missing: string[] = [];
  const invalid: string[] = [];
  const validValues = [25, 50, 75, 100];
  for (const item of ITEMS) {
    if (scores[item.id] === undefined || scores[item.id] === null) {
      missing.push(item.id);
    } else if (!validValues.includes(scores[item.id])) {
      invalid.push(item.id);
    }
  }
  return { valid: missing.length === 0 && invalid.length === 0, missing, invalid };
}
