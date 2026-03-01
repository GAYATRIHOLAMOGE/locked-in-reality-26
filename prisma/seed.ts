import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding puzzles...");

    // Clear existing data
    await db.submission.deleteMany();
    await db.puzzle.deleteMany();

    const puzzles = [
        {
            name: "Caesar's Secret",
            description:
                "Every letter in this message has been shifted three positions forward in the alphabet. Decode it to find the answer.\n\n'ORFNHG LQ UHDOLWB'",
            solution: "locked in reality",
            hint: "Julius Caesar used this cipher. Shift each letter BACK by 3 positions.",
            hintCost: 10,
            points: 40,
            order: 1,
        },
        {
            name: "The Missing Number",
            description:
                "Find the next number in this sequence:\n\n1, 1, 2, 3, 5, 8, 13, 21, ___",
            solution: "34",
            hint: "Each number is the sum of the two preceding numbers.",
            hintCost: 5,
            points: 20,
            order: 2,
        },
        {
            name: "Binary Whisper",
            description:
                "Translate this binary message to ASCII text:\n\n01101011 01100101 01111001",
            solution: "key",
            hint: "Convert each 8-bit group to its decimal value, then find the ASCII character.",
            hintCost: 15,
            points: 60,
            order: 3,
        },
        {
            name: "The Riddle of Doors",
            description:
                "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. I have roads, but no cars drive there. What am I?",
            solution: "a map",
            hint: "Think about something that represents the real world without being part of it.",
            hintCost: 10,
            points: 30,
            order: 4,
        },
        {
            name: "Hex Grid",
            description:
                "Decode this hexadecimal string to find a hidden word:\n\n52 65 61 6C 69 74 79",
            solution: "reality",
            hint: "Convert each hex pair to its decimal ASCII value and read the resulting characters.",
            hintCost: 15,
            points: 60,
            order: 5,
        },
        {
            name: "The Shadow Equation",
            description:
                "Solve for X:\n\nIf LOCK = 40, and LOCK + IN = 65, and IN + REALITY = 105,\nthen REALITY = ?",
            solution: "65",
            hint: "Treat each word as a number. Set up equations: LOCK=40, IN=25, REALITY=?",
            hintCost: 20,
            points: 80,
            order: 6,
        },
    ];

    for (const puzzle of puzzles) {
        await db.puzzle.create({ data: puzzle });
        console.log(`  ✅ Created puzzle: ${puzzle.name}`);
    }

    console.log("\n✨ Seed complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
