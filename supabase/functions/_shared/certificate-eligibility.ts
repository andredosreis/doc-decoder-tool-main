/**
 * Lógica pura de elegibilidade para emissão de certificado.
 *
 * Estado actual (v0): threshold 100% (módulos com `completed=true`).
 * Estado alvo (FDD-004): threshold 90%, lido da view canónica
 * `v_user_product_progress` em vez de calcular inline.
 *
 * Esta função preserva o cálculo de v0 (módulos completed / total) e expõe
 * o threshold como constante exportada para que a transição de 100→90 seja
 * uma alteração isolada num único sítio. Testes asseguram comportamento de
 * boundary.
 */

export const CERTIFICATE_THRESHOLD_PERCENTAGE = 100;

export type EligibilityReason =
  | "PRODUCT_HAS_NO_MODULES"
  | "PROGRESS_BELOW_THRESHOLD";

export interface CertificateEligibility {
  eligible: boolean;
  reason?: EligibilityReason;
  completionPercentage: number;
}

export function checkCertificateEligibility(
  totalModules: number,
  completedModulesCount: number,
  threshold: number = CERTIFICATE_THRESHOLD_PERCENTAGE,
): CertificateEligibility {
  if (totalModules <= 0) {
    return {
      eligible: false,
      reason: "PRODUCT_HAS_NO_MODULES",
      completionPercentage: 0,
    };
  }

  const completionPercentage =
    (Math.max(0, completedModulesCount) / totalModules) * 100;

  if (completionPercentage < threshold) {
    return {
      eligible: false,
      reason: "PROGRESS_BELOW_THRESHOLD",
      completionPercentage,
    };
  }

  return { eligible: true, completionPercentage };
}

/**
 * Gera número de certificado no formato `CERT-YYYY-XXXXXX`.
 *
 * Estado actual (v0): `Math.random()` com 6 dígitos numéricos.
 * Estado alvo (FDD-004): `crypto.getRandomValues` + retry em colisão na
 * constraint UNIQUE de `certificate_number` (Bug C8).
 *
 * Esta versão preserva o comportamento de v0 e aceita um `now` injectável
 * para que o teste de formato seja determinístico no campo do ano.
 */
export const CERTIFICATE_NUMBER_PATTERN = /^CERT-\d{4}-\d{6}$/;

export function generateCertNumber(now: Date = new Date()): string {
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `CERT-${year}-${random}`;
}
