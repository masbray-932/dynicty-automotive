export const demoBrands = [
  {id:"demo-brand-toyota",name:"Toyota",slug:"toyota"},
  {id:"demo-brand-honda",name:"Honda",slug:"honda"},
  {id:"demo-brand-suzuki",name:"Suzuki",slug:"suzuki"},
  {id:"demo-brand-daihatsu",name:"Daihatsu",slug:"daihatsu"},
];
export const demoModels = [
  ["avanza","Avanza",0],["yaris","Yaris",0],["brio","Brio",1],["hr-v","HR-V",1],
  ["ertiga","Ertiga",2],["xl7","XL7",2],["xenia","Xenia",3],["terios","Terios",3],
].map(([slug,name,brand])=>({id:`demo-model-${slug}`,name:String(name),slug:String(slug),brandId:demoBrands[Number(brand)].id}));
export const demoVehicles = Array.from({length:16},(_,index)=>{
 const model=demoModels[index%8];const id=`demo-car-${String(index+1).padStart(2,"0")}`;
 return {id,slug:id,brandId:model.brandId,modelId:model.id,condition:index%3===0?"NEW" as const:"USED" as const,variant:`Demo ${index%2===0?"G":"Sport"} ${index+1}`,year:2020+(index%7),price:String(140000000+index*17000000),transmission:index%2===0?"Automatic":"Manual",fuelType:"Bensin",color:["Putih","Merah","Abu-abu","Biru"][index%4],mileage:index%3===0?null:12000+index*3500,description:`Unit contoh ${model.name} untuk demonstrasi pencarian dan pengelolaan stok. Identitas unit, harga, jarak tempuh dan spesifikasi adalah data fiktif, bukan penawaran kendaraan nyata. Ilustrasi dibuat khusus untuk demo dan bukan foto unit. Informasi kendaraan nyata harus diverifikasi langsung dengan showroom.`,status:index===14?"DRAFT" as const:index===15?"SOLD" as const:"AVAILABLE" as const,featured:index<4};
});
export const demoVehicleImages = demoVehicles.map(car=>({id:`${car.id}-image`,carId:car.id,storageKey:`cars/${car.id}/demo-generated.png`,isPrimary:true,sortOrder:0}));
