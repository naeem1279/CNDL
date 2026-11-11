import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  {
    category: 'Zirconia & All-Ceramic',
    name: 'Zirconia Crown / Bridge',
    nameBn: 'Zirconia ক্রাউন / ব্রিজ',
    description: 'Monolithic & Multilayer Aidite blanks, milled on 5-axis Roland precision and finished with authentic Shofu (Japan) glaze.',
    specs: 'Monolithic & Multilayer Aidite · Roland 5-Axis',
    turnaroundDays: 3,
    warrantyYears: 10,
    basePrice: '3500',
    isActive: true,
    displayOrder: 1,
  },
  {
    category: 'Zirconia & All-Ceramic',
    name: 'Zirconia Inlay / Onlay',
    nameBn: 'Zirconia ইনলে / অনলে',
    description: 'Conservative, adhesive zirconium restorations with margin precision for posterior defects.',
    specs: 'Minimally Invasive · High Precision',
    turnaroundDays: 3,
    warrantyYears: 10,
    basePrice: '3000',
    isActive: true,
    displayOrder: 2,
  },
  {
    category: 'Zirconia & All-Ceramic',
    name: 'Zirconia Core / Repair',
    nameBn: 'Zirconia কোর / রিপেয়ার',
    description: 'Endodontic post-cores and broken-down unit rebuilds in high-strength zirconia.',
    specs: 'Post & Core Rebuild',
    turnaroundDays: 3,
    warrantyYears: 5,
    basePrice: '2500',
    isActive: true,
    displayOrder: 3,
  },
  {
    category: 'Zirconia & All-Ceramic',
    name: 'Porcelain Veneers',
    nameBn: 'Porcelain ভেনিয়ার',
    description: 'Contact-lens thin facial veneers with lifelike translucency for anterior aesthetics.',
    specs: 'Anterior Aesthetics · Ultra-Thin',
    turnaroundDays: 4,
    warrantyYears: 5,
    basePrice: '4000',
    isActive: true,
    displayOrder: 4,
  },
  {
    category: 'Zirconia & All-Ceramic',
    name: 'IPS E-Max Restorations',
    nameBn: 'IPS E-Max রেস্টোরেশন',
    description: 'Lithium disilicate crowns, veneers and inlays — maximum opalescence and enamel-like wear.',
    specs: 'IPS E-Max Lithium Disilicate · Shofu 900°C',
    turnaroundDays: 4,
    warrantyYears: 8,
    basePrice: '4500',
    isActive: true,
    displayOrder: 5,
  },
  {
    category: 'Porcelain (PFM)',
    name: 'Porcelain Crown Regular',
    nameBn: 'Porcelain ক্রাউন রেগুলার (PFM)',
    description: 'Classic porcelain-fused-to-metal crowns on precise Co-Cr copings with natural shade matching.',
    specs: 'PFM · Regular Tier · Co-Cr Coping',
    turnaroundDays: 3,
    warrantyYears: 5,
    basePrice: '1800',
    isActive: true,
    displayOrder: 6,
  },
  {
    category: 'Porcelain (PFM)',
    name: 'Porcelain Crown Special',
    nameBn: 'Porcelain ক্রাউন স্পেশাল (PFM)',
    description: 'Premium PFM tier with enhanced layering and characterization for visible zones.',
    specs: 'PFM · Special Aesthetic Tier',
    turnaroundDays: 3,
    warrantyYears: 5,
    basePrice: '2200',
    isActive: true,
    displayOrder: 7,
  },
  {
    category: 'Porcelain (PFM)',
    name: 'Porcelain Metal Bite / Facing',
    nameBn: 'Porcelain মেটাল বাইট / ফেসিং',
    description: 'Metal-based occlusal builds and aesthetic facings for functional posterior load.',
    specs: 'Occlusal Metal Bite / Facing',
    turnaroundDays: 3,
    warrantyYears: 5,
    basePrice: '2000',
    isActive: true,
    displayOrder: 8,
  },
  {
    category: 'Porcelain (PFM)',
    name: 'Inlay / Onlay & Core / Repair',
    nameBn: 'ইনলে / অনলে ও কোর রিপেয়ার (PFM)',
    description: 'Metal and porcelain inlay/onlay plus core build-ups and unit repairs on the PFM line.',
    specs: 'PFM Conservative Restorations',
    turnaroundDays: 3,
    warrantyYears: 5,
    basePrice: '1500',
    isActive: true,
    displayOrder: 9,
  },
  {
    category: 'Porcelain (PFM)',
    name: 'Golden Crown / Bridge',
    nameBn: 'গোল্ডেন ক্রাউন / ব্রিজ',
    description: 'Traditional gold-alloy crowns and bridges — proven longevity and gentle antagonism.',
    specs: 'Gold Alloy · Biocompatible',
    turnaroundDays: 4,
    warrantyYears: 10,
    basePrice: '5000',
    isActive: true,
    displayOrder: 10,
  },
  {
    category: 'Dentures & Ortho',
    name: 'Removable Partial Dentures (PD)',
    nameBn: 'রিমুভেবল পার্শিয়াল ডেনচার (PD)',
    description: 'Framework-based partial dentures with precision clasp retention and balanced occlusion.',
    specs: 'Cast / Acrylic Partial Denture',
    turnaroundDays: 4,
    warrantyYears: 3,
    basePrice: '2500',
    isActive: true,
    displayOrder: 11,
  },
  {
    category: 'Dentures & Ortho',
    name: 'Full Dentures (Heat-Cure / Self-Cure / Mesh)',
    nameBn: 'ফুল ডেনচার (Heat-Cure / Self-Cure / Mesh)',
    description: 'Complete dentures in heat-cure or self-cure acrylic with mesh reinforcement options.',
    specs: 'Complete Denture · Heat/Self Cure',
    turnaroundDays: 4,
    warrantyYears: 3,
    basePrice: '4000',
    isActive: true,
    displayOrder: 12,
  },
  {
    category: 'Dentures & Ortho',
    name: 'Flexible Partial Dentures (Valplast Style)',
    nameBn: 'ফ্লেক্সিবল পার্শিয়াল ডেনচার (Valplast Style)',
    description: 'Lightweight nylon resin partials — unbreakable flexibility with natural pink aesthetics.',
    specs: 'Flexible Nylon Resin · Valplast Style',
    turnaroundDays: 4,
    warrantyYears: 3,
    basePrice: '3500',
    isActive: true,
    displayOrder: 13,
  },
  {
    category: 'Dentures & Ortho',
    name: 'In-House Clear Aligners',
    nameBn: 'ইন-হাউজ Clear Aligners',
    description: '100% in-house digital orthodontic staging with 8K printed models in crystal-clear medical-grade PETG.',
    specs: 'Digital Ortho Staging · Phrozen 8K LCD',
    turnaroundDays: 5,
    warrantyYears: 1,
    basePrice: '15000',
    isActive: true,
    displayOrder: 14,
  },
  {
    category: 'Dentures & Ortho',
    name: 'Orthodontic Appliances & Night/Mouth Guards',
    nameBn: 'অর্থোডন্টিক অ্যাপ্লায়েন্স ও নাইট গার্ড',
    description: 'Hawley retainers, functional appliances, and soft/hard night & mouth guards.',
    specs: 'Hawley Retainers · Night Guards',
    turnaroundDays: 3,
    warrantyYears: 2,
    basePrice: '2000',
    isActive: true,
    displayOrder: 15,
  },
];

async function main() {
  const count = await prisma.service.count();
  console.log(`Current service count: ${count}`);
  if (count === 0) {
    console.log('Seeding 15 physical lab catalogue items...');
    for (const item of services) {
      await prisma.service.create({ data: item });
    }
    console.log('Seeding completed successfully!');
  } else {
    console.log('Service table already contains records. Skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
