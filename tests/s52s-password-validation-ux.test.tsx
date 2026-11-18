import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PasswordRequirements, SecurePasswordField, passwordInputType } from "@/features/auth/secure-password-field";
import { invitationAcceptanceSchema, passwordChangeSchema } from "@/validation/account";
import { passwordRequirementState, strongPasswordSchema } from "@/validation/password";

describe("S5.2S shared password policy",()=>{
  it.each([
    ["Short1!", "Kata sandi minimal 12 karakter."],
    ["lowercase123!", "Tambahkan minimal satu huruf besar."],
    ["UPPERCASE123!", "Tambahkan minimal satu huruf kecil."],
    ["NoDigitsHere!", "Tambahkan minimal satu angka."],
    ["NoSpecial123", "Tambahkan minimal satu karakter khusus."],
  ])("rejects %s with an actionable error",(password,message)=>{const result=strongPasswordSchema.safeParse(password);expect(result.success).toBe(false);if(!result.success)expect(result.error.issues.map(issue=>issue.message)).toContain(message);});
  it("accepts a password satisfying every requirement",()=>{expect(strongPasswordSchema.safeParse("BuyerPassword123!").success).toBe(true);});
  it("uses the identical policy for activation and password change",()=>{expect(invitationAcceptanceSchema.safeParse({token:"A".repeat(43),name:"Buyer",password:"NoSpecial123"}).success).toBe(false);expect(passwordChangeSchema.safeParse({currentPassword:"old",newPassword:"NoSpecial123"}).success).toBe(false);});
});

describe("S5.2S live activation feedback",()=>{
  it("reports each requirement state immediately from the current value",()=>{expect(passwordRequirementState("BuyerPassword123!").every(item=>item.met)).toBe(true);const state=passwordRequirementState("lowercase");expect(state.find(item=>item.id==="lowercase")?.met).toBe(true);expect(state.find(item=>item.id==="uppercase")?.met).toBe(false);expect(state.find(item=>item.id==="special")?.met).toBe(false);});
  it("renders non-color status symbols and accessible text for met and unmet requirements",()=>{const html=renderToStaticMarkup(<PasswordRequirements password="BuyerPassword123"/>);expect(html).toContain("✓");expect(html).toContain("○");expect(html).toContain("Terpenuhi:");expect(html).toContain("Belum terpenuhi:");expect(html).toContain("Minimal satu karakter khusus");});
  it("starts hidden and exposes an accessible visibility toggle without changing the field value contract",()=>{expect(passwordInputType(false)).toBe("password");expect(passwordInputType(true)).toBe("text");const html=renderToStaticMarkup(<SecurePasswordField label="Kata sandi baru" name="password"/>);expect(html).toContain('type="password"');expect(html).toContain('aria-label="Tampilkan kata sandi"');expect(html).toContain('aria-pressed="false"');expect(html).toContain('name="password"');expect(html).toContain('minLength="12"');expect(html).toContain("(?=.*[a-z])");});
  it("renders every actionable backend field error",()=>{const result=invitationAcceptanceSchema.safeParse({token:"A".repeat(43),name:"Buyer",password:"weak"});expect(result.success).toBe(false);if(!result.success){const errors=result.error.flatten().fieldErrors.password??[];const html=renderToStaticMarkup(<SecurePasswordField error={errors} label="Kata sandi baru" name="password"/>);expect(html).toContain('role="alert"');expect(html).toContain("Kata sandi minimal 12 karakter.");expect(html).toContain("Tambahkan minimal satu huruf besar.");expect(html).toContain("Tambahkan minimal satu angka.");expect(html).toContain("Tambahkan minimal satu karakter khusus.");}}
  );
});
