import { prisma } from "../src/lib/db";

async function main() {
  const constraints = await prisma.$queryRaw<{ conname: string; contype: string }[]>`
    SELECT conname, contype::text FROM pg_constraint
    WHERE conrelid IN ('"ContractLine"'::regclass, '"BookingRequestItem"'::regclass)
      AND contype IN ('c', 'x')
    ORDER BY conname`;
  const triggers = await prisma.$queryRaw<{ tgname: string }[]>`
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = '"ContractLine"'::regclass AND NOT tgisinternal`;
  const routines = await prisma.$queryRaw<{ proname: string }[]>`
    SELECT proname FROM pg_proc
    WHERE proname IN ('check_digital_slot_capacity', 'release_expired_holds')
    ORDER BY proname`;
  const ext = await prisma.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension WHERE extname = 'btree_gist'`;

  console.log("extension :", ext.map((e) => e.extname));
  console.log("constraints:");
  for (const c of constraints) console.log(`  [${c.contype}] ${c.conname}`);
  console.log("triggers  :", triggers.map((t) => t.tgname));
  console.log("functions :", routines.map((r) => r.proname));
}

main().finally(() => prisma.$disconnect());
