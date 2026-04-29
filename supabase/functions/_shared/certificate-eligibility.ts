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
 * Usa `crypto.getRandomValues` (CSPRNG) em vez de `Math.random` para
 * eliminar o risco de colisão via gerador não-criptográfico (Bug C8).
 * O retry em colisão de constraint UNIQUE chega no FDD-004 PR 2.
 *
 * Aceita um `now` injectável para que o teste de formato seja determinístico.
 */
export const CERTIFICATE_NUMBER_PATTERN = /^CERT-\d{4}-\d{6}$/;

export function generateCertNumber(now: Date = new Date()): string {
  const year = now.getFullYear();
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const random = (arr[0] % 1_000_000).toString().padStart(6, "0");
  return `CERT-${year}-${random}`;
}
