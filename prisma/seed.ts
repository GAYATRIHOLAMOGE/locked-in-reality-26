import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Clear existing data
    await prisma.submission.deleteMany();
    await prisma.team.deleteMany();
    await prisma.question.deleteMany();
    await prisma.puzzle.deleteMany();
    await prisma.gameSettings.deleteMany();

    // Create Game Settings
    const now = new Date();

    // Helper to set time for today
    const setTime = (h: number, m: number) => {
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d;
    };

    await prisma.gameSettings.create({
        data: {
            id: "config",
            round1Start: setTime(9, 30),
            round1End: setTime(10, 30),
            round2Start: setTime(11, 0),
            round2End: setTime(13, 0),
        }
    });

    // Create Questions with Options
    // Create Questions with Options
    const q1 = await prisma.question.create({
        data: {
            id: "q1-l1",
            content: "What is the capital of France?",
            level: 1,
            points: 10,
            options: {
                create: [
                    { content: "London", isCorrect: false },
                    { content: "Berlin", isCorrect: false },
                    { content: "Paris", isCorrect: true },
                    { content: "Madrid", isCorrect: false },
                ]
            }
        },
    });

    const q2 = await prisma.question.create({
        data: {
            id: "q2-l1",
            content: "What is 2 + 2?",
            level: 1,
            points: 10,
            options: {
                create: [
                    { content: "3", isCorrect: false },
                    { content: "4", isCorrect: true },
                    { content: "5", isCorrect: false },
                    { content: "22", isCorrect: false },
                ]
            }
        },
    });

    const q3 = await prisma.question.create({
        data: {
            id: "q3-l2",
            content: "Which language runs in the browser?",
            level: 2,
            points: 20,
            options: {
                create: [
                    { content: "Java", isCorrect: false },
                    { content: "C++", isCorrect: false },
                    { content: "Python", isCorrect: false },
                    { content: "JavaScript", isCorrect: true },
                ]
            }
        }
    });

    const q4 = await prisma.question.create({
        data: {
            id: "q4-l3",
            content: "What does HTML stand for?",
            level: 3,
            points: 30,
            options: {
                create: [
                    { content: "Hyper Text Preprocessor", isCorrect: false },
                    { content: "Hyper Text Markup Language", isCorrect: true },
                    { content: "Hyper Tool Multi Language", isCorrect: false },
                    { content: "Home Tool Markup Language", isCorrect: false },
                ]
            }
        }
    });


    // Create Puzzles
    await prisma.puzzle.createMany({
        data: [
            {
                id: "puz-1",
                name: "The Cipher",
                description: "Decrypt the following message: ...",
                solution: "secret",
                points: 50
            },
            {
                id: "puz-2",
                name: "Image Hunt",
                description: "Find the hidden key in this image...",
                solution: "key123",
                points: 50
            },
            {
                id: "puz-3",
                name: "Logic Grid",
                description: "Who lives in the red house?",
                solution: "The Englishman",
                points: 50
            },
            {
                id: "puz-4",
                name: "Final Boss",
                description: "Combine all clues...",
                solution: "victory",
                points: 100
            }
        ]
    });

    console.log("Seeding complete.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
