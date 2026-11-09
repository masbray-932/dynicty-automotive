import sharp from "sharp";
import { demoBrands, demoModels, demoVehicles, demoVehicleImages } from "./demo-inventory";
import { demoArticles } from "./demo-content";
import { validateImageUpload } from "../validation/upload";

// Original geometric illustrations only. No manufacturer marks, photos,
// external resources, or customer assets are incorporated.
export async function generatedDemoPng(title: string, color = "#C8102E") {
 const escape=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="700"><rect width="1400" height="700" fill="#F6F6F6"/><rect x="40" y="40" width="1320" height="620" rx="30" fill="#171717"/><text x="90" y="125" fill="white" font-family="sans-serif" font-size="38">DYNICTY AUTO DEMO</text><text x="90" y="195" fill="white" font-family="sans-serif" font-size="28">${escape(title)}</text><path d="M220 455 L300 340 L820 340 L970 430 L1150 455 L1150 530 L200 530 L200 475 Z" fill="${color}"/><path d="M350 360 L480 360 L480 425 L310 425 Z M505 360 L790 360 L900 425 L505 425 Z" fill="#D9E7EF"/><circle cx="400" cy="520" r="62" fill="#080808"/><circle cx="400" cy="520" r="30" fill="#A7A7A7"/><circle cx="1000" cy="520" r="62" fill="#080808"/><circle cx="1000" cy="520" r="30" fill="#A7A7A7"/><text x="90" y="625" fill="white" font-family="sans-serif" font-size="27">DEMO FIKTIF - ILUSTRASI, BUKAN FOTO UNIT / PENAWARAN</text></svg>`;
 const bytes=await sharp(Buffer.from(svg)).png().toBuffer();
 const checked=await validateImageUpload(new File([new Uint8Array(bytes)],"demo.png",{type:"image/png"}));
 if(!checked.success)throw new Error("Generated demo raster failed upload validation.");return bytes;
}
export async function demoMediaAssets() {
 const assets:Array<{key:string;bytes:Buffer}>=[];
 for(const [index,image] of demoVehicleImages.entries()){
  const car=demoVehicles[index];const model=demoModels.find(row=>row.id===car.modelId)!;const brand=demoBrands.find(row=>row.id===car.brandId)!;
  assets.push({key:image.storageKey,bytes:await generatedDemoPng(`${brand.name} ${model.name} - data contoh ${index+1}`,["#C8102E","#24558A","#8C8C8C","#AC7D2B"][index%4])});
 }
 for(const [kind,title] of [["main_banner","Selamat datang - showroom demonstrasi"],["promo_banner","PROMO DEMO - BUKAN PENAWARAN KOMERSIAL"],["leasing_partner","AREA DEMO LEASING - TIDAK ADA KEMITRAAN"],["showroom","Ilustrasi profil showroom fiktif"]])assets.push({key:`dealers/default/content/${kind}/demo-presentation-v2.png`,bytes:await generatedDemoPng(title)});
 for(const article of demoArticles)assets.push({key:`dealers/default/editorial/article/${article.id}.png`,bytes:await generatedDemoPng("Artikel otomotif - konten edukasi demo")});
 return assets;
}
