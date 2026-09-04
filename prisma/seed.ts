import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Seed: USERS AND THE MAP ONLY.
 *
 * There is deliberately no inventory here. Sites and assets are created through
 * the management editor, which is the thing that has to work — seeding them
 * would hide a broken editor behind data that arrived another way.
 *
 * Re-runnable: everything upserts on a natural key, so running it twice does
 * not duplicate a user or a map.
 */

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Run `neon env pull` first.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** The map backdrop that ships in /public. Sites are placed on it by clicking. */
const MAP = {
  name: "Island city map",
  blobUrl: "/cityMap.webp",
  imageWidth: 3300,
  imageHeight: 3300,
};

const CLIENTS = [
  {
    key: "northshore",
    name: "Northshore Retail Group Ltd",
    tradingName: "Northshore Retail",
    contactName: "Jana Reid",
    contactEmail: "jana.reid@northshore.example",
    contactPhone: "01481 700 118",
    address: "12 Harbour Parade, St Peter Port",
  },
  {
    key: "bluerock",
    name: "Blue Rock Energy Ltd",
    tradingName: "Blue Rock Energy",
    contactName: "Tom Vaudin",
    contactEmail: "tom.vaudin@bluerock.example",
    contactPhone: "01481 700 204",
    address: "Unit 6, Braye Road Industrial Estate",
  },
  {
    key: "harbour",
    name: "Harbour Foods Ltd",
    tradingName: "Harbour Foods",
    contactName: "Marie Le Page",
    contactEmail: "marie.lepage@harbourfoods.example",
    contactPhone: "01481 700 355",
    address: "The Bridge, St Sampson",
  },
  {
    key: "stonefield",
    name: "Stone & Field Property LLP",
    tradingName: "Stone & Field",
    contactName: "Alec Stone",
    contactEmail: "alec.stone@stoneandfield.example",
    contactPhone: "01481 700 462",
    address: "3 Smith Street, St Peter Port",
  },
] as const;

type ClientKey = (typeof CLIENTS)[number]["key"];

const USERS: {
  email: string;
  name: string;
  role: "ADMIN" | "FITTER" | "CLIENT";
  phone?: string;
  client?: ClientKey;
}[] = [
  // Agency staff
  { email: "elena.morris@islandmedia.example", name: "Elena Morris", role: "ADMIN", phone: "01481 700 001" },
  { email: "raj.kumar@islandmedia.example", name: "Raj Kumar", role: "ADMIN", phone: "01481 700 002" },

  // Field crew
  { email: "jon.mauger@islandmedia.example", name: "Jon Mauger", role: "FITTER", phone: "07781 100 441" },
  { email: "sara.duquemin@islandmedia.example", name: "Sara Duquemin", role: "FITTER", phone: "07781 100 442" },

  // Advertisers. Jana and Priya share Northshore, so shared tenancy is
  // demonstrable: one client's data, two people who can both see it.
  { email: "jana.reid@northshore.example", name: "Jana Reid", role: "CLIENT", client: "northshore" },
  { email: "priya.shah@northshore.example", name: "Priya Shah", role: "CLIENT", client: "northshore" },
  { email: "tom.vaudin@bluerock.example", name: "Tom Vaudin", role: "CLIENT", client: "bluerock" },
  { email: "marie.lepage@harbourfoods.example", name: "Marie Le Page", role: "CLIENT", client: "harbour" },
  { email: "alec.stone@stoneandfield.example", name: "Alec Stone", role: "CLIENT", client: "stonefield" },
];

async function main() {
  const clientIds = new Map<ClientKey, string>();

  for (const { key, ...data } of CLIENTS) {
    // Client has no unique column other than id, so find-then-create on the
    // legal name keeps the seed re-runnable.
    const existing = await prisma.client.findFirst({ where: { name: data.name } });
    const client = existing
      ? await prisma.client.update({ where: { id: existing.id }, data })
      : await prisma.client.create({ data });
    clientIds.set(key, client.id);
  }

  for (const { client, ...user } of USERS) {
    const clientId = client ? clientIds.get(client)! : null;
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, clientId },
      create: { ...user, clientId },
    });
  }

  const existingMap = await prisma.mapCanvas.findFirst({
    where: { blobUrl: MAP.blobUrl },
  });
  if (existingMap) {
    await prisma.mapCanvas.update({
      where: { id: existingMap.id },
      data: { ...MAP, isDefault: true },
    });
  } else {
    await prisma.mapCanvas.create({ data: { ...MAP, isDefault: true } });
  }

  const [admins, fitters, clients, maps] = await Promise.all([
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "FITTER" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.mapCanvas.count(),
  ]);

  console.log(
    `Seeded ${admins} admin, ${fitters} fitter and ${clients} client users ` +
      `across ${CLIENTS.length} clients, plus ${maps} map canvas. No inventory ` +
      `— build that in /management/map.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
