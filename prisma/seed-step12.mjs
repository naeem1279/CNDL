// Step 12 seed: dynamic blog posts + testimonials. Idempotent (upsert by slug,
// name-based check for testimonials). Safe to re-run.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const posts = [
  {
    slug: 'digital-dentistry-modern-dental-laboratories',
    title: 'The Role of Digital Dentistry in Modern Dental Laboratories',
    category: 'Zirconia & CAD/CAM',
    image: '/images/blog.jpg',
    publishedAt: new Date('2025-11-25'),
    excerpt:
      'How CAD/CAM systems, digital scanners and 5-axis milling have transformed dental laboratories — and what that means for the clinicians who depend on them.',
    content: `Modern dental laboratories no longer depend on plaster models, wax knives and hand articulation. The entire restorative workflow — from impression to insertion — has moved into a fully digital pipeline, and laboratories that embrace it deliver restorations with measurably higher precision, consistency and speed.

At the heart of this shift is the intraoral scanner. Digital impressions captured with systems such as Medit, 3Shape and iTero eliminate the distortion, tear and shrinkage associated with PVS materials. The laboratory receives an exact 3D dataset of the preparation, which directly translates into better marginal fit, improved occlusion and dramatically fewer remakes.

Design is the second pillar. With CAD software, every restoration is engineered to the patient's individual anatomy — contact points, occlusal anatomy and emergence profile are adjusted digitally before a single disc is loaded. Design libraries validated over thousands of cases mean a technician can refine a full-contour Zirconia crown in minutes, then hand the file to a 5-axis milling machine such as the Roland DGSHAPE DWX-52Di Plus.

Manufacturing is where digital dentistry truly earns its keep. Automated CAM milling produces monolithic and multilayer Zirconia restorations with repeatable accuracy that manual fabrication cannot match. Combined with modern sintering furnaces like the UP3D F20 and authentic Shofu natural glaze fired at 900°C, the final restoration achieves both the strength and the lifelike translucency clinicians expect.

Digital workflows also transform collaboration. Dentists and technicians share files in real time, preview designs before production, and resolve questions in minutes rather than days. At CNDL Global in Khilgaon, Dhaka, this connected workflow is what makes a guaranteed 3-4 working day turnaround possible for practices anywhere in Bangladesh.

Finally, quality control becomes systematic instead of subjective. Every stage — design validation, milling tolerances, sintering curves, glaze finish — is monitored digitally, so each case leaves the laboratory documented and verified.

The conclusion for clinicians is simple: a laboratory's digital capability is now a direct predictor of your clinical outcomes. Choose partners who have invested in the full digital chain, and your chairside time, remake rate and patient satisfaction will all improve.

বাংলা সারসংক্ষেপ: ডিজিটাল ডেন্টিস্ট্রি আধুনিক ডেন্টাল ল্যাবরেটরির মূল ভিত্তি। ইনট্রাওরাল স্ক্যানার, CAD ডিজাইন এবং ৫-অ্যাক্সিস Roland DGSHAPE মিলিং মেশিন ব্যবহার করে CNDL Global ঢাকায় মাত্র ৩-৪ কর্মদিবসে নির্ভুল জিরকোনিয়া ক্রাউন ও ব্রিজ তৈরি করে, যা ফিট, নান্দনিকতা ও কার্যকারিতায় উন্নতি এনে দাঁতের চিকিৎসকদের চেয়ারসাইড সময় কমায়।`,
  },
  {
    slug: 'flexible-dentures-modern-solution-patient-comfort',
    title: 'Flexible Dentures: A Modern Solution for Patient Comfort',
    category: 'Dentures',
    image: '/images/blog-2.png',
    publishedAt: new Date('2025-11-20'),
    excerpt:
      'Why flexible partial dentures are winning over patients and clinicians alike — aesthetics, comfort, and what to communicate before delivery.',
    content: `For partially edentulous patients who cannot tolerate rigid acrylic or metal frameworks, flexible dentures have become the comfort-first alternative. Made from injectable thermoplastic nylon resins, they flex with the natural movement of the oral tissues instead of fighting it.

The clinical advantages are concrete. Retention comes from intentional gingival displacement rather than bulky clasps, so the prosthesis disappears visually and feels lighter. For patients with compromised abutment teeth, the flexibility distributes functional loads more gently across the ridge.

Aesthetics are a second major driver. Because the material can be manufactured in multiple gingival shades and is translucent at the clasp areas, there are no visible metal components. In the esthetic zone this is often the difference between a prosthesis a patient wears and one that stays in a drawer.

Adjustment and repair deserve honest counseling. Flexible bases are harder to reline chairside than acrylic, and additional clasp adjustment requires burs designed for thermoplastics. Setting expectations at the delivery appointment — including a short adaptation period — dramatically improves acceptance rates.

At CNDL Global, flexible dentures are manufactured fully in-house, which keeps both the turnaround time and the remake loop tight. Combining the case with digital design where appropriate lets the technician verify clearance and path of insertion before processing.

For practices in Dhaka and across Bangladesh, flexible partials are an accessible premium option: same-week delivery, excellent initial comfort, and aesthetics that metal frameworks cannot offer.

বাংলা সারসংক্ষেপ: ফ্লেক্সিবল ডেঞ্চার একটি আধুনিক ও আরামদায়ক সমাধান, যা নাইলন-ভিত্তিক নমনীয় উপাদানে তৈরি হয়। এতে দৃশ্যমান ধাতব ক্লাস্প থাকে না, ওজন কম এবং মাড়ির সাথে সহজে খাপ খায়। CNDL Global নিজস্ব ল্যাবে দ্রুত সময়ে ফ্লেক্সিবল ডেঞ্চার তৈরি করে ঢাকা ও সারা বাংলাদেশে চিকিৎসকদের কাছে পৌঁছে দেয়।`,
  },
  {
    slug: 'key-factors-choosing-dental-lab-bangladesh',
    title: 'Key Factors Dentists Should Consider When Choosing a Dental Lab',
    category: 'Lab Partnership',
    image: '/images/blog-3.png',
    publishedAt: new Date('2025-11-10'),
    excerpt:
      'Turnaround, materials traceability, digital capability and communication — a practical checklist for evaluating any dental laboratory partnership.',
    content: `Your laboratory is a silent partner in every restorative case you deliver. Choosing well lowers your remake rate, protects your schedule and shapes how patients perceive your work. These are the factors that matter most.

First: technology, verified in person. A laboratory claiming CAD/CAM capability should be able to show you the milling machines on its floor. Five-axis mills such as the Roland DGSHAPE DWX-52Di Plus, a calibrated sintering furnace like the UP3D F20, and authentic glazing systems are the difference between marketing and manufacturing.

Second: material traceability. Ask where the Zirconia discs and E-max ingots come from and whether you receive batch documentation. Milling a multilayer disc that was stored past its shelf life, or glazing with a substitute powder, quietly compromises both strength and shade.

Third: turnaround discipline. A guaranteed 3-4 working day turnaround is only valuable if it is predictable. Ask what percentage of cases ship on time, and how the laboratory communicates when a complex case needs an extra day.

Fourth: digital case acceptance. A modern lab accepts STL and OBJ files from any open intraoral scanner, confirms receipt within minutes, and flags design questions before milling — not after.

Fifth: communication and remake policy. The best laboratories call you when a prescription is ambiguous. Look at the remake rate they are willing to disclose; a confident lab does not hide it.

Finally: proximity and logistics matter in Bangladesh. A lab that can dispatch across Dhaka daily and nationwide through reliable courier partners removes a whole category of scheduling risk.

CNDL Global in Khilgaon was built around exactly this checklist — in-house manufacturing on Japanese Roland equipment, named-brand materials, digital file intake on WhatsApp and a written turnaround commitment.

বাংলা সারসংক্ষেপ: ডেন্টাল ল্যাব নির্বাচনের সময় দেখুন — প্রযুক্তি (৫-অ্যাক্সিস মিলিং মেশিন), উপাদানের মান ও ট্রেসেবিলিটি, নিশ্চিত ডেলিভারি সময় (৩-৪ কর্মদিবস), ডিজিটাল ফাইল গ্রহণের সুবিধা এবং যোগাযোগের মান। খিলগাঁও, ঢাকায় CNDL Global এই সব মানদণ্ড পূরণ করে সারা বাংলাদেশের চিকিৎসকদের সেবা দিচ্ছে।`,
  },
  {
    slug: 'zirconia-vs-emax-choosing-right-material',
    title: 'Zirconia vs E-max: Choosing the Right Material for Your Case',
    category: 'Zirconia & CAD/CAM',
    image: '/images/blog-4.png',
    publishedAt: new Date('2025-11-05'),
    excerpt:
      'Monolithic Zirconia, multilayer Zirconia or lithium disilicate — a case-by-case decision framework for crowns, veneers and bridges.',
    content: `The Zirconia-versus-E-max question has no universal answer — it has a decision framework. The right material is a function of location, bite forces, esthetic demands and substrate.

Monolithic Zirconia is the workhorse for posterior regions. With flexural strength around 1,000-1,200 MPa and full-contour milling, it survives bruxists and long spans where layered ceramics would fail. Modern multilayer discs add a graded translucency that removes much of the older opacity criticism without surrendering strength.

High-translucency Zirconia has pushed further into the esthetic zone. For many anterior cases, a well-designed multilayer crown milled on a 5-axis system and finished with an authentic Shofu natural glaze at 900°C achieves lifelike value and translucency while retaining a large safety margin.

IPS E-max — lithium disilicate — remains the reference for veneers and thin anterior restorations. Its optical properties, particularly opalescence and fluorescence, are outstanding, and it can be adhesively bonded for conservative preparations. Where a restoration is thinner than Zirconia's recommended minimum, E-max is usually the correct answer.

Bridge span and connector dimensions matter: Zirconia tolerates longer spans and smaller connectors; E-max does not. Occlusal clearance, cementation strategy (conventional vs. adhesive) and the opacity of the prepared substrate should complete the decision.

The practical takeaway: prescribe by case, not by habit. Posterior bruxist — monolithic Zirconia. Anterior full crown on a discolored substrate — multilayer Zirconia. Minimally invasive veneer — E-max. When in doubt, send the case with clinical photos and let the laboratory's design team recommend in writing.

CNDL Global manufactures all three families in-house in Dhaka, so switching between them never costs you a second vendor relationship or a second turnaround clock.

বাংলা সারসংক্ষেপ: পেছনের দাঁত ও ব্রাক্সিজম রোগীর জন্য মনোলিথিক জিরকোনিয়া, সামনের নান্দনিক ক্রাউনের জন্য মাল্টিলেয়ার জিরকোনিয়া, আর ভিনিয়ার ও পাতলা রেস্টোরেশনের জন্য E-max সবচেয়ে উপযুক্ত। কেস অনুযায়ী উপাদান নির্বাচন করুন — CNDL Global ঢাকায় তিন ধরনের রেস্টোরেশনই ৩-৪ কর্মদিবসে তৈরি করে দেয়।`,
  },
];

const testimonials = [
  {
    doctorName: 'Dr. Arif Mahmud',
    clinicName: 'Popular Dental Care, Dhanmondi',
    location: 'Dhaka, Bangladesh',
    rating: 5,
    comment:
      'CNDL has been our primary Zirconia lab for two years. Marginal fit on monolithic posterior crowns is consistently excellent, and the 3-4 day turnaround has never let my schedule down. Their team calls before milling whenever a prescription needs clarification.',
  },
  {
    doctorName: 'Dr. Nusrat Jahan',
    clinicName: 'Lazz Dental Care, Banani',
    location: 'Dhaka, Bangladesh',
    rating: 5,
    comment:
      'The multilayer Zirconia anteriors and E-max veneers from CNDL are genuinely beautiful — shade matching and translucency are patient-approved every time. Sending intraoral scans on WhatsApp and getting design previews back the same day has changed my workflow.',
  },
  {
    doctorName: 'Dr. Sabbir Ahmed',
    clinicName: 'Dhaka Dental Center, Green Road',
    location: 'Dhaka, Bangladesh',
    rating: 4,
    comment:
      'Implant-supported restorations from CNDL arrive well-machined and need minimal chairside adjustment. Communication is professional and the remake rate is the lowest I have experienced with any lab in Dhaka.',
  },
  {
    doctorName: 'Dr. Farhana Rahman',
    clinicName: 'Rahman Dental Care, Zindabazar',
    location: 'Sylhet, Bangladesh',
    rating: 5,
    comment:
      'Even from Sylhet, cases reach me on time and perfectly packed. Their flexible dentures fit beautifully and my elderly patients adapt within days. A dependable partner for a practice outside Dhaka.',
  },
  {
    doctorName: 'Dr. Tanvir Hasan',
    clinicName: 'Aesthetika Dental, Uttara',
    location: 'Dhaka, Bangladesh',
    rating: 5,
    comment:
      'Full-arch cases demand a lab that understands both engineering and aesthetics. CNDL\'s digital design previews catch occlusal issues before milling, and the Shofu glaze finish gives every case a lifelike character out of the box.',
  },
];

async function main() {
  for (const post of posts) {
    const { slug, ...data } = post;
    await prisma.blogPost.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
    console.log(`post upserted: ${slug}`);
  }

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { doctorName: t.doctorName, clinicName: t.clinicName },
    });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
      console.log(`testimonial created: ${t.doctorName}`);
    } else {
      console.log(`testimonial exists: ${t.doctorName}`);
    }
  }

  console.log(`done: ${await prisma.blogPost.count()} posts, ${await prisma.testimonial.count()} testimonials`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
