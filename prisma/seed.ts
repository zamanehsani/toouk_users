import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // List of users to create. Add or modify entries as needed.
  const users = [
    {
      email: "admin@gmail.com",
      role: "ADMIN",
      firstName: "Admin",
      lastName: "User",
      nickName: "admin",
      middleName: "",
      avatar: "https://gravatar.com/avatar/admin",
      bio: "Administrator account",
      location: "HQ",
    },
    {
      email: "alice@example.com",
      role: "USER",
      firstName: "Alice",
      lastName: "Anderson",
      nickName: "ally",
      middleName: "M",
      avatar: "https://gravatar.com/avatar/alice",
      bio: "Enthusiastic buyer",
      location: "Berlin",
    },
    {
      email: "bob@example.com",
      role: "VENDOR",
      firstName: "Bob",
      lastName: "Builder",
      nickName: "bob",
      middleName: "",
      avatar: "https://gravatar.com/avatar/bob",
      bio: "Seller of quality goods",
      location: "London",
    },
  ];

  const results = [] as Array<any>;

  for (const u of users) {
    try {
      const upserted = await prisma.users.upsert({
        where: { email: u.email },
        update: {
          // update mutable fields if record exists
          firstName: u.firstName,
          lastName: u.lastName,
          nickName: u.nickName,
          middleName: u.middleName,
          avatar: u.avatar,
          bio: u.bio,
          location: u.location,
          role: u.role,
          isActive: true,
        },
        create: {
          email: u.email,
          role: u.role,
          firstName: u.firstName,
          lastName: u.lastName,
          nickName: u.nickName,
          middleName: u.middleName,
          avatar: u.avatar,
          bio: u.bio,
          location: u.location,
          isActive: true,
        },
      });

      console.log(`Upserted user: ${upserted.email}`);
      results.push(upserted);
    } catch (err) {
      console.error(`Failed to upsert ${u.email}:`, err);
    }
  }

  console.log(`Seed complete. ${results.length} users processed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });