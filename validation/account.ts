import { z } from "zod";
export const strongPassword=z.string().min(12,"Minimal 12 karakter.").max(128).regex(/[a-z]/,"Harus memuat huruf kecil.").regex(/[A-Z]/,"Harus memuat huruf besar.").regex(/[0-9]/,"Harus memuat angka.");
export const profileSchema=z.object({name:z.string().trim().min(2).max(100)});
export const passwordChangeSchema=z.object({currentPassword:z.string().min(1).max(128),newPassword:strongPassword});
export const emailChangeSchema=z.object({email:z.email().trim().toLowerCase()});
export const invitationSchema=z.object({email:z.email().trim().toLowerCase()});
export const invitationAcceptanceSchema=z.object({token:z.string().min(40).max(200),name:z.string().trim().min(2).max(100),password:strongPassword});
