import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks=vi.hoisted(()=>({transaction:vi.fn(),claim:vi.fn(),invitation:vi.fn(),owner:vi.fn(),existing:vi.fn(),owners:vi.fn(),createUser:vi.fn(),createMembership:vi.fn(),revokeOwners:vi.fn(),updateInvitation:vi.fn(),membershipCount:vi.fn(),deleteSessions:vi.fn(),audit:vi.fn(),createSession:vi.fn(),redirect:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
vi.mock("@/server/auth/password",()=>({hashPassword:async()=>"$2b$12$test-hash",verifyPassword:vi.fn()}));
vi.mock("@/server/auth/session",()=>({createAdminSession:mocks.createSession,requireAdmin:vi.fn()}));
vi.mock("@/db/client",()=>({db:{
  $transaction:mocks.transaction,
  adminInvitation:{updateMany:vi.fn(),create:vi.fn()},adminAuditLog:{create:vi.fn()},adminUser:{findUnique:vi.fn()},
}}));

import { dealerContentSchema } from "@/validation/dealer-content";
import { BannerCarousel } from "@/features/content/banner-carousel";
import { acceptInvitationAction } from "@/server/auth/account-actions";

const baseContent={welcomeTitle:"Dealer",welcomeBody:"Selamat datang",welcomeActive:true,welcomeHeadingDesktopPx:null,welcomeBodyDesktopPx:null,history:"",vision:"",mission:"",achievements:"",aboutSummary:"",aboutStory:"",aboutActive:false,showroomAlt:"",operatingHours:"",operatingHoursActive:false};
const hero={id:"hero",kind:"MAIN_BANNER" as const,title:"Banner",body:"",link:"",active:true,sortOrder:0,mediaUrl:"/uploads/hero.webp"};
const tx={adminInvitation:{updateMany:mocks.claim,findUnique:mocks.invitation,update:mocks.updateInvitation},adminDealerMembership:{findFirst:mocks.owner,findMany:mocks.owners,create:mocks.createMembership,updateMany:mocks.revokeOwners,count:mocks.membershipCount},adminUser:{findUnique:mocks.existing,create:mocks.createUser},adminSession:{deleteMany:mocks.deleteSessions},adminAuditLog:{create:mocks.audit}};
const form=()=>{const data=new FormData();data.set("token","A".repeat(43));data.set("name","Buyer Owner");data.set("password","BuyerPassword123!");return data;};

beforeEach(()=>{vi.resetAllMocks();mocks.transaction.mockImplementation(async(callback:(client:typeof tx)=>unknown)=>callback(tx));mocks.claim.mockResolvedValue({count:1});mocks.invitation.mockResolvedValue({id:"invite",dealerSettingsId:"dealer-a",invitedEmail:"buyer@example.com",createdById:"seller",role:"OWNER"});mocks.owner.mockResolvedValue({id:"seller-membership"});mocks.existing.mockResolvedValue(null);mocks.owners.mockResolvedValue([{adminId:"seller"}]);mocks.createUser.mockResolvedValue({id:"buyer"});mocks.createMembership.mockResolvedValue({id:"buyer-membership"});mocks.revokeOwners.mockResolvedValue({count:1});mocks.updateInvitation.mockResolvedValue({id:"invite"});mocks.membershipCount.mockResolvedValue(0);mocks.deleteSessions.mockResolvedValue({count:2});mocks.audit.mockResolvedValue({id:"audit"});mocks.createSession.mockResolvedValue(undefined);mocks.redirect.mockImplementation((path:string)=>{throw new Error(`NEXT_REDIRECT:${path}`);});});

describe("S5.2R mobile typography boundaries",()=>{
  it.each([["welcomeHeadingMobilePx",15,false],["welcomeHeadingMobilePx",16,true],["welcomeHeadingMobilePx",48,true],["welcomeHeadingMobilePx",49,false],["welcomeBodyMobilePx",15,false],["welcomeBodyMobilePx",16,true],["welcomeBodyMobilePx",22,true],["welcomeBodyMobilePx",23,false]] as const)("validates %s=%i",(field,value,valid)=>{const result=dealerContentSchema.safeParse({...baseContent,welcomeHeadingMobilePx:32,welcomeBodyMobilePx:18,[field]:value});expect(result.success).toBe(valid);});
  it("renders the exact saved mobile values",()=>{const html=renderToStaticMarkup(<BannerCarousel slides={[hero]} headline="Dealer" description="Deskripsi" welcomeTypography={{headingMobilePx:16,bodyMobilePx:22}}/>);expect(html).toContain("font-size:16px");expect(html).toContain("font-size:22px");});
  it("keeps admin constraints and database checks aligned",()=>{const editor=readFileSync(join(process.cwd(),"features/content/content-editor.tsx"),"utf8");const migration=readFileSync(join(process.cwd(),"prisma/migrations/20261119000000_s52r_mobile_typography/migration.sql"),"utf8");expect(editor).toContain('["welcomeHeadingMobilePx","Judul mobile",16,48]');expect(editor).toContain('["welcomeBodyMobilePx","Deskripsi mobile",16,22]');expect(migration).toContain('"welcomeHeadingMobilePx" BETWEEN 16 AND 48');expect(migration).toContain('"welcomeBodyMobilePx" BETWEEN 16 AND 22');});
});

describe("S5.2R atomic website handover",()=>{
  it("returns actionable password feedback before touching handover state",async()=>{const data=form();data.set("password","weak");const result=await acceptInvitationAction({message:"",errors:{}},data);expect(result).toMatchObject({status:"error",message:"Kata sandi belum memenuhi seluruh persyaratan keamanan."});expect(result.errors.password).toEqual(expect.arrayContaining(["Kata sandi minimal 12 karakter.","Tambahkan minimal satu huruf besar.","Tambahkan minimal satu angka.","Tambahkan minimal satu karakter khusus."]));expect(mocks.transaction).not.toHaveBeenCalled();});
  it("claims once, installs the buyer, revokes every old owner, and removes obsolete sessions",async()=>{await expect(acceptInvitationAction({message:"",errors:{}},form())).rejects.toThrow("NEXT_REDIRECT:/admin/account?handover=complete");expect(mocks.claim).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({acceptedAt:null,revokedAt:null,expiresAt:{gt:expect.any(Date)}})}));expect(mocks.createMembership).toHaveBeenCalledWith({data:{adminId:"buyer",dealerSettingsId:"dealer-a",role:"OWNER",status:"ACTIVE"}});expect(mocks.revokeOwners).toHaveBeenCalledWith({where:{dealerSettingsId:"dealer-a",role:"OWNER",status:"ACTIVE",adminId:{not:"buyer"}},data:{status:"REVOKED",revokedAt:expect.any(Date)}});expect(mocks.deleteSessions).toHaveBeenCalledWith({where:{adminId:"seller"}});expect(mocks.audit).toHaveBeenCalledWith({data:expect.objectContaining({dealerSettingsId:"dealer-a",action:"WEBSITE_HANDOVER_COMPLETED"})});});
  it("rejects replay or expiry before creating an account and leaves ownership unchanged",async()=>{mocks.claim.mockResolvedValue({count:0});const result=await acceptInvitationAction({message:"",errors:{}},form());expect(result).toMatchObject({status:"error",message:expect.stringContaining("tidak valid")});expect(mocks.createUser).not.toHaveBeenCalled();expect(mocks.revokeOwners).not.toHaveBeenCalled();});
  it("preserves unrelated tenant sessions while removing transferred-dealer permission",async()=>{mocks.membershipCount.mockResolvedValue(1);await expect(acceptInvitationAction({message:"",errors:{}},form())).rejects.toThrow("NEXT_REDIRECT");expect(mocks.revokeOwners).toHaveBeenCalled();expect(mocks.deleteSessions).not.toHaveBeenCalled();});
});
